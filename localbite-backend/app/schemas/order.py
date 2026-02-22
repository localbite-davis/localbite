from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Optional
from datetime import datetime

class OrderBase(BaseModel):
    user_id: int
    restaurant_id: int
    assigned_partner_id: Optional[str] = None
    order_items: List[Dict]  # Each dict: item_id, quantity, customizations
    base_fare: float
    delivery_fee: float
    commission_amount: float
    order_status: Optional[str] = "pending"

class OrderCreate(OrderBase):
    pass  # For POST requests

class OrderUpdate(BaseModel):
    order_status: Optional[str] = None
    assigned_partner_id: Optional[str] = None

class OrderOut(OrderBase):
    order_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
