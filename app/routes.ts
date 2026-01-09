import { type RouteConfig, index, route } from "@react-router/dev/routes";

/**
 * Route Configuration
 *
 * This file defines all routes for the website.
 * Each route maps a URL path to a component file.
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

  // Add more routes here if pages are added - examples:
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
