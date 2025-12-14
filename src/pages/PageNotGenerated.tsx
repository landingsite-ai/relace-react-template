import { useLocation, Link } from "react-router-dom";

export default function PageNotGenerated() {
  const location = useLocation();
  const pageName = location.pathname.slice(1) || "this page";
  const isDev = import.meta.env.DEV;

  // In production, show a simple 404 page
  if (!isDev) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-bold text-muted-foreground/50 mb-4">
            404
          </h1>
          <h2 className="text-2xl font-bold mb-3">Page Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // In development, show the "ask AI to generate" message
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-3">Page Not Generated Yet</h1>
        <p className="text-muted-foreground mb-6">
          The <span className="font-medium text-foreground">/{pageName}</span>{" "}
          page hasn't been created yet. Ask the AI to generate this page and it
          will be built for you.
        </p>
        <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Try saying:</p>
          <p className="italic">"Create the {pageName} page"</p>
        </div>
      </div>
    </div>
  );
}
