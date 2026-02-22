"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { getRestaurants } from "@/lib/api/restaurants"
import { restaurants as mockRestaurants } from "@/lib/mock-data"
import { Search, Star, Clock, MapPin, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const cuisineFilters = ["All", "Halal", "Thai", "American", "Japanese", "Mexican", "Vietnamese"]

interface Restaurant {
  id: string
  name: string
  image: string
  cuisine: string
  rating: number
  reviewCount: number
  eta: string
  deliveryFee: number
  priceRange: string
  featured?: boolean
}

export default function CustomerDashboard() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [activeCuisine, setActiveCuisine] = useState("All")

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const apiRestaurants = await getRestaurants()
        // Map API response to mock format for compatibility
        const mappedRestaurants = apiRestaurants.map((r, idx) => {
          // Find corresponding mock restaurant to get image and other details
          const mockRest = mockRestaurants.find(
            (m) => m.name.toLowerCase() === r.name.toLowerCase()
          )
          return {
            id: r.id.toString(),
            name: r.name,
            image: mockRest?.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop",
            cuisine: r.cuisine_type,
            rating: mockRest?.rating || 4.5 + (idx * 0.1),
            reviewCount: mockRest?.reviewCount || 100 + idx * 50,
            eta: mockRest?.eta || "15-25 min",
            deliveryFee: mockRest?.deliveryFee || 2.49,
            priceRange: mockRest?.priceRange || "$$",
            featured: mockRest?.featured || idx < 3,
          }
        })
        setRestaurants(mappedRestaurants)
      } catch (err) {
        console.error("Failed to fetch restaurants:", err)
        setError("Failed to load restaurants")
        // Fall back to mock data
        setRestaurants(mockRestaurants)
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurants()
  }, [])

  const filtered = restaurants.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(search.toLowerCase())
    const matchCuisine =
      activeCuisine === "All" ||
      r.cuisine.toLowerCase().includes(activeCuisine.toLowerCase())
    return matchSearch && matchCuisine
  })

  return (
    <div className="space-y-8">
      {/* Hero Search */}
      <div className="relative overflow-hidden rounded-2xl bg-primary p-8 lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,var(--color-accent)/0.15,transparent_50%)]" />
        <div className="relative">
          <h1 className="text-2xl font-bold text-primary-foreground lg:text-3xl">
            What are you craving?
          </h1>
          <p className="mt-2 text-primary-foreground/70">
            Order from your favorite Davis restaurants
          </p>
          <div className="relative mt-6 max-w-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search restaurants or cuisines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border-0 bg-background/95 pl-10 text-foreground shadow-lg backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {!loading && (
        <>
          {/* Cuisine Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {cuisineFilters.map((cuisine) => (
              <Button
                key={cuisine}
                variant={activeCuisine === cuisine ? "default" : "outline"}
                size="sm"
                className={`shrink-0 rounded-full ${
                  activeCuisine === cuisine
                    ? "bg-primary text-primary-foreground"
                    : ""
                }`}
                onClick={() => setActiveCuisine(cuisine)}
              >
                {cuisine}
              </Button>
            ))}
          </div>

          {/* Featured */}
          {activeCuisine === "All" && !search && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Featured Restaurants
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {restaurants
                  .filter((r) => r.featured)
                  .map((r) => (
                    <RestaurantCard key={r.id} restaurant={r} featured />
                  ))}
              </div>
            </section>
          )}

          {/* All Restaurants */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {search || activeCuisine !== "All"
                ? `Results (${filtered.length})`
                : "All Restaurants"}
            </h2>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
                <Search className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-lg font-medium text-card-foreground">
                  No restaurants found
                </p>
                <p className="text-sm text-muted-foreground">
                  Try a different search or filter
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((r) => (
                  <RestaurantCard key={r.id} restaurant={r} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function RestaurantCard({
  restaurant,
  featured = false,
}: {
  restaurant: Restaurant
  featured?: boolean
}) {
  return (
    <Link href={`/dashboard/customer/restaurant/${restaurant.id}`}>
      <div className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg">
        <div className="relative h-40 overflow-hidden">
          <Image
            src={restaurant.image}
            alt={restaurant.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {featured && (
            <Badge className="absolute left-3 top-3 rounded-lg bg-accent text-accent-foreground">
              Featured
            </Badge>
          )}
          <div className="absolute bottom-3 right-3 rounded-lg bg-background/90 px-2 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
            {restaurant.priceRange}
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-card-foreground">
                {restaurant.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {restaurant.cuisine}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-secondary px-2 py-1">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
              <span className="text-sm font-medium text-secondary-foreground">
                {restaurant.rating}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {restaurant.eta}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              ${restaurant.deliveryFee.toFixed(2)} delivery
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
