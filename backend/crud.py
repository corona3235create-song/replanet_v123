from sqlalchemy.orm import Session
from datetime import datetime, timezone
from sqlalchemy import func
from . import models, schemas
from .schemas import UserContext

# =========================
# UserGroup
# =========================
def create_user_group(db: Session, group: schemas.UserGroupCreate):
    db_group = models.UserGroup(
        group_name=group.group_name,
        group_type=group.group_type,
        region_code=group.region_code
    )
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group

def get_user_groups(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.UserGroup).offset(skip).limit(limit).all()


# =========================
# User
# =========================
def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=user.password_hash,
        role=user.role,
        user_group_id=user.user_group_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.user_id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def delete_user(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        return None

    # Delete related MobilityLogs
    db.query(models.MobilityLog).filter(models.MobilityLog.user_id == user_id).delete(synchronize_session=False)
    # Delete related CreditsLedger entries
    db.query(models.CreditsLedger).filter(models.CreditsLedger.user_id == user_id).delete(synchronize_session=False)
    # Delete related ChallengeMembers
    db.query(models.ChallengeMember).filter(models.ChallengeMember.user_id == user_id).delete(synchronize_session=False)
    # Delete related UserGarden and GardenWateringLogs
    db.query(models.GardenWateringLog).filter(models.GardenWateringLog.user_id == user_id).delete(synchronize_session=False)
    db.query(models.UserGarden).filter(models.UserGarden.user_id == user_id).delete(synchronize_session=False)
    # Delete Challenges created by the user
    db.query(models.Challenge).filter(models.Challenge.created_by == user_id).delete(synchronize_session=False)
    # Delete UserAchievements
    db.query(models.UserAchievement).filter(models.UserAchievement.user_id == user_id).delete(synchronize_session=False)
    # Delete Notifications
    db.query(models.Notification).filter(models.Notification.user_id == user_id).delete(synchronize_session=False)
    # Delete IngestRaw entries
    db.query(models.IngestRaw).filter(models.IngestRaw.user_id == user_id).delete(synchronize_session=False)

    db.delete(user)
    db.commit()
    return user

def get_user_with_group(db: Session, user_id: int) -> UserContext | None:
    result = (
        db.query(models.User.username, models.UserGroup.group_name, models.UserGroup.group_type)
        .join(models.UserGroup, models.User.user_group_id == models.UserGroup.group_id, isouter=True)
        .filter(models.User.user_id == user_id)
        .first()
    )
    if result:
        username, group_name, group_type = result
        return UserContext(username=username, group_name=group_name, group_type=group_type)
    return None

def authenticate_user(db: Session, username: str, password: str):
    # In a real application, you would hash the password and compare it with the stored hash.
    # For simplicity, we're doing a direct comparison here.
    # Also, you might want to allow login with email as well.
    user = db.query(models.User).filter(
        (models.User.username == username) | (models.User.email == username)
    ).first()
    if not user or user.password_hash != password: # Assuming password_hash stores plain password for now
        return None
    return user

# =========================
# MobilityLog
# =========================
def create_mobility_log(db: Session, log: schemas.MobilityLogCreate):
    # Get carbon factor for the mode
    carbon_factor = db.query(models.CarbonFactor).filter(
        models.CarbonFactor.mode == log.mode,
        models.CarbonFactor.valid_from <= log.started_at,
        models.CarbonFactor.valid_to >= log.ended_at
    ).first()

    if not carbon_factor:
        # Fallback or raise error if no carbon factor found
        # For simplicity, let's assume a default or raise an error
        # For now, we'll use a default if not found, or 0 saved
        co2_saved_g = 0.0
        print(f"Warning: No carbon factor found for mode {log.mode}. CO2 saved set to 0.")
    else:
        co2_saved_g = float(log.distance_km) * float(carbon_factor.g_per_km)

    # Calculate points earned (e.g., 1 point per 100g CO2 saved)
    points_earned = int(co2_saved_g / 100) # 1 point per 100g saved

    db_log = models.MobilityLog(
        user_id=log.user_id,
        mode=log.mode,
        distance_km=log.distance_km,
        started_at=log.started_at,
        ended_at=log.ended_at,
        co2_saved_g=co2_saved_g,
        points_earned=points_earned,
        description=log.description,
        start_point=log.start_point,
        end_point=log.end_point,
        # source_id, raw_ref_id, co2_baseline_g, co2_actual_g, used_at can be added if needed
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

# =========================
# Challenge
# =========================
def create_challenge(db: Session, challenge: schemas.ChallengeCreate):
    db_challenge = models.Challenge(
        title=challenge.title,
        description=challenge.description,
        scope=challenge.scope,
        target_mode=challenge.target_mode,
        goal_type=challenge.goal_type,
        goal_target_value=challenge.goal_target_value,
        start_at=challenge.start_at,
        end_at=challenge.end_at,
        reward=challenge.reward,
        created_by=challenge.created_by
    )
    db.add(db_challenge)
    db.commit()
    db.refresh(db_challenge)
    return db_challenge

def get_challenge(db: Session, challenge_id: int):
    return db.query(models.Challenge).filter(models.Challenge.challenge_id == challenge_id).first()

def get_challenges(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Challenge).offset(skip).limit(limit).all()

def update_challenge(db: Session, challenge_id: int, challenge: schemas.ChallengeCreate):
    db_challenge = db.query(models.Challenge).filter(models.Challenge.challenge_id == challenge_id).first()
    if db_challenge:
        for key, value in challenge.dict(exclude_unset=True).items():
            setattr(db_challenge, key, value)
        db.commit()
        db.refresh(db_challenge)
    return db_challenge

def delete_challenge(db: Session, challenge_id: int):
    db_challenge = db.query(models.Challenge).filter(models.Challenge.challenge_id == challenge_id).first()
    if db_challenge:
        db.delete(db_challenge)
        db.commit()
    return db_challenge

# =========================
# ChallengeMember
# =========================
def join_challenge(db: Session, user_id: int, challenge_id: int):
    # Check if the user has already joined this challenge
    existing_member = db.query(models.ChallengeMember).filter(
        models.ChallengeMember.user_id == user_id,
        models.ChallengeMember.challenge_id == challenge_id
    ).first()

    if existing_member:
        # User has already joined, return the existing membership
        return existing_member
    
    db_member = models.ChallengeMember(user_id=user_id, challenge_id=challenge_id)
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member

def leave_challenge(db: Session, user_id: int, challenge_id: int):
    db_member = db.query(models.ChallengeMember).filter(
        models.ChallengeMember.user_id == user_id,
        models.ChallengeMember.challenge_id == challenge_id
    ).first()
    if db_member:
        db.delete(db_member)
        db.commit()
    return db_member

def get_user_challenges(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Challenge).join(models.ChallengeMember).filter(
        models.ChallengeMember.user_id == user_id
    ).offset(skip).limit(limit).all()

# =========================
# Challenge Progress Calculation
# =========================
def calculate_challenge_progress(db: Session, user_id: int, challenge: models.Challenge) -> float:
    total_achieved_value = 0.0
    
    # Filter for mobility logs within the challenge period and for the target mode
    query_filters = [
        models.MobilityLog.user_id == user_id,
        models.MobilityLog.started_at >= challenge.start_at,
        models.MobilityLog.ended_at <= challenge.end_at,
    ]
    if challenge.target_mode != schemas.TransportMode.ANY:
        query_filters.append(models.MobilityLog.mode == challenge.target_mode)

    if challenge.goal_type == schemas.ChallengeGoalType.CO2_SAVED:
        total_achieved_value = db.query(func.sum(models.MobilityLog.co2_saved_g)).filter(*query_filters).scalar()
    elif challenge.goal_type == schemas.ChallengeGoalType.DISTANCE_KM:
        total_achieved_value = db.query(func.sum(models.MobilityLog.distance_km)).filter(*query_filters).scalar()
    elif challenge.goal_type == schemas.ChallengeGoalType.TRIP_COUNT:
        total_achieved_value = db.query(func.count(models.MobilityLog.log_id)).filter(*query_filters).scalar()
    
    if total_achieved_value is None:
        total_achieved_value = 0.0

    progress = (float(total_achieved_value) / float(challenge.goal_target_value)) * 100 if challenge.goal_target_value > 0 else 0.0
    return progress

def update_challenge_status_if_completed(db: Session, challenge: models.Challenge, progress: float):
    if progress >= 100.0 and challenge.status == models.ChallengeStatus.ACTIVE:
        challenge.status = models.ChallengeStatus.COMPLETED
        db.add(challenge)
        db.commit()
        db.refresh(challenge)
    return challenge

def update_personal_challenge_progress(db: Session, user_id: int):
    """
    Updates the progress for all active personal challenges for a user.
    """
    # Get all personal challenges the user has joined
    user_challenges = db.query(models.Challenge).join(models.ChallengeMember).filter(
        models.ChallengeMember.user_id == user_id,
        models.Challenge.scope == 'PERSONAL',
        models.Challenge.status == models.ChallengeStatus.ACTIVE
    ).all()

    for challenge in user_challenges:
        # Recalculate progress
        progress = calculate_challenge_progress(db, user_id, challenge)
        
        # Get the specific ChallengeMember entry to update
        member_entry = db.query(models.ChallengeMember).filter(
            models.ChallengeMember.user_id == user_id,
            models.ChallengeMember.challenge_id == challenge.challenge_id
        ).first()
        
        if member_entry:
            member_entry.progress = progress
            db.add(member_entry)
            
            # Also check if the challenge is now completed
            update_challenge_status_if_completed(db, challenge, progress)
            
    db.commit()
