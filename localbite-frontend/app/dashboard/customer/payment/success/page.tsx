"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { startOrderDispatch } from "@/lib/api/dispatch"
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

const API_URL = "http://localhost:8000/api/v1"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, user, isAuthReady } = useAuth()
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  )
  const [error, setError] = useState<string | null>(null)
  const dispatchStartedRef = useRef(false)

  const sessionId = searchParams.get("session_id")
  const orderIdFromQuery = searchParams.get("order_id") || searchParams.get("orderId")

  useEffect(() => {
    // Wait until auth initialization completes
    if (!isAuthReady) return

    // If not authenticated after auth is ready => send to login
    if (!isAuthenticated) {
      router.replace("/login")
      return
    }

    // Authenticated: show success then navigate to cart
    setStatus("success")
    router.push("/dashboard/customer/cart")
  }, [isAuthReady, isAuthenticated, user, router])

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md space-y-4 rounded-2xl border border-border bg-card p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">
            Completing Payment...
          </h2>
          <p className="text-muted-foreground">
            Please wait while we process your order
          </p>
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md space-y-4 rounded-2xl border border-border bg-card p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">
            Payment Error
          </h2>
          <p className="text-sm text-destructive">{error}</p>
          <Button
            onClick={() => router.back()}
            className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md space-y-4 rounded-2xl border border-border bg-card p-8 text-center">
        <div className="flex justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Payment Successful!
        </h2>
        <p className="text-muted-foreground">
          Your order has been confirmed and dispatch is starting
        </p>
        <p className="text-sm text-muted-foreground">
          Redirecting to your orders...
        </p>
        <Button
          onClick={() => router.push("/dashboard/customer/orders")}
          className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
        >
          View Orders
        </Button>
      </div>
    </div>
  )
}
