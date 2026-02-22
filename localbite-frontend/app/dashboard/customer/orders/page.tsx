"use client"

import { mockOrders } from "@/lib/mock-data"
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Users,
  Truck,
  Package,
  Star,
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

export default function OrdersPage() {
  const activeOrder = mockOrders.find((o) => o.status !== "delivered")
  const pastOrders = mockOrders.filter((o) => o.status === "delivered")

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Your Orders</h1>

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
      </section>
    </div>
  )
}
