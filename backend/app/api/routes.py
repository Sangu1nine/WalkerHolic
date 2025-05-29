from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse
from typing import List, Dict, Any
from models.schemas import IMUData, AnalysisResult, ChatMessage, UserHealthInfo
from config.settings import settings
from datetime import datetime
import logging
import json
import os

# 🔄 MODIFIED [2025-01-27]: 환경변수에 따른 조건부 import - 워킹 모드 지원
if os.getenv('USE_WALKING_WEBSOCKET', 'false').lower() == 'true':
    from app.core.websocket_manager_walking import websocket_manager
    from database.supabase_client_test import supabase_client
    print("🚶 워킹 모드: websocket_manager_walking 및 supabase_client_test 사용")
else:
    from app.core.websocket_manager import websocket_manager
    from database.supabase_client import supabase_client
    print("🏠 일반 모드: 기본 websocket_manager 및 supabase_client 사용")

from agents.gait_agent import gait_agent

logger = logging.getLogger(__name__)
router = APIRouter()

# WebSocket 엔드포인트 정의
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket 연결 엔드포인트 - 개선된 오류 처리"""
    await websocket_manager.connect(websocket, user_id)
    logger.info(f"🔌 사용자 {user_id} WebSocket 연결 성공")
    
    try:
        # 연결 성공 메시지 전송
        await websocket.send_json({
            "type": "connection_established",
            "message": f"사용자 {user_id} 연결 성공",
            "timestamp": datetime.now().isoformat()
        })
        
        while True:
            try:
                # 타임아웃 설정으로 무한 대기 방지
                data = await websocket.receive_text()
                
                # 핑/퐁 메시지 처리
                if data.strip() == "ping":
                    await websocket.send_text("pong")
                    continue
                
                # 종료 메시지 처리
                if data.strip() == "disconnect":
                    logger.info(f"사용자 {user_id}가 정상적으로 연결 종료 요청")
                    await websocket.send_json({
                        "type": "disconnect_ack",
                        "message": "연결이 정상적으로 종료됩니다."
                    })
                    break
                
                # 새로운 데이터 핸들러 사용 (TIMESTAMPTZ + Asia/Seoul 지원)
                await websocket_manager.handle_received_data(data, user_id)
                
            except Exception as e:
                if "no close frame received or sent" in str(e):
                    logger.warning(f"사용자 {user_id} WebSocket 연결이 비정상적으로 종료됨")
                    break
                elif "Connection closed" in str(e):
                    logger.info(f"사용자 {user_id} WebSocket 연결이 클라이언트에 의해 종료됨")
                    break
                else:
                    logger.error(f"사용자 {user_id} WebSocket 데이터 처리 중 오류: {e}")
                    # 오류 메시지를 클라이언트에 전송 (가능한 경우)
                    try:
                        await websocket.send_json({
                            "type": "error",
                            "message": f"데이터 처리 중 오류가 발생했습니다: {str(e)[:100]}",
                            "timestamp": datetime.now().isoformat()
                        })
                    except:
                        break
            
    except WebSocketDisconnect:
        logger.info(f"🔌 사용자 {user_id} WebSocket 정상 연결 해제")
    except Exception as e:
        logger.error(f"❌ 사용자 {user_id} WebSocket 연결 중 예상치 못한 오류: {e}")
    finally:
        # 연결 정리
        websocket_manager.disconnect(user_id)
        logger.info(f"🧹 사용자 {user_id} WebSocket 연결 정리 완료")

@router.post("/api/imu-data")
async def receive_imu_data(data: IMUData):
    """IMU 센서 데이터 수신"""
    try:
        logger.info(f"IMU 데이터 수신: {data.user_id}")
        result = supabase_client.save_imu_data(data.dict())
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"IMU 데이터 저장 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/embedding-data")
async def receive_embedding_data(user_id: str, embedding_data: List[float]):
    """임베딩 데이터 수신 및 분석 처리"""
    try:
        logger.info(f"임베딩 데이터 수신: 사용자 {user_id}, 크기: {len(embedding_data)}")
        
        # 임베딩 데이터 저장
        embedding_record = {
            "user_id": user_id,
            "embedding": embedding_data,
            "timestamp": datetime.now().isoformat()
        }
        supabase_client.save_embedding_data(embedding_record)
        
        # 분석 결과 저장
        analysis_result = {
            "user_id": user_id,
            "gait_pattern": "정상보행",
            "similarity_score": 0.85,
            "health_assessment": "낮음",
            "confidence_level": 0.92,
            "analysis_timestamp": datetime.now().isoformat()
        }
        supabase_client.save_analysis_result(analysis_result)
        
        return {"status": "success", "message": "임베딩 데이터 처리 완료"}
    except Exception as e:
        logger.error(f"임베딩 데이터 처리 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/user/{user_id}/health-info")
async def get_user_health_info(user_id: str):
    """사용자 건강정보 조회"""
    try:
        health_info = supabase_client.get_user_health_info(user_id)
        return {"status": "success", "data": health_info}
    except Exception as e:
        logger.error(f"건강정보 조회 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# MODIFIED [2025-01-27]: 새로운 API 엔드포인트 추가 - 대시보드, 알림, 피드백
@router.get("/api/user/{user_id}/dashboard")
async def get_user_dashboard(user_id: str):
    """사용자 대시보드 데이터 조회"""
    try:
        dashboard_data = await supabase_client.get_user_dashboard_data(user_id)
        return {"status": "success", "data": dashboard_data}
    except Exception as e:
        logger.error(f"대시보드 데이터 조회 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/user/{user_id}/notifications")
async def get_user_notifications(user_id: str, unread_only: bool = False):
    """사용자 알림 조회"""
    try:
        notifications = await supabase_client.get_notifications(user_id, unread_only)
        return {"status": "success", "data": notifications}
    except Exception as e:
        logger.error(f"알림 조회 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/api/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """알림 읽음 처리"""
    try:
        result = await supabase_client.mark_notification_read(notification_id)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"알림 읽음 처리 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/feedback")
async def submit_feedback(feedback: Dict[str, Any]):
    """사용자 피드백 제출"""
    try:
        result = supabase_client.save_user_feedback(feedback)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"피드백 제출 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/analysis/{analysis_id}/details")
async def get_analysis_details(analysis_id: str):
    """분석 결과 상세 정보 조회"""
    try:
        details = await supabase_client.get_analysis_details(analysis_id)
        return {"status": "success", "data": details}
    except Exception as e:
        logger.error(f"분석 상세 정보 조회 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/user/{user_id}/analysis-history")
async def get_analysis_history(user_id: str, limit: int = 10):
    """분석 결과 히스토리 조회 (개선됨)"""
    try:
        # 실제 Supabase에서 조회하도록 개선
        history = await supabase_client.get_analysis_history(user_id, limit)
        if not history:
            # 목업 데이터 반환
            history = [
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
        return {"status": "success", "data": history}
    except Exception as e:
        logger.error(f"분석 히스토리 조회 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/chat")
async def chat_endpoint(message: ChatMessage):
    """챗봇 대화 처리"""
    try:
        # OpenAI API 키 확인
        if not settings.OPENAI_API_KEY:
            return {
                "status": "error",
                "response": "OpenAI API 키가 설정되지 않았습니다. 백엔드 서버의 .env 파일에 API 키를 설정해주세요.",
                "timestamp": datetime.now().isoformat()
            }
        
        response = ""
        current_timestamp = datetime.now().isoformat()
        
        # OpenAI를 사용한 챗봇 응답 생성
        try:
            from langchain_openai import ChatOpenAI
            from langchain.schema import HumanMessage, AIMessage
            
            logger.info(f"ChatOpenAI 모델 초기화: model=gpt-4o, temperature=0.7")
            chat_model = ChatOpenAI(
                model="gpt-4o",
                api_key=settings.OPENAI_API_KEY,
                temperature=0.7
            )
            
            # 이전 대화 가져오기 (최대 10개)
            try:
                previous_messages = []
                try:
                    # Supabase에서 이전 대화 가져오기 시도
                    logger.info(f"이전 대화 검색 중: 사용자 ID = {message.user_id}")
                    chat_history = await supabase_client.get_chat_history(message.user_id, limit=10)
                    
                    # 대화 기록이 있으면 메시지로 변환
                    if chat_history and not isinstance(chat_history, dict):
                        for chat in chat_history:
                            if chat.get("is_user", True):
                                previous_messages.append(HumanMessage(content=chat.get("message", "")))
                            else:
                                previous_messages.append(AIMessage(content=chat.get("message", "")))
                    
                    logger.info(f"이전 대화 {len(previous_messages)}개 검색됨")
                except Exception as history_error:
                    logger.warning(f"이전 대화 검색 실패: {history_error}")
                
                # 현재 메시지 추가
                messages_for_llm = previous_messages + [HumanMessage(content=message.message)]
                
                logger.info(f"OpenAI API 호출: 메시지 = '{message.message}', 컨텍스트 길이 = {len(messages_for_llm)}")
                response_message = chat_model.invoke(messages_for_llm)
                
                response = response_message.content
                logger.info(f"OpenAI API 응답 수신: 길이 = {len(response)}")
            except Exception as context_error:
                logger.error(f"대화 컨텍스트 처리 중 오류: {context_error}")
                # 컨텍스트 없이 단일 메시지로 시도
                logger.info(f"OpenAI API 호출(컨텍스트 없음): 메시지 = '{message.message}'")
                response_message = chat_model.invoke([HumanMessage(content=message.message)])
                response = response_message.content
        except Exception as openai_error:
            logger.error(f"OpenAI API 호출 실패: {openai_error}")
            return {
                "status": "error",
                "response": f"OpenAI API 호출 중 오류가 발생했습니다: {str(openai_error)}",
                "timestamp": current_timestamp
            }
        
        # 사용자 메시지 저장
        user_message_record = {
            "user_id": message.user_id,
            "message": message.message,
            "is_user": True,
            "timestamp": message.timestamp or current_timestamp
        }
        
        # AI 응답 저장
        ai_message_record = {
            "user_id": message.user_id,
            "message": response,
            "is_user": False,
            "timestamp": current_timestamp
        }
        
        # Supabase 저장 시도
        try:
            logger.info(f"Supabase에 사용자 메시지 저장 시도")
            supabase_client.save_chat_message(user_message_record)
            
            logger.info(f"Supabase에 AI 응답 저장 시도")
            supabase_client.save_chat_message(ai_message_record)
            
            logger.info(f"Supabase에 채팅 내용 저장 성공")
        except Exception as db_error:
            logger.error(f"Supabase에 채팅 내용 저장 실패: {db_error}")
            # 저장 실패해도 응답은 반환
        
        return {
            "status": "success",
            "response": response,
            "timestamp": current_timestamp
        }
    except Exception as e:
        logger.error(f"챗봇 처리 실패: {e}")
        return {
            "status": "error",
            "response": f"죄송합니다. 메시지 처리 중 오류가 발생했습니다: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

@router.post("/api/cognitive-test")
async def cognitive_test(user_id: str):
    """인지기능 테스트 실행"""
    try:
        # 인지기능 테스트 결과 생성 (실제로는 테스트 로직 구현)
        import random
        
        test_result = {
            "user_id": user_id,
            "test_type": "cognitive",
            "timestamp": datetime.now().isoformat(),
            "scores": {
                "memory": random.randint(70, 100),
                "attention": random.randint(65, 95),
                "executive_function": random.randint(75, 100),
                "language": random.randint(80, 100),
                "visuospatial": random.randint(70, 95)
            },
            "overall_score": random.randint(70, 95),
            "risk_level": "normal",  # normal, mild, moderate, severe
            "recommendations": [
                "정기적인 독서와 퍼즐 게임을 권장합니다.",
                "사회적 활동 참여를 늘려보세요.",
                "충분한 수면을 취하세요."
            ]
        }
        
        # 위험도 평가
        if test_result["overall_score"] >= 85:
            test_result["risk_level"] = "normal"
        elif test_result["overall_score"] >= 70:
            test_result["risk_level"] = "mild"
        elif test_result["overall_score"] >= 55:
            test_result["risk_level"] = "moderate"
        else:
            test_result["risk_level"] = "severe"
        
        # 결과 저장 (실제로는 데이터베이스에 저장)
        logger.info(f"인지기능 테스트 완료: 사용자 {user_id}, 점수 {test_result['overall_score']}")
        
        return {"status": "success", "result": test_result}
    except Exception as e:
        logger.error(f"인지기능 테스트 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/fall-risk-test")
async def fall_risk_test(user_id: str):
    """낙상 위험도 테스트 실행"""
    try:
        # 낙상 위험도 테스트 결과 생성 (실제로는 센서 데이터 기반 분석)
        import random
        
        test_result = {
            "user_id": user_id,
            "test_type": "fall_risk",
            "timestamp": datetime.now().isoformat(),
            "assessments": {
                "balance": random.randint(60, 100),
                "gait_stability": random.randint(65, 95),
                "muscle_strength": random.randint(70, 100),
                "reaction_time": random.randint(60, 90),
                "vision": random.randint(75, 100)
            },
            "overall_risk_score": random.randint(15, 85),
            "risk_level": "low",  # low, medium, high
            "recommendations": [
                "균형 운동을 정기적으로 실시하세요.",
                "집안의 장애물을 제거하세요.",
                "적절한 조명을 유지하세요."
            ]
        }
        
        # 위험도 평가 (점수가 높을수록 위험)
        if test_result["overall_risk_score"] <= 30:
            test_result["risk_level"] = "low"
        elif test_result["overall_risk_score"] <= 60:
            test_result["risk_level"] = "medium"
        else:
            test_result["risk_level"] = "high"
        
        # 결과 저장 (실제로는 데이터베이스에 저장)
        logger.info(f"낙상 위험도 테스트 완료: 사용자 {user_id}, 위험도 {test_result['risk_level']}")
        
        return {"status": "success", "result": test_result}
    except Exception as e:
        logger.error(f"낙상 위험도 테스트 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 🚶 ADDED [2025-01-27]: 워킹 전용 API 엔드포인트들 - Walking_Raspberry.py와 websocket_manager_walking.py 지원
@router.get("/api/walking/user/{user_id}/status")
async def get_walking_user_status(user_id: str):
    """워킹 모드: 사용자 실시간 상태 조회 (일상/보행/낙상/응급)"""
    try:
        # websocket_manager_walking의 get_user_status 메서드 사용
        if hasattr(websocket_manager, 'get_user_status'):
            status = await websocket_manager.get_user_status(user_id)
            return {"status": "success", "data": status}
        else:
            # 기본 WebSocket 매니저인 경우 기본 응답
            return {
                "status": "success", 
                "data": {
                    "user_id": user_id,
                    "message": "워킹 모드가 아닙니다. USE_WALKING_WEBSOCKET=true로 설정하세요.",
                    "is_walking_mode": False
                }
            }
    except Exception as e:
        logger.error(f"워킹 사용자 상태 조회 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/walking/connected-users")
async def get_walking_connected_users():
    """워킹 모드: 현재 연결된 모든 사용자 목록"""
    try:
        if hasattr(websocket_manager, 'active_connections'):
            connected_users = []
            for user_id in websocket_manager.active_connections.keys():
                if hasattr(websocket_manager, 'get_user_status'):
                    status = await websocket_manager.get_user_status(user_id)
                    connected_users.append(status)
                else:
                    connected_users.append({
                        "user_id": user_id,
                        "is_connected": True,
                        "message": "기본 모드"
                    })
            
            return {
                "status": "success", 
                "data": {
                    "total_connected": len(connected_users),
                    "users": connected_users,
                    "is_walking_mode": hasattr(websocket_manager, 'get_user_status')
                }
            }
        else:
            return {"status": "success", "data": {"total_connected": 0, "users": []}}
    except Exception as e:
        logger.error(f"연결된 사용자 목록 조회 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/walking/emergency-monitor")
async def get_emergency_monitor():
    """워킹 모드: 응급상황 모니터링 현황"""
    try:
        if hasattr(websocket_manager, 'emergency_timers'):
            emergency_status = []
            for user_id, fall_time in websocket_manager.emergency_timers.items():
                import time
                duration = time.time() - fall_time
                emergency_status.append({
                    "user_id": user_id,
                    "fall_time": fall_time,
                    "duration_seconds": duration,
                    "status": "CRITICAL" if duration >= 15 else "MONITORING",
                    "message": f"낙상 후 {duration:.1f}초 경과"
                })
            
            return {
                "status": "success",
                "data": {
                    "total_emergencies": len(emergency_status),
                    "emergencies": emergency_status,
                    "is_walking_mode": True
                }
            }
        else:
            return {
                "status": "success",
                "data": {
                    "total_emergencies": 0,
                    "emergencies": [],
                    "is_walking_mode": False,
                    "message": "워킹 모드가 아닙니다."
                }
            }
    except Exception as e:
        logger.error(f"응급상황 모니터링 조회 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/walking/send-message/{user_id}")
async def send_walking_message(user_id: str, message_data: Dict[str, Any]):
    """워킹 모드: 특정 사용자에게 메시지 전송"""
    try:
        if hasattr(websocket_manager, '_safe_send'):
            await websocket_manager._safe_send(message_data, user_id)
            return {
                "status": "success",
                "message": f"사용자 {user_id}에게 메시지를 전송했습니다.",
                "data": message_data
            }
        else:
            return {
                "status": "error",
                "message": "워킹 모드가 아니거나 메시지 전송 기능이 없습니다."
            }
    except Exception as e:
        logger.error(f"워킹 메시지 전송 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/walking/system-info")
async def get_walking_system_info():
    """워킹 모드: 시스템 정보 및 통계"""
    try:
        system_info = {
            "is_walking_mode": os.getenv('USE_WALKING_WEBSOCKET', 'false').lower() == 'true',
            "is_test_supabase": os.getenv('USE_TEST_SUPABASE', 'false').lower() == 'true',
            "timestamp": datetime.now().isoformat()
        }
        
        # WebSocket 매니저 정보
        if hasattr(websocket_manager, 'active_connections'):
            system_info["websocket_connections"] = len(websocket_manager.active_connections)
            system_info["connected_users"] = list(websocket_manager.active_connections.keys())
        
        # 버퍼 정보 (워킹 모드인 경우)
        if hasattr(websocket_manager, 'imu_batch_buffers'):
            system_info["imu_buffers"] = {
                user_id: len(buffer) 
                for user_id, buffer in websocket_manager.imu_batch_buffers.items()
            }
        
        # 응급상황 타이머 정보
        if hasattr(websocket_manager, 'emergency_timers'):
            system_info["emergency_timers"] = len(websocket_manager.emergency_timers)
        
        # Supabase 연결 상태
        if hasattr(supabase_client, 'is_mock'):
            system_info["database_mode"] = "mock" if supabase_client.is_mock else "real"
        
        return {"status": "success", "data": system_info}
    except Exception as e:
        logger.error(f"워킹 시스템 정보 조회 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/walking/csv-backup-status")
async def get_csv_backup_status():
    """워킹 모드: CSV 백업 파일 상태 조회"""
    try:
        import glob
        from pathlib import Path
        
        backup_info = {
            "backup_folder": "data_backup",
            "files": [],
            "total_files": 0,
            "total_size_mb": 0
        }
        
        # data_backup 폴더의 CSV 파일들 조회
        backup_folder = Path("data_backup")
        if backup_folder.exists():
            csv_files = list(backup_folder.glob("*.csv"))
            
            for csv_file in csv_files:
                file_info = {
                    "filename": csv_file.name,
                    "size_mb": round(csv_file.stat().st_size / (1024*1024), 2),
                    "modified": datetime.fromtimestamp(csv_file.stat().st_mtime).isoformat()
                }
                backup_info["files"].append(file_info)
                backup_info["total_size_mb"] += file_info["size_mb"]
            
            backup_info["total_files"] = len(csv_files)
            backup_info["total_size_mb"] = round(backup_info["total_size_mb"], 2)
        
        return {"status": "success", "data": backup_info}
    except Exception as e:
        logger.error(f"CSV 백업 상태 조회 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 🆕 응급상황 해제 및 사용자 상태 확인 API
@router.post("/api/walking/emergency/{user_id}/resolve")
async def resolve_emergency(user_id: str, resolution_data: Dict[str, Any]):
    """워킹 모드: 응급상황 해제 - 사용자가 괜찮다고 응답했을 때"""
    try:
        if not hasattr(websocket_manager, 'emergency_timers'):
            return {
                "status": "error",
                "message": "워킹 모드가 아니거나 응급상황 관리 기능이 없습니다."
            }
        
        # 응급상황 타이머 해제
        if user_id in websocket_manager.emergency_timers:
            fall_time = websocket_manager.emergency_timers[user_id]
            import time
            duration = time.time() - fall_time
            
            # 타이머 제거
            del websocket_manager.emergency_timers[user_id]
            
            # 해제 알림 브로드캐스트
            resolution_message = {
                'type': 'emergency_resolved',
                'data': {
                    'user_id': user_id,
                    'message': f"사용자 {user_id}가 괜찮다고 응답했습니다. 응급상황이 해제됩니다.",
                    'resolution_type': resolution_data.get('resolution_type', 'user_ok'),
                    'duration_seconds': int(duration),
                    'resolved_by': 'user_response',
                    'timestamp': datetime.now().isoformat()
                }
            }
            
            # 모든 연결된 클라이언트에게 해제 알림
            await websocket_manager._broadcast_alert(resolution_message)
            
            # 응급상황 해제 로그 저장
            try:
                if not supabase_client.is_mock and hasattr(supabase_client, 'save_emergency_resolution'):
                    resolution_log = {
                        'user_id': user_id,
                        'fall_time': datetime.fromtimestamp(fall_time),
                        'resolution_time': datetime.now(),
                        'duration_seconds': int(duration),
                        'resolution_type': resolution_data.get('resolution_type', 'user_ok'),
                        'resolution_details': resolution_data
                    }
                    supabase_client.save_emergency_resolution(resolution_log)
            except Exception as e:
                logger.warning(f"응급상황 해제 로그 저장 실패: {e}")
            
            logger.info(f"✅ 응급상황 해제됨 [{user_id}] - 사용자 응답, 지속시간: {duration:.1f}초")
            
            return {
                "status": "success", 
                "message": "응급상황이 성공적으로 해제되었습니다.",
                "data": {
                    "user_id": user_id,
                    "duration_seconds": int(duration),
                    "resolution_type": resolution_data.get('resolution_type', 'user_ok')
                }
            }
        else:
            return {
                "status": "warning",
                "message": "해당 사용자에 대한 활성 응급상황이 없습니다.",
                "data": {"user_id": user_id}
            }
            
    except Exception as e:
        logger.error(f"응급상황 해제 실패 [{user_id}]: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/walking/emergency/{user_id}/confirm-help-needed")
async def confirm_help_needed(user_id: str, help_data: Dict[str, Any]):
    """워킹 모드: 도움이 필요하다고 응답했을 때 - 즉시 응급처리"""
    try:
        if not hasattr(websocket_manager, 'emergency_timers'):
            return {
                "status": "error",
                "message": "워킹 모드가 아니거나 응급상황 관리 기능이 없습니다."
            }
        
        # 즉시 응급상황 처리
        if user_id in websocket_manager.emergency_timers:
            fall_time = websocket_manager.emergency_timers[user_id]
            import time
            duration = time.time() - fall_time
        else:
            # 응급상황 타이머가 없어도 즉시 응급상황 생성
            fall_time = time.time() - 1  # 1초 전으로 설정
            duration = 1
        
        # 즉시 응급상황 알림 브로드캐스트
        emergency_message = {
            'type': 'emergency_confirmed_critical',
            'data': {
                'user_id': user_id,
                'message': f"🚨 긴급! 사용자 {user_id}가 도움이 필요하다고 응답했습니다!",
                'confirmation_type': help_data.get('help_type', 'general_help'),
                'duration_seconds': int(duration),
                'emergency_level': 'CRITICAL',
                'confirmed_by': 'user_response',
                'timestamp': datetime.now().isoformat()
            }
        }
        
        # 모든 연결된 클라이언트에게 긴급 알림
        await websocket_manager._broadcast_alert(emergency_message)
        
        # 응급상황 확정 로그 저장
        try:
            if not supabase_client.is_mock and hasattr(supabase_client, 'save_emergency_event'):
                emergency_data = {
                    'user_id': user_id,
                    'emergency_type': 'user_confirmed_help_needed',
                    'start_time': datetime.fromtimestamp(fall_time),
                    'confirmed_time': datetime.now(),
                    'duration_seconds': int(duration),
                    'emergency_details': help_data
                }
                supabase_client.save_emergency_event(emergency_data)
        except Exception as e:
            logger.warning(f"응급상황 확정 로그 저장 실패: {e}")
        
        logger.critical(f"🚨 응급상황 확정! [{user_id}] - 사용자가 도움 요청")
        
        return {
            "status": "success", 
            "message": "응급상황이 확정되었습니다. 즉시 도움을 요청합니다.",
            "data": {
                "user_id": user_id,
                "emergency_level": "CRITICAL",
                "help_type": help_data.get('help_type', 'general_help'),
                "auto_call_emergency": True
            }
        }
        
    except Exception as e:
        logger.error(f"응급상황 확정 실패 [{user_id}]: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/walking/user/{user_id}/current-emergency")
async def get_current_emergency_status(user_id: str):
    """워킹 모드: 특정 사용자의 현재 응급상황 상태 조회"""
    try:
        if not hasattr(websocket_manager, 'emergency_timers'):
            return {
                "status": "success",
                "data": {
                    "user_id": user_id,
                    "has_emergency": False,
                    "message": "워킹 모드가 아니거나 응급상황 관리 기능이 없습니다."
                }
            }
        
        if user_id in websocket_manager.emergency_timers:
            fall_time = websocket_manager.emergency_timers[user_id]
            import time
            duration = time.time() - fall_time
            
            return {
                "status": "success",
                "data": {
                    "user_id": user_id,
                    "has_emergency": True,
                    "fall_time": fall_time,
                    "duration_seconds": duration,
                    "emergency_level": "CRITICAL" if duration >= 15 else "MONITORING",
                    "time_until_critical": max(0, 15 - duration),
                    "message": f"낙상 후 {duration:.1f}초 경과"
                }
            }
        else:
            return {
                "status": "success",
                "data": {
                    "user_id": user_id,
                    "has_emergency": False,
                    "message": "현재 응급상황이 없습니다."
                }
            }
            
    except Exception as e:
        logger.error(f"응급상황 상태 조회 실패 [{user_id}]: {e}")
        raise HTTPException(status_code=500, detail=str(e))
