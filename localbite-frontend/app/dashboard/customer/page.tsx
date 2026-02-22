"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Star, Clock, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const cuisineFilters = ["All", "Halal", "Thai", "American", "Japanese", "Mexican", "Vietnamese"]

interface Restaurant {
  id: number
  name: string
  description: string | null
  cuisine_type: string
  address: string
  city: string
  state: string
  is_active: boolean
  // Mapped/Mocked fields
  image: string
  rating: number
  delivery_fee: number
  eta: string
  price_range: string
  featured?: boolean
}

const API_URL = "http://172.26.56.184:8000/api/v1"

export default function CustomerDashboard() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [activeCuisine, setActiveCuisine] = useState("All")

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch(`${API_URL}/restaurants/`)
        if (!res.ok) throw new Error("Failed to fetch restaurants")
        const data = await res.json()
        
        const mappedData = data.map((r: any) => ({
          ...r,
          image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80",
          rating: 4.5,
          delivery_fee: 1.99,
          eta: "20-30 min",
          price_range: "$$",
          featured: r.id % 2 === 0 // Mock featured status
        }))
        
        setRestaurants(mappedData)
      } catch (err) {
        console.error(err)
        setError("Could not load restaurants. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurants()
  }, [])

  const filtered = restaurants.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine_type.toLowerCase().includes(search.toLowerCase())
    const matchCuisine =
      activeCuisine === "All" ||
      r.cuisine_type.toLowerCase().includes(activeCuisine.toLowerCase())
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

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <div className="text-center text-destructive p-8 bg-destructive/10 rounded-xl">
          {error}
        </div>
      ) : (
        <>
        {/* Featured - Only show when no search/filter active */}
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
              {restaurants.filter((r) => r.featured).length === 0 && (
                <p className="text-muted-foreground">No featured restaurants yet.</p>
              )}
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
        <div className="relative h-40 overflow-hidden bg-muted">
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
            {restaurant.price_range}
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-card-foreground">
                {restaurant.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {restaurant.cuisine_type}
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
              ${restaurant.delivery_fee.toFixed(2)} delivery
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
