"""
개선된 WebSocket Manager - 상태 기반 처리 단순화
- 기본 안정성은 짧은 코드 기반 유지
- 상태 추적 간소화
- 응급상황 자동 판정 추가
- 새로운 테이블 지원
"""

from fastapi import WebSocket
from typing import Dict, List, Any, Optional
import json
import logging
import os
import csv
import datetime
import asyncio
from database.supabase_client import supabase_client
from dataclasses import dataclass
from enum import Enum
import time

logger = logging.getLogger(__name__)

# 데이터 폴더 경로
DATA_FOLDER = 'data_backup'

# IMU 배치 처리 설정
IMU_SAMPLING_RATE = 10
IMU_BATCH_SIZE = 5
IMU_BUFFER_MAX = 50

class UserState(Enum):
    """사용자 상태 정의"""
    DAILY = "일상"
    WALKING = "걷기"
    FALL = "낙상"
    EMERGENCY = "응급"

@dataclass
class UserStateTracker:
    """간소화된 사용자 상태 추적기"""
    user_id: str
    current_state: UserState = UserState.DAILY
    state_start_time: float = None
    last_update_time: float = None
    fall_detected_time: float = None
    walking_session_id: int = None  # 현재 보행 세션 ID
    
    def __post_init__(self):
        current_time = time.time()
        if self.state_start_time is None:
            self.state_start_time = current_time
        if self.last_update_time is None:
            self.last_update_time = current_time
    
    def update_from_raspberry(self, state_info: dict):
        """RaspberryPi에서 온 상태 정보로 업데이트"""
        current_time = time.time()
        
        # 상태 변경 감지
        new_state_str = state_info.get('state', '일상')
        try:
            new_state = UserState(new_state_str)
        except ValueError:
            logger.warning(f"알 수 없는 상태: {new_state_str}")
            return False
        
        state_changed = False
        
        # 상태 전환 감지
        if self.current_state != new_state:
            logger.info(f"[{self.user_id}] 상태 전환: {self.current_state.value} → {new_state.value}")
            self.current_state = new_state
            self.state_start_time = current_time
            state_changed = True
            
            # 특별한 상태 전환 처리
            if new_state == UserState.FALL:
                self.fall_detected_time = current_time
        
        self.last_update_time = current_time
        return state_changed
    
    def get_state_duration(self) -> float:
        """현재 상태 지속 시간"""
        return time.time() - self.state_start_time

class ImprovedWebSocketManager:
    """개선된 WebSocket 매니저 - 안정성 우선"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.data_buffers: Dict[str, List[Dict[str, Any]]] = {}
        self.imu_batch_buffers: Dict[str, List[Dict[str, Any]]] = {}
        self.user_state_trackers: Dict[str, UserStateTracker] = {}
        self.emergency_timers: Dict[str, float] = {}  # 응급상황 타이머
        self._emergency_monitor_task = None  # 응급상황 모니터링 태스크
        self._create_data_folders()
    
    def _create_data_folders(self):
        """데이터 백업용 폴더 생성"""
        if not os.path.exists(DATA_FOLDER):
            os.makedirs(DATA_FOLDER)
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """WebSocket 연결"""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        
        # 기존 초기화
        if user_id not in self.data_buffers:
            self.data_buffers[user_id] = []
        if user_id not in self.imu_batch_buffers:
            self.imu_batch_buffers[user_id] = []
        
        # 상태 추적기 초기화
        if user_id not in self.user_state_trackers:
            self.user_state_trackers[user_id] = UserStateTracker(user_id)
        
        # 🔄 MODIFIED [2025-01-27]: 첫 연결 시 응급상황 모니터링 시작
        if self._emergency_monitor_task is None:
            try:
                self._emergency_monitor_task = asyncio.create_task(self._emergency_monitor())
                logger.info("🚨 응급상황 모니터링 시작됨")
            except Exception as e:
                logger.error(f"응급상황 모니터링 시작 실패: {e}")
        
        logger.info(f"사용자 {user_id} 연결됨")
        
        # 연결 확인 메시지 전송
        await self._safe_send({
            'type': 'connection_established',
            'data': {
                'user_id': user_id,
                'current_state': self.user_state_trackers[user_id].current_state.value,
                'message': '연결이 성공적으로 설정되었습니다.'
            }
        }, user_id)
    
    def disconnect(self, user_id: str):
        """WebSocket 연결 해제"""
        if user_id in self.active_connections:
            try:
                # 진행 중인 보행 세션 종료
                asyncio.create_task(self._end_walking_session(user_id))
                
                # 🛠️ MODIFIED [2025-01-27]: 버퍼 정리 추가 - 메모리 누수 방지
                if user_id in self.data_buffers:
                    del self.data_buffers[user_id]
                if user_id in self.imu_batch_buffers:
                    # 남은 배치 데이터 저장 시도
                    if self.imu_batch_buffers[user_id]:
                        try:
                            for data in self.imu_batch_buffers[user_id]:
                                supabase_client.save_imu_data(data)
                            logger.info(f"연결 해제 시 남은 IMU 배치 저장 완료 [{user_id}]")
                        except Exception as e:
                            logger.error(f"연결 해제 시 IMU 배치 저장 실패 [{user_id}]: {e}")
                    del self.imu_batch_buffers[user_id]
                if user_id in self.user_state_trackers:
                    del self.user_state_trackers[user_id]
                if user_id in self.emergency_timers:
                    del self.emergency_timers[user_id]
                
                del self.active_connections[user_id]
                
                # 🔄 MODIFIED [2025-01-27]: 모든 연결이 끊어지면 응급상황 모니터링 정리
                if not self.active_connections and self._emergency_monitor_task:
                    try:
                        self._emergency_monitor_task.cancel()
                        self._emergency_monitor_task = None
                        logger.info("🚨 모든 연결 해제 - 응급상황 모니터링 중지")
                    except Exception as e:
                        logger.error(f"응급상황 모니터링 중지 실패: {e}")
                
                logger.info(f"사용자 {user_id} 연결 해제됨 (모든 버퍼 정리 완료)")
            except Exception as e:
                logger.warning(f"연결 해제 중 오류: {e}")
    
    async def handle_received_data(self, data: str, user_id: str):
        """수신된 데이터 통합 처리"""
        try:
            parsed_data = json.loads(data)
            data_type = parsed_data.get('type', 'unknown')
            
            if data_type == 'imu_data':
                await self._process_imu_data(parsed_data['data'], user_id, parsed_data.get('state_info'))
            elif data_type == 'fall_detection':
                await self._process_fall_data(parsed_data['data'], user_id, parsed_data.get('state_info'))
            else:
                # 레거시 데이터 처리
                await self._process_legacy_data(parsed_data, user_id)
                
        except json.JSONDecodeError as e:
            logger.error(f"JSON 파싱 실패 [{user_id}]: {e}")
        except Exception as e:
            logger.error(f"데이터 처리 실패 [{user_id}]: {e}")
    
    async def _process_imu_data(self, imu_data: dict, user_id: str, state_info: dict = None):
        """IMU 데이터 처리 - 보행 세션 관리 포함"""
        # 사용자 확인
        await self._ensure_user_exists(user_id)
        
        # 상태 정보 업데이트
        if state_info and user_id in self.user_state_trackers:
            state_changed = self.user_state_trackers[user_id].update_from_raspberry(state_info)
            
            # 보행 시작/종료 처리
            if state_changed:
                await self._handle_state_change(user_id, state_info)
        
        # 타임스탬프 정규화
        if 'timestamp' not in imu_data:
            imu_data['timestamp'] = datetime.datetime.now(
                datetime.timezone(datetime.timedelta(hours=9))
            ).isoformat()
        
        # 배치 버퍼에 추가
        if user_id not in self.imu_batch_buffers:
            self.imu_batch_buffers[user_id] = []
        
        self.imu_batch_buffers[user_id].append(imu_data)
        
        # 배치 크기에 도달하면 DB 저장
        if len(self.imu_batch_buffers[user_id]) >= IMU_BATCH_SIZE:
            try:
                for data in self.imu_batch_buffers[user_id]:
                    supabase_client.save_imu_data(data)
                logger.debug(f"IMU 배치 저장 완료 [{user_id}]: {len(self.imu_batch_buffers[user_id])}개")
            except Exception as e:
                logger.error(f"IMU 배치 DB 저장 실패 [{user_id}]: {e}")
            finally:
                self.imu_batch_buffers[user_id] = []
        
        # CSV 백업
        await self._save_to_csv(imu_data, f"imu_{user_id}", user_id)
        
        # 응답 전송
        tracker = self.user_state_trackers.get(user_id)
        response_data = {
            'type': 'imu_data_received',
            'data': imu_data,
            'sampling_rate': IMU_SAMPLING_RATE
        }
        
        if tracker:
            response_data['user_state'] = {
                'current_state': tracker.current_state.value,
                'state_duration': tracker.get_state_duration()
            }
        
        await self._safe_send(response_data, user_id)
    
    async def _process_fall_data(self, fall_data: dict, user_id: str, state_info: dict = None):
        """낙상 데이터 처리 - 응급상황 타이머 시작"""
        logger.warning(f"🚨 낙상 감지! 사용자: {user_id}")
        
        # 상태 정보 업데이트
        if state_info and user_id in self.user_state_trackers:
            state_changed = self.user_state_trackers[user_id].update_from_raspberry(state_info)
            if state_changed:
                await self._handle_state_change(user_id, state_info)
        
        await self._ensure_user_exists(user_id)
        
        # 필수 필드 보장
        if 'timestamp' not in fall_data:
            fall_data['timestamp'] = datetime.datetime.now(
                datetime.timezone(datetime.timedelta(hours=9))
            ).isoformat()
        
        fall_data.setdefault('fall_detected', True)
        fall_data.setdefault('confidence_score', 0.8)
        
        # CSV 백업 (최우선)
        await self._save_to_csv(fall_data, f"fall_{user_id}", user_id)
        
        # 데이터베이스 저장
        try:
            if not supabase_client.is_mock:
                fall_id = supabase_client.save_fall_data(fall_data)
                logger.info(f"낙상 데이터 DB 저장 완료 [{user_id}] ID: {fall_id}")
                
                # 🆕 응급상황 타이머 시작 (15초)
                self.emergency_timers[user_id] = time.time()
                
            else:
                logger.warning(f"Supabase Mock 모드 - CSV만 저장됨 [{user_id}]")
        except Exception as e:
            logger.error(f"낙상 DB 저장 실패 [{user_id}]: {e}")
        
        # 낙상 알림 브로드캐스트
        await self._broadcast_fall_alert(fall_data, user_id)
        
        logger.warning(f"✅ 낙상 처리 완료 [{user_id}] - 응급상황 모니터링 시작")
    
    async def _handle_state_change(self, user_id: str, state_info: dict):
        """상태 변경 처리"""
        tracker = self.user_state_trackers[user_id]
        
        # 보행 세션 시작
        if tracker.current_state == UserState.WALKING and tracker.walking_session_id is None:
            await self._start_walking_session(user_id)
        
        # 보행 세션 종료
        elif tracker.current_state != UserState.WALKING and tracker.walking_session_id is not None:
            await self._end_walking_session(user_id)
        
        # 응급상황 해제
        if tracker.current_state == UserState.DAILY and user_id in self.emergency_timers:
            del self.emergency_timers[user_id]
            logger.info(f"응급상황 타이머 해제 [{user_id}]")
        
        # 상태 변경 로깅
        try:
            if not supabase_client.is_mock:
                state_data = {
                    'user_id': user_id,
                    'state': tracker.current_state.value,
                    'start_time': datetime.datetime.fromtimestamp(tracker.state_start_time),
                    'metadata': state_info
                }
                supabase_client.save_user_state(state_data)
        except Exception as e:
            logger.error(f"상태 변경 DB 저장 실패 [{user_id}]: {e}")
    
    async def _start_walking_session(self, user_id: str):
        """보행 세션 시작"""
        try:
            if not supabase_client.is_mock:
                session_data = {
                    'user_id': user_id,
                    'start_time': datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))),
                    'avg_confidence': 0.0,
                    'imu_data_count': 0
                }
                session_id = supabase_client.save_walking_session(session_data)
                self.user_state_trackers[user_id].walking_session_id = session_id
                logger.info(f"보행 세션 시작 [{user_id}] ID: {session_id}")
        except Exception as e:
            logger.error(f"보행 세션 시작 실패 [{user_id}]: {e}")
    
    async def _end_walking_session(self, user_id: str):
        """보행 세션 종료"""
        if user_id not in self.user_state_trackers:
            return
            
        tracker = self.user_state_trackers[user_id]
        if tracker.walking_session_id is None:
            return
        
        try:
            if not supabase_client.is_mock:
                current_time = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9)))
                duration = int(tracker.get_state_duration())
                
                update_data = {
                    'end_time': current_time,
                    'duration_seconds': duration
                }
                supabase_client.update_walking_session(tracker.walking_session_id, update_data)
                logger.info(f"보행 세션 종료 [{user_id}] 지속시간: {duration}초")
                
            tracker.walking_session_id = None
        except Exception as e:
            logger.error(f"보행 세션 종료 실패 [{user_id}]: {e}")
    
    async def _emergency_monitor(self):
        """🆕 응급상황 모니터링 (15초 후 자동 응급 판정)"""
        while True:
            try:
                current_time = time.time()
                emergency_users = []
                
                for user_id, fall_time in list(self.emergency_timers.items()):
                    duration = current_time - fall_time
                    
                    # 15초 경과시 응급상황 판정
                    if duration >= 15.0:
                        emergency_users.append(user_id)
                        del self.emergency_timers[user_id]
                        
                        # 응급상황 DB 저장
                        try:
                            if not supabase_client.is_mock:
                                emergency_data = {
                                    'user_id': user_id,
                                    'emergency_type': 'fall_emergency',
                                    'start_time': datetime.datetime.fromtimestamp(fall_time),
                                    'duration_seconds': int(duration)
                                }
                                emergency_id = supabase_client.save_emergency_event(emergency_data)
                                logger.warning(f"🚨 응급상황 판정! [{user_id}] ID: {emergency_id}")
                        except Exception as e:
                            logger.error(f"응급상황 DB 저장 실패 [{user_id}]: {e}")
                        
                        # 응급상황 알림 브로드캐스트
                        await self._broadcast_alert({
                            'type': 'emergency_declared',
                            'data': {
                                'user_id': user_id,
                                'message': f"🚨 응급상황! 사용자 {user_id}가 15초간 움직이지 않습니다!",
                                'duration_seconds': int(duration),
                                'emergency_level': 'CRITICAL',
                                'timestamp': datetime.datetime.now(
                                    datetime.timezone(datetime.timedelta(hours=9))
                                ).isoformat()
                            }
                        })
                
                await asyncio.sleep(5)  # 5초마다 체크
                
            except Exception as e:
                logger.error(f"응급상황 모니터링 오류: {e}")
                await asyncio.sleep(30)
    
    async def _process_legacy_data(self, data: dict, user_id: str):
        """레거시 데이터 호환성 처리"""
        # 낙상 감지 확인
        is_fall = (
            data.get('event') == 'fall_detected' or
            data.get('fall_detected') is True or
            any(key in data for key in ['fall_alert', 'emergency'])
        )
        
        if is_fall:
            # 낙상 데이터로 변환
            fall_data = {
                'user_id': user_id,
                'timestamp': datetime.datetime.now(
                    datetime.timezone(datetime.timedelta(hours=9))
                ).isoformat(),
                'fall_detected': True,
                'confidence_score': data.get('probability', data.get('confidence_score', 0.8)),
                'sensor_data': data
            }
            await self._process_fall_data(fall_data, user_id)
        elif 'accel' in data and 'gyro' in data:
            # IMU 데이터로 변환
            imu_data = {
                'user_id': user_id,
                'timestamp': datetime.datetime.now(
                    datetime.timezone(datetime.timedelta(hours=9))
                ).isoformat(),
                'acc_x': data['accel']['x'],
                'acc_y': data['accel']['y'],
                'acc_z': data['accel']['z'],
                'gyr_x': data['gyro']['x'],
                'gyr_y': data['gyro']['y'],
                'gyr_z': data['gyro']['z']
            }
            await self._process_imu_data(imu_data, user_id)
    
    async def _broadcast_fall_alert(self, fall_data: dict, user_id: str):
        """낙상 알림 브로드캐스트"""
        alert = {
            'type': 'fall_alert',
            'data': {
                'user_id': user_id,
                'timestamp': fall_data.get('timestamp'),
                'confidence_score': fall_data.get('confidence_score', 0),
                'message': f"🚨 사용자 {user_id}에게 낙상이 감지되었습니다!",
                'sensor_data': fall_data.get('sensor_data', {}),
                'emergency_level': 'HIGH'
            }
        }
        
        await self._broadcast_alert(alert)
    
    async def _broadcast_alert(self, alert: dict):
        """범용 알림 브로드캐스트"""
        if 'timestamp' not in alert.get('data', {}):
            alert['data']['timestamp'] = datetime.datetime.now(
                datetime.timezone(datetime.timedelta(hours=9))
            ).isoformat()
        
        disconnected = []
        sent_count = 0
        
        for uid, ws in list(self.active_connections.items()):
            try:
                if ws.client_state.name == "CONNECTED":
                    await ws.send_text(json.dumps(alert, ensure_ascii=False))
                    sent_count += 1
                else:
                    disconnected.append(uid)
            except Exception:
                disconnected.append(uid)
        
        # 끊어진 연결 정리
        for uid in disconnected:
            self.disconnect(uid)
        
        logger.info(f"알림 브로드캐스트: {alert['type']} - {sent_count}명에게 전송")
    
    async def _save_to_csv(self, data: dict, file_prefix: str, user_id: str):
        """CSV 백업 저장"""
        try:
            today = datetime.datetime.now().strftime("%Y%m%d")
            filename = os.path.join(DATA_FOLDER, f"{file_prefix}_{today}.csv")
            
            # 헤더 정의
            if 'acc_x' in data:  # IMU 데이터
                fieldnames = ['timestamp', 'user_id', 'acc_x', 'acc_y', 'acc_z', 'gyr_x', 'gyr_y', 'gyr_z']
            else:  # 낙상 데이터
                fieldnames = ['timestamp', 'user_id', 'fall_detected', 'confidence_score', 'sensor_data']
                if 'sensor_data' in data and not isinstance(data['sensor_data'], str):
                    data['sensor_data'] = json.dumps(data['sensor_data'], ensure_ascii=False)
            
            file_exists = os.path.exists(filename)
            with open(filename, 'a', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                if not file_exists:
                    writer.writeheader()
                
                csv_data = {k: data.get(k, '') for k in fieldnames}
                writer.writerow(csv_data)
                
        except Exception as e:
            logger.error(f"CSV 저장 실패 [{user_id}]: {e}")
    
    async def _ensure_user_exists(self, user_id: str):
        """사용자 존재 확인 및 생성"""
        try:
            existing_user = supabase_client.get_user_by_id(user_id)
            if existing_user:
                return
            
            # 사용자 자동 생성
            user_data = {
                'user_id': user_id,
                'name': f"User {user_id}" if not user_id.startswith('raspberry_pi_') else user_id.replace('_', ' ').title(),
                'email': f"{user_id}@{'device.local' if user_id.startswith('raspberry_pi_') else 'example.com'}"
            }
            
            supabase_client.create_user(user_data)
            
            # 디바이스인 경우 기본 건강 정보 생성
            if user_id.startswith('raspberry_pi_'):
                health_data = {
                    'user_id': user_id,
                    'age': 65,
                    'gender': '미지정',
                    'height': 170.0,
                    'weight': 70.0,
                    'activity_level': 'unknown',
                    'diseases': [],
                    'medications': []
                }
                supabase_client.create_user_health_info(health_data)
                
        except Exception as e:
            logger.error(f"사용자 생성 실패 [{user_id}]: {e}")
    
    async def _safe_send(self, data: dict, user_id: str):
        """안전한 메시지 전송"""
        if user_id not in self.active_connections:
            return
            
        try:
            ws = self.active_connections[user_id]
            if ws.client_state.name == "CONNECTED":
                await ws.send_text(json.dumps(data, ensure_ascii=False))
        except Exception:
            self.disconnect(user_id)
    
    # 외부 API 메서드들
    async def get_user_status(self, user_id: str) -> dict:
        """사용자 상태 조회 API"""
        if user_id not in self.user_state_trackers:
            return {'status': 'unknown', 'message': '추적 정보 없음'}
        
        tracker = self.user_state_trackers[user_id]
        status = {
            'user_id': user_id,
            'current_state': tracker.current_state.value,
            'is_connected': user_id in self.active_connections,
            'state_duration': tracker.get_state_duration(),
            'last_update': tracker.last_update_time,
            'fall_detected_time': tracker.fall_detected_time,
            'walking_session_id': tracker.walking_session_id
        }
        
        # 응급상황 체크
        if user_id in self.emergency_timers:
            status['emergency_timer'] = time.time() - self.emergency_timers[user_id]
            status['message'] = f"🚨 낙상 후 {status['emergency_timer']:.1f}초 경과"
        elif tracker.current_state == UserState.WALKING:
            status['message'] = "🚶 보행 중"
        elif tracker.current_state == UserState.FALL:
            status['message'] = "🚨 낙상 감지됨"
        else:
            status['message'] = "✅ 정상 상태"
        
        return status

# WebSocketManager 인스턴스 생성
websocket_manager = ImprovedWebSocketManager()