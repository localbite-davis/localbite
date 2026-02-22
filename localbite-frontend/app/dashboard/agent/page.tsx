"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useTheme } from "next-themes"
import { availableDeliveries, agentStats } from "@/lib/mock-data"
import {
  Bike,
  DollarSign,
  Clock,
  Star,
  MapPin,
  Package,
  TrendingUp,
  LogOut,
  Moon,
  Sun,
  UtensilsCrossed,
  Timer,
  Users,
  Zap,
  ChevronRight,
  CheckCircle2,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"

function CountdownTimer({ seconds: initialSeconds }: { seconds: number }) {
  const [seconds, setSeconds] = useState(initialSeconds)

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const progress = (seconds / 180) * 100

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

export default function AgentDashboard() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [isOnline, setIsOnline] = useState(false)
  const [bids, setBids] = useState<Record<string, string>>({})
  const [submittedBids, setSubmittedBids] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<"available" | "active" | "earnings">("available")

  const submitBid = (deliveryId: string) => {
    if (bids[deliveryId]) {
      setSubmittedBids((prev) => [...prev, deliveryId])
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
          <Link href="/dashboard/agent" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Bike className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">
              Aggie<span className="text-accent">Bites</span>
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                Driver
              </span>
            </span>
          </Link>
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
              value: `$${agentStats.todayEarnings.toFixed(2)}`,
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
              value: agentStats.totalDeliveries.toString(),
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
              availableDeliveries.map((delivery) => {
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
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{delivery.distance}</span>
                          <span>{delivery.items} items</span>
                          <span className="font-medium text-accent-foreground">
                            Est. {delivery.estimatedPay}
                          </span>
                        </div>
                      </div>

                      <div className="w-full sm:w-52">
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
                                min="1"
                                placeholder="Your bid ($)"
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
                                onClick={() => submitBid(delivery.id)}
                                disabled={!bids[delivery.id]}
                              >
                                Bid
                              </Button>
                            </div>
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
              })
            )}
          </div>
        )}

        {/* Active Deliveries */}
        {activeTab === "active" && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
              <Bike className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-card-foreground">
              No active deliveries
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Bid on available orders to start delivering
            </p>
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
                  {agentStats.totalDeliveries}
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
                  { day: "Today", deliveries: 4, amount: 42.50 },
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
