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
