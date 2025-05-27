# WebSocket IMU 데이터 도구 모음

이 디렉토리에는 WebSocket을 통한 IMU 데이터 전송 관련 도구들이 포함되어 있습니다.

## 1. IMU 데이터 시뮬레이터 (imu_client_example.py)

실제 IMU 센서 없이도 테스트할 수 있는 데이터 시뮬레이터입니다.

### 필요 패키지 설치

```bash
pip install websockets
```

### 사용법

기본 설정으로 실행:

```bash
python imu_client_example.py
```

사용자 ID 지정:

```bash
python imu_client_example.py test_user_123
```

샘플링 속도와 실행 시간 변경:

```bash
python imu_client_example.py --rate 50 --time 120
```

### 기능

- 걸음 패턴 시뮬레이션 (보행 데이터)
- 낙상 이벤트 자동 감지 및 전송
- 다양한 샘플링 레이트 지원

## 2. IMU 데이터 보관 구조

데이터는 두 가지 방식으로 저장됩니다:

1. **Supabase 데이터베이스**: 모든 데이터는 기본적으로 Supabase에 저장됩니다.
2. **CSV 백업 파일**: 데이터는 `data_backup` 폴더에 CSV 형식으로 백업됩니다.

### CSV 파일 형식

IMU 데이터:
- `imu_data_{user_id}_{timestamp}.csv`

일일 요약 데이터:
- `summary_{user_id}_{date}.csv`

이벤트 로그:
- `events.csv`

### 데이터 요약 설정

하루가 끝나면 데이터는 자동으로 요약됩니다. 요약 설정은 `websocket_manager.py` 파일에서 조정할 수 있습니다:

```python
# TODO: 추후 설정 파일이나 환경 변수로 변경 가능하게 수정
self.summary_frame_count = 1000  # 하루 데이터를 요약할 때 사용할 프레임 수 (10초)
```

이 값은 언제든지 변경 가능하며, 요약 데이터에 포함할 프레임 수를 결정합니다. 