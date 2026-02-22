"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

const API_URL = "http://localhost:8000/api/v1"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, user } = useAuth()
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  )
  const [error, setError] = useState<string | null>(null)

  const sessionId = searchParams.get("session_id")

  useEffect(() => {
    // Check if user is authenticated
    const checkAndRedirect = async () => {
      // If user is authenticated, proceed
      if (isAuthenticated && user) {
        setStatus("success")
        
        // Redirect immediately (no delay)
        router.push("/dashboard/customer")
        return
      }
      
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.replace("/login")
        return
      }
      
      // Otherwise wait for auth to initialize
      setStatus("success")
      setTimeout(() => {
        router.push("/dashboard/customer")
      }, 1000)
    }

    checkAndRedirect()
  }, [isAuthenticated, user, router])

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
          Your order has been confirmed and is now being prepared
        </p>
        <p className="text-sm text-muted-foreground">
          Redirecting to your orders...
        </p>
        <Button
          onClick={() => router.push("/dashboard/customer")}
          className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  )
}
