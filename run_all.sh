#!/bin/bash

echo "WALKERHOLIC 전체 시스템을 시작합니다..."

# 백엔드 서버 시작 (백그라운드)
echo "백엔드 서버를 시작합니다..."
cd backend
chmod +x run.sh
./run.sh &
BACKEND_PID=$!

# 잠시 대기 (백엔드 서버 시작 시간)
sleep 5

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
