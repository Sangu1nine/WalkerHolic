#!/usr/bin/env python3
"""
낙상 데이터 저장 문제 해결 테스트 스크립트
- 환경변수 로딩 확인
- Supabase 연결 테스트
- 낙상 데이터 저장 테스트
"""

import sys
import os
import logging
from datetime import datetime, timezone, timedelta

# 백엔드 경로 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_environment_variables():
    """환경변수 로딩 테스트"""
    print("=" * 60)
    print("🔍 환경변수 로딩 테스트")
    print("=" * 60)
    
    try:
        from config.settings import settings
        
        print(f"✅ Settings 모듈 로딩 성공")
        print(f"🔍 SUPABASE_URL: {settings.SUPABASE_URL[:50] if settings.SUPABASE_URL else 'None'}...")
        print(f"🔍 SUPABASE_ANON_KEY: {'설정됨' if settings.SUPABASE_ANON_KEY else 'None'}")
        
        if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
            print("✅ Supabase 환경변수 정상 로딩됨")
            return True
        else:
            print("❌ Supabase 환경변수 누락")
            return False
            
    except Exception as e:
        print(f"❌ 환경변수 로딩 실패: {e}")
        return False

def test_supabase_connection():
    """Supabase 연결 테스트"""
    print("\n" + "=" * 60)
    print("🔗 Supabase 연결 테스트")
    print("=" * 60)
    
    try:
        from database.supabase_client import supabase_client
        
        print(f"🔍 Mock 모드: {supabase_client.is_mock}")
        
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

def test_fall_data_save():
    """낙상 데이터 저장 테스트"""
    print("\n" + "=" * 60)
    print("🚨 낙상 데이터 저장 테스트")
    print("=" * 60)
    
    try:
        from database.supabase_client import supabase_client
        
        # 테스트 낙상 데이터 생성
        test_fall_data = {
            'user_id': 'test_user_fall_fix',
            'timestamp': datetime.now(timezone(timedelta(hours=9))).isoformat(),
            'fall_detected': True,
            'confidence_score': 0.95,
            'sensor_data': {
                'acceleration': {'x': 15.2, 'y': -8.1, 'z': 22.3},
                'gyroscope': {'x': 45.6, 'y': -12.8, 'z': 33.1},
                'test_mode': True
            }
        }
        
        print(f"🔄 낙상 데이터 저장 시도...")
        print(f"📊 테스트 데이터: {test_fall_data}")
        
        # 낙상 데이터 저장
        result = supabase_client.save_fall_data(test_fall_data)
        
        print(f"📋 저장 결과: {result}")
        
        if result.get('mock'):
            print("⚠️ Mock 모드로 저장됨 - 실제 DB에 저장되지 않음")
            return False
        else:
            print("✅ 실제 데이터베이스에 저장 성공!")
            return True
            
    except Exception as e:
        print(f"❌ 낙상 데이터 저장 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_user_creation():
    """사용자 자동 생성 테스트"""
    print("\n" + "=" * 60)
    print("👤 사용자 자동 생성 테스트")
    print("=" * 60)
    
    try:
        from database.supabase_client import supabase_client
        
        test_user_id = 'test_user_fall_fix'
        
        # 사용자 존재 확인
        existing_user = supabase_client.get_user_by_id(test_user_id)
        print(f"🔍 기존 사용자 확인: {existing_user}")
        
        if not existing_user:
            print(f"🔄 사용자 {test_user_id} 생성 중...")
            
            user_data = {
                'user_id': test_user_id,
                'name': 'Test User Fall Fix',
                'email': f'{test_user_id}@test.com'
            }
            
            result = supabase_client.create_user(user_data)
            print(f"📋 사용자 생성 결과: {result}")
            
            if result.get('mock'):
                print("⚠️ Mock 모드로 생성됨")
                return False
            else:
                print("✅ 실제 데이터베이스에 사용자 생성 성공!")
                return True
        else:
            print("✅ 사용자가 이미 존재함")
            return True
            
    except Exception as e:
        print(f"❌ 사용자 생성 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """메인 테스트 함수"""
    print("🧪 낙상 데이터 저장 문제 해결 테스트 시작")
    print("=" * 80)
    
    # 테스트 결과 추적
    test_results = {}
    
    # 1. 환경변수 테스트
    test_results['env'] = test_environment_variables()
    
    # 2. Supabase 연결 테스트
    test_results['connection'] = test_supabase_connection()
    
    # 3. 사용자 생성 테스트
    test_results['user'] = test_user_creation()
    
    # 4. 낙상 데이터 저장 테스트
    test_results['fall_data'] = test_fall_data_save()
    
    # 결과 요약
    print("\n" + "=" * 80)
    print("📊 테스트 결과 요약")
    print("=" * 80)
    
    for test_name, result in test_results.items():
        status = "✅ 성공" if result else "❌ 실패"
        print(f"{test_name.upper()}: {status}")
    
    all_passed = all(test_results.values())
    
    if all_passed:
        print("\n🎉 모든 테스트 통과! 낙상 데이터 저장이 정상 작동합니다.")
    else:
        print("\n⚠️ 일부 테스트 실패. 문제를 확인하세요:")
        
        if not test_results['env']:
            print("   - .env 파일 경로 및 환경변수 설정 확인")
        if not test_results['connection']:
            print("   - Supabase URL과 API 키 확인")
        if not test_results['user']:
            print("   - 사용자 테이블 스키마 확인")
        if not test_results['fall_data']:
            print("   - fall_data 테이블 스키마 확인")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 