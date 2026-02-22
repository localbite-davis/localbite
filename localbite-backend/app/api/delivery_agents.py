from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.crud import delivery_agent as delivery_agent_crud
from app.database import get_db
from app.schemas.delivery_agent import (
    DeliveryAgentCreate,
    DeliveryAgentOut,
    DeliveryAgentUpdate,
)

router = APIRouter(prefix="/delivery-agents", tags=["delivery_agents"])


@router.post("/", response_model=DeliveryAgentOut, status_code=status.HTTP_201_CREATED)
def create_delivery_agent(
    payload: DeliveryAgentCreate, db: Session = Depends(get_db)
):
    try:
        return delivery_agent_crud.create(db, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Failed to create delivery agent. ID/email/phone may already exist",
        )


@router.get("/", response_model=list[DeliveryAgentOut])
def list_delivery_agents(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    return delivery_agent_crud.list_all(db, skip=skip, limit=limit)


@router.get("/{agent_id}", response_model=DeliveryAgentOut)
def get_delivery_agent(agent_id: str, db: Session = Depends(get_db)):
    db_obj = delivery_agent_crud.get_by_id(db, agent_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Delivery agent not found")
    return db_obj


@router.put("/{agent_id}", response_model=DeliveryAgentOut)
def update_delivery_agent(
    agent_id: str, payload: DeliveryAgentUpdate, db: Session = Depends(get_db)
):
    db_obj = delivery_agent_crud.get_by_id(db, agent_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Delivery agent not found")
    try:
        return delivery_agent_crud.update(db, db_obj, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Failed to update delivery agent. Email/phone may already exist",
        )


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_delivery_agent(agent_id: str, db: Session = Depends(get_db)):
    db_obj = delivery_agent_crud.get_by_id(db, agent_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Delivery agent not found")
    delivery_agent_crud.delete(db, db_obj)
    return None
