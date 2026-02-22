"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2 } from "lucide-react"

const API_URL = "http://localhost:8000/api/v1"

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [amount, setAmount] = useState<number | null>(null)
  const [paymentReady, setPaymentReady] = useState(false)

  const orderId = searchParams.get("orderId")
  const amountParam = searchParams.get("amount")
  const deliveryAddressParam = searchParams.get("deliveryAddress")

  useEffect(() => {
    const initPayment = async () => {
      try {
        if (!user?.id) {
          setError("User information not available")
          setPaymentReady(true) // Set ready even on error to show error message
          return
        }

        if (!orderId) {
          setError("Order ID not found. Please place an order first.")
          setPaymentReady(true) // Set ready even on error to show error message
          return
        }

        // If amount was passed as query parameter, parse and use it
        if (amountParam) {
          const parsedAmount = parseInt(amountParam, 10)
          if (!isNaN(parsedAmount) && parsedAmount > 0) {
            setAmount(parsedAmount)
            setPaymentReady(true)
            return
          }
        }

        // Otherwise try to fetch order details
        try {
          const orderResponse = await fetch(`${API_URL}/orders/${orderId}`, {
            credentials: "include",
          })
          
          if (orderResponse.ok) {
            const orderData = await orderResponse.json()
            console.log("Order data:", orderData)
            
            // Calculate: delivery + service fee (1.99)
            const calculatedAmount = Math.round(
              (orderData.delivery_fee + 1.99 + orderData.base_fare) * 100
            )
            
            setAmount(calculatedAmount || 3500)
          } else {
            setAmount(3500)
          }
        } catch (fetchErr) {
          console.error("Order fetch error:", fetchErr)
          setAmount(3500)
        }

        setPaymentReady(true)
      } catch (err) {
        setError("Failed to initialize payment")
        setPaymentReady(true) // Set ready even on error to show error message
      }
    }

    if (orderId) {
      if (user?.id) {
        initPayment()
      } else {
        // Wait a bit for user to load
        const timer = setTimeout(() => {
          if (!user?.id) {
            setError("User information not available")
            setPaymentReady(true)
          } else {
            initPayment()
          }
        }, 1000)
        return () => clearTimeout(timer)
      }
    } else {
      setError("Order ID not found. Please place an order first.")
      setPaymentReady(true)
    }
  }, [orderId, amountParam, user?.id])

  const handlePaymentClick = async () => {
    if (!orderId || !user?.id || amount === null || amount === undefined) return

    setIsLoading(true)
    setError(null)

    try {
      if (typeof window !== "undefined" && orderId) {
        window.sessionStorage.setItem(
          "pending_dispatch_context",
          JSON.stringify({
            orderId,
            deliveryAddress:
              deliveryAddressParam || "Segundo Dining Commons, Davis, CA",
          })
        )
      }

      // Create Stripe checkout session directly with order info
      // Skip full payment creation for now, just use order data
      const checkoutResponse = await fetch(
        `${API_URL}/payments/stripe/checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payment_id: `payment_${Date.now()}`, // Generate temp ID
            order_id: orderId,
            amount: amount,
          }),
          credentials: "include",
        }
      )

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json()
        console.error("Checkout error:", errorData)
        throw new Error(errorData.detail || "Failed to create checkout session")
      }

      const { url } = await checkoutResponse.json()

      // Redirect to mock Stripe checkout
      window.location.href = url
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Payment failed"
      setError(errorMessage)
      console.error("Payment error:", err)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6 rounded-2xl border border-border bg-card p-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment</h1>
          <p className="mt-1 text-muted-foreground">
            Order ID: {orderId}
          </p>
        </div>

        {error && (
          <div className="flex gap-3 rounded-lg bg-destructive/10 p-4">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {!paymentReady ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-secondary/50 p-4">
              <p className="text-sm text-muted-foreground">Amount to pay</p>
              <p className="text-3xl font-bold text-foreground">
                ${(amount! / 100).toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Card Details
              </label>
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">
                  Use test card: 4242 4242 4242 4242
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Exp: Any future date, CVC: Any 3 digits
                </p>
              </div>
            </div>

            <Button
              onClick={handlePaymentClick}
              disabled={isLoading}
              className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting to Stripe...
                </>
              ) : (
                `Pay $${(amount! / 100).toFixed(2)}`
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Your payment information is secure and encrypted
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
