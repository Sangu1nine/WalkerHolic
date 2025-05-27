#!/bin/bash

echo "WALKERHOLIC 백엔드 서버를 빠르게 시작합니다..."

# 가상환경 활성화 (OS에 따라 경로 조정)
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows (Git Bash, MSYS)
    source venv/Scripts/activate
else
    # Linux/Mac
    source venv/bin/activate
fi

# 환경변수 파일 확인
if [ ! -f ".env" ]; then
    echo ".env 파일이 없습니다. .env.example을 복사하여 .env 파일을 만들고 설정을 완료해주세요."
    cp .env.example .env
    echo ".env 파일을 수정한 후 다시 실행해주세요."
    exit 1
fi

# 서버 실행
echo "WALKERHOLIC 백엔드 서버를 시작합니다..."
# PYTHONPATH 설정하여 모듈 import 문제 해결
export PYTHONPATH=$PYTHONPATH:$(pwd)
python -m app.main 