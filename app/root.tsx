import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";
import type { Route } from "./+types/root";
import "./styles/globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PageNotGenerated from "./components/PageNotGenerated";

/**
 * Root Layout
 *
 * This is the root layout component that wraps all pages.
 * It includes the HTML document structure, global styles,
 * and shared components like Header and Footer.
 */

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  // In dev mode, show PageNotGenerated for 404s (page not created by AI yet)
  if (
    import.meta.env.DEV &&
    isRouteErrorResponse(error) &&
    error.status === 404
  ) {
    // Get the current pathname from the URL
    const pathname =
      typeof window !== "undefined" ? window.location.pathname : undefined;

    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <PageNotGenerated pathname={pathname} />
        </main>
        <Footer />
      </div>
    );
  }

  // Production 404 or other errors
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1 className="text-4xl font-bold">{message}</h1>
      <p className="mt-4">{details}</p>
      {stack && (
        <pre className="mt-4 w-full overflow-x-auto rounded bg-gray-100 p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
