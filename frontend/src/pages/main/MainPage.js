import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HealthInfo from '../../components/HealthInfo';
import AnalysisResults from '../../components/analysis/AnalysisResults';
import HardwareStatus from '../../components/HardwareStatus';
import { apiService } from '../../services/api';
import { websocketService } from '../../services/websocket';
import './MainPage.css';

const MainPage = () => {
  const [userId] = useState(localStorage.getItem('userId') || 'demo_user');
  const [userName] = useState(localStorage.getItem('userName') || 'Demo User');
  const [healthInfo, setHealthInfo] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 사용자 데이터 로드
    loadUserData();
    
    // WebSocket 연결
    websocketService.connect(userId);
    websocketService.on('connected', () => setIsConnected(true));
    websocketService.on('disconnected', () => setIsConnected(false));
    websocketService.on('message', handleWebSocketMessage);

    return () => {
      websocketService.disconnect();
    };
  }, [userId]);

  const loadUserData = async () => {
    try {
      const [healthResponse, historyResponse] = await Promise.all([
        apiService.getUserHealthInfo(userId),
        apiService.getAnalysisHistory(userId)
      ]);
      
      setHealthInfo(healthResponse.data);
      setAnalysisHistory(historyResponse.data);
    } catch (error) {
      console.error('사용자 데이터 로드 실패:', error);
    }
  };

  const handleWebSocketMessage = (data) => {
    if (data.analysis_result) {
      // 새로운 분석 결과 추가
      setAnalysisHistory(prev => [data.analysis_result, ...prev]);
    }
  };

  const handleCognitiveTest = async () => {
    setIsTestRunning(true);
    try {
      const result = await apiService.runCognitiveTest(userId);
      setTestResults({
        type: 'cognitive',
        data: result.result
      });
      console.log('인지기능 테스트 완료:', result);
    } catch (error) {
      console.error('인지기능 테스트 실패:', error);
      alert('인지기능 테스트 중 오류가 발생했습니다.');
    } finally {
      setIsTestRunning(false);
    }
  };

  const handleFallRiskTest = async () => {
    setIsTestRunning(true);
    try {
      const result = await apiService.runFallRiskTest(userId);
      setTestResults({
        type: 'fall_risk',
        data: result.result
      });
      console.log('낙상 위험도 테스트 완료:', result);
    } catch (error) {
      console.error('낙상 위험도 테스트 실패:', error);
      alert('낙상 위험도 테스트 중 오류가 발생했습니다.');
    } finally {
      setIsTestRunning(false);
    }
  };

  const menuItems = [
    {
      title: '건강 정보',
      description: '개인 건강 정보 관리',
      icon: '🏥',
      onClick: () => navigate('/health-info')
    },
    {
      title: '보행 분석 결과',
      description: '최근 보행 분석 결과',
      icon: '📊',
      onClick: () => navigate('/analysis')
    },
    {
      title: '인지기능 테스트',
      description: '인지능력 평가 테스트',
      icon: '🧠',
      onClick: handleCognitiveTest,
      disabled: isTestRunning
    },
    {
      title: '낙상 위험도 테스트',
      description: '낙상 위험도 평가',
      icon: '⚠️',
      onClick: handleFallRiskTest,
      disabled: isTestRunning
    },
    {
      title: '하드웨어 정보',
      description: '연결된 기기 상태',
      icon: '⚙️',
      onClick: () => navigate('/hardware')
    },
    {
      title: '챗봇 모드',
      description: 'AI 상담 및 대화',
      icon: '💬',
      onClick: () => navigate('/chat')
    },
    {
      title: '설정',
      description: '앱 설정 및 환경설정',
      icon: '⚙️',
      onClick: () => navigate('/settings')
    }
  ];

  return (
    <div className="main-container">
      <header className="main-header">
        <h1>보행 분석 시스템</h1>
        <div className="user-info">
          <span>환영합니다, {userName}님</span>
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '연결됨' : '연결 해제됨'}
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="dashboard-section">
          <div className="dashboard-card">
            <HealthInfo healthInfo={healthInfo} />
          </div>
          
          <div className="dashboard-card">
            <AnalysisResults history={analysisHistory} />
          </div>
          
          <div className="dashboard-card">
            <HardwareStatus isConnected={isConnected} />
          </div>
        </div>

        <div className="menu-section">
          <h2>메뉴</h2>
          <div className="menu-grid">
            {menuItems.map((item, index) => (
              <div 
                key={index} 
                className={`menu-item ${item.disabled ? 'disabled' : ''}`} 
                onClick={item.disabled ? undefined : item.onClick}
              >
                <div className="menu-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                {item.disabled && <div className="loading-overlay">테스트 진행 중...</div>}
              </div>
            ))}
          </div>
        </div>

        {/* 테스트 결과 표시 */}
        {testResults && (
          <div className="test-results-section">
            <h2>테스트 결과</h2>
            <div className="test-result-card">
              {testResults.type === 'cognitive' ? (
                <div className="cognitive-result">
                  <h3>인지기능 테스트 결과</h3>
                  <div className="overall-score">
                    <span className="score-label">종합 점수:</span>
                    <span className={`score-value ${testResults.data.risk_level}`}>
                      {testResults.data.overall_score}점
                    </span>
                    <span className={`risk-level ${testResults.data.risk_level}`}>
                      ({testResults.data.risk_level === 'normal' ? '정상' :
                        testResults.data.risk_level === 'mild' ? '경미' :
                        testResults.data.risk_level === 'moderate' ? '보통' : '심각'})
                    </span>
                  </div>
                  <div className="detailed-scores">
                    <h4>세부 점수</h4>
                    <div className="score-grid">
                      <div className="score-item">
                        <span>기억력:</span>
                        <span>{testResults.data.scores.memory}점</span>
                      </div>
                      <div className="score-item">
                        <span>주의력:</span>
                        <span>{testResults.data.scores.attention}점</span>
                      </div>
                      <div className="score-item">
                        <span>실행기능:</span>
                        <span>{testResults.data.scores.executive_function}점</span>
                      </div>
                      <div className="score-item">
                        <span>언어능력:</span>
                        <span>{testResults.data.scores.language}점</span>
                      </div>
                      <div className="score-item">
                        <span>시공간능력:</span>
                        <span>{testResults.data.scores.visuospatial}점</span>
                      </div>
                    </div>
                  </div>
                  <div className="recommendations">
                    <h4>권장사항</h4>
                    <ul>
                      {testResults.data.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="fall-risk-result">
                  <h3>낙상 위험도 테스트 결과</h3>
                  <div className="overall-risk">
                    <span className="risk-label">위험도:</span>
                    <span className={`risk-value ${testResults.data.risk_level}`}>
                      {testResults.data.risk_level === 'low' ? '낮음' :
                       testResults.data.risk_level === 'medium' ? '보통' : '높음'}
                    </span>
                    <span className="risk-score">
                      (점수: {testResults.data.overall_risk_score})
                    </span>
                  </div>
                  <div className="detailed-assessments">
                    <h4>세부 평가</h4>
                    <div className="assessment-grid">
                      <div className="assessment-item">
                        <span>균형감각:</span>
                        <span>{testResults.data.assessments.balance}점</span>
                      </div>
                      <div className="assessment-item">
                        <span>보행 안정성:</span>
                        <span>{testResults.data.assessments.gait_stability}점</span>
                      </div>
                      <div className="assessment-item">
                        <span>근력:</span>
                        <span>{testResults.data.assessments.muscle_strength}점</span>
                      </div>
                      <div className="assessment-item">
                        <span>반응시간:</span>
                        <span>{testResults.data.assessments.reaction_time}점</span>
                      </div>
                      <div className="assessment-item">
                        <span>시력:</span>
                        <span>{testResults.data.assessments.vision}점</span>
                      </div>
                    </div>
                  </div>
                  <div className="recommendations">
                    <h4>권장사항</h4>
                    <ul>
                      {testResults.data.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              <button 
                className="close-result-btn"
                onClick={() => setTestResults(null)}
              >
                결과 닫기
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MainPage;
