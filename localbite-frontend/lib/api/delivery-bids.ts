const API_URL = "http://localhost:8000/api/v1"

export type PoolPhase = "student_pool" | "all_agents"
export type BidStatus = "placed" | "accepted" | "rejected" | "expired" | "withdrawn"

export interface DeliveryBidCreateRequest {
  order_id: number
  agent_id: string
  bid_amount: number
  pool_phase: PoolPhase
}

export interface DeliveryBid {
  bid_id: number
  order_id: number
  agent_id: string
  bid_amount: number
  min_allowed_fare: number
  max_allowed_fare: number
  pool_phase: PoolPhase
  bid_status: BidStatus
  created_at: string
  updated_at?: string | null
}

export async function placeDeliveryBid(
  payload: DeliveryBidCreateRequest
): Promise<DeliveryBid> {
  const response = await fetch(`${API_URL}/delivery-bids/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let detail: unknown = "Failed to place bid"
    try {
      const err = await response.json()
      detail = err.detail ?? detail
    } catch {
      // ignore parse errors
    }
    throw new Error(
      typeof detail === "string" ? detail : JSON.stringify(detail)
    )
  }

  return response.json()
}

export async function listOrderBids(orderId: number): Promise<DeliveryBid[]> {
  const response = await fetch(`${API_URL}/delivery-bids/orders/${orderId}`, {
    credentials: "include",
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("Failed to fetch order bids")
  }

  return response.json()
}
