import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import delivery_bid as delivery_bid_crud
from app.crud import delivery_agent as delivery_agent_crud
from app.crud import order as order_crud
from app.database import get_db
from app.dispatch.engine import mark_order_assigned
from app.models.delivery_agent import AgentType
from app.schemas.delivery_bid import DeliveryBidCreate, DeliveryBidOut
from app.services.base_fare import get_bid_window

router = APIRouter(prefix="/delivery-bids", tags=["delivery_bids"])
logger = logging.getLogger("api.delivery_bids")


def _bid_rank_key(bid):
    return (
        round(float(bid.bid_amount), 2),
        bid.created_at or datetime.max.replace(tzinfo=timezone.utc),
        bid.bid_id,
    )


async def _accept_bid_and_assign(bid_id: int, db: Session) -> DeliveryBidOut:
    bid = delivery_bid_crud.get_by_id(db, bid_id)
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")

    order = order_crud.get_by_id(db, bid.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found for bid")
    if order.assigned_partner_id and order.assigned_partner_id != bid.agent_id:
        raise HTTPException(status_code=409, detail="Order already assigned to another agent")

    if bid.bid_status == "accepted":
        return bid
    if bid.bid_status != "placed":
        raise HTTPException(
            status_code=409, detail=f"Cannot accept bid with status '{bid.bid_status}'"
        )

    agent = delivery_agent_crud.get_by_id(db, bid.agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Delivery agent not found for bid")
    if not agent.is_active:
        raise HTTPException(status_code=403, detail="Inactive delivery agent cannot be assigned")

    competing_bids = delivery_bid_crud.list_by_order(db, bid.order_id)

    bid.bid_status = "accepted"
    order.assigned_partner_id = bid.agent_id
    order.delivery_fee = bid.bid_amount
    order.order_status = "assigned"

    for other in competing_bids:
        if other.bid_id == bid.bid_id:
            continue
        if other.bid_status == "placed":
            other.bid_status = "rejected"

    db.add(order)
    db.add(bid)
    db.commit()
    db.refresh(bid)

    try:
        await mark_order_assigned(order.order_id, bid.agent_id)
    except Exception:
        logger.exception(
            "Failed to update dispatch assignment state in Redis for order %s",
            order.order_id,
        )

    return bid


@router.post("/", response_model=DeliveryBidOut, status_code=status.HTTP_201_CREATED)
def place_delivery_bid(payload: DeliveryBidCreate, db: Session = Depends(get_db)):
    order = order_crud.get_by_id(db, payload.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.assigned_partner_id:
        raise HTTPException(status_code=409, detail="Order is already assigned")

    agent = delivery_agent_crud.get_by_id(db, payload.agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Delivery agent not found")
    if not agent.is_active:
        raise HTTPException(status_code=403, detail="Inactive delivery agent cannot bid")

    if payload.pool_phase == "student_pool" and agent.agent_type != AgentType.STUDENT:
        raise HTTPException(
            status_code=403,
            detail="Only student delivery agents can bid during student_pool phase",
        )

    min_allowed_fare, max_allowed_fare = get_bid_window(order.base_fare)
    bid_amount = round(payload.bid_amount, 2)

    if bid_amount < min_allowed_fare or bid_amount > max_allowed_fare:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Bid amount is outside allowed fare window",
                "min_allowed_fare": min_allowed_fare,
                "max_allowed_fare": max_allowed_fare,
                "submitted_bid_amount": bid_amount,
            },
        )

    return delivery_bid_crud.create(
        db,
        order_id=payload.order_id,
        agent_id=payload.agent_id,
        bid_amount=bid_amount,
        min_allowed_fare=min_allowed_fare,
        max_allowed_fare=max_allowed_fare,
        pool_phase=payload.pool_phase,
    )


@router.get("/orders/{order_id}", response_model=list[DeliveryBidOut])
def list_order_bids(order_id: int, db: Session = Depends(get_db)):
    order = order_crud.get_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return delivery_bid_crud.list_by_order(db, order_id)


@router.get("/agents/{agent_id}", response_model=list[DeliveryBidOut])
def list_agent_bids(agent_id: str, db: Session = Depends(get_db)):
    agent = delivery_agent_crud.get_by_id(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Delivery agent not found")
    return delivery_bid_crud.list_by_agent(db, agent_id)


@router.post("/{bid_id}/accept", response_model=DeliveryBidOut)
async def accept_delivery_bid(bid_id: int, db: Session = Depends(get_db)):
    return await _accept_bid_and_assign(bid_id, db)


@router.post("/orders/{order_id}/auto-award", response_model=DeliveryBidOut)
async def auto_award_best_bid(order_id: int, db: Session = Depends(get_db)):
    order = order_crud.get_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.assigned_partner_id:
        raise HTTPException(status_code=409, detail="Order is already assigned")

    bids = delivery_bid_crud.list_by_order(db, order_id)
    placed_bids = [bid for bid in bids if bid.bid_status == "placed"]
    if not placed_bids:
        raise HTTPException(status_code=404, detail="No active placed bids found for order")

    winner = min(placed_bids, key=_bid_rank_key)
    return await _accept_bid_and_assign(winner.bid_id, db)
