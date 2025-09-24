# api/group_challenges.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.dependencies import get_current_user
from backend.schemas import GroupChallengeCreate, GroupChallengeResponse
from backend.services.group_challenge_service import GroupChallengeService

router = APIRouter(prefix="/groups", tags=["group-challenges"])

@router.post("/{group_id}/challenges", response_model=GroupChallengeResponse)
def create_group_challenge(
    group_id: int,
    challenge_data: GroupChallengeCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new group challenge (leader only)"""
    challenge = GroupChallengeService.create_group_challenge(
        db, group_id, challenge_data, current_user.user_id
    )
    
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create challenge for this group"
        )
    
    # Get challenge details with progress
    challenge_details = GroupChallengeService.get_challenge_details(
        db, challenge.challenge_id, current_user.user_id
    )
    
    return GroupChallengeResponse(
        challenge_id=challenge.challenge_id,
        group_id=challenge.group_id,
        title=challenge.title,
        description=challenge.description,
        goal_type=challenge.goal_type,
        goal_value=float(challenge.goal_value),
        start_date=challenge.start_date,
        end_date=challenge.end_date,
        status=challenge.status,
        created_by=challenge.created_by,
        created_at=challenge.created_at,
        progress=challenge_details["progress"],
        completion_percentage=challenge_details["completion_percentage"]
    )

@router.get("/{group_id}/challenges", response_model=List[GroupChallengeResponse])
def get_group_challenges(
    group_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all challenges for a group"""
    # Update challenge statuses first
    GroupChallengeService.update_challenge_statuses(db)
    
    challenges = GroupChallengeService.get_group_challenges(db, group_id, current_user.user_id)
    
    response_list = []
    for challenge in challenges:
        challenge_details = GroupChallengeService.get_challenge_details(
            db, challenge.challenge_id, current_user.user_id
        )
        
        response_list.append(GroupChallengeResponse(
            challenge_id=challenge.challenge_id,
            group_id=challenge.group_id,
            title=challenge.title,
            description=challenge.description,
            goal_type=challenge.goal_type,
            goal_value=float(challenge.goal_value),
            start_date=challenge.start_date,
            end_date=challenge.end_date,
            status=challenge.status,
            created_by=challenge.created_by,
            created_at=challenge.created_at,
            progress=challenge_details["progress"],
            completion_percentage=challenge_details["completion_percentage"]
        ))
    
    return response_list

@router.post("/{group_id}/challenges/{challenge_id}/join", response_model=dict)
def join_group_challenge(
    group_id: int,
    challenge_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allow a user to join a group challenge."""
    try:
        GroupChallengeService.join_group_challenge(db, group_id, challenge_id, current_user.user_id)
        return {"message": "Successfully joined challenge."}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{group_id}/challenges/participations/{user_id}", response_model=List[dict])
def get_user_challenge_participations(
    group_id: int,
    user_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get challenges a user is participating in for a given group."""
    # Ensure the requesting user is the same as the user_id in the path or is an admin
    if current_user.user_id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view these participations.")

    participations = GroupChallengeService.get_user_challenge_participations(db, group_id, user_id)
    return [
        {"challenge_id": p.challenge_id, "user_id": p.user_id, "joined_at": p.joined_at}
        for p in participations
    ]

@router.get("/{group_id}/challenges/{challenge_id}", response_model=GroupChallengeResponse)
def get_challenge_detail(
    group_id: int,
    challenge_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific challenge details"""
    challenge_details = GroupChallengeService.get_challenge_details(
        db, challenge_id, current_user.user_id
    )
    
    if not challenge_details:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    challenge = challenge_details["challenge"]
    
    if challenge.group_id != group_id:
        raise HTTPException(status_code=400, detail="Challenge does not belong to this group")
    
    return GroupChallengeResponse(
        challenge_id=challenge.challenge_id,
        group_id=challenge.group_id,
        title=challenge.title,
        description=challenge.description,
        goal_type=challenge.goal_type,
        goal_value=float(challenge.goal_value),
        start_date=challenge.start_date,
        end_date=challenge.end_date,
        status=challenge.status,
        created_by=challenge.created_by,
        created_at=challenge.created_at,
        progress=challenge_details["progress"],
        completion_percentage=challenge_details["completion_percentage"]
    )

@router.get("/{group_id}/challenges/{challenge_id}/members")
def get_challenge_member_progress(
    group_id: int,
    challenge_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get individual member progress for a challenge"""
    # Verify access
    challenge_details = GroupChallengeService.get_challenge_details(
        db, challenge_id, current_user.user_id
    )
    
    if not challenge_details:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    # Get member progress
    from sqlalchemy import text
    query = text("""
        SELECT 
            u.id as user_id,
            u.name as username,
            gcm.progress,
            gcm.contribution,
            gcm.joined_at,
            gm.role
        FROM group_challenge_members gcm
        JOIN users u ON gcm.user_id = u.id
        JOIN group_members gm ON gcm.user_id = gm.user_id AND gm.group_id = :group_id
        WHERE gcm.challenge_id = :challenge_id
        ORDER BY gcm.contribution DESC
    """)
    
    result = db.execute(query, {"group_id": group_id, "challenge_id": challenge_id})
    
    member_progress = []
    for row in result.fetchall():
        member_progress.append({
            "user_id": row.user_id,
            "username": row.username,
            "role": row.role,
            "progress": float(row.progress or 0),
            "contribution": float(row.contribution or 0),
            "joined_at": row.joined_at
        })
    
    return {
        "challenge_id": challenge_id,
        "group_id": group_id,
        "member_progress": member_progress
    }

# Background task or scheduled job to update challenge progress
# This should be called whenever a user's CO2 saving data is updated

def update_user_challenge_progress(db: Session, user_id: int, co2_saved: float):
    """Call this function when user's daily CO2 saving is updated"""
    GroupChallengeService.update_challenge_progress(db, user_id, co2_saved)