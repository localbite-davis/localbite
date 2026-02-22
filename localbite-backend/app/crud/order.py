from sqlalchemy.orm import Session
from app.models.order import Order
from app.schemas.order import OrderCreate, OrderBase

def create(db: Session, payload: OrderCreate) -> Order:
    db_obj = Order(
        user_id=payload.user_id,
        restaurant_id=payload.restaurant_id,
        assigned_partner_id=payload.assigned_partner_id,
        order_items=payload.order_items,
        base_fare=payload.base_fare,
        delivery_fee=payload.delivery_fee,
        commission_amount=payload.commission_amount,
        order_status=payload.order_status
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_by_id(db: Session, order_id: int) -> Order | None:
    return db.query(Order).filter(Order.order_id == order_id).first()

def list_all(db: Session, skip: int = 0, limit: int = 100) -> list[Order]:
    return db.query(Order).offset(skip).limit(limit).all()

def update(db: Session, db_obj: Order, payload: OrderBase) -> Order:
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(db_obj, field, value)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete(db: Session, db_obj: Order) -> None:
    db.delete(db_obj)
    db.commit()
