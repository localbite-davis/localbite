from sqlalchemy.orm import Session
from app.models.menu import MenuItem
from app.schemas.menu import MenuItemCreate, MenuItemBase

def create(db: Session, payload: MenuItemCreate) -> MenuItem:
    db_obj = MenuItem(
        restaurant_id=payload.restaurant_id,
        item_name=payload.item_name,
        price=payload.price,
        availability=payload.availability,
        category=payload.category
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_by_id(db: Session, menu_id: int) -> MenuItem | None:
    return db.query(MenuItem).filter(MenuItem.menu_id == menu_id).first()

def list_by_restaurant(db: Session, restaurant_id: int, skip: int = 0, limit: int = 100) -> list[MenuItem]:
    return db.query(MenuItem).filter(MenuItem.restaurant_id == restaurant_id).offset(skip).limit(limit).all()

def update(db: Session, db_obj: MenuItem, payload: MenuItemBase) -> MenuItem:
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(db_obj, field, value)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete(db: Session, db_obj: MenuItem) -> None:
    db.delete(db_obj)
    db.commit()
