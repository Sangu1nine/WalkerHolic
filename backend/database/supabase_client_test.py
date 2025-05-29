"""
업그레이드된 Supabase 데이터베이스 클라이언트
- SQL 스키마 완전 호환 (2025-05-29 버전)
- 라즈베리파이 실시간 데이터 처리 최적화
- 워킹 모드 및 ROC 분석 지원
- Mock 모드와 에러 처리 기존 장점 유지
"""

from supabase import create_client, Client
from config.settings import settings
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Union, Any
from dataclasses import dataclass
import json

logger = logging.getLogger(__name__)
KST = timezone(timedelta(hours=9))

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
    """분석 결과 데이터 클래스 - SQL 스키마 호환"""
    id: str
    user_id: str
    gait_pattern: str
    similarity_score: float
    health_assessment: str
    confidence_level: float
    analysis_timestamp: str  # SQL 스키마와 일치
    analysis_type: str = 'gait_pattern'
    recommendations: List[str] = None
    risk_factors: List[str] = None

class MockDataProvider:
    """목업 데이터 제공 클래스 - SQL 스키마 호환"""
    
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
        """대시보드 목업 데이터 - SQL 뷰와 호환"""
        return {
            "user_id": user_id,
            "name": "Demo User",
            "age": 35,
            "gender": "남성",
            "bmi": 22.9,
            "activity_level": "moderate",
            "current_state": "일상",
            "last_activity": datetime.now(KST).isoformat(),
            "total_analyses": 15,
            "avg_similarity_score": 0.82,
            "avg_confidence": 0.85,
            "last_analysis": datetime.now(KST).isoformat(),
            "high_risk_count": 2,
            "unread_notifications": 3,
            "critical_alerts": 0,
            "total_walking_sessions": 8,
            "avg_session_duration": 1200,
            "user_since": "2025-01-01T00:00:00+09:00"
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
                "created_at": datetime.now(KST).isoformat()
            },
            {
                "id": "2",
                "notification_type": "health_alert",
                "title": "건강 주의사항",
                "message": "최근 분석에서 불안정한 보행 패턴이 감지되었습니다.",
                "is_read": False,
                "priority": "high",
                "created_at": datetime.now(KST).isoformat()
            }
        ]
    
    @staticmethod
    def get_analysis_history() -> List[Dict[str, Any]]:
        """분석 히스토리 목업 데이터 - SQL 컬럼명 일치"""
        return [
            {
                "id": "mock_1",
                "analysis_timestamp": datetime.now(KST).isoformat(),
                "gait_pattern": "정상보행",
                "similarity_score": 0.85,
                "health_assessment": "보통",
                "confidence_level": 0.92,
                "analysis_type": "gait_pattern"
            },
            {
                "id": "mock_2", 
                "analysis_timestamp": (datetime.now(KST) - timedelta(hours=2)).isoformat(),
                "gait_pattern": "느린보행",
                "similarity_score": 0.78,
                "health_assessment": "주의",
                "confidence_level": 0.88,
                "analysis_type": "gait_pattern"
            }
        ]
    
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
    """업그레이드된 Supabase 데이터베이스 클라이언트"""
    
    def __init__(self):
        self.is_mock = False
        self.client: Optional[Client] = None
        self._initialize_client()
    
    def _initialize_client(self) -> None:
        """Supabase 클라이언트 초기화"""
        try:
            logger.info(f"🔍 Supabase 초기화 시작")
            logger.info(f"🔍 SUPABASE_URL: {settings.SUPABASE_URL[:50] if settings.SUPABASE_URL else 'None'}...")
            logger.info(f"🔍 SUPABASE_ANON_KEY: {'설정됨' if settings.SUPABASE_ANON_KEY else 'None'}")
            
            if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
                logger.error("❌ Supabase 환경변수가 설정되지 않았습니다!")
                self.is_mock = True
                return
                
            if settings.SUPABASE_URL.strip() == "" or settings.SUPABASE_ANON_KEY.strip() == "":
                logger.error("❌ Supabase 환경변수가 빈 문자열입니다!")
                self.is_mock = True
                return
            
            logger.info("🔄 Supabase 클라이언트 생성 중...")
            self.client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_ANON_KEY
            )
            
            logger.info("🔄 Supabase 연결 테스트 중...")
            test_result = self.client.table("users").select("count", count="exact").execute()
            logger.info(f"✅ Supabase 연결 성공! 사용자 테이블 레코드 수: {test_result.count}")
            
            self.is_mock = False
            logger.info("✅ Supabase 클라이언트 초기화 완료 (실제 DB 모드)")
            
        except Exception as e:
            logger.error(f"❌ Supabase 클라이언트 초기화 실패: {e}")
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
        """공통 에러 처리 및 목업 fallback 메서드"""
        if self.is_mock:
            if log_data and fallback_data:
                logger.info(f"목업 모드: {operation_name} - {json.dumps(fallback_data, ensure_ascii=False)}")
            else:
                logger.info(f"목업 모드: {operation_name}")
            return {"data": fallback_data, "status": "success", "mock": True}
        
        try:
            result = operation()
            logger.info(f"{operation_name} 완료")
            
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
    
    # 기본 데이터 저장 메서드들
    def save_imu_data(self, data: Dict[str, Any]) -> Union[DatabaseResult, MockResult]:
        """IMU 센서 데이터 저장"""
        return self._execute_with_fallback(
            "IMU 데이터 저장",
            lambda: self.client.table("imu_data").insert(data).execute(),
            fallback_data=data,
            log_data=True
        )
    
    def save_analysis_result(self, data: Dict[str, Any]) -> Union[DatabaseResult, MockResult]:
        """분석 결과 저장 - SQL 스키마 호환"""
        # 컬럼명 정규화: timestamp -> analysis_timestamp
        if 'timestamp' in data and 'analysis_timestamp' not in data:
            data['analysis_timestamp'] = data.pop('timestamp')
        
        # 기본값 설정
        data.setdefault('analysis_type', 'gait_pattern')
        data.setdefault('ai_model_version', 'v1.0')
        
        return self._execute_with_fallback(
            "분석 결과 저장",
            lambda: self.client.table("analysis_results").insert(data).execute(),
            fallback_data=data
        )
    
    def save_fall_data(self, data: Dict[str, Any]) -> Union[DatabaseResult, MockResult]:
        """낙상 감지 데이터 저장"""
        logger.warning(f"🚨 낙상 데이터 저장 시도:")
        logger.warning(f"🚨 - 사용자 ID: {data.get('user_id', 'UNKNOWN')}")
        logger.warning(f"🚨 - 타임스탬프: {data.get('timestamp', 'UNKNOWN')}")
        logger.warning(f"🚨 - 신뢰도: {data.get('confidence_score', 'UNKNOWN')}")
        
        result = self._execute_with_fallback(
            "낙상 데이터 저장",
            lambda: self.client.table("fall_data").insert(data).execute(),
            fallback_data=data,
            log_data=True
        )
        
        if result.get("mock"):
            logger.warning(f"⚠️ 낙상 데이터가 Mock 모드로 저장됨!")
        else:
            logger.warning(f"✅ 낙상 데이터가 실제 DB에 저장됨!")
            
        return result
    
    def save_chat_message(self, data: Dict[str, Any]) -> Union[DatabaseResult, MockResult]:
        """채팅 메시지 저장"""
        return self._execute_with_fallback(
            "채팅 메시지 저장",
            lambda: self.client.table("chat_history").insert(data).execute(),
            fallback_data=data
        )
    
    # 🆕 새로운 테이블 메서드들 (SQL 스키마 호환)
    def save_user_state(self, state_data: Dict[str, Any]) -> Union[DatabaseResult, MockResult]:
        """사용자 상태 저장 - 새로운 테이블"""
        # 기본값 설정
        state_data.setdefault('confidence_score', 0.0)
        state_data.setdefault('last_activity', datetime.now(KST).isoformat())
        
        return self._execute_with_fallback(
            f"사용자 상태 저장 - {state_data.get('user_id', 'unknown')}",
            lambda: self.client.table("user_states").insert(state_data).execute(),
            fallback_data={"id": MockDataProvider.get_mock_state_id(), **state_data}
        )
    
    def update_user_state(self, user_id: str, state_data: Dict[str, Any]) -> Union[DatabaseResult, MockResult]:
        """사용자 상태 업데이트"""
        state_data['updated_at'] = datetime.now(KST).isoformat()
        
        return self._execute_with_fallback(
            f"사용자 상태 업데이트 - {user_id}",
            lambda: self.client.table("user_states").update(state_data).eq("user_id", user_id).execute(),
            fallback_data={"status": "success"}
        )
    
    def save_walking_session(self, session_data: Dict[str, Any]) -> str:
        """보행 세션 저장 - 새로운 테이블"""
        # 기본값 설정
        session_data.setdefault('session_quality', 'unknown')
        
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
    
    def save_emergency_event(self, emergency_data: Dict[str, Any]) -> Union[DatabaseResult, MockResult]:
        """응급상황 이벤트 저장 - 새로운 테이블"""
        # 기본값 설정
        emergency_data.setdefault('event_type', 'fall_detected')
        emergency_data.setdefault('severity_level', 'high')
        emergency_data.setdefault('response_status', 'pending')
        emergency_data.setdefault('event_timestamp', datetime.now(KST).isoformat())
        
        result = self._execute_with_fallback(
            f"응급상황 저장 - {emergency_data.get('user_id', 'unknown')}",
            lambda: self.client.table("emergency_events").insert(emergency_data).execute(),
            fallback_data={"id": MockDataProvider.get_mock_emergency_id(), **emergency_data}
        )
        
        if not result.get("mock"):
            logger.warning(f"🚨 응급상황 실제 DB 저장 완료: {emergency_data.get('user_id')}")
        
        return result
    
    def update_emergency_event(self, event_id: str, update_data: Dict[str, Any]) -> Union[DatabaseResult, MockResult]:
        """응급상황 이벤트 업데이트"""
        return self._execute_with_fallback(
            f"응급상황 업데이트 - {event_id}",
            lambda: self.client.table("emergency_events").update(update_data).eq("id", event_id).execute(),
            fallback_data={"status": "success"}
        )
    
    # 🆕 ROC 분석 결과 저장 (라즈베리파이 연동)
    def save_roc_analysis(self, user_id: str, roc_data: Dict[str, Any]) -> Union[DatabaseResult, MockResult]:
        """ROC 분석 결과 저장 - 라즈베리파이 연동"""
        analysis_data = {
            'user_id': user_id,
            'analysis_timestamp': datetime.now(KST).isoformat(),
            'gait_pattern': '정상보행' if roc_data.get('walking', False) else '일상',
            'similarity_score': roc_data.get('confidence', 0.0),
            'confidence_level': roc_data.get('confidence', 0.0),
            'health_assessment': self._assess_health_from_roc(roc_data),
            'analysis_type': 'roc_walking',
            'pattern_description': f"ROC 기반 분석 (F1 Score: {roc_data.get('f1_score', 0.641)})",
            'characteristics': self._extract_roc_characteristics(roc_data),
            'ai_model_version': 'ROC_v1.0'
        }
        
        return self.save_analysis_result(analysis_data)
    
    def _assess_health_from_roc(self, roc_data: Dict[str, Any]) -> str:
        """ROC 데이터로부터 건강 상태 평가"""
        confidence = roc_data.get('confidence', 0.0)
        
        if confidence >= 0.8:
            return '좋음'
        elif confidence >= 0.6:
            return '보통'
        elif confidence >= 0.4:
            return '주의'
        else:
            return '위험'
    
    def _extract_roc_characteristics(self, roc_data: Dict[str, Any]) -> List[str]:
        """ROC 데이터에서 특징 추출"""
        characteristics = []
        
        if roc_data.get('walking', False):
            characteristics.append('보행 감지됨')
            
        if 'step_frequency' in roc_data:
            freq = roc_data['step_frequency']
            if freq > 0:
                characteristics.append(f'보행 주파수: {freq:.2f}Hz')
        
        if 'acc_mean' in roc_data:
            characteristics.append(f'가속도 평균: {roc_data["acc_mean"]:.3f}')
            
        if 'regularity' in roc_data:
            characteristics.append(f'규칙성: {roc_data["regularity"]:.3f}')
        
        return characteristics
    
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
    
    # 🆕 SQL 뷰 활용 메서드들
    async def get_user_dashboard_data(self, user_id: str) -> Optional[Dict[str, Any]]:
        """사용자 대시보드 데이터 조회 - SQL 뷰 활용"""
        if self.is_mock:
            logger.info(f"목업 모드: 대시보드 데이터 조회 - {user_id}")
            return MockDataProvider.get_dashboard_data(user_id)
        
        try:
            result = self.client.from_("user_dashboard_view").select("*").eq("user_id", user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"대시보드 데이터 조회 실패: {e}")
            return MockDataProvider.get_dashboard_data(user_id)
    
    async def get_analysis_details(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """분석 결과 상세 정보 조회 - SQL 뷰 활용"""
        if self.is_mock:
            logger.info(f"목업 모드: 분석 상세 정보 조회 - {analysis_id}")
            return {
                "id": analysis_id,
                "user_id": "demo_user",
                "gait_pattern": "정상보행",
                "similarity_score": 0.85,
                "health_assessment": "보통",
                "confidence_level": 0.92,
                "analysis_timestamp": datetime.now(KST).isoformat(),
                "analysis_type": "gait_pattern"
            }
        
        try:
            result = self.client.from_("analysis_details_view").select("*").eq("id", analysis_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"분석 상세 정보 조회 실패: {e}")
            return None
    
    async def get_analysis_history(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """분석 결과 히스토리 조회 - SQL 컬럼명 일치"""
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
    
    # 🆕 응급상황 모니터링 메서드들
    async def get_emergency_monitoring_data(self) -> List[Dict[str, Any]]:
        """응급상황 모니터링 데이터 조회 - SQL 뷰 활용"""
        if self.is_mock:
            logger.info("목업 모드: 응급상황 모니터링 데이터 조회")
            return []
        
        try:
            result = self.client.from_("emergency_monitoring_view").select("*").execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"응급상황 모니터링 데이터 조회 실패: {e}")
            return []
    
    async def get_pending_emergencies(self) -> List[Dict[str, Any]]:
        """대기 중인 응급상황 조회"""
        if self.is_mock:
            return []
        
        try:
            result = self.client.table("emergency_events") \
                .select("*") \
                .in_("response_status", ["pending", "acknowledged"]) \
                .order("event_timestamp", desc=True) \
                .execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"대기 중인 응급상황 조회 실패: {e}")
            return []
    
    # 🆕 라즈베리파이 디바이스 관리
    def ensure_raspberry_pi_user(self, device_id: str) -> bool:
        """라즈베리파이 디바이스 사용자 자동 생성/확인"""
        try:
            # 기존 사용자 확인
            existing_user = self.get_user_by_id(device_id)
            if existing_user:
                return True
            
            # 새 디바이스 사용자 생성
            device_name = device_id.replace('_', ' ').title()
            user_data = {
                'user_id': device_id,
                'name': device_name,
                'email': f"{device_id}@device.local"
            }
            
            self.create_user(user_data)
            
            # 디바이스 기본 건강 정보 생성
            health_data = {
                'user_id': device_id,
                'age': 65,
                'gender': '미지정',
                'height': 170.0,
                'weight': 70.0,
                'activity_level': 'unknown',
                'diseases': [],
                'medications': [],
                'medical_history': {
                    "device_type": "raspberry_pi",
                    "location": "home",
                    "setup_date": datetime.now().strftime("%Y-%m-%d"),
                    "model": "4B",
                    "purpose": "gait_monitoring",
                    "device_id": device_id
                },
                'emergency_contact': {
                    "contact_type": "device_admin",
                    "email": "admin@device.local",
                    "phone": "010-0000-0000"
                }
            }
            
            self.create_user_health_info(health_data)
            
            # 초기 상태 생성
            initial_state = {
                'user_id': device_id,
                'current_state': 'unknown',
                'confidence_score': 0.0,
                'last_activity': datetime.now(KST).isoformat()
            }
            
            self.save_user_state(initial_state)
            
            logger.info(f"라즈베리파이 디바이스 사용자 생성 완료: {device_id}")
            return True
            
        except Exception as e:
            logger.error(f"라즈베리파이 디바이스 사용자 생성 실패 [{device_id}]: {e}")
            return False
    
    # 🆕 배치 처리 메서드들 (성능 최적화)
    def save_imu_batch(self, imu_data_list: List[Dict[str, Any]]) -> Union[DatabaseResult, MockResult]:
        """IMU 데이터 배치 저장 - 성능 최적화"""
        if not imu_data_list:
            return {"data": [], "status": "success", "mock": self.is_mock}
        
        return self._execute_with_fallback(
            f"IMU 배치 저장 ({len(imu_data_list)}개)",
            lambda: self.client.table("imu_data").insert(imu_data_list).execute(),
            fallback_data=imu_data_list
        )
    
    # 🆕 기존 메서드들 (호환성 유지)
    def save_embedding_data(self, data: Dict[str, Any]) -> Union[DatabaseResult, MockResult]:
        """임베딩 데이터 저장"""
        return self._execute_with_fallback(
            "임베딩 데이터 저장",
            lambda: self.client.table("embedding_data").insert(data).execute(),
            fallback_data=data
        )
    
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
    
    async def get_rag_data(self, similarity_threshold: float = 0.8) -> List[Dict[str, Any]]:
        """RAG 데이터 조회"""
        if self.is_mock:
            logger.info("목업 모드: RAG 데이터 조회")
            return [
                {
                    "id": 1,
                    "pattern_name": "정상보행",
                    "description": "정상적인 보행은 발뒤꿈치부터 착지하여 발바닥, 발가락 순으로 지면에 닿습니다.",
                    "characteristics": ["일정한 보폭", "안정적인 리듬", "균형잡힌 자세"],
                    "severity_level": "low"
                },
                {
                    "id": 2,
                    "pattern_name": "불안정보행",
                    "description": "균형이 불안정한 보행 패턴입니다.",
                    "characteristics": ["불규칙한 보폭", "흔들리는 움직임", "균형 문제"],
                    "severity_level": "high"
                }
            ]
        
        try:
            result = self.client.table("gait_rag_data").select("*").execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"RAG 데이터 조회 실패: {e}")
            return []
    
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
    
    async def mark_notification_read(self, notification_id: str) -> Union[DatabaseResult, MockResult]:
        """알림 읽음 처리"""
        return self._execute_with_fallback(
            f"알림 읽음 처리 - {notification_id}",
            lambda: self.client.table("notifications").update({
                "is_read": True,
                "read_at": datetime.now(KST).isoformat()
            }).eq("id", notification_id).execute(),
            fallback_data={"status": "success"}
        )
    
    async def create_analysis_session(self, user_id: str) -> Optional[Dict[str, Any]]:
        """분석 세션 생성"""
        session_data = {
            "user_id": user_id,
            "session_start": datetime.now(KST).isoformat(),
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
        return self._execute_with_fallback(
            f"분석 세션 업데이트 - {session_id}",
            lambda: self.client.table("langchain_analysis_sessions").update(update_data).eq("id", session_id).execute(),
            fallback_data={"status": "success"}
        )
    
    # 🆕 워킹 모드 전용 조회 메서드들
    async def get_current_user_state(self, user_id: str) -> Optional[Dict[str, Any]]:
        """현재 사용자 상태 조회"""
        if self.is_mock:
            return {
                "user_id": user_id,
                "current_state": "일상",
                "confidence_score": 0.0,
                "last_activity": datetime.now(KST).isoformat()
            }
        
        try:
            result = self.client.table("user_states") \
                .select("*") \
                .eq("user_id", user_id) \
                .order("updated_at", desc=True) \
                .limit(1) \
                .execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"현재 사용자 상태 조회 실패: {e}")
            return None
    
    async def get_active_walking_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        """활성 보행 세션 조회"""
        if self.is_mock:
            return []
        
        try:
            result = self.client.table("walking_sessions") \
                .select("*") \
                .eq("user_id", user_id) \
                .is_("session_end", "null") \
                .order("session_start", desc=True) \
                .execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"활성 보행 세션 조회 실패: {e}")
            return []
    
    # 🆕 성능 모니터링 메서드들
    async def get_system_health_check(self) -> Dict[str, Any]:
        """시스템 상태 확인"""
        health_check = {
            "database_connection": "mock" if self.is_mock else "connected",
            "timestamp": datetime.now(KST).isoformat(),
            "tables_accessible": True,
            "last_check_status": "success"
        }
        
        if not self.is_mock:
            try:
                # 기본 테이블들 접근 테스트
                tables_to_check = ["users", "user_health_info", "analysis_results", 
                                 "user_states", "walking_sessions", "emergency_events"]
                
                for table in tables_to_check:
                    result = self.client.table(table).select("count", count="exact").limit(1).execute()
                    if result.count is None:
                        health_check["tables_accessible"] = False
                        health_check["last_check_status"] = f"Table {table} not accessible"
                        break
                        
            except Exception as e:
                health_check["tables_accessible"] = False
                health_check["last_check_status"] = f"Error: {str(e)}"
                health_check["database_connection"] = "error"
        
        return health_check

# 싱글톤 인스턴스
supabase_client = SupabaseClient()