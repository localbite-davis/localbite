"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { getUserOrders, Order } from "@/lib/api/orders"
import { getMenuItem } from "@/lib/api/menu"
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Users,
  Truck,
  Package,
  Star,
  AlertCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

const statusConfig = {
  placed: { label: "Order Placed", icon: Package, color: "bg-secondary text-secondary-foreground" },
  preparing: { label: "Preparing", icon: ChefHat, color: "bg-accent/20 text-accent-foreground" },
  bidding: { label: "Finding Driver", icon: Users, color: "bg-primary/20 text-primary" },
  on_the_way: { label: "On the Way", icon: Truck, color: "bg-accent/20 text-accent-foreground" },
  delivered: { label: "Delivered", icon: CheckCircle2, color: "bg-secondary text-muted-foreground" },
}

const timelineSteps = [
  { key: "placed", label: "Order Placed" },
  { key: "preparing", label: "Preparing" },
  { key: "bidding", label: "Student Bidding" },
  { key: "on_the_way", label: "On the Way" },
  { key: "delivered", label: "Delivered" },
]

function getStepIndex(status: string) {
  return timelineSteps.findIndex((s) => s.key === status)
}

// Map backend order status to frontend status
function mapBackendStatus(backendStatus: string): string {
  const statusMap: Record<string, string> = {
    pending: "placed",
    preparing: "preparing",
    bidding: "bidding",
    on_the_way: "on_the_way",
    delivered: "delivered",
  }
  return statusMap[backendStatus] || "placed"
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItemCache, setMenuItemCache] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!user?.id) {
          setError("User not authenticated")
          return
        }

        const userOrders = await getUserOrders(user.id)
        setOrders(userOrders)

        // Fetch menu item names for all items in orders
        const allItemIds = new Set<number>()
        userOrders.forEach((order) => {
          order.order_items.forEach((item) => {
            allItemIds.add(item.item_id)
          })
        })

        // Fetch menu items in parallel
        const cache: Record<number, string> = {}
        await Promise.all(
          Array.from(allItemIds).map(async (itemId) => {
            try {
              const menuItem = await getMenuItem(itemId)
              cache[itemId] = menuItem.item_name
            } catch (err) {
              // If menu item not found, use fallback name
              console.error(`Menu item ${itemId} not found, using fallback`)
              cache[itemId] = `Item ${itemId}`
            }
          })
        )
        setMenuItemCache(cache)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch orders"
        setError(errorMessage)
        console.error("Error fetching orders:", err)
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchOrders()
    }
  }, [user?.id])

  // Convert backend orders to frontend format
  const formattedOrders = orders.map((order) => ({
    id: `ORD-${order.order_id}`,
    restaurant: order.restaurant?.name || `Restaurant ${order.restaurant_id}`,
    items: order.order_items.map((item) => ({
      name: menuItemCache[item.item_id] || `Item ${item.item_id}`,
      quantity: item.quantity,
    })),
    total: order.base_fare + order.delivery_fee + order.commission_amount,
    status: mapBackendStatus(order.order_status),
    date: order.created_at,
    eta: "15-20 min",
    driver: null,
    driverRating: 4.8,
  }))

  // Sort by date descending (most recent first)
  const sortedOrders = [...formattedOrders].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const activeOrder = sortedOrders.find((o) => o.status !== "delivered")
  const pastOrders = sortedOrders.filter((o) => o.status === "delivered")

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Loading your orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Your Orders</h1>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No orders yet. Start ordering from your favorite restaurants!</p>
        </div>
      ) : (
        <>
          {/* Active Order */}
          {activeOrder && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Active Order
              </h2>
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {activeOrder.id}
                    </p>
                    <h3 className="text-lg font-semibold text-card-foreground">
                      {activeOrder.restaurant}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {activeOrder.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={`rounded-lg ${
                        statusConfig[activeOrder.status as keyof typeof statusConfig]?.color || ""
                      }`}
                    >
                      {statusConfig[activeOrder.status as keyof typeof statusConfig]?.label}
                    </Badge>
                    <p className="mt-1 text-sm text-muted-foreground">
                      ETA: {activeOrder.eta}
                    </p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    {timelineSteps.map((step, idx) => {
                      const activeIdx = getStepIndex(activeOrder.status)
                      const isComplete = idx <= activeIdx
                      const isCurrent = idx === activeIdx
                      return (
                        <div key={step.key} className="flex flex-1 flex-col items-center">
                          <div className="relative flex items-center justify-center">
                            {idx > 0 && (
                              <div
                                className={`absolute right-1/2 h-0.5 w-[calc(100%+2rem)] -translate-x-1/2 ${
                                  idx <= activeIdx ? "bg-primary" : "bg-border"
                                }`}
                                style={{ top: "50%", right: "100%" }}
                              />
                            )}
                            <div
                              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                                isCurrent
                                  ? "bg-primary text-primary-foreground animate-pulse-glow"
                                  : isComplete
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-muted-foreground"
                              }`}
                            >
                              {(() => {
                                const config = statusConfig[step.key as keyof typeof statusConfig]
                                return config ? <config.icon className="h-4 w-4" /> : null
                              })()}
                            </div>
                          </div>
                          <p
                            className={`mt-2 text-center text-[10px] font-medium lg:text-xs ${
                              isComplete ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Driver info */}
                {activeOrder.driver && (
                  <div className="mt-6 flex items-center gap-3 rounded-xl bg-secondary p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {activeOrder.driver.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-secondary-foreground">
                        {activeOrder.driver}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-accent text-accent" />
                        {activeOrder.driverRating}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Past Orders */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Past Orders
            </h2>
            {pastOrders.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-6 text-center text-muted-foreground">
                No past orders yet
              </div>
            ) : (
              <div className="space-y-3">
                {pastOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                        <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">
                          {order.restaurant}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.items.map((i) => i.name).join(", ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-card-foreground">
                      ${order.total.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
