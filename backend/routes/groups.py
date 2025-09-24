# api/groups.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.dependencies import get_current_user
from backend.schemas import GroupCreateWithUsernames, GroupUpdate, Group as GroupSchema
from backend.services.group_service import GroupService

router = APIRouter(prefix="/groups", tags=["groups"])

@router.post("/", response_model=GroupSchema)
def create_group(
    group_data: GroupCreateWithUsernames,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new group with specified members."""
    return GroupService.create_group(db, group_data, current_user.user_id)

@router.get("/", response_model=List[GroupSchema])
def get_user_groups(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all groups for the current user."""
    return GroupService.get_user_groups(db, current_user.user_id)

@router.get("/ranking", response_model=List[dict])
def get_global_group_ranking(
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get a global ranking of groups."""
    return GroupService.get_global_group_ranking(db, limit)

@router.get("/{group_id}", response_model=GroupSchema)
def get_group(
    group_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single group by its ID."""
    group = GroupService.get_group_by_id(db, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group

@router.delete("/{group_id}", response_model=dict)
def delete_group(
    group_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a group (leader only)."""
    try:
        success = GroupService.delete_group(db, group_id, current_user.user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Group not found or not authorized.")
        return {"message": "Group deleted successfully."}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{group_id}/leave", response_model=dict)
def leave_group(
    group_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Leave a group."""
    try:
        success = GroupService.leave_group(db, group_id, current_user.user_id)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to leave group")
        return {"message": "Successfully left group"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{group_id}/members", response_model=List[dict])
def get_group_members(
    group_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all members of a group."""
    members = GroupService.get_group_members(db, group_id)
    return members
