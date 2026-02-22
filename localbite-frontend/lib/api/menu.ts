const API_URL = "http://172.26.56.184:8000/api/v1";

export interface MenuItem {
  menu_id: number;
  restaurant_id: number;
  item_name: string;
  price: number;
  category?: string;
  availability: boolean;
}

export async function getMenuByRestaurant(
  restaurantId: number,
  skip: number = 0,
  limit: number = 100
): Promise<MenuItem[]> {
  try {
    const response = await fetch(
      `${API_URL}/menu/restaurant/${restaurantId}?skip=${skip}&limit=${limit}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch menu items");
    }

    const data: MenuItem[] = await response.json();
    return data.filter((item) => item.availability);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch menu: ${error.message}`);
    }
    throw new Error("Failed to fetch menu");
  }
}

export async function getMenuItem(menuId: number): Promise<MenuItem> {
  try {
    const response = await fetch(`${API_URL}/menu/${menuId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Menu item not found");
    }

    const data: MenuItem = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch menu item: ${error.message}`);
    }
    throw new Error("Failed to fetch menu item");
  }
}
