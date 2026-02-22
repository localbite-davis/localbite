"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useTheme } from "next-themes"
import {
  UtensilsCrossed,
  Bike,
  Store,
  ArrowRight,
  Clock,
  Shield,
  Zap,
  Star,
  Moon,
  Sun,
  MapPin,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  const goToCustomer = (signupHref = "/signup?role=customer") => {
    if (isAuthenticated && user?.role === "customer") return router.push("/dashboard/customer")
    if (isAuthenticated && user?.role) return router.push(`/dashboard/${user.role}`)
    return router.push(signupHref)
  }

  const goToAgent = (signupHref = "/signup?role=agent") => {
    if (isAuthenticated && user?.role === "agent") return router.push("/dashboard/agent")
    if (isAuthenticated && user?.role) return router.push(`/dashboard/${user.role}`)
    return router.push(signupHref)
  }

  const goToRoleOrSignup = (signupHref: string) => {
    if (isAuthenticated && user?.role) return router.push(`/dashboard/${user.role}`)
    return router.push(signupHref)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Aggie<span className="text-accent">Bites</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-lg"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Link href="/login">
              <Button variant="outline" size="sm" className="rounded-xl">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,var(--color-primary)/0.08,transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-6 pb-20 pt-24 lg:pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-secondary-foreground">
              <MapPin className="h-3.5 w-3.5 text-accent" />
              Serving UC Davis & Downtown Davis
            </div>
            <h1 className="text-balance text-5xl font-extrabold leading-tight tracking-tight text-foreground lg:text-7xl">
              Campus food,{" "}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                delivered by Aggies
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground lg:text-xl">
              Order from your favorite Davis restaurants and get it delivered by
              fellow students. Fast, affordable, community-powered.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={() => goToCustomer()}
                className="group rounded-2xl bg-primary px-8 text-primary-foreground hover:bg-primary/90"
              >
                Order now
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                onClick={() => goToAgent()}
                variant="outline"
                className="rounded-2xl px-8"
              >
                Become a driver
              </Button>
            </div>

            <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                <span>15 min avg delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-accent" />
                <span>20+ local restaurants</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-accent" />
                <span>2,000+ active students</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border/50 bg-secondary/30 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-foreground lg:text-4xl">
              How it works
            </h2>
            <p className="mt-3 text-muted-foreground">
              Three simple steps to your next meal
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Browse & Order",
                description:
                  "Explore menus from top Davis restaurants. Add items to your cart and check out in seconds.",
                icon: UtensilsCrossed,
              },
              {
                step: "02",
                title: "Student Drivers Bid",
                description:
                  "Nearby student drivers compete for your delivery during a quick 3-minute bidding window.",
                icon: Bike,
              },
              {
                step: "03",
                title: "Track & Enjoy",
                description:
                  "Watch your order from kitchen to your door in real time. Rate your experience afterward.",
                icon: Zap,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative rounded-2xl border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <item.icon className="h-6 w-6" />
                </div>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-accent">
                  Step {item.step}
                </span>
                <h3 className="mb-2 text-xl font-semibold text-card-foreground">
                  {item.title}
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-foreground lg:text-4xl">
              Join the platform
            </h2>
            <p className="mt-3 text-muted-foreground">
              Whether you eat, deliver, or serve -- there is a place for you
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                role: "Customer",
                icon: UtensilsCrossed,
                description:
                  "Browse restaurants, order food, and track your delivery in real time.",
                features: [
                  "Discover local restaurants",
                  "Real-time order tracking",
                  "Save your favorites",
                ],
                href: "/signup?role=customer",
                color: "bg-primary",
              },
              {
                role: "Delivery Agent",
                icon: Bike,
                description:
                  "Earn money delivering food around campus on your own schedule.",
                features: [
                  "Flexible hours",
                  "Competitive earnings",
                  "Student-first bidding",
                ],
                href: "/signup?role=agent",
                color: "bg-accent",
              },
              {
                role: "Restaurant",
                icon: Store,
                description:
                  "Reach thousands of UC Davis students and grow your business.",
                features: [
                  "Order management",
                  "Menu management",
                  "Revenue analytics",
                ],
                href: "/signup?role=restaurant",
                color: "bg-primary",
              },
            ].map((item) => (
              <div
                key={item.role}
                className="group flex flex-col rounded-2xl border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${item.color} text-primary-foreground`}
                >
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-card-foreground">
                  {item.role}
                </h3>
                <p className="mb-5 leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
                <ul className="mb-8 flex-1 space-y-2">
                  {item.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => goToRoleOrSignup(item.href)}
                  variant="outline"
                  className="w-full rounded-xl transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                >
                  Sign up as {item.role}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-t border-border/50 bg-secondary/30 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                quote:
                  "Way better than the big delivery apps. Cheaper fees and my food actually arrives warm.",
                author: "Sarah K.",
                detail: "UC Davis, Junior",
                rating: 5,
              },
              {
                quote:
                  "I make $200+ a week delivering between classes. The student bidding system is genius.",
                author: "Marcus T.",
                detail: "Delivery Agent",
                rating: 5,
              },
              {
                quote:
                  "Our orders from campus doubled since joining Aggie Bites. The dashboard is super easy to use.",
                author: "Mei L.",
                detail: "Owner, Sunrise Sushi",
                rating: 5,
              },
            ].map((review) => (
              <div
                key={review.author}
                className="rounded-2xl border border-border bg-card p-8"
              >
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-accent text-accent"
                    />
                  ))}
                </div>
                <p className="mb-6 leading-relaxed text-card-foreground">
                  {`"${review.quote}"`}
                </p>
                <div>
                  <p className="font-semibold text-card-foreground">
                    {review.author}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {review.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-primary p-12 text-center lg:p-20">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,var(--color-accent)/0.15,transparent_50%)]" />
            <div className="relative">
              <h2 className="text-balance text-3xl font-bold text-primary-foreground lg:text-5xl">
                Ready to eat?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-pretty text-lg text-primary-foreground/80">
                Join thousands of Aggies already enjoying faster, cheaper campus
                food delivery.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => goToCustomer()}
                  className="rounded-2xl bg-accent px-8 text-accent-foreground hover:bg-accent/90"
                >
                  Get started free
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">
              Aggie<span className="text-accent">Bites</span>
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              Secure payments
            </span>
            <span>Made in Davis, CA</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; 2026 Aggie Bites. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
