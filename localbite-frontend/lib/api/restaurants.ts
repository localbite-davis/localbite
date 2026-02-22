const API_URL = "http://172.26.56.184:8000/api/v1";

export interface Restaurant {
  id: number;
  name: string;
  description?: string;
  cuisine_type: string;
  address: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  commission_rate: number;
  is_active: boolean;
  is_approved: boolean;
}

export async function getRestaurants(
  skip: number = 0,
  limit: number = 100
): Promise<Restaurant[]> {
  try {
    const response = await fetch(
      `${API_URL}/restaurants?skip=${skip}&limit=${limit}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch restaurants");
    }

    const data: Restaurant[] = await response.json();
    return data.filter((r) => r.is_active && r.is_approved);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch restaurants: ${error.message}`);
    }
    throw new Error("Failed to fetch restaurants");
  }
}

export async function getRestaurantById(
  restaurantId: number
): Promise<Restaurant> {
  try {
    const response = await fetch(`${API_URL}/restaurants/${restaurantId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Restaurant not found");
    }

    const data: Restaurant = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch restaurant: ${error.message}`);
    }
    throw new Error("Failed to fetch restaurant");
  }
}
