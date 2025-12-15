/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static Site Generation - exports to 'out/' directory
  output: "export",

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Use trailing slashes to generate page/index.html format
  // This matches our prod-serve-website handler expectations
  // e.g., /about/ -> about/index.html
  trailingSlash: true,
};

export default nextConfig;
