const API_URL = "http://localhost:8000/api/v1"

export interface LocationInput {
  address: string
  latitude?: number
  longitude?: number
}

export interface FareRecommendationRequest {
  user_location: LocationInput
  restaurant_location: LocationInput
  distance_km?: number
  request_time?: string
  incentive_metrics?: {
    demand_index?: number
    supply_index?: number
    weather_severity?: number
  }
}

export interface FareRecommendationResponse {
  base_fare: number
  max_bid_limit: number
  eta_estimate_minutes: number
  breakdown: {
    distance_km: number
    base_pickup_fee: number
    distance_component: number
    time_multiplier: number
    peak_multiplier: number
    incentive_multiplier: number
    pricing_version: "v1"
    distance_source: "input_distance" | "haversine"
  }
}

export async function getFareRecommendation(
  payload: FareRecommendationRequest
): Promise<FareRecommendationResponse> {
  const response = await fetch(`${API_URL}/fares/recommendation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let detail = "Failed to get fare recommendation"
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
