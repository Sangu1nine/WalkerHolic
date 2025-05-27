#!/usr/bin/env python3
"""
낙상 데이터 저장 문제 진단 스크립트
- 환경변수, Supabase 연결, 데이터 흐름을 종합적으로 진단
- 실제 라즈베리파이와 동일한 조건으로 테스트
"""

import sys
import os
import logging
import asyncio
import websockets
import json
from datetime import datetime, timezone, timedelta

# 백엔드 경로 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 시간대 설정 (Asia/Seoul)
KST = timezone(timedelta(hours=9))

def get_current_timestamp():
    """현재 시간을 Asia/Seoul 시간대의 ISO 8601 형식으로 반환"""
    return datetime.now(KST).isoformat()

def create_fall_data_package(user_id, fall_probability, sensor_data_snapshot):
    """라즈베리파이와 동일한 낙상 데이터 패키지 생성"""
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

def test_environment():
    """환경변수 및 설정 테스트"""
    print("=" * 80)
    print("🔍 1단계: 환경변수 및 설정 진단")
    print("=" * 80)
    
    try:
        from config.settings import settings
        
        print(f"✅ Settings 모듈 로딩 성공")
        print(f"🔍 SUPABASE_URL: {settings.SUPABASE_URL[:50] if settings.SUPABASE_URL else 'None'}...")
        print(f"🔍 SUPABASE_ANON_KEY: {'설정됨' if settings.SUPABASE_ANON_KEY else 'None'}")
        
        if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
            print("✅ Supabase 환경변수 정상")
            return True
        else:
            print("❌ Supabase 환경변수 누락")
            return False
            
    except Exception as e:
        print(f"❌ 환경변수 테스트 실패: {e}")
        return False

def test_supabase_connection():
    """Supabase 연결 테스트"""
    print("\n" + "=" * 80)
    print("🔗 2단계: Supabase 연결 진단")
    print("=" * 80)
    
    try:
        from database.supabase_client import supabase_client
        
        print(f"🔍 Mock 모드: {supabase_client.is_mock}")
        print(f"🔍 클라이언트 존재: {supabase_client.client is not None}")
        
        if supabase_client.is_mock:
            print("⚠️ 현재 Mock 모드로 실행 중")
            print("⚠️ 실제 데이터베이스에 저장되지 않습니다!")
            return False
        else:
            print("✅ 실제 Supabase 연결 모드")
            return True
            
    except Exception as e:
        print(f"❌ Supabase 연결 테스트 실패: {e}")
        return False

def test_direct_fall_data_save():
    """직접 낙상 데이터 저장 테스트"""
    print("\n" + "=" * 80)
    print("💾 3단계: 직접 낙상 데이터 저장 테스트")
    print("=" * 80)
    
    try:
        from database.supabase_client import supabase_client
        
        # 테스트 낙상 데이터 생성
        test_fall_data = {
            'user_id': 'raspberry_pi_01',
            'timestamp': get_current_timestamp(),
            'fall_detected': True,
            'confidence_score': 0.95,
            'sensor_data': {
                'acceleration': {'x': 15.2, 'y': -8.1, 'z': 22.3},
                'gyroscope': {'x': 45.6, 'y': -12.8, 'z': 33.1},
                'test_mode': True
            }
        }
        
        print(f"🔄 낙상 데이터 직접 저장 시도...")
        result = supabase_client.save_fall_data(test_fall_data)
        
        print(f"📋 저장 결과:")
        print(f"   - Mock 모드: {result.get('mock', False)}")
        print(f"   - 상태: {result.get('status', 'unknown')}")
        print(f"   - 데이터: {result.get('data', 'none')}")
        
        if result.get('mock'):
            print("⚠️ Mock 모드로 저장됨 - 실제 DB에 저장되지 않음")
            return False
        else:
            print("✅ 실제 데이터베이스에 저장 성공!")
            return True
            
    except Exception as e:
        print(f"❌ 직접 저장 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_websocket_fall_data():
    """WebSocket을 통한 낙상 데이터 전송 테스트"""
    print("\n" + "=" * 80)
    print("🌐 4단계: WebSocket 낙상 데이터 전송 테스트")
    print("=" * 80)
    
    WEBSOCKET_SERVER_IP = 'localhost'
    WEBSOCKET_SERVER_PORT = 8000
    TEST_USER_ID = "raspberry_pi_01"
    
    ws_url = f"ws://{WEBSOCKET_SERVER_IP}:{WEBSOCKET_SERVER_PORT}/ws/{TEST_USER_ID}"
    
    try:
        print(f"🔄 WebSocket 연결 시도: {ws_url}")
        
        async with websockets.connect(ws_url) as websocket:
            print("✅ WebSocket 연결 성공!")
            
            # 라즈베리파이와 동일한 낙상 데이터 생성
            fall_sensor_data = [15.2, -8.1, 22.3, 45.6, -12.8, 33.1]
            fall_probability = 0.95
            
            fall_package = create_fall_data_package(TEST_USER_ID, fall_probability, fall_sensor_data)
            
            print(f"🚨 낙상 데이터 전송:")
            print(f"   - 타입: {fall_package.get('type')}")
            print(f"   - 사용자 ID: {fall_package['data'].get('user_id')}")
            print(f"   - 신뢰도: {fall_package['data'].get('confidence_score'):.2%}")
            print(f"   - 데이터 크기: {len(str(fall_package))} bytes")
            
            # 데이터 전송
            await websocket.send(json.dumps(fall_package, ensure_ascii=False))
            print("✅ 낙상 데이터 전송 완료!")
            
            # 응답 대기 (선택적)
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                print(f"📨 서버 응답: {response}")
            except asyncio.TimeoutError:
                print("⏰ 서버 응답 대기 시간 초과 (정상)")
            
            return True
            
    except Exception as e:
        print(f"❌ WebSocket 테스트 실패: {e}")
        return False

def check_database_table():
    """데이터베이스 테이블 구조 확인"""
    print("\n" + "=" * 80)
    print("🗄️ 5단계: 데이터베이스 테이블 구조 확인")
    print("=" * 80)
    
    try:
        from database.supabase_client import supabase_client
        
        if supabase_client.is_mock:
            print("⚠️ Mock 모드에서는 테이블 구조 확인 불가")
            return False
        
        # fall_data 테이블 구조 확인 (간단한 쿼리)
        try:
            result = supabase_client.client.table("fall_data").select("*").limit(1).execute()
            print("✅ fall_data 테이블 접근 가능")
            print(f"   - 테이블 존재: True")
            return True
        except Exception as table_error:
            print(f"❌ fall_data 테이블 접근 실패: {table_error}")
            return False
            
    except Exception as e:
        print(f"❌ 테이블 구조 확인 실패: {e}")
        return False

async def main():
    """메인 진단 함수"""
    print("🩺 낙상 데이터 저장 문제 종합 진단 시작")
    print("=" * 80)
    print(f"진단 시작 시간: {get_current_timestamp()}")
    
    # 진단 결과 추적
    results = {}
    
    # 1. 환경변수 테스트
    results['environment'] = test_environment()
    
    # 2. Supabase 연결 테스트
    results['supabase_connection'] = test_supabase_connection()
    
    # 3. 직접 저장 테스트
    results['direct_save'] = test_direct_fall_data_save()
    
    # 4. WebSocket 테스트
    results['websocket'] = await test_websocket_fall_data()
    
    # 5. 테이블 구조 확인
    results['database_table'] = check_database_table()
    
    # 결과 요약
    print("\n" + "=" * 80)
    print("📊 진단 결과 요약")
    print("=" * 80)
    
    for test_name, result in results.items():
        status = "✅ 정상" if result else "❌ 문제"
        print(f"{test_name.upper()}: {status}")
    
    # 문제 해결 방안 제시
    print("\n" + "=" * 80)
    print("💡 문제 해결 방안")
    print("=" * 80)
    
    if not results['environment']:
        print("🔧 환경변수 문제:")
        print("   - .env 파일 경로 확인")
        print("   - SUPABASE_URL과 SUPABASE_ANON_KEY 설정 확인")
    
    if not results['supabase_connection']:
        print("🔧 Supabase 연결 문제:")
        print("   - 인터넷 연결 확인")
        print("   - Supabase 프로젝트 상태 확인")
        print("   - API 키 유효성 확인")
    
    if not results['direct_save']:
        print("🔧 직접 저장 문제:")
        print("   - 데이터베이스 스키마 확인")
        print("   - 테이블 권한 확인")
    
    if not results['websocket']:
        print("🔧 WebSocket 문제:")
        print("   - 백엔드 서버 실행 상태 확인")
        print("   - 포트 8000 사용 가능 여부 확인")
    
    if not results['database_table']:
        print("🔧 데이터베이스 테이블 문제:")
        print("   - fall_data 테이블 존재 여부 확인")
        print("   - 테이블 스키마 확인")
    
    # 전체 성공 여부
    all_passed = all(results.values())
    
    if all_passed:
        print("\n🎉 모든 진단 통과! 낙상 데이터 저장이 정상 작동해야 합니다.")
    else:
        print(f"\n⚠️ {sum(1 for r in results.values() if not r)}개 항목에서 문제 발견")
        print("위의 해결 방안을 참고하여 문제를 해결하세요.")
    
    return all_passed

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1) 