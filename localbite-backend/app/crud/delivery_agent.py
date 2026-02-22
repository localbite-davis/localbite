from sqlalchemy.orm import Session
from app.models.delivery_agent import DeliveryAgent
from app.schemas.delivery_agent import DeliveryAgentCreate, DeliveryAgentUpdate


from app.core.security import get_password_hash

def create(db: Session, payload: DeliveryAgentCreate) -> DeliveryAgent:
    hashed_password = get_password_hash(payload.password)
    db_obj = DeliveryAgent(
        agent_id=payload.agent_id,
        full_name=payload.full_name,
        email=payload.email,
        phone_number=payload.phone_number,
        password_hash=hashed_password,
        agent_type=payload.agent_type,
        university_name=payload.university_name,
        student_id=payload.student_id,
        kerberos_id=getattr(payload, "kerberos_id", None),
        background_check_status=getattr(payload, "background_check_status", None),
        vehicle_type=payload.vehicle_type,
        is_active=payload.is_active,
        is_verified=payload.is_verified,
        rating=payload.rating,
        total_deliveries=payload.total_deliveries,
        current_lat=payload.current_lat,
        current_lng=payload.current_lng,
        base_payout_per_delivery=payload.base_payout_per_delivery,
        bonus_multiplier=payload.bonus_multiplier,
    )
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
