"""
사용자 존재 여부 확인 스크립트
"""
import asyncio
import sys
import os

# 상위 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.supabase_client import supabase_client

async def check_user(user_id):
    print(f"=== 사용자 {user_id} 존재 여부 확인 ===")
    
    try:
        user = await supabase_client.get_user_by_id(user_id)
        
        if user:
            print(f"✅ 사용자 {user_id}가 존재합니다.")
            print(f"사용자 정보: {user}")
        else:
            print(f"❌ 사용자 {user_id}가 존재하지 않습니다.")
            
            # 사용자 자동 생성 테스트
            print(f"사용자 {user_id} 자동 생성을 시도합니다...")
            
            if user_id.startswith('raspberry_pi_'):
                device_name = user_id.replace('_', ' ').title()
                email = f"{user_id}@device.local"
                user_type = "device"
            else:
                device_name = f"User {user_id}"
                email = f"{user_id}@example.com"
                user_type = "user"
            
            # 사용자 생성
            user_data = {
                'user_id': user_id,
                'name': device_name,
                'email': email
            }
            
            result = await supabase_client.create_user(user_data)
            print(f"사용자 생성 결과: {result}")
            
            # 다시 확인
            user = await supabase_client.get_user_by_id(user_id)
            if user:
                print(f"✅ 사용자 {user_id} 생성 완료!")
                print(f"생성된 사용자 정보: {user}")
            else:
                print(f"❌ 사용자 {user_id} 생성 실패")
                
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # 테스트할 사용자 ID들
    user_ids = ["raspberry_pi_01", "test_fall_detection"]
    
    for user_id in user_ids:
        asyncio.run(check_user(user_id))
        print() 