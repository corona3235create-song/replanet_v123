from sqlalchemy.orm import Session
from .models import GardenLevel

def seed_garden_levels(db: Session):
    # Check if levels already exist
    if db.query(GardenLevel).count() > 0:
        return

    levels = [
        {"level_number": 1, "level_name": "씨앗 단계", "image_path": "/images/0.png", "required_waters": 10},
        {"level_number": 2, "level_name": "싹 트는 단계", "image_path": "/images/1.png", "required_waters": 10},
        {"level_number": 3, "level_name": "새싹 단계", "image_path": "/images/2.png", "required_waters": 10},
        {"level_number": 4, "level_name": "어린 줄기 단계", "image_path": "/images/3.png", "required_waters": 10},
        {"level_number": 5, "level_name": "잎 전개 단계", "image_path": "/images/4.png", "required_waters": 10},
        {"level_number": 6, "level_name": "꽃봉오리 단계", "image_path": "/images/5.png", "required_waters": 10},
        {"level_number": 7, "level_name": "꽃 단계", "image_path": "/images/6.png", "required_waters": 10},
        {"level_number": 8, "level_name": "어린 나무 단계", "image_path": "/images/7.png", "required_waters": 10},
        {"level_number": 9, "level_name": "자라는 나무 단계", "image_path": "/images/8.png", "required_waters": 10},
        {"level_number": 10, "level_name": "우거진 나무 단계", "image_path": "/images/9.png", "required_waters": 10},
        {"level_number": 11, "level_name": "정원 완성 단계", "image_path": "/images/10.png", "required_waters": 0},
    ]

    for level_data in levels:
        level = GardenLevel(**level_data)
        db.add(level)
    
    db.commit()
