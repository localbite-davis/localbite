from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base


class DeliveryBid(Base):
    __tablename__ = "delivery_bids"

    bid_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"), nullable=False, index=True)
    agent_id = Column(
        String, ForeignKey("delivery_agents.agent_id"), nullable=False, index=True
    )

    bid_amount = Column(Float, nullable=False)
    min_allowed_fare = Column(Float, nullable=False)
    max_allowed_fare = Column(Float, nullable=False)

    pool_phase = Column(String, nullable=False, default="student_pool")
    bid_status = Column(String, nullable=False, default="placed")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
