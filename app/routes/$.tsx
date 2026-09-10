/**
 * Catch-All Route
 *
 * Registered last in app/routes.ts for every build. In development it shows
 * the PageNotGenerated screen for pages that don't exist yet. This is a proper
 * route (not an error boundary), so Vite will process and include its CSS,
 * avoiding FOUC.
 *
 * In production the hosting platform already answers unknown URLs with a real
 * 404 status; this route only exists so the client-side router has a match
 * after hydration (and for in-app navigation to a missing page) instead of
 * falling through to root.tsx's generic error boundary.
 *
 * Note: This component is rendered inside the App layout (root.tsx),
 * which already provides Header and Footer. Don't add them here!
 *
 * A site's custom not-found page does NOT live here: it is app/routes/404.tsx
 * with a static route("404", ...) entry, and the catch-all line in routes.ts
 * re-pointed at that file.
 */

import PageNotGenerated from "~/components/PageNotGenerated";

export function meta() {
  return [{ title: "Page Not Found" }];
}

export default function CatchAllRoute() {
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
