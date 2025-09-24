from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, models, schemas
from ..database import get_db
from ..dependencies import get_current_user # Import get_current_user

router = APIRouter(
    prefix="/api/achievements", # Change prefix to include /api
    tags=["Achievements"],
)

# Dummy achievements data for now
dummy_achievements_data = [
    {
        "id": 1,
        "name": "첫 친환경 이동",
        "desc": "첫 번째 친환경 교통수단 이용",
        "progress": 100,
        "unlocked": True,
        "date": "2025-01-10"
    },
    {
        "id": 2,
        "name": "탄소 절약 마스터",
        "desc": "총 10kg CO₂ 절약 달성",
        "progress": 100,
        "unlocked": True,
        "date": "2025-01-12"
    },
    {
        "id": 3,
        "name": "지하철 애호가",
        "desc": "지하철 20회 이용",
        "progress": 80,
        "unlocked": False
    },
    {
        "id": 4,
        "name": "자전거 라이더",
        "desc": "자전거 50km 주행",
        "progress": 60,
        "unlocked": False
    },
    {
        "id": 5,
        "name": "도보의 달인",
        "desc": "도보 100km 이동",
        "progress": 30,
        "unlocked": False
    },
    {
        "id": 6,
        "name": "연속 출석왕",
        "desc": "30일 연속 친환경 이동",
        "progress": 25,
        "unlocked": False
    },
    {
        "id": 7,
        "name": "에코 크레딧 수집가",
        "desc": "1000P 이상 적립",
        "progress": 100,
        "unlocked": True,
        "date": "2025-01-14"
    },
    {
        "id": 8,
        "name": "환경 보호자",
        "desc": "총 50kg CO₂ 절약 달성",
        "progress": 37,
        "unlocked": False
    }
]

@router.get("/", response_model=List[dict]) # Change path to "/" and add response_model
def get_achievements(current_user: models.User = Depends(get_current_user)): # Get user from dependency
    user_id = current_user.user_id # Get user_id from current_user
    # For now, return dummy data. In a real app, this would fetch from DB based on user_id
    print(f"Backend: Fetching achievements for user_id: {user_id}")
    return dummy_achievements_data
