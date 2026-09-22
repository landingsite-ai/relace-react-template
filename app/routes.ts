import { existsSync } from "node:fs";
import {
  type RouteConfig,
  type RouteConfigEntry,
  index,
  route,
} from "@react-router/dev/routes";

/**
 * Route Configuration
 *
 * This file defines all routes for the website.
 * Each route maps a URL path to a component file.
 *
 * IMPORTANT: When adding a new page, you MUST add its route here!
 * 1. First create the route file in app/routes/ (e.g., about.tsx)
 * 2. Then add the route entry below (e.g., route("about", "routes/about.tsx"))
 * The page will NOT be accessible until both steps are done.
 *
 * File naming conventions - examples:
 * - _index.tsx -> "/" (homepage)
 * - about.tsx -> "/about"
 * - contact.tsx -> "/contact"
 * - blog._index.tsx -> "/blog"
 * - blog.$slug.tsx -> "/blog/:slug" (dynamic)
 */

const routes: RouteConfig = [
  // Homepage
  index("routes/_index.tsx"),

  // Add new page routes here - examples:
  // route("about", "routes/about.tsx"),
  // route("contact", "routes/contact.tsx"),
];

// Custom not-found page: opt-in by file. If app/routes/404.tsx exists it is
// registered here automatically, prerendered to 404/index.html, and the hosting
// platform serves it with a real 404 status for every URL that doesn't exist.
// Nothing else to wire — the catch-all below renders it after hydration.
// (Skipped if it was already registered above — at the top level or nested
// under a layout/parent route; a second entry for the same file would be a
// duplicate route id.)
const CUSTOM_404_FILE = "routes/404.tsx";

function registersFile(entries: RouteConfigEntry[], file: string): boolean {
  return entries.some(
    (r) => r.file === file || (r.children ? registersFile(r.children, file) : false)
  );
}

if (
  !registersFile(routes, CUSTOM_404_FILE) &&
  existsSync(new URL(`./${CUSTOM_404_FILE}`, import.meta.url))
) {
  routes.push(route("404", CUSTOM_404_FILE));
}

// Catch-all route for unknown URLs. Registered in EVERY build, on purpose:
// - Dev: renders the "page not generated yet" screen (and gives Vite a real
//   route so its CSS is processed, avoiding FOUC).
// - Production: the hosting platform answers unknown URLs with a real 404
//   status, but the router still needs a matching route once the page
//   hydrates in the browser — without one it throws a 404 route error and
//   swaps whatever was served for root.tsx's generic error boundary.
// Note: The AI should NOT add routes after this comment - the catch-all must be last!
routes.push(route("*", "routes/$.tsx"));

export default routes;
