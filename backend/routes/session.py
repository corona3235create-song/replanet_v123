from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import json

from backend.database import get_db
from backend.models import User

router = APIRouter(prefix="/api/session", tags=["session"])

# 세션 데이터 저장 (메모리 기반 - 실제 운영에서는 Redis 등 사용)
session_store: Dict[str, Dict[str, Any]] = {}

@router.post("/create")
async def create_session(
    user_id: int,
    session_data: Optional[Dict[str, Any]] = None,
    db: Session = Depends(get_db)
):
    """새 세션을 생성합니다."""
    try:
        # 사용자 존재 확인
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # 세션 ID 생성
        session_id = f"session_{user_id}_{int(datetime.now().timestamp())}"
        
        # 세션 데이터 저장
        session_data = session_data or {}
        session_data.update({
            "user_id": user_id,
            "created_at": datetime.now().isoformat(),
            "last_activity": datetime.now().isoformat(),
            "is_active": True
        })
        
        session_store[session_id] = session_data
        
        return {
            "success": True,
            "session_id": session_id,
            "user_id": user_id,
            "created_at": session_data["created_at"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"세션 생성 실패: {str(e)}")

@router.get("/{session_id}")
async def get_session(session_id: str):
    """세션 정보를 조회합니다."""
    if session_id not in session_store:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_data = session_store[session_id]
    
    # 세션 만료 확인 (24시간)
    created_at = datetime.fromisoformat(session_data["created_at"])
    if datetime.now() - created_at > timedelta(hours=24):
        del session_store[session_id]
        raise HTTPException(status_code=410, detail="Session expired")
    
    return {
        "session_id": session_id,
        "session_data": session_data
    }

@router.put("/{session_id}/update")
async def update_session(
    session_id: str,
    update_data: Dict[str, Any]
):
    """세션 데이터를 업데이트합니다."""
    if session_id not in session_store:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_data = session_store[session_id]
    session_data.update(update_data)
    session_data["last_activity"] = datetime.now().isoformat()
    
    return {
        "success": True,
        "message": "세션이 업데이트되었습니다",
        "session_data": session_data
    }

@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """세션을 삭제합니다."""
    if session_id not in session_store:
        raise HTTPException(status_code=404, detail="Session not found")
    
    del session_store[session_id]
    
    return {
        "success": True,
        "message": "세션이 삭제되었습니다"
    }

@router.get("/user/{user_id}/sessions")
async def get_user_sessions(user_id: int):
    """사용자의 모든 활성 세션을 조회합니다."""
    user_sessions = []
    
    for session_id, session_data in session_store.items():
        if session_data.get("user_id") == user_id and session_data.get("is_active", False):
            user_sessions.append({
                "session_id": session_id,
                "created_at": session_data["created_at"],
                "last_activity": session_data["last_activity"]
            })
    
    return {
        "user_id": user_id,
        "sessions": user_sessions,
        "total_sessions": len(user_sessions)
    }

@router.post("/{session_id}/extend")
async def extend_session(session_id: str, hours: int = 24):
    """세션을 연장합니다."""
    if session_id not in session_store:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_data = session_store[session_id]
    session_data["last_activity"] = datetime.now().isoformat()
    session_data["expires_at"] = (datetime.now() + timedelta(hours=hours)).isoformat()
    
    return {
        "success": True,
        "message": f"세션이 {hours}시간 연장되었습니다",
        "expires_at": session_data["expires_at"]
    }

@router.get("/health/check")
async def session_health_check():
    """세션 시스템 상태를 확인합니다."""
    active_sessions = len([s for s in session_store.values() if s.get("is_active", False)])
    
    return {
        "status": "healthy",
        "total_sessions": len(session_store),
        "active_sessions": active_sessions,
        "timestamp": datetime.now().isoformat()
    }
