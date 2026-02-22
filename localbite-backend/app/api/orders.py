from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.order import OrderCreate, OrderOut, OrderUpdate
from app.crud import order as crud_order
from app.models.order import Order

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("/", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    return crud_order.create(db=db, payload=payload)

@router.get("/user/{user_id}", response_model=List[OrderOut])
def get_user_orders(user_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    orders = crud_order.get_by_user_id(db, user_id=user_id, skip=skip, limit=limit)
    return orders

@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    db_obj = crud_order.get_by_id(db, order_id=order_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_obj

@router.get("/", response_model=List[OrderOut])
def list_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_order.list_all(db, skip=skip, limit=limit)

@router.put("/{order_id}", response_model=OrderOut)
def update_order(order_id: int, payload: OrderUpdate, db: Session = Depends(get_db)):
    db_obj = crud_order.get_by_id(db, order_id=order_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Order not found")
    return crud_order.update(db=db, db_obj=db_obj, payload=payload)

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    db_obj = crud_order.get_by_id(db, order_id=order_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Order not found")
    crud_order.delete(db=db, db_obj=db_obj)
