const API_URL = "http://localhost:8000/api/v1"

export type AgentType = "student" | "third_party"

export interface DeliveryAgent {
  agent_id: string
  full_name: string
  email?: string | null
  phone_number: string
  agent_type: AgentType
  university_name?: string | null
  student_id?: string | null
  kerberos_id?: string | null
  background_check_status?: string | null
  vehicle_type: string
  is_active: boolean
  is_verified: boolean
  rating: number
  total_deliveries: number
  total_earnings?: number
  current_lat?: number | null
  current_lng?: number | null
  base_payout_per_delivery: number
  bonus_multiplier: number
  created_at: string
  updated_at: string
}

export interface AgentActiveOrder {
  order_id: number
  restaurant_id: number
  restaurant_name?: string | null
  delivery_address?: string | null
  order_status: string
  items_count: number
  delivery_fee: number
  created_at: string
  assigned_at?: string | null
}

export interface AgentActiveOrdersResponse {
  agent_id: string
  total_earnings: number
  total_deliveries: number
  active_orders: AgentActiveOrder[]
}

export interface FulfillDeliveryRequest {
  proof_photo_ref: string
  proof_photo_filename?: string
}

export interface FulfillDeliveryResponse {
  agent_id: string
  order_id: number
  order_status: string
  payout_amount: number
  payout_status: string
  total_earnings: number
  total_deliveries: number
  delivered_at: string
  proof_photo_ref: string
}

export async function getDeliveryAgentById(
  agentId: string
): Promise<DeliveryAgent> {
  const response = await fetch(`${API_URL}/delivery-agents/${agentId}`, {
    credentials: "include",
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("Failed to fetch delivery agent profile")
  }

  return response.json()
}

export async function getAgentActiveOrders(
  agentId: string
): Promise<AgentActiveOrdersResponse> {
  const response = await fetch(`${API_URL}/delivery-agents/${agentId}/active-orders`, {
    credentials: "include",
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("Failed to fetch active orders")
  }

  return response.json()
}

export async function fulfillAgentOrder(
  agentId: string,
  orderId: number,
  payload: FulfillDeliveryRequest
): Promise<FulfillDeliveryResponse> {
  const response = await fetch(
    `${API_URL}/delivery-agents/${agentId}/orders/${orderId}/fulfill`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    }
  )

  if (!response.ok) {
    let detail = "Failed to fulfill order"
    try {
      const err = await response.json()
      detail = err.detail || detail
    } catch {
      // ignore parse errors
    }
    throw new Error(detail)
  }

  return response.json()
}
