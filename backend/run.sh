#!/bin/bash

echo "🚶 WALKERHOLIC 워킹 전용 백엔드 서버를 시작합니다..."
echo "📁 사용 파일들:"
echo "   - Walking_Raspberry.py (라즈베리파이 클라이언트)"
echo "   - websocket_manager_walking.py (워킹 전용 WebSocket 매니저)"
echo "   - supabase_client_test.py (테스트 버전 DB 클라이언트)"

# 가상환경 확인
if [ ! -d "venv" ]; then
    echo "🔧 Python 가상환경을 생성합니다..."
    python -m venv venv
fi

# 가상환경 활성화 (OS에 따라 경로 조정)
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows (Git Bash, MSYS)
    echo "🪟 Windows 환경 감지 - 가상환경 활성화..."
    source venv/Scripts/activate
else
    # Linux/Mac
    echo "🐧 Linux/Mac 환경 감지 - 가상환경 활성화..."
    source venv/bin/activate
fi

# 의존성 설치
echo "📦 의존성을 설치합니다..."
pip install -r requirements.txt

# 환경변수 파일 확인
if [ ! -f ".env" ]; then
    echo "⚠️ .env 파일이 없습니다. .env.example을 복사하여 .env 파일을 만들고 설정을 완료해주세요."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "📄 .env 파일이 생성되었습니다. 설정을 완료한 후 다시 실행해주세요."
    else
        echo "❌ .env.example 파일도 없습니다. 수동으로 .env 파일을 생성해주세요."
    fi
    exit 1
fi

# 워킹 전용 파일들 존재 확인
echo "🔍 워킹 전용 파일들을 확인합니다..."

# websocket_manager_walking.py가 올바른 위치에 있는지 확인
if [ ! -f "app/core/websocket_manager_walking.py" ]; then
    echo "❌ app/core/websocket_manager_walking.py 파일을 찾을 수 없습니다."
    exit 1
else
    echo "✅ websocket_manager_walking.py 확인됨"
fi

# supabase_client_test.py가 올바른 위치에 있는지 확인
if [ ! -f "database/supabase_client_test.py" ]; then
    echo "❌ database/supabase_client_test.py 파일을 찾을 수 없습니다."
    exit 1
else
    echo "✅ supabase_client_test.py 확인됨"
fi

# Walking_Raspberry.py 확인 (라즈베리파이용이므로 선택사항)
if [ -f "../Walking_Raspberry.py" ]; then
    echo "✅ Walking_Raspberry.py 확인됨 (라즈베리파이 클라이언트)"
else
    echo "ℹ️ Walking_Raspberry.py 파일은 라즈베리파이에서 실행됩니다."
fi

# 데이터 백업 폴더 생성
if [ ! -d "data_backup" ]; then
    mkdir -p data_backup
    echo "📁 data_backup 폴더가 생성되었습니다."
fi

# 환경변수 설정 확인
echo "🔧 환경변수를 확인합니다..."
source .env 2>/dev/null || true

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "⚠️ 경고: Supabase 환경변수가 설정되지 않았습니다."
    echo "   Mock 모드로 실행됩니다. CSV 파일로만 데이터가 저장됩니다."
    echo "   실제 DB 사용을 원한다면 .env 파일에서 SUPABASE_URL과 SUPABASE_ANON_KEY를 설정하세요."
fi

# 서버 실행 전 메시지
echo ""
echo "🚀 WALKERHOLIC 워킹 전용 백엔드 서버를 시작합니다..."
echo "📊 기능:"
echo "   - 실시간 IMU 데이터 수신 및 처리"
echo "   - 낙상 감지 및 응급상황 모니터링"
echo "   - 상태 기반 데이터 전송 (일상/보행/낙상/응급)"
echo "   - WebSocket 실시간 통신"
echo "   - CSV 백업 및 DB 저장"
echo ""
echo "🌐 서버 주소: http://localhost:8000"
echo "🔌 WebSocket: ws://localhost:8000/ws/{user_id}"
echo ""

# PYTHONPATH 설정하여 모듈 import 문제 해결
export PYTHONPATH=$PYTHONPATH:$(pwd)

# 워킹 전용 서버 실행 (특별한 환경변수 설정)
export WALKING_MODE=true
export USE_WALKING_WEBSOCKET=true
export USE_TEST_SUPABASE=true

echo "🎯 워킹 모드로 서버를 시작합니다..."
python -m app.main

echo ""
echo "👋 서버가 종료되었습니다."
