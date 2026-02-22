from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


PoolPhase = Literal["student_pool", "all_agents"]
BidStatus = Literal["placed", "accepted", "rejected", "expired", "withdrawn"]


class DeliveryBidCreate(BaseModel):
    order_id: int = Field(..., gt=0)
    agent_id: str = Field(..., min_length=1)
    bid_amount: float = Field(..., gt=0)
    pool_phase: PoolPhase = "student_pool"


class DeliveryBidUpdate(BaseModel):
    bid_status: Optional[BidStatus] = None


class DeliveryBidOut(BaseModel):
    bid_id: int
    order_id: int
    agent_id: str
    bid_amount: float
    min_allowed_fare: float
    max_allowed_fare: float
    pool_phase: PoolPhase
    bid_status: BidStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DeliveryBidListItem(DeliveryBidOut):
    pass
