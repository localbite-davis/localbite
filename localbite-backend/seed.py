#!/usr/bin/env python3
"""
Seed script to populate the database with test restaurants and menu items.
"""

import sys
sys.path.insert(0, '/Users/krishi1211/Documents/localbite/localbite-backend')

from app.database import SessionLocal, engine
from app.models.restaurant import Restaurant
from app.models.menu import MenuItem
from app.models.users import User
from app.models.order import Order
from app.core.security import get_password_hash
from sqlalchemy.orm import Session

# Test restaurants data
restaurants_data = [
    {
        "id": 1,
        "email": "shahs@example.com",
        "name": "Shah's Halal",
        "cuisine_type": "Halal / Middle Eastern",
        "address": "123 Main St",
        "city": "Davis",
        "state": "CA",
        "commission_rate": 0.10,
        "menu": [
            {"item_name": "Chicken over Rice", "price": 10.99, "category": "Platters"},
            {"item_name": "Lamb Gyro", "price": 9.49, "category": "Wraps"},
            {"item_name": "Falafel Wrap", "price": 8.49, "category": "Wraps"},
            {"item_name": "Combo Platter", "price": 13.99, "category": "Platters"},
            {"item_name": "Baklava", "price": 3.99, "category": "Desserts"},
        ],
    },
    {
        "id": 2,
        "email": "thai@example.com",
        "name": "Thai Canteen",
        "cuisine_type": "Thai",
        "address": "456 Oak Ave",
        "city": "Davis",
        "state": "CA",
        "commission_rate": 0.10,
        "menu": [
            {"item_name": "Pad Thai", "price": 12.99, "category": "Noodles"},
            {"item_name": "Green Curry", "price": 13.49, "category": "Curries"},
            {"item_name": "Mango Sticky Rice", "price": 6.99, "category": "Desserts"},
            {"item_name": "Tom Yum Soup", "price": 8.99, "category": "Soups"},
        ],
    },
    {
        "id": 3,
        "email": "burgers@example.com",
        "name": "Burgers & Brew",
        "cuisine_type": "American / Burgers",
        "address": "789 Elm St",
        "city": "Davis",
        "state": "CA",
        "commission_rate": 0.10,
        "menu": [
            {"item_name": "Classic Smash Burger", "price": 11.99, "category": "Burgers"},
            {"item_name": "Truffle Fries", "price": 6.49, "category": "Sides"},
            {"item_name": "Milkshake", "price": 5.99, "category": "Drinks"},
        ],
    },
    {
        "id": 4,
        "email": "sushi@example.com",
        "name": "Sunrise Sushi",
        "cuisine_type": "Japanese / Sushi",
        "address": "321 Pine St",
        "city": "Davis",
        "state": "CA",
        "commission_rate": 0.10,
        "menu": [
            {"item_name": "Spicy Tuna Roll", "price": 12.99, "category": "Rolls"},
            {"item_name": "Salmon Sashimi", "price": 14.99, "category": "Sashimi"},
            {"item_name": "Chicken Teriyaki", "price": 11.49, "category": "Entrees"},
            {"item_name": "Edamame", "price": 4.99, "category": "Appetizers"},
        ],
    },
    {
        "id": 5,
        "email": "taqueria@example.com",
        "name": "Taqueria Davis",
        "cuisine_type": "Mexican",
        "address": "654 Cedar Rd",
        "city": "Davis",
        "state": "CA",
        "commission_rate": 0.10,
        "menu": [
            {"item_name": "Carne Asada Burrito", "price": 9.99, "category": "Burritos"},
            {"item_name": "Street Tacos (3)", "price": 7.99, "category": "Tacos"},
            {"item_name": "Loaded Nachos", "price": 8.49, "category": "Appetizers"},
            {"item_name": "Horchata", "price": 3.49, "category": "Drinks"},
        ],
    },
    {
        "id": 6,
        "email": "pho@example.com",
        "name": "Pho King Good",
        "cuisine_type": "Vietnamese",
        "address": "987 Birch Ln",
        "city": "Davis",
        "state": "CA",
        "commission_rate": 0.10,
        "menu": [
            {"item_name": "Pho Beef", "price": 11.99, "category": "Pho"},
            {"item_name": "Banh Mi Sandwich", "price": 8.99, "category": "Sandwiches"},
            {"item_name": "Spring Rolls (4)", "price": 7.49, "category": "Appetizers"},
        ],
    },
]

def seed_database():
    """Populate database with test data."""
    db = SessionLocal()
    
    try:
        # Clear existing data (order matters due to foreign keys)
        db.query(MenuItem).delete()
        db.query(Order).delete()
        db.query(Restaurant).delete()
        db.query(User).delete()
        db.commit()
        
        print("🌱 Seeding database with test data...")
        
        # Add test customer with explicit ID
        test_customer = User(
            id=1,
            first_name="Test",
            last_name="Customer",
            email="customer@example.com",
            password_hash=get_password_hash("password123"),
            role="customer",
            phone="555-0001",
        )
        db.add(test_customer)
        
        # Add restaurants and their menu items
        for rest_data in restaurants_data:
            menu_items = rest_data.pop("menu")
            rest_id = rest_data.pop("id")
            
            restaurant = Restaurant(
                id=rest_id,
                password_hash=get_password_hash("restaurantpass"),
                is_approved=True,
                **rest_data,
            )
            db.add(restaurant)
            db.flush()
            
            # Add menu items
            for menu_item in menu_items:
                item = MenuItem(
                    restaurant_id=rest_id,
                    **menu_item,
                )
                db.add(item)
        
        db.commit()
        print("✅ Database seeded successfully!")
        print(f"   Added {len(restaurants_data)} restaurants")
        print("   Test customer: customer@example.com / password123")
        print("   Restaurants: <email> / restaurantpass")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
