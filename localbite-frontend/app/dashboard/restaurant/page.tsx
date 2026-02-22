"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useTheme } from "next-themes"
import {
  restaurantOrders,
  restaurantMenuItems,
  restaurantStats,
} from "@/lib/mock-data"
import {
  Store,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Star,
  Clock,
  ChefHat,
  CheckCircle2,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Moon,
  Sun,
  BarChart3,
  UtensilsCrossed,
  Package,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type OrderStatus = "new" | "preparing" | "ready"

const statusConfig: Record<
  OrderStatus,
  { label: string; icon: typeof AlertCircle; color: string; nextStatus: OrderStatus | null; nextLabel: string }
> = {
  new: {
    label: "New",
    icon: AlertCircle,
    color: "bg-accent/20 text-accent-foreground",
    nextStatus: "preparing",
    nextLabel: "Start Preparing",
  },
  preparing: {
    label: "Preparing",
    icon: ChefHat,
    color: "bg-primary/20 text-primary",
    nextStatus: "ready",
    nextLabel: "Mark Ready",
  },
  ready: {
    label: "Ready",
    icon: CheckCircle2,
    color: "bg-secondary text-secondary-foreground",
    nextStatus: null,
    nextLabel: "Complete",
  },
}

export default function RestaurantDashboard() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<"orders" | "menu" | "analytics" | "settings">("orders")
  const [orders, setOrders] = useState(restaurantOrders)
  const [menuItems, setMenuItems] = useState(restaurantMenuItems)
  const [orderFilter, setOrderFilter] = useState<"all" | OrderStatus>("all")

  // Menu Management State
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    category: "Main Course",
    description: "",
  })

  // Fetch Menu Items
  useEffect(() => {
    if (activeTab === "menu" && user?.id) {
      const fetchMenuItems = async () => {
        try {
          const response = await fetch(`http://localhost:8000/api/v1/menu/restaurant/${user.id}`)
          if (response.ok) {
            const data = await response.json()
            // Map backend fields to frontend expected format
            const mappedItems = data.map((item: any) => ({
              id: item.menu_id,
              name: item.item_name,
              price: item.price,
              category: item.category || "Main Course",
              available: item.availability,
              description: "", // Backend doesn't support description yet
              sold: 0, // Mock for now
              rating: 0, // Mock for now
            }))
            setMenuItems(mappedItems)
          } else {
            console.error("Failed to fetch menu items")
          }
        } catch (error) {
          console.error("Error fetching menu items:", error)
        }
      }

      fetchMenuItems()
    }
  }, [activeTab, user?.id])

  const handleAddItem = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const payload = {
        restaurant_id: user.id,
        item_name: newItem.name,
        price: parseFloat(newItem.price),
        category: newItem.category,
        availability: true
      };

      const response = await fetch("http://localhost:8000/api/v1/menu/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        // Add to local state
        const addedItem = {
           id: data.menu_id,
           name: data.item_name,
           price: data.price,
           category: data.category || "Main Course",
           available: data.availability,
           description: "",
           sold: 0,
           rating: 0
        };
        setMenuItems(prev => [...prev, addedItem]);
        setIsAddItemOpen(false);
        setNewItem({ name: "", price: "", category: "Main Course", description: "" });
      } else {
        const err = await response.json();
        alert(`Failed to add item: ${err.detail || "Unknown error"}`);
      }
    } catch (error) {
       console.error("Error adding item:", error);
       alert("Error adding item");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const config = statusConfig[order.status as OrderStatus]
          if (config?.nextStatus) {
            return { ...order, status: config.nextStatus }
          }
        }
        return order
      })
    )
  }

  const toggleMenuAvailability = (itemId: string) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, available: !item.available } : item
      )
    )
  }

  const filteredOrders =
    orderFilter === "all"
      ? orders
      : orders.filter((o) => o.status === orderFilter)

  const newCount = orders.filter((o) => o.status === "new").length
  const preparingCount = orders.filter((o) => o.status === "preparing").length
  const readyCount = orders.filter((o) => o.status === "ready").length

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <div className="flex items-center gap-2 p-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary">
            <Store className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-sidebar-foreground">
              Aggie<span className="text-sidebar-primary">Bites</span>
            </p>
            <p className="text-[10px] text-sidebar-foreground/60">
              Restaurant Partner
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {[
            { key: "orders" as const, label: "Orders", icon: ShoppingBag, badge: newCount },
            { key: "menu" as const, label: "Menu", icon: UtensilsCrossed, badge: 0 },
            { key: "analytics" as const, label: "Analytics", icon: BarChart3, badge: 0 },
            { key: "settings" as const, label: "Settings", icon: Settings, badge: 0 },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === item.key
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.badge > 0 && (
                <Badge className="ml-auto h-5 w-5 items-center justify-center rounded-full bg-sidebar-primary p-0 text-[10px] text-sidebar-primary-foreground">
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
              {user?.name?.charAt(0) || "R"}
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-sidebar-foreground">
                {user?.name}
              </p>
              <p className="text-[10px] text-sidebar-foreground/60">
                {user?.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-7 w-7 rounded-lg text-sidebar-foreground/50 hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1">
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Store className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">
                Aggie<span className="text-accent">Bites</span>
              </span>
            </div>
            <h1 className="hidden text-lg font-semibold text-foreground lg:block">
              {activeTab === "orders" && "Orders"}
              {activeTab === "menu" && "Menu Management"}
              {activeTab === "analytics" && "Analytics"}
              {activeTab === "settings" && "Settings"}
            </h1>
            <div className="flex items-center gap-2">
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
            </div>
          </div>

          {/* Mobile tabs */}
          <div className="flex overflow-x-auto border-t border-border/50 lg:hidden">
            {[
              { key: "orders" as const, label: "Orders", icon: ShoppingBag },
              { key: "menu" as const, label: "Menu", icon: UtensilsCrossed },
              { key: "analytics" as const, label: "Stats", icon: BarChart3 },
              { key: "settings" as const, label: "Settings", icon: Settings },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs ${
                  activeTab === tab.key
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <div className="p-6">
          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid gap-3 grid-cols-3">
                {[
                  { label: "New", count: newCount, color: "bg-accent/20 text-accent-foreground" },
                  { label: "Preparing", count: preparingCount, color: "bg-primary/20 text-primary" },
                  { label: "Ready", count: readyCount, color: "bg-secondary text-secondary-foreground" },
                ].map((s) => (
                  <button
                    key={s.label}
                    onClick={() =>
                      setOrderFilter(
                        orderFilter === s.label.toLowerCase()
                          ? "all"
                          : (s.label.toLowerCase() as OrderStatus)
                      )
                    }
                    className={`rounded-2xl border p-4 text-center transition-all hover:shadow-md ${
                      orderFilter === s.label.toLowerCase()
                        ? "border-primary bg-card shadow-md"
                        : "border-border bg-card"
                    }`}
                  >
                    <p className="text-2xl font-bold text-card-foreground">{s.count}</p>
                    <Badge className={`mt-1 rounded-md text-[10px] ${s.color}`}>
                      {s.label}
                    </Badge>
                  </button>
                ))}
              </div>

              {/* Order List */}
              <div className="space-y-3">
                {filteredOrders.map((order) => {
                  const config = statusConfig[order.status as OrderStatus]
                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-muted-foreground">
                              {order.id}
                            </span>
                            <Badge className={`rounded-md text-[10px] ${config?.color}`}>
                              {config && <config.icon className="mr-1 h-3 w-3" />}
                              {config?.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {order.time}
                            </span>
                          </div>
                          <p className="mt-1 font-medium text-card-foreground">
                            {order.customerName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-lg font-semibold text-card-foreground">
                            ${order.total.toFixed(2)}
                          </p>
                          {config?.nextStatus && (
                            <Button
                              size="sm"
                              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                              onClick={() => updateOrderStatus(order.id)}
                            >
                              {config.nextLabel}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Menu Tab */}
          {activeTab === "menu" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {menuItems.length} items
                </p>
                <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => setIsAddItemOpen(true)}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Menu Item</DialogTitle>
                    <DialogDescription>
                      Create a new item for your restaurant's menu.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="price" className="text-right">
                        Price
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        value={newItem.price}
                        onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="category" className="text-right">
                        Category
                      </Label>
                       <Select
                        onValueChange={(value) =>
                          setNewItem({ ...newItem, category: value })
                        }
                        defaultValue={newItem.category}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Main Course">Main Course</SelectItem>
                          <SelectItem value="Appetizer">Appetizer</SelectItem>
                          <SelectItem value="Dessert">Dessert</SelectItem>
                          <SelectItem value="Drink">Drink</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddItem} disabled={loading}>
                        {loading ? "Adding..." : "Add Item"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              </div>

              <div className="space-y-3">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <UtensilsCrossed className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>${item.price.toFixed(2)}</span>
                          <span>|</span>
                          <span>{item.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-medium ${
                            item.available
                              ? "text-green-600 dark:text-green-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {item.available ? "Available" : "Unavailable"}
                        </span>
                        <Switch
                          checked={item.available}
                          onCheckedChange={() => toggleMenuAvailability(item.id)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    label: "Today's Revenue",
                    value: `$${restaurantStats.todayRevenue.toFixed(2)}`,
                    icon: DollarSign,
                    accent: true,
                  },
                  {
                    label: "Weekly Revenue",
                    value: `$${restaurantStats.weeklyRevenue.toFixed(2)}`,
                    icon: TrendingUp,
                    accent: false,
                  },
                  {
                    label: "Total Orders",
                    value: restaurantStats.totalOrders.toString(),
                    icon: ShoppingBag,
                    accent: false,
                  },
                  {
                    label: "Avg Order Value",
                    value: `$${restaurantStats.avgOrderValue.toFixed(2)}`,
                    icon: BarChart3,
                    accent: false,
                  },
                  {
                    label: "Most Popular",
                    value: restaurantStats.popularItem,
                    icon: Star,
                    accent: true,
                  },
                  {
                    label: "Rating",
                    value: restaurantStats.rating.toString(),
                    icon: Star,
                    accent: true,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
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

              {/* Daily Breakdown */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="mb-4 text-base font-semibold text-card-foreground">
                  Daily Performance
                </h3>
                <div className="space-y-3">
                  {[
                    { day: "Today", orders: 64, revenue: 847.50 },
                    { day: "Yesterday", orders: 58, revenue: 780.25 },
                    { day: "Monday", orders: 72, revenue: 920.00 },
                    { day: "Sunday", orders: 45, revenue: 610.75 },
                    { day: "Saturday", orders: 89, revenue: 1071.50 },
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
                          {row.orders} orders
                        </p>
                      </div>
                      <p className="font-semibold text-secondary-foreground">
                        ${row.revenue.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="mx-auto max-w-2xl space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-card-foreground">
                  <Store className="h-4 w-4" />
                  Business Profile
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Restaurant Name</Label>
                    <Input
                      defaultValue={user?.name}
                      className="rounded-xl"
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      defaultValue={user?.email}
                      className="rounded-xl"
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      defaultValue="(530) 555-4321"
                      className="rounded-xl"
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      defaultValue="226 E St, Davis, CA 95616"
                      className="rounded-xl"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-card-foreground">
                  <Clock className="h-4 w-4" />
                  Operating Hours
                </h3>
                <div className="space-y-3 text-sm">
                  {[
                    { day: "Monday - Friday", hours: "10:00 AM - 10:00 PM" },
                    { day: "Saturday", hours: "11:00 AM - 11:00 PM" },
                    { day: "Sunday", hours: "11:00 AM - 9:00 PM" },
                  ].map((row) => (
                    <div
                      key={row.day}
                      className="flex items-center justify-between rounded-xl bg-secondary p-3"
                    >
                      <span className="font-medium text-secondary-foreground">
                        {row.day}
                      </span>
                      <span className="text-muted-foreground">{row.hours}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                onClick={logout}
                className="w-full rounded-xl text-destructive hover:bg-destructive/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
