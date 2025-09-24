# backend/routes/dashboard.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from typing import Dict, Any, List
from datetime import datetime, timedelta
from ..database import get_db
from ..models import User, CreditsLedger, MobilityLog, UserGarden, GardenLevel
from ..schemas import DashboardStats, DailySaving, ModeStat, ChallengeStat, DailyStats, WeeklyStats
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

import os

# 📌 챌린지 목표 (환경 변수에서 로드, 기본값 100kg)
CHALLENGE_GOAL_KG = float(os.getenv("DEFAULT_CHALLENGE_GOAL_KG", 100))

@router.get("/", response_model=DashboardStats)
async def get_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> DashboardStats:
    """
    대시보드 통합 API
    - 오늘 절약량
    - 오늘 획득 포인트
    - 정원 레벨
    - 누적 절약량
    - 최근 7일 절감량
    - 교통수단별 절감 비율
    - 챌린지 진행 상황
    """
    user_id = current_user.user_id
    # 사용자 존재 확인
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 📌 오늘 절약량 (g)
    co2_saved_today = db.query(func.sum(MobilityLog.co2_saved_g)).filter(
        MobilityLog.user_id == user_id,
        func.date(MobilityLog.created_at) == datetime.utcnow().date()
    ).scalar() or 0

    # 📌 오늘 획득 크레딧
    eco_credits_earned = db.query(func.sum(CreditsLedger.points)).filter(
        CreditsLedger.user_id == user_id,
        CreditsLedger.type == 'EARN',
        func.date(CreditsLedger.created_at) == datetime.utcnow().date()
    ).scalar() or 0

    # 📌 정원 레벨 정보
    garden = db.query(UserGarden).filter(UserGarden.user_id == user_id).first()
    garden_level = 1
    if garden and garden.level:
        garden_level = garden.level.level_number

    # 📌 누적 절약량 (kg)
    total_saved_g = db.query(func.sum(MobilityLog.co2_saved_g)).filter(MobilityLog.user_id == user_id).scalar() or 0
    total_saved_kg = total_saved_g / 1000
    print(f"DEBUG: Dashboard total_saved_g for user {user_id}: {total_saved_g}g ({total_saved_kg}kg)") # Debug print

    # 📌 누적 크레딧
    total_points = db.query(func.sum(CreditsLedger.points)).filter(CreditsLedger.user_id == user_id).scalar() or 0

    # 📌 최근 7일 절감량
    last7days_data = db.query(
        func.date(MobilityLog.created_at),
        func.sum(MobilityLog.co2_saved_g)
    ).filter(
        MobilityLog.user_id == user_id,
        MobilityLog.created_at >= datetime.utcnow().date() - timedelta(days=7)
    ).group_by(func.date(MobilityLog.created_at)).order_by(func.date(MobilityLog.created_at)).all()

    last7days = [DailySaving(date=str(d), saved_g=s) for d, s in last7days_data]

    # 📌 교통수단별 절감 비율
    mode_stats_data = db.query(
        MobilityLog.mode,
        func.sum(MobilityLog.co2_saved_g)
    ).filter(MobilityLog.user_id == user_id).group_by(MobilityLog.mode).all()

    modeStats = [ModeStat(mode=m, saved_g=s) for m, s in mode_stats_data]

    # 📌 챌린지 진행 상황
    challenge = ChallengeStat(goal=CHALLENGE_GOAL_KG, progress=total_saved_kg)

    return DashboardStats(
        user_id=user_id,
        co2_saved_today=co2_saved_today,
        eco_credits_earned=eco_credits_earned,
        garden_level=garden_level,
        total_saved=total_saved_kg,
        total_points=total_points,
        last7days=last7days,
        modeStats=modeStats,
        challenge=challenge
    )

@router.get("/{user_id}/daily", response_model=List[DailyStats])
async def get_daily_stats(days: int = 7, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> List[DailyStats]:
    """최근 N일간의 일별 통계를 조회합니다."""
    user_id = current_user.user_id
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    daily_query = text("""
        SELECT 
            DATE(created_at) AS date,
            IFNULL(SUM(co2_saved_g), 0) AS co2_saved,
            IFNULL(SUM(points_earned), 0) AS points_earned,
            COUNT(*) AS activities_count
        FROM mobility_logs
        WHERE user_id = :user_id
        AND created_at >= CURDATE() - INTERVAL :days DAY
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    """)
    
    daily_rows = db.execute(daily_query, {"user_id": user_id, "days": days}).fetchall()
    
    return [
        DailyStats(
            date=str(row[0]),
            co2_saved=float(row[1]) / 1000,  # g → kg 변환
            points_earned=int(row[2]),
            activities_count=int(row[3])
        )
        for row in daily_rows
    ]

@router.get("/{user_id}/weekly", response_model=List[WeeklyStats])
async def get_weekly_stats(weeks: int = 4, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> List[WeeklyStats]:
    """최근 N주간의 주별 통계를 조회합니다."""
    user_id = current_user.user_id
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    weekly_query = text("""
        SELECT 
            YEARWEEK(created_at) AS week_num,
            MIN(DATE(created_at)) AS week_start,
            MAX(DATE(created_at)) AS week_end,
            IFNULL(SUM(co2_saved_g), 0) AS total_co2_saved,
            IFNULL(SUM(points_earned), 0) AS total_points_earned,
            COUNT(*) AS total_activities
        FROM mobility_logs
        WHERE user_id = :user_id
        AND created_at >= CURDATE() - INTERVAL :weeks WEEK
        GROUP BY YEARWEEK(created_at)
        ORDER BY week_num ASC
    """)
    
    weekly_rows = db.execute(weekly_query, {"user_id": user_id, "weeks": weeks}).fetchall()
    
    return [
        WeeklyStats(
            week_start=str(row[1]),
            week_end=str(row[2]),
            total_co2_saved=float(row[3]) / 1000,  # g → kg 변환
            total_points_earned=int(row[4]),
            total_activities=int(row[5]),
            daily_breakdown=[]  # 필요시 별도 구현
        )
        for row in weekly_rows
    ]

@router.get("/{user_id}/transport-modes")
async def get_transport_mode_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """교통수단별 절감 통계를 조회합니다."""
    user_id = current_user.user_id
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    mode_query = text("""
        SELECT 
            mode,
            SUM(co2_saved_g) AS saved_g,
            COUNT(*) AS usage_count,
            AVG(distance_km) AS avg_distance
        FROM mobility_logs
        WHERE user_id = :user_id
        GROUP BY mode
        ORDER BY saved_g DESC
    """)
    
    mode_rows = db.execute(mode_query, {"user_id": user_id}).fetchall()
    
    return [
        {
            "mode": row[0],
            "saved_g": float(row[1]),
            "usage_count": int(row[2]),
            "avg_distance": float(row[3]) if row[3] else 0.0
        }
        for row in mode_rows
    ]