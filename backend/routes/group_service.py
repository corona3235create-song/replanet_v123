
import secrets
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from backend.models import Group, GroupMember, User, GroupRole
from backend.schemas import GroupCreate

class GroupService:
    @staticmethod
    def generate_invite_code(db: Session) -> str:
        """Generate a unique 8-character invite code."""
        while True:
            code = secrets.token_urlsafe(6)
            if not db.query(Group).filter(Group.invite_code == code).first():
                return code

    @staticmethod
    def create_group(db: Session, group_data: GroupCreate, creator_id: int) -> Group:
        """Create a new group and set the creator as the leader."""
        invite_code = GroupService.generate_invite_code(db)
        
        db_group = Group(
            name=group_data.name,
            description=group_data.description,
            max_members=group_data.max_members,
            created_by=creator_id,
            invite_code=invite_code
        )
        db.add(db_group)
        db.flush()

        # Add the creator as the group leader
        leader_member = GroupMember(
            group_id=db_group.group_id,
            user_id=creator_id,
            role=GroupRole.LEADER,
            is_active=True
        )
        db.add(leader_member)
        db.commit()
        db.refresh(db_group)
        return db_group

    @staticmethod
    def get_group_by_id(db: Session, group_id: int) -> Optional[Group]:
        """Get a single group by its ID."""
        return db.query(Group).filter(Group.group_id == group_id, Group.is_active == True).first()

    @staticmethod
    def get_user_groups(db: Session, user_id: int) -> List[Group]:
        """Get all groups a user is a member of."""
        return db.query(Group).join(GroupMember).filter(
            and_(
                GroupMember.user_id == user_id,
                GroupMember.is_active == True,
                Group.is_active == True
            )
        ).all()

    @staticmethod
    def join_group_by_code(db: Session, invite_code: str, user_id: int) -> Optional[Group]:
        """Allow a user to join a group using an invite code."""
        group = db.query(Group).filter(Group.invite_code == invite_code, Group.is_active == True).first()
        if not group:
            return None  # Group not found or inactive

        # Check if user is already a member
        existing_member = db.query(GroupMember).filter(
            and_(
                GroupMember.group_id == group.group_id,
                GroupMember.user_id == user_id
            )
        ).first()

        if existing_member and existing_member.is_active:
            return group # Already an active member
        
        if existing_member and not existing_member.is_active:
            # Re-join
            existing_member.is_active = True
        else:
            # Check member count
            member_count = db.query(func.count(GroupMember.member_id)).filter(
                and_(
                    GroupMember.group_id == group.group_id,
                    GroupMember.is_active == True
                )
            ).scalar()

            if member_count >= group.max_members:
                return None # Group is full

            new_member = GroupMember(
                group_id=group.group_id,
                user_id=user_id,
                role=GroupRole.MEMBER
            )
            db.add(new_member)
        
        db.commit()
        db.refresh(group)
        return group

    @staticmethod
    def leave_group(db: Session, group_id: int, user_id: int) -> bool:
        """Allow a user to leave a group."""
        member = db.query(GroupMember).filter(
            and_(
                GroupMember.group_id == group_id,
                GroupMember.user_id == user_id,
                GroupMember.is_active == True
            )
        ).first()

        if not member:
            return False # Not a member

        if member.role == GroupRole.LEADER:
            # TODO: Implement leader transfer logic or prevent leaving if they are the only member
            # For now, prevent leader from leaving
            return False

        member.is_active = False
        db.commit()
        return True

    @staticmethod
    def get_group_members(db: Session, group_id: int) -> List[User]:
        """Get all active members of a group."""
        return db.query(User).join(GroupMember).filter(
            and_(
                GroupMember.group_id == group_id,
                GroupMember.is_active == True
            )
        ).all()
