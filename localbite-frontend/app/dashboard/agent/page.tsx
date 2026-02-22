"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useTheme } from "next-themes"
import { agentStats } from "@/lib/mock-data"
import {
  getAvailableDispatchRequestsForAgent,
} from "@/lib/api/dispatch"
import {
  placeDeliveryBid,
  type PoolPhase,
} from "@/lib/api/delivery-bids"
import {
  fulfillAgentOrder,
  getAgentActiveOrders,
  type AgentActiveOrder,
} from "@/lib/api/delivery-agents"
import {
  Bike,
  Camera,
  DollarSign,
  Star,
  MapPin,
  Package,
  TrendingUp,
  LogOut,
  Moon,
  Sun,
  Timer,
  Users,
  Zap,
  ChevronRight,
  CheckCircle2,
  BarChart3,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"

function CountdownTimer({ seconds: initialSeconds }: { seconds: number }) {
  const [seconds, setSeconds] = useState(initialSeconds)

  useEffect(() => {
    setSeconds(initialSeconds)
  }, [initialSeconds])

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const progress = initialSeconds > 0 ? (seconds / initialSeconds) * 100 : 0

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-accent transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span
        className={`text-xs font-mono font-semibold ${
          seconds < 60 ? "text-destructive" : "text-accent-foreground"
        }`}
      >
        {mins}:{secs.toString().padStart(2, "0")}
      </span>
    </div>
  )
}

type AgentDeliveryCard = {
  id: string
  orderId: number
  restaurant: string
  pickup: string
  dropoff: string
  distance: string
  items: number
  estimatedPay: string
  studentOnly: boolean
  biddingTimeLeft: number
  minBid: number
  maxBid: number
  poolPhase: PoolPhase
  leadingBid?: number
}

type AgentDashboardSummary = {
  totalEarnings: number
  totalDeliveries: number
}

type ProofState = {
  localKey?: string
  previewDataUrl?: string
  fileName?: string
}

export default function AgentDashboard() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [isOnline, setIsOnline] = useState(false)
  const [bids, setBids] = useState<Record<string, string>>({})
  const [submittedBids, setSubmittedBids] = useState<string[]>([])
  const [availableDeliveries, setAvailableDeliveries] = useState<AgentDeliveryCard[]>([])
  const [feedError, setFeedError] = useState<string | null>(null)
  const [isLoadingFeed, setIsLoadingFeed] = useState(false)
  const [bidErrors, setBidErrors] = useState<Record<string, string>>({})
  const [activeOrders, setActiveOrders] = useState<AgentActiveOrder[]>([])
  const [activeOrdersError, setActiveOrdersError] = useState<string | null>(null)
  const [isLoadingActiveOrders, setIsLoadingActiveOrders] = useState(false)
  const [proofByOrder, setProofByOrder] = useState<Record<number, ProofState>>({})
  const [fulfillErrors, setFulfillErrors] = useState<Record<number, string>>({})
  const [fulfillingOrderIds, setFulfillingOrderIds] = useState<number[]>([])
  const [dashboardSummary, setDashboardSummary] = useState<AgentDashboardSummary>({
    totalEarnings: 0,
    totalDeliveries: 0,
  })
  const [activeTab, setActiveTab] = useState<"available" | "active" | "earnings">("available")

  useEffect(() => {
    if (!isOnline) {
      setAvailableDeliveries([])
      setFeedError(null)
      return
    }

    let cancelled = false

    const loadAvailableDeliveries = async () => {
      try {
        setIsLoadingFeed(true)
        setFeedError(null)

        if (!user?.id || typeof user.id !== "string") {
          throw new Error("Agent session not available")
        }

        const feed = await getAvailableDispatchRequestsForAgent(user.id, 100)
        const cards: AgentDeliveryCard[] = feed.items.map((item) => ({
          id: `ORD-${item.order_id}`,
          orderId: item.order_id,
          restaurant: item.restaurant_name || `Restaurant ${item.restaurant_id}`,
          pickup: item.restaurant_name || `Restaurant ${item.restaurant_id}`,
          dropoff: item.delivery_address || "Customer address",
          distance: "Distance TBD",
          items: item.order_items_count,
          estimatedPay: `$${item.min_allowed_fare.toFixed(2)} - $${item.max_allowed_fare.toFixed(2)}`,
          studentOnly: item.student_only,
          biddingTimeLeft: item.bidding_time_left_seconds,
          minBid: item.min_allowed_fare,
          maxBid: item.max_allowed_fare,
          poolPhase: (item.pool_phase === "all_agents" ? "all_agents" : "student_pool") as PoolPhase,
          leadingBid:
            typeof item.leading_bid_amount === "number"
              ? item.leading_bid_amount
              : undefined,
        }))

        if (!cancelled) {
          setAvailableDeliveries(cards.sort((a, b) => b.orderId - a.orderId))
        }
      } catch (err) {
        if (!cancelled) {
          setFeedError(
            err instanceof Error ? err.message : "Failed to load available deliveries"
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoadingFeed(false)
        }
      }
    }

    loadAvailableDeliveries()
    const interval = setInterval(loadAvailableDeliveries, 5000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [isOnline, user?.id])

  useEffect(() => {
    if (!isOnline) {
      setActiveOrders([])
      setActiveOrdersError(null)
      return
    }

    let cancelled = false

    const loadActiveOrders = async () => {
      try {
        if (!user?.id || typeof user.id !== "string") {
          throw new Error("Agent session not available")
        }

        setIsLoadingActiveOrders(true)
        setActiveOrdersError(null)
        const response = await getAgentActiveOrders(user.id)
        if (!cancelled) {
          setActiveOrders(response.active_orders)
          setDashboardSummary({
            totalEarnings: response.total_earnings,
            totalDeliveries: response.total_deliveries,
          })
        }
      } catch (err) {
        if (!cancelled) {
          setActiveOrdersError(
            err instanceof Error ? err.message : "Failed to load active orders"
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoadingActiveOrders(false)
        }
      }
    }

    loadActiveOrders()
    const interval = setInterval(loadActiveOrders, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [isOnline, user?.id])

  const submitBid = async (delivery: AgentDeliveryCard) => {
    const rawBid = bids[delivery.id]
    if (!rawBid || !user?.id || typeof user.id !== "string") return

    const bidAmount = Number(rawBid)
    if (!Number.isFinite(bidAmount)) return

    if (bidAmount < delivery.minBid) {
      setBidErrors((prev) => ({
        ...prev,
        [delivery.id]: `Bid must be at least $${delivery.minBid.toFixed(2)}`,
      }))
      return
    }
    if (bidAmount > delivery.maxBid) {
      setBidErrors((prev) => ({
        ...prev,
        [delivery.id]: `Bid must be no more than $${delivery.maxBid.toFixed(2)}`,
      }))
      return
    }

    try {
      setBidErrors((prev) => ({ ...prev, [delivery.id]: "" }))
      await placeDeliveryBid({
        order_id: delivery.orderId,
        agent_id: user.id,
        bid_amount: bidAmount,
        pool_phase: delivery.poolPhase,
      })
      setSubmittedBids((prev) =>
        prev.includes(delivery.id) ? prev : [...prev, delivery.id]
      )
    } catch (err) {
      setBidErrors((prev) => ({
        ...prev,
        [delivery.id]:
          err instanceof Error ? err.message : "Failed to submit bid",
      }))
    }
  }

  const handleProofFileChange = async (
    orderId: number,
    file: File | null
  ) => {
    if (!file || !user?.id || typeof user.id !== "string") return

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ""))
        reader.onerror = () => reject(new Error("Failed to read photo"))
        reader.readAsDataURL(file)
      })

      const localKey = `pod:${user.id}:${orderId}:${Date.now()}`
      window.localStorage.setItem(localKey, dataUrl)

      setProofByOrder((prev) => ({
        ...prev,
        [orderId]: {
          localKey,
          previewDataUrl: dataUrl,
          fileName: file.name,
        },
      }))
      setFulfillErrors((prev) => ({ ...prev, [orderId]: "" }))
    } catch (err) {
      setFulfillErrors((prev) => ({
        ...prev,
        [orderId]: err instanceof Error ? err.message : "Failed to store proof photo",
      }))
    }
  }

  const handleFulfillOrder = async (order: AgentActiveOrder) => {
    if (!user?.id || typeof user.id !== "string") return
    const proof = proofByOrder[order.order_id]
    if (!proof?.localKey) {
      setFulfillErrors((prev) => ({
        ...prev,
        [order.order_id]: "Please capture/upload a delivery photo before fulfilling.",
      }))
      return
    }

    try {
      setFulfillErrors((prev) => ({ ...prev, [order.order_id]: "" }))
      setFulfillingOrderIds((prev) =>
        prev.includes(order.order_id) ? prev : [...prev, order.order_id]
      )

      const result = await fulfillAgentOrder(user.id, order.order_id, {
        proof_photo_ref: proof.localKey,
        proof_photo_filename: proof.fileName,
      })

      setDashboardSummary({
        totalEarnings: result.total_earnings,
        totalDeliveries: result.total_deliveries,
      })
      setActiveOrders((prev) => prev.filter((o) => o.order_id !== order.order_id))
    } catch (err) {
      setFulfillErrors((prev) => ({
        ...prev,
        [order.order_id]:
          err instanceof Error ? err.message : "Failed to fulfill order",
      }))
    } finally {
      setFulfillingOrderIds((prev) => prev.filter((id) => id !== order.order_id))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Bike className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">
              Aggie<span className="text-accent">Bites</span>
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                Driver
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5">
              <div
                className={`h-2 w-2 rounded-full ${
                  isOnline ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
                }`}
              />
              <span className="text-xs font-medium text-foreground">
                {isOnline ? "Online" : "Offline"}
              </span>
              <Switch
                checked={isOnline}
                onCheckedChange={setIsOnline}
                className="scale-75"
              />
            </div>
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
            <div className="hidden items-center gap-2 md:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {user?.name?.charAt(0) || "D"}
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
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Today's Earnings",
              value: `$${dashboardSummary.totalEarnings.toFixed(2)}`,
              icon: DollarSign,
              accent: true,
            },
            {
              label: "Weekly Earnings",
              value: `$${agentStats.weeklyEarnings.toFixed(2)}`,
              icon: TrendingUp,
              accent: false,
            },
            {
              label: "Total Deliveries",
              value: dashboardSummary.totalDeliveries.toString(),
              icon: Package,
              accent: false,
            },
            {
              label: "Rating",
              value: agentStats.rating.toFixed(2),
              icon: Star,
              accent: true,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    stat.accent
                      ? "bg-accent/20 text-accent-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-card-foreground">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Performance bar */}
        <div className="mb-8 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-card-foreground">
              Completion Rate
            </p>
            <span className="text-sm font-semibold text-accent-foreground">
              {agentStats.completionRate}%
            </span>
          </div>
          <Progress value={agentStats.completionRate} className="mt-3 h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            {agentStats.activeHours}h active today
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl bg-secondary p-1">
          {[
            { key: "available" as const, label: "Available", icon: Package },
            { key: "active" as const, label: "Active", icon: Bike },
            { key: "earnings" as const, label: "Earnings", icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Available Deliveries */}
        {activeTab === "available" && (
          <div className="space-y-4">
            {!isOnline ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                  <Bike className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  {"You're offline"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Go online to see available deliveries
                </p>
                <Button
                  className="mt-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setIsOnline(true)}
                >
                  Go Online
                </Button>
              </div>
            ) : (
              <>
                {isLoadingFeed && availableDeliveries.length === 0 && (
                  <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
                    Loading live delivery requests...
                  </div>
                )}
                {feedError && (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    {feedError}
                  </div>
                )}
                {!isLoadingFeed && !feedError && availableDeliveries.length === 0 && (
                  <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
                    No live delivery requests available right now.
                  </div>
                )}
                {availableDeliveries.map((delivery) => {
                  const isSubmitted = submittedBids.includes(delivery.id)
                  return (
                    <div
                      key={delivery.id}
                      className="rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-card-foreground">
                              {delivery.restaurant}
                            </h3>
                            {delivery.studentOnly && (
                              <Badge className="rounded-md bg-accent/20 text-accent-foreground text-[10px]">
                                <Users className="mr-1 h-3 w-3" />
                                Student Priority
                              </Badge>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {delivery.pickup}
                            </span>
                            <span className="flex items-center gap-1">
                              <ChevronRight className="h-3.5 w-3.5" />
                              {delivery.dropoff}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            <span>{delivery.distance}</span>
                            <span>{delivery.items} items</span>
                            <span className="font-medium text-accent-foreground">
                              Allowed: ${delivery.minBid.toFixed(2)} - ${delivery.maxBid.toFixed(2)}
                            </span>
                            {typeof delivery.leadingBid === "number" && (
                              <span className="font-medium text-primary">
                                Leading: ${delivery.leadingBid.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="w-full sm:w-60">
                          {isSubmitted ? (
                            <div className="flex items-center gap-2 rounded-xl bg-primary/10 p-3 text-sm font-medium text-primary">
                              <CheckCircle2 className="h-4 w-4" />
                              Bid submitted: ${bids[delivery.id]}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  step="0.25"
                                  min={delivery.minBid}
                                  max={delivery.maxBid}
                                  placeholder={`$${delivery.minBid.toFixed(2)} - $${delivery.maxBid.toFixed(2)}`}
                                  value={bids[delivery.id] || ""}
                                  onChange={(e) =>
                                    setBids((p) => ({
                                      ...p,
                                      [delivery.id]: e.target.value,
                                    }))
                                  }
                                  className="rounded-xl text-sm"
                                />
                                <Button
                                  size="sm"
                                  className="shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                                  onClick={() => submitBid(delivery)}
                                  disabled={!bids[delivery.id] || !user?.id}
                                >
                                  Bid
                                </Button>
                              </div>
                              {bidErrors[delivery.id] && (
                                <p className="text-xs text-destructive">
                                  {bidErrors[delivery.id]}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Countdown */}
                      <div className="mt-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                          <Timer className="h-3 w-3" />
                          {delivery.studentOnly
                            ? "Student-only bidding window"
                            : "Open bidding"}
                        </div>
                        <div className="mt-1">
                          <CountdownTimer seconds={delivery.biddingTimeLeft} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        {/* Active Deliveries */}
        {activeTab === "active" && (
          <div className="space-y-4">
            {!isOnline ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                  <Bike className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  {"You're offline"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Go online to manage active deliveries
                </p>
              </div>
            ) : (
              <>
                {isLoadingActiveOrders && activeOrders.length === 0 && (
                  <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
                    Loading active deliveries...
                  </div>
                )}
                {activeOrdersError && (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    {activeOrdersError}
                  </div>
                )}
                {!isLoadingActiveOrders &&
                  !activeOrdersError &&
                  activeOrders.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                        <Bike className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-card-foreground">
                        No active deliveries
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Won orders will appear here until you fulfill them
                      </p>
                    </div>
                  )}

                {activeOrders.map((order) => {
                  const proof = proofByOrder[order.order_id]
                  const isFulfilling = fulfillingOrderIds.includes(order.order_id)
                  return (
                    <div
                      key={order.order_id}
                      className="rounded-2xl border border-border bg-card p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-card-foreground">
                              {order.restaurant_name || `Order #${order.order_id}`}
                            </h3>
                            <Badge className="rounded-md bg-primary/10 text-primary text-[10px]">
                              Assigned
                            </Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Package className="h-3.5 w-3.5" />
                              {order.items_count} items
                            </span>
                            <span className="flex items-center gap-1">
                              <ChevronRight className="h-3.5 w-3.5" />
                              {order.delivery_address || "Customer address"}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Payout on fulfillment:{" "}
                            <span className="font-semibold text-accent-foreground">
                              ${order.delivery_fee.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="w-full sm:w-72 space-y-2">
                          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-foreground">
                            <Camera className="h-4 w-4" />
                            <Upload className="h-4 w-4" />
                            {proof?.fileName ? "Replace proof photo" : "Capture/Upload proof photo"}
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) =>
                                handleProofFileChange(
                                  order.order_id,
                                  e.target.files?.[0] || null
                                )
                              }
                            />
                          </label>
                          {proof?.previewDataUrl && (
                            <div className="rounded-xl border border-border p-2">
                              <img
                                src={proof.previewDataUrl}
                                alt={`Proof for order ${order.order_id}`}
                                className="h-24 w-full rounded-lg object-cover"
                              />
                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                {proof.fileName || "proof-photo"}
                              </p>
                            </div>
                          )}
                          <Button
                            className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => handleFulfillOrder(order)}
                            disabled={isFulfilling}
                          >
                            {isFulfilling ? "Fulfilling..." : `Fulfill & Get Paid $${order.delivery_fee.toFixed(2)}`}
                          </Button>
                          {fulfillErrors[order.order_id] && (
                            <p className="text-xs text-destructive">
                              {fulfillErrors[order.order_id]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        {/* Earnings */}
        {activeTab === "earnings" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="mt-1 text-3xl font-bold text-card-foreground">
                  ${agentStats.weeklyEarnings.toFixed(2)}
                </p>
                <div className="mt-3 flex items-center gap-1 text-sm text-accent-foreground">
                  <TrendingUp className="h-4 w-4" />
                  +12% from last week
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground">Deliveries</p>
                <p className="mt-1 text-3xl font-bold text-card-foreground">
                  {dashboardSummary.totalDeliveries}
                </p>
                <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4" />
                  Avg $4.50/delivery
                </div>
              </div>
            </div>

            {/* Recent Earnings */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 text-base font-semibold text-card-foreground">
                Recent Earnings
              </h3>
              <div className="space-y-3">
                {[
                  { day: "Today", deliveries: dashboardSummary.totalDeliveries, amount: dashboardSummary.totalEarnings },
                  { day: "Yesterday", deliveries: 6, amount: 55.75 },
                  { day: "Monday", deliveries: 5, amount: 48.00 },
                  { day: "Sunday", deliveries: 7, amount: 63.25 },
                  { day: "Saturday", deliveries: 8, amount: 75.50 },
                ].map((row) => (
                  <div
                    key={row.day}
                    className="flex items-center justify-between rounded-xl bg-secondary p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-secondary-foreground">
                        {row.day}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.deliveries} deliveries
                      </p>
                    </div>
                    <p className="font-semibold text-secondary-foreground">
                      ${row.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
