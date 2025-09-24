from sqlalchemy import create_engine, Column, BigInteger, String, Enum, DateTime, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from datetime import datetime
import enum

# Define Base for declarative models
Base = declarative_base()

# Define Enums (as in models.py)
class UserRole(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"

class UserGroupType(str, enum.Enum):
    SCHOOL = "SCHOOL"
    COMPANY = "COMPANY"
    COMMUNITY = "COMMUNITY"
    ETC = "ETC"

# Define UserGroup (needed for ForeignKey)
class UserGroup(Base):
    __tablename__ = "user_groups"
    group_id = Column(BigInteger, primary_key=True, autoincrement=True)
    group_name = Column(String(80), nullable=False, unique=True)
    group_type = Column(Enum(UserGroupType), default=UserGroupType.ETC)
    region_code = Column(String(10))
    created_at = Column(DateTime, default=datetime.utcnow)

# Define User model (as in models.py)
class User(Base):
    __tablename__ = "users"
    user_id = Column(BigInteger, primary_key=True, autoincrement=True)
    username = Column(String(50), nullable=False, unique=True)
    email = Column(String(120), unique=True)
    password_hash = Column(String(255))
    user_group_id = Column(BigInteger, ForeignKey("user_groups.group_id"))
    role = Column(Enum(UserRole), default=UserRole.USER)
    created_at = Column(DateTime, default=datetime.utcnow)
    group = relationship("UserGroup", backref="users") # Add relationship to avoid errors

# Database setup
DATABASE_URL = "sqlite:///ecoooo.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_and_update_admin_user():
    db = SessionLocal()
    try:
        admin_username = "admin"
        target_email = "admin@admin"
        target_password = "12345678"

        admin_user = db.query(User).filter(User.username == admin_username).first()

        if admin_user:
            print(f"Found admin user: {admin_user.username}")
            print(f"Current email: {admin_user.email}")
            print(f"Current password_hash: {admin_user.password_hash}")

            needs_update = False
            if admin_user.email != target_email:
                admin_user.email = target_email
                needs_update = True
                print(f"Updating email to: {target_email}")
            
            if admin_user.password_hash != target_password:
                admin_user.password_hash = target_password
                needs_update = True
                print(f"Updating password_hash to: {target_password}")
            
            if needs_update:
                db.commit()
                print("Admin user credentials updated successfully!")
            else:
                print("Admin user credentials are already correct.")
        else:
            print(f"Admin user '{admin_username}' not found. Please ensure seed_admin_user.py has been run.")
    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    check_and_update_admin_user()
