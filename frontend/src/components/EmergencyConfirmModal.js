import React, { useState, useEffect } from 'react';
import './EmergencyConfirmModal.css';

const EmergencyConfirmModal = ({ 
  isVisible, 
  alertData, 
  onConfirmOk, 
  onConfirmNotOk, 
  onTimeExpired,
  countdownSeconds = 15 
}) => {
  const [countdown, setCountdown] = useState(countdownSeconds);
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setCountdown(countdownSeconds);
      setIsResponding(false);
      return;
    }

    // 카운트다운 타이머
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, countdownSeconds, onTimeExpired]);

  useEffect(() => {
    if (isVisible) {
      // 응급 알림음 재생
      try {
        const audio = new Audio('/sounds/emergency-alert.wav');
        audio.volume = 0.7;
        audio.loop = true;
        audio.play().catch(console.warn);
        
        return () => {
          audio.pause();
          audio.currentTime = 0;
        };
      } catch (error) {
        console.warn('응급 알림음 재생 실패:', error);
      }
    }
  }, [isVisible]);

  const handleConfirmOk = () => {
    setIsResponding(true);
    setTimeout(() => {
      onConfirmOk();
    }, 500);
  };

  const handleConfirmNotOk = () => {
    setIsResponding(true);
    setTimeout(() => {
      onConfirmNotOk();
    }, 500);
  };

  if (!isVisible || !alertData) {
    return null;
  }

  return (
    <div className="emergency-confirm-overlay">
      <div className="emergency-confirm-modal">
        {/* 챗봇 스타일 헤더 */}
        <div className="chatbot-header">
          <div className="chatbot-avatar">🤖</div>
          <div className="chatbot-info">
            <div className="chatbot-name">WalkerHolic Assistant</div>
            <div className="chatbot-status">응급상황 확인 중...</div>
          </div>
          <div className="countdown-display">
            <span className="countdown-number">{countdown}</span>
            <span className="countdown-label">초</span>
          </div>
        </div>

        {/* 챗봇 대화 영역 */}
        <div className="chatbot-conversation">
          {/* 시스템 메시지 */}
          <div className="message system-message">
            <div className="message-avatar">⚠️</div>
            <div className="message-content">
              <div className="message-text">
                낙상이 감지되었습니다!
              </div>
              <div className="message-time">
                {new Date(alertData.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* 챗봇 질문 */}
          <div className="message bot-message">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="message-text">
                안녕하세요! 낙상이 감지되었는데 괜찮으신가요?<br/>
                <strong>{countdown}초</strong> 후에 자동으로 응급상황으로 처리됩니다.
              </div>
              <div className="message-details">
                <div className="detail-item">
                  <span>📍 위치:</span> 
                  <span>{alertData.user_id}</span>
                </div>
                <div className="detail-item">
                  <span>🎯 신뢰도:</span> 
                  <span>{Math.round((alertData.confidence_score || 0.95) * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 응답 버튼 */}
        <div className="response-buttons">
          <button 
            className="response-btn ok-btn"
            onClick={handleConfirmOk}
            disabled={isResponding || countdown <= 0}
          >
            <span className="btn-icon">✅</span>
            <span className="btn-text">네, 괜찮습니다</span>
          </button>
          
          <button 
            className="response-btn not-ok-btn"
            onClick={handleConfirmNotOk}
            disabled={isResponding || countdown <= 0}
          >
            <span className="btn-icon">🆘</span>
            <span className="btn-text">도움이 필요해요</span>
          </button>
        </div>

        {/* 진행 상태 */}
        <div className="progress-section">
          <div className="progress-bar-container">
            <div 
              className="progress-bar"
              style={{ 
                width: `${((countdownSeconds - countdown) / countdownSeconds) * 100}%` 
              }}
            ></div>
          </div>
          <div className="progress-text">
            {countdown > 0 ? 
              `${countdown}초 후 자동 응급상황 처리` : 
              '응급상황 처리 중...'
            }
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="emergency-notice">
          <div className="notice-icon">💡</div>
          <div className="notice-text">
            응답이 없으면 자동으로 응급 상황으로 처리되어 보호자에게 알림이 전송됩니다.
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyConfirmModal; 