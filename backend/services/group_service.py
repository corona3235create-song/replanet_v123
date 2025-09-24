import secrets
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func
from backend.models import Group, GroupMember, User, GroupRole, MobilityLog
from backend.schemas import GroupCreateWithUsernames, GroupUpdate
from fastapi import HTTPException, status

class GroupService:
    @staticmethod
    def generate_invite_code(db: Session) -> str:
        """Generate a unique 8-character invite code."""
        while True:
            code = secrets.token_urlsafe(6)
            if not db.query(Group).filter(Group.invite_code == code).first():
                return code

    @staticmethod
    def create_group(db: Session, group_data: GroupCreateWithUsernames, creator_id: int) -> Group:
        """Create a new group with specified members and set the creator as the leader."""
        # Generate invite code (still required by DB schema, but unused for logic)
        invite_code = GroupService.generate_invite_code(db)

        # Find all users by usernames
        users_to_add = db.query(User).filter(User.username.in_(group_data.usernames)).all()
        
        if len(users_to_add) != len(group_data.usernames):
            # Identify missing usernames
            found_usernames = {user.username for user in users_to_add}
            missing_usernames = set(group_data.usernames) - found_usernames
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Users not found: {', '.join(missing_usernames)}"
            )

        # Ensure creator is among the users to be added
        creator_user = next((u for u in users_to_add if u.user_id == creator_id), None)
        if not creator_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Creator must be included in the list of group members."
            )

        db_group = Group(
            name=group_data.name,
            description=group_data.description,
            max_members=group_data.max_members,
            created_by=creator_id,
            invite_code=invite_code # Still generated, but not used for joining
        )
        db.add(db_group)
        db.flush() # Flush to get db_group.group_id

        # Add all specified users as group members
        for user in users_to_add:
            role = GroupRole.LEADER if user.user_id == creator_id else GroupRole.MEMBER
            member = GroupMember(
                group_id=db_group.group_id,
                user_id=user.user_id,
                role=role,
                is_active=True
            )
            db.add(member)
        
        db.commit()
        db.refresh(db_group, attribute_names=["members"])
        return db_group

    @staticmethod
    def get_group_by_id(db: Session, group_id: int) -> Optional[Group]:
        """Get a single group by its ID, with members and their user info loaded."""
        group = db.query(Group).options(
            joinedload(Group.members).joinedload(GroupMember.user)
        ).filter(Group.group_id == group_id, Group.is_active == True).first()
        return group

    @staticmethod
    def get_user_groups(db: Session, user_id: int) -> List[Group]:
        """Get all groups a user is a member of, with members and their user info loaded."""
        groups = db.query(Group).options(
            joinedload(Group.members).joinedload(GroupMember.user)
        ).join(GroupMember).filter(
            and_(
                GroupMember.user_id == user_id,
                GroupMember.is_active == True,
                Group.is_active == True
            )
        ).all()
        return groups

    @staticmethod
    def update_group(db: Session, group_id: int, group_data: GroupUpdate, user_id: int) -> Optional[Group]:
        """Update a group's details (leader only)."""
        db_group = db.query(Group).filter(Group.group_id == group_id).first()
        if not db_group:
            return None

        # Check if the user is the group leader
        member = db.query(GroupMember).filter(
            and_(
                GroupMember.group_id == group_id,
                GroupMember.user_id == user_id,
                GroupMember.role == GroupRole.LEADER
            )
        ).first()

        if not member:
            return None

        for var, value in vars(group_data).items():
            if value is not None:
                setattr(db_group, var, value)
        
        db.commit()
        db.refresh(db_group)
        return db_group

    @staticmethod
    def leave_group(db: Session, group_id: int, user_id: int) -> bool:
        """Allow a user to leave a group. If leader is the last member, delete the group."""
        member = db.query(GroupMember).filter(
            and_(
                GroupMember.group_id == group_id,
                GroupMember.user_id == user_id,
                GroupMember.is_active == True
            )
        ).first()

        if not member:
            return False # Not a member

        # Get current member count
        active_members_count = db.query(func.count(GroupMember.member_id)).filter(
            and_(
                GroupMember.group_id == group_id,
                GroupMember.is_active == True
            )
        ).scalar()

        if member.role == GroupRole.LEADER:
            if active_members_count == 1:
                # If leader is the only member, delete the group
                db_group = db.query(Group).filter(Group.group_id == group_id).first()
                if db_group:
                    db.delete(db_group)
                    db.commit()
                    return True
                return False # Group not found
            else:
                # Leader cannot leave if there are other members (for simplicity)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Leader cannot leave a group with other members. Transfer leadership first or delete the group."
                )

        member.is_active = False
        db.commit()
        return True

    @staticmethod
    def delete_group(db: Session, group_id: int, user_id: int) -> bool:
        """Delete a group (leader only)."""
        db_group = db.query(Group).filter(Group.group_id == group_id, Group.is_active == True).first()
        if not db_group:
            return False # Group not found

        # Check if the user is the group leader
        leader_member = db.query(GroupMember).filter(
            and_(
                GroupMember.group_id == group_id,
                GroupMember.user_id == user_id,
                GroupMember.role == GroupRole.LEADER
            )
        ).first()

        if not leader_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the leader can delete the group."
            )

        db.delete(db_group)
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

    @staticmethod
    def get_global_group_ranking(db: Session, limit: int = 100) -> List[dict]:
        """Get a global ranking of groups based on total CO2 saved."""
        # Subquery to calculate total CO2 saved per user
        user_co2_subquery = db.query(
            MobilityLog.user_id,
            func.sum(MobilityLog.co2_saved_g).label("total_co2_saved")
        ).group_by(MobilityLog.user_id).subquery()

        # Query to get group ranking
        ranking_data = (
            db.query(
                Group.group_id,
                Group.name.label("group_name"),
                func.count(GroupMember.member_id).label("member_count"),
                func.sum(user_co2_subquery.c.total_co2_saved).label("total_co2_saved")
            )
            .join(GroupMember, Group.group_id == GroupMember.group_id)
            .join(GroupMember.user)
            .outerjoin(user_co2_subquery, User.user_id == user_co2_subquery.c.user_id)
            .filter(Group.is_active == True, GroupMember.is_active == True)
            .group_by(Group.group_id, Group.name)
            .order_by(func.sum(user_co2_subquery.c.total_co2_saved).desc())
            .limit(limit)
            .all()
        )

        # Format results and add rank
        ranked_groups = []
        for i, row in enumerate(ranking_data):
            ranked_groups.append({
                "group_id": row.group_id,
                "group_name": row.group_name,
                "total_co2_saved": float(row.total_co2_saved) if row.total_co2_saved else 0.0,
                "member_count": row.member_count,
                "rank": i + 1
            })
        return ranked_groups