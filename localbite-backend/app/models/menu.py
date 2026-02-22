from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from app.database import Base

class MenuItem(Base):
    __tablename__ = "menu_items"

    menu_id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    item_name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    availability = Column(Boolean, default=True)
    category = Column(String, nullable=True)