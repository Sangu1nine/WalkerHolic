#!/bin/bash

# 보행 분석 앱 프로젝트 생성 스크립트
echo "보행 분석 앱 프로젝트를 생성합니다..."

# 메인 프로젝트 디렉토리 생성
mkdir -p gait-analysis-app
cd gait-analysis-app

# 백엔드 디렉토리 구조 생성
mkdir -p backend/{app,database,agents,tools,models,config}
mkdir -p backend/app/{api,core,services}

# 프론트엔드 디렉토리 구조 생성  
mkdir -p frontend/src/{components,pages,services,hooks,utils,styles}
mkdir -p frontend/src/components/{common,chat,analysis}
mkdir -p frontend/src/pages/{login,main,settings}
mkdir -p frontend/public

# 문서 디렉토리
mkdir -p docs

# 백엔드 파일 생성
cat > backend/requirements.txt << 'EOF'
langchain==0.3.0
langserve[all]==0.3.0
langgraph==0.2.34
fastapi==0.104.1
uvicorn[standard]==0.24.0
supabase==2.7.4
openai==1.51.0
python-dotenv==1.0.0
websockets==12.0
dtw-python==1.3.0
numpy==1.24.3
pandas==2.0.3
pydantic==2.5.0
python-multipart==0.0.6
speechrecognition==3.10.0
pyttsx3==2.90
pyaudio==0.2.11
EOF

cat > backend/.env.example << 'EOF'
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Server Configuration
LANGSERVE_PORT=8000
LANGSERVE_HOST=localhost

# AWS Configuration (for Chronos)
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1
EOF

cat > backend/config/settings.py << 'EOF'
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # OpenAI
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    
    # Supabase
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    # Server
    LANGSERVE_PORT = int(os.getenv("LANGSERVE_PORT", 8000))
    LANGSERVE_HOST = os.getenv("LANGSERVE_HOST", "localhost")
    
    # AWS
    AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

settings = Settings()
EOF

cat > backend/database/supabase_client.py << 'EOF'
from supabase import create_client, Client
from config.settings import settings
import logging

logger = logging.getLogger(__name__)

class SupabaseClient:
    def __init__(self):
        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_ANON_KEY
        )
    
    async def save_imu_data(self, data: dict):
        """IMU 센서 데이터 저장"""
        try:
            result = self.client.table("imu_data").insert(data).execute()
            return result
        except Exception as e:
            logger.error(f"IMU 데이터 저장 실패: {e}")
            raise
    
    async def save_embedding_data(self, data: dict):
        """임베딩 데이터 저장"""
        try:
            result = self.client.table("embedding_data").insert(data).execute()
            return result
        except Exception as e:
            logger.error(f"임베딩 데이터 저장 실패: {e}")
            raise
    
    async def save_analysis_result(self, data: dict):
        """분석 결과 저장"""
        try:
            result = self.client.table("analysis_results").insert(data).execute()
            return result
        except Exception as e:
            logger.error(f"분석 결과 저장 실패: {e}")
            raise
    
    async def get_user_health_info(self, user_id: str):
        """사용자 건강정보 조회"""
        try:
            result = self.client.table("user_health_info").select("*").eq("user_id", user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"사용자 건강정보 조회 실패: {e}")
            raise
    
    async def get_rag_data(self, similarity_threshold: float = 0.8):
        """RAG 데이터 조회"""
        try:
            result = self.client.table("gait_rag_data").select("*").execute()
            return result.data
        except Exception as e:
            logger.error(f"RAG 데이터 조회 실패: {e}")
            raise

supabase_client = SupabaseClient()
EOF

cat > backend/models/schemas.py << 'EOF'
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class IMUData(BaseModel):
    timestamp: datetime
    acc_x: float
    acc_y: float
    acc_z: float
    gyr_x: float
    gyr_y: float
    gyr_z: float
    user_id: str

class EmbeddingData(BaseModel):
    user_id: str
    timestamp: datetime
    embedding_vector: List[float]
    original_data_id: str

class AnalysisResult(BaseModel):
    user_id: str
    analysis_timestamp: datetime
    gait_pattern: str
    similarity_score: float
    health_assessment: str
    recommendations: List[str]
    risk_factors: List[str]

class UserHealthInfo(BaseModel):
    user_id: str
    age: int
    gender: str
    diseases: List[str]
    height: float
    weight: float
    medications: List[str]

class ChatMessage(BaseModel):
    user_id: str
    message: str
    timestamp: datetime
    is_user: bool
EOF

cat > backend/tools/gait_analysis.py << 'EOF'
from langchain.tools import BaseTool
from typing import Dict, List, Any
import numpy as np
from dtw import dtw
from database.supabase_client import supabase_client
import logging

logger = logging.getLogger(__name__)

class GaitAnalysisTool(BaseTool):
    name = "gait_analysis"
    description = "보행 데이터를 분석하여 패턴을 식별하고 건강 상태를 평가합니다."
    
    def _run(self, embedding_data: List[float], user_id: str) -> Dict[str, Any]:
        """보행 데이터 분석 실행"""
        try:
            # 1. RAG 데이터 조회
            rag_data = self._get_rag_data()
            
            # 2. 사용자 건강정보 조회
            user_health = self._get_user_health_info(user_id)
            
            # 3. DTW를 사용한 유사도 계산
            similarity_results = self._calculate_similarity(embedding_data, rag_data)
            
            # 4. 분석 결과 생성
            analysis_result = self._generate_analysis(
                similarity_results, 
                user_health, 
                embedding_data
            )
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"보행 분석 실패: {e}")
            return {"error": str(e)}
    
    def _get_rag_data(self) -> List[Dict]:
        """RAG 데이터 조회"""
        # 예시 RAG 데이터 (실제로는 Supabase에서 조회)
        return [
            {
                "pattern_name": "정상보행",
                "embedding": [0.1, 0.2, 0.3, 0.4, 0.5],
                "description": "균형잡힌 정상적인 보행 패턴",
                "characteristics": ["일정한 보폭", "안정적인 리듬", "균형잡힌 자세"]
            },
            {
                "pattern_name": "불안정보행",
                "embedding": [0.8, 0.7, 0.6, 0.9, 0.8],
                "description": "균형이 불안정한 보행 패턴",
                "characteristics": ["불규칙한 보폭", "흔들리는 움직임", "균형 문제"]
            }
        ]
    
    def _get_user_health_info(self, user_id: str) -> Dict:
        """사용자 건강정보 조회"""
        # 예시 건강정보 (실제로는 Supabase에서 조회)
        return {
            "age": 65,
            "gender": "male",
            "diseases": ["고혈압", "당뇨병"],
            "height": 170,
            "weight": 70,
            "medications": ["혈압약", "당뇨약"]
        }
    
    def _calculate_similarity(self, user_embedding: List[float], rag_data: List[Dict]) -> List[Dict]:
        """DTW를 사용한 유사도 계산"""
        similarities = []
        
        for rag_item in rag_data:
            # DTW 거리 계산
            distance, _ = dtw(
                np.array(user_embedding).reshape(-1, 1),
                np.array(rag_item["embedding"]).reshape(-1, 1)
            )
            
            # 유사도로 변환 (거리가 작을수록 유사도 높음)
            similarity = 1 / (1 + distance)
            
            similarities.append({
                "pattern_name": rag_item["pattern_name"],
                "similarity": similarity,
                "description": rag_item["description"],
                "characteristics": rag_item["characteristics"]
            })
        
        # 유사도 순으로 정렬
        similarities.sort(key=lambda x: x["similarity"], reverse=True)
        return similarities
    
    def _generate_analysis(self, similarities: List[Dict], user_health: Dict, embedding_data: List[float]) -> Dict:
        """분석 결과 생성"""
        best_match = similarities[0]
        
        # 기본 분석 결과
        result = {
            "gait_pattern": best_match["pattern_name"],
            "similarity_score": best_match["similarity"],
            "pattern_description": best_match["description"],
            "characteristics": best_match["characteristics"],
            "health_assessment": self._assess_health_risk(best_match, user_health),
            "recommendations": self._generate_recommendations(best_match, user_health),
            "risk_factors": self._identify_risk_factors(best_match, user_health)
        }
        
        return result
    
    def _assess_health_risk(self, pattern: Dict, health_info: Dict) -> str:
        """건강 위험도 평가"""
        if pattern["pattern_name"] == "정상보행":
            return "낮음"
        elif pattern["similarity"] < 0.3:
            return "높음"
        else:
            return "중간"
    
    def _generate_recommendations(self, pattern: Dict, health_info: Dict) -> List[str]:
        """권장사항 생성"""
        recommendations = []
        
        if pattern["pattern_name"] == "불안정보행":
            recommendations.extend([
                "균형 운동을 꾸준히 실시하세요",
                "보행 보조기구 사용을 고려하세요",
                "의료진과 상담을 받으시기 바랍니다"
            ])
        
        if health_info.get("age", 0) > 65:
            recommendations.append("정기적인 건강검진을 받으세요")
        
        return recommendations
    
    def _identify_risk_factors(self, pattern: Dict, health_info: Dict) -> List[str]:
        """위험요인 식별"""
        risk_factors = []
        
        if pattern["similarity"] < 0.5:
            risk_factors.append("보행 패턴 이상")
        
        if health_info.get("age", 0) > 65:
            risk_factors.append("고령")
        
        if "당뇨병" in health_info.get("diseases", []):
            risk_factors.append("당뇨병으로 인한 신경계 영향")
        
        return risk_factors

gait_analysis_tool = GaitAnalysisTool()
EOF

cat > backend/agents/gait_agent.py << 'EOF'
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain.schema import BaseMessage, HumanMessage, AIMessage
from typing import TypedDict, List, Dict, Any
from tools.gait_analysis import gait_analysis_tool
from config.settings import settings
import logging

logger = logging.getLogger(__name__)

class GaitAnalysisState(TypedDict):
    messages: List[BaseMessage]
    user_id: str
    embedding_data: List[float]
    analysis_result: Dict[str, Any]
    is_walking: bool

class GaitAnalysisAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o",
            api_key=settings.OPENAI_API_KEY,
            temperature=0.1
        )
        self.graph = self._create_graph()
    
    def _create_graph(self) -> StateGraph:
        """LangGraph 워크플로우 생성"""
        workflow = StateGraph(GaitAnalysisState)
        
        # 노드 추가
        workflow.add_node("check_walking", self._check_walking_status)
        workflow.add_node("analyze_gait", self._analyze_gait_data)
        workflow.add_node("generate_report", self._generate_report)
        
        # 엣지 추가
        workflow.set_entry_point("check_walking")
        workflow.add_conditional_edges(
            "check_walking",
            self._should_analyze,
            {
                "analyze": "analyze_gait",
                "skip": "generate_report"
            }
        )
        workflow.add_edge("analyze_gait", "generate_report")
        workflow.add_edge("generate_report", END)
        
        return workflow.compile()
    
    def _check_walking_status(self, state: GaitAnalysisState) -> GaitAnalysisState:
        """보행 중인지 확인"""
        # 실제로는 사용자 입력이나 센서 데이터로 판단
        # 여기서는 임베딩 데이터가 있으면 보행 중으로 가정
        state["is_walking"] = len(state.get("embedding_data", [])) > 0
        
        if state["is_walking"]:
            message = HumanMessage(content="보행이 감지되었습니다. 분석을 시작합니다.")
        else:
            message = HumanMessage(content="보행이 감지되지 않았습니다. 이전 분석 결과를 표시합니다.")
        
        state["messages"].append(message)
        return state
    
    def _should_analyze(self, state: GaitAnalysisState) -> str:
        """분석 여부 결정"""
        return "analyze" if state["is_walking"] else "skip"
    
    def _analyze_gait_data(self, state: GaitAnalysisState) -> GaitAnalysisState:
        """보행 데이터 분석"""
        try:
            analysis_result = gait_analysis_tool._run(
                state["embedding_data"],
                state["user_id"]
            )
            state["analysis_result"] = analysis_result
            
            message = AIMessage(content="보행 데이터 분석이 완료되었습니다.")
            state["messages"].append(message)
            
        except Exception as e:
            logger.error(f"보행 분석 중 오류: {e}")
            state["analysis_result"] = {"error": str(e)}
            message = AIMessage(content=f"분석 중 오류가 발생했습니다: {e}")
            state["messages"].append(message)
        
        return state
    
    def _generate_report(self, state: GaitAnalysisState) -> GaitAnalysisState:
        """분석 리포트 생성"""
        if state.get("analysis_result") and "error" not in state["analysis_result"]:
            report = self._format_analysis_report(state["analysis_result"])
        else:
            report = "이전 분석 결과를 조회합니다."
        
        message = AIMessage(content=report)
        state["messages"].append(message)
        return state
    
    def _format_analysis_report(self, analysis: Dict[str, Any]) -> str:
        """분석 결과를 사용자 친화적인 리포트로 변환"""
        report = f"""
## 보행 분석 결과

**감지된 보행 패턴**: {analysis.get('gait_pattern', '알 수 없음')}
**유사도 점수**: {analysis.get('similarity_score', 0):.2f}

**패턴 설명**: {analysis.get('pattern_description', '')}

**주요 특징**:
{chr(10).join(f"- {char}" for char in analysis.get('characteristics', []))}

**건강 위험도**: {analysis.get('health_assessment', '알 수 없음')}

**권장사항**:
{chr(10).join(f"- {rec}" for rec in analysis.get('recommendations', []))}

**주의사항**:
{chr(10).join(f"- {risk}" for risk in analysis.get('risk_factors', []))}
        """
        return report.strip()
    
    async def process_gait_data(self, user_id: str, embedding_data: List[float] = None) -> Dict[str, Any]:
        """보행 데이터 처리"""
        initial_state = GaitAnalysisState(
            messages=[],
            user_id=user_id,
            embedding_data=embedding_data or [],
            analysis_result={},
            is_walking=False
        )
        
        final_state = await self.graph.ainvoke(initial_state)
        
        return {
            "messages": final_state["messages"],
            "analysis_result": final_state["analysis_result"],
            "is_walking": final_state["is_walking"]
        }

gait_agent = GaitAnalysisAgent()
EOF

cat > backend/app/core/websocket_manager.py << 'EOF'
from fastapi import WebSocket
from typing import Dict, List
import json
import logging

logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"사용자 {user_id} WebSocket 연결됨")
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            logger.info(f"사용자 {user_id} WebSocket 연결 해제됨")
    
    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)
    
    async def send_json(self, data: dict, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(json.dumps(data))
    
    async def broadcast(self, message: str):
        for connection in self.active_connections.values():
            await connection.send_text(message)

websocket_manager = WebSocketManager()
EOF

cat > backend/app/api/routes.py << 'EOF'
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse
from typing import List, Dict, Any
from models.schemas import IMUData, AnalysisResult, ChatMessage, UserHealthInfo
from database.supabase_client import supabase_client
from agents.gait_agent import gait_agent
from app.core.websocket_manager import websocket_manager
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket_manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # 라즈베리파이에서 IMU 데이터 수신 처리
            await handle_imu_data(data, user_id)
    except WebSocketDisconnect:
        websocket_manager.disconnect(user_id)

@router.post("/api/imu-data")
async def receive_imu_data(data: IMUData):
    """IMU 센서 데이터 수신"""
    try:
        result = await supabase_client.save_imu_data(data.dict())
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"IMU 데이터 저장 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/embedding-data")
async def receive_embedding_data(user_id: str, embedding_data: List[float]):
    """임베딩 데이터 수신 및 분석 트리거"""
    try:
        # 임베딩 데이터 저장
        embedding_record = {
            "user_id": user_id,
            "timestamp": datetime.now().isoformat(),
            "embedding_vector": embedding_data,
            "original_data_id": "temp_id"
        }
        await supabase_client.save_embedding_data(embedding_record)
        
        # 보행 분석 실행
        analysis_result = await gait_agent.process_gait_data(user_id, embedding_data)
        
        # 분석 결과 저장
        if analysis_result["analysis_result"] and "error" not in analysis_result["analysis_result"]:
            result_record = {
                "user_id": user_id,
                "analysis_timestamp": datetime.now().isoformat(),
                **analysis_result["analysis_result"]
            }
            await supabase_client.save_analysis_result(result_record)
        
        # WebSocket으로 결과 전송
        await websocket_manager.send_json(analysis_result, user_id)
        
        return {"status": "success", "analysis": analysis_result}
    except Exception as e:
        logger.error(f"임베딩 데이터 처리 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/user/{user_id}/health-info")
async def get_user_health_info(user_id: str):
    """사용자 건강정보 조회"""
    try:
        health_info = await supabase_client.get_user_health_info(user_id)
        return {"status": "success", "data": health_info}
    except Exception as e:
        logger.error(f"건강정보 조회 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/user/{user_id}/analysis-history")
async def get_analysis_history(user_id: str):
    """분석 결과 히스토리 조회"""
    try:
        # 실제로는 Supabase에서 조회
        # 현재는 예시 데이터 반환
        history = [
            {
                "timestamp": "2025-05-22T10:30:00",
                "gait_pattern": "정상보행",
                "similarity_score": 0.85,
                "health_assessment": "낮음"
            }
        ]
        return {"status": "success", "data": history}
    except Exception as e:
        logger.error(f"분석 히스토리 조회 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/chat")
async def chat_endpoint(message: ChatMessage):
    """챗봇 대화 처리"""
    try:
        # 실제로는 LangChain Agent로 처리
        response = f"사용자 메시지 '{message.message}'에 대한 응답입니다."
        
        return {
            "status": "success",
            "response": response,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"챗봇 처리 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def handle_imu_data(data: str, user_id: str):
    """WebSocket을 통해 수신된 IMU 데이터 처리"""
    try:
        import json
        imu_data = json.loads(data)
        imu_data["user_id"] = user_id
        
        await supabase_client.save_imu_data(imu_data)
        logger.info(f"사용자 {user_id}의 IMU 데이터 저장 완료")
    except Exception as e:
        logger.error(f"IMU 데이터 처리 실패: {e}")
EOF

cat > backend/app/main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langserve import add_routes
from app.api.routes import router
from config.settings import settings
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="보행 분석 API",
    description="LangServe 기반 보행 분석 시스템",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React 개발 서버
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 포함
app.include_router(router)

# LangServe 라우트 추가 (향후 확장용)
# add_routes(app, some_chain, path="/chain")

@app.get("/")
async def root():
    return {"message": "보행 분석 API 서버가 실행 중입니다"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.LANGSERVE_HOST,
        port=settings.LANGSERVE_PORT,
        reload=True
    )
EOF

# 프론트엔드 package.json
cat > frontend/package.json << 'EOF'
{
  "name": "gait-analysis-frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.4",
    "@testing-library/react": "^13.3.0",
    "@testing-library/user-event": "^13.5.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.1",
    "react-scripts": "5.0.1",
    "axios": "^1.3.4",
    "recharts": "^2.5.0",
    "styled-components": "^5.3.9",
    "react-speech-recognition": "^3.10.0",
    "react-speech-synthesis": "^1.0.0",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "proxy": "http://localhost:8000"
},
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
EOF