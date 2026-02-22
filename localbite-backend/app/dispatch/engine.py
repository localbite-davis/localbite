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
from typing import Literal

import redis.asyncio as aioredis
from pydantic import BaseModel

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


async def is_order_assigned(order_id: int) -> bool:
    """
    Check if an order has been accepted/assigned.

    For this example we use a Redis key 'order:{order_id}:assigned' which would be set
    by the consumer/assignment service when an agent accepts the order. In a real system
    this should check the primary orders database or a dedicated assignment service.
    """
    redis = get_redis()
    assigned_key = f"order:{order_id}:assigned"

    # Key value expected to be '1' or 'true' when assigned. Existence alone is considered assigned.
    val = await redis.get(assigned_key)
    if val is None:
        return False
    try:
        return str(val).lower() not in ("0", "false")
    except Exception:
        return True


async def dispatch_order(order_id: int, restaurant_id: int, delivery_address: str) -> None:
    """
    Perform a two-phase dispatch for a given order.

    Phase 1: Broadcast only to student delivery agents and wait 3-4 minutes while polling
             periodically to see if the order was accepted.
    Phase 2: If the order is still unclaimed, broadcast to all agents (students + third-party).

    This function is asynchronous and returns when the Phase 2 broadcast is complete or
    when the order has been assigned during Phase 1.
    """
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

    # Wait duration between 3 and 4 minutes (in seconds). We'll poll frequently during this window
    # so we can stop early if the order is accepted.
    wait_seconds = random.uniform(180, 240)
    poll_interval = 5  # seconds between assignment checks
    elapsed = 0.0

    # Poll loop: check every poll_interval seconds up to wait_seconds
    while elapsed < wait_seconds:
        # Short sleep then check assignment state to allow responsive cancellation by acceptance.
        await asyncio.sleep(poll_interval)
        elapsed += poll_interval

        if await is_order_assigned(order_id):
            logger.info("Order %s assigned during Phase 1 after %.1f seconds", order_id, elapsed)
            return

    # If we reach here, the order is still unassigned after Phase 1
    logger.info("Order %s unclaimed after Phase 1 (%.1f seconds); entering Phase 2 (broadcast to all agents)", order_id, elapsed)

    # Phase 2: Broadcast to all agents
    all_message = DispatchMessage(
        order_id=order_id,
        restaurant_id=restaurant_id,
        delivery_address=delivery_address,
        candidate_agent_type="all",
    )
    await push_to_queue(all_message)

    # Optionally we could poll for assignment after phase 2 as well, or hand off to another service.
    logger.info("Completed Phase 2 broadcast for order %s", order_id)


__all__ = ["DispatchMessage", "push_to_queue", "is_order_assigned", "dispatch_order"]
