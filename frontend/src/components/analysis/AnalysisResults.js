import React from 'react';

const AnalysisResults = ({ history }) => {
  const defaultHistory = [
    {
      timestamp: '2025-05-22T10:30:00',
      gait_pattern: '정상보행',
      similarity_score: 0.85,
      health_assessment: '낮음'
    },
    {
      timestamp: '2025-05-22T09:15:00',
      gait_pattern: '정상보행',
      similarity_score: 0.82,
      health_assessment: '낮음'
    }
  ];

  const results = history && history.length > 0 ? history : defaultHistory;

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return '#4CAF50'; // 녹색
    if (score >= 0.6) return '#FF9800'; // 주황
    return '#F44336'; // 빨강
  };

  return (
    <div className="analysis-results">
      <h3>최근 보행 분석 결과</h3>
      {results.length === 0 ? (
        <p className="no-data">분석 결과가 없습니다.</p>
      ) : (
        <div className="results-list">
          {results.slice(0, 5).map((result, index) => (
            <div key={index} className="result-item">
              <div className="result-header">
                <span className="timestamp">{formatTime(result.timestamp)}</span>
                <span 
                  className="score"
                  style={{ color: getScoreColor(result.similarity_score) }}
                >
                  {(result.similarity_score * 100).toFixed(0)}%
                </span>
              </div>
              <div className="result-details">
                <span className="pattern">패턴: {result.gait_pattern}</span>
                <span className="assessment">위험도: {result.health_assessment}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnalysisResults;
