import { type RouteConfig, index, route } from "@react-router/dev/routes";

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

// DEV ONLY: Catch-all route for 404s
// This ensures Vite processes CSS for the "page not generated" screen, avoiding FOUC.
// Excluded from production builds - the hosting provider handles real 404s.
// Note: The AI should NOT add routes after this comment - the catch-all must be last!
if (process.env.NODE_ENV !== "production") {
  routes.push(route("*", "routes/$.tsx"));
}

export default routes;
