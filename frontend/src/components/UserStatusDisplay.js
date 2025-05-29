import React, { useState, useEffect } from 'react';
import { websocketService } from '../services/websocket';
import './UserStatusDisplay.css';

const UserStatusDisplay = ({ userId }) => {
    const [userState, setUserState] = useState({
        current_state: '알 수 없음',
        state_duration: 0,
        is_connected: false,
        emergency_timer: null,
        last_update: null,
        confidence_score: null
    });
    
    const [connectionStatus, setConnectionStatus] = useState('연결 중...');
    // 🆕 이전 상태 추적 (알림음용)
    const [previousState, setPreviousState] = useState('');
    
    useEffect(() => {
        // WebSocket 이벤트 리스너 등록
        websocketService.on('user_state_update', handleStateUpdate);
        websocketService.on('imu_data_received', handleIMUDataReceived);
        websocketService.on('connected', handleConnectionEstablished);
        websocketService.on('disconnected', handleConnectionLost);
        websocketService.on('error', handleConnectionError);
        
        return () => {
            // 컴포넌트 언마운트 시 이벤트 리스너 제거
            websocketService.off('user_state_update', handleStateUpdate);
            websocketService.off('imu_data_received', handleIMUDataReceived);
            websocketService.off('connected', handleConnectionEstablished);
            websocketService.off('disconnected', handleConnectionLost);
            websocketService.off('error', handleConnectionError);
        };
    }, []);

    // 🆕 상태 변화 감지 및 알림음 재생
    useEffect(() => {
        if (userState.current_state && userState.current_state !== previousState) {
            console.log('🔄 상태 변화 감지:', previousState, '→', userState.current_state);
            
            // 초기 로딩이 아닌 실제 상태 변화인 경우에만 알림음 재생
            if (previousState && previousState !== '알 수 없음') {
                websocketService.handleStateChangeSound(userState.current_state, previousState);
            }
            
            setPreviousState(userState.current_state);
        }
    }, [userState.current_state, previousState]);
    
    const handleStateUpdate = (data) => {
        console.log('상태 업데이트 수신:', data);
        
        // 🔧 MODIFIED: 상태 정보 처리 방식 통합 및 개선
        let stateData = null;
        
        if (data.data) {
            stateData = data.data;
        } else if (data.user_state) {
            stateData = data.user_state;
        } else if (data.current_state) {
            // 직접 상태 정보가 있는 경우
            stateData = data;
        }
        
        if (stateData) {
            // 🆕 상태 값 정규화 - 라즈베리파이에서 오는 영어 상태를 한국어로 변환
            const normalizedState = normalizeStateValue(stateData.current_state);
            
            setUserState(prev => ({
                ...prev,
                current_state: normalizedState,
                state_duration: stateData.state_duration || prev.state_duration,
                is_connected: true,
                last_update: new Date(data.timestamp || stateData.last_update || new Date().toISOString()),
                confidence_score: stateData.confidence_score || stateData.confidence || prev.confidence_score
            }));
            
            console.log('✅ 상태 업데이트 완료:', normalizedState);
        }
    };
    
    const handleIMUDataReceived = (data) => {
        console.log('IMU 데이터 수신:', data);
        
        // 🔧 MODIFIED: IMU 데이터에서 상태 정보 추출 개선 및 통합
        let stateData = null;
        
        if (data.user_state) {
            stateData = data.user_state;
        } else if (data.roc_analysis || data.analysis_result) {
            // ROC 분석 정보에서 상태 추출
            const analysis = data.roc_analysis || data.analysis_result;
            const isWalking = analysis.walking || analysis.is_walking;
            const confidence = analysis.confidence || 0;
            
            stateData = {
                current_state: isWalking ? 'Walking' : 'Idle',
                confidence_score: confidence,
                last_update: new Date().toISOString()
            };
        }
        
        if (stateData) {
            // 상태 정규화 적용
            const normalizedState = normalizeStateValue(stateData.current_state);
            
            setUserState(prev => ({
                ...prev,
                current_state: normalizedState,
                state_duration: stateData.state_duration || 0,
                is_connected: true,
                last_update: new Date(stateData.last_update || new Date().toISOString()),
                confidence_score: stateData.confidence_score || stateData.confidence || prev.confidence_score
            }));
            
            console.log('📊 IMU 상태 업데이트:', normalizedState, '신뢰도:', stateData.confidence_score);
        }
    };
    
    const handleConnectionEstablished = () => {
        setConnectionStatus('연결됨');
        setUserState(prev => ({ ...prev, is_connected: true }));
        // 🔧 MODIFIED: 설정 기반 연결 성공 알림음
        websocketService.playConnectionSound('connection');
        console.log('🔗 WebSocket 연결 성공 - 알림음 재생');
    };
    
    const handleConnectionLost = () => {
        setConnectionStatus('연결 끊김');
        setUserState(prev => ({ ...prev, is_connected: false }));
        // 🔧 MODIFIED: 설정 기반 연결 끊김 알림음
        websocketService.playConnectionSound('warning');
        console.log('⚠️ WebSocket 연결 끊김 - 경고음 재생');
    };
    
    const handleConnectionError = (error) => {
        console.error('WebSocket 연결 오류:', error);
        setConnectionStatus('연결 오류');
        setUserState(prev => ({ ...prev, is_connected: false }));
        
        // 🔧 MODIFIED: 설정 기반 연결 오류 알림음
        websocketService.playConnectionSound('error');
        
        // 사용자에게 더 구체적인 안내 제공
        if (error.message) {
            console.warn('📡 연결 문제 안내:', error.message);
            if (error.suggestion) {
                console.info('💡 해결 방법:', error.suggestion);
            }
        }
    };
    
    const getStateColor = (state) => {
        switch (state) {
            case 'Walking':
            case '걷기':
            case '보행':
                return '#4caf50';
            case 'Idle':
            case '일상':
            case 'daily':
                return '#2196f3';
            case 'Fall':
            case '낙상':
                return '#f44336';
            case 'Emergency':
            case '응급':
                return '#ff5722';
            default: 
                return '#9e9e9e';
        }
    };
    
    const getStateIcon = (state) => {
        switch (state) {
            case 'Walking':
            case '걷기':
            case '보행':
                return '🚶';
            case 'Idle':
            case '일상':
            case 'daily':
                return '🏠';
            case 'Fall':
            case '낙상':
                return '🚨';
            case 'Emergency':
            case '응급':
                return '🆘';
            default: 
                return '❓';
        }
    };
    
    const getStateDisplayName = (state) => {
        // 🔧 MODIFIED: 상태 표시명 로직 간소화 및 개선
        switch (state) {
            case 'Walking':
            case '걷기':
            case '보행':
                return '보행 중';
            case 'Idle':
            case '일상':
            case 'daily':
                return '일상생활';
            case 'Fall':
            case '낙상':
                return '낙상 감지';
            case 'Emergency':
            case '응급':
                return '응급상황';
            default: 
                // 🆕 알 수 없는 상태도 의미있게 표시
                console.log('🔍 매핑되지 않은 상태:', state);
                return state ? `${state} (확인 중)` : '연결 대기 중';
        }
    };
    
    const formatDuration = (seconds) => {
        if (!seconds || seconds < 0) return '0초';
        
        if (seconds < 60) return `${Math.floor(seconds)}초`;
        if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes}분 ${remainingSeconds}초`;
        }
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}시간 ${minutes}분`;
    };
    
    const formatLastUpdate = (date) => {
        if (!date) return '없음';
        
        const now = new Date();
        const diffMs = now - date;
        const diffSeconds = Math.floor(diffMs / 1000);
        
        if (diffSeconds < 10) return '방금 전';
        if (diffSeconds < 60) return `${diffSeconds}초 전`;
        if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}분 전`;
        
        return date.toLocaleTimeString('ko-KR');
    };
    
    // 🆕 상태 값 정규화 함수 - 라즈베리파이 영어 상태를 한국어로 변환
    const normalizeStateValue = (state) => {
        if (!state) return 'daily'; // 기본값
        
        const stateStr = String(state).toLowerCase();
        
        // 영어 상태를 한국어로 매핑
        if (stateStr.includes('walk') || stateStr === 'walking') {
            return '보행';
        } else if (stateStr.includes('idle') || stateStr === 'idle' || stateStr.includes('daily')) {
            return '일상';
        } else if (stateStr.includes('fall')) {
            return '낙상';
        } else if (stateStr.includes('emergency')) {
            return '응급';
        }
        
        // 한국어 상태는 그대로 반환
        if (['보행', '일상', '낙상', '응급'].includes(state)) {
            return state;
        }
        
        // 인식되지 않는 상태는 '일상'으로 기본 처리
        console.warn('🤔 알 수 없는 상태값:', state, '-> 일상으로 처리');
        return '일상';
    };
    
    return (
        <div className="user-status-container">
            <div className="status-header">
                <h3 className="status-title">
                    <span className="title-icon">👤</span>
                    사용자 상태 모니터링
                </h3>
                <div className={`connection-indicator ${userState.is_connected ? 'connected' : 'disconnected'}`}>
                    <span className="indicator-dot"></span>
                    <span className="connection-text">{connectionStatus}</span>
                </div>
            </div>
            
            <div className="status-content">
                <div 
                    className="current-state-card"
                    style={{ 
                        borderColor: getStateColor(userState.current_state),
                        backgroundColor: `${getStateColor(userState.current_state)}10`
                    }}
                >
                    <div className="state-main">
                        <span className="state-icon">
                            {getStateIcon(userState.current_state)}
                        </span>
                        <div className="state-info">
                            <div 
                                className="state-name"
                                style={{ color: getStateColor(userState.current_state) }}
                            >
                                {getStateDisplayName(userState.current_state)}
                            </div>
                            <div className="state-duration">
                                지속 시간: {formatDuration(userState.state_duration)}
                            </div>
                        </div>
                    </div>
                    
                    {userState.confidence_score && (
                        <div className="confidence-score">
                            <span className="confidence-label">신뢰도:</span>
                            <span className="confidence-value">
                                {(userState.confidence_score * 100).toFixed(1)}%
                            </span>
                        </div>
                    )}
                </div>
                
                {userState.emergency_timer && (
                    <div className="emergency-timer-card">
                        <div className="timer-header">
                            <span className="timer-icon">⏰</span>
                            <span className="timer-title">응급상황 타이머</span>
                        </div>
                        <div className="timer-content">
                            <div className="timer-value">
                                {formatDuration(Math.floor(userState.emergency_timer))}
                            </div>
                            <div className="timer-description">
                                15초 경과 시 자동 응급 알림
                            </div>
                        </div>
                        <div className="timer-progress">
                            <div 
                                className="progress-bar"
                                style={{ 
                                    width: `${Math.min((userState.emergency_timer / 15) * 100, 100)}%` 
                                }}
                            ></div>
                        </div>
                    </div>
                )}
                
                <div className="status-details">
                    <div className="detail-row">
                        <span className="detail-label">사용자 ID:</span>
                        <span className="detail-value">{userId || '미설정'}</span>
                    </div>
                    
                    <div className="detail-row">
                        <span className="detail-label">마지막 업데이트:</span>
                        <span className="detail-value">
                            {formatLastUpdate(userState.last_update)}
                        </span>
                    </div>
                    
                    <div className="detail-row">
                        <span className="detail-label">연결 상태:</span>
                        <span className={`detail-value status-${userState.is_connected ? 'online' : 'offline'}`}>
                            {userState.is_connected ? '온라인' : '오프라인'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserStatusDisplay; 