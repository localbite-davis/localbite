from sqlalchemy.orm import Session
from app.models.delivery_agent import DeliveryAgent
from app.schemas.delivery_agent import DeliveryAgentCreate, DeliveryAgentUpdate


def create(db: Session, payload: DeliveryAgentCreate) -> DeliveryAgent:
    db_obj = DeliveryAgent(**payload.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_by_id(db: Session, agent_id: str) -> DeliveryAgent | None:
    return db.query(DeliveryAgent).filter(DeliveryAgent.agent_id == agent_id).first()


def list_all(db: Session, skip: int = 0, limit: int = 100) -> list[DeliveryAgent]:
    return db.query(DeliveryAgent).offset(skip).limit(limit).all()


def update(
    db: Session, db_obj: DeliveryAgent, payload: DeliveryAgentUpdate
) -> DeliveryAgent:
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(db_obj, field, value)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete(db: Session, db_obj: DeliveryAgent) -> None:
    db.delete(db_obj)
    db.commit()
