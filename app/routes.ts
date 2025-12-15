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
export default [
  // Homepage
  index("routes/_index.tsx"),

  // Add more routes here if pages are added - examples:
  // route("about", "routes/about.tsx"),
  // route("contact", "routes/contact.tsx"),
] satisfies RouteConfig;
