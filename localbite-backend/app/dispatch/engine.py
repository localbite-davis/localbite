"""
Async Delivery Dispatch Engine

This module provides a simple two-phase dispatch system using Redis as a queue.

Phase 1: Pushes the order to the queue restricted to "student" delivery agents and
         waits 3-4 minutes while polling to see if the order was accepted.
Phase 2: If unclaimed after Phase 1, broadcasts the order to all agents (student + third-party).

Functions exposed:
 - push_to_queue(dispatch_message: DispatchMessage)
 - is_order_assigned(order_id: int)
 - dispatch_order(order_id, restaurant_id, delivery_address)

Notes:
 - This implementation uses Redis (redis.asyncio) for queueing and lightweight state checks.
 - In a production system, assignment checks should consult the primary DB or service
   that holds order/assignment state rather than Redis keys used here for demo/mock purposes.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import random
from datetime import datetime, timezone
from typing import Literal

import redis.asyncio as aioredis
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.crud import delivery_bid as delivery_bid_crud
from app.crud import order as order_crud

# Logger for the module
logger = logging.getLogger("dispatch.engine")
logger.setLevel(logging.INFO)


# Pydantic schema for dispatch messages
class DispatchMessage(BaseModel):
    order_id: int
    restaurant_id: int
    delivery_address: str
    # Candidate agent type controls which agents will receive the broadcast.
    # Use 'student' for phase 1 (students only) and 'all' for phase 2 (students + third-party)
    candidate_agent_type: Literal["student", "all"] = "student"


# Redis connection helper. Read REDIS_URL from env or use localhost default.
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
_redis: aioredis.Redis | None = None
_dispatch_tasks: dict[int, asyncio.Task] = {}
ROLLING_BID_CLOSE_SECONDS = 60


def get_redis() -> aioredis.Redis:
    """Return a singleton Redis client for async operations."""
    global _redis
    if _redis is None:
        # Create a redis.asyncio client
        _redis = aioredis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
    return _redis


async def push_to_queue(dispatch_message: DispatchMessage) -> None:
    """
    Push a serialized DispatchMessage onto the Redis queue.

    We use a Redis list as a simple FIFO queue. Consumers (agents) can BLPOP or BRPOP
    to receive messages. The key used is 'dispatch:queue:{candidate_agent_type}' so
    we can separate student-only broadcasts from all-agents broadcasts if needed.
    """
    redis = get_redis()

    # Choose queue key based on candidate_agent_type so consumers can subscribe selectively.
    queue_key = f"dispatch:queue:{dispatch_message.candidate_agent_type}"

    # Serialize the message as JSON
    payload = dispatch_message.model_dump()
    payload_json = json.dumps(payload)

    # Use RPUSH to append and keep FIFO behavior with BLPOP on consumers.
    await redis.rpush(queue_key, payload_json)
    logger.info("Pushed dispatch message to %s: %s", queue_key, payload)


def _dispatch_state_key(order_id: int) -> str:
    return f"dispatch:order:{order_id}:state"


def _assignment_key(order_id: int) -> str:
    return f"order:{order_id}:assigned"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def set_dispatch_state(
    order_id: int,
    *,
    status: str,
    phase: str,
    restaurant_id: int | None = None,
    delivery_address: str | None = None,
    phase1_wait_seconds: int | None = None,
    phase2_wait_seconds: int | None = None,
    note: str | None = None,
) -> None:
    redis = get_redis()
    key = _dispatch_state_key(order_id)
    payload = {
        "order_id": str(order_id),
        "status": status,
        "phase": phase,
        "updated_at": _now_iso(),
    }
    if restaurant_id is not None:
        payload["restaurant_id"] = str(restaurant_id)
    if delivery_address is not None:
        payload["delivery_address"] = delivery_address
    if phase1_wait_seconds is not None:
        payload["phase1_wait_seconds"] = str(phase1_wait_seconds)
    if phase2_wait_seconds is not None:
        payload["phase2_wait_seconds"] = str(phase2_wait_seconds)
    if note:
        payload["note"] = note
    await redis.hset(key, mapping=payload)


async def get_dispatch_state(order_id: int) -> dict[str, str]:
    redis = get_redis()
    key = _dispatch_state_key(order_id)
    data = await redis.hgetall(key)
    return data or {}


async def mark_order_assigned(order_id: int, agent_id: str | None = None) -> None:
    redis = get_redis()
    assigned_key = _assignment_key(order_id)
    await redis.set(assigned_key, "1")
    await set_dispatch_state(
        order_id,
        status="assigned",
        phase="completed",
        note=f"accepted_by={agent_id}" if agent_id else "assigned",
    )


async def clear_order_assignment(order_id: int) -> None:
    redis = get_redis()
    await redis.delete(_assignment_key(order_id))


async def is_order_assigned(order_id: int) -> bool:
    """
    Check if an order has been accepted/assigned.

    For this example we use a Redis key 'order:{order_id}:assigned' which would be set
    by the consumer/assignment service when an agent accepts the order. In a real system
    this should check the primary orders database or a dedicated assignment service.
    """
    redis = get_redis()
    assigned_key = _assignment_key(order_id)

    # Key value expected to be '1' or 'true' when assigned. Existence alone is considered assigned.
    val = await redis.get(assigned_key)
    if val is None:
        return False
    try:
        return str(val).lower() not in ("0", "false")
    except Exception:
        return True


def _to_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _bid_sort_key(bid) -> tuple[float, float, int]:
    created_at = _to_utc(getattr(bid, "created_at", None))
    created_ts = created_at.timestamp() if created_at else float("inf")
    return (round(float(bid.bid_amount), 2), created_ts, int(getattr(bid, "bid_id", 0)))


def _get_placed_bids(order_id: int):
    db: Session = SessionLocal()
    try:
        bids = delivery_bid_crud.list_by_order(db, order_id)
        return [bid for bid in bids if getattr(bid, "bid_status", None) == "placed"]
    finally:
        db.close()


def _get_latest_bid_marker(order_id: int) -> tuple[int, int]:
    placed_bids = _get_placed_bids(order_id)
    if not placed_bids:
        return (0, 0)
    return (len(placed_bids), max(int(bid.bid_id) for bid in placed_bids))


async def auto_award_best_bid(order_id: int) -> tuple[bool, str | None]:
    """
    Select the winning bid by lowest bid_amount, then earliest created_at, then lowest bid_id.
    Returns (awarded, agent_id).
    """
    db: Session = SessionLocal()
    try:
        order = order_crud.get_by_id(db, order_id)
        if not order:
            return False, None
        if order.assigned_partner_id:
            return True, str(order.assigned_partner_id)

        bids = delivery_bid_crud.list_by_order(db, order_id)
        placed_bids = [bid for bid in bids if getattr(bid, "bid_status", None) == "placed"]
        if not placed_bids:
            return False, None

        winner = min(placed_bids, key=_bid_sort_key)

        winner.bid_status = "accepted"
        order.assigned_partner_id = winner.agent_id
        order.delivery_fee = winner.bid_amount
        order.order_status = "assigned"

        for other in bids:
            if other.bid_id == winner.bid_id:
                continue
            if other.bid_status == "placed":
                other.bid_status = "rejected"

        db.add(order)
        db.add(winner)
        db.commit()
        db.refresh(winner)
        winner_agent_id = str(winner.agent_id)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    await mark_order_assigned(order_id, winner_agent_id)
    return True, winner_agent_id


async def dispatch_order(
    order_id: int,
    restaurant_id: int,
    delivery_address: str,
    *,
    phase1_wait_seconds_min: int = 180,
    phase1_wait_seconds_max: int = 240,
    phase2_wait_seconds: int = 180,
    poll_interval_seconds: int = 5,
) -> None:
    """
    Perform a two-phase dispatch for a given order.

    Phase 1: Broadcast only to student delivery agents and wait 3-4 minutes while polling
             periodically to see if the order was accepted.
    Phase 2: If the order is still unclaimed, broadcast to all agents (students + third-party).

    This function is asynchronous and returns when the Phase 2 broadcast is complete or
    when the order has been assigned during Phase 1.
    """
    phase1_wait_seconds_min = max(1, phase1_wait_seconds_min)
    phase1_wait_seconds_max = max(phase1_wait_seconds_min, phase1_wait_seconds_max)
    phase2_wait_seconds = max(1, phase2_wait_seconds)
    poll_interval_seconds = max(1, poll_interval_seconds)

    await clear_order_assignment(order_id)
    await set_dispatch_state(
        order_id,
        status="starting",
        phase="student_pool",
        restaurant_id=restaurant_id,
        delivery_address=delivery_address,
        phase1_wait_seconds=None,
        phase2_wait_seconds=phase2_wait_seconds,
    )

    # Build initial dispatch message for student-only phase
    student_message = DispatchMessage(
        order_id=order_id,
        restaurant_id=restaurant_id,
        delivery_address=delivery_address,
        candidate_agent_type="student",
    )

    # Phase 1: Push to student-only queue
    logger.info("Dispatching order %s - Phase 1 (students only)", order_id)
    await push_to_queue(student_message)
    await set_dispatch_state(
        order_id,
        status="broadcasted",
        phase="student_pool",
        restaurant_id=restaurant_id,
        delivery_address=delivery_address,
        note="student pool broadcast sent",
    )

    # Wait duration between 3 and 4 minutes (in seconds). We'll poll frequently during this window
    # so we can stop early if the order is accepted.
    wait_seconds = int(random.uniform(phase1_wait_seconds_min, phase1_wait_seconds_max))
    poll_interval = poll_interval_seconds
    elapsed = 0.0
    await set_dispatch_state(
        order_id,
        status="waiting_for_bids",
        phase="student_pool",
        restaurant_id=restaurant_id,
        delivery_address=delivery_address,
        phase1_wait_seconds=wait_seconds,
        phase2_wait_seconds=phase2_wait_seconds,
        note="student pool timer active",
    )

    # Poll loop: check every poll_interval seconds up to wait_seconds
    while elapsed < wait_seconds:
        # Short sleep then check assignment state to allow responsive cancellation by acceptance.
        await asyncio.sleep(poll_interval)
        elapsed += poll_interval

        if await is_order_assigned(order_id):
            logger.info("Order %s assigned during Phase 1 after %.1f seconds", order_id, elapsed)
            await set_dispatch_state(
                order_id,
                status="assigned",
                phase="completed",
                restaurant_id=restaurant_id,
                delivery_address=delivery_address,
                phase1_wait_seconds=wait_seconds,
                phase2_wait_seconds=phase2_wait_seconds,
                note=f"assigned during student_pool after {int(elapsed)}s",
            )
            return

    # Student pool ended. If any student bids exist, award the best bid instead of escalating.
    if _get_placed_bids(order_id):
        awarded, agent_id = await auto_award_best_bid(order_id)
        if awarded:
            logger.info(
                "Order %s auto-awarded from student pool after %.1f seconds to agent %s",
                order_id,
                elapsed,
                agent_id,
            )
            return

    # If we reach here, the order is still unassigned after Phase 1
    logger.info("Order %s unclaimed after Phase 1 (%.1f seconds); entering Phase 2 (broadcast to all agents)", order_id, elapsed)
    await set_dispatch_state(
        order_id,
        status="escalating",
        phase="all_agents",
        restaurant_id=restaurant_id,
        delivery_address=delivery_address,
        phase1_wait_seconds=wait_seconds,
        phase2_wait_seconds=phase2_wait_seconds,
        note="moving from student pool to all agents",
    )

    # Phase 2: Broadcast to all agents
    all_message = DispatchMessage(
        order_id=order_id,
        restaurant_id=restaurant_id,
        delivery_address=delivery_address,
        candidate_agent_type="all",
    )
    await push_to_queue(all_message)
    await set_dispatch_state(
        order_id,
        status="waiting_for_bids",
        phase="all_agents",
        restaurant_id=restaurant_id,
        delivery_address=delivery_address,
        phase1_wait_seconds=wait_seconds,
        phase2_wait_seconds=phase2_wait_seconds,
        note="all agents broadcast sent",
    )

    # Phase 2: wait for bids/assignment. If bids arrive, run a rolling 60s close window
    # that resets whenever a new bid is placed; then auto-award the best bid.
    elapsed_phase2 = 0.0
    rolling_close_deadline: float | None = None
    last_seen_bid_marker = _get_latest_bid_marker(order_id)
    loop = asyncio.get_running_loop()

    while True:
        await asyncio.sleep(poll_interval)
        elapsed_phase2 += poll_interval

        if await is_order_assigned(order_id):
            logger.info(
                "Order %s assigned during Phase 2 after %.1f seconds",
                order_id,
                elapsed_phase2,
            )
            await set_dispatch_state(
                order_id,
                status="assigned",
                phase="completed",
                restaurant_id=restaurant_id,
                delivery_address=delivery_address,
                phase1_wait_seconds=wait_seconds,
                phase2_wait_seconds=phase2_wait_seconds,
                note=f"assigned during all_agents after {int(elapsed_phase2)}s",
            )
            return
        current_bid_marker = _get_latest_bid_marker(order_id)
        now_mono = loop.time()

        if current_bid_marker != (0, 0):
            # Start/reset 60s rolling close when a new bid arrives.
            if current_bid_marker != last_seen_bid_marker or rolling_close_deadline is None:
                last_seen_bid_marker = current_bid_marker
                rolling_close_deadline = now_mono + ROLLING_BID_CLOSE_SECONDS
                await set_dispatch_state(
                    order_id,
                    status="waiting_for_bids",
                    phase="all_agents",
                    restaurant_id=restaurant_id,
                    delivery_address=delivery_address,
                    phase1_wait_seconds=wait_seconds,
                    phase2_wait_seconds=ROLLING_BID_CLOSE_SECONDS,
                    note="bids received; rolling 60s close window reset",
                )

            if rolling_close_deadline is not None and now_mono >= rolling_close_deadline:
                awarded, agent_id = await auto_award_best_bid(order_id)
                if awarded:
                    logger.info(
                        "Order %s auto-awarded during all_agents phase to %s after rolling close",
                        order_id,
                        agent_id,
                    )
                    return
                # If bids disappeared (e.g., race), continue and fall back to phase2 timeout.
                rolling_close_deadline = None
                last_seen_bid_marker = _get_latest_bid_marker(order_id)
                await set_dispatch_state(
                    order_id,
                    status="waiting_for_bids",
                    phase="all_agents",
                    restaurant_id=restaurant_id,
                    delivery_address=delivery_address,
                    phase1_wait_seconds=wait_seconds,
                    phase2_wait_seconds=phase2_wait_seconds,
                    note="rolling close ended without award; continuing all-agents wait",
                )
                continue

        # No bids yet in all-agents phase: keep waiting until phase2 window ends.
        if elapsed_phase2 >= phase2_wait_seconds and current_bid_marker == (0, 0):
            await set_dispatch_state(
                order_id,
                status="needs_fee_increase",
                phase="all_agents",
                restaurant_id=restaurant_id,
                delivery_address=delivery_address,
                phase1_wait_seconds=wait_seconds,
                phase2_wait_seconds=phase2_wait_seconds,
                note="no assignment after all_agents phase; prompt user to increase fee",
            )
            logger.info("Completed Phase 2 window for order %s; needs fee increase prompt", order_id)
            return


def is_dispatch_running(order_id: int) -> bool:
    task = _dispatch_tasks.get(order_id)
    return task is not None and not task.done()


async def start_dispatch_background(
    order_id: int,
    restaurant_id: int,
    delivery_address: str,
    *,
    phase1_wait_seconds_min: int = 180,
    phase1_wait_seconds_max: int = 240,
    phase2_wait_seconds: int = 180,
    poll_interval_seconds: int = 5,
) -> bool:
    if is_dispatch_running(order_id):
        return False

    async def _runner() -> None:
        try:
            await dispatch_order(
                order_id=order_id,
                restaurant_id=restaurant_id,
                delivery_address=delivery_address,
                phase1_wait_seconds_min=phase1_wait_seconds_min,
                phase1_wait_seconds_max=phase1_wait_seconds_max,
                phase2_wait_seconds=phase2_wait_seconds,
                poll_interval_seconds=poll_interval_seconds,
            )
        except Exception:
            logger.exception("Dispatch task failed for order %s", order_id)
            try:
                await set_dispatch_state(
                    order_id,
                    status="failed",
                    phase="error",
                    restaurant_id=restaurant_id,
                    delivery_address=delivery_address,
                    note="dispatch task exception",
                )
            except Exception:
                logger.exception("Failed to persist dispatch error state for order %s", order_id)
        finally:
            _dispatch_tasks.pop(order_id, None)

    task = asyncio.create_task(_runner())
    _dispatch_tasks[order_id] = task
    return True


__all__ = [
    "DispatchMessage",
    "push_to_queue",
    "is_order_assigned",
    "dispatch_order",
    "start_dispatch_background",
    "is_dispatch_running",
    "get_dispatch_state",
    "set_dispatch_state",
    "mark_order_assigned",
]
