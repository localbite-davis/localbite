from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.users import UserCreate, UserOut
from app.schemas.restaurant import RestaurantCreate, RestaurantOut
from app.schemas.delivery_agent import DeliveryAgentCreate

# Import CRUD functions
from app.crud import users as crud_users
from app.crud import restaurant as crud_restaurant
from app.crud import delivery_agent as crud_delivery_agent

# Import models for existence checks (or extend CRUD to have get_by_email)
from app.models.users import User
from app.models.restaurant import Restaurant
from app.models.delivery_agent import DeliveryAgent


router = APIRouter(prefix="/register", tags=["Registration"])

@router.post("/user", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    # Ideally CRUD should have get_by_email
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    return crud_users.create(db=db, payload=payload)

@router.post("/restaurant", response_model=RestaurantOut, status_code=status.HTTP_201_CREATED)
def register_restaurant(payload: RestaurantCreate, db: Session = Depends(get_db)):
    # Check existence
    existing_rest = db.query(Restaurant).filter(Restaurant.email == payload.email).first()
    if existing_rest:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    return crud_restaurant.create(db=db, payload=payload)

@router.post("/delivery-agent", status_code=status.HTTP_201_CREATED)
def register_delivery_agent(payload: DeliveryAgentCreate, db: Session = Depends(get_db)):
    # Check existence
    existing_agent = db.query(DeliveryAgent).filter(DeliveryAgent.email == payload.email).first()
    if existing_agent:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    return crud_delivery_agent.create(db=db, payload=payload)
