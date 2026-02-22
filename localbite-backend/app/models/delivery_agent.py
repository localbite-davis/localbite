from enum import Enum as PyEnum
from sqlalchemy import Boolean, Column, DateTime, Enum, Float, Integer, String
from sqlalchemy.sql import func
from app.database import Base


class AgentType(str, PyEnum):
    STUDENT = "student"
    NORMAL = "normal"


class VehicleType(str, PyEnum):
    BIKE = "bike"
    SCOOTER = "scooter"
    CAR = "car"
    WALK = "walk"


class DeliveryAgent(Base):
    __tablename__ = "delivery_agents"

    agent_id = Column(String, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=True, index=True)
    password_hash = Column(String, nullable=False)
    phone_number = Column(String, unique=True, nullable=False)

    agent_type = Column(
        Enum(AgentType, name="agent_type_enum"),
        nullable=False,
        default=AgentType.NORMAL,
    )
    university_name = Column(String, nullable=True)
    student_id = Column(String, nullable=True)

    vehicle_type = Column(
        Enum(VehicleType, name="vehicle_type_enum"),
        nullable=False,
    )
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    rating = Column(Float, default=5.0)
    total_deliveries = Column(Integer, default=0)

    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)

    base_payout_per_delivery = Column(Float, nullable=False)
    bonus_multiplier = Column(Float, default=1.0)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
