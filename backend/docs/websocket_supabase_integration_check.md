# WebSocket ↔ Supabase 연동 점검 결과

## 📋 점검 개요

라즈베리파이에서 WebSocket을 통해 전송되는 데이터가 Supabase `fall_data` 테이블에 제대로 저장되는지 점검한 결과입니다.

## 🔍 발견된 문제점과 해결책

### ❌ 기존 문제점
1. **WebSocketManager에서 Supabase 저장 로직 누락**
   - 기존에는 CSV 파일로만 백업하고 있었음
   - Supabase 연결 코드가 없었음

2. **SupabaseClient에 fall_data 저장 메서드 누락**
   - `save_imu_data` 메서드는 있었지만 `save_fall_data` 메서드가 없었음

### ✅ 적용된 해결책

#### 1. WebSocketManager 수정
- `database.supabase_client` import 추가
- `handle_imu_data` 메서드에 Supabase 저장 로직 추가
- `handle_event` 메서드에 낙상 이벤트 Supabase 저장 로직 추가

#### 2. SupabaseClient 확장
- `save_fall_data` 메서드 추가
- fall_data 테이블에 데이터 저장 기능 구현

## 📊 데이터 흐름

```
라즈베리파이 센서 데이터
        ↓
   WebSocket 전송
        ↓
 WebSocketManager.process_data()
        ↓
handle_imu_data() / handle_event()
        ↓
    Supabase fall_data 테이블 저장
        ↓
    CSV 백업 (기존 기능 유지)
```

## 🗃️ 데이터 형식

### 센서 데이터 (라즈베리파이 → Supabase)

**라즈베리파이 전송 형식:**
```json
{
    "timestamp": 1234567890.123,
    "accel": {"x": 1.23, "y": 2.34, "z": 9.81},
    "gyro": {"x": 0.12, "y": 0.23, "z": 0.34}
}
```

**Supabase fall_data 저장 형식:**
```json
{
    "user_id": "raspberry_pi_01",
    "timestamp": "2024-01-15T10:30:45.123",
    "acc_x": 1.23,
    "acc_y": 2.34,
    "acc_z": 9.81,
    "gyr_x": 0.12,
    "gyr_y": 0.23,
    "gyr_z": 0.34,
    "event_type": "sensor_data"
}
```

### 낙상 이벤트 (라즈베리파이 → Supabase)

**라즈베리파이 전송 형식:**
```json
{
    "event": "fall_detected",
    "timestamp": 1234567890.123,
    "probability": 0.85
}
```

**Supabase fall_data 저장 형식:**
```json
{
    "user_id": "raspberry_pi_01",
    "timestamp": "2024-01-15T10:30:45.123",
    "event_type": "fall_detected",
    "acc_x": 0.85,  // 낙상 확률을 임시로 저장
    "acc_y": 0,
    "acc_z": 0,
    "gyr_x": 0,
    "gyr_y": 0,
    "gyr_z": 0
}
```

## 🔧 하이브리드 저장 시스템

### 주 저장소: Supabase
- 실시간 데이터 접근
- 웹 대시보드 연동
- 클라우드 백업

### 보조 저장소: CSV 파일
- 로컬 백업
- 오프라인 분석 지원
- 네트워크 장애 대비

## 🧪 테스트 방법

### 1. 자동 테스트 실행
```bash
cd backend/tools
python test_websocket_supabase.py
```

### 2. 라즈베리파이 시뮬레이션
```bash
cd backend/tools
python raspberry_websocket_modified.py
```

### 3. 수동 테스트
WebSocket 클라이언트로 다음 데이터 전송:
```javascript
// 센서 데이터
ws.send(JSON.stringify({
    timestamp: Date.now() / 1000,
    accel: {x: 1.0, y: 2.0, z: 9.8},
    gyro: {x: 0.1, y: 0.2, z: 0.3}
}));

// 낙상 이벤트
ws.send(JSON.stringify({
    event: 'fall_detected',
    timestamp: Date.now() / 1000,
    probability: 0.85
}));
```

## ✅ 확인 사항

### 백엔드 로그 확인
- Supabase 저장 성공 메시지
- 데이터 형식 변환 로그
- 오류 발생 시 에러 메시지

### Supabase 대시보드 확인
1. Supabase 프로젝트 접속
2. Table Editor → fall_data 테이블 확인
3. 실시간 데이터 입력 여부 확인

### 로컬 백업 확인
- `backend/data_backup/` 폴더의 CSV 파일
- `events.csv` 파일의 이벤트 로그

## 🚨 주의사항

### 1. 네트워크 장애 대응
- Supabase 연결 실패 시 CSV 백업은 계속 동작
- 에러 로깅으로 문제 상황 추적

### 2. 데이터 형식 호환성
- 다양한 클라이언트 형식 지원
- 타임스탬프 자동 생성 (누락 시)

### 3. 성능 고려사항
- 100Hz 센서 데이터의 실시간 저장
- 버퍼링을 통한 부하 분산
- 비동기 처리로 지연 최소화

## 🔄 향후 개선 사항

### 1. 테이블 구조 최적화
- `fall_probability` 컬럼 추가 (현재는 acc_x에 임시 저장)
- `metadata` JSON 컬럼 추가 (확장성)

### 2. 배치 처리 도입
- 여러 데이터를 묶어서 일괄 저장
- 네트워크 효율성 향상

### 3. 실시간 알림 시스템
- 낙상 감지 시 즉시 알림
- Supabase Realtime 활용

## 📈 모니터링

### 성능 지표
- 데이터 저장 성공률
- 응답 시간
- 에러 발생 빈도

### 알림 설정
- Supabase 연결 실패
- 대용량 데이터 처리 지연
- 디스크 공간 부족 (CSV 백업)

---

**결론**: 라즈베리파이에서 WebSocket으로 전송되는 데이터가 Supabase fall_data 테이블에 정상적으로 저장되도록 시스템이 구성되었습니다. 하이브리드 저장 방식을 통해 안정성과 접근성을 모두 확보했습니다. 