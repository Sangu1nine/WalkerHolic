# 보행 분석 시스템 API 문서

이 문서는 보행 분석 시스템의 REST API 및 WebSocket API에 대한 가이드입니다.

## 개요

보행 분석 시스템의 REST API 및 WebSocket API 문서입니다.

## 기본 정보

- **Base URL**: `http://localhost:8000`
- **Content-Type**: `application/json`
- **WebSocket URL**: `ws://localhost:8000/ws/{user_id}`

## 인증

현재 Demo 모드로 운영되며, 별도의 인증이 필요하지 않습니다.
운영 환경에서는 JWT 토큰 기반 인증을 구현할 예정입니다.

## API 엔드포인트

### 1. 보행 분석 관련

#### 1.1 IMU 데이터 수신
```http
POST /api/imu-data
```

**요청 본문:**
```json
{
  "user_id": "demo_user",
  "timestamp": "2025-05-29T14:30:25Z",
  "acc_x": 0.123,
  "acc_y": 0.456,
  "acc_z": 0.789,
  "gyr_x": 0.012,
  "gyr_y": 0.034,
  "gyr_z": 0.056
}
```

**응답:**
```json
{
  "status": "success",
  "message": "IMU 데이터가 성공적으로 저장되었습니다.",
  "timestamp": "2025-05-29T14:30:25Z"
}
```

#### 1.2 임베딩 데이터 처리 (보행 분석용)
```http
POST /api/embedding-data
```

**요청 본문:**
```json
{
  "user_id": "demo_user",
  "timestamp": "2025-05-29T14:30:25Z",
  "embedding_vector": [0.1, 0.2, 0.3, 0.4, 0.5],
  "metadata": {
    "window_size": 100,
    "sampling_rate": 50
  }
}
```

**응답:**
```json
{
  "status": "success",
  "result": {
    "gait_pattern": "정상보행",
    "similarity_score": 0.85,
    "health_assessment": "낮음",
    "recommendations": [
      "규칙적인 운동을 지속하세요.",
      "균형 잡힌 식단을 유지하세요."
    ]
  },
  "timestamp": "2025-05-29T14:30:25Z"
}
```

### 2. 테스트 기능

#### 2.1 인지기능 테스트
```http
POST /api/cognitive-test?user_id={user_id}
```

**응답:**
```json
{
  "status": "success",
  "result": {
    "user_id": "demo_user",
    "test_type": "cognitive",
    "timestamp": "2025-05-29T14:30:25Z",
    "scores": {
      "memory": 85,
      "attention": 78,
      "executive": 82,
      "language": 88,
      "visuospatial": 75
    },
    "total_score": 408,
    "max_score": 500,
    "percentage": 81.6,
    "risk_level": "low",
    "recommendations": [
      "인지 능력이 양호합니다.",
      "독서와 퍼즐 게임을 통해 뇌 활동을 지속하세요.",
      "규칙적인 운동으로 뇌 건강을 유지하세요."
    ]
  }
}
```

**위험도 등급:**
- `low`: 80% 이상 (낮음)
- `medium`: 60-79% (보통)
- `high`: 60% 미만 (높음)

#### 2.2 낙상 위험도 테스트
```http
POST /api/fall-risk-test?user_id={user_id}
```

**응답:**
```json
{
  "status": "success",
  "result": {
    "user_id": "demo_user",
    "test_type": "fall_risk",
    "timestamp": "2025-05-29T14:30:25Z",
    "assessments": {
      "balance": 75,
      "gait_stability": 82,
      "muscle_strength": 78,
      "reaction_time": 70,
      "vision": 85
    },
    "overall_risk_score": 25,
    "risk_level": "low",
    "recommendations": [
      "균형 운동을 정기적으로 실시하세요.",
      "집안의 장애물을 제거하세요.",
      "적절한 조명을 유지하세요."
    ]
  }
}
```

**위험도 등급:**
- `low`: 30점 이하 (낮음)
- `medium`: 31-60점 (보통)
- `high`: 61점 이상 (높음)

### 3. 사용자 정보

#### 3.1 건강정보 조회
```http
GET /api/user/{user_id}/health-info
```

**응답:**
```json
{
  "status": "success",
  "data": {
    "user_id": "demo_user",
    "age": 65,
    "gender": "남성",
    "diseases": ["고혈압"],
    "height": 170.0,
    "weight": 68.0,
    "medications": ["혈압약"]
  }
}
```

#### 3.2 분석 히스토리 조회
```http
GET /api/user/{user_id}/analysis-history
```

**응답:**
```json
{
  "status": "success",
  "data": [
    {
      "timestamp": "2025-05-29T10:30:00",
      "gait_pattern": "정상보행",
      "similarity_score": 0.85,
      "health_assessment": "낮음"
    }
  ]
}
```

### 4. 챗봇

#### 4.1 챗봇 대화
```http
POST /api/chat
```

**요청 본문:**
```json
{
  "user_id": "demo_user",
  "message": "안녕하세요",
  "timestamp": "2025-05-29T14:30:25Z"
}
```

**응답:**
```json
{
  "status": "success",
  "response": "안녕하세요! 보행 분석 시스템입니다. 어떤 도움이 필요하신가요?",
  "timestamp": "2025-05-29T14:30:26Z"
}
```

## WebSocket API

### 연결
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/demo_user');
```

### 메시지 형식

#### 클라이언트 → 서버
```json
{
  "type": "imu_data",
  "data": {
    "timestamp": "2025-05-29T14:30:25Z",
    "acc_x": 0.123,
    "acc_y": 0.456,
    "acc_z": 0.789,
    "gyr_x": 0.012,
    "gyr_y": 0.034,
    "gyr_z": 0.056
  }
}
```

#### 서버 → 클라이언트
```json
{
  "type": "analysis_result",
  "data": {
    "gait_pattern": "정상보행",
    "similarity_score": 0.85,
    "health_assessment": "낮음",
    "timestamp": "2025-05-29T14:30:26Z"
  }
}
```

## 에러 응답

### 일반적인 에러 형식
```json
{
  "status": "error",
  "detail": "에러 메시지",
  "timestamp": "2025-05-29T14:30:25Z"
}
```

### HTTP 상태 코드
- `200`: 성공
- `400`: 잘못된 요청
- `422`: 유효하지 않은 데이터
- `500`: 서버 내부 오류

## 프론트엔드 API 클라이언트

### JavaScript 예시
```javascript
import { apiService } from './services/api';

// 인지기능 테스트 실행
const result = await apiService.runCognitiveTest('demo_user');

// 낙상 위험도 테스트 실행
const fallRisk = await apiService.runFallRiskTest('demo_user');

// 챗봇 메시지 전송
const chatResponse = await apiService.sendChatMessage({
  user_id: 'demo_user',
  message: '안녕하세요'
});
```

## 개발 가이드

### 새로운 API 엔드포인트 추가
1. `backend/app/api/routes.py`에 라우터 함수 추가
2. `backend/models/schemas.py`에 데이터 모델 정의 (필요시)
3. `frontend/src/services/api.js`에 클라이언트 함수 추가

### 테스트
```bash
# 백엔드 API 테스트
curl -X POST http://localhost:8000/api/cognitive-test?user_id=demo_user

# WebSocket 연결 테스트
wscat -c ws://localhost:8000/ws/demo_user
```

## 보안 고려사항

### 현재 구현
- Demo 모드로 인증 없음
- CORS 설정 필요시 추가

### 운영 환경 권장사항
- JWT 토큰 기반 인증
- HTTPS 사용
- API 요청 제한 (Rate Limiting)
- 입력 데이터 검증 강화 