from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field


class LocationInput(BaseModel):
    address: str = Field(..., min_length=3)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)


class IncentiveMetrics(BaseModel):
    demand_index: float = Field(
        default=1.0,
        ge=0.5,
        le=2.0,
        description="1.0 is normal demand. Higher means more demand.",
    )
    supply_index: float = Field(
        default=1.0,
        ge=0.5,
        le=2.0,
        description="1.0 is normal supply. Lower means fewer available agents.",
    )
    weather_severity: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Weather impact from 0.0 (clear) to 1.0 (severe).",
    )


class FareRecommendationRequest(BaseModel):
    user_location: LocationInput
    restaurant_location: LocationInput
    distance_km: Optional[float] = Field(
        default=None,
        gt=0,
        description="Optional precomputed distance from external distance API.",
    )
    request_time: Optional[datetime] = Field(
        default=None,
        description="If omitted, current server time is used.",
    )
    incentive_metrics: IncentiveMetrics = Field(default_factory=IncentiveMetrics)


class FareBreakdown(BaseModel):
    distance_km: float
    base_pickup_fee: float
    distance_component: float
    time_multiplier: float
    peak_multiplier: float
    incentive_multiplier: float
    pricing_version: Literal["v1"]
    distance_source: Literal["input_distance", "haversine"]


class FareRecommendationResponse(BaseModel):
    base_fare: float = Field(..., description="Bidding minimum for delivery agents.")
    max_bid_limit: float = Field(..., description="Maximum allowed bid (1.5x base fare).")
    eta_estimate_minutes: int
    breakdown: FareBreakdown
