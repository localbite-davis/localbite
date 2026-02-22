from sqlalchemy import Column, Integer, Float, String, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Order(Base):
    __tablename__ = "orders"

    order_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    assigned_partner_id = Column(String, ForeignKey("delivery_agents.agent_id"), nullable=True)
    order_items = Column(JSON, nullable=False)  # Store items as JSON
    base_fare = Column(Float, nullable=False)
    delivery_fee = Column(Float, nullable=False)
    commission_amount = Column(Float, nullable=False)
    order_status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="orders")
    restaurant = relationship("Restaurant", back_populates="orders")