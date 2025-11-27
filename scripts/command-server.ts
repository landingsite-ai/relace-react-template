/**
 * Command Server
 *
 * Runs inside the container alongside the Vite dev server.
 * Handles command execution, git sync, and health checks.
 *
 * Authentication is handled by the preview worker before requests reach here,
 * but we also validate the X-Container-Token header as an extra layer.
 *
 * Endpoints:
 * - POST /exec - Execute a command
 * - POST /sync - Git pull and restart Vite HMR
 * - GET /health - Health check
 */

import { spawn } from 'child_process'
import http from 'http'

const PORT = parseInt(process.env.COMMAND_SERVER_PORT || '3001', 10)
const CONTAINER_TOKEN = process.env.CONTAINER_TOKEN || ''
const VITE_PORT = parseInt(process.env.VITE_PORT || '5173', 10)

/**
 * Validate the container token (extra security layer)
 * The preview worker already validates user access, but this prevents
 * direct access to the container bypassing the worker.
 */
function validateToken(req: http.IncomingMessage): boolean {
  // If no container token is set, skip validation (dev mode)
  if (!CONTAINER_TOKEN) {
    return true
  }

  const token = req.headers['x-container-token']
  return token === CONTAINER_TOKEN
}

/**
 * Execute a command and stream output
 */
async function executeCommand(
  command: string,
  cwd: string = '/app'
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn('sh', ['-c', command], {
      cwd,
      env: { ...process.env, PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin' },
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      resolve({
        exitCode: code ?? 0,
        stdout,
        stderr,
      })
    })

    proc.on('error', (error) => {
      resolve({
        exitCode: 1,
        stdout: '',
        stderr: error.message,
      })
    })

    // Timeout after 60 seconds
    setTimeout(() => {
      proc.kill('SIGTERM')
      resolve({
        exitCode: 124,
        stdout,
        stderr: stderr + '\nCommand timed out after 60 seconds',
      })
    }, 60000)
  })
}

/**
 * Git pull and notify Vite of changes
 */
async function syncRepo(): Promise<string> {
  // Pull latest changes
  const pullResult = await executeCommand('git pull --rebase', '/app')
  if (pullResult.exitCode !== 0) {
    throw new Error(`Git pull failed: ${pullResult.stderr}`)
  }

  // Vite's HMR will automatically pick up file changes
  // No need to restart the server

  return `Sync complete: ${pullResult.stdout.trim()}`
}

/**
 * Parse request body as JSON
 */
async function parseBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        reject(new Error('Invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

/**
 * Send JSON response
 */
function sendJson(
  res: http.ServerResponse,
  status: number,
  data: unknown
): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

/**
 * Request handler
 */
async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`)

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Container-Token')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // Validate token (except for health check which needs to work for monitoring)
  if (url.pathname !== '/health' && !validateToken(req)) {
    sendJson(res, 401, { error: 'Unauthorized' })
    return
  }

  try {
    // GET /health - Health check
    if (req.method === 'GET' && url.pathname === '/health') {
      // Check if Vite is running
      try {
        const viteCheck = await fetch(`http://localhost:${VITE_PORT}`)
        sendJson(res, 200, {
          healthy: true,
          vite: viteCheck.ok,
          timestamp: Date.now(),
        })
      } catch {
        sendJson(res, 200, {
          healthy: true,
          vite: false,
          timestamp: Date.now(),
        })
      }
      return
    }

    // POST /exec - Execute command
    if (req.method === 'POST' && url.pathname === '/exec') {
      const body = (await parseBody(req)) as { command?: string; cwd?: string }

      if (!body.command) {
        sendJson(res, 400, { error: 'Missing command' })
        return
      }

      const result = await executeCommand(body.command, body.cwd || '/app')
      sendJson(res, 200, result)
      return
    }

    // POST /sync - Git pull and sync
    if (req.method === 'POST' && url.pathname === '/sync') {
      const message = await syncRepo()
      sendJson(res, 200, { success: true, message })
      return
    }

    // 404 for unknown routes
    sendJson(res, 404, { error: 'Not found' })
  } catch (error) {
    console.error('Command server error:', error)
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Internal error',
    })
  }
}

// Start server
const server = http.createServer(handleRequest)
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Command server listening on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down command server...')
  server.close(() => {
    process.exit(0)
  })
})

