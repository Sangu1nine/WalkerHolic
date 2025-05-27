#!/usr/bin/env python3
"""
Supabase 데이터 저장 확인 스크립트
- 실제로 데이터가 저장되었는지 확인
- 최근 저장된 데이터 조회
"""

import sys
import os
from datetime import datetime, timedelta

# 백엔드 경로 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def check_supabase_data():
    """Supabase에 저장된 데이터 확인"""
    print("=" * 60)
    print("🔍 Supabase 데이터 저장 확인")
    print("=" * 60)
    
    try:
        from database.supabase_client import supabase_client
        
        print(f"🔍 Mock 모드: {supabase_client.is_mock}")
        
        if supabase_client.is_mock:
            print("❌ 현재 Mock 모드로 실행 중입니다!")
            print("❌ 실제 데이터베이스에 저장되지 않았습니다!")
            return False
        
        print("✅ 실제 Supabase 연결 모드")
        
        # 1. IMU 데이터 확인
        print("\n📊 IMU 데이터 확인:")
        try:
            imu_result = supabase_client.client.table("imu_data").select("*", count="exact").execute()
            imu_count = imu_result.count if hasattr(imu_result, 'count') else len(imu_result.data)
            print(f"   총 IMU 데이터 레코드 수: {imu_count}")
            
            if imu_count > 0:
                # 최근 5개 레코드 조회
                recent_imu = supabase_client.client.table("imu_data").select("*").order("created_at", desc=True).limit(5).execute()
                print("   최근 IMU 데이터:")
                for i, record in enumerate(recent_imu.data[:5], 1):
                    print(f"     {i}. user_id: {record.get('user_id')}, timestamp: {record.get('timestamp')}")
            else:
                print("   ⚠️ IMU 데이터가 없습니다.")
                
        except Exception as e:
            print(f"   ❌ IMU 데이터 조회 실패: {e}")
        
        # 2. Fall 데이터 확인
        print("\n🚨 Fall 데이터 확인:")
        try:
            fall_result = supabase_client.client.table("fall_data").select("*", count="exact").execute()
            fall_count = fall_result.count if hasattr(fall_result, 'count') else len(fall_result.data)
            print(f"   총 Fall 데이터 레코드 수: {fall_count}")
            
            if fall_count > 0:
                # 최근 5개 레코드 조회
                recent_fall = supabase_client.client.table("fall_data").select("*").order("created_at", desc=True).limit(5).execute()
                print("   최근 Fall 데이터:")
                for i, record in enumerate(recent_fall.data[:5], 1):
                    print(f"     {i}. user_id: {record.get('user_id')}, timestamp: {record.get('timestamp')}, fall_detected: {record.get('fall_detected')}")
            else:
                print("   ⚠️ Fall 데이터가 없습니다.")
                
        except Exception as e:
            print(f"   ❌ Fall 데이터 조회 실패: {e}")
        
        # 3. 사용자 데이터 확인
        print("\n👤 사용자 데이터 확인:")
        try:
            user_result = supabase_client.client.table("users").select("*", count="exact").execute()
            user_count = user_result.count if hasattr(user_result, 'count') else len(user_result.data)
            print(f"   총 사용자 수: {user_count}")
            
            if user_count > 0:
                # 라즈베리파이 사용자 확인
                pi_users = supabase_client.client.table("users").select("*").ilike("user_id", "%raspberry%").execute()
                if pi_users.data:
                    print("   라즈베리파이 사용자:")
                    for user in pi_users.data:
                        print(f"     - {user.get('user_id')}")
                else:
                    print("   ⚠️ 라즈베리파이 사용자가 없습니다.")
                    
        except Exception as e:
            print(f"   ❌ 사용자 데이터 조회 실패: {e}")
        
        # 4. 오늘 저장된 데이터 확인
        print("\n📅 오늘 저장된 데이터:")
        today = datetime.now().strftime("%Y-%m-%d")
        try:
            today_imu = supabase_client.client.table("imu_data").select("*", count="exact").gte("created_at", f"{today}T00:00:00").execute()
            today_imu_count = today_imu.count if hasattr(today_imu, 'count') else len(today_imu.data)
            print(f"   오늘 IMU 데이터: {today_imu_count}개")
            
            today_fall = supabase_client.client.table("fall_data").select("*", count="exact").gte("created_at", f"{today}T00:00:00").execute()
            today_fall_count = today_fall.count if hasattr(today_fall, 'count') else len(today_fall.data)
            print(f"   오늘 Fall 데이터: {today_fall_count}개")
            
        except Exception as e:
            print(f"   ❌ 오늘 데이터 조회 실패: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ 데이터 확인 실패: {e}")
        return False

def main():
    """메인 함수"""
    print("🔍 Supabase 데이터 저장 상태 확인")
    
    success = check_supabase_data()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ 데이터 확인 완료")
        print("\n💡 참고사항:")
        print("- IMU 데이터가 있다면 WebSocket 연결이 정상 작동한 것입니다")
        print("- Fall 데이터는 실제 낙상 이벤트가 발생했을 때만 저장됩니다")
        print("- 데이터가 없다면 Mock 모드로 실행되었거나 연결 문제가 있을 수 있습니다")
    else:
        print("❌ 데이터 확인 실패")
        print("\n🔧 해결 방법:")
        print("1. .env 파일의 SUPABASE_URL과 SUPABASE_ANON_KEY 확인")
        print("2. 백엔드 서버 재시작")
        print("3. Supabase 프로젝트 상태 확인")

if __name__ == "__main__":
    main() 