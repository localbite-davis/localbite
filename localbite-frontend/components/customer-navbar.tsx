"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useTheme } from "next-themes"
import {
  UtensilsCrossed,
  Search,
  ShoppingCart,
  Heart,
  Clock,
  User,
  LogOut,
  Moon,
  Sun,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard/customer", label: "Browse", icon: Home },
  { href: "/dashboard/customer/orders", label: "Orders", icon: Clock },
  { href: "/dashboard/customer/favorites", label: "Favorites", icon: Heart },
  { href: "/dashboard/customer/profile", label: "Profile", icon: User },
]

export function CustomerNavbar({ cartCount = 0 }: { cartCount?: number }) {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard/customer" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">
              Aggie<span className="text-accent">Bites</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-1.5 rounded-lg text-sm",
                    pathname === item.href
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
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
          <Link href="/dashboard/customer/cart">
            <Button variant="ghost" size="icon" className="relative rounded-lg">
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {cartCount}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </Button>
          </Link>
          <div className="hidden h-6 w-px bg-border md:block" />
          <div className="hidden items-center gap-2 md:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {user?.name?.charAt(0) || "U"}
            </div>
            <span className="text-sm font-medium text-foreground">
              {user?.name}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="rounded-lg text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="flex border-t border-border/50 md:hidden">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="flex-1">
            <div
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-xs",
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </div>
          </Link>
        ))}
      </div>
    </nav>
  )
}
