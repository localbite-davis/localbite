import uuid
from enum import Enum as PyEnum
from sqlalchemy import Column, DateTime, Enum, Integer, JSON, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


def _enum_values(enum_cls):
    return [member.value for member in enum_cls]


class PaymentStatus(str, PyEnum):
    CREATED = "created"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"
    CANCELLED = "cancelled"


class PaymentMethodType(str, PyEnum):
    CARD = "card"
    APPLE_PAY = "apple_pay"
    GOOGLE_PAY = "google_pay"
    CASH = "cash"


class PaymentProvider(str, PyEnum):
    STRIPE = "stripe"
    CASH = "cash"
    INTERNAL = "internal"


class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    customer_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    merchant_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    provider = Column(
        Enum(
            PaymentProvider,
            name="payment_provider_enum",
            values_callable=_enum_values,
            validate_strings=True,
        ),
        nullable=False,
        default=PaymentProvider.STRIPE,
    )
    provider_payment_intent_id = Column(String, nullable=True, index=True)
    provider_charge_id = Column(String, nullable=True, index=True)
    provider_metadata = Column(JSON, nullable=True)

    amount_subtotal = Column(Integer, nullable=False)
    amount_tax = Column(Integer, default=0)
    amount_tip = Column(Integer, default=0)
    amount_fees = Column(Integer, default=0)
    amount_total = Column(Integer, nullable=False)

    currency = Column(String, default="USD", nullable=False)
    payment_method = Column(
        Enum(
            PaymentMethodType,
            name="payment_method_type_enum",
            values_callable=_enum_values,
            validate_strings=True,
        ),
        nullable=False,
    )

    status = Column(
        Enum(
            PaymentStatus,
            name="payment_status_enum",
            values_callable=_enum_values,
            validate_strings=True,
        ),
        nullable=False,
        default=PaymentStatus.CREATED,
    )
    failure_code = Column(String, nullable=True)
    failure_message = Column(String, nullable=True)

    idempotency_key = Column(String, nullable=False, unique=True, index=True)
    refunded_amount = Column(Integer, default=0)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    authorized_at = Column(DateTime, nullable=True)
    captured_at = Column(DateTime, nullable=True)
    refunded_at = Column(DateTime, nullable=True)
