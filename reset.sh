#!/bin/bash

echo "==============================================="
echo "venv를 backend 폴더로 이동하는 스크립트"
echo "기존 프로젝트 구조로 복원합니다"
echo "==============================================="

# 현재 디렉토리 확인
echo "현재 작업 디렉토리: $(pwd)"

# 1. 루트의 기존 venv 삭제
echo "1. 루트의 기존 venv를 삭제합니다..."
if [ -d "venv" ]; then
    echo "루트 venv 폴더를 삭제합니다."
    rm -rf venv
    echo "✓ 루트 venv 삭제 완료"
else
    echo "루트에 venv 폴더가 없습니다."
fi

# 2. backend 폴더로 이동
echo "2. backend 폴더로 이동합니다..."
if [ -d "backend" ]; then
    cd backend
    echo "✓ backend 폴더로 이동 완료"
    echo "현재 위치: $(pwd)"
else
    echo "❌ backend 폴더를 찾을 수 없습니다."
    exit 1
fi

# 3. backend에서 새 가상환경 생성
echo "3. backend에서 새 가상환경을 생성합니다..."
python -m venv venv
if [ $? -eq 0 ]; then
    echo "✓ backend에 가상환경 생성 완료"
else
    echo "❌ 가상환경 생성 실패"
    exit 1
fi

# 4. 가상환경 활성화
echo "4. 가상환경을 활성화합니다..."
source venv/Scripts/activate
echo "✓ 가상환경 활성화 완료"

# 5. pip 업그레이드
echo "5. pip을 업그레이드합니다..."
python -m pip install --upgrade pip
echo "✓ pip 업그레이드 완료"

# 6. requirements.txt 확인 및 설치
echo "6. 의존성을 설치합니다..."
if [ -f "requirements.txt" ]; then
    echo "requirements.txt 파일을 찾았습니다."
    echo "의존성을 설치합니다..."
    pip install -r requirements.txt
    if [ $? -eq 0 ]; then
        echo "✓ 의존성 설치 완료"
    else
        echo "❌ 의존성 설치 중 오류 발생"
        echo "개별 패키지 설치를 시도합니다..."
        
        # 핵심 패키지들 개별 설치
        pip install fastapi uvicorn[standard] python-dotenv
        pip install langchain langserve[all] langgraph
        pip install openai supabase
        pip install numpy pandas scipy
        pip install dtw-python pydantic
        pip install websockets python-multipart
        pip install speechrecognition pyttsx3
    fi
else
    echo "requirements.txt 파일이 없습니다."
    echo "핵심 패키지들을 설치합니다..."
    pip install fastapi uvicorn[standard] python-dotenv
    pip install langchain langserve[all] langgraph
    pip install openai supabase
    pip install numpy pandas scipy
    pip install dtw-python pydantic
    pip install websockets python-multipart
    pip install speechrecognition pyttsx3
fi

# 7. 환경 설정 확인
echo "7. 환경 설정을 확인합니다..."
echo "Python 버전: $(python --version)"
echo "현재 위치: $(pwd)"
echo "가상환경 경로: $(which python)"

# 8. 주요 패키지 설치 확인
echo "8. 주요 패키지 설치를 확인합니다..."
python -c "import fastapi; print('✓ fastapi 설치됨')" 2>/dev/null || echo "❌ fastapi 설치 실패"
python -c "import langserve; print('✓ langserve 설치됨')" 2>/dev/null || echo "❌ langserve 설치 실패"
python -c "import openai; print('✓ openai 설치됨')" 2>/dev/null || echo "❌ openai 설치 실패"
python -c "import numpy; print('✓ numpy 설치됨')" 2>/dev/null || echo "❌ numpy 설치 실패"

# 9. .env 파일 확인
echo "9. 환경 파일을 확인합니다..."
if [ -f ".env" ]; then
    echo "✓ .env 파일이 backend 폴더에 있습니다."
else
    echo "⚠️  .env 파일을 찾을 수 없습니다."
    echo "   .env 파일을 backend 폴더에 생성해주세요."
fi

# 10. 백엔드 서버 테스트
echo "10. 백엔드 서버 시작 테스트..."
echo "잠시 서버를 시작해서 오류가 없는지 확인합니다..."
timeout 5s python -m uvicorn app.main:app --host localhost --port 8000 &>/dev/null &
sleep 2
if ps aux | grep -q "[u]vicorn"; then
    echo "✓ 백엔드 서버 시작 테스트 성공"
    pkill -f uvicorn
else
    echo "⚠️  백엔드 서버 시작에 문제가 있을 수 있습니다."
    echo "   수동으로 확인해보세요: python -m uvicorn app.main:app --host localhost --port 8000"
fi

echo ""
echo "==============================================="
echo "venv 이동이 완료되었습니다!"
echo "이제 backend 폴더에서 가상환경이 실행됩니다."
echo ""
echo "사용법:"
echo "1. cd backend"
echo "2. source venv/Scripts/activate"
echo "3. python -m uvicorn app.main:app --host localhost --port 8000"
echo ""
echo "또는 루트에서 ./run_all.sh 실행"
echo "==============================================="