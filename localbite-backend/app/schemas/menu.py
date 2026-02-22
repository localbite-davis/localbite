from pydantic import BaseModel
from typing import Optional

class MenuItemBase(BaseModel):
    restaurant_id: int
    item_name: str
    price: float
    availability: Optional[bool] = True
    category: Optional[str] = None

class MenuItemCreate(MenuItemBase):
    pass  # For POST requests

class MenuItemResponse(MenuItemBase):
    menu_id: int  # Primary key

    class Config:
        orm_mode = True