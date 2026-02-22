"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PaymentCancelPage() {
  const router = useRouter()
  const { isAuthenticated, isAuthReady } = useAuth()

  useEffect(() => {
    if (!isAuthReady) return
    if (!isAuthenticated) {
      router.replace("/login")
    }
  }, [isAuthReady, isAuthenticated, router])

  if (!isAuthReady) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md space-y-4 rounded-2xl border border-border bg-card p-8 text-center">
        <div className="flex justify-center">
          <XCircle className="h-12 w-12 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Payment Cancelled
        </h2>
        <p className="text-muted-foreground">
          Your payment was cancelled. Your order has not been charged.
        </p>
        <div className="space-y-2">
          <Button
            onClick={() => router.back()}
            className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Try Again
          </Button>
          <Button
            onClick={() => router.push("/dashboard/customer/cart")}
            variant="outline"
            className="w-full rounded-xl"
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
