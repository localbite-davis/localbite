const API_URL = "http://localhost:8000/api/v1";

export interface PaymentCreateRequest {
  order_id: string;
  customer_id?: string;
  merchant_id: string;
  provider: string;
  amount_subtotal: number;
  amount_tax: number;
  amount_tip: number;
  amount_fees: number;
  amount_total: number;
  currency: string;
  payment_method: string;
  status: string;
  idempotency_key: string;
}

export interface PaymentResponse {
  payment_id: string;
  order_id: string;
  status: string;
  created_at: string;
}

export async function createPaymentIntent(
  payload: PaymentCreateRequest
): Promise<PaymentResponse> {
  try {
    const response = await fetch(`${API_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Payment API error:", error);
      throw new Error(error.detail || JSON.stringify(error) || "Failed to create payment intent");
    }

    const data: PaymentResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Payment creation error:", error);
    if (error instanceof Error) {
      throw new Error(`Payment creation failed: ${error.message}`);
    }
    throw new Error("Payment creation failed");
  }
}

export function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
