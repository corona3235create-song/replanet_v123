# services/group_challenge_service.py
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, text
from decimal import Decimal
from backend.models import GroupChallenge, GroupChallengeMember, GroupMember, GroupRole, ChallengeStatus
from backend.schemas import GroupChallengeCreate
from typing import List, Optional
from datetime import datetime, date

class GroupChallengeService:
    @staticmethod
    def create_group_challenge(
        db: Session, 
        group_id: int, 
        challenge_data: GroupChallengeCreate, 
        creator_id: int
    ) -> Optional[GroupChallenge]:
        """Create a new group challenge (leader only)"""
        # Check if user is group leader
        member = db.query(GroupMember).filter(
            and_(
                GroupMember.group_id == group_id,
                GroupMember.user_id == creator_id,
                GroupMember.role == GroupRole.LEADER,
                GroupMember.is_active == True
            )
        ).first()
        
        if not member:
            return None
        
        # Create challenge
        db_challenge = GroupChallenge(
            group_id=group_id,
            title=challenge_data.title,
            description=challenge_data.description,
            goal_type=challenge_data.goal_type,
            goal_value=challenge_data.goal_value,
            start_date=challenge_data.start_date,
            end_date=challenge_data.end_date,
            created_by=creator_id,
            status=ChallengeStatus.UPCOMING
        )
        
        db.add(db_challenge)
        db.flush()
        
        # Auto-enroll all group members
        group_members = db.query(GroupMember).filter(
            and_(GroupMember.group_id == group_id, GroupMember.is_active == True)
        ).all()
        
        for gm in group_members:
            challenge_member = GroupChallengeMember(
                challenge_id=db_challenge.challenge_id,
                user_id=gm.user_id,
                progress=0.0,
                contribution=0.0
            )
            db.add(challenge_member)
        
        db.commit()
        db.refresh(db_challenge)
        return db_challenge
    
    @staticmethod
    def get_group_challenges(db: Session, group_id: int, user_id: int) -> List[GroupChallenge]:
        """Get all challenges for a group (member only)"""
        # Check if user is group member
        member = db.query(GroupMember).filter(
            and_(
                GroupMember.group_id == group_id,
                GroupMember.user_id == user_id,
                GroupMember.is_active == True
            )
        ).first()
        
        if not member:
            return []
        
        return db.query(GroupChallenge).filter(
            GroupChallenge.group_id == group_id
        ).order_by(GroupChallenge.created_at.desc()).all()
    
    @staticmethod
    def get_challenge_details(db: Session, challenge_id: int, user_id: int) -> Optional[dict]:
        """Get challenge details with progress"""
        challenge = db.query(GroupChallenge).filter(
            GroupChallenge.challenge_id == challenge_id
        ).first()
        
        if not challenge:
            return None
        
        # Check if user is group member
        member = db.query(GroupMember).filter(
            and_(
                GroupMember.group_id == challenge.group_id,
                GroupMember.user_id == user_id,
                GroupMember.is_active == True
            )
        ).first()
        
        if not member:
            return None
        
        # Calculate total progress
        total_progress = db.query(func.sum(GroupChallengeMember.contribution)).filter(
            GroupChallengeMember.challenge_id == challenge_id
        ).scalar() or 0.0
        
        completion_percentage = 0.0
        if challenge.goal_value is not None and float(challenge.goal_value) > 0:
            completion_percentage = min((float(total_progress) / float(challenge.goal_value)) * 100, 100.0)
        
        return {
            "challenge": challenge,
            "progress": float(total_progress),
            "completion_percentage": completion_percentage
        }
    
    @staticmethod
    def update_challenge_progress(db: Session, user_id: int, co2_saved: float):
        """Update user progress in active group challenges"""
        # Find all active challenges user is part of
        today = datetime.now().date()
        
        query = text("""
            SELECT gc.challenge_id, gc.goal_value
            FROM group_challenges gc
            JOIN group_challenge_members gcm ON gc.challenge_id = gcm.challenge_id
            WHERE gcm.user_id = :user_id
            AND gc.status = 'active'
            AND DATE(gc.start_date) <= :today
            AND DATE(gc.end_date) >= :today
        """)
        
        result = db.execute(query, {"user_id": user_id, "today": today})
        
        for row in result.fetchall():
            challenge_member = db.query(GroupChallengeMember).filter(
                and_(
                    GroupChallengeMember.challenge_id == row.challenge_id,
                    GroupChallengeMember.user_id == user_id
                )
            ).first()
            
            if challenge_member:
                challenge_member.contribution += Decimal(str(co2_saved))
                challenge_member.progress = challenge_member.contribution
        
        db.commit()
    
    @staticmethod
    def join_group_challenge(db: Session, group_id: int, challenge_id: int, user_id: int) -> Optional[GroupChallengeMember]:
        """Allow a user to join a group challenge."""
        # 1. Check if user is a member of the group
        group_member = db.query(GroupMember).filter(
            and_(GroupMember.group_id == group_id, GroupMember.user_id == user_id, GroupMember.is_active == True)
        ).first()
        if not group_member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a member of this group.")

        # 2. Check if challenge exists and is active/upcoming
        challenge = db.query(GroupChallenge).filter(
            and_(
                GroupChallenge.challenge_id == challenge_id,
                GroupChallenge.group_id == group_id,
                GroupChallenge.status.in_([ChallengeStatus.UPCOMING, ChallengeStatus.ACTIVE])
            )
        ).first()
        if not challenge:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found or not joinable.")

        # 3. Check if user is already participating
        existing_participation = db.query(GroupChallengeMember).filter(
            and_(GroupChallengeMember.challenge_id == challenge_id, GroupChallengeMember.user_id == user_id)
        ).first()
        if existing_participation:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already participating in this challenge.")

        # 4. Add user to challenge
        new_participation = GroupChallengeMember(
            challenge_id=challenge_id,
            user_id=user_id,
            progress=0.0,
            contribution=0.0
        )
        db.add(new_participation)
        db.commit()
        db.refresh(new_participation)
        return new_participation

    @staticmethod
    def get_user_challenge_participations(db: Session, group_id: int, user_id: int) -> List[GroupChallengeMember]:
        """Get all challenges a user is participating in for a given group."""
        return db.query(GroupChallengeMember).join(GroupChallenge).filter(
            and_(
                GroupChallengeMember.user_id == user_id,
                GroupChallenge.group_id == group_id
            )
        ).all()

    @staticmethod
    def update_challenge_statuses(db: Session):
        """Update challenge statuses based on dates"""
        today = datetime.now().date()
        
        # Update upcoming to active
        upcoming_challenges = db.query(GroupChallenge).filter(
            and_(
                GroupChallenge.status == ChallengeStatus.UPCOMING,
                func.date(GroupChallenge.start_date) <= today
            )
        ).all()
        
        for challenge in upcoming_challenges:
            challenge.status = ChallengeStatus.ACTIVE
        
        # Update active to completed
        active_challenges = db.query(GroupChallenge).filter(
            and_(
                GroupChallenge.status == ChallengeStatus.ACTIVE,
                func.date(GroupChallenge.end_date) < today
            )
        ).all()
        
        for challenge in active_challenges:
            challenge.status = ChallengeStatus.COMPLETED
        
        db.commit()