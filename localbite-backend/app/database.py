import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

# Load environment variables from .env file
load_dotenv()

# Database connection variables
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME")
DB_SSLMODE = os.getenv("DB_SSLMODE", "require")
DB_CHANNEL_BINDING = os.getenv("DB_CHANNEL_BINDING", "require")


def _build_database_url() -> str:
    explicit_url = os.getenv("DATABASE_URL")
    if explicit_url:
        return explicit_url

    if not all([DB_USER, DB_PASSWORD, DB_HOST, DB_NAME]):
        raise RuntimeError(
            "Database configuration missing. Set DATABASE_URL or DB_USER/DB_PASSWORD/DB_HOST/DB_NAME."
        )

    query_params = []
    if DB_SSLMODE:
        query_params.append(f"sslmode={DB_SSLMODE}")
    if DB_CHANNEL_BINDING:
        query_params.append(f"channel_binding={DB_CHANNEL_BINDING}")
    query_str = f"?{'&'.join(query_params)}" if query_params else ""

    return (
        f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}{query_str}"
    )


DATABASE_URL = _build_database_url()

# Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300)

# Create a SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class for models to inherit from
Base = declarative_base()

def get_db():
    """
    Dependency to get a database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_delivery_agent_columns():
    """
    Ensure the delivery_agents table has the nullable columns added by recent model changes.

    This runs idempotent ALTER TABLE ... ADD COLUMN IF NOT EXISTS statements.
    It's a pragmatic, non-destructive approach for development/hackathon environments
    when Alembic migrations aren't set up.
    """
    # Use engine.begin() so the statements run in a transaction
    with engine.begin() as conn:
        # Add kerberos_id and background_check_status if missing
        conn.execute(
            text(
                "ALTER TABLE IF EXISTS public.delivery_agents ADD COLUMN IF NOT EXISTS kerberos_id VARCHAR;"
            )
        )
        conn.execute(
            text(
                "ALTER TABLE IF EXISTS public.delivery_agents ADD COLUMN IF NOT EXISTS background_check_status VARCHAR;"
            )
        )
        conn.execute(
            text(
                "ALTER TABLE IF EXISTS public.delivery_agents ADD COLUMN IF NOT EXISTS total_earnings DOUBLE PRECISION DEFAULT 0;"
            )
        )


def ensure_order_delivery_columns():
    """
    Ensure orders table has delivery proof and payout columns required by agent fulfillment flow.
    """
    with engine.begin() as conn:
        conn.execute(
            text(
                "ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS delivery_proof_ref VARCHAR;"
            )
        )
        conn.execute(
            text(
                "ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS delivery_proof_filename VARCHAR;"
            )
        )
        conn.execute(
            text(
                "ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS agent_payout_amount DOUBLE PRECISION;"
            )
        )
        conn.execute(
            text(
                "ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS agent_payout_status VARCHAR DEFAULT 'pending';"
            )
        )
        conn.execute(
            text(
                "ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;"
            )
        )
