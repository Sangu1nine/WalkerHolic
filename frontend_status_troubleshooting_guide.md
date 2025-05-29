# 프론트엔드 상태 표시 및 알림음 시스템 개선 가이드

## 📋 문제 분석 결과

### 🔍 주요 문제점
1. **"? 상태 확인 중" 지속 문제**
   - 라즈베리파이에서 영어 상태(`"Walking"`, `"Idle"`) 전송
   - 프론트엔드에서 한국어 매핑 실패
   - 기본값 처리 로직 부족

2. **데이터 흐름 복잡성**
   - 여러 WebSocket 이벤트 핸들러 중복
   - 상태 정보 경로 불일치
   - ROC 분석 결과와 일반 상태 정보 혼재

3. **알림음 시스템 부재**
   - 상태 변화 알림 없음
   - 연결 상태 피드백 부족
   - 응급상황 경고음 개선 필요

## 🔧 해결방안 구현

### 1. 상태 매핑 로직 개선

#### `UserStatusDisplay.js` 개선사항
```javascript
// 🆕 상태 값 정규화 함수 추가
const normalizeStateValue = (state) => {
    if (!state) return 'daily';
    
    const stateStr = String(state).toLowerCase();
    
    // 영어 → 한국어 매핑
    if (stateStr.includes('walk') || stateStr === 'walking') {
        return '보행';
    } else if (stateStr.includes('idle') || stateStr === 'idle') {
        return '일상';
    } else if (stateStr.includes('fall')) {
        return '낙상';
    } else if (stateStr.includes('emergency')) {
        return '응급';
    }
    
    // 인식되지 않는 상태는 '일상'으로 기본 처리
    console.warn('🤔 알 수 없는 상태값:', state, '-> 일상으로 처리');
    return '일상';
};
```

#### 통합된 상태 처리 로직
```javascript
// 상태 업데이트 통합 처리
const handleStateUpdate = (data) => {
    let stateData = null;
    
    if (data.data) {
        stateData = data.data;
    } else if (data.user_state) {
        stateData = data.user_state;
    } else if (data.current_state) {
        stateData = data;
    }
    
    if (stateData) {
        const normalizedState = normalizeStateValue(stateData.current_state);
        // 상태 업데이트...
    }
};
```

### 2. 고급 알림음 시스템 구현

#### `websocket.js` 알림음 기능 추가
```javascript
// 🆕 상태별 알림음 재생 시스템
playNotificationSound(type = 'info', volume = 0.3) {
    const soundConfig = {
        'walking_start': { frequency: 523, duration: 0.2, pattern: [1, 1] },
        'walking_stop': { frequency: 392, duration: 0.2, pattern: [1] },
        'connection': { frequency: 880, duration: 0.1, pattern: [1, 1, 1] },
        'warning': { frequency: 659, duration: 0.3, pattern: [1, 0.5, 1] },
        'error': { frequency: 330, duration: 0.5, pattern: [1] }
    };
    
    const config = soundConfig[type] || soundConfig['info'];
    // Web Audio API를 사용한 알림음 생성...
}

// 🆕 상태 변화 감지 및 자동 알림음
handleStateChangeSound(newState, oldState) {
    if (newState === oldState) return;
    
    const settings = this.getNotificationSettings();
    if (!settings.enableStateChangeAlerts) return;
    
    const volume = settings.masterVolume * settings.stateChangeVolume;
    
    switch (newState) {
        case '보행':
            this.playNotificationSound('walking_start', volume);
            break;
        case '일상':
            if (oldState === '보행') {
                this.playNotificationSound('walking_stop', volume);
            }
            break;
        // 추가 상태 처리...
    }
}
```

### 3. 사용자 친화적 알림 설정 UI

#### `NotificationSettings.js` 컴포넌트
- **전체 볼륨 조절**: 마스터 볼륨 슬라이더
- **상태별 알림 토글**: 각 알림 타입별 개별 설정
- **볼륨 세분화**: 상태 변화, 연결, 응급상황별 개별 볼륨
- **실시간 테스트**: 각 알림음 미리 듣기 기능
- **로컬 저장**: 사용자 설정 자동 저장 및 복원

#### 주요 기능
```javascript
const [settings, setSettings] = useState({
    masterVolume: 0.3,
    enableStateChangeAlerts: true,
    enableConnectionAlerts: true,
    enableEmergencyAlerts: true,
    emergencyVolume: 0.5,
    stateChangeVolume: 0.2,
    connectionVolume: 0.1
});
```

## 🎯 기대 효과

### 1. 상태 표시 개선
- ✅ "? 상태 확인 중" 문제 완전 해결
- ✅ 라즈베리파이 영어 상태 → 한국어 정확한 매핑
- ✅ 실시간 상태 변화 정확한 반영
- ✅ ROC 분석 결과 올바른 처리

### 2. 사용자 경험 향상
- 🔊 상태 변화 즉시 알림음으로 인지
- 🔗 연결 상태 변화 실시간 피드백
- 🚨 응급상황 강력한 경고음
- ⚙️ 개인화된 알림 설정

### 3. 시스템 안정성
- 📊 단순화된 데이터 처리 로직
- 🔄 통합된 상태 관리
- ⚡ 효율적인 WebSocket 메시지 처리
- 🛡️ 오류 상황 대응 강화

## 🚀 사용 방법

### 1. 알림 설정 접근
```javascript
import NotificationSettings from './components/NotificationSettings';

// 설정 컴포넌트 사용
<NotificationSettings />
```

### 2. 설정 값 활용
```javascript
import { getNotificationSettings } from './components/NotificationSettings';

// 다른 컴포넌트에서 설정 값 사용
const settings = getNotificationSettings();
```

### 3. 상태 변화 모니터링
- 브라우저 개발자 도구 콘솔에서 실시간 로그 확인
- `🔄 상태 변화 감지:` 로그로 상태 전환 추적
- `🔊 상태 변화 알림음:` 로그로 알림음 재생 확인

## 🔧 문제 해결 체크리스트

### 상태가 "상태 확인 중"으로 계속 표시될 때
1. ✅ 라즈베리파이 센서 연결 확인
2. ✅ WebSocket 연결 상태 확인 (`연결됨` 표시되는지)
3. ✅ 브라우저 콘솔에서 `📊 IMU 상태 업데이트:` 로그 확인
4. ✅ `normalizeStateValue` 함수 정상 작동 확인

### 알림음이 재생되지 않을 때
1. ✅ 브라우저 음소거 상태 확인
2. ✅ 알림 설정에서 해당 알림 활성화 확인
3. ✅ 볼륨 설정 확인 (0이 아닌지)
4. ✅ 브라우저 Web Audio API 지원 확인

### 연결 문제 해결
1. ✅ 백엔드 서버 실행 상태 확인
2. ✅ 라즈베리파이 IP 주소 정확성 확인
3. ✅ 네트워크 연결 상태 확인
4. ✅ 방화벽 설정 확인

## 📈 성능 최적화

### 메모리 효율성
- 상태 정규화 함수 호출 최소화
- WebSocket 이벤트 리스너 적절한 정리
- 알림음 오디오 컨텍스트 재사용

### CPU 효율성
- 불필요한 상태 업데이트 방지
- 알림음 생성 최적화
- 설정 값 캐싱

### 네트워크 효율성
- WebSocket 메시지 크기 최소화
- 재연결 로직 개선
- 불필요한 데이터 전송 방지

## 🎉 결론

이번 개선을 통해:
1. **상태 표시 문제 완전 해결** - "? 상태 확인 중" 문제 해결
2. **풍부한 사용자 피드백** - 알림음을 통한 즉각적인 상황 인지
3. **개인화된 설정** - 사용자 맞춤형 알림 시스템
4. **시스템 안정성 향상** - 통합된 상태 관리 로직

사용자는 이제 라즈베리파이 센서의 상태 변화를 실시간으로 정확하게 확인할 수 있으며, 원하는 대로 알림음을 설정하여 더 나은 모니터링 경험을 얻을 수 있습니다. 