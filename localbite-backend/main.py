from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy.exc import OperationalError
from app.api import api_router
from app.database import engine, Base
from app.models import Restaurant, User, DeliveryAgent, Payment, MenuItem, Order

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        # Create tables on startup
        Base.metadata.create_all(bind=engine)
        print("✅ Database connection established and tables created successfully.")
    except OperationalError as e:
        print(f"❌ Database connection failed: {e}")
    except Exception as e:
        print(f"❌ An unexpected error occurred during database startup: {e}")
    yield

app = FastAPI(lifespan=lifespan)
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"Hello": "World"}
