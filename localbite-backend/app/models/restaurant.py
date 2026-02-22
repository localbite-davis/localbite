
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    cuisine_type = Column(String, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, default="Davis")
    state = Column(String, default="CA")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    commission_rate = Column(Float, default=0.10)
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())