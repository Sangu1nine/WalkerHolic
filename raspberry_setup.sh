#!/bin/bash

echo "🍓 WALKERHOLIC 라즈베리파이 클라이언트 설치를 시작합니다..."
echo "============================================================"

# 시스템 업데이트
echo "📦 시스템 패키지를 업데이트합니다..."
sudo apt update && sudo apt upgrade -y

# Python 및 필수 패키지 설치
echo "🐍 Python 및 필수 패키지를 설치합니다..."
sudo apt install -y python3 python3-pip python3-venv
sudo apt install -y i2c-tools python3-smbus

# I2C 활성화
echo "🔧 I2C를 활성화합니다..."
sudo raspi-config nonint do_i2c 0

# Python 가상환경 생성
echo "📦 Python 가상환경을 생성합니다..."
python3 -m venv raspberry_env
source raspberry_env/bin/activate

# 라즈베리파이용 Python 패키지 설치
echo "📥 라즈베리파이용 Python 패키지를 설치합니다..."
pip install --upgrade pip

# 라즈베리파이용 requirements.txt 생성
cat > raspberry_requirements.txt << EOF
numpy>=1.21.0,<2.0.0
tensorflow>=2.10.0,<3.0.0
smbus2>=0.4.0
websockets>=11.0.0
asyncio-mqtt>=0.11.0
RPi.GPIO>=0.7.1
adafruit-circuitpython-mpu6050>=1.1.0
scipy>=1.9.0,<2.0.0
scikit-learn>=1.1.0,<2.0.0
pandas>=1.5.0,<2.0.0
EOF

pip install -r raspberry_requirements.txt

# 모델 및 스케일러 디렉토리 생성
echo "📁 필요한 디렉토리를 생성합니다..."
mkdir -p models
mkdir -p scalers
mkdir -p logs

# 설정 파일 생성
echo "📝 설정 파일을 생성합니다..."
cat > raspberry_config.py << EOF
"""
라즈베리파이 설정 파일
"""

# 서버 설정
WEBSOCKET_SERVER_IP = '192.168.0.177'  # 서버 IP 주소로 변경하세요
WEBSOCKET_SERVER_PORT = 8000
USER_ID = "raspberry_pi_01"

# 센서 설정
DEV_ADDR = 0x68
PWR_MGMT_1 = 0x6B
ACCEL_REGISTERS = [0x3B, 0x3D, 0x3F]
GYRO_REGISTERS = [0x43, 0x45, 0x47]
SENSITIVE_ACCEL = 16384.0
SENSITIVE_GYRO = 131.0

# 데이터 수집 설정
SAMPLING_RATE = 100  # Hz
SEND_RATE = 10       # Hz
SEQ_LENGTH = 150
STRIDE = 5

# 모델 경로
MODEL_PATH = 'models/fall_detection.tflite'
SCALERS_DIR = 'scalers'

# 로그 설정
LOG_LEVEL = 'INFO'
LOG_FILE = 'logs/raspberry_client.log'
EOF

# 실행 스크립트 생성
echo "🚀 실행 스크립트를 생성합니다..."
cat > run_raspberry.sh << 'EOF'
#!/bin/bash

echo "🍓 WALKERHOLIC 라즈베리파이 클라이언트를 시작합니다..."

# 가상환경 활성화
source raspberry_env/bin/activate

# I2C 권한 확인
if ! groups $USER | grep -q i2c; then
    echo "⚠️  I2C 권한이 없습니다. 다음 명령어를 실행하고 재부팅하세요:"
    echo "sudo usermod -a -G i2c $USER"
    echo "sudo reboot"
    exit 1
fi

# 센서 연결 확인
echo "🔍 I2C 센서를 확인합니다..."
if ! i2cdetect -y 1 | grep -q 68; then
    echo "❌ MPU6050 센서(0x68)를 찾을 수 없습니다."
    echo "   센서 연결을 확인하세요:"
    echo "   VCC -> 3.3V"
    echo "   GND -> GND"
    echo "   SDA -> GPIO 2 (Pin 3)"
    echo "   SCL -> GPIO 3 (Pin 5)"
    exit 1
fi

echo "✅ MPU6050 센서가 감지되었습니다."

# 모델 파일 확인
if [ ! -f "models/fall_detection.tflite" ]; then
    echo "⚠️  낙상 감지 모델이 없습니다."
    echo "   서버에서 모델 파일을 다운로드하거나 복사하세요."
fi

# 스케일러 파일 확인
if [ ! -d "scalers" ] || [ -z "$(ls -A scalers)" ]; then
    echo "⚠️  스케일러 파일이 없습니다."
    echo "   서버에서 스케일러 파일들을 복사하세요."
fi

# 라즈베리파이 클라이언트 실행
echo "🚀 라즈베리파이 클라이언트를 시작합니다..."
python3 Raspberry_Complete.py

EOF

chmod +x run_raspberry.sh

# 서비스 파일 생성 (선택사항)
echo "🔧 시스템 서비스 파일을 생성합니다..."
cat > walkerholic-client.service << EOF
[Unit]
Description=WALKERHOLIC Raspberry Pi Client
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=$(pwd)
ExecStart=$(pwd)/run_raspberry.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo ""
echo "✅ 라즈베리파이 설치가 완료되었습니다!"
echo "============================================================"
echo ""
echo "📋 다음 단계:"
echo "1. raspberry_config.py에서 서버 IP 주소를 수정하세요"
echo "2. 서버에서 모델 파일과 스케일러를 복사하세요:"
echo "   scp -r server_ip:/path/to/models/* ./models/"
echo "   scp -r server_ip:/path/to/scalers/* ./scalers/"
echo "3. 센서 연결을 확인하세요 (MPU6050)"
echo "4. 클라이언트를 시작하세요: ./run_raspberry.sh"
echo ""
echo "🔧 시스템 서비스로 등록하려면:"
echo "sudo cp walkerholic-client.service /etc/systemd/system/"
echo "sudo systemctl enable walkerholic-client"
echo "sudo systemctl start walkerholic-client"
echo ""
echo "📊 센서 연결 확인:"
echo "i2cdetect -y 1"
echo ""
echo "📚 자세한 사용법은 README.md를 참조하세요." 