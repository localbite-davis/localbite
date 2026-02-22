import math
from app.schemas.fare import FareRecommendationRequest


def resolve_distance_km(payload: FareRecommendationRequest) -> tuple[float, str]:
    if payload.distance_km is not None:
        return payload.distance_km, "input_distance"

    start = payload.restaurant_location
    end = payload.user_location

    if (
        start.latitude is None
        or start.longitude is None
        or end.latitude is None
        or end.longitude is None
    ):
        raise ValueError(
            "distance_km is required when latitude/longitude is missing for "
            "restaurant_location or user_location"
        )

    return _haversine_km(
        start.latitude,
        start.longitude,
        end.latitude,
        end.longitude,
    ), "haversine"


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    earth_radius_km = 6371.0

    lat1_r = math.radians(lat1)
    lon1_r = math.radians(lon1)
    lat2_r = math.radians(lat2)
    lon2_r = math.radians(lon2)

    d_lat = lat2_r - lat1_r
    d_lon = lon2_r - lon1_r

    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return earth_radius_km * c
