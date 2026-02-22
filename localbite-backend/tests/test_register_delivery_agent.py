import uuid

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.delivery_agent import AgentType, VehicleType
from app.schemas.delivery_agent import DeliveryAgentCreate
from app.api.register import register_delivery_agent


def _create_test_session():
    """Create an in-memory SQLite session for testing and create tables."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return TestingSessionLocal()


def test_ucdavis_email_auto_verified(monkeypatch):
    """UC Davis emails should be auto-marked student, verified, and get a kerberos_id."""
    db = _create_test_session()

    # Avoid depending on password hashing implementation in tests
    import app.crud.delivery_agent as crud_mod

    monkeypatch.setattr(crud_mod, "get_password_hash", lambda p: "fakehash")

    payload = DeliveryAgentCreate(
        agent_id="agent-ucd-1",
        full_name="Alice Student",
        email="alice@ucdavis.edu",
        phone_number="555-0001",
        password="secret",
        vehicle_type=VehicleType.BIKE,
        base_payout_per_delivery=3.0,
    )

    created = register_delivery_agent(payload, db)

    assert created.email == "alice@ucdavis.edu"
    assert created.agent_type == AgentType.STUDENT
    assert created.is_verified is True
    # kerberos_id should be populated with a UUID string
    assert created.kerberos_id is not None


def test_third_party_email_sets_background_pending(monkeypatch):
    """Non-UC Davis emails should be third_party with pending background check."""
    db = _create_test_session()

    import app.crud.delivery_agent as crud_mod
    monkeypatch.setattr(crud_mod, "get_password_hash", lambda p: "fakehash")

    payload = DeliveryAgentCreate(
        agent_id="agent-3p-1",
        full_name="Bob Contractor",
        email="bob@example.com",
        phone_number="555-0002",
        password="secret2",
        vehicle_type=VehicleType.CAR,
        base_payout_per_delivery=4.5,
    )

    created = register_delivery_agent(payload, db)

    assert created.email == "bob@example.com"
    assert created.agent_type == AgentType.THIRD_PARTY
    assert created.is_verified is False
    assert created.kerberos_id is None
    assert created.background_check_status == "pending"
