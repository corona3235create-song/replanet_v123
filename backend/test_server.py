#!/usr/bin/env python3
"""
간단한 테스트 서버
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import sqlite3
import json
from datetime import datetime
from typing import Optional
from routes.export import router as export_router

app = FastAPI(title="Ecooo Test API")

# 라우터 포함
app.include_router(export_router)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3002", "http://127.0.0.1:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터베이스 연결 함수
def get_db_connection():
    conn = sqlite3.connect('ecooo.db')
    conn.row_factory = sqlite3.Row
    return conn

# 크레딧 내역 추가 함수
def add_credit_entry(user_id: int, credit_type: str, points: int, reason: str, meta_json: dict = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 크레딧 내역 추가
        cursor.execute("""
            INSERT INTO credits_ledger (user_id, type, points, reason, meta_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, credit_type, points, reason, json.dumps(meta_json) if meta_json else None, datetime.now().isoformat()))
        
        conn.commit()
        entry_id = cursor.lastrowid
        
        return {
            "entry_id": entry_id,
            "user_id": user_id,
            "type": credit_type,
            "points": points,
            "reason": reason,
            "meta_json": meta_json,
            "created_at": datetime.now().isoformat()
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"크레딧 내역 추가 실패: {str(e)}")
    finally:
        conn.close()

@app.get("/")
async def root():
    return {"message": "Ecooo API 서버가 실행 중입니다!", "status": "ok"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "서버가 정상적으로 작동 중입니다"}

@app.get("/api/credits/balance/1")
async def get_credit_balance():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 총 크레딧 조회
        cursor.execute("SELECT SUM(points) as total FROM credits_ledger WHERE user_id = 1")
        result = cursor.fetchone()
        total_points = result['total'] if result['total'] else 0
        
        # 최근 획득 크레딧 조회
        cursor.execute("""
            SELECT points FROM credits_ledger 
            WHERE user_id = 1 AND type = 'EARN' 
            ORDER BY created_at DESC LIMIT 1
        """)
        recent_result = cursor.fetchone()
        recent_earned = recent_result['points'] if recent_result else 0
        
        return {
            "user_id": 1,
            "total_points": total_points,
            "recent_earned": recent_earned,
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"크레딧 잔액 조회 실패: {str(e)}")
    finally:
        conn.close()

@app.get("/api/credits/history/1")
async def get_credits_history(limit: int = 50):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT entry_id, type, points, reason, meta_json, created_at
            FROM credits_ledger 
            WHERE user_id = 1 
            ORDER BY created_at DESC 
            LIMIT ?
        """, (limit,))
        
        results = cursor.fetchall()
        history = []
        
        for row in results:
            history.append({
                "entry_id": row['entry_id'],
                "type": row['type'],
                "points": row['points'],
                "reason": row['reason'],
                "meta_json": json.loads(row['meta_json']) if row['meta_json'] else None,
                "created_at": row['created_at']
            })
        
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"크레딧 내역 조회 실패: {str(e)}")
    finally:
        conn.close()

@app.post("/api/credits/add")
async def add_credits(data: dict):
    try:
        user_id = data.get('user_id', 1)
        credit_type = data.get('type', 'EARN')
        points = data.get('points', 0)
        reason = data.get('reason', '크레딧 추가')
        meta_json = data.get('meta_json', {})
        
        result = add_credit_entry(user_id, credit_type, points, reason, meta_json)
        
        return {
            "success": True, 
            "message": f"{points} 크레딧이 추가되었습니다",
            "entry": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"크레딧 추가 실패: {str(e)}")

@app.post("/api/credits/garden/water")
async def water_garden(data: dict):
    try:
        user_id = data.get('user_id', 1)
        garden_id = data.get('garden_id', 1)
        
        # 물주기 크레딧 차감 내역 추가
        result = add_credit_entry(
            user_id=user_id,
            credit_type='SPEND',
            points=-10,
            reason='GARDEN_WATERING',
            meta_json={'garden_id': garden_id, 'action': 'watering'}
        )
        
        # 현재 크레딧 잔액 조회
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT SUM(points) as total FROM credits_ledger WHERE user_id = ?", (user_id,))
        balance_result = cursor.fetchone()
        new_balance = balance_result['total'] if balance_result['total'] else 0
        conn.close()
        
        return {
            "success": True,
            "message": "정원에 물을 주었습니다!",
            "garden_id": garden_id,
            "waters_count": 1,
            "total_waters": 1,
            "level_up": False,
            "points_spent": 10,
            "remaining_points": new_balance,
            "entry": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"물주기 실패: {str(e)}")

@app.get("/api/credits/garden/1")
async def get_garden_status():
    return {
        "user_id": 1,
        "total_carbon_reduced": 18.5,
        "current_level": 1,
        "waters_count": 0,
        "total_waters": 0
    }

@app.get("/api/credits/mobility/1")
async def get_mobility_data(limit: int = 1):
    return [
        {
            "id": 1,
            "user_id": 1,
            "mode": "지하철",
            "distance_km": 5.2,
            "carbon_saved_kg": 0.5,
            "points_earned": 150,
            "created_at": "2024-01-15T08:00:00Z"
        }
    ]

@app.get("/api/dashboard/1")
async def get_dashboard_data():
    return {
        "user_id": 1,
        "total_points": 1240,
        "total_saved": 18.5,
        "co2_saved_today": 1850,
        "eco_credits_earned": 1240,
        "last7days": [
            {"date": "01/09", "saved_g": 1200},
            {"date": "01/10", "saved_g": 1350},
            {"date": "01/11", "saved_g": 1100},
            {"date": "01/12", "saved_g": 1450},
            {"date": "01/13", "saved_g": 1300},
            {"date": "01/14", "saved_g": 1400},
            {"date": "01/15", "saved_g": 1850}
        ]
    }

@app.get("/challenges/1")
async def get_challenges():
    return [
        {
            "id": 1,
            "title": "일주일 대중교통 이용하기",
            "description": "일주일 동안 대중교통만 이용해보세요!",
            "progress": 60,
            "target": 7,
            "current": 4,
            "reward_points": 500,
            "is_completed": False
        },
        {
            "id": 2,
            "title": "자전거로 출퇴근하기",
            "description": "자전거로 출퇴근하여 환경을 보호하세요!",
            "progress": 30,
            "target": 10,
            "current": 3,
            "reward_points": 300,
            "is_completed": False
        }
    ]

@app.get("/garden/prototype_user")
async def get_garden_data():
    return {
        "user_id": "prototype_user",
        "total_carbon_reduced": 18.5,
        "total_points": 1240,
        "current_level": 1,
        "waters_count": 0
    }

@app.get("/api/transport/analysis/1")
async def get_transport_analysis():
    return {
        "user_id": 1,
        "preferred_transport": "지하철",
        "transport_stats": {
            "지하철": {"count": 15, "percentage": 60, "carbon_saved": 7.5},
            "자전거": {"count": 6, "percentage": 24, "carbon_saved": 1.8},
            "도보": {"count": 3, "percentage": 12, "carbon_saved": 0.3},
            "버스": {"count": 1, "percentage": 4, "carbon_saved": 0.2}
        },
        "total_trips": 25,
        "analysis_date": "2024-01-15T10:00:00Z",
        "ai_insights": [
            "지하철을 가장 많이 이용하시는 환경 친화적인 사용자입니다!",
            "자전거 이용률이 높아 건강한 생활 패턴을 보이고 있습니다.",
            "이번 주 도보 이용이 증가하여 더욱 친환경적인 생활을 하고 계십니다."
        ]
    }

@app.get("/api/transport/history/1")
async def get_transport_history():
    return [
        {
            "id": 1,
            "date": "2024-01-15",
            "transport_mode": "지하철",
            "distance_km": 5.2,
            "carbon_saved_kg": 0.5,
            "points_earned": 150,
            "route": "강남역 → 홍대입구역"
        },
        {
            "id": 2,
            "date": "2024-01-15",
            "transport_mode": "자전거",
            "distance_km": 3.1,
            "carbon_saved_kg": 0.3,
            "points_earned": 80,
            "route": "집 → 카페"
        },
        {
            "id": 3,
            "date": "2024-01-14",
            "transport_mode": "지하철",
            "distance_km": 4.8,
            "carbon_saved_kg": 0.5,
            "points_earned": 150,
            "route": "홍대입구역 → 강남역"
        },
        {
            "id": 4,
            "date": "2024-01-14",
            "transport_mode": "도보",
            "distance_km": 1.2,
            "carbon_saved_kg": 0.1,
            "points_earned": 50,
            "route": "카페 → 집"
        },
        {
            "id": 5,
            "date": "2024-01-13",
            "transport_mode": "자전거",
            "distance_km": 2.5,
            "carbon_saved_kg": 0.3,
            "points_earned": 80,
            "route": "집 → 공원"
        }
    ]

# 챌린지 완료 시 크레딧 추가 API
@app.post("/api/credits/challenge/complete")
async def complete_challenge(data: dict):
    try:
        user_id = data.get('user_id', 1)
        challenge_id = data.get('challenge_id')
        challenge_type = data.get('challenge_type', 'daily')
        points = data.get('points', 100)
        challenge_name = data.get('challenge_name', '챌린지 완료')
        
        # 챌린지 완료 크레딧 추가
        result = add_credit_entry(
            user_id=user_id,
            credit_type='EARN',
            points=points,
            reason=f'{challenge_name} 완료',
            meta_json={
                'challenge_id': challenge_id,
                'challenge_type': challenge_type,
                'action': 'challenge_complete'
            }
        )
        
        return {
            "success": True,
            "message": f"{challenge_name} 완료! {points} 크레딧을 획득했습니다!",
            "points_earned": points,
            "entry": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"챌린지 완료 처리 실패: {str(e)}")

# 탄소 절감 활동 크레딧 추가 API
@app.post("/api/credits/activity/complete")
async def complete_activity(data: dict):
    try:
        user_id = data.get('user_id', 1)
        activity_type = data.get('activity_type', 'subway')
        distance = data.get('distance', 0)
        carbon_saved = data.get('carbon_saved', 0)
        points = data.get('points', 50)
        route = data.get('route', '')
        
        # 탄소 절감 활동 크레딧 추가
        result = add_credit_entry(
            user_id=user_id,
            credit_type='EARN',
            points=points,
            reason=f'{activity_type} 이용',
            meta_json={
                'activity_type': activity_type,
                'distance': distance,
                'carbon_saved': carbon_saved,
                'route': route,
                'action': 'activity_complete'
            }
        )
        
        return {
            "success": True,
            "message": f"{activity_type} 이용으로 {points} 크레딧을 획득했습니다!",
            "points_earned": points,
            "carbon_saved": carbon_saved,
            "entry": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"활동 완료 처리 실패: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
