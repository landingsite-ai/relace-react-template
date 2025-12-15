import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    // Tailwind v4 Vite plugin (uses Oxide engine + Lightning CSS)
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    // Allow any host (needed for Cloudflare Containers proxy)
    allowedHosts: true,
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    // Include commonly used deps for faster dev startup
    include: [
      "react",
      "react-dom",
      "react-router",
      "clsx",
      "tailwind-merge",
      "class-variance-authority",
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
