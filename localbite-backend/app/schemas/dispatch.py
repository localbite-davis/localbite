from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class DispatchStartRequest(BaseModel):
    delivery_address: str = Field(..., min_length=5)
    phase1_wait_seconds_min: int = Field(default=180, ge=1, le=1800)
    phase1_wait_seconds_max: int = Field(default=240, ge=1, le=1800)
    phase2_wait_seconds: int = Field(default=180, ge=1, le=1800)
    poll_interval_seconds: int = Field(default=5, ge=1, le=60)


class DispatchStartResponse(BaseModel):
    order_id: int
    dispatch_started: bool
    status: str
    phase: str
    phase1_wait_seconds_min: int
    phase1_wait_seconds_max: int
    phase2_wait_seconds: int
    poll_interval_seconds: int
    message: str


class DispatchStatusResponse(BaseModel):
    order_id: int
    is_running: bool
    status: str
    phase: str
    restaurant_id: Optional[int] = None
    delivery_address: Optional[str] = None
    phase1_wait_seconds: Optional[int] = None
    phase2_wait_seconds: Optional[int] = None
    note: Optional[str] = None
    updated_at: Optional[str] = None


class AgentAvailableDispatchItem(BaseModel):
    order_id: int
    restaurant_id: int
    restaurant_name: Optional[str] = None
    delivery_address: Optional[str] = None
    order_items_count: int = 0
    base_fare: float
    min_allowed_fare: float
    max_allowed_fare: float
    dispatch_status: str
    pool_phase: str
    student_only: bool
    bidding_time_left_seconds: int = 0
    dispatch_updated_at: Optional[str] = None
    leading_bid_amount: Optional[float] = None
    leading_bid_created_at: Optional[datetime] = None
    total_placed_bids: int = 0
    order_created_at: Optional[datetime] = None


class AgentAvailableDispatchResponse(BaseModel):
    agent_id: str
    agent_type: str
    items: list[AgentAvailableDispatchItem]
