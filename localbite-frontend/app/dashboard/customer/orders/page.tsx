"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { getUserOrders, Order } from "@/lib/api/orders"
import { getMenuItem } from "@/lib/api/menu"
import { getDispatchStatus, type DispatchStatusResponse } from "@/lib/api/dispatch"
import { getDeliveryAgentById } from "@/lib/api/delivery-agents"
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
  all_agents_bidding: { label: "Expanding to All Drivers", icon: Users, color: "bg-primary/20 text-primary" },
  needs_fee_increase: { label: "Increase Delivery Fee Needed", icon: AlertCircle, color: "bg-destructive/10 text-destructive" },
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
  if (status === "all_agents_bidding" || status === "needs_fee_increase") {
    return timelineSteps.findIndex((s) => s.key === "bidding")
  }
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

function getAcceptedByAgentId(note?: string | null): string | null {
  if (!note) return null
  const match = note.match(/accepted_by=([A-Za-z0-9_-]+)/)
  return match?.[1] || null
}

function formatDispatchNote(
  note: string | null | undefined,
  agentNameCache: Record<string, string>
): string {
  if (!note) return "Looking for a delivery partner"

  const acceptedAgentId = getAcceptedByAgentId(note)
  if (!acceptedAgentId) return note

  const agentName = agentNameCache[acceptedAgentId]
  return agentName ? `${agentName}'s delivering to you` : "Driver accepted your order"
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItemCache, setMenuItemCache] = useState<Record<number, string>>({})
  const [dispatchStatusMap, setDispatchStatusMap] = useState<Record<number, DispatchStatusResponse>>({})
  const [agentNameCache, setAgentNameCache] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!user?.id) {
          setError("User not authenticated")
          return
        }

        const userId =
          typeof user.id === "string" ? parseInt(user.id, 10) : user.id
        const userOrders = await getUserOrders(userId)
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

  useEffect(() => {
    const orderAssignedAgentIds = orders
      .map((order) => order.assigned_partner_id)
      .filter((agentId): agentId is string => Boolean(agentId))

    const dispatchAcceptedAgentIds = Object.values(dispatchStatusMap)
      .map((dispatch) => getAcceptedByAgentId(dispatch.note))
      .filter((agentId): agentId is string => Boolean(agentId))

    const assignedAgentIds = Array.from(
      new Set([...orderAssignedAgentIds, ...dispatchAcceptedAgentIds])
    ).filter((agentId) => !agentNameCache[agentId])

    if (assignedAgentIds.length === 0) {
      return
    }

    let cancelled = false

    const loadAgentNames = async () => {
      const resolvedNames: Record<string, string> = {}

      await Promise.all(
        assignedAgentIds.map(async (agentId) => {
          try {
            const agent = await getDeliveryAgentById(agentId)
            resolvedNames[agentId] = agent.full_name
          } catch (err) {
            console.error(`Failed to fetch agent ${agentId}`, err)
          }
        })
      )

      if (!cancelled && Object.keys(resolvedNames).length > 0) {
        setAgentNameCache((prev) => ({ ...prev, ...resolvedNames }))
      }
    }

    loadAgentNames()

    return () => {
      cancelled = true
    }
  }, [orders, dispatchStatusMap, agentNameCache])

  useEffect(() => {
    if (orders.length === 0) {
      setDispatchStatusMap({})
      return
    }

    let cancelled = false
    const activeOrders = orders.filter(
      (order) => !["delivered", "cancelled"].includes(order.order_status)
    )

    if (activeOrders.length === 0) {
      setDispatchStatusMap({})
      return
    }

    const loadDispatchStatuses = async () => {
      try {
        const entries = await Promise.all(
          activeOrders.map(async (order) => {
            const status = await getDispatchStatus(order.order_id)
            return [order.order_id, status] as const
          })
        )
        if (!cancelled) {
          setDispatchStatusMap(Object.fromEntries(entries))
        }
      } catch (err) {
        console.error("Failed to fetch dispatch statuses:", err)
      }
    }

    loadDispatchStatuses()
    const interval = setInterval(loadDispatchStatuses, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [orders])

  function mapDispatchToFrontendStatus(
    backendStatus: string,
    dispatch?: DispatchStatusResponse
  ): string {
    if (backendStatus === "delivered") return "delivered"
    if (backendStatus === "cancelled") return "placed"

    if (!dispatch) return mapBackendStatus(backendStatus)

    if (dispatch.status === "needs_fee_increase") return "needs_fee_increase"
    if (
      ["starting", "broadcasted", "waiting_for_bids", "escalating"].includes(dispatch.status)
    ) {
      if (dispatch.phase === "all_agents") return "all_agents_bidding"
      return "bidding"
    }

    if (dispatch.status === "assigned" || dispatch.phase === "completed") {
      return "on_the_way"
    }

    return mapBackendStatus(backendStatus)
  }

  // Convert backend orders to frontend format
  const formattedOrders = orders.map((order) => {
    const dispatchStatus = dispatchStatusMap[order.order_id]
    const dispatchAssignedAgentId = getAcceptedByAgentId(dispatchStatus?.note)
    const assignedAgentId = order.assigned_partner_id || dispatchAssignedAgentId || undefined

    return {
      orderId: order.order_id,
      id: `ORD-${order.order_id}`,
      restaurant: order.restaurant?.name || `Restaurant ${order.restaurant_id}`,
      items: order.order_items.map((item) => ({
        name: menuItemCache[item.item_id] || `Item ${item.item_id}`,
        quantity: item.quantity,
      })),
      total: order.base_fare + order.delivery_fee + order.commission_amount,
      status: mapDispatchToFrontendStatus(order.order_status, dispatchStatus),
      date: order.created_at,
      eta: "15-20 min",
      driver: assignedAgentId ? agentNameCache[assignedAgentId] || null : null,
      driverRating: 4.8,
    }
  })

  // Sort by date descending (most recent first)
  const sortedOrders = [...formattedOrders].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const activeOrder = sortedOrders.find((o) => o.status !== "delivered")
  const pastOrders = sortedOrders.filter((o) => o.status === "delivered")
  const activeDispatchStatus = activeOrder ? dispatchStatusMap[activeOrder.orderId] : undefined

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

                {activeDispatchStatus && (
                  <div className="mt-4 rounded-xl bg-secondary p-3 text-sm">
                    <p className="font-medium text-secondary-foreground">
                      Dispatch phase:{" "}
                      <span className="capitalize">
                        {activeDispatchStatus.phase.replace(/_/g, " ")}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDispatchNote(activeDispatchStatus.note, agentNameCache)}
                    </p>
                    {activeDispatchStatus.status === "needs_fee_increase" && (
                      <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                        No driver accepted the current fee. Prompt the customer to increase the delivery fee.
                      </div>
                    )}
                  </div>
                )}

                {/* Driver info */}
                {activeOrder.driver && (
                  <div className="mt-6 flex items-center gap-3 rounded-xl bg-secondary p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {activeOrder.driver.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-secondary-foreground">
                        {activeOrder.driver}&apos;s delivering to you
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
