import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

# Load environment variables from .env file
load_dotenv()

# Database Connection variables
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")

# Construct Database URL
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}?sslmode=require&channel_binding=require"

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
