from fastapi import APIRouter, HTTPException
from app.schemas.fare import FareRecommendationRequest, FareRecommendationResponse
from app.services.base_fare import get_fare_recommendation

router = APIRouter(prefix="/fares", tags=["fares"])


@router.post("/recommendation", response_model=FareRecommendationResponse)
def fare_recommendation(payload: FareRecommendationRequest):
    try:
        return get_fare_recommendation(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
