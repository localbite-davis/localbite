from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.users import UserCreate, UserOut
from app.schemas.restaurant import RestaurantCreate, RestaurantOut
from app.schemas.delivery_agent import DeliveryAgentCreate, DeliveryAgentOut
from app.models.delivery_agent import AgentType
from uuid import uuid4
import logging
import traceback

logger = logging.getLogger("app.register")

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

@router.post("/delivery-agent", response_model=DeliveryAgentOut, status_code=status.HTTP_201_CREATED)
def register_delivery_agent(payload: DeliveryAgentCreate, db: Session = Depends(get_db)):
    # Ensure email is provided and valid (EmailStr in schema validates format when present)
    if not payload.email:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Email is required")

    # Check existence
    existing_agent = db.query(DeliveryAgent).filter(DeliveryAgent.email == payload.email).first()
    if existing_agent:
        raise HTTPException(status_code=400, detail="Email already registered")

    email_lower = payload.email.lower()

    # If email belongs to UC Davis, automatically mark agent as student and verified and
    # generate a mock kerberos_id to simulate Kerberos integration.
    if email_lower.endswith("@ucdavis.edu"):
        # Ensure student-specific fields are present so Pydantic validation passes
        # even if the frontend didn't include them.
        u_name = getattr(payload, "university_name", None) or "UC Davis"
        s_id = getattr(payload, "student_id", None) or f"ucd_{int(uuid4().int % 10_000_000)}"

        updated_payload = payload.model_copy(update={
            "agent_type": AgentType.STUDENT,
            "is_verified": True,
            "kerberos_id": str(uuid4()),
            "background_check_status": None,
            "university_name": u_name,
            "student_id": s_id,
        })
    else:
        # Non-UC Davis emails are treated as third-party; require background check
        updated_payload = payload.model_copy(update={
            "agent_type": AgentType.THIRD_PARTY,
            "is_verified": False,
            "kerberos_id": None,
            "background_check_status": "pending",
        })

    try:
        logger.info("Registering delivery agent email=%s agent_id=%s", updated_payload.email, updated_payload.agent_id)
        created = crud_delivery_agent.create(db=db, payload=updated_payload)
        return created
    except Exception as e:
        # Log full traceback server-side for debugging, but return a safe HTTP error
        tb = traceback.format_exc()
        logger.error("Error creating delivery agent: %s\n%s", e, tb)
        # Include the error message in the HTTP response detail to help the frontend debug in dev.
        raise HTTPException(status_code=500, detail=str(e))
