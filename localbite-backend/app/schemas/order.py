from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

class OrderBase(BaseModel):
    user_id: int
    restaurant_id: int
    assigned_partner_id: Optional[int] = None
    order_items: List[Dict]  # Each dict: item_id, quantity, customizations
    base_fare: float
    delivery_fee: float
    commission_amount: float
    order_status: Optional[str] = "pending"

class OrderCreate(OrderBase):
    pass  # For POST requests

class OrderResponse(OrderBase):
    order_id: int
    created_at: datetime

    class Config:
        orm_mode = True