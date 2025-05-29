#!/bin/bash

echo "🚶 WALKERHOLIC 시스템 설치를 시작합니다..."
echo "=========================================="

# 시스템 요구사항 확인
echo "📋 시스템 요구사항을 확인합니다..."

# Python 버전 확인
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3가 설치되지 않았습니다. Python 3.8 이상을 설치해주세요."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "✅ Python $PYTHON_VERSION 감지됨"

# Node.js 버전 확인
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되지 않았습니다. Node.js 16.x 이상을 설치해주세요."
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js $NODE_VERSION 감지됨"

# npm 확인
if ! command -v npm &> /dev/null; then
    echo "❌ npm이 설치되지 않았습니다."
    exit 1
fi

echo ""
echo "🔧 백엔드 환경을 설정합니다..."

# 백엔드 디렉토리로 이동
cd backend

# Python 가상환경 생성
if [ ! -d "venv" ]; then
    echo "📦 Python 가상환경을 생성합니다..."
    python3 -m venv venv
fi

# 가상환경 활성화
echo "🔄 가상환경을 활성화합니다..."
source venv/bin/activate

# Python 의존성 설치
echo "📥 Python 패키지를 설치합니다..."
pip install --upgrade pip
pip install -r requirements.txt

# .env 파일 생성 (예제)
if [ ! -f ".env" ]; then
    echo "📝 환경변수 파일(.env)을 생성합니다..."
    cat > .env << EOF
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

# 기타 설정
ENVIRONMENT=production
LOG_LEVEL=INFO
EOF
    echo "⚠️  .env 파일이 생성되었습니다. 실제 API 키와 설정값을 입력해주세요."
fi

echo ""
echo "🎨 프론트엔드 환경을 설정합니다..."

# 프론트엔드 디렉토리로 이동
cd ../frontend

# Node.js 의존성 설치
echo "📥 Node.js 패키지를 설치합니다..."
npm install

echo ""
echo "🔧 실행 스크립트 권한을 설정합니다..."

# 루트 디렉토리로 이동
cd ..

# 실행 스크립트에 실행 권한 부여
chmod +x run_all.sh
chmod +x setup.sh
chmod +x backend/run.sh
chmod +x frontend/run.sh

if [ -f "reset.sh" ]; then
    chmod +x reset.sh
fi

if [ -f "auto.sh" ]; then
    chmod +x auto.sh
fi

echo ""
echo "✅ 설치가 완료되었습니다!"
echo "=========================================="
echo ""
echo "📋 다음 단계:"
echo "1. backend/.env 파일을 편집하여 API 키와 설정값을 입력하세요"
echo "2. 시스템을 시작하려면: ./run_all.sh"
echo "3. 워킹 전용 모드: ./run_all.sh --walking"
echo ""
echo "🌐 서버 주소:"
echo "   - 백엔드: http://localhost:8000"
echo "   - 프론트엔드: http://localhost:3000"
echo ""
echo "📚 자세한 사용법은 README.md를 참조하세요."
echo ""
echo "⚠️  주의사항:"
echo "   - 라즈베리파이 코드는 Raspberry_Complete.py를 사용하세요"
echo "   - 실제 배포 시 방화벽 설정을 확인하세요"
echo "   - 의료용 기기가 아니므로 전문의와 상담 후 사용하세요" 