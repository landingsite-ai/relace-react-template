import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, type PluginOption } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

/**
 * Force a full page reload when route structure changes (new routes added).
 *
 * React Router's Vite plugin handles route config changes via HMR by
 * invalidating virtual manifest modules, but this is unreliable for NEW route
 * additions — the new route file may not be in Vite's module graph yet when
 * the manifest is regenerated, and the SPA-mode client may not re-match the
 * current URL against the updated route tree.
 *
 * A full reload is fast in dev and guarantees the user sees new pages
 * immediately. Changes are debounced so rapid file writes (e.g. AI creating
 * a route file + updating routes.ts) coalesce into a single reload.
 */
function reloadOnRouteChanges(): PluginOption {
  let reloadTimer: ReturnType<typeof setTimeout> | null = null;

  const scheduleReload = (server: { hot: { send: (msg: unknown) => void } }) => {
    if (reloadTimer) clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => {
      server.hot.send({ type: "full-reload" });
      reloadTimer = null;
    }, 500);
  };

  return {
    name: "reload-on-route-changes",

    configureServer(server) {
      // New file added to routes/ → schedule reload
      server.watcher.on("add", (file) => {
        if (file.includes("/app/routes/")) {
          scheduleReload(server);
        }
      });
    },

    handleHotUpdate({ file, server }) {
      // routes.ts config changed → schedule reload
      if (file.endsWith("/app/routes.ts")) {
        scheduleReload(server);
      }
    },
  };
}

export default defineConfig({
  plugins: [
    // Tailwind v4 Vite plugin (uses Oxide engine + Lightning CSS)
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    reloadOnRouteChanges(),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    // Allow any host (needed for Cloudflare Containers proxy)
    allowedHosts: true,
    // Disable error overlay to prevent showing temporary errors while agent is building
    // Errors are still logged to browser console for debugging
    hmr: {
      overlay: false,
    },
  },
  // Optimize dependency pre-bundling for fast dev startup
  optimizeDeps: {
    // Don't wait for full import crawl before serving - makes server available faster
    // while deps are bundled in the background
    holdUntilCrawlEnd: false,
    // Pre-include all commonly used deps so Vite never re-optimizes mid-session.
    // Without this, when AI writes new components with new imports, Vite discovers
    // the new dep and triggers a full dep re-optimization which deletes the old
    // .vite/deps/ cache and causes 504s on all dep requests until rebuild completes.
    include: [
      "react",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom",
      "react-dom/client",
      "react-router",
      "@radix-ui/react-accordion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-navigation-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-slot",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
      "lucide-react",
      "embla-carousel-react",
      "zod",
    ],
  },
  build: {
    // Target modern browsers only - reduces polyfills and bundle size
    target: "es2022",
    // Disable sourcemaps in production for faster builds
    sourcemap: false,
    // Use esbuild for minification (faster than terser)
    minify: "esbuild",
    // Disable gzip size reporting (saves ~1-2s)
    reportCompressedSize: false,
    // Note: Don't use manualChunks - React Router v7 externalizes react/react-dom
    // for SSR which conflicts with manual chunking
    cssCodeSplit: true,
  },
});
