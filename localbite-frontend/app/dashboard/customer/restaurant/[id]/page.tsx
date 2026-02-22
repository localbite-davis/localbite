"use client"

import { use } from "react"
import Image from "next/image"
import Link from "next/link"
import { restaurants } from "@/lib/mock-data"
import { useCart } from "@/app/dashboard/customer/layout"
import { Star, Clock, MapPin, ArrowLeft, Plus, Minus, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

export default function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const restaurant = restaurants.find((r) => r.id === id)
  const { addItem, items } = useCart()
  const [addedIds, setAddedIds] = useState<string[]>([])

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium text-foreground">
          Restaurant not found
        </p>
        <Link href="/dashboard/customer">
          <Button variant="outline" className="mt-4 rounded-xl">
            Back to browse
          </Button>
        </Link>
      </div>
    )
  }

  const categories = [...new Set(restaurant.menu.map((m) => m.category))]

  const handleAdd = (item: (typeof restaurant.menu)[0]) => {
    addItem({
      id: item.id,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      name: item.name,
      price: item.price,
    })
    setAddedIds((prev) => [...prev, item.id])
    setTimeout(() => setAddedIds((prev) => prev.filter((i) => i !== item.id)), 800)
  }

  const getItemQuantity = (itemId: string) => {
    return items.find((i) => i.id === itemId)?.quantity || 0
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
            {restaurant.cuisine}
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
      {categories.map((cat) => (
        <section key={cat}>
          <h2 className="mb-3 text-lg font-semibold text-foreground">{cat}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {restaurant.menu
              .filter((m) => m.category === cat)
              .map((item) => {
                const qty = getItemQuantity(item.id)
                const justAdded = addedIds.includes(item.id)
                return (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-md"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-card-foreground">
                          {item.name}
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
                        {item.description}
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
      ))}
    </div>
  )
}
