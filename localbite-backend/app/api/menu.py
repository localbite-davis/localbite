from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.menu import MenuItemCreate, MenuItemOut, MenuItemUpdate
from app.crud import menu as crud_menu
from app.models.menu import MenuItem

router = APIRouter(prefix="/menu", tags=["Menu"])

@router.post("/", response_model=MenuItemOut, status_code=status.HTTP_201_CREATED)
def create_menu_item(payload: MenuItemCreate, db: Session = Depends(get_db)):
    # Validate restaurant exists? CRUD doesn't check foreign key constraints explicitly until commit.
    # It will raise IntegrityError if restaurant_id doesn't exist.
    return crud_menu.create(db=db, payload=payload)

@router.get("/{menu_id}", response_model=MenuItemOut)
def get_menu_item(menu_id: int, db: Session = Depends(get_db)):
    db_obj = crud_menu.get_by_id(db, menu_id=menu_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return db_obj

@router.get("/restaurant/{restaurant_id}", response_model=List[MenuItemOut])
def get_menu_by_restaurant(restaurant_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_menu.list_by_restaurant(db, restaurant_id=restaurant_id, skip=skip, limit=limit)

@router.put("/{menu_id}", response_model=MenuItemOut)
def update_menu_item(menu_id: int, payload: MenuItemUpdate, db: Session = Depends(get_db)):
    db_obj = crud_menu.get_by_id(db, menu_id=menu_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return crud_menu.update(db=db, db_obj=db_obj, payload=payload)

@router.delete("/{menu_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_menu_item(menu_id: int, db: Session = Depends(get_db)):
    db_obj = crud_menu.get_by_id(db, menu_id=menu_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Menu item not found")
    crud_menu.delete(db=db, db_obj=db_obj)
