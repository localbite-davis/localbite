from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime


class PaymentStatus(str, Enum):
    CREATED = "created"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"
    CANCELLED = "cancelled"


class PaymentMethodType(str, Enum):
    CARD = "card"
    APPLE_PAY = "apple_pay"
    GOOGLE_PAY = "google_pay"
    CASH = "cash"


class PaymentProvider(str, Enum):
    STRIPE = "stripe"
    CASH = "cash"
    INTERNAL = "internal"



class Payment(BaseModel):
    """
    Represents a single immutable payment transaction.
    Designed for US-based (California) card-first payments.
    """

    # Identifiers
    payment_id: UUID = Field(..., description="Internal payment UUID")
    order_id: UUID = Field(..., description="Associated order UUID")

    customer_id: Optional[UUID] = Field(
        None, description="Customer placing the order"
    )
    merchant_id: UUID = Field(
        ..., description="Restaurant receiving the payment"
    )

    # Provider details
    provider: PaymentProvider = PaymentProvider.STRIPE
    provider_payment_intent_id: Optional[str] = Field(
        None, description="Stripe PaymentIntent ID"
    )
    provider_charge_id: Optional[str] = Field(
        None, description="Stripe Charge ID"
    )
    provider_metadata: Optional[Dict[str, Any]] = Field(
        None, description="Sanitized provider response"
    )

    # Monetary values (USD, cents)
    amount_subtotal: int = Field(
        ..., gt=0, description="Subtotal in cents (before tax, fees)"
    )
    amount_tax: int = Field(
        default=0, ge=0, description="Sales tax in cents (CA tax)"
    )
    amount_tip: int = Field(
        default=0, ge=0, description="Tip in cents"
    )
    amount_fees: int = Field(
        default=0, ge=0, description="Platform / service fees in cents"
    )

    amount_total: int = Field(
        ..., gt=0, description="Final amount charged in cents"
    )

    currency: str = Field(default="USD", frozen=True)

    # Payment method
    payment_method: PaymentMethodType

    # State & failure
    status: PaymentStatus = PaymentStatus.CREATED
    failure_code: Optional[str] = None
    failure_message: Optional[str] = None

    # Idempotency & retries
    idempotency_key: str = Field(
        ..., description="Ensures payment is processed only once"
    )

    # Refund tracking
    refunded_amount: int = Field(
        default=0, ge=0, description="Total refunded amount in cents"
    )

    # Audit timestamps
    created_at: datetime
    updated_at: datetime
    authorized_at: Optional[datetime] = None
    captured_at: Optional[datetime] = None
    refunded_at: Optional[datetime] = None