from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.crud import restaurant as restaurant_crud
from app.database import get_db
from app.schemas.restaurant import (
    RestaurantCreate,
    RestaurantOut,
    RestaurantUpdate,
)

router = APIRouter(prefix="/restaurants", tags=["restaurants"])


@router.post("/", response_model=RestaurantOut, status_code=status.HTTP_201_CREATED)
def create_restaurant(payload: RestaurantCreate, db: Session = Depends(get_db)):
    try:
        return restaurant_crud.create(db, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to create restaurant")


@router.get("/", response_model=list[RestaurantOut])
def list_restaurants(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    return restaurant_crud.list_all(db, skip=skip, limit=limit)


@router.get("/{restaurant_id}", response_model=RestaurantOut)
def get_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    db_obj = restaurant_crud.get_by_id(db, restaurant_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return db_obj


@router.put("/{restaurant_id}", response_model=RestaurantOut)
def update_restaurant(
    restaurant_id: int, payload: RestaurantUpdate, db: Session = Depends(get_db)
):
    db_obj = restaurant_crud.get_by_id(db, restaurant_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    try:
        return restaurant_crud.update(db, db_obj, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to update restaurant")


@router.delete("/{restaurant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    db_obj = restaurant_crud.get_by_id(db, restaurant_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    restaurant_crud.delete(db, db_obj)
    return None
