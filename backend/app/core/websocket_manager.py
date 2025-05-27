from fastapi import WebSocket
from typing import Dict, List, Any
import json
import logging
import os
import csv
import datetime
import asyncio
from database.supabase_client import supabase_client

logger = logging.getLogger(__name__)

# 데이터 폴더 경로
DATA_FOLDER = 'data_backup'

# 10Hz 데이터 처리를 위한 설정
IMU_SAMPLING_RATE = 10  # Hz
IMU_BATCH_SIZE = 5      # 5개씩 모아서 DB 저장 (0.5초 간격)
IMU_BUFFER_MAX = 50     # 최대 5초분 데이터 버퍼링

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.data_buffers: Dict[str, List[Dict[str, Any]]] = {}
        self.imu_batch_buffers: Dict[str, List[Dict[str, Any]]] = {}  # IMU 배치 처리용
        self._create_data_folders()
    
    def _create_data_folders(self):
        """데이터 백업용 폴더 생성"""
        if not os.path.exists(DATA_FOLDER):
            os.makedirs(DATA_FOLDER)
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """WebSocket 연결"""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        if user_id not in self.data_buffers:
            self.data_buffers[user_id] = []
        if user_id not in self.imu_batch_buffers:
            self.imu_batch_buffers[user_id] = []
        logger.info(f"사용자 {user_id} 연결됨 (10Hz 모드)")
    
    def disconnect(self, user_id: str):
        """WebSocket 연결 해제"""
        if user_id in self.active_connections:
            try:
                del self.active_connections[user_id]
                logger.info(f"사용자 {user_id} 연결 해제됨")
            except Exception as e:
                logger.warning(f"연결 해제 중 오류: {e}")
    
    async def handle_received_data(self, data: str, user_id: str):
        """수신된 데이터 통합 처리"""
        try:
            parsed_data = json.loads(data)
            data_type = parsed_data.get('type', 'unknown')
            
            if data_type == 'imu_data':
                await self._process_imu_data(parsed_data['data'], user_id)
            elif data_type == 'fall_detection':
                await self._process_fall_data(parsed_data['data'], user_id)
            else:
                # 레거시 데이터 처리
                await self._process_legacy_data(parsed_data, user_id)
                
        except json.JSONDecodeError as e:
            logger.error(f"JSON 파싱 실패 [{user_id}]: {e}")
        except Exception as e:
            logger.error(f"데이터 처리 실패 [{user_id}]: {e}")
    
    async def _process_imu_data(self, imu_data: dict, user_id: str):
        """IMU 데이터 처리 - 10Hz 최적화"""
        # 사용자 확인
        await self._ensure_user_exists(user_id)
        
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
                # 배치로 DB 저장
                for data in self.imu_batch_buffers[user_id]:
                    supabase_client.save_imu_data(data)
                logger.debug(f"IMU 배치 저장 완료 [{user_id}]: {len(self.imu_batch_buffers[user_id])}개")
            except Exception as e:
                logger.error(f"IMU 배치 DB 저장 실패 [{user_id}]: {e}")
            finally:
                self.imu_batch_buffers[user_id] = []
        
        # 버퍼 크기 제한
        if len(self.imu_batch_buffers[user_id]) > IMU_BUFFER_MAX:
            self.imu_batch_buffers[user_id] = self.imu_batch_buffers[user_id][-IMU_BUFFER_MAX:]
        
        # CSV 백업 (모든 데이터)
        await self._save_to_csv(imu_data, f"imu_{user_id}", user_id)
        
        # 실시간 전송 (모든 데이터)
        await self._safe_send({
            'type': 'imu_data_received',
            'data': imu_data,
            'sampling_rate': IMU_SAMPLING_RATE
        }, user_id)
    
    async def _process_fall_data(self, fall_data: dict, user_id: str):
        """낙상 데이터 처리 - 안전성 최우선"""
        logger.warning(f"🚨 낙상 감지! 사용자: {user_id}")
        
        # 사용자 확인
        await self._ensure_user_exists(user_id)
        
        # 필수 필드 보장
        if 'timestamp' not in fall_data:
            fall_data['timestamp'] = datetime.datetime.now(
                datetime.timezone(datetime.timedelta(hours=9))
            ).isoformat()
        
        fall_data.setdefault('fall_detected', True)
        fall_data.setdefault('confidence_score', 0.8)
        
        # 1순위: CSV 백업 (항상 성공)
        await self._save_to_csv(fall_data, f"fall_{user_id}", user_id)
        
        # 2순위: 데이터베이스 저장 (실패해도 진행)
        try:
            if not supabase_client.is_mock:
                supabase_client.save_fall_data(fall_data)
                logger.info(f"낙상 데이터 DB 저장 완료 [{user_id}]")
            else:
                logger.warning(f"Supabase Mock 모드 - CSV만 저장됨 [{user_id}]")
        except Exception as e:
            logger.error(f"낙상 DB 저장 실패 (CSV는 성공) [{user_id}]: {e}")
        
        # 3순위: 알림 전송
        await self._broadcast_fall_alert(fall_data, user_id)
        
        logger.warning(f"✅ 낙상 처리 완료 [{user_id}]")
    
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
                'message': f"🚨 사용자 {user_id}에게 낙상이 감지되었습니다!"
            }
        }
        
        # 모든 연결된 클라이언트에게 전송
        disconnected = []
        for uid, ws in list(self.active_connections.items()):
            try:
                if ws.client_state.name == "CONNECTED":
                    await ws.send_text(json.dumps(alert, ensure_ascii=False))
                else:
                    disconnected.append(uid)
            except Exception:
                disconnected.append(uid)
        
        # 끊어진 연결 정리
        for uid in disconnected:
            self.disconnect(uid)
    
    async def _save_to_csv(self, data: dict, file_prefix: str, user_id: str):
        """CSV 백업 저장 - 단순화"""
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
                
                # 필요한 필드만 추출
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

# WebSocketManager 인스턴스 생성
websocket_manager = WebSocketManager()