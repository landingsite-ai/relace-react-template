/**
 * Catch-All Route
 *
 * Registered last in app/routes.ts for every build. Three behaviours, in order:
 *
 * 1. The site has a custom not-found page (app/routes/404.tsx, registered as
 *    route("404", "routes/404.tsx") so it prerenders to 404/index.html): render
 *    it. The hosting platform serves that prerendered file with a real 404
 *    status for every unknown URL; this route is what the client-side router
 *    matches once the page hydrates in the browser, so the same component has
 *    to render here or React swaps the page for root.tsx's generic error
 *    boundary. Picked up automatically via import.meta.glob — the glob is an
 *    empty object when the file doesn't exist, so nothing else needs wiring.
 * 2. Development, no custom page: the PageNotGenerated screen for pages that
 *    don't exist yet. This is a proper route (not an error boundary), so Vite
 *    processes and includes its CSS, avoiding FOUC.
 * 3. Production, no custom page: a plain 404 block. Direct hits never reach it
 *    (the platform answers those itself); it only covers in-app navigation to
 *    a missing page.
 *
 * Note: This component is rendered inside the App layout (root.tsx),
 * which already provides Header and Footer. Don't add them here!
 */

import type { ComponentType } from "react";
import PageNotGenerated from "~/components/PageNotGenerated";

type RouteModule = {
  default: ComponentType;
  meta?: () => unknown[];
};

// `{}` when app/routes/404.tsx does not exist; Vite resolves this at build time.
const custom404 = import.meta.glob<RouteModule>("./404.tsx", { eager: true });
const Custom404 = custom404["./404.tsx"];

export function meta() {
  return Custom404?.meta?.() ?? [{ title: "Page Not Found" }];
}

export default function CatchAllRoute() {
  if (Custom404) {
    return <Custom404.default />;
  }

  // Get the current pathname
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : undefined;

  // In dev mode, show the "page not generated yet" message
  if (import.meta.env.DEV) {
    return <PageNotGenerated pathname={pathname} />;
  }

  // In production, show a proper 404 page
  return (
    <div className="container mx-auto p-4 pt-16">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-4">The requested page could not be found.</p>
    </div>
  );
}
