from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    first_name: str
    last_name: str
    role: str = "customer"
    is_email_verified: bool = False
    is_phone_verified: bool = False
    is_active: bool = True
    loyalty_points: int = 0
    lifetime_spent: float = 0.0


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password_hash: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    is_email_verified: Optional[bool] = None
    is_phone_verified: Optional[bool] = None
    is_active: Optional[bool] = None
    loyalty_points: Optional[int] = None
    lifetime_spent: Optional[float] = None


class UserOut(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
