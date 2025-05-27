# 프로젝트 파일 구성

## 디렉토리 구조

```
gait-analysis-app/
├── README.md                           # 프로젝트 메인 문서
├── run_all.sh                         # 전체 시스템 실행 스크립트
├── docs/                              # 문서 디렉토리
│   └── project_structure.md           # 이 파일
├── backend/                           # 백엔드 서버
│   ├── requirements.txt               # Python 의존성 목록
│   ├── .env.example                   # 환경변수 예시 파일
│   ├── run.sh                         # 백엔드 실행 스크립트
│   ├── config/
│   │   └── settings.py                # 설정 관리
│   ├── database/
│   │   ├── supabase_client.py         # Supabase 클라이언트
│   │   └── schema.sql                 # 데이터베이스 스키마
│   ├── models/
│   │   └── schemas.py                 # Pydantic 데이터 모델
│   ├── tools/
│   │   └── gait_analysis.py           # 보행 분석 도구
│   ├── agents/
│   │   └── gait_agent.py              # LangGraph 에이전트
│   └── app/
│       ├── main.py                    # FastAPI 메인 애플리케이션
│       ├── core/
│       │   └── websocket_manager.py   # WebSocket 관리자
│       ├── api/
│       │   └── routes.py              # API 라우터
│       └── services/                  # 비즈니스 로직 (추후 확장)
└── frontend/                          # React 프론트엔드
    ├── package.json                   # Node.js 의존성 및 스크립트
    ├── run.sh                         # 프론트엔드 실행 스크립트
    ├── public/
    │   └── index.html                 # HTML 템플릿
    └── src/
        ├── index.js                   # React 엔트리 포인트
        ├── App.js                     # 메인 App 컴포넌트
        ├── App.css                    # 전역 스타일
        ├── index.css                  # 기본 스타일
        ├── services/
        │   ├── api.js                 # API 서비스 함수
        │   └── websocket.js           # WebSocket 서비스
        ├── hooks/                     # 커스텀 React 훅 (추후 추가)
        ├── utils/                     # 유틸리티 함수 (추후 추가)
        ├── styles/                    # 공통 스타일 (추후 추가)
        ├── components/
        │   ├── common/                # 공통 컴포넌트
        │   │   └── SpeechControls.js  # 음성 제어 컴포넌트
        │   ├── HealthInfo.js          # 건강정보 컴포넌트
        │   ├── HardwareStatus.js      # 하드웨어 상태 컴포넌트
        │   ├── analysis/
        │   │   └── AnalysisResults.js # 분석 결과 컴포넌트
        │   └── chat/                  # 채팅 관련 컴포넌트
        └── pages/
            ├── LoadingPage.js         # 로딩 페이지
            ├── LoadingPage.css        # 로딩 페이지 스타일
            ├── ChatPage.js            # 채팅 페이지
            ├── ChatPage.css           # 채팅 페이지 스타일
            ├── login/
            │   ├── LoginPage.js       # 로그인 페이지
            │   └── LoginPage.css      # 로그인 페이지 스타일
            ├── main/
            │   ├── MainPage.js        # 메인 페이지 (테스트 기능 포함)
            │   └── MainPage.css       # 메인 페이지 스타일
            ├── settings/
            │   └── SettingsPage.js    # 설정 페이지
            ├── health/
            │   ├── HealthInfoPage.js  # 건강정보 페이지
            │   └── HealthInfoPage.css # 건강정보 페이지 스타일
            ├── hardware/
            │   ├── HardwarePage.js    # 하드웨어 정보 페이지
            │   └── HardwarePage.css   # 하드웨어 페이지 스타일
            └── analysis/
                ├── AnalysisPage.js    # 보행 분석 페이지
                └── AnalysisPage.css   # 분석 페이지 스타일
```

## 주요 파일 설명

### 백엔드 파일

#### 설정 및 환경
- `backend/.env.example`: 환경변수 템플릿 (API 키, DB 연결 정보 등)
- `backend/config/settings.py`: 애플리케이션 설정 관리
- `backend/requirements.txt`: Python 패키지 의존성

#### 데이터베이스
- `backend/database/supabase_client.py`: Supabase 데이터베이스 클라이언트
- `backend/database/schema.sql`: 데이터베이스 테이블 스키마
- `backend/models/schemas.py`: API 요청/응답 데이터 모델

#### AI 및 분석
- `backend/agents/gait_agent.py`: LangGraph 기반 보행 분석 에이전트
- `backend/tools/gait_analysis.py`: DTW 알고리즘 기반 보행 분석 도구

#### API 서버
- `backend/app/main.py`: FastAPI 메인 애플리케이션
- `backend/app/api/routes.py`: REST API 및 WebSocket 라우터
  - 보행 분석 API (`/api/embedding-data`)
  - 인지기능 테스트 API (`/api/cognitive-test`)
  - 낙상 위험도 테스트 API (`/api/fall-risk-test`)
  - 챗봇 API (`/api/chat`)
- `backend/app/core/websocket_manager.py`: WebSocket 연결 관리

### 프론트엔드 파일

#### 설정 및 진입점
- `frontend/package.json`: Node.js 의존성 및 스크립트 정의
  - Chart.js 관련 패키지 포함 (`react-chartjs-2`, `chart.js`)
- `frontend/public/index.html`: HTML 템플릿
- `frontend/src/index.js`: React 애플리케이션 진입점
- `frontend/src/App.js`: 메인 App 컴포넌트 (라우팅 설정)

#### 서비스 레이어
- `frontend/src/services/api.js`: 백엔드 API 호출 함수
  - 인지기능 테스트 API (`runCognitiveTest`)
  - 낙상 위험도 테스트 API (`runFallRiskTest`)
- `frontend/src/services/websocket.js`: WebSocket 통신 관리

#### 페이지 컴포넌트
- `frontend/src/pages/LoadingPage.js`: 앱 시작 로딩 화면
- `frontend/src/pages/login/LoginPage.js`: 사용자 로그인 페이지
- `frontend/src/pages/main/MainPage.js`: 메인 대시보드 페이지
  - 인지기능 테스트 기능
  - 낙상 위험도 테스트 기능
  - 테스트 결과 시각화
- `frontend/src/pages/ChatPage.js`: AI 챗봇 대화 페이지
- `frontend/src/pages/settings/SettingsPage.js`: 앱 설정 페이지
- `frontend/src/pages/health/HealthInfoPage.js`: 건강정보 관리 페이지
  - Chart.js를 이용한 건강 데이터 시각화
- `frontend/src/pages/hardware/HardwarePage.js`: 하드웨어 정보 페이지
  - Chart.js를 이용한 하드웨어 상태 시각화
- `frontend/src/pages/analysis/AnalysisPage.js`: 보행 분석 결과 페이지
  - Chart.js를 이용한 보행 데이터 시각화

#### 재사용 컴포넌트
- `frontend/src/components/HealthInfo.js`: 사용자 건강정보 표시
- `frontend/src/components/HardwareStatus.js`: 하드웨어 연결 상태
- `frontend/src/components/analysis/AnalysisResults.js`: 보행 분석 결과
- `frontend/src/components/common/SpeechControls.js`: 음성 인식/합성 제어

#### 스타일
- `frontend/src/index.css`: 전역 기본 스타일
- `frontend/src/App.css`: 공통 컴포넌트 스타일
- 각 페이지별 CSS 파일: 해당 페이지 전용 스타일
  - 테스트 결과 표시 스타일 포함

## 새로운 테스트 기능

### 인지기능 테스트
- **위치**: `MainPage.js`의 메뉴 항목
- **API**: `POST /api/cognitive-test`
- **평가 항목**: 기억력, 주의력, 실행기능, 언어능력, 시공간능력
- **결과**: 종합 점수, 위험도 등급, 개인화된 권장사항

### 낙상 위험도 테스트
- **위치**: `MainPage.js`의 메뉴 항목
- **API**: `POST /api/fall-risk-test`
- **평가 항목**: 균형감각, 보행 안정성, 근력, 반응시간, 시력
- **결과**: 위험도 등급, 낙상 예방 권장사항

### 테스트 결과 시각화
- **컴포넌트**: `MainPage.js` 내 테스트 결과 섹션
- **기능**: 
  - 세부 점수 그리드 표시
  - 위험도별 색상 구분
  - 권장사항 목록 표시
  - 결과 닫기 기능

## Chart.js 통합

### 사용된 차트 타입
- **Line Chart**: 시간별 데이터 추이 (혈압, 신호 강도 등)
- **Bar Chart**: 배터리 상태, 보행 메트릭 등
- **Doughnut Chart**: 시스템 상태 분포, BMI 현황 등
- **Radar Chart**: 보행 패턴 분석 결과

### Chart.js 설정
- **등록된 컴포넌트**: 
  - `CategoryScale`, `LinearScale`, `PointElement`
  - `LineElement`, `BarElement`, `ArcElement`
  - `RadialLinearScale`, `Title`, `Tooltip`, `Legend`
- **고유 키 설정**: 각 차트에 고유한 `key` 속성으로 Canvas 재사용 문제 해결

echo "보행 분석 앱 프로젝트 생성이 완료되었습니다!"
echo ""
echo "다음 단계:"
echo "1. cd gait-analysis-app"
echo "2. backend/.env 파일 설정 (API 키 등)"
echo "3. Supabase 데이터베이스 설정"
echo "4. ./run_all.sh 실행"
echo ""
echo "포트 정보:"
echo "- 백엔드: http://localhost:8000"  
echo "- 프론트엔드: http://localhost:3000"
echo ""
echo "자세한 내용은 README.md를 참고하세요."
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
