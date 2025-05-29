import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HealthInfo from '../../components/HealthInfo';
import AnalysisResults from '../../components/analysis/AnalysisResults';
import HardwareStatus from '../../components/HardwareStatus';
import EmergencyAlert from '../../components/EmergencyAlert';
import EmergencyConfirmModal from '../../components/EmergencyConfirmModal';
import UserStatusDisplay from '../../components/UserStatusDisplay';
import { apiService } from '../../services/api';
import websocketService from '../../services/websocket';
import './MainPage.css';

const MainPage = () => {
  const { userId = 'demo_user' } = useParams();
  const navigate = useNavigate();
  
  const [userName, setUserName] = useState('');
  const [healthInfo, setHealthInfo] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  
  // 🆕 응급상황 알림 state 추가
  const [emergencyAlert, setEmergencyAlert] = useState({
    isVisible: false,
    alertData: null
  });
  
  // 🆕 응급상황 확인 모달 state 추가 (챗봇 스타일)
  const [emergencyConfirm, setEmergencyConfirm] = useState({
    isVisible: false,
    alertData: null
  });
  
  // 🆕 사용자 상태 모니터링 state 추가
  const [userState, setUserState] = useState({
    current_state: 'unknown',
    is_connected: false,
    last_update: null,
    emergency_status: null
  });

  const loadUserData = useCallback(async () => {
    try {
      const [healthResponse, historyResponse] = await Promise.all([
        apiService.getUserHealthInfo(userId),
        apiService.getAnalysisHistory(userId)
      ]);
      
      setHealthInfo(healthResponse.data);
      setAnalysisHistory(historyResponse.data);
      
      // 사용자 이름 설정
      if (healthResponse.data && healthResponse.data.name) {
        setUserName(healthResponse.data.name);
      } else {
        setUserName(userId === 'demo_user' ? 'Demo User' : `User ${userId}`);
      }
    } catch (error) {
      console.error('사용자 데이터 로드 실패:', error);
      // 오류 시 기본 이름 설정
      setUserName(userId === 'demo_user' ? 'Demo User' : `User ${userId}`);
    }
  }, [userId]);

  useEffect(() => {
    websocketService.requestNotificationPermission();
    
    loadUserData();
    
    websocketService.connect(userId);
    websocketService.on('connected', () => {
      setIsConnected(true);
      setUserState(prev => ({ ...prev, is_connected: true }));
    });
    websocketService.on('disconnected', () => {
      setIsConnected(false);
      setUserState(prev => ({ ...prev, is_connected: false }));
    });
    websocketService.on('message', handleWebSocketMessage);
    
    // 🆕 응급상황 이벤트 리스너 추가
    websocketService.on('fall_detected', handleFallDetected);
    websocketService.on('emergency_critical', handleEmergencyCritical);
    websocketService.on('show_emergency_modal', showEmergencyModal);
    websocketService.on('show_critical_modal', showCriticalModal);
    
    // 🆕 사용자 상태 업데이트 리스너 추가
    websocketService.on('user_state_update', handleUserStateUpdate);

    return () => {
      websocketService.off('fall_detected', handleFallDetected);
      websocketService.off('emergency_critical', handleEmergencyCritical);
      websocketService.off('show_emergency_modal', showEmergencyModal);
      websocketService.off('show_critical_modal', showCriticalModal);
      websocketService.off('user_state_update', handleUserStateUpdate);
      websocketService.disconnect();
    };
  }, [userId, loadUserData]);

  const handleWebSocketMessage = (data) => {
    if (data.analysis_result) {
      // 새로운 분석 결과 추가
      setAnalysisHistory(prev => [data.analysis_result, ...prev]);
    }
  };

  const handleFallDetected = (data) => {
    console.log('🚨 낙상 감지됨:', data);
    
    // 🆕 사용자 상태를 낙상으로 업데이트
    setUserState(prev => ({
      ...prev,
      current_state: 'fall',
      emergency_status: '낙상 감지됨 - 확인 대기 중',
      last_update: new Date().toISOString()
    }));
    
    // 🆕 챗봇 확인 모달 표시 (기존 응급 모달 대신)
    setEmergencyConfirm({
      isVisible: true,
      alertData: {
        ...data.data,
        timestamp: data.data.timestamp || new Date().toISOString(),
        user_id: userId
      }
    });
    
    // 분석 히스토리에 낙상 이벤트 추가
    const fallEvent = {
      timestamp: data.data.timestamp || new Date().getTime() / 1000,
      gait_pattern: '낙상 감지',
      similarity_score: data.data.confidence_score || 0.95,
      health_assessment: '높음',
      analysis_type: 'fall_detection',
      emergency_level: data.data.emergency_level || 'HIGH'
    };
    
    setAnalysisHistory(prev => [fallEvent, ...prev]);
  };

  const handleEmergencyCritical = (data) => {
    console.log('🚨 응급상황 발생:', data);
    
    // 🆕 사용자 상태를 응급상황으로 업데이트
    setUserState(prev => ({
      ...prev,
      current_state: 'fall',
      emergency_status: '응급상황 발생',
      last_update: new Date().toISOString()
    }));
    
    // 중요한 응급상황의 경우 추가적인 UI 반응
    document.body.style.animation = 'emergency-flash 0.5s ease-in-out 3';
    
    // 분석 히스토리에 응급상황 이벤트 추가
    const emergencyEvent = {
      timestamp: data.data.timestamp || new Date().getTime() / 1000,
      gait_pattern: '응급상황',
      similarity_score: 1.0,
      health_assessment: '매우 높음',
      analysis_type: 'emergency',
      emergency_level: 'CRITICAL'
    };
    
    setAnalysisHistory(prev => [emergencyEvent, ...prev]);
  };

  const showEmergencyModal = (alertData) => {
    setEmergencyAlert({
      isVisible: true,
      alertData: {
        ...alertData,
        timestamp: alertData.timestamp || new Date().getTime() / 1000
      }
    });
  };

  const showCriticalModal = (alertData) => {
    setEmergencyAlert({
      isVisible: true,
      alertData: {
        ...alertData,
        timestamp: alertData.timestamp || new Date().getTime() / 1000
      }
    });
  };

  const handleEmergencyClose = () => {
    setEmergencyAlert({
      isVisible: false,
      alertData: null
    });
    
    // 애니메이션 효과 제거
    document.body.style.animation = '';
  };

  const handleCallEmergency = () => {
    // 119 응급전화 걸기
    window.open('tel:119');
    
    // 응급상황 로그 기록
    console.log('🚨 응급전화 연결:', {
      userId,
      timestamp: new Date().toISOString(),
      alertData: emergencyAlert.alertData
    });
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

  // 🆕 사용자 상태 업데이트 핸들러
  const handleUserStateUpdate = (data) => {
    console.log('📊 사용자 상태 업데이트 수신:', data);
    
    if (data.data && data.data.user_state) {
      const stateInfo = data.data.user_state;
      
      setUserState(prev => ({
        ...prev,
        current_state: stateInfo.current_state || prev.current_state,
        is_connected: true,
        last_update: new Date().toISOString(),
        emergency_status: null // 일반 상태 업데이트에서는 응급상황 클리어
      }));
    } else if (data.data) {
      // 일반 데이터에서 상태 정보 추출
      setUserState(prev => ({
        ...prev,
        is_connected: true,
        last_update: new Date().toISOString()
      }));
    }
  };

  // 🆕 사용자가 "괜찮다"고 응답했을 때
  const handleEmergencyConfirmOk = async () => {
    try {
      // 응급상황 해제 API 호출
      await apiService.resolveEmergency(userId, {
        resolution_type: 'user_ok',
        user_response: '괜찮습니다',
        timestamp: new Date().toISOString()
      });

      // 모달 닫기
      setEmergencyConfirm({
        isVisible: false,
        alertData: null
      });

      // 사용자 상태 업데이트
      setUserState(prev => ({
        ...prev,
        current_state: 'daily',
        emergency_status: null,
        last_update: new Date().toISOString()
      }));

      console.log('✅ 응급상황 해제됨 - 사용자가 괜찮다고 응답');
      
    } catch (error) {
      console.error('응급상황 해제 실패:', error);
      alert('응급상황 해제 중 오류가 발생했습니다.');
    }
  };

  // 🆕 사용자가 "도움이 필요하다"고 응답했을 때
  const handleEmergencyConfirmNotOk = async () => {
    try {
      // 즉시 응급상황 확정 API 호출
      const response = await apiService.confirmHelpNeeded(userId, {
        help_type: 'general_help',
        user_response: '도움이 필요합니다',
        timestamp: new Date().toISOString()
      });

      // 확인 모달 닫기
      setEmergencyConfirm({
        isVisible: false,
        alertData: null
      });

      // 즉시 응급 모달 표시
      setEmergencyAlert({
        isVisible: true,
        alertData: {
          ...emergencyConfirm.alertData,
          emergency_level: 'CRITICAL',
          message: '🚨 사용자가 도움을 요청했습니다!',
          auto_call_emergency: response.data.auto_call_emergency
        }
      });

      // 사용자 상태 업데이트
      setUserState(prev => ({
        ...prev,
        current_state: 'fall',
        emergency_status: '응급상황 확정 - 도움 요청됨',
        last_update: new Date().toISOString()
      }));

      console.log('🚨 응급상황 확정됨 - 사용자가 도움 요청');

    } catch (error) {
      console.error('응급상황 확정 실패:', error);
      alert('응급상황 처리 중 오류가 발생했습니다.');
    }
  };

  // 🆕 15초 타임아웃 시 자동 응급상황 처리
  const handleEmergencyTimeExpired = () => {
    console.log('⏰ 응급상황 타임아웃 - 자동 응급상황 처리');
    
    // 확인 모달 닫기
    setEmergencyConfirm({
      isVisible: false,
      alertData: null
    });

    // 응급상황 모달 표시
    setEmergencyAlert({
      isVisible: true,
      alertData: {
        ...emergencyConfirm.alertData,
        emergency_level: 'CRITICAL',
        message: '🚨 응답 시간 초과로 응급상황이 자동 처리됩니다!',
        timeout_triggered: true
      }
    });

    // 사용자 상태 업데이트
    setUserState(prev => ({
      ...prev,
      current_state: 'fall',
      emergency_status: '응급상황 - 자동 처리됨',
      last_update: new Date().toISOString()
    }));
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
        {/* 🆕 개선된 사용자 상태 표시 */}
        <div className="user-status-section">
          <div className="status-card">
            <h3>📊 현재 상태</h3>
            <div className="status-info">
              <div className={`status-indicator ${userState.current_state}`}>
                {userState.current_state === 'walking' && '🚶‍♂️ 보행 중'}
                {userState.current_state === 'daily' && '🏠 일상생활'}
                {userState.current_state === 'fall' && '🚨 낙상 감지'}
                {userState.current_state === 'unknown' && '❓ 상태 확인 중'}
              </div>
              <div className={`connection-indicator ${userState.is_connected ? 'connected' : 'disconnected'}`}>
                {userState.is_connected ? '🟢 연결됨' : '🔴 연결 해제됨'}
              </div>
              {userState.emergency_status && (
                <div className="emergency-status">
                  🚨 {userState.emergency_status}
                </div>
              )}
              {userState.last_update && (
                <div className="last-update">
                  마지막 업데이트: {new Date(userState.last_update).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <UserStatusDisplay userId={userId} />
        
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

      {/* 응급상황 알림 모달 */}
      <EmergencyAlert
        isVisible={emergencyAlert.isVisible}
        alertData={emergencyAlert.alertData}
        onClose={handleEmergencyClose}
        onCallEmergency={handleCallEmergency}
      />

      {/* 🆕 응급상황 확인 모달 (챗봇 스타일) */}
      <EmergencyConfirmModal
        isVisible={emergencyConfirm.isVisible}
        alertData={emergencyConfirm.alertData}
        onConfirmOk={handleEmergencyConfirmOk}
        onConfirmNotOk={handleEmergencyConfirmNotOk}
        onTimeExpired={handleEmergencyTimeExpired}
        countdownSeconds={15}
      />
    </div>
  );
};

export default MainPage;
