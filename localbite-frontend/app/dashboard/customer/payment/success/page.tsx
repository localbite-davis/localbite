"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { startOrderDispatch } from "@/lib/api/dispatch"
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, user, isAuthLoading } = useAuth()
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  )
  const [error, setError] = useState<string | null>(null)
  const dispatchStartedRef = useRef(false)
  const hasRedirectedRef = useRef(false)
  const PROCESSING_TIMEOUT_MS = 5000

  const orderIdFromQuery = searchParams.get("order_id") || searchParams.get("orderId")

  const redirectToOrders = () => {
    if (hasRedirectedRef.current) return
    hasRedirectedRef.current = true
    setStatus("success")
    router.push("/dashboard/customer/orders")
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!hasRedirectedRef.current) {
        console.warn(
          `Payment success processing timed out after ${PROCESSING_TIMEOUT_MS}ms; assuming success`
        )
        redirectToOrders()
      }
    }, PROCESSING_TIMEOUT_MS)

    return () => window.clearTimeout(timeoutId)
  }, [router])

  useEffect(() => {
    const run = async () => {
      if (isAuthLoading) return

      if (!isAuthenticated) {
        router.replace("/login")
        return
      }

      if (dispatchStartedRef.current) {
        redirectToOrders()
        return
      }
      dispatchStartedRef.current = true

      try {
        const rawContext =
          typeof window !== "undefined"
            ? window.sessionStorage.getItem("pending_dispatch_context")
            : null
        const parsed = rawContext
          ? (JSON.parse(rawContext) as {
              orderId?: string
              deliveryAddress?: string
            })
          : undefined

        const parsedOrderId = Number(parsed?.orderId || orderIdFromQuery)
        if (Number.isFinite(parsedOrderId) && parsedOrderId > 0) {
          await Promise.race([
            startOrderDispatch(parsedOrderId, {
              delivery_address:
                parsed?.deliveryAddress || "Segundo Dining Commons, Davis, CA",
              phase1_wait_seconds_min: 15,
              phase1_wait_seconds_max: 15,
              phase2_wait_seconds: 15,
              poll_interval_seconds: 5,
            }),
            new Promise((resolve) =>
              window.setTimeout(resolve, PROCESSING_TIMEOUT_MS)
            ),
          ])
        } else {
          console.warn("No order_id found on payment success callback; skipping dispatch start")
        }
      } catch (err) {
        // Fail open for demo flow: treat payment as successful and continue.
        console.error("Dispatch start failed/timed out after payment success:", err)
      } finally {
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem("pending_dispatch_context")
        }
        redirectToOrders()
      }
    }

    run()
  }, [isAuthLoading, isAuthenticated, user, router, orderIdFromQuery])

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
