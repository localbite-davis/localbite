from pydantic import BaseModel, ConfigDict
from typing import Optional

class MenuItemBase(BaseModel):
    restaurant_id: int
    item_name: str
    price: float
    availability: Optional[bool] = True
    category: Optional[str] = None

class MenuItemCreate(MenuItemBase):
    pass  # For POST requests

class MenuItemUpdate(BaseModel):
    item_name: Optional[str] = None
    price: Optional[float] = None
    availability: Optional[bool] = None
    category: Optional[str] = None

class MenuItemOut(MenuItemBase):
    menu_id: int  # Primary key

    model_config = ConfigDict(from_attributes=True)
