from fastapi import APIRouter
from .restaurants import router as restaurants_router
from .users import router as users_router
from .delivery_agents import router as delivery_agents_router
from .payments import router as payments_router

api_router = APIRouter()
api_router.include_router(restaurants_router)
api_router.include_router(users_router)
api_router.include_router(delivery_agents_router)
api_router.include_router(payments_router)

__all__ = ["api_router"]
