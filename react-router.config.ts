import type { Config } from "@react-router/dev/config";

export default {
  // Dev: SPA mode (no SSR) to avoid hydration issues from AI-generated code
  // Build: SSR enabled for static prerendering
  ssr: process.env.NODE_ENV === "production",

  // Pre-render all routes at build time to static HTML
  async prerender({ getStaticPaths }) {
    return getStaticPaths();
  },
} satisfies Config;
