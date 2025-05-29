class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000; // 3초
  }

  connect(userId) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    const wsUrl = `ws://localhost:8000/ws/${userId}`;
    console.log('Connecting to WebSocket:', wsUrl);

    this.socket = new WebSocket(wsUrl);
    this.userId = userId;

    this.socket.onopen = () => {
      console.log('✅ WebSocket 연결 성공');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 WebSocket 메시지 수신:', data);

        // 🆕 메시지 타입별 처리
        if (data.type === 'fall_alert') {
          console.log('🚨 낙상 알림 수신:', data);
          this.handleFallAlert(data);
        } else if (data.type === 'emergency_declared') {
          console.log('🚨 응급상황 선언:', data);
          this.handleEmergencyCritical(data);
        } else if (data.type === 'emergency_resolved') {
          console.log('✅ 응급상황 해제:', data);
          this.handleEmergencyResolved(data);
        } else if (data.type === 'emergency_confirmed_critical') {
          console.log('🚨 응급상황 확정:', data);
          this.handleEmergencyConfirmedCritical(data);
        } else if (data.type === 'health_check_response') {
          // 🔧 MODIFIED: 연결 상태 확인 응답 처리
          console.log('💓 연결 상태 확인 응답 수신:', data);
          this.emit('health_check_received', data);
        } else if (data.type === 'imu_data_received') {
          // IMU 데이터 수신
          this.emit('message', data);
          
          // 🆕 사용자 상태 정보가 포함된 경우
          if (data.user_state) {
            console.log('📊 사용자 상태 업데이트:', data.user_state);
            this.emit('user_state_update', {
              type: 'user_state_update',
              data: data.user_state,
              timestamp: data.user_state.last_update || new Date().toISOString()
            });
          }
        } else {
          // 기타 메시지
          this.emit('message', data);
          
          // 🔧 MODIFIED: 레거시 상태 정보 처리
          if (data.user_state) {
            this.emit('user_state_update', {
              type: 'user_state_update',
              data: data.user_state,
              timestamp: new Date().toISOString()
            });
          }
        }

      } catch (error) {
        console.error('WebSocket 메시지 파싱 오류:', error);
      }
    };

    this.socket.onerror = (error) => {
      console.error('❌ WebSocket 오류:', error);
      this.handleConnectionError();
    };

    this.socket.onclose = (event) => {
      console.log(`🔌 WebSocket 연결 종료 (code: ${event.code})`);
      this.isConnected = false;
      this.emit('disconnected');

      if (event.code !== 1000) {
        this.attemptReconnect(userId);
      }
    };
  }

  // 연결 오류 처리
  handleConnectionError() {
    console.warn('WebSocket 연결 실패 - 로컬 서버 확인 필요');
    this.emit('connection_error', {
      message: '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.',
      suggestion: 'python main.py 명령으로 백엔드 서버를 시작하세요.'
    });
  }

  // 자동 재연결 시도
  attemptReconnect(userId) {
    this.reconnectAttempts++;
    console.log(`WebSocket 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    setTimeout(() => {
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect(userId);
      }
    }, this.reconnectInterval);
  }

  disconnect() {
    this.reconnectAttempts = this.maxReconnectAttempts; // 재연결 방지
    if (this.socket) {
      this.socket.close(1000, 'User disconnect'); // 정상 종료 코드
      this.socket = null;
    }
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  // 🆕 응급상황 UI 표시 메서드
  showEmergencyAlert(alertData) {
    // 브라우저 알림
    if (Notification.permission === 'granted') {
      new Notification('🚨 낙상 감지!', {
        body: alertData.message,
        tag: 'emergency',
        silent: false
      });
    }
    
    // 🆕 응급상황 소리 재생 (Web Audio API 사용)
    this.playEmergencySound();
    
    // 커스텀 이벤트 발생
    this.emit('show_emergency_modal', alertData);
  }

  // 🆕 긴급상황 UI 표시 메서드
  showCriticalAlert(alertData) {
    // 더 강력한 알림
    if (Notification.permission === 'granted') {
      new Notification('🚨 응급상황 발생!', {
        body: alertData.message,
        tag: 'critical',
        requireInteraction: true, // 사용자가 직접 닫을 때까지 유지
        silent: false
      });
    }
    
    // 🆕 더 강한 응급상황 소리 재생
    this.playEmergencySound(true);
    
    // 브라우저 포커스 가져오기
    window.focus();
    
    this.emit('show_critical_modal', alertData);
  }

  // 🆕 응급상황 소리 재생 (Web Audio API)
  playEmergencySound(isCritical = false) {
    try {
      // Web Audio API를 사용해서 응급상황 소리 생성
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // 응급상황에 맞는 주파수와 패턴 설정
      const frequency = isCritical ? 800 : 600; // 긴급상황은 더 높은 주파수
      const duration = isCritical ? 1.0 : 0.5; // 긴급상황은 더 긴 소리
      const repeatCount = isCritical ? 3 : 2; // 긴급상황은 더 많이 반복

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'square'; // 경고음에 적합한 파형

      // 볼륨 조절 (0.1 ~ 0.3 사이)
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      // 소리 재생
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);

      // 반복 재생
      if (repeatCount > 1) {
        for (let i = 1; i < repeatCount; i++) {
          setTimeout(() => {
            this.playEmergencySound(false); // 반복 시에는 일반 모드로
          }, (duration * 1000 + 200) * i); // 200ms 간격으로 반복
        }
      }

    } catch (error) {
      console.warn('응급상황 소리 재생 실패:', error);
      
      // 대체 방법: 시스템 경고음
      try {
        // 간단한 beep 소리
        const beep = () => {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCT2Y2+/JdCMFl5GJ2bJrJwUgX2bO');
          audio.play().catch(() => {});
        };
        
        beep();
        if (isCritical) {
          setTimeout(beep, 300);
          setTimeout(beep, 600);
        }
      } catch (fallbackError) {
        console.warn('대체 소리 재생도 실패:', fallbackError);
      }
    }
  }

  // 🆕 상태별 알림음 재생 시스템
  playNotificationSound(type = 'info', volume = 0.3) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // 알림 타입별 설정
      const soundConfig = {
        'info': { frequency: 440, duration: 0.2, pattern: [1] },
        'success': { frequency: 523, duration: 0.15, pattern: [1, 1] },
        'warning': { frequency: 659, duration: 0.3, pattern: [1, 0.5, 1] },
        'error': { frequency: 330, duration: 0.5, pattern: [1] },
        'walking_start': { frequency: 523, duration: 0.2, pattern: [1, 1] },
        'walking_stop': { frequency: 392, duration: 0.2, pattern: [1] },
        'connection': { frequency: 880, duration: 0.1, pattern: [1, 1, 1] }
      };
      
      const config = soundConfig[type] || soundConfig['info'];
      
      config.pattern.forEach((tone, index) => {
        setTimeout(() => {
          if (tone > 0) {
            this._playTone(audioContext, config.frequency, config.duration * tone, volume);
          }
        }, index * (config.duration * 1000 + 100));
      });
      
    } catch (error) {
      console.warn(`${type} 알림음 재생 실패:`, error);
      this._playFallbackSound(type);
    }
  }

  // 🆕 단일 톤 재생 헬퍼
  _playTone(audioContext, frequency, duration, volume = 0.3) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine'; // 부드러운 알림음

    // 볼륨과 페이드 아웃
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }

  // 🆕 대체 알림음 (Web Audio API 실패 시)
  _playFallbackSound(type) {
    try {
      // 브라우저 내장 소리나 간단한 비프음
      const audio = new Audio();
      
      // 타입별 다른 주파수의 비프음 생성
      const frequencies = {
        'info': 440,
        'success': 523,
        'warning': 659,
        'error': 330,
        'walking_start': 523,
        'walking_stop': 392,
        'connection': 880
      };
      
      const freq = frequencies[type] || 440;
      
      // 간단한 사인파 생성 (매우 짧은 데이터)
      const beepData = this._generateBeepData(freq, 0.2);
      const blob = new Blob([beepData], { type: 'audio/wav' });
      audio.src = URL.createObjectURL(blob);
      audio.volume = 0.3;
      audio.play().catch(() => {
        console.warn('대체 소리도 재생 실패');
      });
      
    } catch (error) {
      console.warn('대체 알림음 생성 실패:', error);
    }
  }

  // 🆕 간단한 WAV 데이터 생성
  _generateBeepData(frequency, duration) {
    const sampleRate = 8000;
    const samples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);
    
    // WAV 헤더 (간단한 형태)
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);
    
    // 사인파 데이터 생성
    for (let i = 0; i < samples; i++) {
      const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3 * 32767;
      view.setInt16(44 + i * 2, sample, true);
    }
    
    return buffer;
  }

  // 🆕 상태 변화 알림음 자동 재생
  handleStateChangeSound(newState, oldState) {
    if (newState === oldState) return;
    
    // 🆕 사용자 알림 설정 확인
    const settings = this.getNotificationSettings();
    if (!settings.enableStateChangeAlerts) return;
    
    console.log(`🔊 상태 변화 알림음: ${oldState} → ${newState}`);
    
    const volume = settings.masterVolume * settings.stateChangeVolume;
    
    switch (newState) {
      case '보행':
      case 'Walking':
        this.playNotificationSound('walking_start', volume);
        break;
      case '일상':
      case 'Idle':
        if (oldState === '보행' || oldState === 'Walking') {
          this.playNotificationSound('walking_stop', volume);
        }
        break;
      case '낙상':
      case 'Fall':
        if (settings.enableEmergencyAlerts) {
          this.playEmergencySound(false);
        }
        break;
      case '응급':
      case 'Emergency':
        if (settings.enableEmergencyAlerts) {
          this.playEmergencySound(true);
        }
        break;
    }
  }

  // 🆕 알림 설정 가져오기
  getNotificationSettings() {
    try {
      const saved = localStorage.getItem('notificationSettings');
      return saved ? JSON.parse(saved) : {
        masterVolume: 0.3,
        enableStateChangeAlerts: true,
        enableConnectionAlerts: true,
        enableEmergencyAlerts: true,
        emergencyVolume: 0.5,
        stateChangeVolume: 0.2,
        connectionVolume: 0.1
      };
    } catch (error) {
      console.warn('알림 설정 로드 실패:', error);
      return {
        masterVolume: 0.3,
        enableStateChangeAlerts: true,
        enableConnectionAlerts: true,
        enableEmergencyAlerts: true,
        emergencyVolume: 0.5,
        stateChangeVolume: 0.2,
        connectionVolume: 0.1
      };
    }
  }

  // 🔧 MODIFIED: 연결 상태별 알림음에 설정 적용
  playConnectionSound(type) {
    const settings = this.getNotificationSettings();
    if (!settings.enableConnectionAlerts) return;
    
    const volume = settings.masterVolume * settings.connectionVolume;
    this.playNotificationSound(type, volume);
  }

  // IMU 데이터 전송 (센서 데이터 형식)
  sendImuData(accelX, accelY, accelZ, gyroX, gyroY, gyroZ) {
    const timestamp = new Date().getTime() / 1000; // 초 단위로 변환
    const data = {
      timestamp: timestamp,
      accel: {
        x: accelX,
        y: accelY,
        z: accelZ
      },
      gyro: {
        x: gyroX,
        y: gyroY,
        z: gyroZ
      }
    };
    this.send(data);
  }

  // 이벤트 전송 (예: 낙상 감지)
  sendEvent(eventType, details = {}) {
    const data = {
      event: eventType,
      timestamp: new Date().getTime() / 1000,
      ...details
    };
    this.send(data);
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    
    if (callback) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    } else {
      delete this.listeners[event];
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  // 🆕 브라우저 알림 권한 요청
  async requestNotificationPermission() {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('알림 권한:', permission);
        return permission === 'granted';
      }
      return Notification.permission === 'granted';
    }
    return false;
  }

  // 🆕 낙상 알림 처리
  handleFallAlert(data) {
    console.log('🚨 낙상 알림 처리:', data);
    
    // 1. 브라우저 알림
    this.showEmergencyAlert({
      ...data.data,
      alertType: 'fall_detected',
      title: '🚨 낙상 감지!',
      message: data.data.message || '낙상이 감지되었습니다!',
      timestamp: data.data.timestamp || new Date().toISOString()
    });

    // 2. 개별 이벤트 발생
    this.emit('fall_detected', data);
    this.emit('show_emergency_modal', {
      ...data.data,
      alertType: 'fall_detected',
      title: '🚨 낙상 감지!',
      severity: 'high'
    });
  }

  // 🆕 응급상황 처리
  handleEmergencyCritical(data) {
    console.log('🚨 응급상황 처리:', data);
    
    // 1. 강력한 브라우저 알림
    this.showCriticalAlert({
      ...data.data,
      alertType: 'emergency_critical',
      title: '🚨 응급상황!',
      message: data.data.message || '응급상황이 발생했습니다!',
      timestamp: data.data.timestamp || new Date().toISOString()
    });

    // 2. 개별 이벤트 발생
    this.emit('emergency_critical', data);
    this.emit('show_critical_modal', {
      ...data.data,
      alertType: 'emergency_critical',
      title: '🚨 응급상황!',
      severity: 'critical'
    });
  }

  // 🆕 응급상황 해제 처리
  handleEmergencyResolved(data) {
    console.log('✅ 응급상황 해제:', data);
    this.emit('emergency_resolved', data);
  }

  // 🆕 응급상황 확정 처리
  handleEmergencyConfirmedCritical(data) {
    console.log('🚨 응급상황 확정:', data);
    this.emit('emergency_confirmed_critical', data);
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
