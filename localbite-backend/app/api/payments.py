from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.crud import payments as payments_crud
from app.database import get_db
from app.schemas.payments import PaymentCreate, PaymentOut, PaymentUpdate

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def create_payment(payload: PaymentCreate, db: Session = Depends(get_db)):
    try:
        return payments_crud.create(db, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Failed to create payment. Idempotency key may already exist",
        )


@router.get("/", response_model=list[PaymentOut])
def list_payments(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    return payments_crud.list_all(db, skip=skip, limit=limit)


@router.get("/{payment_id}", response_model=PaymentOut)
def get_payment(payment_id: UUID, db: Session = Depends(get_db)):
    db_obj = payments_crud.get_by_id(db, payment_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Payment not found")
    return db_obj


@router.put("/{payment_id}", response_model=PaymentOut)
def update_payment(
    payment_id: UUID, payload: PaymentUpdate, db: Session = Depends(get_db)
):
    db_obj = payments_crud.get_by_id(db, payment_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Payment not found")
    try:
        return payments_crud.update(db, db_obj, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to update payment")


@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment(payment_id: UUID, db: Session = Depends(get_db)):
    db_obj = payments_crud.get_by_id(db, payment_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Payment not found")
    payments_crud.delete(db, db_obj)
    return None
