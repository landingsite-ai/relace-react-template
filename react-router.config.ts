import type { Config } from "@react-router/dev/config";

export default {
  // Dev: SPA mode (no SSR) to avoid hydration issues from AI-generated code
  // Build: SSR enabled for static prerendering
  ssr: process.env.NODE_ENV === "production",

  // Pre-render all routes at build time to static HTML
  async prerender({ getStaticPaths }) {
    return getStaticPaths();
  },

  // Use "initial" route discovery for static prerendering.
  // Default "lazy" mode fetches /__manifest at runtime for client-side navigation,
  // which doesn't exist on static hosting. "initial" falls back to full page
  // navigations for routes not in the initial HTML, loading the prerendered page.
  routeDiscovery: { mode: "initial" },
} satisfies Config;
