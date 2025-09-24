from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from .database import init_db, SessionLocal
from .routes import dashboard, credits, challenges, auth, achievements, users, admin, mobility, ai_challenge_router, groups, group_challenges # mobility 라우터 추가, AI 챌린지 라우터 추가
from .seed_admin_user import seed_admin_user
from .bedrock_logic import router as chat_router

# FastAPI 앱 생성
app = FastAPI(
    title="Ecooo API",
    description="탄소 절감을 위한 친환경 서비스 API",
    version="1.0.0"
)

# CORS 설정
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 정적 파일 서빙 (이미지 등)
if os.path.exists("frontend/public"):
    app.mount("/images", StaticFiles(directory="frontend/public"), name="images")

# 라우터 등록
app.include_router(dashboard.router)
app.include_router(credits.router)
app.include_router(challenges.router)
app.include_router(auth.router)
app.include_router(achievements.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(chat_router)
print("DEBUG: Including mobility.router") # Debug print
app.include_router(mobility.router) # mobility 라우터 추가
app.include_router(ai_challenge_router.router) # AI 챌린지 라우터 추가
app.include_router(groups.router)
app.include_router(group_challenges.router)

@app.on_event("startup")
async def startup_event():
    """앱 시작시 실행되는 이벤트"""
    # 데이터베이스 테이블 생성
    init_db()

    # 관리자 사용자 시드
    db = SessionLocal()
    try:
        seed_admin_user(db)
    finally:
        db.close()

@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "Ecooo API 서버가 실행 중입니다!",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {"status": "healthy", "message": "서버가 정상적으로 작동 중입니다"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)