from sqlalchemy.orm import Session
from app.models.delivery_bid import DeliveryBid


def create(
    db: Session,
    *,
    order_id: int,
    agent_id: str,
    bid_amount: float,
    min_allowed_fare: float,
    max_allowed_fare: float,
    pool_phase: str,
) -> DeliveryBid:
    db_obj = DeliveryBid(
        order_id=order_id,
        agent_id=agent_id,
        bid_amount=bid_amount,
        min_allowed_fare=min_allowed_fare,
        max_allowed_fare=max_allowed_fare,
        pool_phase=pool_phase,
        bid_status="placed",
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_by_id(db: Session, bid_id: int) -> DeliveryBid | None:
    return db.query(DeliveryBid).filter(DeliveryBid.bid_id == bid_id).first()


def list_by_order(db: Session, order_id: int) -> list[DeliveryBid]:
    return (
        db.query(DeliveryBid)
        .filter(DeliveryBid.order_id == order_id)
        .order_by(DeliveryBid.created_at.desc(), DeliveryBid.bid_id.desc())
        .all()
    )


def list_by_agent(db: Session, agent_id: str) -> list[DeliveryBid]:
    return (
        db.query(DeliveryBid)
        .filter(DeliveryBid.agent_id == agent_id)
        .order_by(DeliveryBid.created_at.desc(), DeliveryBid.bid_id.desc())
        .all()
    )
