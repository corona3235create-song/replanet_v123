from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend import models
from backend.database import get_db

router = APIRouter(prefix="/garden", tags=["garden"])

@router.get("/{user_id}")
def get_garden_data(user_id: int, db: Session = Depends(get_db)):
    """
    특정 사용자의 총 탄소 절감량과 에코 포인트 반환
    """
    # 총 탄소 절감량 (mobility_logs.co2_saved_g 합계)
    total_carbon = db.query(
        func.coalesce(func.sum(models.MobilityLog.co2_saved_g), 0)
    ).filter(models.MobilityLog.user_id == user_id).scalar()

    # 총 포인트 (credits_ledger.points 합계)
    total_points = db.query(
        func.coalesce(func.sum(models.CreditsLedger.points), 0)
    ).filter(models.CreditsLedger.user_id == user_id).scalar()

    return {
        "total_carbon_reduced": float(total_carbon),
        "total_points": int(total_points)
    }
