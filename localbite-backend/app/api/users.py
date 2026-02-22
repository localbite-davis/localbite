from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.crud import users as users_crud
from app.database import get_db
from app.schemas.users import UserCreate, UserOut, UserUpdate
from app.models.users import User
from app.models.restaurant import Restaurant
from app.models.delivery_agent import DeliveryAgent
from app.core.security import SECRET_KEY, ALGORITHM
from jose import JWTError, jwt

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
def get_current_user_profile(request: Request, db: Session = Depends(get_db)):
    cookie_value = request.cookies.get("access_token")
    if not cookie_value:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = cookie_value
    if token.startswith("Bearer "):
        token = token.split(" ", 1)[1].strip()

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

    user_type = payload.get("user_type")
    user_id = payload.get("user_id")
    email = payload.get("sub")

    if not user_type or not user_id or not email:
        raise HTTPException(status_code=401, detail="Invalid authentication payload")

    if user_type == "user":
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "name": f"{user.first_name} {user.last_name}".strip(),
            "role": "customer",
            "user_type": user_type,
        }

    if user_type == "restaurant":
        restaurant = db.query(Restaurant).filter(Restaurant.id == int(user_id)).first()
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        return {
            "id": restaurant.id,
            "email": restaurant.email,
            "first_name": restaurant.name,
            "name": restaurant.name,
            "role": "restaurant",
            "user_type": user_type,
        }

    if user_type == "delivery_agent":
        agent = db.query(DeliveryAgent).filter(DeliveryAgent.agent_id == str(user_id)).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Delivery agent not found")
        return {
            "id": agent.agent_id,
            "email": agent.email,
            "first_name": agent.full_name,
            "name": agent.full_name,
            "role": "agent",
            "user_type": user_type,
        }

    raise HTTPException(status_code=401, detail="Unsupported user type")


@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    try:
        return users_crud.create(db, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Failed to create user. Email/phone may already exist",
        )


@router.get("/", response_model=list[UserOut])
def list_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    return users_crud.list_all(db, skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    db_obj = users_crud.get_by_id(db, user_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="User not found")
    return db_obj


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    db_obj = users_crud.get_by_id(db, user_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="User not found")
    try:
        return users_crud.update(db, db_obj, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Failed to update user. Email/phone may already exist",
        )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_obj = users_crud.get_by_id(db, user_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="User not found")
    users_crud.delete(db, db_obj)
    return None
