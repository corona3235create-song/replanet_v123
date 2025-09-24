from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend import crud, schemas
from backend.database import get_db

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=schemas.UserRead)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db, user)

@router.get("/", response_model=list[schemas.UserRead])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_users(db, skip=skip, limit=limit)

@router.get("/{user_id}/context", response_model=schemas.UserContext)
def get_user_context(user_id: int, db: Session = Depends(get_db)):
    user_context = crud.get_user_with_group(db, user_id)
    if not user_context:
        raise HTTPException(status_code=404, detail="User not found")
    return user_context
