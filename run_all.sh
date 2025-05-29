#!/bin/bash

echo "🚶 WALKERHOLIC 전체 시스템을 시작합니다..."

# 워킹 모드 옵션 확인
WALKING_MODE=false
if [ "$1" = "--walking" ] || [ "$1" = "-w" ]; then
    WALKING_MODE=true
    echo "🎯 워킹 전용 모드로 실행됩니다."
    echo "📁 사용 파일들:"
    echo "   - Walking_Raspberry.py (라즈베리파이 클라이언트)"
    echo "   - websocket_manager_walking.py (워킹 전용 WebSocket 매니저)"
    echo "   - supabase_client_test.py (테스트 버전 DB 클라이언트)"
else
    echo "🏠 일반 모드로 실행됩니다."
    echo "   워킹 전용 모드를 원한다면: ./run_all.sh --walking"
fi

# 백엔드 서버 시작 (백그라운드)
echo "백엔드 서버를 시작합니다..."
cd backend

# 워킹 모드에 따른 환경변수 설정
if [ "$WALKING_MODE" = true ]; then
    # 워킹 전용 파일들 존재 확인
    echo "🔍 워킹 전용 파일들을 확인합니다..."
    
    if [ ! -f "app/core/websocket_manager_walking.py" ]; then
        echo "❌ app/core/websocket_manager_walking.py 파일을 찾을 수 없습니다."
        exit 1
    else
        echo "✅ websocket_manager_walking.py 확인됨"
    fi
    
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
    
    # 워킹 전용 환경변수 설정
    export WALKING_MODE=true
    export USE_WALKING_WEBSOCKET=true
    export USE_TEST_SUPABASE=true
    
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
else
    # 일반 모드 파일들 존재 확인
    echo "🔍 일반 모드 파일들을 확인합니다..."
    
    if [ ! -f "app/core/websocket_manager.py" ]; then
        echo "❌ app/core/websocket_manager.py 파일을 찾을 수 없습니다."
        exit 1
    else
        echo "✅ websocket_manager.py 확인됨"
    fi
    
    if [ ! -f "database/supabase_client.py" ]; then
        echo "❌ database/supabase_client.py 파일을 찾을 수 없습니다."
        exit 1
    else
        echo "✅ supabase_client.py 확인됨"
    fi
    
    # 환경변수 설정 확인
    echo "🔧 환경변수를 확인합니다..."
    source .env 2>/dev/null || true
    
    if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
        echo "⚠️ 경고: Supabase 환경변수가 설정되지 않았습니다."
        echo "   실제 DB 사용을 원한다면 .env 파일에서 SUPABASE_URL과 SUPABASE_ANON_KEY를 설정하세요."
    fi
    
    # 일반 모드 환경변수 설정 (워킹 모드 비활성화)
    export WALKING_MODE=false
    export USE_WALKING_WEBSOCKET=false
    export USE_TEST_SUPABASE=false
    
    echo ""
    echo "🚀 WALKERHOLIC 일반 백엔드 서버를 시작합니다..."
    echo "📊 기능:"
    echo "   - 보행 분석 및 AI 상담"
    echo "   - 사용자 관리 및 대시보드"
    echo "   - RAG 기반 지식 검색"
    echo "   - WebSocket 실시간 통신"
    echo "   - 실제 DB 저장 및 관리"
    echo ""
    echo "🌐 서버 주소: http://localhost:8000"
    echo "🔌 WebSocket: ws://localhost:8000/ws/{user_id}"
    echo ""
fi

chmod +x run.sh
./run.sh &
BACKEND_PID=$!

# 잠시 대기 (백엔드 서버 시작 시간)
sleep 5

# 워킹 모드가 아닌 경우에만 프론트엔드 시작
if [ "$WALKING_MODE" = false ]; then
    # 프론트엔드 서버 시작
    echo "프론트엔드 서버를 시작합니다..."
    cd ../frontend
    chmod +x run.sh
    ./run.sh &
    FRONTEND_PID=$!
    
    echo "시스템이 시작되었습니다!"
    echo "백엔드 서버: http://localhost:8000"
    echo "프론트엔드: http://localhost:3000"
    echo ""
    echo "종료하려면 Ctrl+C를 누르세요."
    
    # 프로세스 종료 대기
    trap "echo '시스템을 종료합니다...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
    wait
else
    echo "워킹 전용 모드 - 백엔드만 실행됩니다."
    echo "백엔드 서버: http://localhost:8000"
    echo ""
    echo "종료하려면 Ctrl+C를 누르세요."
    
    # 프로세스 종료 대기 (백엔드만)
    trap "echo '워킹 모드 서버를 종료합니다...'; kill $BACKEND_PID; exit" INT
    wait
fi
