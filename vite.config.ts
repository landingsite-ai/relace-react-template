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
  // SSR optimizations for faster builds
  ssr: {
    // Don't externalize these - bundle them for faster SSR
    noExternal: ["class-variance-authority", "clsx", "tailwind-merge"],
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
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching and smaller initial load
        manualChunks: {
          // React core in its own chunk (rarely changes)
          react: ["react", "react-dom"],
          // UI library chunks
          radix: [
            "@radix-ui/react-accordion",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-label",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-slot",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
          ],
        },
      },
    },
    // CSS code splitting
    cssCodeSplit: true,
  },
});
