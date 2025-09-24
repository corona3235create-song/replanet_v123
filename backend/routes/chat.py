from fastapi import APIRouter
from backend.schemas import ChatMessage, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/", response_model=ChatResponse)
async def handle_chat(message: ChatMessage):
    # 여기서는 간단히 echo 기능만 구현 (추후 AI 연동 가능)
    response_text = f"'{message.message}' 라고 말씀하셨네요! (DB-free mock)"
    return ChatResponse(response_message=response_text)
