# 라즈베리파이 낙상 감지 시스템 통합 가이드

## 개요
이 문서는 MPU6050 센서를 사용하는 라즈베리파이 낙상 감지 시스템을 백엔드 서버와 통합하는 방법을 설명합니다.

## 🔄 변경사항 요약

### 1. TIMESTAMPTZ 지원
- **기존**: Unix timestamp (float)로 시간 정보 전송
- **개선**: Asia/Seoul 시간대의 ISO 8601 형식 (TIMESTAMPTZ 호환)
- **예시**: `2025-05-29T15:30:00+09:00`

### 2. 데이터 구조 개선
- **기존**: 단순한 센서 데이터
- **개선**: 타입별 구조화된 데이터 패키지

### 3. 데이터베이스 스키마 호환성
- IMU 데이터 → `imu_data` 테이블
- 낙상 감지 → `fall_data` 테이블

## 📁 파일 구조

```
gait-analysis-app/backend/
├── Raspberry_with_realtime_transmission_websocket_updated.py  # 업데이트된 라즈베리파이 코드
├── database/
│   ├── migration_timestamp_to_timestamptz.sql               # 마이그레이션 스크립트
│   ├── rollback_timestamptz_to_timestamp.sql               # 롤백 스크립트
│   ├── timezone_verification.sql                           # 시간대 검증 스크립트
│   └── migration_guide.md                                  # 마이그레이션 가이드
└── app/core/websocket_manager.py                           # 업데이트된 WebSocket 매니저
```

## 🚀 설정 및 실행

### 1. 데이터베이스 마이그레이션

```bash
# 1. 데이터베이스 백업 (필수!)
pg_dump -h [호스트] -U [사용자명] -d [데이터베이스명] > backup_before_migration.sql

# 2. 마이그레이션 실행
psql -h [호스트] -U [사용자명] -d [데이터베이스명] -f database/migration_timestamp_to_timestamptz.sql

# 3. 검증
psql -h [호스트] -U [사용자명] -d [데이터베이스명] -f database/timezone_verification.sql
```

### 2. 라즈베리파이 설정

```bash
# 라즈베리파이에서 실행
cd /path/to/your/project
python Raspberry_with_realtime_transmission_websocket_updated.py
```

### 3. 서버 설정 확인

```python
# WebSocket 서버 IP 설정 (라즈베리파이 코드에서)
WEBSOCKET_SERVER_IP = '192.168.0.177'  # 실제 서버 IP로 변경
WEBSOCKET_SERVER_PORT = 8000
USER_ID = "raspberry_pi_01"  # 고유 사용자 ID
```

## 📊 데이터 형식

### IMU 센서 데이터
```json
{
    "type": "imu_data",
    "data": {
        "user_id": "raspberry_pi_01",
        "timestamp": "2025-05-29T15:30:00.123456+09:00",
        "acc_x": 0.123,
        "acc_y": -0.456,
        "acc_z": 0.789,
        "gyr_x": 1.234,
        "gyr_y": -2.345,
        "gyr_z": 3.456
    }
}
```

### 낙상 감지 데이터
```json
{
    "type": "fall_detection",
    "data": {
        "user_id": "raspberry_pi_01",
        "timestamp": "2025-05-29T15:30:00.123456+09:00",
        "fall_detected": true,
        "confidence_score": 0.85,
        "sensor_data": {
            "acceleration": {
                "x": 0.123,
                "y": -0.456,
                "z": 0.789
            },
            "gyroscope": {
                "x": 1.234,
                "y": -2.345,
                "z": 3.456
            },
            "timestamp": "2025-05-29T15:30:00.123456+09:00"
        }
    }
}
```

## 🔧 주요 변경사항

### 1. 시간대 처리
```python
# Asia/Seoul 시간대 설정
KST = timezone(timedelta(hours=9))

def get_current_timestamp():
    """현재 시간을 Asia/Seoul 시간대의 ISO 8601 형식으로 반환"""
    return datetime.now(KST).isoformat()
```

### 2. 데이터 패키징
```python
# IMU 데이터 패키징
def create_imu_data_package(sensor_data, user_id):
    return {
        'type': 'imu_data',
        'data': {
            'user_id': user_id,
            'timestamp': get_current_timestamp(),
            'acc_x': float(sensor_data[0]),
            # ... 기타 센서 데이터
        }
    }
```

### 3. WebSocket 핸들러 개선
```python
async def handle_received_data(self, data: str, user_id: str):
    """라즈베리파이에서 수신된 데이터 처리"""
    parsed_data = json.loads(data)
    data_type = parsed_data.get('type', 'unknown')
    
    if data_type == 'imu_data':
        await self.handle_imu_data(data_content, user_id)
    elif data_type == 'fall_detection':
        await self.handle_fall_detection(data_content, user_id)
```

## 🛠️ 호환성

### 레거시 데이터 지원
기존 형식의 데이터도 자동으로 변환하여 처리합니다:

```python
async def handle_legacy_data(self, data: dict, user_id: str):
    """이전 형식 데이터 호환성 처리"""
    # Unix timestamp → ISO 8601 (KST) 변환
    # 기존 accel/gyro 구조 → 새로운 구조 변환
```

## 📈 모니터링

### 1. 실시간 로그 확인
```bash
# 라즈베리파이 로그
Current time (KST): 2025-05-29T15:30:00.123456+09:00
WebSocket transmission status: Connected (queue length: 5)

# 서버 로그
사용자 raspberry_pi_01의 IMU 데이터 처리 완료
사용자 raspberry_pi_01 낙상 감지됨! 신뢰도: 85.00%
```

### 2. 데이터베이스 확인
```sql
-- 최근 IMU 데이터 확인
SELECT user_id, timestamp, acc_x, acc_y, acc_z 
FROM imu_data 
WHERE user_id = 'raspberry_pi_01' 
ORDER BY timestamp DESC 
LIMIT 10;

-- 낙상 감지 기록 확인
SELECT user_id, timestamp, confidence_score 
FROM fall_data 
WHERE fall_detected = true 
ORDER BY timestamp DESC;
```

## 🚨 알림 시스템

### 낙상 감지 시 알림
```json
{
    "type": "fall_alert",
    "data": {
        "user_id": "raspberry_pi_01",
        "timestamp": "2025-05-29T15:30:00.123456+09:00",
        "confidence_score": 0.85,
        "message": "사용자 raspberry_pi_01에게 낙상이 감지되었습니다!",
        "urgency": "high"
    }
}
```

## 🔍 트러블슈팅

### 1. WebSocket 연결 문제
```bash
# IP 주소 확인
ip addr show

# 포트 열림 상태 확인
netstat -tlnp | grep 8000
```

### 2. 시간대 문제
```sql
-- 데이터베이스 시간대 확인
SHOW timezone;

-- 샘플 데이터 시간대 확인
SELECT created_at, created_at AT TIME ZONE 'UTC', created_at AT TIME ZONE 'Asia/Seoul' 
FROM imu_data LIMIT 5;
```

### 3. 센서 데이터 문제
```python
# 센서 연결 확인
try:
    sensor = MPU6050Sensor()
    print("센서 초기화 성공")
except Exception as e:
    print(f"센서 초기화 실패: {e}")
```

## ✅ 성공 확인 체크리스트

- [ ] 데이터베이스 마이그레이션 완료
- [ ] 라즈베리파이 WebSocket 연결 성공
- [ ] IMU 데이터 실시간 전송 확인
- [ ] 낙상 감지 알림 정상 작동
- [ ] 시간대 정보 올바르게 저장됨 (+09:00)
- [ ] 데이터베이스에 TIMESTAMPTZ 형식으로 저장됨

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. 네트워크 연결 상태
2. 데이터베이스 연결 상태
3. 시간대 설정
4. 센서 하드웨어 연결

상세한 로그와 함께 문의해주세요.

---

**작성일**: 2025-05-29  
**버전**: 1.0  
**작성자**: AI Assistant 