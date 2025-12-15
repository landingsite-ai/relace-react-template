import type { Route } from "./+types/_index";

/**
 * Homepage
 *
 * This is the main landing page of the website.
 * The AI will populate this with the user's content.
 */

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Welcome" },
    { name: "description", content: "Welcome to our website" },
  ];
}

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold">Welcome</h1>
      <p className="mt-4 text-lg text-gray-600">
        Your website content will appear here.
      </p>
    </div>
  );
}
