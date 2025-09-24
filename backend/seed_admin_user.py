from sqlalchemy.orm import Session
from datetime import datetime

from .database import SessionLocal, engine
from . import crud, schemas, models

# Ensure tables are created
models.Base.metadata.create_all(bind=engine)

def seed_admin_user(db: Session):
    admin_username = "admin"
    admin_password = "12345678" # In a real app, this would be hashed!

    # Check if admin user already exists
    existing_admin = db.query(models.User).filter(models.User.username == admin_username).first()

    if not existing_admin:
        admin_user_data = schemas.UserCreate(
            username=admin_username,
            email="admin@admin", # Dummy email
            password_hash=admin_password,
            role=models.UserRole.ADMIN, # Set role to ADMIN
            user_group_id=None # Or an existing group ID if applicable
        )
        crud.create_user(db=db, user=admin_user_data)
        print(f"Admin user '{admin_username}' created successfully!")
    else:
        print(f"Admin user '{admin_username}' already exists.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_admin_user(db)
    except Exception as e:
        print(f"Error seeding admin user: {e}")
    finally:
        db.close()
