# 프론트엔드 응급상황 및 현재 상태 표시 분석 보고서

## 📋 현재 상황 분석

### ✅ **백엔드에서 완벽히 구현된 기능들:**

#### 1. 낙상 감지 및 응급상황 처리
```python
# backend/app/core/websocket_manager.py
async def _process_fall_data(self, fall_data: dict, user_id: str, state_info: dict = None):
    # 낙상 데이터 DB 저장
    fall_id = supabase_client.save_fall_data(fall_data)
    
    # 워킹 모드에서 응급상황 타이머 시작 (15초)
    if self.is_walking_mode:
        self.emergency_timers[user_id] = time.time()
    
    # 낙상 알림 브로드캐스트
    await self._broadcast_fall_alert(fall_data, user_id)
```

#### 2. 15초 후 자동 응급상황 판정
```python
async def _emergency_monitor(self):
    # 15초 경과시 응급상황 판정
    if duration >= 15.0:
        # 응급상황 알림 브로드캐스트
        await self._broadcast_alert({
            'type': 'emergency_declared',
            'data': {
                'user_id': user_id,
                'message': f"🚨 응급상황! 사용자 {user_id}가 15초간 움직이지 않습니다!",
                'emergency_level': 'CRITICAL'
            }
        })
```

#### 3. WebSocket을 통한 실시간 알림 전송
```python
async def _broadcast_fall_alert(self, fall_data: dict, user_id: str):
    alert = {
        'type': 'fall_alert',
        'data': {
            'user_id': user_id,
            'message': f"🚨 사용자 {user_id}에게 낙상이 감지되었습니다!",
            'emergency_level': 'HIGH'
        }
    }
    await self._broadcast_alert(alert)
```

### ⚠️ **프론트엔드에서 부족한 부분들:**

#### 1. WebSocket 메시지 처리 제한적
```javascript
// frontend/src/services/websocket.js - 현재 상태
this.socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    // 이벤트 타입이 있으면 구체적인 이벤트 발생 (제한적)
    if (data.type === 'notification') {
        this.emit(data.event, data);
        this.emit('notification', data);
    }
    
    // 일반 메시지만 처리
    this.emit('message', data);
};
```

**문제점:** `fall_alert`, `emergency_declared` 등의 특정 이벤트 타입을 처리하지 않음

#### 2. 메인 페이지에서 응급상황 처리 부재
```javascript
// frontend/src/pages/main/MainPage.js - 현재 상태
const handleWebSocketMessage = (data) => {
    if (data.analysis_result) {
        // 새로운 분석 결과만 처리
        setAnalysisHistory(prev => [data.analysis_result, ...prev]);
    }
    // 응급상황 알림 처리 없음!
};
```

**문제점:** 응급상황 알림을 받아도 UI에 표시하지 않음

#### 3. 응급상황 UI 컴포넌트 부재
- 긴급 알림 모달/팝업 없음
- 응급상황 상태 표시 UI 없음
- 사용자 현재 상태 실시간 표시 없음

## 🚨 **개선 방안 및 구현 계획**

### 1. **WebSocket 서비스 개선**

#### 개선된 WebSocket 메시지 처리:
```javascript
// frontend/src/services/websocket.js - 개선안
this.socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    // 다양한 이벤트 타입 처리
    switch (data.type) {
        case 'fall_alert':
            this.emit('fall_detected', data);
            this.showEmergencyAlert(data.data);
            break;
            
        case 'emergency_declared':
            this.emit('emergency_critical', data);
            this.showCriticalAlert(data.data);
            break;
            
        case 'imu_data_received':
            this.emit('user_state_update', data);
            break;
            
        case 'notification':
            this.emit('notification', data);
            break;
            
        default:
            this.emit('message', data);
    }
};

// 응급상황 UI 표시 메서드
showEmergencyAlert(alertData) {
    // 브라우저 알림
    if (Notification.permission === 'granted') {
        new Notification('🚨 낙상 감지!', {
            body: alertData.message,
            icon: '/emergency-icon.png',
            tag: 'emergency'
        });
    }
    
    // 커스텀 이벤트 발생
    this.emit('show_emergency_modal', alertData);
}

showCriticalAlert(alertData) {
    // 더 강력한 알림
    if (Notification.permission === 'granted') {
        new Notification('🚨 응급상황 발생!', {
            body: alertData.message,
            icon: '/critical-icon.png',
            tag: 'critical',
            requireInteraction: true // 사용자가 직접 닫을 때까지 유지
        });
    }
    
    this.emit('show_critical_modal', alertData);
}
```

### 2. **응급상황 알림 컴포넌트 개발**

#### EmergencyAlert 컴포넌트:
```javascript
// frontend/src/components/EmergencyAlert.js
import React, { useState } from 'react';
import './EmergencyAlert.css';

const EmergencyAlert = ({ isVisible, alertData, onClose, onCallEmergency }) => {
    if (!isVisible) return null;
    
    const isCritical = alertData?.emergency_level === 'CRITICAL';
    
    return (
        <div className={`emergency-overlay ${isCritical ? 'critical' : 'warning'}`}>
            <div className="emergency-modal">
                <div className="emergency-header">
                    <span className="emergency-icon">
                        {isCritical ? '🚨' : '⚠️'}
                    </span>
                    <h2>{isCritical ? '응급상황 발생!' : '낙상 감지됨'}</h2>
                </div>
                
                <div className="emergency-content">
                    <p className="emergency-message">{alertData?.message}</p>
                    <p className="emergency-time">
                        발생 시간: {new Date(alertData?.timestamp).toLocaleString('ko-KR')}
                    </p>
                    {alertData?.user_id && (
                        <p className="emergency-user">사용자: {alertData.user_id}</p>
                    )}
                </div>
                
                <div className="emergency-actions">
                    {isCritical && (
                        <button className="emergency-call-btn" onClick={onCallEmergency}>
                            📞 응급전화 걸기
                        </button>
                    )}
                    <button className="emergency-close-btn" onClick={onClose}>
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmergencyAlert;
```

#### EmergencyAlert CSS:
```css
/* frontend/src/components/EmergencyAlert.css */
.emergency-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    animation: emergencyPulse 2s infinite;
}

.emergency-overlay.critical {
    background: rgba(255, 0, 0, 0.3);
    animation: criticalPulse 1s infinite;
}

.emergency-modal {
    background: white;
    border-radius: 15px;
    padding: 30px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease-out;
}

.emergency-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
}

.emergency-icon {
    font-size: 48px;
    margin-right: 15px;
}

.emergency-header h2 {
    color: #d32f2f;
    margin: 0;
    font-size: 24px;
    font-weight: bold;
}

.emergency-message {
    font-size: 18px;
    color: #333;
    margin-bottom: 15px;
    font-weight: 500;
}

.emergency-time, .emergency-user {
    font-size: 14px;
    color: #666;
    margin: 5px 0;
}

.emergency-actions {
    display: flex;
    gap: 15px;
    margin-top: 25px;
}

.emergency-call-btn {
    background: #d32f2f;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    flex: 1;
}

.emergency-close-btn {
    background: #757575;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    flex: 1;
}

@keyframes emergencyPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
}

@keyframes criticalPulse {
    0%, 100% { background: rgba(255, 0, 0, 0.3); }
    50% { background: rgba(255, 0, 0, 0.6); }
}

@keyframes slideIn {
    from {
        transform: translateY(-50px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}
```

### 3. **사용자 상태 표시 컴포넌트**

#### UserStatusDisplay 컴포넌트:
```javascript
// frontend/src/components/UserStatusDisplay.js
import React, { useState, useEffect } from 'react';
import { websocketService } from '../services/websocket';
import './UserStatusDisplay.css';

const UserStatusDisplay = ({ userId }) => {
    const [userState, setUserState] = useState({
        current_state: '알 수 없음',
        state_duration: 0,
        is_connected: false,
        emergency_timer: null
    });
    
    useEffect(() => {
        // WebSocket에서 상태 업데이트 수신
        websocketService.on('user_state_update', handleStateUpdate);
        websocketService.on('imu_data_received', handleIMUDataReceived);
        
        return () => {
            websocketService.off('user_state_update', handleStateUpdate);
            websocketService.off('imu_data_received', handleIMUDataReceived);
        };
    }, []);
    
    const handleStateUpdate = (data) => {
        if (data.user_state) {
            setUserState(prev => ({
                ...prev,
                ...data.user_state,
                is_connected: true
            }));
        }
    };
    
    const handleIMUDataReceived = (data) => {
        if (data.user_state) {
            setUserState(prev => ({
                ...prev,
                ...data.user_state,
                is_connected: true
            }));
        }
    };
    
    const getStateColor = (state) => {
        switch (state) {
            case 'Walking': return '#4caf50';
            case 'Idle': return '#2196f3';
            case 'Fall': return '#f44336';
            default: return '#9e9e9e';
        }
    };
    
    const getStateIcon = (state) => {
        switch (state) {
            case 'Walking': return '🚶';
            case 'Idle': return '🏠';
            case 'Fall': return '🚨';
            default: return '❓';
        }
    };
    
    const formatDuration = (seconds) => {
        if (seconds < 60) return `${seconds}초`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}분`;
        return `${Math.floor(seconds / 3600)}시간 ${Math.floor((seconds % 3600) / 60)}분`;
    };
    
    return (
        <div className="user-status-display">
            <div className="status-header">
                <h3>현재 상태</h3>
                <div className={`connection-indicator ${userState.is_connected ? 'connected' : 'disconnected'}`}>
                    <span className="indicator-dot"></span>
                    {userState.is_connected ? '연결됨' : '연결 끊김'}
                </div>
            </div>
            
            <div className="status-content">
                <div 
                    className="state-display"
                    style={{ borderColor: getStateColor(userState.current_state) }}
                >
                    <span className="state-icon">
                        {getStateIcon(userState.current_state)}
                    </span>
                    <div className="state-info">
                        <div className="state-name">{userState.current_state}</div>
                        <div className="state-duration">
                            {formatDuration(userState.state_duration)}
                        </div>
                    </div>
                </div>
                
                {userState.emergency_timer && (
                    <div className="emergency-timer">
                        <span className="emergency-icon">⏰</span>
                        <div className="timer-info">
                            <div className="timer-label">응급상황 타이머</div>
                            <div className="timer-value">
                                {formatDuration(Math.floor(userState.emergency_timer))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserStatusDisplay;
```

### 4. **메인 페이지 개선**

#### 개선된 MainPage.js:
```javascript
// frontend/src/pages/main/MainPage.js - 응급상황 처리 추가
import EmergencyAlert from '../../components/EmergencyAlert';
import UserStatusDisplay from '../../components/UserStatusDisplay';

const MainPage = () => {
    // 기존 state에 추가
    const [emergencyAlert, setEmergencyAlert] = useState({
        isVisible: false,
        alertData: null
    });
    
    useEffect(() => {
        // 기존 WebSocket 연결에 추가
        websocketService.on('fall_detected', handleFallDetected);
        websocketService.on('emergency_critical', handleEmergencyCritical);
        websocketService.on('show_emergency_modal', showEmergencyModal);
        websocketService.on('show_critical_modal', showCriticalModal);
        
        // 브라우저 알림 권한 요청
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        return () => {
            websocketService.off('fall_detected', handleFallDetected);
            websocketService.off('emergency_critical', handleEmergencyCritical);
            websocketService.off('show_emergency_modal', showEmergencyModal);
            websocketService.off('show_critical_modal', showCriticalModal);
        };
    }, [userId]);
    
    const handleFallDetected = (data) => {
        console.log('🚨 낙상 감지됨:', data);
        // 분석 히스토리에 낙상 이벤트 추가
        const fallEvent = {
            timestamp: data.data.timestamp,
            gait_pattern: '낙상 감지',
            similarity_score: data.data.confidence_score,
            health_assessment: '높음'
        };
        setAnalysisHistory(prev => [fallEvent, ...prev]);
    };
    
    const handleEmergencyCritical = (data) => {
        console.log('🚨 응급상황 발생:', data);
        // 더 강력한 UI 반응 (예: 화면 깜빡임, 소리 등)
    };
    
    const showEmergencyModal = (alertData) => {
        setEmergencyAlert({
            isVisible: true,
            alertData: alertData
        });
    };
    
    const showCriticalModal = (alertData) => {
        setEmergencyAlert({
            isVisible: true,
            alertData: alertData
        });
    };
    
    const handleEmergencyClose = () => {
        setEmergencyAlert({
            isVisible: false,
            alertData: null
        });
    };
    
    const handleCallEmergency = () => {
        // 응급전화 걸기 기능
        window.open('tel:119');
    };
    
    return (
        <div className="main-container">
            {/* 기존 컨텐츠 */}
            
            {/* 새로 추가된 컴포넌트들 */}
            <UserStatusDisplay userId={userId} />
            
            <EmergencyAlert 
                isVisible={emergencyAlert.isVisible}
                alertData={emergencyAlert.alertData}
                onClose={handleEmergencyClose}
                onCallEmergency={handleCallEmergency}
            />
        </div>
    );
};
```

## 🎯 **최종 구현 효과**

### ✅ **완성 후 기능들:**

1. **실시간 낙상 감지 알림**
   - 라즈베리파이에서 낙상 감지 시 즉시 프론트엔드에 알림
   - 브라우저 알림 + 모달 팝업

2. **15초 응급상황 타이머**
   - 낙상 후 15초간 움직임이 없으면 자동 응급상황 판정
   - 긴급 모달 표시 + 응급전화 버튼

3. **실시간 사용자 상태 표시**
   - Walking, Idle, Fall 상태 실시간 업데이트
   - 상태 지속 시간 표시
   - 연결 상태 표시

4. **완전한 응급상황 대응 시스템**
   - DB 저장 → WebSocket 전송 → 프론트엔드 표시 → 응급전화 연결

## 📊 **현재 vs 개선 후 비교**

| 기능 | 현재 상태 | 개선 후 |
|------|-----------|---------|
| 낙상 감지 DB 저장 | ✅ 완료 | ✅ 유지 |
| WebSocket 알림 전송 | ✅ 완료 | ✅ 유지 |
| 프론트엔드 알림 수신 | ❌ 제한적 | ✅ 완전 지원 |
| 응급상황 UI 표시 | ❌ 없음 | ✅ 모달 + 브라우저 알림 |
| 사용자 상태 표시 | ❌ 없음 | ✅ 실시간 표시 |
| 응급전화 연결 | ❌ 없음 | ✅ 자동 연결 |

**결론: 백엔드는 완벽하지만 프론트엔드 UI가 부족한 상황. 위 개선안 적용 시 완전한 응급상황 대응 시스템 완성!** 🎯 