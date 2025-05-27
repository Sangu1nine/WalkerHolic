# 보행 분석 시스템

AI 기반 보행 분석 및 건강 모니터링 시스템

## 프로젝트 구조

```
gait-analysis-app/
├── backend/                    # LangServe 백엔드
│   ├── app/                   # FastAPI 애플리케이션
│   │   ├── api/              # API 라우터
│   │   ├── core/             # 핵심 기능 (WebSocket 등)
│   │   └── main.py           # 메인 애플리케이션
│   ├── agents/               # LangGraph 에이전트
│   ├── tools/                # 분석 도구
│   ├── models/               # 데이터 모델
│   ├── database/             # Supabase 클라이언트
│   ├── config/               # 설정 파일
│   └── requirements.txt      # Python 의존성
├── frontend/                  # React 프론트엔드
│   ├── src/
│   │   ├── components/       # React 컴포넌트
│   │   ├── pages/           # 페이지 컴포넌트
│   │   ├── services/        # API 서비스
│   │   └── hooks/           # 커스텀 훅
│   └── package.json         # Node.js 의존성
├── docs/                     # 문서
└── README.md                # 프로젝트 설명서
```

## 시스템 아키텍처

### 백엔드 스택
- **LangServe**: 메인 서버 프레임워크
- **LangChain/LangGraph**: AI 에이전트 및 워크플로우
- **FastAPI**: REST API 및 WebSocket
- **Supabase**: 데이터베이스 및 스토리지
- **OpenAI GPT-4o**: 대화형 AI 모델

### 프론트엔드 스택
- **React**: 사용자 인터페이스
- **React Router**: 페이지 라우팅
- **Chart.js**: 데이터 시각화
- **Axios**: HTTP 클라이언트
- **Web Speech API**: 음성 인식/합성

### 데이터 플로우
1. **데이터 수집**: 라즈베리파이 → WebSocket → Supabase
2. **데이터 처리**: 원본 데이터 → AWS Chronos → 임베딩 데이터
3. **분석**: LangGraph Agent → DTW 알고리즘 → 보행 패턴 분석
4. **시각화**: React → API → 분석 결과 표시

## 주요 기능

### 🚶‍♂️ 보행 분석
- 실시간 IMU 센서 데이터 수집
- AI 기반 보행 패턴 분석
- DTW 알고리즘을 이용한 패턴 매칭
- 건강 위험도 평가 및 권장사항 제공

### 🧠 인지기능 테스트
- 기억력, 주의력, 실행기능 평가
- 언어능력 및 시공간능력 측정
- 종합 점수 및 위험도 등급 제공
- 개인화된 인지 개선 권장사항

### ⚠️ 낙상 위험도 테스트
- 균형감각 및 보행 안정성 평가
- 근력, 반응시간, 시력 측정
- 낙상 위험도 등급 분류
- 낙상 예방 맞춤형 권장사항

### 💬 AI 챗봇
- 음성 인식/합성 지원
- 보행 데이터 기반 상담
- 개인 건강정보 연동
- 테스트 결과 기반 상담

### 📊 대시보드
- 실시간 하드웨어 상태 모니터링
- 보행 분석 히스토리
- 건강정보 관리
- 테스트 결과 시각화

## 설치 및 실행

### 전체 시스템 실행 (권장)
```bash
# 프로젝트 생성
chmod +x setup_project.sh
./setup_project.sh

# 전체 시스템 시작
chmod +x run_all.sh
./run_all.sh
```

### 개별 실행

#### 백엔드 서버
```bash
cd backend
chmod +x run.sh
./run.sh
```

#### 프론트엔드
```bash
cd frontend
chmod +x run.sh
./run.sh
```

## 환경 설정

### 1. 환경변수 설정
```bash
cd backend
cp .env.example .env
# .env 파일을 편집하여 API 키와 설정값 입력
```

### 2. Supabase 설정
1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. `backend/database/schema.sql` 파일을 실행하여 테이블 생성
3. `.env` 파일에 Supabase URL과 API 키 설정

### 3. OpenAI API 설정
1. [OpenAI](https://platform.openai.com)에서 API 키 생성
2. `.env` 파일에 `OPENAI_API_KEY` 설정

## API 엔드포인트

### WebSocket
- `ws://localhost:8000/ws/{user_id}` - 실시간 데이터 스트림

### REST API
- `POST /api/imu-data` - IMU 센서 데이터 수신
- `POST /api/embedding-data` - 임베딩 데이터 처리 (보행 분석용)
- `POST /api/cognitive-test` - 인지기능 테스트 실행
- `POST /api/fall-risk-test` - 낙상 위험도 테스트 실행
- `GET /api/user/{user_id}/health-info` - 사용자 건강정보 조회
- `GET /api/user/{user_id}/analysis-history` - 분석 히스토리 조회
- `POST /api/chat` - 챗봇 대화

## 데이터베이스 스키마

### 주요 테이블
- `users` - 사용자 기본정보
- `user_health_info` - 사용자 건강정보
- `imu_data` - IMU 센서 원본 데이터
- `embedding_data` - 임베딩된 데이터 (보행 분석용)
- `analysis_results` - 보행 분석 결과
- `cognitive_test_results` - 인지기능 테스트 결과
- `fall_risk_test_results` - 낙상 위험도 테스트 결과
- `chat_history` - 채팅 히스토리
- `gait_rag_data` - 보행 패턴 참조 데이터
- `fall_data` - 낙상 감지 데이터

## 개발 가이드

### 새로운 분석 도구 추가
1. `backend/tools/` 디렉토리에 새 도구 파일 생성
2. `BaseTool`을 상속받는 클래스 구현
3. `agents/gait_agent.py`에서 도구 등록

### 새로운 API 엔드포인트 추가
1. `backend/app/api/routes.py`에 라우터 함수 추가
2. 필요시 `models/schemas.py`에 데이터 모델 정의
3. 프론트엔드 `services/api.js`에 클라이언트 함수 추가

### 새로운 React 컴포넌트 추가
1. `frontend/src/components/` 또는 적절한 디렉토리에 컴포넌트 생성
2. CSS 파일과 함께 스타일링
3. 상위 컴포넌트에서 import 및 사용

## 트러블슈팅

### 백엔드 서버 연결 실패
- `.env` 파일의 설정값 확인
- Python 가상환경 활성화 상태 확인
- 포트 8000이 사용 중인지 확인

### 프론트엔드 빌드 오류
- Node.js 버전 확인 (권장: 16.x 이상)
- `npm install` 재실행
- 캐시 삭제: `npm cache clean --force`

### Chart.js 관련 오류
- **"arc" is not a registered element 오류**:
  - Chart.js 컴포넌트가 올바르게 등록되었는지 확인
  - `ArcElement` import 및 등록 확인
- **Canvas 재사용 오류**:
  - 각 차트 컴포넌트에 고유한 `key` 속성 설정
  - 컴포넌트 언마운트 시 차트 인스턴스 정리

### 테스트 기능 오류
- **인지기능 테스트 실패**:
  - 백엔드 서버 상태 확인
  - API 엔드포인트 `/api/cognitive-test` 접근 가능 여부 확인
- **낙상 위험도 테스트 실패**:
  - 백엔드 서버 상태 확인
  - API 엔드포인트 `/api/fall-risk-test` 접근 가능 여부 확인
- **테스트 결과 표시 오류**:
  - 브라우저 콘솔에서 JavaScript 오류 확인
  - 테스트 결과 데이터 구조 확인

### WebSocket 연결 오류
- 백엔드 서버가 실행 중인지 확인
- 방화벽 설정 확인
- 브라우저 개발자 도구에서 네트워크 탭 확인

### Supabase 연결 오류
- Supabase 프로젝트 URL과 API 키 확인
- 데이터베이스 스키마가 올바르게 생성되었는지 확인
- RLS(Row Level Security) 정책 확인

## 성능 최적화

### 백엔드
- 데이터베이스 쿼리 최적화
- 캐싱 전략 구현
- 비동기 처리 활용

### 프론트엔드
- React.memo를 이용한 컴포넌트 최적화
- 이미지 및 리소스 최적화
- 코드 스플리팅 적용

## 보안 고려사항

### 인증 및 권한
- JWT 토큰 기반 인증 구현 (현재 Demo 모드)
- API 엔드포인트 접근 제어
- Supabase RLS 정책 적용

### 데이터 보호
- HTTPS 사용 (운영 환경)
- 개인정보 암호화
- 로그 데이터 보안

## 배포 가이드

### 로컬 개발 환경
```bash
# 개발 모드로 실행
./run_all.sh
```

### 운영 환경 배포
```bash
# 백엔드 빌드
cd backend
pip install -r requirements.txt
gunicorn app.main:app --host 0.0.0.0 --port 8000

# 프론트엔드 빌드
cd frontend
npm run build
# 빌드된 파일을 웹서버에 배포
```

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 기여하기

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/new-feature`)
3. 변경사항을 커밋합니다 (`git commit -am 'Add new feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/new-feature`)
5. Pull Request를 생성합니다

## 지원

문제가 발생하거나 질문이 있으시면 GitHub Issues를 통해 문의해주세요.

## 문서

- [프로젝트 구조](docs/project_structure.md) - 상세한 파일 구조 및 설명
- [API 문서](docs/API_DOCUMENTATION.md) - REST API 및 WebSocket API 가이드

---

**주의사항**: 이 시스템은 의료용 기기가 아닙니다. 건강 관련 결정을 내리기 전에 반드시 의료 전문가와 상담하시기 바랍니다.
