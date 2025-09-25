from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas
from ..database import get_db
from ..dependencies import get_current_user
from ..data.shop_data import SHOP_ITEMS

router = APIRouter(
    prefix="/api/garden",
    tags=["Garden"]
)

class PlaceRequest(schemas.BaseModel):
    item_id: str
    x: float
    y: float

@router.get("/inventory", response_model=List[schemas.InventoryItem])
def get_user_inventory(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get the current user's inventory of purchased items."""
    inventory_items = db.query(models.UserInventory).filter(models.UserInventory.user_id == current_user.user_id).all()
    
    response = []
    for inv_item in inventory_items:
        shop_item = next((item for item in SHOP_ITEMS if item["id"] == inv_item.item_id), None)
        if shop_item:
            response.append({
                "itemId": inv_item.item_id,
                "quantity": inv_item.quantity,
                "object": shop_item
            })
    return response

@router.get("/objects", response_model=List[schemas.PlacedObject])
def get_placed_objects(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all objects placed in the user's garden with full details."""
    placed_objects = db.query(models.PlacedObject).filter(models.PlacedObject.user_id == current_user.user_id).all()
    
    response = []
    for p_obj in placed_objects:
        shop_item = next((item for item in SHOP_ITEMS if item["id"] == p_obj.item_id), None)
        if shop_item:
            response.append({
                "placed_id": p_obj.placed_id,
                "item_id": p_obj.item_id,
                "x": p_obj.x,
                "y": p_obj.y,
                "object": shop_item
            })
    return response

@router.post("/place")
def place_object(
    request: PlaceRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Place an item from the inventory into the garden."""
    inventory_item = db.query(models.UserInventory).filter(
        models.UserInventory.user_id == current_user.user_id,
        models.UserInventory.item_id == request.item_id
    ).first()

    if not inventory_item or inventory_item.quantity <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Item not available in inventory")

    inventory_item.quantity -= 1

    new_placed_object = models.PlacedObject(
        user_id=current_user.user_id,
        item_id=request.item_id,
        x=request.x,
        y=request.y
    )
    db.add(new_placed_object)
    
    db.commit()
    db.refresh(new_placed_object)

    shop_item = next((item for item in SHOP_ITEMS if item["id"] == new_placed_object.item_id), None)
    return {
        "placed_id": new_placed_object.placed_id,
        "item_id": new_placed_object.item_id,
        "x": new_placed_object.x,
        "y": new_placed_object.y,
        "object": shop_item
    }

@router.post("/remove/{placed_id}")
def remove_object(
    placed_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Removes an object from the garden and returns it to the inventory."""
    placed_object = db.query(models.PlacedObject).filter(
        models.PlacedObject.placed_id == placed_id,
        models.PlacedObject.user_id == current_user.user_id
    ).first()

    if not placed_object:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Placed object not found")

    # Add item back to inventory
    inventory_item = db.query(models.UserInventory).filter(
        models.UserInventory.user_id == current_user.user_id,
        models.UserInventory.item_id == placed_object.item_id
    ).first()

    if inventory_item:
        inventory_item.quantity += 1
    else:
        inventory_item = models.UserInventory(
            user_id=current_user.user_id,
            item_id=placed_object.item_id,
            quantity=1
        )
        db.add(inventory_item)

    # Delete the placed object
    db.delete(placed_object)
    db.commit()

    return {"message": f"Object '{placed_object.item_id}' returned to inventory"}