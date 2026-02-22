from sqlalchemy.orm import Session
from app.models.restaurant import Restaurant
from app.schemas.restaurant import RestaurantCreate, RestaurantUpdate


from app.core.security import get_password_hash

def create(db: Session, payload: RestaurantCreate) -> Restaurant:
    hashed_password = get_password_hash(payload.password)
    db_obj = Restaurant(
        name=payload.name,
        email=payload.email,
        description=payload.description,
        cuisine_type=payload.cuisine_type,
        address=payload.address,
        city=payload.city,
        state=payload.state,
        latitude=payload.latitude,
        longitude=payload.longitude,
        commission_rate=payload.commission_rate,
        is_active=payload.is_active,
        password_hash=hashed_password
    )
    # I should check if Restaurant has email in model.
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_by_id(db: Session, restaurant_id: int) -> Restaurant | None:
    return db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()


def list_all(db: Session, skip: int = 0, limit: int = 100) -> list[Restaurant]:
    return db.query(Restaurant).offset(skip).limit(limit).all()


def update(db: Session, db_obj: Restaurant, payload: RestaurantUpdate) -> Restaurant:
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(db_obj, field, value)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete(db: Session, db_obj: Restaurant) -> None:
    db.delete(db_obj)
    db.commit()
