#!/usr/bin/env python3
"""
라즈베리파이 낙상 데이터 전송 테스트 스크립트
- 실제 라즈베리파이와 동일한 데이터 형식으로 테스트
- WebSocket을 통한 낙상 데이터 전송 시뮬레이션
- fall_data 테이블 저장 확인
"""

import asyncio
import websockets
import json
import time
from datetime import datetime, timezone, timedelta

# 테스트 설정
WEBSOCKET_SERVER_IP = 'localhost'
WEBSOCKET_SERVER_PORT = 8000
TEST_USER_ID = "raspberry_pi_01"  # 실제 라즈베리파이와 동일한 ID

# 시간대 설정 (Asia/Seoul)
KST = timezone(timedelta(hours=9))

def get_current_timestamp():
    """현재 시간을 Asia/Seoul 시간대의 ISO 8601 형식으로 반환"""
    return datetime.now(KST).isoformat()

def create_imu_data_package(sensor_data, user_id):
    """IMU 센서 데이터를 데이터베이스 스키마에 맞게 패키징 (라즈베리파이와 동일)"""
    return {
        'type': 'imu_data',
        'data': {
            'user_id': user_id,
            'timestamp': get_current_timestamp(),
            'acc_x': float(sensor_data[0]),
            'acc_y': float(sensor_data[1]),
            'acc_z': float(sensor_data[2]),
            'gyr_x': float(sensor_data[3]),
            'gyr_y': float(sensor_data[4]),
            'gyr_z': float(sensor_data[5])
        }
    }

def create_fall_data_package(user_id, fall_probability, sensor_data_snapshot):
    """낙상 감지 데이터를 데이터베이스 스키마에 맞게 패키징 (라즈베리파이와 동일)"""
    return {
        'type': 'fall_detection',
        'data': {
            'user_id': user_id,
            'timestamp': get_current_timestamp(),
            'fall_detected': True,
            'confidence_score': float(fall_probability),
            'sensor_data': {
                'acceleration': {
                    'x': float(sensor_data_snapshot[0]),
                    'y': float(sensor_data_snapshot[1]),
                    'z': float(sensor_data_snapshot[2])
                },
                'gyroscope': {
                    'x': float(sensor_data_snapshot[3]),
                    'y': float(sensor_data_snapshot[4]),
                    'z': float(sensor_data_snapshot[5])
                },
                'timestamp': get_current_timestamp()
            }
        }
    }

async def test_raspberry_pi_simulation():
    """라즈베리파이 동작 완전 시뮬레이션"""
    ws_url = f"ws://{WEBSOCKET_SERVER_IP}:{WEBSOCKET_SERVER_PORT}/ws/{TEST_USER_ID}"
    
    print("🍓 라즈베리파이 낙상 감지 시스템 시뮬레이션")
    print("=" * 60)
    print(f"연결 대상: {ws_url}")
    print(f"사용자 ID: {TEST_USER_ID}")
    print(f"현재 시간 (KST): {get_current_timestamp()}")
    
    try:
        async with websockets.connect(ws_url) as websocket:
            print("✅ WebSocket 연결 성공!")
            
            # 1단계: 정상 IMU 데이터 전송 (5초간)
            print("\n[1단계] 정상 IMU 데이터 전송 (5초간)")
            for i in range(5):
                # 정상적인 센서 데이터 시뮬레이션
                normal_sensor_data = [
                    0.1,   # acc_x (g)
                    0.05,  # acc_y (g) 
                    9.8,   # acc_z (g) - 중력
                    0.2,   # gyr_x (°/s)
                    0.1,   # gyr_y (°/s)
                    0.05   # gyr_z (°/s)
                ]
                
                imu_package = create_imu_data_package(normal_sensor_data, TEST_USER_ID)
                await websocket.send(json.dumps(imu_package, ensure_ascii=False))
                print(f"  📊 정상 IMU 데이터 전송 {i+1}/5")
                await asyncio.sleep(1)
            
            # 2단계: 낙상 감지 시뮬레이션
            print("\n[2단계] 🚨 낙상 감지 시뮬레이션")
            
            # 낙상 시 센서 데이터 (높은 가속도)
            fall_sensor_data = [
                15.2,  # acc_x (g) - 높은 가속도
                -8.1,  # acc_y (g)
                22.3,  # acc_z (g) - 충격
                45.6,  # gyr_x (°/s) - 빠른 회전
                -12.8, # gyr_y (°/s)
                33.1   # gyr_z (°/s)
            ]
            
            # 낙상 확률 (95%)
            fall_probability = 0.95
            
            # 낙상 데이터 패키지 생성
            fall_package = create_fall_data_package(TEST_USER_ID, fall_probability, fall_sensor_data)
            
            print(f"🚨 낙상 감지! 신뢰도: {fall_probability:.1%}")
            print(f"📦 전송 데이터: {json.dumps(fall_package, ensure_ascii=False, indent=2)}")
            
            # 낙상 데이터 전송
            await websocket.send(json.dumps(fall_package, ensure_ascii=False))
            print("✅ 낙상 데이터 전송 완료!")
            
            # 3단계: 낙상 후 정상 데이터 전송
            print("\n[3단계] 낙상 후 정상 데이터 전송 (3초간)")
            for i in range(3):
                # 낙상 후 정상 데이터
                recovery_sensor_data = [
                    0.05,  # acc_x (g)
                    0.02,  # acc_y (g)
                    9.8,   # acc_z (g)
                    0.1,   # gyr_x (°/s)
                    0.05,  # gyr_y (°/s)
                    0.02   # gyr_z (°/s)
                ]
                
                imu_package = create_imu_data_package(recovery_sensor_data, TEST_USER_ID)
                await websocket.send(json.dumps(imu_package, ensure_ascii=False))
                print(f"  📊 복구 IMU 데이터 전송 {i+1}/3")
                await asyncio.sleep(1)
            
            print("\n🎉 라즈베리파이 시뮬레이션 완료!")
            print("📋 결과 확인:")
            print("   1. 백엔드 로그에서 낙상 데이터 처리 확인")
            print("   2. Supabase fall_data 테이블에서 저장 확인")
            print("   3. CSV 백업 파일 생성 확인")
            
    except websockets.exceptions.ConnectionClosed:
        print("❌ WebSocket 연결이 종료되었습니다.")
    except websockets.exceptions.InvalidURI:
        print(f"❌ 잘못된 WebSocket URI: {ws_url}")
    except ConnectionRefusedError:
        print(f"❌ 연결 거부됨: {WEBSOCKET_SERVER_IP}:{WEBSOCKET_SERVER_PORT}")
        print("💡 해결 방법:")
        print("   1. 백엔드 서버가 실행 중인지 확인")
        print("   2. 포트 8000이 사용 가능한지 확인")
    except Exception as e:
        print(f"❌ 예상치 못한 오류: {e}")
        import traceback
        traceback.print_exc()

async def test_multiple_fall_scenarios():
    """다양한 낙상 시나리오 테스트"""
    print("\n" + "=" * 60)
    print("🧪 다양한 낙상 시나리오 테스트")
    print("=" * 60)
    
    scenarios = [
        {
            "name": "고신뢰도 낙상",
            "probability": 0.95,
            "sensor_data": [20.0, -15.0, 25.0, 50.0, -20.0, 40.0]
        },
        {
            "name": "중간신뢰도 낙상", 
            "probability": 0.75,
            "sensor_data": [12.0, -8.0, 18.0, 30.0, -15.0, 25.0]
        },
        {
            "name": "낮은신뢰도 낙상",
            "probability": 0.55,
            "sensor_data": [8.0, -5.0, 12.0, 20.0, -10.0, 15.0]
        }
    ]
    
    ws_url = f"ws://{WEBSOCKET_SERVER_IP}:{WEBSOCKET_SERVER_PORT}/ws/{TEST_USER_ID}"
    
    try:
        async with websockets.connect(ws_url) as websocket:
            print("✅ WebSocket 연결 성공!")
            
            for i, scenario in enumerate(scenarios, 1):
                print(f"\n[시나리오 {i}] {scenario['name']}")
                
                fall_package = create_fall_data_package(
                    TEST_USER_ID, 
                    scenario['probability'], 
                    scenario['sensor_data']
                )
                
                await websocket.send(json.dumps(fall_package, ensure_ascii=False))
                print(f"✅ {scenario['name']} 데이터 전송 완료 (신뢰도: {scenario['probability']:.1%})")
                
                await asyncio.sleep(2)  # 각 시나리오 간 대기
            
            print("\n🎉 모든 시나리오 테스트 완료!")
            
    except Exception as e:
        print(f"❌ 시나리오 테스트 실패: {e}")

async def main():
    """메인 함수"""
    print("🧪 라즈베리파이 낙상 데이터 전송 테스트")
    print(f"실행 시간: {get_current_timestamp()}")
    
    print("\n선택하세요:")
    print("1. 기본 라즈베리파이 시뮬레이션")
    print("2. 다양한 낙상 시나리오 테스트")
    print("3. 둘 다 실행")
    
    choice = input("\n선택 (1/2/3): ").strip()
    
    if choice == "1":
        await test_raspberry_pi_simulation()
    elif choice == "2":
        await test_multiple_fall_scenarios()
    elif choice == "3":
        await test_raspberry_pi_simulation()
        await test_multiple_fall_scenarios()
    else:
        print("잘못된 선택입니다. 기본 시뮬레이션을 실행합니다.")
        await test_raspberry_pi_simulation()

if __name__ == "__main__":
    asyncio.run(main()) 