const API_URL = "http://localhost:8000/api/v1";

export interface OrderItem {
  item_id: number;
  quantity: number;
  customizations?: Record<string, any>;
}

export interface PlaceOrderRequest {
  user_id: number;
  restaurant_id: number;
  order_items: OrderItem[];
  base_fare: number;
  delivery_fee: number;
  commission_amount: number;
  order_status?: string;
}

export interface Order {
  order_id: number;
  user_id: number;
  restaurant_id: number;
  assigned_partner_id?: string;
  order_items: OrderItem[];
  base_fare: number;
  delivery_fee: number;
  commission_amount: number;
  order_status: string;
  created_at: string;
  restaurant?: {
    id: number;
    name: string;
    cuisine_type: string;
  };
}

export interface PlaceOrderResponse extends Order {}

export async function placeOrder(
  payload: PlaceOrderRequest
): Promise<PlaceOrderResponse> {
  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to place order");
    }

    const data: PlaceOrderResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Order placement failed: ${error.message}`);
    }
    throw new Error("Order placement failed");
  }
}

export async function getUserOrders(userId: number): Promise<Order[]> {
  try {
    const response = await fetch(`${API_URL}/orders/user/${userId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user orders");
    }

    const data: Order[] = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }
    throw new Error("Failed to fetch user orders");  }
}

export async function listOrders(
  skip: number = 0,
  limit: number = 100
): Promise<Order[]> {
  try {
    const response = await fetch(
      `${API_URL}/orders?skip=${skip}&limit=${limit}`,
      {
        credentials: "include",
        cache: "no-store",
      }
    )

    if (!response.ok) {
      throw new Error("Failed to fetch orders")
    }

    const data: Order[] = await response.json()
    return data
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch orders: ${error.message}`)
    }
    throw new Error("Failed to fetch orders")
  }
}
