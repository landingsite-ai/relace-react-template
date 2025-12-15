import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="font-bold">
          {/* Logo/Brand will go here */}
        </Link>
        <nav className="flex items-center space-x-6">
          {/* Navigation links will go here */}
        </nav>
      </div>
    </header>
  );
}
