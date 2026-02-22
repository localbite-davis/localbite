from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator
from app.models.delivery_agent import AgentType, VehicleType


class DeliveryAgentBase(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone_number: str
    agent_type: AgentType = AgentType.NORMAL
    university_name: Optional[str] = None
    student_id: Optional[str] = None
    vehicle_type: VehicleType
    is_active: bool = True
    is_verified: bool = False
    rating: float = Field(default=5.0, ge=1.0, le=5.0)
    total_deliveries: int = Field(default=0, ge=0)
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    base_payout_per_delivery: float = Field(..., ge=0)
    bonus_multiplier: float = Field(default=1.0, ge=0)

    @model_validator(mode="after")
    def validate_student_fields(self):
        if self.agent_type == AgentType.STUDENT:
            if not self.university_name or not self.student_id:
                raise ValueError(
                    "Student agents must have university_name and student_id"
                )
        return self


class DeliveryAgentCreate(DeliveryAgentBase):
    agent_id: str


class DeliveryAgentUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    agent_type: Optional[AgentType] = None
    university_name: Optional[str] = None
    student_id: Optional[str] = None
    vehicle_type: Optional[VehicleType] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    rating: Optional[float] = Field(default=None, ge=1.0, le=5.0)
    total_deliveries: Optional[int] = Field(default=None, ge=0)
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    base_payout_per_delivery: Optional[float] = Field(default=None, ge=0)
    bonus_multiplier: Optional[float] = Field(default=None, ge=0)


class DeliveryAgentOut(DeliveryAgentBase):
    agent_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
