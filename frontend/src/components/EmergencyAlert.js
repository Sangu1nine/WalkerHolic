import React, { useEffect } from 'react';
import './EmergencyAlert.css';

const EmergencyAlert = ({ isVisible, alertData, onClose, onCallEmergency }) => {
  useEffect(() => {
    if (isVisible) {
      // 응급상황 모달이 열릴 때 브라우저 포커스
      window.focus();
      
      // 화면 깜빡임 효과
      document.body.classList.add('emergency-active');
      
      // 응급상황 소리 효과 (옵션)
      try {
        const audio = new Audio('/sounds/emergency-alert.mp3');
        audio.volume = 0.5;
        audio.play().catch(console.warn);
      } catch (error) {
        console.warn('응급상황 소리 재생 실패:', error);
      }
    } else {
      document.body.classList.remove('emergency-active');
    }
    
    return () => {
      document.body.classList.remove('emergency-active');
    };
  }, [isVisible]);

  if (!isVisible || !alertData) {
    return null;
  }

  const isEmergency = alertData.emergency_level === 'CRITICAL';
  const timestamp = alertData.timestamp 
    ? new Date(alertData.timestamp).toLocaleString() 
    : new Date().toLocaleString();

  return (
    <div className={`emergency-modal-overlay ${isEmergency ? 'critical' : 'alert'}`}>
      <div className={`emergency-modal ${isEmergency ? 'critical' : 'alert'}`}>
        <div className="emergency-header">
          <div className="emergency-icon">
            {isEmergency ? '🚨' : '⚠️'}
          </div>
          <h2 className="emergency-title">
            {isEmergency ? '응급상황 발생!' : '낙상 감지!'}
          </h2>
        </div>
        
        <div className="emergency-content">
          <div className="alert-message">
            {alertData.message}
          </div>
          
          <div className="alert-details">
            <div className="detail-item">
              <span className="detail-label">사용자:</span>
              <span className="detail-value">{alertData.user_id}</span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">발생 시간:</span>
              <span className="detail-value">{timestamp}</span>
            </div>
            
            {alertData.confidence_score && (
              <div className="detail-item">
                <span className="detail-label">신뢰도:</span>
                <span className="detail-value">
                  {Math.round(alertData.confidence_score * 100)}%
                </span>
              </div>
            )}
            
            {alertData.duration_seconds && (
              <div className="detail-item">
                <span className="detail-label">지속 시간:</span>
                <span className="detail-value">
                  {alertData.duration_seconds}초
                </span>
              </div>
            )}
            
            <div className="detail-item">
              <span className="detail-label">위험 수준:</span>
              <span className={`detail-value risk-level ${alertData.emergency_level?.toLowerCase()}`}>
                {alertData.emergency_level === 'CRITICAL' ? '매우 높음' : 
                 alertData.emergency_level === 'HIGH' ? '높음' : 
                 alertData.emergency_level === 'MEDIUM' ? '보통' : '낮음'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="emergency-actions">
          {isEmergency && (
            <button 
              className="emergency-call-btn"
              onClick={onCallEmergency}
            >
              🚑 119 신고
            </button>
          )}
          
          <button 
            className="emergency-confirm-btn"
            onClick={onClose}
          >
            {isEmergency ? '상황 확인됨' : '알림 확인'}
          </button>
        </div>
        
        <div className="emergency-footer">
          <small>
            이 알림은 자동으로 생성되었습니다. 
            {isEmergency ? ' 즉시 상황을 확인하고 필요시 응급전화를 이용하세요.' : 
                         ' 사용자의 상태를 확인해주세요.'}
          </small>
        </div>
      </div>
    </div>
  );
};

export default EmergencyAlert; 