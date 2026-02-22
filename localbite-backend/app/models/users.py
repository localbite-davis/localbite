from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String, unique=True, nullable=True)

    password_hash = Column(String, nullable=False)

    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)

    role = Column(String, default="customer")  # customer, delivery_partner, restaurant_admin, ddba_admin

    is_email_verified = Column(Boolean, default=False)
    is_phone_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    loyalty_points = Column(Integer, default=0)
    lifetime_spent = Column(Float, default=0.0)

    created_at = Column(DateTime, server_default=func.now())
