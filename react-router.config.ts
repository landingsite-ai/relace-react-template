import type { Config } from "@react-router/dev/config";

export default {
  // Dev: SPA mode (no SSR) to avoid hydration issues from AI-generated code
  // Build: SSR enabled for static prerendering
  ssr: process.env.NODE_ENV === "production",

  // Pre-render all routes to static HTML — PRODUCTION ONLY.
  // A defined `prerender` forces React Router OUT of SPA mode in dev
  // (isSpaModeEnabled = ssr===false && prerender==null|false). That makes the
  // dev server build the SSR `virtual:react-router/server-build` graph and load
  // every route module. Under Vite 8 that SSR load path does not rewrite the
  // root-relative route URL (`/app/routes/X.tsx`) to the project root, so Vite
  // readFiles it from the filesystem root and throws the misleading
  // "Failed to load url ... in virtual:react-router/server-build. Does the file
  // exist?" — even though the file is valid. Gating to production keeps dev in
  // true SPA mode so those SSR route imports are never emitted.
  prerender:
    process.env.NODE_ENV === "production"
      ? async ({ getStaticPaths }) => getStaticPaths()
      : false,

  // Use "initial" route discovery for static prerendering.
  // Default "lazy" mode fetches /__manifest at runtime for client-side navigation,
  // which doesn't exist on static hosting. "initial" falls back to full page
  // navigations for routes not in the initial HTML, loading the prerendered page.
  routeDiscovery: { mode: "initial" },
} satisfies Config;
