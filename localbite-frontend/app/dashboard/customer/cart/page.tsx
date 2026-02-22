"use client"

import Link from "next/link"
import { useCart } from "@/app/dashboard/customer/layout"
import {
  Minus,
  Plus,
  Trash2,
  ArrowLeft,
  ShoppingCart,
  UtensilsCrossed,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart()
  const deliveryFee = items.length > 0 ? 2.49 : 0
  const serviceFee = items.length > 0 ? 1.99 : 0
  const grandTotal = total + deliveryFee + serviceFee

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
          <ShoppingCart className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          Your cart is empty
        </h2>
        <p className="mt-2 text-muted-foreground">
          Browse restaurants to start adding items
        </p>
        <Link href="/dashboard/customer">
          <Button className="mt-6 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
            Browse restaurants
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your Cart</h1>
          <p className="text-sm text-muted-foreground">
            {items.reduce((s, i) => s + i.quantity, 0)} items from{" "}
            {items[0]?.restaurantName}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl text-destructive hover:bg-destructive/10"
          onClick={clearCart}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Clear
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="space-y-3 lg:col-span-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <UtensilsCrossed className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-card-foreground">
                    {item.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ${item.price.toFixed(2)} each
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg"
                    onClick={() =>
                      updateQuantity(item.id, item.quantity - 1)
                    }
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium text-secondary-foreground">
                    {item.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg"
                    onClick={() =>
                      updateQuantity(item.id, item.quantity + 1)
                    }
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <p className="w-16 text-right font-semibold text-card-foreground">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-card-foreground">
            Order Summary
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="text-card-foreground">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery fee</span>
              <span className="text-card-foreground">
                ${deliveryFee.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Service fee</span>
              <span className="text-card-foreground">
                ${serviceFee.toFixed(2)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-semibold text-card-foreground">
              <span>Total</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
          <Button className="mt-6 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
            Place Order
          </Button>
          <Link href="/dashboard/customer">
            <Button
              variant="ghost"
              className="mt-2 w-full rounded-xl text-muted-foreground"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Continue browsing
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
