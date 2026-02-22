from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, EmailStr, model_validator


class AgentType(str, Enum):
    STUDENT = "student"
    NORMAL = "normal"


class VehicleType(str, Enum):
    BIKE = "bike"
    SCOOTER = "scooter"
    CAR = "car"
    WALK = "walk"


class DeliveryAgent(BaseModel):
    """Defines the data model for a DeliveryAgent"""

    # Identity
    agent_id: str = Field(..., description="Unique identifier for the delivery agent")
    full_name: str
    email: Optional[EmailStr] = None
    phone_number: str
    # Classification
    agent_type: AgentType
    # Student-specific fields
    university_name: Optional[str] = None
    student_id: Optional[str] = None
    # Operational details
    vehicle_type: VehicleType
    is_active: bool = Field(default=True, description="Whether agent is currently active")
    is_verified: bool = Field(default=False, description="KYC / background verification status")
    # Ratings & metrics
    rating: float = Field(default=5.0, ge=1.0, le=5.0)
    total_deliveries: int = Field(default=0, ge=0)
    # Availability & location
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    # Financials
    base_payout_per_delivery: float = Field(..., ge=0)
    bonus_multiplier: float = Field(default=1.0, ge=0)
    # Metadata
    created_at: Optional[int] = Field(
        default=None,
        description="Unix timestamp of agent creation"
    )

    @model_validator(mode="after")
    def validate_student_fields(self):
        if self.agent_type == AgentType.STUDENT:
            if not self.university_name or not self.student_id:
                raise ValueError("Student agents must have university_name and student_id")
        return self