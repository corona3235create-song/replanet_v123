import os
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List, Dict, Any

from .. import schemas, models, database # Import database module
from ..database import get_db # Import get_db function
from ..dependencies import get_current_user # Assuming authentication is required
from backend.services.mobility_service import MobilityService # NEW IMPORT

router = APIRouter(
    prefix="/mobility",
    tags=["mobility"],
)

@router.post("/log", response_model=schemas.MobilityLogResponse)
async def log_mobility_data(
    log_data: schemas.MobilityLogCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Ensure the user_id in the log_data matches the authenticated user
    if log_data.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot log data for another user"
        )

    db_mobility_log = MobilityService.log_mobility(db, log_data, current_user)
    
    return schemas.MobilityLogResponse(
        log_id=db_mobility_log.log_id,
        user_id=db_mobility_log.user_id,
        mode=db_mobility_log.mode,
        distance_km=db_mobility_log.distance_km,
        started_at=db_mobility_log.started_at,
        ended_at=db_mobility_log.ended_at,
        co2_saved_g=db_mobility_log.co2_saved_g,
        eco_credits_earned=db_mobility_log.points_earned,
        description=db_mobility_log.description,
        start_point=db_mobility_log.start_point,
        end_point=db_mobility_log.end_point,
    )

@router.get("/point-rules")
async def get_point_rules() -> List[Dict[str, Any]]:
    """현재 설정된 교통수단별 포인트 적립 규칙을 조회합니다."""
    rules = []
    car_emission_baseline = CARBON_EMISSION_FACTORS_G_PER_KM.get(schemas.TransportMode.CAR, 170)

    for mode, emission_factor in CARBON_EMISSION_FACTORS_G_PER_KM.items():
        if mode in [schemas.TransportMode.WALK, schemas.TransportMode.BIKE, schemas.TransportMode.BUS, schemas.TransportMode.SUBWAY]:
            # Calculate CO2 saved per km against car baseline
            co2_saved_per_km = (car_emission_baseline - emission_factor)
            points_per_km = int(co2_saved_per_km * CREDIT_PER_G_CO2)
            if points_per_km > 0:
                rules.append({
                    "mode": mode.value,
                    "points_per_km": points_per_km,
                    "description": f"{mode.value} 이용 시 1km당 {points_per_km} 포인트 적립"
                })
    # Add a generic rule for other eco-friendly activities if applicable
    rules.append({
        "mode": "기타 친환경 활동",
        "points_per_activity": 100, # Example fixed points for other activities
        "description": "기타 친환경 활동 시 100 포인트 적립 (예: 분리수거, 에너지 절약)"
    })
    return rules

@router.get("/history/{user_id}") # Removed response_model for simplicity
def get_mobility_history(user_id: int):
    print(f"DEBUG: get_mobility_history hit for user_id: {user_id}")
    return {"message": f"Mobility history for user {user_id} (test response)"}
