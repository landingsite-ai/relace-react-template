import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-6 py-24 text-center md:py-32">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Welcome to Your Website
        </h1>
        <p className="max-w-[600px] text-lg text-muted-foreground md:text-xl">
          Build something amazing. This is your starting point for creating a
          beautiful, modern website.
        </p>
        <div className="flex gap-4">
          <Button size="lg">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-16 md:py-24">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <div className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Feature One</h3>
            <p className="text-muted-foreground">
              Describe the first key feature of your product or service.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <div className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Feature Two</h3>
            <p className="text-muted-foreground">
              Describe the second key feature of your product or service.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <div className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Feature Three</h3>
            <p className="text-muted-foreground">
              Describe the third key feature of your product or service.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted py-16 md:py-24">
        <div className="container flex flex-col items-center text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mb-8 max-w-[500px] text-muted-foreground">
            Join thousands of satisfied customers who have transformed their
            business with our solutions.
          </p>
          <Button size="lg">
            Contact Us Today
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  )
}

