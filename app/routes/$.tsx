/**
 * Catch-All Route (DEV ONLY)
 *
 * This route catches all unmatched paths and shows the PageNotGenerated
 * component in development mode. This is a proper route (not an error boundary),
 * so Vite will process and include its CSS, avoiding FOUC.
 *
 * Note: This component is rendered inside the App layout (root.tsx),
 * which already provides Header and Footer. Don't add them here!
 *
 * In production, this route would show a proper 404 page.
 */

import PageNotGenerated from "~/components/PageNotGenerated";
import type { Route } from "./+types/$";

export function meta({}: Route.MetaArgs) {
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
