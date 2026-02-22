"use client"

import { useAuth } from "@/context/auth-context"
import { User, Mail, MapPin, CreditCard, Bell, Shield, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

export default function ProfilePage() {
  const { user, logout } = useAuth()

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>

      {/* Avatar & Info */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
          {user?.name?.charAt(0) || "U"}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-card-foreground">
            {user?.name}
          </h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <p className="text-xs text-muted-foreground">UC Davis Student</p>
        </div>
      </div>

      {/* Personal Info */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-card-foreground">
          <User className="h-4 w-4" />
          Personal Information
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Full Name</Label>
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
              defaultValue="(530) 555-0123"
              className="rounded-xl"
              readOnly
            />
          </div>
          <div className="space-y-2">
            <Label>Delivery Address</Label>
            <Input
              defaultValue="Segundo Dining Commons"
              className="rounded-xl"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-card-foreground">
          <Bell className="h-4 w-4" />
          Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-card-foreground">
                Order Notifications
              </p>
              <p className="text-xs text-muted-foreground">
                Get updates on your delivery status
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-card-foreground">
                Promotional Emails
              </p>
              <p className="text-xs text-muted-foreground">
                Deals from your favorite restaurants
              </p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-card-foreground">
                Student Driver Preference
              </p>
              <p className="text-xs text-muted-foreground">
                Prefer UC Davis student drivers
              </p>
            </div>
            <Switch defaultChecked />
          </div>
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
  )
}
