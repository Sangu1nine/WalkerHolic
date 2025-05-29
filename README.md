# 🚶 WALKERHOLIC - AI 기반 보행 분석 시스템

AI 기반 보행 분석 및 건강 모니터링 시스템으로, 라즈베리파이와 IMU 센서를 활용한 실시간 낙상 감지 및 보행 패턴 분석을 제공합니다.

## 📋 목차
- [시스템 개요](#시스템-개요)
- [빠른 시작](#빠른-시작)
- [프로젝트 구조](#프로젝트-구조)
- [설치 가이드](#설치-가이드)
- [사용법](#사용법)
- [라즈베리파이 설정](#라즈베리파이-설정)
- [API 문서](#api-문서)
- [트러블슈팅](#트러블슈팅)

## 🎯 시스템 개요

### 주요 기능
- **🚶‍♂️ 실시간 보행 분석**: IMU 센서 기반 보행 패턴 분석
- **⚠️ 낙상 감지**: AI 모델을 활용한 실시간 낙상 감지
- **🧠 인지기능 테스트**: 기억력, 주의력, 실행기능 평가
- **📊 건강 모니터링**: 종합적인 건강 상태 추적
- **💬 AI 챗봇**: 음성 인식/합성 지원 상담 서비스
- **📱 웹 대시보드**: 실시간 모니터링 및 데이터 시각화

### 시스템 아키텍처
```
라즈베리파이 (센서) → WebSocket → 백엔드 서버 → 프론트엔드
     ↓                    ↓           ↓
  IMU 센서           실시간 처리    웹 대시보드
  낙상 감지           AI 분석      데이터 시각화
```

## 🚀 빠른 시작

### 1단계: 시스템 설치
```bash
# 저장소 클론
git clone <repository-url>
cd WalkerHolic

# 자동 설치 실행
chmod +x setup.sh
./setup.sh
```

### 2단계: 환경 설정
```bash
# 환경변수 설정
cd backend
nano .env  # API 키와 설정값 입력
```

### 3단계: 시스템 실행
```bash
# 전체 시스템 시작
./run_all.sh

# 또는 워킹 전용 모드
./run_all.sh --walking
```

### 4단계: 접속
- **웹 대시보드**: http://localhost:3000
- **백엔드 API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs

## 📁 프로젝트 구조

```
WalkerHolic/
├── 📄 README.md                    # 프로젝트 설명서
├── 🔧 setup.sh                     # 자동 설치 스크립트
├── 🍓 raspberry_setup.sh           # 라즈베리파이 설치 스크립트
├── 🚀 run_all.sh                   # 전체 시스템 실행
├── 🍓 Raspberry_Complete.py        # 라즈베리파이 클라이언트 (메인)
├── 📊 sampling_rate_changes_10hz.txt
├── 🔄 reset.sh                     # 시스템 리셋
├── ⚙️ auto.sh                      # 자동화 스크립트
│
├── 🖥️ backend/                     # 백엔드 서버
│   ├── 📱 app/                     # FastAPI 애플리케이션
│   │   ├── 🔌 api/                # API 라우터
│   │   ├── 🔧 core/               # 핵심 기능 (WebSocket 등)
│   │   └── 🚀 main.py             # 메인 애플리케이션
│   ├── 🤖 agents/                  # LangGraph 에이전트
│   ├── 🛠️ tools/                   # 분석 도구
│   ├── 📊 models/                  # 데이터 모델
│   ├── 🗄️ database/               # Supabase 클라이언트
│   ├── ⚙️ config/                  # 설정 파일
│   ├── 📦 requirements.txt         # Python 의존성
│   └── 🚀 run.sh                   # 백엔드 실행 스크립트
│
├── 🎨 frontend/                    # React 프론트엔드
│   ├── 📱 src/
│   │   ├── 🧩 components/         # React 컴포넌트
│   │   ├── 📄 pages/              # 페이지 컴포넌트
│   │   ├── 🔌 services/           # API 서비스
│   │   └── 🎣 hooks/              # 커스텀 훅
│   ├── 📦 package.json            # Node.js 의존성
│   └── 🚀 run.sh                  # 프론트엔드 실행 스크립트
│
└── 📚 docs/                       # 문서
    ├── 📖 project_structure.md
    └── 📋 API_DOCUMENTATION.md
```

## 🛠️ 설치 가이드

### 시스템 요구사항
- **Python**: 3.8 이상
- **Node.js**: 16.x 이상
- **운영체제**: Linux, macOS, Windows
- **메모리**: 최소 4GB RAM
- **저장공간**: 최소 2GB

### 서버 설치

#### 자동 설치 (권장)
```bash
chmod +x setup.sh
./setup.sh
```

#### 수동 설치
```bash
# 백엔드 설정
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 프론트엔드 설정
cd ../frontend
npm install

# 환경변수 설정
cd ../backend
cp .env.example .env
nano .env  # 설정값 입력
```

### 환경변수 설정
`backend/.env` 파일에 다음 설정을 입력하세요:

```env
# OpenAI API 설정
OPENAI_API_KEY=your_openai_api_key_here

# Supabase 설정
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# 서버 설정
HOST=0.0.0.0
PORT=8000
DEBUG=false

# 라즈베리파이 설정
RASPBERRY_PI_IP=192.168.0.177
WEBSOCKET_PORT=8000
```

## 🍓 라즈베리파이 설정

### 하드웨어 요구사항
- **라즈베리파이**: 4B 이상 권장
- **센서**: MPU6050 IMU 센서
- **메모리카드**: 32GB 이상 Class 10
- **전원**: 5V 3A 어댑터

### 센서 연결
```
MPU6050 → 라즈베리파이
VCC     → 3.3V (Pin 1)
GND     → GND (Pin 6)
SDA     → GPIO 2 (Pin 3)
SCL     → GPIO 3 (Pin 5)
```

### 라즈베리파이 설치
```bash
# 라즈베리파이에서 실행
wget https://raw.githubusercontent.com/your-repo/WalkerHolic/main/raspberry_setup.sh
chmod +x raspberry_setup.sh
./raspberry_setup.sh
```

### 라즈베리파이 실행
```bash
# 설정 파일 수정
nano raspberry_config.py  # 서버 IP 주소 변경

# 클라이언트 실행
./run_raspberry.sh
```

## 🎮 사용법

### 기본 실행
```bash
# 전체 시스템 시작 (웹 대시보드 포함)
./run_all.sh

# 워킹 전용 모드 (백엔드만)
./run_all.sh --walking
```

### 개별 실행
```bash
# 백엔드만 실행
cd backend && ./run.sh

# 프론트엔드만 실행
cd frontend && ./run.sh
```

### 시스템 종료
```bash
# Ctrl+C로 종료하거나
pkill -f "python.*main.py"
pkill -f "npm.*start"
```

## 🔌 API 문서

### WebSocket 엔드포인트
- `ws://localhost:8000/ws/{user_id}` - 실시간 데이터 스트림

### REST API 엔드포인트
- `POST /api/imu-data` - IMU 센서 데이터 수신
- `POST /api/embedding-data` - 임베딩 데이터 처리
- `POST /api/cognitive-test` - 인지기능 테스트 실행
- `POST /api/fall-risk-test` - 낙상 위험도 테스트 실행
- `GET /api/user/{user_id}/health-info` - 사용자 건강정보 조회
- `POST /api/chat` - 챗봇 대화

자세한 API 문서는 http://localhost:8000/docs 에서 확인하세요.

## 🔧 트러블슈팅

### 일반적인 문제

#### 백엔드 서버 연결 실패
```bash
# 포트 사용 확인
netstat -tulpn | grep :8000

# 가상환경 활성화 확인
which python
```

#### 프론트엔드 빌드 오류
```bash
# Node.js 버전 확인
node --version  # 16.x 이상 필요

# 캐시 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

#### 라즈베리파이 센서 연결 오류
```bash
# I2C 활성화 확인
sudo raspi-config

# 센서 감지 확인
i2cdetect -y 1

# 권한 확인
sudo usermod -a -G i2c $USER
```

### 로그 확인
```bash
# 백엔드 로그
tail -f backend/logs/app.log

# 라즈베리파이 로그
tail -f logs/raspberry_client.log
```

## 🚀 배포 가이드

### 개발 환경
```bash
./run_all.sh
```

### 운영 환경
```bash
# 백엔드 배포
cd backend
gunicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# 프론트엔드 빌드
cd frontend
npm run build
# 빌드된 파일을 웹서버에 배포
```

### Docker 배포 (선택사항)
```bash
# Dockerfile 생성 후
docker build -t walkerholic .
docker run -p 8000:8000 -p 3000:3000 walkerholic
```

## 📊 성능 최적화

### 백엔드 최적화
- 데이터베이스 쿼리 최적화
- 캐싱 전략 구현
- 비동기 처리 활용

### 프론트엔드 최적화
- React.memo를 이용한 컴포넌트 최적화
- 코드 스플리팅 적용
- 이미지 최적화

### 라즈베리파이 최적화
- 메모리 사용량 최소화
- CPU 부하 감소
- 배터리 수명 연장

## 🔒 보안 고려사항

### 인증 및 권한
- JWT 토큰 기반 인증 (현재 Demo 모드)
- API 엔드포인트 접근 제어
- Supabase RLS 정책 적용

### 데이터 보호
- HTTPS 사용 (운영 환경)
- 개인정보 암호화
- 로그 데이터 보안

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/new-feature`)
3. 변경사항을 커밋합니다 (`git commit -am 'Add new feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/new-feature`)
5. Pull Request를 생성합니다

## 📞 지원

문제가 발생하거나 질문이 있으시면 GitHub Issues를 통해 문의해주세요.

## 📚 추가 문서

- [프로젝트 구조 상세](docs/project_structure.md)
- [API 문서](docs/API_DOCUMENTATION.md)
- [라즈베리파이 통합 가이드](backend/RASPBERRY_PI_INTEGRATION_GUIDE.md)

## ⚠️ 중요 안내사항

### 의료용 기기 아님
이 시스템은 의료용 기기가 아닙니다. 건강 관련 결정을 내리기 전에 반드시 의료 전문가와 상담하시기 바랍니다.

### 줄바꿈 정책
- 모든 텍스트 파일은 LF로 저장됩니다
- 에디터에서 CRLF로 저장해도 커밋 시 LF로 변환됩니다
- 줄바꿈 관련 문제는 `git add --renormalize .`로 해결하세요

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

**작성일**: 2025-01-27  
**버전**: 2.0  
**작성자**: WALKERHOLIC Team

---

## 🎯 빠른 참조

### 주요 명령어
```bash
# 설치
./setup.sh

# 실행
./run_all.sh

# 워킹 모드
./run_all.sh --walking

# 라즈베리파이
./run_raspberry.sh
```

### 주요 포트
- **백엔드**: 8000
- **프론트엔드**: 3000
- **WebSocket**: 8000

### 주요 파일
- **서버 설정**: `backend/.env`
- **라즈베리파이 코드**: `Raspberry_Complete.py`
- **라즈베리파이 설정**: `raspberry_config.py`
