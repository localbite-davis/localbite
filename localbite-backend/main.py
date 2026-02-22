from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError
from app.api import api_router
from app.database import engine, Base
from app.models import Restaurant, User, DeliveryAgent, Payment, MenuItem, Order

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        # Create tables on startup
        Base.metadata.create_all(bind=engine)
        # Ensure any new nullable columns exist (useful during development/hackathons
        # when the DB schema may lag behind model changes). This is idempotent.
        from app.database import ensure_delivery_agent_columns

        try:
            ensure_delivery_agent_columns()
        except Exception as e:
            # Don't fail startup for this helper, just log the error.
            print(f"Warning: ensure_delivery_agent_columns failed: {e}")
        print("✅ Database connection established and tables created successfully.")
    except OperationalError as e:
        print(f"❌ Database connection failed: {e}")
    except Exception as e:
        print(f"❌ An unexpected error occurred during database startup: {e}")
    yield

app = FastAPI(lifespan=lifespan)

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"Hello": "World"}
