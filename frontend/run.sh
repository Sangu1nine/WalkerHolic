#!/bin/bash

echo "WALKERHOLIC 프론트엔드를 시작합니다..."

# Node.js 의존성 설치
if [ ! -d "node_modules" ]; then
    echo "Node.js 의존성을 설치합니다..."
    npm install
fi

# React 개발서버 시작
echo "React 개발 서버를 시작합니다..."
npm start
