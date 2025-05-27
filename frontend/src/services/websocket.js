class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }

  connect(userId) {
    const wsUrl = `ws://localhost:8000/ws/${userId}`;
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket 연결됨');
      this.emit('connected');
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // 이벤트 타입이 있으면 구체적인 이벤트 발생
        if (data.type === 'notification') {
          // 특별 이벤트 처리 (예: 낙상 감지)
          this.emit(data.event, data);
          
          // UI 알림을 위한 notification 이벤트도 발생
          this.emit('notification', data);
        }
        
        // 일반 메시지 이벤트는 항상 발생
        this.emit('message', data);
      } catch (error) {
        console.error('WebSocket 메시지 파싱 오류:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket 연결 해제됨');
      this.emit('disconnected');
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket 오류:', error);
      this.emit('error', error);
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
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
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

export const websocketService = new WebSocketService();
