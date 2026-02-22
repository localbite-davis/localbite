from uuid import UUID
from sqlalchemy.orm import Session
from app.models.payments import Payment
from app.schemas.payments import PaymentCreate, PaymentUpdate


def create(db: Session, payload: PaymentCreate) -> Payment:
    db_obj = Payment(**payload.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_by_id(db: Session, payment_id: UUID) -> Payment | None:
    return db.query(Payment).filter(Payment.payment_id == payment_id).first()


def list_all(db: Session, skip: int = 0, limit: int = 100) -> list[Payment]:
    return db.query(Payment).offset(skip).limit(limit).all()


def update(db: Session, db_obj: Payment, payload: PaymentUpdate) -> Payment:
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(db_obj, field, value)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete(db: Session, db_obj: Payment) -> None:
    db.delete(db_obj)
    db.commit()
