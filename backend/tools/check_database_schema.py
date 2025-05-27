"""
=============================================================================
파일명: check_database_schema.py
설명: 데이터베이스 스키마 및 테이블 존재 여부 확인

이 스크립트는 다음을 확인합니다:
1. Supabase 연결 상태
2. 필요한 테이블들의 존재 여부
3. fall_data 테이블 스키마 확인
4. 외래키 제약조건 확인

개발자: NAKSANG 프로젝트팀
생성일: 2025-05-26
=============================================================================
"""

import asyncio
import sys
import os

# 상위 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.supabase_client import supabase_client
from config.settings import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def check_database_schema():
    """데이터베이스 스키마 확인"""
    print("=" * 60)
    print("🔍 데이터베이스 스키마 확인")
    print("=" * 60)
    
    # 1. Supabase 연결 상태 확인
    print("\n1️⃣ Supabase 연결 상태:")
    print(f"   - URL 설정: {'✅' if settings.SUPABASE_URL else '❌'}")
    print(f"   - KEY 설정: {'✅' if settings.SUPABASE_ANON_KEY else '❌'}")
    print(f"   - 목업 모드: {'✅' if supabase_client.is_mock else '❌'}")
    
    if supabase_client.is_mock:
        print("   ⚠️ 목업 모드로 실행 중 - 실제 DB 확인 불가")
        return
    
    # 2. 필요한 테이블 목록
    required_tables = [
        'users',
        'user_health_info', 
        'imu_data',
        'fall_data',
        'analysis_results',
        'chat_history',
        'notifications'
    ]
    
    print("\n2️⃣ 테이블 존재 여부 확인:")
    
    try:
        # 테이블 목록 조회
        result = supabase_client.client.rpc('get_table_list').execute()
        existing_tables = [row['table_name'] for row in result.data] if result.data else []
        
        for table in required_tables:
            exists = table in existing_tables
            status = "✅" if exists else "❌"
            print(f"   - {table}: {status}")
            
            if not exists:
                print(f"     ⚠️ {table} 테이블이 존재하지 않습니다!")
        
    except Exception as e:
        print(f"   ❌ 테이블 목록 조회 실패: {e}")
        
        # 대안: 각 테이블에 직접 쿼리해보기
        print("\n   🔄 개별 테이블 확인 시도:")
        for table in required_tables:
            try:
                result = supabase_client.client.table(table).select("*").limit(1).execute()
                print(f"   - {table}: ✅")
            except Exception as table_error:
                print(f"   - {table}: ❌ ({str(table_error)[:50]}...)")
    
    # 3. fall_data 테이블 상세 확인
    print("\n3️⃣ fall_data 테이블 상세 확인:")
    try:
        # fall_data 테이블 스키마 확인
        result = supabase_client.client.table('fall_data').select('*').limit(1).execute()
        print("   ✅ fall_data 테이블 접근 가능")
        
        # 테이블 구조 확인 (PostgreSQL 정보 스키마 사용)
        schema_query = """
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'fall_data' 
        ORDER BY ordinal_position;
        """
        
        try:
            schema_result = supabase_client.client.rpc('execute_sql', {'sql': schema_query}).execute()
            if schema_result.data:
                print("   📋 fall_data 테이블 구조:")
                for col in schema_result.data:
                    print(f"     - {col['column_name']}: {col['data_type']} ({'NULL' if col['is_nullable'] == 'YES' else 'NOT NULL'})")
        except Exception as schema_error:
            print(f"   ⚠️ 스키마 정보 조회 실패: {schema_error}")
        
        # 기존 데이터 확인
        count_result = supabase_client.client.table('fall_data').select('*', count='exact').execute()
        record_count = count_result.count if hasattr(count_result, 'count') else len(count_result.data)
        print(f"   📊 기존 레코드 수: {record_count}")
        
        if record_count > 0:
            print("   📝 최근 레코드 샘플:")
            recent_result = supabase_client.client.table('fall_data').select('*').order('created_at', desc=True).limit(3).execute()
            for i, record in enumerate(recent_result.data[:3], 1):
                print(f"     {i}. user_id: {record.get('user_id')}, timestamp: {record.get('timestamp')}")
        
    except Exception as fall_error:
        print(f"   ❌ fall_data 테이블 확인 실패: {fall_error}")
        
        # 테이블 생성 제안
        print("\n   💡 해결 방법:")
        print("   1. complete_database_setup.sql 스크립트 실행")
        print("   2. 또는 다음 명령으로 fall_data 테이블 생성:")
        print("""
   CREATE TABLE fall_data (
       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       user_id VARCHAR(50) NOT NULL,
       timestamp TIMESTAMPTZ NOT NULL,
       fall_detected BOOLEAN NOT NULL,
       confidence_score FLOAT,
       sensor_data JSONB,
       created_at TIMESTAMPTZ DEFAULT NOW(),
       FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
   );
        """)
    
    # 4. 사용자 존재 확인
    print("\n4️⃣ 테스트 사용자 확인:")
    test_users = ['raspberry_pi_01', 'test_fall_detection']
    
    for user_id in test_users:
        try:
            user = await supabase_client.get_user_by_id(user_id)
            if user:
                print(f"   - {user_id}: ✅")
            else:
                print(f"   - {user_id}: ❌ (존재하지 않음)")
        except Exception as user_error:
            print(f"   - {user_id}: ❌ ({str(user_error)[:30]}...)")

async def test_fall_data_insert():
    """fall_data 테이블 삽입 테스트"""
    print("\n5️⃣ fall_data 삽입 테스트:")
    
    if supabase_client.is_mock:
        print("   ⚠️ 목업 모드에서는 실제 삽입 테스트 불가")
        return
    
    test_data = {
        'user_id': 'test_fall_detection',
        'timestamp': '2025-01-27T15:00:00+09:00',
        'fall_detected': True,
        'confidence_score': 0.95,
        'sensor_data': {'test': True, 'source': 'schema_check'}
    }
    
    try:
        result = await supabase_client.save_fall_data(test_data)
        print("   ✅ fall_data 삽입 성공!")
        print(f"   📄 결과: {result}")
    except Exception as insert_error:
        print(f"   ❌ fall_data 삽입 실패: {insert_error}")
        
        # 오류 분석
        error_str = str(insert_error).lower()
        if 'foreign key' in error_str:
            print("   💡 외래키 제약조건 오류 - 사용자가 존재하지 않음")
        elif 'does not exist' in error_str:
            print("   💡 테이블이 존재하지 않음")
        elif 'column' in error_str:
            print("   💡 컬럼 구조 불일치")

if __name__ == "__main__":
    asyncio.run(check_database_schema())
    asyncio.run(test_fall_data_insert()) 