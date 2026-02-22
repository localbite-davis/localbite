import math
from datetime import datetime
from app.schemas.fare import FareBreakdown, FareRecommendationRequest, FareRecommendationResponse
from app.services.distance import resolve_distance_km

# Pricing knobs for bidding minimum.
BASE_PICKUP_FEE = 2.25
PER_KM_RATE = 0.95
MIN_BASE_FARE = 3.25
MAX_BASE_FARE = 35.00


def get_fare_recommendation(payload: FareRecommendationRequest) -> FareRecommendationResponse:
    distance_km, distance_source = resolve_distance_km(payload)
    request_time = payload.request_time or datetime.now()
    hour = request_time.hour

    time_multiplier = _time_of_day_multiplier(hour)
    peak_multiplier = _peak_hour_multiplier(hour)
    incentive_multiplier = _incentive_multiplier(
        payload.incentive_metrics.demand_index,
        payload.incentive_metrics.supply_index,
        payload.incentive_metrics.weather_severity,
    )

    distance_component = distance_km * PER_KM_RATE
    raw_fare = (BASE_PICKUP_FEE + distance_component) * time_multiplier
    raw_fare *= peak_multiplier * incentive_multiplier

    base_fare = round(_clamp(raw_fare, MIN_BASE_FARE, MAX_BASE_FARE), 2)
    eta_minutes = _estimate_eta_minutes(
        distance_km=distance_km,
        peak_multiplier=peak_multiplier,
        weather_severity=payload.incentive_metrics.weather_severity,
    )

    return FareRecommendationResponse(
        base_fare=base_fare,
        eta_estimate_minutes=eta_minutes,
        breakdown=FareBreakdown(
            distance_km=round(distance_km, 2),
            base_pickup_fee=BASE_PICKUP_FEE,
            distance_component=round(distance_component, 2),
            time_multiplier=time_multiplier,
            peak_multiplier=peak_multiplier,
            incentive_multiplier=incentive_multiplier,
            pricing_version="v1",
            distance_source=distance_source,
        ),
    )


def _time_of_day_multiplier(hour: int) -> float:
    if 0 <= hour < 6:
        return 1.12
    if 6 <= hour < 11:
        return 1.00
    if 11 <= hour < 14:
        return 1.08
    if 14 <= hour < 17:
        return 0.97
    if 17 <= hour < 22:
        return 1.12
    return 1.05


def _peak_hour_multiplier(hour: int) -> float:
    if 11 <= hour < 14 or 18 <= hour < 22:
        return 1.12
    return 1.00


def _incentive_multiplier(
    demand_index: float,
    supply_index: float,
    weather_severity: float,
) -> float:
    demand_supply_ratio = demand_index / max(supply_index, 0.1)
    pressure_component = _clamp((demand_supply_ratio - 1.0) * 0.25, -0.20, 0.40)
    weather_component = weather_severity * 0.15
    return round(_clamp(1.0 + pressure_component + weather_component, 0.80, 1.60), 3)


def _estimate_eta_minutes(
    distance_km: float, peak_multiplier: float, weather_severity: float
) -> int:
    base_speed_kmph = 28.0
    peak_penalty = 0.90 if peak_multiplier > 1.0 else 1.0
    weather_penalty = 1.0 - (0.25 * weather_severity)
    effective_speed_kmph = max(8.0, base_speed_kmph * peak_penalty * weather_penalty)

    travel_minutes = (distance_km / effective_speed_kmph) * 60
    dispatch_buffer = 8
    eta = math.ceil(travel_minutes + dispatch_buffer)
    return max(10, eta)


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))
