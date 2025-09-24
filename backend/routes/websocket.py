from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict, Any
import json
import asyncio
from datetime import datetime

router = APIRouter(prefix="/ws", tags=["websocket"])

# 연결된 클라이언트들을 관리
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        if user_id:
            self.user_connections[user_id] = websocket

    def disconnect(self, websocket: WebSocket, user_id: int = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if user_id and user_id in self.user_connections:
            del self.user_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.user_connections:
            websocket = self.user_connections[user_id]
            try:
                await websocket.send_text(message)
            except:
                # 연결이 끊어진 경우 제거
                self.disconnect(websocket, user_id)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # 연결이 끊어진 경우 제거
                self.active_connections.remove(connection)

manager = ConnectionManager()

@router.websocket("/statistics/{user_id}")
async def websocket_statistics(websocket: WebSocket, user_id: int):
    """실시간 통계 업데이트 WebSocket"""
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            # 클라이언트로부터 메시지 수신 대기
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "ping":
                # 핑 메시지에 퐁 응답
                await websocket.send_text(json.dumps({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                }))
            elif message.get("type") == "subscribe":
                # 특정 통계 구독
                await websocket.send_text(json.dumps({
                    "type": "subscribed",
                    "subscription": message.get("subscription"),
                    "timestamp": datetime.utcnow().isoformat()
                }))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, user_id)

@router.websocket("/leaderboard")
async def websocket_leaderboard(websocket: WebSocket):
    """실시간 리더보드 업데이트 WebSocket"""
    await manager.connect(websocket)
    
    try:
        while True:
            # 30초마다 리더보드 업데이트 브로드캐스트
            await asyncio.sleep(30)
            
            # 실제로는 데이터베이스에서 최신 리더보드 데이터를 가져와야 함
            leaderboard_update = {
                "type": "leaderboard_update",
                "data": {
                    "timestamp": datetime.utcnow().isoformat(),
                    "message": "리더보드가 업데이트되었습니다!"
                }
            }
            
            await websocket.send_text(json.dumps(leaderboard_update))
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@router.websocket("/notifications/{user_id}")
async def websocket_notifications(websocket: WebSocket, user_id: int):
    """실시간 알림 WebSocket"""
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            # 클라이언트로부터 메시지 수신 대기
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "get_notifications":
                # 사용자별 알림 조회
                notifications = {
                    "type": "notifications",
                    "data": [
                        {
                            "id": 1,
                            "title": "새로운 배지 획득!",
                            "message": "에코 워리어 배지를 획득했습니다! 🛡️",
                            "timestamp": datetime.utcnow().isoformat(),
                            "read": False
                        },
                        {
                            "id": 2,
                            "title": "리더보드 순위 상승",
                            "message": "5위에서 4위로 올라갔습니다! 🎉",
                            "timestamp": datetime.utcnow().isoformat(),
                            "read": False
                        }
                    ]
                }
                await websocket.send_text(json.dumps(notifications))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, user_id)

# 실시간 업데이트를 위한 헬퍼 함수들
async def broadcast_statistics_update():
    """통계 업데이트를 모든 클라이언트에게 브로드캐스트"""
    update_message = {
        "type": "statistics_update",
        "data": {
            "timestamp": datetime.utcnow().isoformat(),
            "message": "통계가 업데이트되었습니다!"
        }
    }
    await manager.broadcast(json.dumps(update_message))

async def send_user_notification(user_id: int, title: str, message: str):
    """특정 사용자에게 알림 전송"""
    notification = {
        "type": "notification",
        "data": {
            "title": title,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }
    }
    await manager.send_personal_message(json.dumps(notification), user_id)


