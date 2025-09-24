from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import database, schemas, models
from backend.services.mobility_service import MobilityService # NEW IMPORT

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

@router.get("/users", response_model=List[schemas.User])
def get_all_users(db: Session = Depends(database.get_db)):
    users = db.query(models.User).all()
    return users

@router.post("/grant-points")
def grant_points(
    request: schemas.AddPointsRequest,
    db: Session = Depends(database.get_db)
):
    # 기존 credits.py의 add_points 로직을 재활용
    # user_id는 request.user_id (string)로 넘어옴
    try:
        user_id_int = int(request.user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user_id format")

    user = db.query(models.User).filter(models.User.user_id == user_id_int).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 포인트 추가/차감
    transaction_type = "EARN" if request.points > 0 else "SPEND"
    credit_entry = models.CreditsLedger(
        user_id=user_id_int,
        type=transaction_type,
        points=request.points,
        reason=request.reason,
        meta_json={"admin_action": True}
    )
    db.add(credit_entry)
    db.commit()
    db.refresh(credit_entry)

    return {"message": f"{request.points} points {transaction_type.lower()}ed for user {user_id_int}"}

@router.delete("/users/{user_id}")
def delete_user_by_admin(user_id: int, db: Session = Depends(database.get_db)):
    deleted_user = crud.delete_user(db=db, user_id=user_id)
    if not deleted_user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"User {user_id} deleted successfully"}

@router.post("/add-mobility-log")
def add_mobility_log(
    log_create: schemas.MobilityLogCreate,
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.user_id == log_create.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_mobility_log = MobilityService.log_mobility(db, log_create, user)

    return {"message": f"Mobility log added and {db_mobility_log.points_earned} points earned for user {log_create.user_id}"}
