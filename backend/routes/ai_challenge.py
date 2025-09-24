from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional # Optional 임포트 추가
from datetime import datetime, timedelta

from backend.database import get_db
from backend.dependencies import get_current_user
from backend.models import User, Challenge, ChallengeMember, ChallengeCompletionType, TransportMode

class AICallengeCreateRequest(BaseModel):
    title: str
    description: str
    reward: int
    target_mode: Optional[TransportMode] = TransportMode.ANY
    target_saved_g: Optional[float] = None
    target_distance_km: Optional[float] = None

router = APIRouter(
    prefix="/api/ai-challenges",
    tags=["ai-challenges"],
)

@router.post("/create-and-join")
async def create_and_join_ai_challenge(
    request: AICallengeCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a simple, manual-completion challenge suggested by the AI and enrolls the user.
    """
    try:
        # Create the new challenge
        new_challenge = Challenge(
            title=request.title,
            description=request.description,
            scope="PERSONAL",
            completion_type=ChallengeCompletionType.MANUAL,
            target_mode=request.target_mode,
            target_saved_g=request.target_saved_g,
            target_distance_km=request.target_distance_km,
            start_at=datetime.utcnow(),
            end_at=datetime.utcnow() + timedelta(days=7), # Give user a week to complete
            reward=f"{request.reward}C",
            created_by=current_user.user_id
        )
        db.add(new_challenge)
        db.flush() # Flush to get the new_challenge.challenge_id

        # Enroll the current user in the new challenge
        enrollment = ChallengeMember(
            challenge_id=new_challenge.challenge_id,
            user_id=current_user.user_id,
            joined_at=datetime.utcnow()
        )
        db.add(enrollment)
        db.commit()
        db.refresh(new_challenge)

        return {
            "message": "새로운 챌린지가 생성되고 참여가 완료되었습니다!",
            "challenge": new_challenge
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"챌린지 생성 중 오류 발생: {e}")