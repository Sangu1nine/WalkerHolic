import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API 함수들
export const apiService = {
  // 건강정보 조회
  getUserHealthInfo: async (userId) => {
    const response = await api.get(`/api/user/${userId}/health-info`);
    return response.data;
  },

  // MODIFIED [2025-01-27]: 새로운 API 함수들 추가 - 대시보드, 알림, 피드백
  // 대시보드 데이터 조회
  getUserDashboard: async (userId) => {
    const response = await api.get(`/api/user/${userId}/dashboard`);
    return response.data;
  },

  // 알림 조회
  getUserNotifications: async (userId, unreadOnly = false) => {
    const response = await api.get(`/api/user/${userId}/notifications`, {
      params: { unread_only: unreadOnly }
    });
    return response.data;
  },

  // 알림 읽음 처리
  markNotificationRead: async (notificationId) => {
    const response = await api.put(`/api/notifications/${notificationId}/read`);
    return response.data;
  },

  // 피드백 제출
  submitFeedback: async (feedback) => {
    const response = await api.post('/api/feedback', feedback);
    return response.data;
  },

  // 분석 상세 정보 조회
  getAnalysisDetails: async (analysisId) => {
    const response = await api.get(`/api/analysis/${analysisId}/details`);
    return response.data;
  },

  // 분석 히스토리 조회 (개선됨)
  getAnalysisHistory: async (userId, limit = 10) => {
    const response = await api.get(`/api/user/${userId}/analysis-history`, {
      params: { limit }
    });
    return response.data;
  },

  // IMU 데이터 전송
  sendIMUData: async (data) => {
    const response = await api.post('/api/imu-data', data);
    return response.data;
  },

  // 임베딩 데이터 전송
  sendEmbeddingData: async (userId, embeddingData) => {
    const response = await api.post('/api/embedding-data', {
      user_id: userId,
      embedding_data: embeddingData
    });
    return response.data;
  },

  // 챗봇 메시지 전송
  sendChatMessage: async (message) => {
    console.log('API 호출 시도:', {
      endpoint: `${API_BASE_URL}/api/chat`,
      data: {
        message: message.message,
        user_id: message.user_id
      }
    });
    
    try {
      const response = await api.post('/api/chat', {
        message: message.message,
        user_id: message.user_id
      });
      console.log('API 응답 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('API 호출 실패:', error);
      console.error('에러 응답:', error.response?.data);
      throw error;
    }
  },

  // 서버 상태 확인
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // 인지기능 테스트
  runCognitiveTest: async (userId) => {
    const response = await api.post('/api/cognitive-test', null, {
      params: { user_id: userId }
    });
    return response.data;
  },

  // 낙상 위험도 테스트
  runFallRiskTest: async (userId) => {
    const response = await api.post('/api/fall-risk-test', null, {
      params: { user_id: userId }
    });
    return response.data;
  },

  // 🆕 응급상황 관련 API 메서드들
  // 응급상황 해제 (사용자가 괜찮다고 응답)
  resolveEmergency: async (userId, resolutionData) => {
    const response = await api.post(`/api/walking/emergency/${userId}/resolve`, resolutionData);
    return response.data;
  },

  // 도움 요청 확정 (사용자가 도움이 필요하다고 응답)
  confirmHelpNeeded: async (userId, helpData) => {
    const response = await api.post(`/api/walking/emergency/${userId}/confirm-help-needed`, helpData);
    return response.data;
  },

  // 현재 응급상황 상태 조회
  getCurrentEmergencyStatus: async (userId) => {
    const response = await api.get(`/api/walking/user/${userId}/current-emergency`);
    return response.data;
  },

  // 워킹 모드 사용자 상태 조회
  getWalkingUserStatus: async (userId) => {
    const response = await api.get(`/api/walking/user/${userId}/status`);
    return response.data;
  },

  // 응급상황 모니터링 현황 조회
  getEmergencyMonitor: async () => {
    const response = await api.get('/api/walking/emergency-monitor');
    return response.data;
  },

  // 연결된 사용자 목록 조회
  getConnectedUsers: async () => {
    const response = await api.get('/api/walking/connected-users');
    return response.data;
  },

  // 워킹 시스템 정보 조회
  getWalkingSystemInfo: async () => {
    const response = await api.get('/api/walking/system-info');
    return response.data;
  }
};

export default api;
