from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from datetime import timedelta
import os
from dotenv import load_dotenv

from typing import Union
from app.database import get_db
from app.models import User, Restaurant, DeliveryAgent
from app.schemas.auth import LoginRequest, Token
from app.core.security import verify_password, create_access_token

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Authentication"])
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
COOKIE_NAME = "access_token"

def create_auth_cookie(response: Response, user_email: str, user_type: str, user_id: Union[int, str]):
    """
    Creates an access token and sets it as an HTTP-only cookie.
    """
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_email, "user_id": str(user_id), "user_type": user_type},
        expires_delta=access_token_expires
    )
    
    # Set HTTP-only cookie
    response.set_cookie(
        key=COOKIE_NAME,
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False, # Set to True in production with HTTPS
    )
    return {"message": "Login successful", "access_token": access_token, "token_type": "bearer"}

@router.post("/login/user")
def login_user(form_data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.email).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return create_auth_cookie(response, user.email, "user", user.id)

@router.post("/login/restaurant")
def login_restaurant(form_data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).filter(Restaurant.email == form_data.email).first()
    if not restaurant or not verify_password(form_data.password, restaurant.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return create_auth_cookie(response, restaurant.email, "restaurant", restaurant.id)

@router.post("/login/delivery-agent")
def login_delivery_agent(form_data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    agent = db.query(DeliveryAgent).filter(DeliveryAgent.email == form_data.email).first()
    if not agent or not verify_password(form_data.password, agent.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # DeliveryAgent uses agent_id (String) as primary key in current version
    return create_auth_cookie(response, agent.email, "delivery_agent", agent.agent_id)

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME)
    return {"message": "Logout successful"}
