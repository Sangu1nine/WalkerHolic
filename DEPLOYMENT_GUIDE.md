# 🚀 WALKERHOLIC 배포 가이드

이 문서는 WALKERHOLIC 시스템을 다른 환경에 배포하는 방법을 설명합니다.

## 📋 목차
- [배포 방법 개요](#배포-방법-개요)
- [로컬 배포](#로컬-배포)
- [서버 배포](#서버-배포)
- [Docker 배포](#docker-배포)
- [라즈베리파이 설정](#라즈베리파이-설정)
- [환경별 설정](#환경별-설정)
- [모니터링 및 유지보수](#모니터링-및-유지보수)

## 🎯 배포 방법 개요

### 지원하는 배포 방법
1. **로컬 배포**: 개발 및 테스트용
2. **서버 배포**: 운영 환경용 (Linux 서버)
3. **Docker 배포**: 컨테이너 기반 배포
4. **클라우드 배포**: AWS, GCP, Azure 등

### 시스템 구성요소
- **백엔드 서버**: FastAPI + LangServe
- **프론트엔드**: React 웹 애플리케이션
- **라즈베리파이 클라이언트**: IMU 센서 데이터 수집
- **데이터베이스**: Supabase (또는 PostgreSQL)

## 💻 로컬 배포

### 1. 빠른 설치
```bash
# 저장소 클론
git clone https://github.com/Sangu1nine/WalkerHolic.git
cd WalkerHolic

# 자동 설치
chmod +x setup.sh
./setup.sh

# 시스템 실행
./run_all.sh
```

### 2. 수동 설치
```bash
# 백엔드 설정
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 프론트엔드 설정
cd ../frontend
npm install

# 환경변수 설정
cd ../backend
cp .env.example .env
# .env 파일 편집

# 실행
cd ..
./run_all.sh
```

### 3. 접속 확인
- 웹 대시보드: http://localhost:3000
- 백엔드 API: http://localhost:8000
- API 문서: http://localhost:8000/docs

## 🖥️ 서버 배포

### 시스템 요구사항
- **OS**: Ubuntu 20.04 LTS 이상
- **CPU**: 2 코어 이상
- **메모리**: 4GB 이상
- **저장공간**: 20GB 이상
- **네트워크**: 인터넷 연결 필수

### 1. 서버 준비
```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 패키지 설치
sudo apt install -y python3 python3-pip python3-venv nodejs npm nginx git

# Node.js 최신 버전 설치 (선택사항)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. 애플리케이션 배포
```bash
# 애플리케이션 디렉토리 생성
sudo mkdir -p /opt/walkerholic
sudo chown $USER:$USER /opt/walkerholic
cd /opt/walkerholic

# 코드 배포
git clone <repository-url> .
chmod +x setup.sh
./setup.sh
```

### 3. 환경변수 설정
```bash
cd /opt/walkerholic/backend
cp .env.example .env
nano .env
```

필수 환경변수:
```env
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=production
```

### 4. 시스템 서비스 등록
```bash
# 백엔드 서비스 파일 생성
sudo tee /etc/systemd/system/walkerholic-backend.service > /dev/null <<EOF
[Unit]
Description=WALKERHOLIC Backend Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/walkerholic/backend
Environment=PATH=/opt/walkerholic/backend/venv/bin
ExecStart=/opt/walkerholic/backend/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 서비스 활성화
sudo systemctl daemon-reload
sudo systemctl enable walkerholic-backend
sudo systemctl start walkerholic-backend
```

### 5. Nginx 설정
```bash
# Nginx 설정 파일 생성
sudo tee /etc/nginx/sites-available/walkerholic > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;  # 도메인 변경

    # 프론트엔드 (정적 파일)
    location / {
        root /opt/walkerholic/frontend/build;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # 백엔드 API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# 사이트 활성화
sudo ln -s /etc/nginx/sites-available/walkerholic /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. 프론트엔드 빌드
```bash
cd /opt/walkerholic/frontend
npm run build
```

## 🐳 Docker 배포

### 1. Docker 설치
```bash
# Docker 설치 (Ubuntu)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. 환경변수 설정
```bash
cd /path/to/walkerholic
cp backend/.env.example backend/.env
nano backend/.env
```

### 3. Docker 빌드 및 실행
```bash
# 이미지 빌드
docker-compose build

# 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

### 4. 서비스 관리
```bash
# 서비스 중지
docker-compose down

# 서비스 재시작
docker-compose restart

# 이미지 업데이트
docker-compose pull
docker-compose up -d
```

## 🍓 라즈베리파이 설정

### 1. 라즈베리파이 준비
```bash
# 라즈베리파이 OS 설치 후
sudo apt update && sudo apt upgrade -y

# 설치 스크립트 다운로드
wget https://raw.githubusercontent.com/your-repo/WalkerHolic/main/raspberry_setup.sh
chmod +x raspberry_setup.sh
./raspberry_setup.sh
```

### 2. 센서 연결
```
MPU6050 센서 연결:
VCC → 3.3V (Pin 1)
GND → GND (Pin 6)
SDA → GPIO 2 (Pin 3)
SCL → GPIO 3 (Pin 5)
```

### 3. 설정 파일 수정
```bash
nano raspberry_config.py
```

서버 IP 주소를 실제 서버 주소로 변경:
```python
WEBSOCKET_SERVER_IP = '192.168.1.100'  # 실제 서버 IP
```

### 4. 클라이언트 실행
```bash
# 수동 실행
./run_raspberry.sh

# 시스템 서비스로 등록
sudo cp walkerholic-client.service /etc/systemd/system/
sudo systemctl enable walkerholic-client
sudo systemctl start walkerholic-client
```

## ⚙️ 환경별 설정

### 개발 환경
```env
DEBUG=true
LOG_LEVEL=DEBUG
ENVIRONMENT=development
```

### 스테이징 환경
```env
DEBUG=false
LOG_LEVEL=INFO
ENVIRONMENT=staging
```

### 운영 환경
```env
DEBUG=false
LOG_LEVEL=WARNING
ENVIRONMENT=production
HTTPS_ONLY=true
```

## 📊 모니터링 및 유지보수

### 1. 로그 모니터링
```bash
# 백엔드 로그
tail -f /opt/walkerholic/backend/logs/app.log

# 시스템 서비스 로그
sudo journalctl -u walkerholic-backend -f

# Nginx 로그
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. 시스템 상태 확인
```bash
# 서비스 상태
sudo systemctl status walkerholic-backend
sudo systemctl status nginx

# 포트 사용 확인
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :80

# 디스크 사용량
df -h
```

### 3. 백업 설정
```bash
# 데이터 백업 스크립트
#!/bin/bash
BACKUP_DIR="/backup/walkerholic/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# 애플리케이션 백업
tar -czf $BACKUP_DIR/app.tar.gz /opt/walkerholic

# 데이터베이스 백업 (PostgreSQL 사용 시)
# pg_dump walkerholic > $BACKUP_DIR/database.sql

# 로그 백업
cp -r /opt/walkerholic/backend/logs $BACKUP_DIR/

echo "Backup completed: $BACKUP_DIR"
```

### 4. 업데이트 절차
```bash
# 1. 백업 생성
./backup.sh

# 2. 서비스 중지
sudo systemctl stop walkerholic-backend

# 3. 코드 업데이트
cd /opt/walkerholic
git pull origin main

# 4. 의존성 업데이트
cd backend
source venv/bin/activate
pip install -r requirements.txt

cd ../frontend
npm install
npm run build

# 5. 서비스 재시작
sudo systemctl start walkerholic-backend
sudo systemctl restart nginx
```

## 🔒 보안 설정

### 1. 방화벽 설정
```bash
# UFW 방화벽 설정
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8000/tcp  # 개발 시에만
```

### 2. SSL 인증서 설정 (Let's Encrypt)
```bash
# Certbot 설치
sudo apt install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d your-domain.com

# 자동 갱신 설정
sudo crontab -e
# 다음 줄 추가: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. 환경변수 보안
```bash
# .env 파일 권한 설정
chmod 600 backend/.env
chown $USER:$USER backend/.env
```

## 🚨 트러블슈팅

### 일반적인 문제

#### 서비스 시작 실패
```bash
# 로그 확인
sudo journalctl -u walkerholic-backend -n 50

# 포트 충돌 확인
sudo lsof -i :8000

# 권한 확인
ls -la /opt/walkerholic
```

#### 라즈베리파이 연결 실패
```bash
# 네트워크 연결 확인
ping server-ip

# 센서 연결 확인
i2cdetect -y 1

# 방화벽 확인
sudo ufw status
```

#### 성능 문제
```bash
# 시스템 리소스 확인
htop
df -h
free -h

# 프로세스 확인
ps aux | grep python
ps aux | grep node
```

## 📞 지원

배포 관련 문제가 발생하면:
1. 로그 파일 확인
2. GitHub Issues에 문의
3. 시스템 상태 정보 첨부

---

**작성일**: 2025-01-27  
**버전**: 1.0  
**작성자**: WALKERHOLIC Team 