import { Link } from 'react-router-dom'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold">Your Brand</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Building amazing experiences for our customers.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Quick Links</h4>
            <nav className="flex flex-col space-y-2">
              <Link
                to="/"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Home
              </Link>
              <Link
                to="/about"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                About
              </Link>
              <Link
                to="/services"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Services
              </Link>
              <Link
                to="/contact"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Contact
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Contact</h4>
            <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
              <p>email@example.com</p>
              <p>(555) 123-4567</p>
            </div>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Follow Us</h4>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-muted-foreground hover:text-primary"
                aria-label="Twitter"
              >
                Twitter
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary"
                aria-label="LinkedIn"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Your Brand. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

