import boto3
import json
import os
import requests
import re
from bs4 import BeautifulSoup
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.routes.ai_challenge_router import AICallengeCreateRequest, create_and_join_ai_challenge
from backend.routes.dashboard import get_dashboard # Import get_dashboard
from backend.database import get_db
from backend.dependencies import get_current_user
from sqlalchemy.orm import Session
from backend import crud # crud 모듈 임포트
from backend.models import User, TransportMode, Challenge, ChallengeMember # User 모델 임포트

# --- 설정 ---
AWS_DEFAULT_REGION = "us-east-1"
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "AIzaSyBgs37kJYWB7zsTfIrDTqe1hpOxBhNkH44") # 환경 변수에서 가져오도록 변경
GOOGLE_CSE_ID = os.getenv("GOOGLE_CSE_ID", "01354cc88406341ec") # 환경 변수에서 가져오도록 변경
BEDROCK_MODEL_ARN = os.getenv("BEDROCK_MODEL_ARN", "arn:aws:bedrock:us-east-1:327784329358:inference-profile/us.anthropic.claude-opus-4-20250514-v1:0")
BEDROCK_KNOWLEDGE_BASE_ID = os.getenv("BEDROCK_KNOWLEDGE_BASE_ID", "PUGB1AL6L1")

# --- Boto3 클라이언트 초기화 ---
try:
    bedrock_runtime_client = boto3.client('bedrock-runtime', region_name=AWS_DEFAULT_REGION)
    bedrock_agent_runtime_client = boto3.client('bedrock-agent-runtime', region_name=AWS_DEFAULT_REGION)
    print("[알림] AWS Bedrock 클라이언트가 성공적으로 초기화되었습니다.")
except Exception as e:
    print(f"[오류] AWS 클라이언트 생성 중 오류가 발생했습니다: {e}")
    # 클라이언트 초기화 실패 시, 관련 함수들이 ConnectionError를 발생시키도록 함

# FastAPI 라우터 생성
router = APIRouter(
    prefix="/chat",
    tags=["Chatbot"]
)

class ChatRequest(BaseModel):
    user_id: int
    message: str

def invoke_llm(system_prompt, user_prompt):
    """
    범용 Bedrock LLM 호출 함수
    """
    if not bedrock_runtime_client:
        raise ConnectionError("Bedrock runtime client is not initialized.")
    try:
        messages = [{"role": "user", "content": user_prompt}]
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "system": system_prompt,
            "messages": messages
        }
        response = bedrock_runtime_client.invoke_model(
            modelId=BEDROCK_MODEL_ARN,
            body=json.dumps(request_body)
        )
        response_body = json.loads(response.get('body').read())
        return response_body['content'][0]['text']
    except Exception as e:
        print(f"Bedrock 모델 호출 중 오류가 발생했습니다: {e}")
        return None

def query_knowledge_base(query):
    """
    Bedrock 지식 기반에 질문하고 답변과 출처를 받아오는 함수
    """
    if not bedrock_agent_runtime_client:
        raise ConnectionError("Bedrock agent runtime client is not initialized.")
    print(f"\n[알림] Bedrock 지식 기반에서 '{query}'에 대한 정보를 검색합니다...")
    try:
        response = bedrock_agent_runtime_client.retrieve_and_generate(
            input={'text': query},
            retrieveAndGenerateConfiguration={
                'type': 'KNOWLEDGE_BASE',
                'knowledgeBaseConfiguration': {
                    'knowledgeBaseId': BEDROCK_KNOWLEDGE_BASE_ID,
                    'modelArn': BEDROCK_MODEL_ARN
                }
            }
        )
        
        if response and response.get('output') and response.get('citations'):
            answer = response['output']['text']
            citations = response['citations']
            
            source_details = []
            for citation in citations:
                if citation.get('retrievedReferences'):
                    retrieved_ref = citation['retrievedReferences'][0]
                    location = retrieved_ref.get('location', {}).get('s3Location', {}).get('uri')
                    if location:
                        source_details.append(f"- {location}")

            if source_details:
                formatted_answer = f"{answer}\n\n--- 출처 ---\n" + "\n".join(source_details)
            else:
                formatted_answer = answer

            print("[알림] 지식 기반에서 답변을 성공적으로 찾았습니다.")
            return formatted_answer
        else:
            print("[알림] 지식 기반에서 관련 정보를 찾지 못했습니다.")
            return None
            
    except Exception as e:
        print(f"Bedrock 지식 기반 검색 중 오류가 발생했습니다: {e}")
        return None

def perform_web_search(query):
    """
    Google 검색으로 URL을 찾고, 중요도 순으로(제목->본문) 실제 본문 내용을 추출하는 함수
    """
    print(f"\n[알림] 웹에서 '{query}'에 대한 최신 정보를 검색합니다...")
    try:
        search_url = "https://www.googleapis.com/customsearch/v1"
        search_params = {'key': GOOGLE_API_KEY, 'cx': GOOGLE_CSE_ID, 'q': query, 'num': 3}
        search_response = requests.get(search_url, params=search_params)
        search_response.raise_for_status()
        search_results = search_response.json()
        items = search_results.get('items', [])

        if not items:
            return "웹 검색 결과가 없습니다."

        full_context = ""
        urls = [item.get('link') for item in items]
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/555.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/555.36'} # User-Agent 수정

        print("[알림] 검색된 웹페이지의 본문을 중요도 순으로 추출합니다...")
        for url in urls:
            if not url: continue
            try:
                page_response = requests.get(url, headers=headers, timeout=5)
                page_response.raise_for_status()
                soup = BeautifulSoup(page_response.text, 'lxml')
                text_parts = []
                tags_to_extract = ['h1', 'h2', 'h3', 'p']
                for tag in tags_to_extract:
                    elements = soup.find_all(tag)
                    for element in elements:
                        text_parts.append(element.get_text(strip=True))
                page_text = '\n'.join(text_parts)
                full_context += f"--- URL: {url}의 내용 ---\n{page_text}\n\n"
            except requests.exceptions.RequestException as e:
                print(f"  - URL {url} 방문 실패: {e}")
                continue

        if not full_context:
            return "웹페이지 내용을 가져오는 데 실패했습니다."

        print(f"[추출 완료] 총 {len(full_context)}자리의 정보를 바탕으로 답변을 생성합니다.")
        return full_context

    except Exception as e:
        print(f"웹 검색 과정에서 오류가 발생했습니다: {e}")
        return "정보 검색 과정에서 오류가 발생했습니다."

@router.post("/")
async def chatbot_endpoint(request: ChatRequest):
    user_query = request.message
    user_id = request.user_id # user_id는 현재 사용되지 않지만, 추후 확장성을 위해 유지

    print(f"사용자 질문: {user_query}\n")

    print("[1단계] 사용자의 질문 의도를 파악합니다...")
    router_system_prompt = f"""
    You are a smart orchestrator that analyzes the user's question and decides which action to take.
    You must choose one of the following six actions and respond only in JSON format. Do not add any other explanations.

    1. "knowledge_base_search": Choose this when the user's question is likely to be answered by a private knowledge base, containing specific information about people, projects, or internal documents. Specific topics like 'carbon reduction' or 'recycling' can also belong here.
       - Example: {{"action": "knowledge_base_search", "query": "information about ecomileage-seoul"}}
       - Example: {{"action": "knowledge_base_search", "query": "how to recycle plastic"}}

    2. "general_search": Choose this when the user's question requires up-to-date information or general knowledge that is unlikely to be in a private knowledge base, such as 'today's weather' or 'news about celebrities'.
       - Example: {{"action": "general_search", "query": "today's weather in Seoul"}}

    3. "recommend_challenge": Choose this when the user explicitly asks for a challenge recommendation or expresses a desire to start a new eco-friendly challenge.
       - Example: {{"action": "recommend_challenge", "user_intent": "recommend an eco-friendly challenge"}}
       - Example: {{"action": "recommend_challenge", "user_intent": "I want to start a new challenge"}}

    4. "get_carbon_reduction_tip": Choose this when the user asks for tips on reducing carbon emissions or eco-friendly practices.
       - Example: {{"action": "get_carbon_reduction_tip", "user_intent": "give me a tip for reducing carbon"}}
       - Example: {{"action": "get_carbon_reduction_tip", "user_intent": "how can I be more eco-friendly?"}}

    5. "get_goal_strategy": Choose this when the user asks for strategies to achieve their eco-friendly goals or improve their progress.
       - Example: {{"action": "get_goal_strategy", "user_intent": "how can I achieve my carbon reduction goal?"}}
       - Example: {{"action": "get_goal_strategy", "user_intent": "give me a strategy to improve my eco-score"}}

    6. "direct_answer": Choose this for simple greetings or small talk, like "Hello", "Thank you", or "Who are you?".
       - Example: {{"action": "direct_answer", "answer": "Hello! I am an AI chatbot here to answer your questions. Ask me anything!"}}

    7. "detect_activity_and_suggest_challenge": Choose this when the user mentions a specific eco-friendly action they have taken, like "I walked to work" or "I took the bus today". This is different from asking for a recommendation.
       - Example: {{"action": "detect_activity_and_suggest_challenge", "activity": "rode a bike"}}

    User question: "{user_query}"
    Your JSON response:
    """
    
    router_output_str = invoke_llm(router_system_prompt, user_query)
    
    action = None
    router_decision = {}
    if router_output_str is None:
        print("[오류] Bedrock 모델 호출 실패: router_output_str이 None입니다. 일반 검색을 시도합니다.")
        action = "general_search"
        router_decision = {"query": user_query}
    else:
        try:
            json_match = re.search(r'\{.*\}', router_output_str, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                router_decision = json.loads(json_str)
                action = router_decision.get("action")
            else:
                raise ValueError("No JSON object found in the router output")
        except (json.JSONDecodeError, ValueError, AttributeError, ConnectionError) as e:
            print(f"[오류] 조율자(Router)의 결정을 이해할 수 없습니다 또는 Bedrock 연결 오류: {e}. 일반 검색을 시도합니다.")
            action = "general_search"
            router_decision = {"query": user_query}

    final_answer = ""
    query = router_decision.get("query", user_query)
    original_action = action

    if action == "knowledge_base_search":
        print(f"[알림] 조율자 판단: '{action}'. 지식 기반 검색을 시작합니다.")
        final_answer = query_knowledge_base(query)
        
        if not final_answer:
            print("[알림] 지식 기반에서 답변을 찾지 못했습니다. 웹 검색으로 전환합니다.")
            action = "general_search"

    if action == "general_search":
        if original_action == 'knowledge_base_search':
            pass
        else:
            print(f"[알림] 조율자 판단: '{action}'. 웹 검색을 시작합니다.")

        search_results = perform_web_search(query)

        if "오류가 발생했습니다" in search_results or "결과가 없습니다" in search_results:
            final_answer = search_results
        else:
            max_context_length = 20000
            if len(search_results) > max_context_length:
                print(f"\n[알림] 추출된 정보가 너무 길어({len(search_results)}자), 핵심 내용만 요약하도록 {max_context_length}자로 축소합니다.")
                search_results = search_results[:max_context_length]
            
            print("\n[3단계] 검색 결과를 바탕으로 최종 답변을 생성합니다...")
            final_answer_system_prompt = """
            당신은 주어진 검색 결과를 바탕으로 사용자의 질문에 대해 종합적이고 친절한 답변을 생성하는 AI 어시스턴트입니다.
            답변은 반드시 주어진 검색 결과(<search_results>) 안의 정보에만 근거해야 합니다.
            절대로 당신의 기존 지식을 사용하거나 정보를 추측해서는 안 됩니다.
            만약 검색 결과에서 답변을 찾을 수 없다면, "검색된 정보로는 답변을 찾을 수 없습니다." 라고만 대답해주세요.
            """
            
            if original_action == "general_search":
                final_answer_system_prompt += "\n\n답변을 마친 후, 마지막에는 **주어진 검색 결과와 사용자의 질문 내용을 모두 고려하여** 자연스럽게 연결되는 환경 보호나 탄소 절감 관련 제안을 한 문장 덧붙여주세요. \n    예를 들어, 날씨가 좋다는 내용이 있으면 자전거 타기를 추천하고, 미세먼지가 많다는 내용이 있으면 대중교통 이용을 추천하고, 탄소 절감 관련 내용이 있으면 일상생활에서 실천할 수 있는 팁을 제공할 수 있습니다."

            final_answer = invoke_llm(final_answer_system_prompt, f"<search_results>\n{search_results}\n</search_results>\n\n사용자 질문: {user_query}")

    elif action == "detect_activity_and_suggest_challenge":
        print("[알림] 조율자 판단: 'detect_activity_and_suggest_challenge'. 활동 감지 및 챌린지 추천/검증을 시작합니다.")
        db = next(get_db())
        
        # 활동 키워드 및 해당 TransportMode 매핑
        activity_keywords = {
            "자전거": TransportMode.BIKE,
            "걸어서": TransportMode.WALK,
            "도보": TransportMode.WALK,
            "버스": TransportMode.BUS,
            "지하철": TransportMode.SUBWAY,
        }
        
        detected_activity_mode = None
        detected_keyword = None
        for keyword, mode in activity_keywords.items():
            if keyword in user_query:
                detected_activity_mode = mode
                detected_keyword = keyword
                break

        if not detected_activity_mode:
            # 관련 활동이 감지되지 않으면 일반 답변으로 전환
            final_answer = invoke_llm("You are a friendly AI assistant.", user_query)
            return {"response": final_answer}

        # 사용자의 오늘 활동 기록 확인 (Task 2.3)
        from datetime import date, timedelta
        today_start = date.today()
        # KST 고려 (UTC+9)
        utc_today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(hours=9)
        if datetime.utcnow().hour < 9: # UTC 기준 00:00-08:59는 한국의 같은 날
             utc_today_start -= timedelta(days=1)
        utc_today_end = utc_today_start + timedelta(days=1)


        mobility_log = db.query(models.MobilityLog).filter(
            models.MobilityLog.user_id == user_id,
            models.MobilityLog.transport_mode == detected_activity_mode,
            models.MobilityLog.started_at >= utc_today_start,
            models.MobilityLog.started_at < utc_today_end
        ).order_by(models.MobilityLog.started_at.desc()).first()

        if mobility_log:
            # True Case (2.3): 활동 기록이 있을 경우
            print(f"[알림] 사용자의 '{detected_activity_mode.value}' 활동 기록을 확인했습니다.")
            
            # 추가 크레딧 지급 로직 (예: 거리 1km당 5 크레딧)
            bonus_credits = int(mobility_log.distance_km * 5)
            
            # 크레딧 추가
            crud.create_credit_log(db, user_id=user_id, points=bonus_credits, reason=f"챗봇 활동 확인 보너스: {detected_keyword}")
            
            response_text = f"네! 오늘 {mobility_log.distance_km:.1f}km를 {detected_keyword}(으)로 이동하신 기록을 확인했어요. 정말 멋져요! 추가 보너스로 {bonus_credits}C를 드렸습니다. 🎁"
            final_answer = response_text
            return {"response": final_answer}

        else:
            # False Case (2.3) / Challenge Suggestion (2.2): 활동 기록이 없을 경우
            print(f"[알림] 사용자의 '{detected_activity_mode.value}' 활동 기록이 없습니다. 관련 챌린지를 찾아봅니다.")
            
            # 참여 가능한 관련 챌린지 검색
            joined_challenge_ids = {m.challenge_id for m in db.query(models.ChallengeMember).filter(models.ChallengeMember.user_id == user_id).all()}
            
            available_challenges = db.query(models.Challenge).filter(
                models.Challenge.challenge_id.notin_(joined_challenge_ids),
                models.Challenge.title.contains(detected_keyword)
            ).all()

            if available_challenges:
                # 관련 챌린지가 있을 경우 제안
                suggested_challenge = available_challenges[0]
                
                suggestion_prompt = f'''
                You are a friendly and encouraging AI assistant.
                A user mentioned they did an activity: "{user_query}".
                Your task is to naturally praise their action and suggest the following challenge.
                Keep the response concise and friendly.
                
                Challenge to suggest:
                - Title: {suggested_challenge.title}
                - Description: {suggested_challenge.description}
                
                Your response should end with a question asking if they want to join.
                Example: "자전거를 타셨군요! 정말 좋은 습관이에요. 혹시 '{suggested_challenge.title}'에 참여해보시는 건 어떨까요?"
                '''
                
                response_text = invoke_llm(suggestion_prompt, "")
                
                return {{
                    "response": response_text,
                    "suggestion": {{
                        "type": "challenge",
                        "challenge_id": suggested_challenge.challenge_id,
                        "title": suggested_challenge.title
                    }}
                }}
            else:
                # 관련 챌린지가 없을 경우
                final_answer = f"아, 그러셨군요! 아쉽게도 오늘 {detected_keyword} 이동 기록이 확인되지 않네요. 이동 기록이 있어야 보너스 크레딧을 받을 수 있어요."
                return {{"response": final_answer}}

    elif action == "recommend_challenge":
        print("[알림] 조율자 판단: 'recommend_challenge'. AI 챌린지를 추천하고 생성합니다.")
        
        # 사용자 대시보드 데이터 가져오기
        db_session = next(get_db())
        current_user_obj = db_session.query(User).filter(User.user_id == user_id).first()
        if not current_user_obj:
            raise HTTPException(status_code=404, detail="User not found for challenge recommendation.")
        
        dashboard_data = await get_dashboard(current_user=current_user_obj, db=db_session)
        
        # LLM에게 챌린지 아이디어를 요청하는 프롬프트
        challenge_prompt = f"""
        You are an AI assistant that generates eco-friendly challenge ideas.
        Based on the user's intent and their recent activity data, generate a single challenge idea in JSON format.
        The challenge should be simple, actionable, and encourage carbon reduction.
        Prioritize light challenges that the user hasn't done much recently, or suggest new types of activities.
        Avoid recommending challenges for activities the user has frequently done in the last 7 days.
        
        User's recent activity data:
        - Last 7 days carbon saved (g): {json.dumps([{{"date": str(d.date), "saved_g": d.saved_g}} for d in dashboard_data.last7days])}
        - Mode statistics: {json.dumps([{{"mode": m.mode, "saved_g": m.saved_g}} for m in dashboard_data.modeStats])}
        - Total carbon saved (kg): {dashboard_data.total_saved}
        - Current garden level: {dashboard_data.garden_level}
        
        Provide a title, a short description, a reward (integer, e.g., 100), a goal_type (CO2_SAVED, DISTANCE_KM, TRIP_COUNT), a goal_target_value (float), and optionally a target_mode (ANY, WALK, BIKE, PUBLIC_TRANSPORT).
        If no specific mode is implied, use default values.
        
        Example JSON format for a light challenge:
        {{
            "title": "분리수거 챌린지",
            "description": "오늘 하루 분리수거를 완벽하게 실천해 보세요!",
            "reward": 20,
            "target_mode": "ANY"
        }}
        Example JSON format for another light challenge:
        {{
            "title": "샤워 10분 챌린지",
            "description": "샤워 시간을 10분 이내로 줄여 물과 에너지를 절약해 보세요!",
            "reward": 30,
            "target_mode": "ANY"
        }}
        
        User intent: "{router_decision.get("user_intent", user_query)}"
        Your JSON response:
        """
        
        challenge_idea_str = invoke_llm(challenge_prompt, "")
        
        try:
            challenge_idea = json.loads(challenge_idea_str)
            
            # AICallengeCreateRequest 모델에 맞게 데이터 준비
            challenge_request = AICallengeCreateRequest(
                title=challenge_idea.get("title", "AI 추천 챌린지"),
                description=challenge_idea.get("description", "AI가 추천하는 친환경 챌린지입니다."),
                reward=challenge_idea.get("reward", 30),
                target_mode=TransportMode[challenge_idea.get("target_mode", "ANY").upper()] if challenge_idea.get("target_mode") else TransportMode.ANY,
                goal_type=schemas.ChallengeGoalType[challenge_idea.get("goal_type", "CO2_SAVED").upper()],
                goal_target_value=challenge_idea.get("goal_target_value", 1000.0)
            )
            
            # 실제 User 객체를 데이터베이스에서 조회 (이미 위에서 current_user_obj로 가져옴)
            
            challenge_response = await create_and_join_ai_challenge(
                request=challenge_request,
                db=db_session,
                current_user=current_user_obj # 실제 User 객체 전달
            )
            
            final_answer = challenge_response.get("message", "AI 챌린지 생성 및 참여에 실패했습니다.")
            if challenge_response.get("challenge"):
                final_answer += f" 챌린지 제목: {challenge_response['challenge'].title}"
            
        except json.JSONDecodeError as e:
            print(f"[오류] AI 챌린지 아이디어 파싱 중 오류 발생: {e}")
            final_answer = "AI 챌린지 아이디어를 이해하는 데 문제가 발생했습니다."
        except Exception as e:
            print(f"[오류] AI 챌린지 생성 및 참여 중 오류 발생: {e}")
            final_answer = f"AI 챌린지 생성 및 참여 중 오류가 발생했습니다: {e}"

    elif action == "get_carbon_reduction_tip":
        print("[알림] 조율자 판단: 'get_carbon_reduction_tip'. 탄소 절감 팁을 생성합니다.")
        tip_system_prompt = f"""
        You are an AI assistant that provides concise and actionable tips for carbon reduction and eco-friendly practices.
        Generate a single, practical tip based on the user's intent.
        The tip should be encouraging and easy to understand.
        """
        final_answer = invoke_llm(tip_system_prompt, router_decision.get("user_intent", user_query))

    elif action == "get_goal_strategy":
        print("[알림] 조율자 판단: 'get_goal_strategy'. 목표 달성 전략을 생성합니다.")
        strategy_system_prompt = f"""
        You are an AI assistant that provides effective strategies for achieving eco-friendly goals and improving progress.
        Generate a single, actionable strategy based on the user's intent.
        The strategy should be motivating and provide clear steps.
        """
        final_answer = invoke_llm(strategy_system_prompt, router_decision.get("user_intent", user_query))

    elif action == "direct_answer":
        print("[알림] 조율자 판단: 'direct_answer'. 즉시 답변합니다.")
        final_answer = router_decision.get("answer", "죄송합니다. 답변을 생성할 수 없습니다.")
    
    if not final_answer:
        final_answer = "죄송합니다. 요청을 처리하는 데 문제가 발생했습니다."

    print("\n--- 최종 답변 ---")
    print(final_answer)
    return {"response": final_answer}