const API_URL = "http://172.26.56.184:8000/api/v1"

export interface DispatchStartRequest {
  delivery_address: string
  phase1_wait_seconds_min?: number
  phase1_wait_seconds_max?: number
  phase2_wait_seconds?: number
  poll_interval_seconds?: number
}

export interface DispatchStartResponse {
  order_id: number
  dispatch_started: boolean
  status: string
  phase: string
  phase1_wait_seconds_min: number
  phase1_wait_seconds_max: number
  phase2_wait_seconds: number
  poll_interval_seconds: number
  message: string
}

export interface DispatchStatusResponse {
  order_id: number
  is_running: boolean
  status: string
  phase: string
  restaurant_id?: number | null
  delivery_address?: string | null
  phase1_wait_seconds?: number | null
  phase2_wait_seconds?: number | null
  note?: string | null
  updated_at?: string | null
}

export interface AgentAvailableDispatchItem {
  order_id: number
  restaurant_id: number
  restaurant_name?: string | null
  delivery_address?: string | null
  order_items_count: number
  base_fare: number
  min_allowed_fare: number
  max_allowed_fare: number
  dispatch_status: string
  pool_phase: "student_pool" | "all_agents" | string
  student_only: boolean
  bidding_time_left_seconds: number
  dispatch_updated_at?: string | null
  leading_bid_amount?: number | null
  leading_bid_created_at?: string | null
  total_placed_bids: number
  order_created_at?: string | null
}

export interface AgentAvailableDispatchResponse {
  agent_id: string
  agent_type: string
  items: AgentAvailableDispatchItem[]
}

export async function startOrderDispatch(
  orderId: number,
  payload: DispatchStartRequest
): Promise<DispatchStartResponse> {
  const response = await fetch(`${API_URL}/dispatch/orders/${orderId}/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let detail = "Failed to start dispatch"
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

export async function getDispatchStatus(
  orderId: number
): Promise<DispatchStatusResponse> {
  const response = await fetch(`${API_URL}/dispatch/orders/${orderId}/status`, {
    credentials: "include",
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("Failed to fetch dispatch status")
  }

  return response.json()
}

export async function getAvailableDispatchRequestsForAgent(
  agentId: string,
  limit: number = 100
): Promise<AgentAvailableDispatchResponse> {
  const response = await fetch(
    `${API_URL}/dispatch/agents/${agentId}/available?limit=${limit}`,
    {
      credentials: "include",
      cache: "no-store",
    }
  )

  if (!response.ok) {
    let detail = "Failed to fetch agent dispatch feed"
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
