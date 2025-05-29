import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

// MODIFIED [2025-01-27]: 새로운 대시보드 컴포넌트 생성 - 종합적인 사용자 정보 표시
const Dashboard = ({ userId }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      loadDashboardData();
      loadNotifications();
    }
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserDashboard(userId);
      setDashboardData(response.data);
    } catch (err) {
      console.error('대시보드 데이터 로드 실패:', err);
      setError('대시보드 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await apiService.getUserNotifications(userId, true); // 읽지 않은 알림만
      setNotifications(response.data || []);
    } catch (err) {
      console.error('알림 로드 실패:', err);
    }
  };

  const handleNotificationClick = async (notificationId) => {
    try {
      await apiService.markNotificationRead(notificationId);
      // 알림 목록 새로고침
      loadNotifications();
    } catch (err) {
      console.error('알림 읽음 처리 실패:', err);
    }
  };

  const getRiskLevelColor = (level) => {
    const colors = {
      '낮음': '#4CAF50',
      '보통': '#FF9800',
      '높음': '#F44336'
    };
    return colors[level] || '#757575';
  };

  const getNotificationPriorityColor = (priority) => {
    const colors = {
      'low': '#4CAF50',
      'normal': '#2196F3',
      'high': '#FF9800',
      'urgent': '#F44336'
    };
    return colors[priority] || '#757575';
  };

  if (loading) {
    return <div className="dashboard-loading">대시보드 로딩 중...</div>;
  }

  if (error) {
    return <div className="dashboard-error">{error}</div>;
  }

  if (!dashboardData) {
    return <div className="dashboard-no-data">대시보드 데이터가 없습니다.</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>{dashboardData.name}님의 건강 대시보드</h2>
        <div className="dashboard-summary">
          <div className="summary-item">
            <span className="label">총 분석 횟수:</span>
            <span className="value">{dashboardData.total_analyses}회</span>
          </div>
          <div className="summary-item">
            <span className="label">평균 유사도:</span>
            <span className="value">
              {dashboardData.avg_similarity_score 
                ? `${(dashboardData.avg_similarity_score * 100).toFixed(1)}%`
                : 'N/A'
              }
            </span>
          </div>
          <div className="summary-item">
            <span className="label">고위험 분석:</span>
            <span className="value" style={{ color: getRiskLevelColor('높음') }}>
              {dashboardData.high_risk_count}회
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h3>기본 정보</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>나이:</label>
              <span>{dashboardData.age}세</span>
            </div>
            <div className="info-item">
              <label>성별:</label>
              <span>{dashboardData.gender}</span>
            </div>
            {dashboardData.bmi && (
              <div className="info-item">
                <label>BMI:</label>
                <span>{dashboardData.bmi.toFixed(1)}</span>
              </div>
            )}
            {dashboardData.activity_level && (
              <div className="info-item">
                <label>활동 수준:</label>
                <span>{dashboardData.activity_level}</span>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-section">
          <h3>최근 분석 정보</h3>
          <div className="analysis-summary">
            {dashboardData.last_analysis ? (
              <div className="last-analysis">
                <span className="label">마지막 분석:</span>
                <span className="value">
                  {new Date(dashboardData.last_analysis).toLocaleString('ko-KR')}
                </span>
              </div>
            ) : (
              <div className="no-analysis">아직 분석 기록이 없습니다.</div>
            )}
          </div>
        </div>

        {notifications.length > 0 && (
          <div className="dashboard-section">
            <h3>읽지 않은 알림 ({notifications.length})</h3>
            <div className="notifications-list">
              {notifications.slice(0, 5).map((notification) => (
                <div 
                  key={notification.id} 
                  className="notification-item"
                  onClick={() => handleNotificationClick(notification.id)}
                  style={{ 
                    borderLeft: `4px solid ${getNotificationPriorityColor(notification.priority)}` 
                  }}
                >
                  <div className="notification-header">
                    <span className="notification-title">{notification.title}</span>
                    <span className="notification-time">
                      {new Date(notification.created_at).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <div className="notification-message">
                    {notification.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 