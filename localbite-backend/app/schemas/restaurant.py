from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class RestaurantBase(BaseModel):
    name: str
    description: Optional[str] = None
    cuisine_type: str
    address: str
    city: str = "Davis"
    state: str = "CA"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    commission_rate: float = 0.10
    is_active: bool = True
    is_approved: bool = False


class RestaurantCreate(RestaurantBase):
    email: str # Or EmailStr, need to import if not available
    password: str


class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cuisine_type: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    commission_rate: Optional[float] = None
    is_active: Optional[bool] = None
    is_approved: Optional[bool] = None


class RestaurantOut(RestaurantBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
