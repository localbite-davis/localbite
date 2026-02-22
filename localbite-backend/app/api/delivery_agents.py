from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.crud import delivery_agent as delivery_agent_crud
from app.database import get_db
from app.models.order import Order
from app.dispatch.engine import get_dispatch_state
from app.schemas.delivery_agent import (
    AgentActiveOrderItem,
    AgentActiveOrdersResponse,
    DeliveryAgentCreate,
    DeliveryAgentOut,
    DeliveryAgentUpdate,
    FulfillDeliveryRequest,
    FulfillDeliveryResponse,
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


@router.get("/{agent_id}/active-orders", response_model=AgentActiveOrdersResponse)
async def get_agent_active_orders(agent_id: str, db: Session = Depends(get_db)):
    agent = delivery_agent_crud.get_by_id(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Delivery agent not found")

    active_statuses = {"assigned", "on_the_way"}
    orders = (
        db.query(Order)
        .filter(Order.assigned_partner_id == agent_id)
        .filter(Order.order_status.in_(active_statuses))
        .order_by(Order.created_at.desc(), Order.order_id.desc())
        .all()
    )

    items: list[AgentActiveOrderItem] = []
    for order in orders:
        dispatch_state = await get_dispatch_state(order.order_id)
        items.append(
            AgentActiveOrderItem(
                order_id=order.order_id,
                restaurant_id=order.restaurant_id,
                restaurant_name=order.restaurant.name if getattr(order, "restaurant", None) else None,
                delivery_address=dispatch_state.get("delivery_address") if dispatch_state else None,
                order_status=order.order_status,
                items_count=len(order.order_items) if isinstance(order.order_items, list) else 0,
                delivery_fee=round(float(order.delivery_fee or 0), 2),
                created_at=order.created_at,
                assigned_at=dispatch_state.get("updated_at") if dispatch_state else None,
            )
        )

    return AgentActiveOrdersResponse(
        agent_id=agent.agent_id,
        total_earnings=round(float(getattr(agent, "total_earnings", 0.0) or 0.0), 2),
        total_deliveries=int(agent.total_deliveries or 0),
        active_orders=items,
    )


@router.post(
    "/{agent_id}/orders/{order_id}/fulfill",
    response_model=FulfillDeliveryResponse,
)
async def fulfill_agent_order(
    agent_id: str,
    order_id: int,
    payload: FulfillDeliveryRequest,
    db: Session = Depends(get_db),
):
    agent = delivery_agent_crud.get_by_id(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Delivery agent not found")
    if not agent.is_active:
        raise HTTPException(status_code=403, detail="Inactive delivery agent cannot fulfill orders")

    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.assigned_partner_id != agent_id:
        raise HTTPException(status_code=403, detail="Order is not assigned to this agent")

    if order.order_status == "delivered" and (order.agent_payout_status == "paid"):
        return FulfillDeliveryResponse(
            agent_id=agent.agent_id,
            order_id=order.order_id,
            order_status=order.order_status,
            payout_amount=round(float(order.agent_payout_amount or order.delivery_fee or 0), 2),
            payout_status=str(order.agent_payout_status or "paid"),
            total_earnings=round(float(getattr(agent, "total_earnings", 0.0) or 0.0), 2),
            total_deliveries=int(agent.total_deliveries or 0),
            delivered_at=order.delivered_at or datetime.now(timezone.utc),
            proof_photo_ref=order.delivery_proof_ref or payload.proof_photo_ref,
        )

    payout_amount = round(float(order.delivery_fee or 0), 2)
    now = datetime.now(timezone.utc)

    already_paid = str(order.agent_payout_status or "").lower() == "paid"
    if not already_paid:
        agent.total_earnings = round(float(getattr(agent, "total_earnings", 0.0) or 0.0) + payout_amount, 2)
        agent.total_deliveries = int(agent.total_deliveries or 0) + 1
        order.agent_payout_amount = payout_amount
        order.agent_payout_status = "paid"

    order.order_status = "delivered"
    order.delivery_proof_ref = payload.proof_photo_ref
    order.delivery_proof_filename = payload.proof_photo_filename
    order.delivered_at = now

    db.add(agent)
    db.add(order)
    db.commit()
    db.refresh(agent)
    db.refresh(order)

    return FulfillDeliveryResponse(
        agent_id=agent.agent_id,
        order_id=order.order_id,
        order_status=order.order_status,
        payout_amount=round(float(order.agent_payout_amount or payout_amount), 2),
        payout_status=str(order.agent_payout_status or "paid"),
        total_earnings=round(float(getattr(agent, "total_earnings", 0.0) or 0.0), 2),
        total_deliveries=int(agent.total_deliveries or 0),
        delivered_at=order.delivered_at or now,
        proof_photo_ref=order.delivery_proof_ref or payload.proof_photo_ref,
    )


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
