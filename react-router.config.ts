import type { Config } from "@react-router/dev/config";

export default {
  // Enable SSG pre-rendering for all static routes
  ssr: true,

  // Pre-render all routes at build time
  // This generates static HTML files for each route
  async prerender({ getStaticPaths }) {
    // Get all statically-defined routes from routes.ts
    const staticPaths = getStaticPaths();

    // Return all paths to pre-render
    // Add any dynamic paths here if needed in the future
    return staticPaths;
  },
} satisfies Config;
