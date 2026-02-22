from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.models.payments import PaymentMethodType, PaymentProvider, PaymentStatus


class PaymentBase(BaseModel):
    order_id: UUID
    customer_id: Optional[UUID] = None
    merchant_id: UUID
    provider: PaymentProvider = PaymentProvider.STRIPE
    provider_payment_intent_id: Optional[str] = None
    provider_charge_id: Optional[str] = None
    provider_metadata: Optional[Dict[str, Any]] = None
    amount_subtotal: int = Field(..., gt=0)
    amount_tax: int = Field(default=0, ge=0)
    amount_tip: int = Field(default=0, ge=0)
    amount_fees: int = Field(default=0, ge=0)
    amount_total: int = Field(..., gt=0)
    currency: str = "USD"
    payment_method: PaymentMethodType
    status: PaymentStatus = PaymentStatus.CREATED
    failure_code: Optional[str] = None
    failure_message: Optional[str] = None
    idempotency_key: str
    refunded_amount: int = Field(default=0, ge=0)
    authorized_at: Optional[datetime] = None
    captured_at: Optional[datetime] = None
    refunded_at: Optional[datetime] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(BaseModel):
    provider: Optional[PaymentProvider] = None
    provider_payment_intent_id: Optional[str] = None
    provider_charge_id: Optional[str] = None
    provider_metadata: Optional[Dict[str, Any]] = None
    status: Optional[PaymentStatus] = None
    failure_code: Optional[str] = None
    failure_message: Optional[str] = None
    refunded_amount: Optional[int] = Field(default=None, ge=0)
    authorized_at: Optional[datetime] = None
    captured_at: Optional[datetime] = None
    refunded_at: Optional[datetime] = None


class PaymentOut(PaymentBase):
    payment_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
