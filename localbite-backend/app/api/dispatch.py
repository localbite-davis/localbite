from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.crud import delivery_agent as delivery_agent_crud
from app.crud import delivery_bid as delivery_bid_crud
from app.crud import order as order_crud
from app.database import get_db
from app.dispatch.engine import (
    get_dispatch_state,
    is_dispatch_running,
    start_dispatch_background,
)
from app.schemas.dispatch import (
    AgentAvailableDispatchResponse,
    AgentAvailableDispatchItem,
    DispatchStartRequest,
    DispatchStartResponse,
    DispatchStatusResponse,
)
from app.services.base_fare import get_bid_window
from app.models.delivery_agent import AgentType

router = APIRouter(prefix="/dispatch", tags=["dispatch"])


def _parse_iso_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except (TypeError, ValueError):
        return None


def _seconds_remaining(state: dict[str, str]) -> int:
    status = state.get("status")
    if status != "waiting_for_bids":
        return 0

    phase = state.get("phase")
    total_seconds_raw = (
        state.get("phase1_wait_seconds")
        if phase == "student_pool"
        else state.get("phase2_wait_seconds") if phase == "all_agents" else None
    )
    if not total_seconds_raw:
        return 0

    try:
        total_seconds = int(total_seconds_raw)
    except ValueError:
        return 0

    updated_at = _parse_iso_dt(state.get("updated_at"))
    if updated_at is None:
        return 0
    if updated_at.tzinfo is None:
        updated_at = updated_at.replace(tzinfo=timezone.utc)

    elapsed = int((datetime.now(timezone.utc) - updated_at).total_seconds())
    return max(total_seconds - max(elapsed, 0), 0)


def _is_visible_to_agent(state: dict[str, str], agent_type: AgentType) -> bool:
    status = state.get("status", "")
    phase = state.get("phase", "")
    if status not in {"starting", "broadcasted", "waiting_for_bids", "escalating"}:
        return False
    if phase == "all_agents":
        return True
    if phase == "student_pool":
        return agent_type == AgentType.STUDENT
    return False


@router.get(
    "/agents/{agent_id}/available",
    response_model=AgentAvailableDispatchResponse,
)
async def list_available_dispatch_requests_for_agent(
    agent_id: str,
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    agent = delivery_agent_crud.get_by_id(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Delivery agent not found")
    if not agent.is_active:
        raise HTTPException(status_code=403, detail="Inactive delivery agent cannot receive dispatch feed")

    orders = order_crud.list_all(db, skip=0, limit=limit)
    items: list[AgentAvailableDispatchItem] = []

    for order in orders:
        if order.assigned_partner_id:
            continue
        if order.order_status in {"delivered", "cancelled", "assigned"}:
            continue

        state = await get_dispatch_state(order.order_id)
        if not state:
            continue
        if not _is_visible_to_agent(state, agent.agent_type):
            continue

        phase = state.get("phase", "")
        if phase not in {"student_pool", "all_agents"}:
            continue

        min_allowed_fare, max_allowed_fare = get_bid_window(order.base_fare)
        competing_bids = delivery_bid_crud.list_by_order(db, order.order_id)
        placed_bids = [bid for bid in competing_bids if bid.bid_status == "placed"]
        placed_bids_sorted = sorted(
            placed_bids,
            key=lambda bid: (
                round(float(bid.bid_amount), 2),
                bid.created_at or datetime.max.replace(tzinfo=timezone.utc),
                bid.bid_id,
            ),
        )
        leading_bid = placed_bids_sorted[0] if placed_bids_sorted else None

        order_items_count = (
            len(order.order_items)
            if isinstance(order.order_items, list)
            else 0
        )

        items.append(
            AgentAvailableDispatchItem(
                order_id=order.order_id,
                restaurant_id=order.restaurant_id,
                restaurant_name=order.restaurant.name if getattr(order, "restaurant", None) else None,
                delivery_address=state.get("delivery_address"),
                order_items_count=order_items_count,
                base_fare=round(order.base_fare, 2),
                min_allowed_fare=min_allowed_fare,
                max_allowed_fare=max_allowed_fare,
                dispatch_status=state.get("status", "unknown"),
                pool_phase=phase,
                student_only=(phase == "student_pool"),
                bidding_time_left_seconds=_seconds_remaining(state),
                dispatch_updated_at=state.get("updated_at"),
                leading_bid_amount=(round(float(leading_bid.bid_amount), 2) if leading_bid else None),
                leading_bid_created_at=(leading_bid.created_at if leading_bid else None),
                total_placed_bids=len(placed_bids),
                order_created_at=order.created_at,
            )
        )

    items.sort(
        key=lambda item: (
            0 if item.student_only else 1,
            -int((item.order_created_at or datetime(1970, 1, 1, tzinfo=timezone.utc)).timestamp()),
            -item.order_id,
        )
    )

    return AgentAvailableDispatchResponse(
        agent_id=agent.agent_id,
        agent_type=(agent.agent_type.value if hasattr(agent.agent_type, "value") else str(agent.agent_type)),
        items=items,
    )


@router.post(
    "/orders/{order_id}/start",
    response_model=DispatchStartResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def start_order_dispatch(
    order_id: int,
    payload: DispatchStartRequest,
    db: Session = Depends(get_db),
):
    order = order_crud.get_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.assigned_partner_id:
        raise HTTPException(status_code=409, detail="Order is already assigned")

    started = await start_dispatch_background(
        order_id=order.order_id,
        restaurant_id=order.restaurant_id,
        delivery_address=payload.delivery_address,
        phase1_wait_seconds_min=payload.phase1_wait_seconds_min,
        phase1_wait_seconds_max=payload.phase1_wait_seconds_max,
        phase2_wait_seconds=payload.phase2_wait_seconds,
        poll_interval_seconds=payload.poll_interval_seconds,
    )

    if not started:
        return DispatchStartResponse(
            order_id=order_id,
            dispatch_started=False,
            status="already_running",
            phase="existing",
            phase1_wait_seconds_min=payload.phase1_wait_seconds_min,
            phase1_wait_seconds_max=payload.phase1_wait_seconds_max,
            phase2_wait_seconds=payload.phase2_wait_seconds,
            poll_interval_seconds=payload.poll_interval_seconds,
            message="Dispatch already running for this order",
        )

    return DispatchStartResponse(
        order_id=order_id,
        dispatch_started=True,
        status="accepted",
        phase="student_pool",
        phase1_wait_seconds_min=payload.phase1_wait_seconds_min,
        phase1_wait_seconds_max=payload.phase1_wait_seconds_max,
        phase2_wait_seconds=payload.phase2_wait_seconds,
        poll_interval_seconds=payload.poll_interval_seconds,
        message="Two-phase dispatch started",
    )


@router.get("/orders/{order_id}/status", response_model=DispatchStatusResponse)
async def get_order_dispatch_status(order_id: int):
    state = await get_dispatch_state(order_id)
    running = is_dispatch_running(order_id)

    if not state:
        return DispatchStatusResponse(
            order_id=order_id,
            is_running=running,
            status="not_started",
            phase="none",
        )

    def _to_int(name: str) -> int | None:
        value = state.get(name)
        return int(value) if value is not None and value != "" else None

    return DispatchStatusResponse(
        order_id=order_id,
        is_running=running,
        status=state.get("status", "unknown"),
        phase=state.get("phase", "unknown"),
        restaurant_id=_to_int("restaurant_id"),
        delivery_address=state.get("delivery_address"),
        phase1_wait_seconds=_to_int("phase1_wait_seconds"),
        phase2_wait_seconds=_to_int("phase2_wait_seconds"),
        note=state.get("note"),
        updated_at=state.get("updated_at"),
    )
