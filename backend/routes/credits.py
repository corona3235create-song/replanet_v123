from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
import json

from backend.database import get_db
from backend.models import User, CreditsLedger, MobilityLog, UserGarden, GardenWateringLog, GardenLevel
from backend.schemas import (
    CreditBalance, CreditTransaction, CreditHistory, 
    GardenStatus, WateringRequest, WateringResponse, AddPointsRequest
)
from backend.dependencies import get_current_user

router = APIRouter(prefix="/api/credits", tags=["credits"])

# 크레딧 잔액 조회
@router.get("/balance", response_model=CreditBalance)
async def get_credit_balance(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """사용자의 크레딧 잔액을 조회합니다."""
    user_id = current_user.user_id
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 총 포인트 계산
    total_points = db.query(CreditsLedger).filter(
        CreditsLedger.user_id == user_id
    ).with_entities(
        func.sum(CreditsLedger.points)
    ).scalar() or 0
    print(f"DEBUG: get_credit_balance - User {user_id} calculated total_points: {total_points}") # Debug log
    
    # 최근 30일 적립 포인트
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_earned = db.query(CreditsLedger).filter(
        CreditsLedger.user_id == user_id,
        CreditsLedger.type == "EARN",
        CreditsLedger.created_at >= thirty_days_ago
    ).with_entities(
        func.sum(CreditsLedger.points)
    ).scalar() or 0
    
    # 총 탄소 절감량 계산
    total_carbon_reduced_g = db.query(MobilityLog).filter(
        MobilityLog.user_id == user_id
    ).with_entities(
        func.sum(MobilityLog.co2_saved_g)
    ).scalar() or 0.0
    
    return CreditBalance(
        user_id=user_id,
        total_points=total_points,
        recent_earned=recent_earned,
        last_updated=datetime.utcnow(),
        total_carbon_reduced_g=float(total_carbon_reduced_g) # 추가된 필드
    )

# 크레딧 거래 내역 조회
@router.get("/history/{user_id}", response_model=List[CreditTransaction])
async def get_credit_history(
    limit: int = 20, 
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """사용자의 크레딧 거래 내역을 조회합니다."""
    user_id = current_user.user_id
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    transactions = db.query(CreditsLedger).filter(
        CreditsLedger.user_id == user_id
    ).order_by(
        CreditsLedger.created_at.desc()
    ).offset(offset).limit(limit).all()
    
    return [
        CreditTransaction(
            entry_id=tx.entry_id,
            type=tx.type,
            points=tx.points,
            reason=tx.reason,
            created_at=tx.created_at,
            meta=tx.meta_json
        )
        for tx in transactions
    ]

# 포인트 적립
@router.post("/earn", response_model=CreditTransaction)
async def earn_points(
    points: int,
    reason: str,
    ref_log_id: Optional[int] = None,
    meta: Optional[dict] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """사용자에게 포인트를 적립합니다."""
    user_id = current_user.user_id
    if points <= 0:
        raise HTTPException(status_code=400, detail="Points must be positive")
    
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 크레딧 장부에 기록
    credit_entry = CreditsLedger(
        user_id=user_id,
        ref_log_id=ref_log_id,
        type="EARN",
        points=points,
        reason=reason,
        meta_json=meta
    )
    
    db.add(credit_entry)
    db.commit()
    db.refresh(credit_entry)
    
    return CreditTransaction(
        entry_id=credit_entry.entry_id,
        type=credit_entry.type,
        points=credit_entry.points,
        reason=credit_entry.reason,
        created_at=credit_entry.created_at,
        meta=credit_entry.meta_json
    )

# 포인트 사용
@router.post("/spend", response_model=CreditTransaction)
async def spend_points(
    points: int,
    reason: str,
    meta: Optional[dict] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """사용자의 포인트를 차감합니다."""
    user_id = current_user.user_id
    if points <= 0:
        raise HTTPException(status_code=400, detail="Points must be positive")
    
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 현재 잔액 확인
    current_balance = db.query(CreditsLedger).filter(
        CreditsLedger.user_id == user_id
    ).with_entities(
        func.sum(CreditsLedger.points)
    ).scalar() or 0
    
    if current_balance < points:
        raise HTTPException(status_code=400, detail="Insufficient points")
    
    # 크레딧 장부에 기록 (음수로 저장)
    credit_entry = CreditsLedger(
        user_id=user_id,
        type="SPEND",
        points=-points,
        reason=reason,
        meta_json=meta
    )
    
    db.add(credit_entry)
    db.commit()
    db.refresh(credit_entry)
    
    return CreditTransaction(
        entry_id=credit_entry.entry_id,
        type=credit_entry.type,
        points=credit_entry.points,
        reason=credit_entry.reason,
        created_at=credit_entry.created_at,
        meta=credit_entry.meta_json
    )

# 정원 물주기
@router.post("/garden/water", response_model=WateringResponse)
async def water_garden(
    request: WateringRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """정원에 물을 줍니다."""
    user_id = current_user.user_id
    # request.user_id는 더 이상 사용하지 않음 (JWT에서 추출한 user_id 사용)
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 사용자 정원 조회
    garden = db.query(UserGarden).filter(
        UserGarden.user_id == user_id
    ).first()
    
    if not garden:
        # 첫 번째 레벨로 정원 생성
        first_level = db.query(GardenLevel).filter(
            GardenLevel.level_number == 1
        ).first()
        if not first_level:
            raise HTTPException(status_code=500, detail="Garden levels not initialized")
        
        garden = UserGarden(
            user_id=user_id,
            current_level_id=first_level.level_id,
            waters_count=0,
            total_waters=0
        )
        db.add(garden)
        db.commit()
        db.refresh(garden)
    
    # 현재 잔액 확인
    current_balance = db.query(CreditsLedger).filter(
        CreditsLedger.user_id == user_id
    ).with_entities(
        func.sum(CreditsLedger.points)
    ).scalar() or 0
    print(f"DEBUG: water_garden - User {user_id} current balance BEFORE deduction: {current_balance}") # Debug log
    
    if current_balance < request.points_spent:
        raise HTTPException(status_code=400, detail="Insufficient points")
    
    # 포인트 차감
    credit_entry = CreditsLedger(
        user_id=user_id,
        type="SPEND",
        points=-request.points_spent,
        reason="GARDEN_WATERING",
        meta_json={"garden_id": garden.garden_id}
    )
    db.add(credit_entry)
    
    # 물주기 로그 기록
    watering_log = GardenWateringLog(
        garden_id=garden.garden_id,
        user_id=user_id,
        points_spent=request.points_spent
    )
    db.add(watering_log)
    
    # 정원 상태 업데이트
    garden.waters_count += 1
    garden.total_waters += 1
    
    # 레벨 업 체크
    current_level = garden.level
    level_up = False
    new_level = None
    
    if garden.waters_count >= current_level.required_waters:
        # 다음 레벨로 업그레이드
        next_level = db.query(GardenLevel).filter(
            GardenLevel.level_number == current_level.level_number + 1
        ).first()
        
        if next_level:
            garden.current_level_id = next_level.level_id
            garden.waters_count = 0
            level_up = True
            new_level = next_level
    
    db.commit()
    db.refresh(garden)
    
    # After commit, re-query balance to confirm
    updated_balance = db.query(CreditsLedger).filter(
        CreditsLedger.user_id == user_id
    ).with_entities(
        func.sum(CreditsLedger.points)
    ).scalar() or 0
    print(f"DEBUG: water_garden - User {user_id} balance AFTER deduction and commit: {updated_balance}") # Debug log
    
    return WateringResponse(
        success=True,
        garden_id=garden.garden_id,
        waters_count=garden.waters_count,
        total_waters=garden.total_waters,
        level_up=level_up,
        new_level=new_level.level_name if new_level else None,
        points_spent=request.points_spent,
        remaining_points=current_balance - request.points_spent
    )

# 정원 상태 조회
@router.get("/garden/{user_id}", response_model=GardenStatus)
async def get_garden_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """사용자의 정원 상태를 조회합니다."""
    user_id = current_user.user_id
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    garden = db.query(UserGarden).filter(
        UserGarden.user_id == user_id
    ).first()
    
    if not garden:
        # 기본 정원 상태 반환
        return GardenStatus(
            user_id=user_id,
            level_number=1,
            level_name="씨앗단계",
            image_path="/images/0.png",
            waters_count=0,
            total_waters=0,
            required_waters=10,
            status="IN_PROGRESS"
        )
    
    current_level = garden.level
    
    return GardenStatus(
        user_id=user_id,
        level_number=current_level.level_number,
        level_name=current_level.level_name,
        image_path=current_level.image_path,
        waters_count=garden.waters_count,
        total_waters=garden.total_waters,
        required_waters=current_level.required_waters,
        status="COMPLETED" if garden.waters_count >= current_level.required_waters else "IN_PROGRESS"
    )

# 포인트 총합 조회 (간단한 버전)
@router.get("/total/{user_id}")
async def get_total_points(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """사용자의 총 포인트를 조회합니다."""
    user_id = current_user.user_id
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            return {"total_points": 0}  # 사용자 없으면 0 반환
        
        total_points = db.query(CreditsLedger).filter(
            CreditsLedger.user_id == user_id
        ).with_entities(
            func.sum(CreditsLedger.points)
        ).scalar() or 0
        
        return {"total_points": total_points}
    except Exception as e:
        print(f"Error fetching total points: {e}")
        return {"total_points": 0}

# 포인트 업데이트
@router.post("/update")
async def update_total_points(
    total_points: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """사용자의 총 포인트를 업데이트합니다."""
    user_id = current_user.user_id
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            return {"success": False, "message": "User not found"}
        
        # 현재 총 포인트와의 차이 계산
        current_total = db.query(CreditsLedger).filter(
            CreditsLedger.user_id == user_id
        ).with_entities(
            func.sum(CreditsLedger.points)
        ).scalar() or 0
        
        points_diff = total_points - current_total
        
        if points_diff != 0:
            # 차이만큼 포인트 추가/차감
            credit_entry = CreditsLedger(
                user_id=user_id,
                type="EARN" if points_diff > 0 else "SPEND",
                points=points_diff,
                reason="MANUAL_UPDATE",
                meta_json={"manual_update": True}
            )
            db.add(credit_entry)
            db.commit()
        
        return {"success": True, "message": "Points updated successfully"}
    except Exception as e:
        print(f"Error updating points: {e}")
        return {"success": False, "message": "Points update failed"}

# 포인트 추가
@router.post("/add")
async def add_points(
    request: AddPointsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """사용자에게 포인트를 추가/차감합니다. (양수: 추가, 음수: 차감)"""
    user_id = current_user.user_id
    try:
        # request.user_id는 더 이상 사용하지 않음 (JWT에서 추출한 user_id 사용)
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            return {"success": False, "message": "User not found"}
        
        # 음수 포인트인 경우 잔액 확인
        if request.points < 0:
            total_points = db.query(CreditsLedger).filter(
                CreditsLedger.user_id == user_id
            ).with_entities(
                func.sum(CreditsLedger.points)
            ).scalar() or 0
            
            if total_points + request.points < 0:
                return {"success": False, "message": "Insufficient credits"}
        
        # 거래 타입 결정
        transaction_type = "EARN" if request.points > 0 else "SPEND"
        
        # 포인트 추가/차감
        credit_entry = CreditsLedger(
            user_id=user_id,
            type=transaction_type,
            points=request.points,
            reason=request.reason,
            meta_json={"points_change": request.points}
        )
        db.add(credit_entry)
        db.commit()
        
        action = "Added" if request.points > 0 else "Deducted"
        return {"success": True, "message": f"{action} {abs(request.points)} points successfully"}
    except Exception as e:
        print(f"Error adding points: {e}")
        return {"success": False, "message": "Points added failed"}

# 대중교통 이용 내역 조회
@router.get("/mobility/{user_id}", response_model=List[dict])
async def get_mobility_history(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """사용자의 대중교통 이용 내역을 조회합니다."""
    user_id = current_user.user_id
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    logs = db.query(MobilityLog).filter(
        MobilityLog.user_id == user_id
    ).order_by(
        MobilityLog.started_at.desc()
    ).offset(offset).limit(limit).all()
    
    return [
        {
            "log_id": log.log_id,
            "mode": log.mode,
            "distance_km": float(log.distance_km),
            "started_at": log.started_at,
            "ended_at": log.ended_at,
            "co2_saved_g": float(log.co2_saved_g) if log.co2_saved_g else 0,
            "points_earned": log.points_earned,
            "description": log.description,
            "start_point": log.start_point,
            "end_point": log.end_point
        }
        for log in logs
    ]