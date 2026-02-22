"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { restaurants } from "@/lib/mock-data"
import { Heart, Star, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function FavoritesPage() {
  const [favorites] = useState(restaurants.slice(0, 3))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Favorites</h1>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
          <Heart className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-lg font-medium text-card-foreground">
            No favorites yet
          </p>
          <p className="text-sm text-muted-foreground">
            Start saving your favorite restaurants
          </p>
          <Link href="/dashboard/customer">
            <Button className="mt-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
              Browse restaurants
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((r) => (
            <Link
              key={r.id}
              href={`/dashboard/customer/restaurant/${r.id}`}
            >
              <div className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="relative h-36 overflow-hidden">
                  <Image
                    src={r.image}
                    alt={r.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm">
                    <Heart className="h-4 w-4 fill-destructive text-destructive" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-card-foreground">
                    {r.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{r.cuisine}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                      {r.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {r.eta}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
