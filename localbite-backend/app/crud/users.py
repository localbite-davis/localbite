from sqlalchemy.orm import Session
from app.models.users import User
from app.schemas.users import UserCreate, UserUpdate


from app.core.security import get_password_hash

def create(db: Session, payload: UserCreate) -> User:
    hashed_password = get_password_hash(payload.password)
    db_obj = User(
        email=payload.email,
        phone=payload.phone,
        password_hash=hashed_password,
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=payload.role,
        is_email_verified=payload.is_email_verified,
        is_phone_verified=payload.is_phone_verified,
        is_active=payload.is_active,
        loyalty_points=payload.loyalty_points,
        lifetime_spent=payload.lifetime_spent,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def list_all(db: Session, skip: int = 0, limit: int = 100) -> list[User]:
    return db.query(User).offset(skip).limit(limit).all()


def update(db: Session, db_obj: User, payload: UserUpdate) -> User:
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(db_obj, field, value)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete(db: Session, db_obj: User) -> None:
    db.delete(db_obj)
    db.commit()
