from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from .. import models, schemas, crud
from ..database import get_db
from ..dependencies import get_current_user
from ..data.shop_data import SHOP_ITEMS

router = APIRouter(
    prefix="/api/shop",
    tags=["Shop"]
)

class BuyRequest(schemas.BaseModel):
    item_id: str
    quantity: int

@router.get("/items", response_model=List[schemas.GardenObject])
def get_shop_items():
    """Returns a list of all items available in the shop."""
    return SHOP_ITEMS

@router.post("/buy")
def buy_item(
    request: BuyRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Purchase an item from the shop, deducting credits and adding it to the user's inventory."""
    item_to_buy = next((item for item in SHOP_ITEMS if item["id"] == request.item_id), None)
    if not item_to_buy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    total_cost = item_to_buy["price"] * request.quantity

    # 1. Check user's credit balance
    current_balance = db.query(models.CreditsLedger).with_entities(
        func.sum(models.CreditsLedger.points)
    ).filter(models.CreditsLedger.user_id == current_user.user_id).scalar() or 0

    if current_balance < total_cost:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient credits")

    # 2. Deduct credits by creating a new ledger entry
    credit_entry = models.CreditsLedger(
        user_id=current_user.user_id,
        type="SPEND",
        points=-total_cost,
        reason=f"Purchased {item_to_buy['name']} x{request.quantity}"
    )
    db.add(credit_entry)

    # 3. Add item to user's inventory
    inventory_item = db.query(models.UserInventory).filter(
        models.UserInventory.user_id == current_user.user_id,
        models.UserInventory.item_id == request.item_id
    ).first()

    if inventory_item:
        inventory_item.quantity += request.quantity
    else:
        inventory_item = models.UserInventory(
            user_id=current_user.user_id,
            item_id=request.item_id,
            quantity=request.quantity
        )
        db.add(inventory_item)
    
    db.commit()
    db.refresh(inventory_item)

    return {"message": "Purchase successful", "item": inventory_item}
