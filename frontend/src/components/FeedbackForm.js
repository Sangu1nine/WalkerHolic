import React, { useState } from 'react';
import { apiService } from '../services/api';

// MODIFIED [2025-01-27]: 새로운 피드백 컴포넌트 생성 - 사용자 피드백 수집
const FeedbackForm = ({ userId, analysisId, onSubmitSuccess }) => {
  const [feedback, setFeedback] = useState({
    feedback_type: 'accuracy',
    rating: 5,
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const feedbackTypes = {
    'accuracy': '정확도',
    'usefulness': '유용성',
    'general': '일반'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      setSubmitMessage('사용자 ID가 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const feedbackData = {
        user_id: userId,
        analysis_id: analysisId,
        feedback_type: feedback.feedback_type,
        rating: parseInt(feedback.rating),
        comment: feedback.comment.trim() || null
      };

      await apiService.submitFeedback(feedbackData);
      
      setSubmitMessage('피드백이 성공적으로 제출되었습니다!');
      
      // 폼 초기화
      setFeedback({
        feedback_type: 'accuracy',
        rating: 5,
        comment: ''
      });

      // 성공 콜백 호출
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }

    } catch (error) {
      console.error('피드백 제출 실패:', error);
      setSubmitMessage('피드백 제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFeedback(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map(star => (
      <span
        key={star}
        className={`star ${star <= feedback.rating ? 'filled' : ''}`}
        onClick={() => handleInputChange('rating', star)}
        style={{
          cursor: 'pointer',
          fontSize: '24px',
          color: star <= feedback.rating ? '#FFD700' : '#DDD',
          marginRight: '5px'
        }}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="feedback-form">
      <h3>분석 결과 피드백</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="feedback-type">피드백 유형:</label>
          <select
            id="feedback-type"
            value={feedback.feedback_type}
            onChange={(e) => handleInputChange('feedback_type', e.target.value)}
            disabled={isSubmitting}
          >
            {Object.entries(feedbackTypes).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>평점:</label>
          <div className="rating-stars">
            {renderStars()}
            <span className="rating-text">({feedback.rating}/5)</span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="comment">의견 (선택사항):</label>
          <textarea
            id="comment"
            value={feedback.comment}
            onChange={(e) => handleInputChange('comment', e.target.value)}
            placeholder="분석 결과에 대한 의견을 자유롭게 작성해주세요..."
            rows="4"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="submit-button"
          >
            {isSubmitting ? '제출 중...' : '피드백 제출'}
          </button>
        </div>

        {submitMessage && (
          <div className={`submit-message ${submitMessage.includes('성공') ? 'success' : 'error'}`}>
            {submitMessage}
          </div>
        )}
      </form>
    </div>
  );
};

export default FeedbackForm; 