"""
Supabase 데이터베이스 클라이언트
- 보행 분석 애플리케이션의 모든 데이터베이스 작업 담당
- Mock 모드 지원으로 개발/테스트 환경에서 안정적 동작
- 포괄적인 에러 처리와 로깅 시스템
- 새로운 테이블 지원: user_states, emergency_events, walking_sessions
"""

from supabase import create_client, Client
from config.settings import settings
import logging
from datetime import datetime
from typing import Dict, List, Optional, Union, Any
from dataclasses import dataclass
import json

logger = logging.getLogger(__name__)

# 타입 정의
DatabaseResult = Dict[str, Any]
MockResult = Dict[str, Union[str, bool, Any]]

@dataclass
class UserHealthInfo:
    """사용자 건강 정보 데이터 클래스"""
    user_id: str
    age: int
    gender: str
    diseases: List[str]
    height: float
    weight: float
    medications: List[str]
    bmi: float
    activity_level: str
    medical_history: Optional[Dict[str, Any]] = None
    emergency_contact: Optional[Dict[str, str]] = None

@dataclass
class AnalysisResult:
    """분석 결과 데이터 클래스"""
    id: str
    user_id: str
    gait_pattern: str
    similarity_score: float
    health_assessment: str
    confidence_level: float
    timestamp: str

class MockDataProvider:
    """목업 데이터 제공 클래스"""
    
    @staticmethod
    def get_user_health_info(user_id: str) -> Dict[str, Any]:
        """사용자 건강정보 목업 데이터"""
        return {
            "user_id": user_id,
            "age": 35,
            "gender": "남성",
            "diseases": ["관절염", "경미한 고혈압"],
            "height": 175.5,
            "weight": 70.2,
            "medications": ["항염증제"],
            "bmi": 22.9,
            "activity_level": "moderate",
            "medical_history": {
                "surgeries": [],
                "allergies": ["페니실린"],
                "family_history": ["고혈압", "당뇨병"]
            },
            "emergency_contact": {
                "name": "김영희",
                "relationship": "딸",
                "phone": "010-1234-5678"
            }
        }
    
    @staticmethod
    def get_user_basic_info(user_id: str) -> Dict[str, str]:
        """사용자 기본정보 목업 데이터"""
        return {
            "user_id": user_id,
            "name": f"User {user_id}",
            "email": f"{user_id}@example.com"
        }
    
    @staticmethod
    def get_dashboard_data(user_id: str) -> Dict[str, Any]:
        """대시보드 목업 데이터"""
        return {
            "user_id": user_id,
            "name": "Demo User",
            "age": 35,
            "gender": "남성",
            "bmi": 22.9,
            "activity_level": "moderate",
            "total_analyses": 15,
            "avg_similarity_score": 0.82,
            "last_analysis": "2025-01-27T10:30:00Z",
            "high_risk_count": 2,
            "unread_notifications": 3
        }
    
    @staticmethod
    def get_notifications() -> List[Dict[str, Any]]:
        """알림 목업 데이터"""
        return [
            {
                "id": "1",
                "notification_type": "analysis_complete",
                "title": "보행 분석 완료",
                "message": "새로운 보행 분석 결과가 준비되었습니다.",
                "is_read": False,
                "priority": "normal",
                "created_at": "2025-01-27T10:30:00Z"
            },
            {
                "id": "2",
                "notification_type": "health_alert",
                "title": "건강 주의사항",
                "message": "최근 분석에서 불안정한 보행 패턴이 감지되었습니다.",
                "is_read": False,
                "priority": "high",
                "created_at": "2025-01-27T09:15:00Z"
            }
        ]
    
    @staticmethod
    def get_analysis_history() -> List[Dict[str, Any]]:
        """분석 히스토리 목업 데이터"""
        return [
            {
                "id": "mock_1",
                "timestamp": "2025-01-27T10:30:00",
                "gait_pattern": "정상보행",
                "similarity_score": 0.85,
                "health_assessment": "낮음",
                "confidence_level": 0.92
            },
            {
                "id": "mock_2",
                "timestamp": "2025-01-27T09:15:00",
                "gait_pattern": "정상보행",
                "similarity_score": 0.82,
                "health_assessment": "낮음",
                "confidence_level": 0.88
            }
        ]
    
    @staticmethod
    def get_rag_data() -> List[Dict[str, Any]]:
        """RAG 데이터 목업"""
        return [
            {
                "id": 1,
                "text": "정상적인 보행은 발뒤꿈치부터 착지하여 발바닥, 발가락 순으로 지면에 닿습니다.",
                "embedding": [],
                "metadata": {"category": "normal_gait"}
            },
            {
                "id": 2,
                "text": "무릎 통증은 보행 시 무릎 각도 변화에 영향을 줍니다.",
                "embedding": [],
                "metadata": {"category": "pathological_gait"}
            }
        ]
    
    @staticmethod
    def get_analysis_details(analysis_id: str) -> Dict[str, Any]:
        """분석 상세정보 목업 데이터"""
        return {
            "id": analysis_id,
            "user_id": "demo_user",
            "gait_pattern": "정상보행",
            "similarity_score": 0.85,
            "health_assessment": "낮음",
            "confidence_level": 0.92,
            "processing_time": 2.3,
            "model_accuracy": 0.89,
            "user_rating": 4,
            "user_comment": "분석 결과가 정확합니다."
        }
    
    @staticmethod
    def get_mock_state_id() -> str:
        """Mock 상태 ID 반환"""
        return "mock_state_" + datetime.now().strftime("%Y%m%d_%H%M%S")
    
    @staticmethod
    def get_mock_emergency_id() -> str:
        """Mock 응급상황 ID 반환"""
        return "mock_emergency_" + datetime.now().strftime("%Y%m%d_%H%M%S")
    
    @staticmethod
    def get_mock_session_id() -> str:
        """Mock 세션 ID 반환"""
        return "mock_session_" + datetime.now().strftime("%Y%m%d_%H%M%S")

class SupabaseClient:
    """Supabase 데이터베이스 클라이언트"""
    
    def __init__(self):
        self.is_mock = False
        self.client: Optional[Client] = None
        self._initialize_client()
    
    def _initialize_client(self) -> None:
        """Supabase 클라이언트 초기화"""
        try:
            # 환경변수 상세 로깅
            logger.info(f"🔍 Supabase 초기화 시작")
            logger.info(f"🔍 SUPABASE_URL: {settings.SUPABASE_URL[:50] if settings.SUPABASE_URL else 'None'}...")
            logger.info(f"🔍 SUPABASE_ANON_KEY: {'설정됨' if settings.SUPABASE_ANON_KEY else 'None'}")
            
            # 환경변수 검증
            if not settings.SUPABASE_URL:
                logger.error("❌ SUPABASE_URL이 설정되지 않았습니다!")
                self.is_mock = True
                return
                
            if not settings.SUPABASE_ANON_KEY:
                logger.error("❌ SUPABASE_ANON_KEY가 설정되지 않았습니다!")
                self.is_mock = True
                return
            
            # 환경변수가 빈 문자열인지 확인
            if settings.SUPABASE_URL.strip() == "" or settings.SUPABASE_ANON_KEY.strip() == "":
                logger.error("❌ Supabase 환경변수가 빈 문자열입니다!")
                self.is_mock = True
                return
            
            # Supabase 클라이언트 생성 시도
            logger.info("🔄 Supabase 클라이언트 생성 중...")
            self.client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_ANON_KEY
            )
            
            # 연결 테스트
            logger.info("🔄 Supabase 연결 테스트 중...")
            test_result = self.client.table("users").select("count", count="exact").execute()
            logger.info(f"✅ Supabase 연결 성공! 사용자 테이블 레코드 수: {test_result.count}")
            
            self.is_mock = False
            logger.info("✅ Supabase 클라이언트 초기화 완료 (실제 DB 모드)")
            
        except Exception as e:
            logger.error(f"❌ Supabase 클라이언트 초기화 실패: {e}")
            logger.error(f"❌ 오류 타입: {type(e).__name__}")
            logger.warning("⚠️ Mock 모드로 전환합니다.")
            self.is_mock = True
            self.client = None
    
    def _execute_with_fallback(
        self, 
        operation_name: str,
        operation: callable,
        fallback_data: Any = None,
        log_data: bool = False
    ) -> Union[DatabaseResult, MockResult]:
        """
        공통 에러 처리 및 목업 fallback 메서드
        
        Args:
            operation_name: 작업 이름 (로깅용)
            operation: 실행할 데이터베이스 작업
            fallback_data: 목업 모드에서 반환할 데이터
            log_data: 데이터 로깅 여부
        """
        if self.is_mock:
            if log_data and fallback_data:
                logger.info(f"목업 모드: {operation_name} - {json.dumps(fallback_data, ensure_ascii=False)}")
            else:
                logger.info(f"목업 모드: {operation_name}")
            return {"data": fallback_data, "status": "success", "mock": True}
        
        try:
            result = operation()
            logger.info(f"{operation_name} 완료")
            
            # Supabase API 응답 객체를 딕셔너리 형태로 변환
            if hasattr(result, 'data'):
                return {
                    "data": result.data,
                    "status": "success", 
                    "mock": False,
                    "count": getattr(result, 'count', None)
                }
            else:
                return {
                    "data": result,
                    "status": "success",
                    "mock": False
                }
                
        except Exception as e:
            logger.error(f"{operation_name} 실패: {e}")
            if fallback_data is not None:
                logger.info(f"{operation_name} - 목업 데이터로 fallback")
                return {"data": fallback_data, "status": "success", "mock": True, "error": str(e)}
            raise
    
    # 데이터 저장 메서드들
    def save_imu_data(self, data: Dict[str, Any]) -> Union[DatabaseResult, MockResult]:
        """IMU 센서 데이터 저장"""
        return self._execute_with_fallback(
            "IMU 데이터 저장",
            lambda: self.client.table("imu_data").insert(data).execute(),
            fallback_data=data,
            log_data=True
        )
    
    def save_chat_message(self, data: Dict[str, Any]) -> Union[DatabaseResult, MockResult]:
        """채팅 메시지 저장"""
        return self._execute_with_fallback(
            "채팅 메시지 저장",
            lambda: self.client.table("chat_history").insert(data).execute(),
            fallback_data=data
        )
    
    def save_embedding_data(self, data: Dict[str, Any]) -> Union[DatabaseResult, MockResult]:
        """임베딩 데이터 저장"""
        return self._execute_with_fallback(
            "임베딩 데이터 저장",
            lambda: self.client.table("embedding_data").insert(data).execute(),
            fallback_data=data
        )
    
    def save_analysis_result(self, data: Dict[str, Any]) -> Union[DatabaseResult, MockResult]:
        """분석 결과 저장"""
        return self._execute_with_fallback(
            "분석 결과 저장",
            lambda: self.client.table("analysis_results").insert(data).execute(),
            fallback_data=data
        )
    
    def save_fall_data(self, data: Dict[str, Any]) -> Union[DatabaseResult, MockResult]:
        """낙상 감지 데이터 저장 - 강화된 버전"""
        logger.warning(f"🚨 낙상 데이터 저장 시도:")
        logger.warning(f"🚨 - 사용자 ID: {data.get('user_id', 'UNKNOWN')}")
        logger.warning(f"🚨 - 타임스탬프: {data.get('timestamp', 'UNKNOWN')}")
        logger.warning(f"🚨 - 신뢰도: {data.get('confidence_score', 'UNKNOWN')}")
        logger.warning(f"🚨 - Mock 모드: {self.is_mock}")
        
        if self.is_mock:
            logger.warning(f"⚠️ Mock 모드로 낙상 데이터 저장 (실제 DB 저장 안됨)")
            logger.warning(f"⚠️ 환경변수 확인 필요:")
            logger.warning(f"⚠️ - SUPABASE_URL: {'설정됨' if settings.SUPABASE_URL else '미설정'}")
            logger.warning(f"⚠️ - SUPABASE_ANON_KEY: {'설정됨' if settings.SUPABASE_ANON_KEY else '미설정'}")
        
        result = self._execute_with_fallback(
            "낙상 데이터 저장",
            lambda: self.client.table("fall_data").insert(data).execute(),
            fallback_data=data,
            log_data=True
        )
        
        if result.get("mock"):
            logger.warning(f"⚠️ 낙상 데이터가 Mock 모드로 저장됨!")
            logger.warning(f"⚠️ 실제 데이터베이스 연결을 확인하세요!")
        else:
            logger.warning(f"✅ 낙상 데이터가 실제 DB에 저장됨!")
            
        return result
    
    def save_user_feedback(self, feedback_data: Dict[str, Any]) -> Union[DatabaseResult, MockResult]:
        """사용자 피드백 저장"""
        return self._execute_with_fallback(
            "피드백 저장",
            lambda: self.client.table("user_feedback").insert(feedback_data).execute(),
            fallback_data={"status": "success", "id": "mock_feedback_id"}
        )
    
    def log_model_performance(self, performance_data: Dict[str, Any]) -> Union[DatabaseResult, MockResult]:
        """모델 성능 로그 저장"""
        return self._execute_with_fallback(
            "모델 성능 로그 저장",
            lambda: self.client.table("model_performance_logs").insert(performance_data).execute(),
            fallback_data={"status": "success"}
        )
    
    # 🆕 새로운 테이블 메서드들 (워킹 모드 지원)
    def save_user_state(self, state_data: Dict[str, Any]) -> Union[DatabaseResult, MockResult]:
        """사용자 상태 저장"""
        return self._execute_with_fallback(
            f"사용자 상태 저장 - {state_data.get('user_id', 'unknown')}",
            lambda: self.client.table("user_states").insert(state_data).execute(),
            fallback_data={"id": MockDataProvider.get_mock_state_id(), **state_data}
        )
    
    def save_emergency_event(self, emergency_data: Dict[str, Any]) -> Union[DatabaseResult, MockResult]:
        """응급상황 이벤트 저장"""
        result = self._execute_with_fallback(
            f"응급상황 저장 - {emergency_data.get('user_id', 'unknown')}",
            lambda: self.client.table("emergency_events").insert(emergency_data).execute(),
            fallback_data={"id": MockDataProvider.get_mock_emergency_id(), **emergency_data}
        )
        
        if not result.get("mock"):
            logger.warning(f"🚨 응급상황 실제 DB 저장 완료: {emergency_data.get('user_id')}")
        
        return result
    
    def save_walking_session(self, session_data: Dict[str, Any]) -> str:
        """보행 세션 시작 저장"""
        result = self._execute_with_fallback(
            f"보행 세션 저장 - {session_data.get('user_id', 'unknown')}",
            lambda: self.client.table("walking_sessions").insert(session_data).execute(),
            fallback_data={"id": MockDataProvider.get_mock_session_id(), **session_data}
        )
        
        if result.get("data"):
            if isinstance(result["data"], list) and len(result["data"]) > 0:
                return result["data"][0]["id"]
            elif isinstance(result["data"], dict):
                return result["data"]["id"]
        
        return MockDataProvider.get_mock_session_id()
    
    def update_walking_session(self, session_id: str, update_data: Dict[str, Any]) -> Union[DatabaseResult, MockResult]:
        """보행 세션 업데이트"""
        return self._execute_with_fallback(
            f"보행 세션 업데이트 - {session_id}",
            lambda: self.client.table("walking_sessions").update(update_data).eq("id", session_id).execute(),
            fallback_data={"status": "success"}
        )
    
    # 사용자 관리 메서드들
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """사용자 존재 여부 확인"""
        if self.is_mock:
            logger.info(f"목업 모드: 사용자 조회 - {user_id}")
            return MockDataProvider.get_user_basic_info(user_id)
        
        try:
            result = self.client.table("users").select("*").eq("user_id", user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"사용자 조회 실패: {e}")
            return MockDataProvider.get_user_basic_info(user_id)
    
    def create_user(self, user_data: Dict[str, Any]) -> Union[DatabaseResult, MockResult]:
        """새 사용자 생성"""
        result = self._execute_with_fallback(
            f"사용자 생성 - {user_data.get('user_id', 'unknown')}",
            lambda: self.client.table("users").insert(user_data).execute(),
            fallback_data=user_data
        )
        if not result.get("mock"):
            logger.info(f"사용자 생성 완료: {user_data.get('user_id')}")
        return result
    
    def get_user_health_info(self, user_id: str) -> Optional[Dict[str, Any]]:
        """사용자 건강정보 조회"""
        if self.is_mock:
            logger.info(f"목업 모드: 사용자 건강정보 조회 - {user_id}")
            return MockDataProvider.get_user_health_info(user_id)
        
        try:
            result = self.client.table("user_health_info").select("*").eq("user_id", user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"사용자 건강정보 조회 실패: {e}")
            return MockDataProvider.get_user_health_info(user_id)
    
    def create_user_health_info(self, health_data: Dict[str, Any]) -> Union[DatabaseResult, MockResult]:
        """사용자 건강정보 생성"""
        result = self._execute_with_fallback(
            f"건강정보 생성 - {health_data.get('user_id', 'unknown')}",
            lambda: self.client.table("user_health_info").insert(health_data).execute(),
            fallback_data=health_data
        )
        if not result.get("mock"):
            logger.info(f"건강정보 생성 완료: {health_data.get('user_id')}")
        return result
    
    # 조회 메서드들
    async def get_rag_data(self, similarity_threshold: float = 0.8) -> List[Dict[str, Any]]:
        """RAG 데이터 조회"""
        if self.is_mock:
            logger.info("목업 모드: RAG 데이터 조회")
            return MockDataProvider.get_rag_data()
        
        try:
            result = self.client.table("gait_rag_data").select("*").execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"RAG 데이터 조회 실패: {e}")
            return MockDataProvider.get_rag_data()
    
    async def get_chat_history(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """사용자의 채팅 내역 조회"""
        if self.is_mock:
            logger.info(f"목업 모드: 채팅 내역 조회 - {user_id}")
            return []
        
        try:
            result = self.client.table("chat_history").select("*") \
                .eq("user_id", user_id) \
                .order("timestamp", desc=True) \
                .limit(limit) \
                .execute()
            
            messages = result.data if result.data else []
            messages.reverse()  # 시간순 정렬
            
            logger.info(f"사용자 {user_id}의 채팅 내역 {len(messages)}개 조회됨")
            return messages
        except Exception as e:
            logger.warning(f"채팅 내역 조회 실패: {e}. 빈 목록 반환.")
            return []
    
    async def get_user_dashboard_data(self, user_id: str) -> Optional[Dict[str, Any]]:
        """사용자 대시보드 데이터 조회"""
        if self.is_mock:
            logger.info(f"목업 모드: 대시보드 데이터 조회 - {user_id}")
            return MockDataProvider.get_dashboard_data(user_id)
        
        try:
            result = self.client.from_("user_dashboard_view").select("*").eq("user_id", user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"대시보드 데이터 조회 실패: {e}")
            return MockDataProvider.get_dashboard_data(user_id)
    
    async def get_notifications(self, user_id: str, unread_only: bool = False) -> List[Dict[str, Any]]:
        """사용자 알림 조회"""
        if self.is_mock:
            logger.info(f"목업 모드: 알림 조회 - {user_id}")
            return MockDataProvider.get_notifications()
        
        try:
            query = self.client.table("notifications").select("*").eq("user_id", user_id)
            if unread_only:
                query = query.eq("is_read", False)
            
            result = query.order("created_at", desc=True).execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"알림 조회 실패: {e}")
            return MockDataProvider.get_notifications()
    
    async def get_analysis_details(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """분석 결과 상세 정보 조회"""
        if self.is_mock:
            logger.info(f"목업 모드: 분석 상세 정보 조회 - {analysis_id}")
            return MockDataProvider.get_analysis_details(analysis_id)
        
        try:
            result = self.client.from_("analysis_details_view").select("*").eq("id", analysis_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"분석 상세 정보 조회 실패: {e}")
            return MockDataProvider.get_analysis_details(analysis_id)
    
    async def get_analysis_history(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """분석 결과 히스토리 조회"""
        if self.is_mock:
            logger.info(f"목업 모드: 분석 히스토리 조회 - {user_id}")
            return MockDataProvider.get_analysis_history()
        
        try:
            result = self.client.table("analysis_results").select("*") \
                .eq("user_id", user_id) \
                .order("analysis_timestamp", desc=True) \
                .limit(limit) \
                .execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"분석 히스토리 조회 실패: {e}")
            return MockDataProvider.get_analysis_history()
    
    # 업데이트 메서드들
    async def mark_notification_read(self, notification_id: str) -> Union[DatabaseResult, MockResult]:
        """알림 읽음 처리"""
        return await self._execute_with_fallback(
            f"알림 읽음 처리 - {notification_id}",
            lambda: self.client.table("notifications").update({
                "is_read": True,
                "read_at": datetime.now().isoformat()
            }).eq("id", notification_id).execute(),
            fallback_data={"status": "success"}
        )
    
    async def create_analysis_session(self, user_id: str) -> Optional[Dict[str, Any]]:
        """분석 세션 생성"""
        session_data = {
            "user_id": user_id,
            "session_start": datetime.now().isoformat(),
            "session_status": "active"
        }
        
        if self.is_mock:
            logger.info(f"목업 모드: 분석 세션 생성 - {user_id}")
            return {"id": "mock_session_id", "status": "active"}
        
        try:
            result = self.client.table("langchain_analysis_sessions").insert(session_data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"분석 세션 생성 실패: {e}")
            return {"id": "mock_session_id", "status": "active"}
    
    async def update_analysis_session(self, session_id: str, update_data: Dict[str, Any]) -> Union[DatabaseResult, MockResult]:
        """분석 세션 업데이트"""
        return await self._execute_with_fallback(
            f"분석 세션 업데이트 - {session_id}",
            lambda: self.client.table("langchain_analysis_sessions").update(update_data).eq("id", session_id).execute(),
            fallback_data={"status": "success"}
        )

# 싱글톤 인스턴스
supabase_client = SupabaseClient()
