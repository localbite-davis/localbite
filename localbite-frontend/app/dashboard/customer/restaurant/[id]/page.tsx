"use client"

import { use, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { restaurants as mockRestaurants } from "@/lib/mock-data"
import { getRestaurantById } from "@/lib/api/restaurants"
import { getMenuByRestaurant } from "@/lib/api/menu"
import { useCart } from "@/app/dashboard/customer/layout"
import { Star, Clock, MapPin, ArrowLeft, Plus, Minus, ShoppingCart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const API_URL = "http://localhost:8000/api/v1"

interface Restaurant {
  id: string | number
  name: string
  cuisine_type: string
  image: string
  rating: number
  reviewCount: number
  eta: string
  deliveryFee: number
}

interface MenuItem {
  menu_id: number
  item_name: string
  price: number
  description?: string
  category: string | undefined
  popular?: boolean
}

export default function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { addItem, items } = useCart()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [addedIds, setAddedIds] = useState<number[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch restaurant data
        const restaurantData = await getRestaurantById(parseInt(id))
        
        // Find mock data for image and other display fields
        const mockRest = mockRestaurants.find(
          (m) => m.name.toLowerCase() === restaurantData.name.toLowerCase()
        )
        
        const enrichedRestaurant: Restaurant = {
          id: restaurantData.id,
          name: restaurantData.name,
          cuisine_type: restaurantData.cuisine_type,
          image: mockRest?.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop",
          rating: mockRest?.rating || 4.5,
          reviewCount: mockRest?.reviewCount || 100,
          eta: mockRest?.eta || "20-30 min",
          deliveryFee: mockRest?.deliveryFee || 2.49,
        }
        setRestaurant(enrichedRestaurant)
        
        // Fetch menu items
        const menuData = await getMenuByRestaurant(parseInt(id))
        setMenu(menuData as MenuItem[])
      } catch (err) {
        console.error(err)
        setError("Could not load restaurant details.")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium text-foreground">
          {error || "Restaurant not found"}
        </p>
        <Link href="/dashboard/customer">
          <Button variant="outline" className="mt-4 rounded-xl">
            Back to browse
          </Button>
        </Link>
      </div>
    )
  }

  // Group menu by category
  const categories = Array.from(new Set(menu.map((m) => m.category || "Uncategorized")))

  const handleAdd = (item: MenuItem) => {
    addItem({
      id: item.menu_id.toString(),
      restaurantId: restaurant.id.toString(),
      restaurantName: restaurant.name,
      name: item.item_name,
      price: item.price,
    })
    setAddedIds((prev) => [...prev, item.menu_id])
    setTimeout(() => setAddedIds((prev) => prev.filter((i) => i !== item.menu_id)), 800)
  }

  const getItemQuantity = (itemId: number) => {
    return items.find((i) => i.id === itemId.toString())?.quantity || 0
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/customer"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to restaurants
      </Link>

      {/* Hero */}
      <div className="relative h-48 overflow-hidden rounded-2xl lg:h-64">
        <Image
          src={restaurant.image}
          alt={restaurant.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6">
          <h1 className="text-2xl font-bold text-primary-foreground lg:text-3xl">
            {restaurant.name}
          </h1>
          <p className="mt-1 text-primary-foreground/80">
            {restaurant.cuisine_type}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-primary-foreground/90">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent text-accent" />
              {restaurant.rating} ({restaurant.reviewCount})
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {restaurant.eta}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />${restaurant.deliveryFee.toFixed(2)}{" "}
              delivery
            </span>
          </div>
        </div>
      </div>

      {/* Menu */}
      {menu.length === 0 ? (
         <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            <p>No menu items available for this restaurant yet.</p>
         </div>
      ) : (
        categories.map((cat) => (
            <section key={cat}>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{cat}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
                {menu
                .filter((m) => (m.category || "Uncategorized") === cat)
                .map((item) => {
                    const qty = getItemQuantity(item.menu_id)
                    const justAdded = addedIds.includes(item.menu_id)
                    return (
                    <div
                        key={item.menu_id}
                        className="group flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-md"
                    >
                        <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-medium text-card-foreground">
                            {item.item_name}
                            </h3>
                            {item.popular && (
                            <Badge
                                variant="secondary"
                                className="rounded-md text-[10px]"
                            >
                                Popular
                            </Badge>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {item.description || "No description available"}
                        </p>
                        <p className="mt-2 font-semibold text-card-foreground">
                            ${item.price.toFixed(2)}
                        </p>
                        </div>
                        <div className="ml-4">
                        {qty > 0 ? (
                            <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                                {qty} in cart
                            </span>
                            <Button
                                size="icon"
                                className={`h-9 w-9 rounded-xl transition-all ${
                                justAdded
                                    ? "bg-accent text-accent-foreground"
                                    : "bg-primary text-primary-foreground"
                                }`}
                                onClick={() => handleAdd(item)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                            </div>
                        ) : (
                            <Button
                            size="icon"
                            variant="outline"
                            className={`h-9 w-9 rounded-xl transition-all ${
                                justAdded
                                ? "border-accent bg-accent text-accent-foreground"
                                : "group-hover:border-primary group-hover:text-primary"
                            }`}
                            onClick={() => handleAdd(item)}
                            >
                            <Plus className="h-4 w-4" />
                            </Button>
                        )}
                        </div>
                    </div>
                    )
                })}
            </div>
            </section>
        ))
      )}
    </div>
  )
}
