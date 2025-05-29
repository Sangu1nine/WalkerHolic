import React, { useState, useEffect } from 'react';
import { websocketService } from '../services/websocket';
import './NotificationSettings.css';

const NotificationSettings = () => {
    const [settings, setSettings] = useState({
        masterVolume: 0.3,
        enableStateChangeAlerts: true,
        enableConnectionAlerts: true,
        enableEmergencyAlerts: true,
        emergencyVolume: 0.5,
        stateChangeVolume: 0.2,
        connectionVolume: 0.1
    });

    // 로컬 스토리지에서 설정 로드
    useEffect(() => {
        const savedSettings = localStorage.getItem('notificationSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    // 설정 변경 시 로컬 스토리지에 저장
    useEffect(() => {
        localStorage.setItem('notificationSettings', JSON.stringify(settings));
    }, [settings]);

    const handleVolumeChange = (type, value) => {
        setSettings(prev => ({
            ...prev,
            [type]: value
        }));
    };

    const handleToggleChange = (type) => {
        setSettings(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    const testSound = (soundType) => {
        const volume = settings.masterVolume;
        
        switch (soundType) {
            case 'walking_start':
                websocketService.playNotificationSound('walking_start', volume * settings.stateChangeVolume);
                break;
            case 'walking_stop':
                websocketService.playNotificationSound('walking_stop', volume * settings.stateChangeVolume);
                break;
            case 'connection':
                websocketService.playNotificationSound('connection', volume * settings.connectionVolume);
                break;
            case 'warning':
                websocketService.playNotificationSound('warning', volume * settings.connectionVolume);
                break;
            case 'emergency':
                websocketService.playEmergencySound(false);
                break;
            case 'critical':
                websocketService.playEmergencySound(true);
                break;
            default:
                websocketService.playNotificationSound('info', volume);
        }
    };

    return (
        <div className="notification-settings">
            <div className="settings-header">
                <h3>🔊 알림음 설정</h3>
                <p className="settings-description">
                    상태 변화와 연결 상태에 따른 알림음을 조절할 수 있습니다.
                </p>
            </div>

            <div className="settings-section">
                <div className="setting-group">
                    <h4>📊 전체 볼륨</h4>
                    <div className="volume-control">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={settings.masterVolume}
                            onChange={(e) => handleVolumeChange('masterVolume', parseFloat(e.target.value))}
                            className="volume-slider"
                        />
                        <span className="volume-value">
                            {Math.round(settings.masterVolume * 100)}%
                        </span>
                        <button 
                            onClick={() => testSound('info')}
                            className="test-button"
                        >
                            테스트
                        </button>
                    </div>
                </div>

                <div className="setting-group">
                    <h4>🚶 상태 변화 알림</h4>
                    <div className="toggle-control">
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings.enableStateChangeAlerts}
                                onChange={() => handleToggleChange('enableStateChangeAlerts')}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                        <span>상태 변화 시 알림음 재생</span>
                    </div>
                    
                    {settings.enableStateChangeAlerts && (
                        <div className="sub-controls">
                            <div className="volume-control">
                                <label>볼륨:</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={settings.stateChangeVolume}
                                    onChange={(e) => handleVolumeChange('stateChangeVolume', parseFloat(e.target.value))}
                                    className="volume-slider small"
                                />
                                <span>{Math.round(settings.stateChangeVolume * 100)}%</span>
                            </div>
                            
                            <div className="test-sounds">
                                <button onClick={() => testSound('walking_start')} className="test-button small">
                                    보행 시작음
                                </button>
                                <button onClick={() => testSound('walking_stop')} className="test-button small">
                                    보행 종료음
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="setting-group">
                    <h4>🔗 연결 상태 알림</h4>
                    <div className="toggle-control">
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings.enableConnectionAlerts}
                                onChange={() => handleToggleChange('enableConnectionAlerts')}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                        <span>연결 상태 변화 시 알림음 재생</span>
                    </div>
                    
                    {settings.enableConnectionAlerts && (
                        <div className="sub-controls">
                            <div className="volume-control">
                                <label>볼륨:</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={settings.connectionVolume}
                                    onChange={(e) => handleVolumeChange('connectionVolume', parseFloat(e.target.value))}
                                    className="volume-slider small"
                                />
                                <span>{Math.round(settings.connectionVolume * 100)}%</span>
                            </div>
                            
                            <div className="test-sounds">
                                <button onClick={() => testSound('connection')} className="test-button small">
                                    연결 성공음
                                </button>
                                <button onClick={() => testSound('warning')} className="test-button small">
                                    연결 오류음
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="setting-group emergency">
                    <h4>🚨 응급상황 알림</h4>
                    <div className="toggle-control">
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings.enableEmergencyAlerts}
                                onChange={() => handleToggleChange('enableEmergencyAlerts')}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                        <span>응급상황 시 알림음 재생 (권장: 활성화)</span>
                    </div>
                    
                    {settings.enableEmergencyAlerts && (
                        <div className="sub-controls">
                            <div className="volume-control">
                                <label>볼륨:</label>
                                <input
                                    type="range"
                                    min="0.2"
                                    max="1"
                                    step="0.1"
                                    value={settings.emergencyVolume}
                                    onChange={(e) => handleVolumeChange('emergencyVolume', parseFloat(e.target.value))}
                                    className="volume-slider small"
                                />
                                <span>{Math.round(settings.emergencyVolume * 100)}%</span>
                            </div>
                            
                            <div className="test-sounds">
                                <button onClick={() => testSound('emergency')} className="test-button small warning">
                                    낙상 알림음
                                </button>
                                <button onClick={() => testSound('critical')} className="test-button small danger">
                                    응급상황 알림음
                                </button>
                            </div>
                            
                            <div className="emergency-note">
                                ⚠️ 응급상황 알림음은 안전을 위해 볼륨이 자동으로 높게 설정됩니다.
                            </div>
                        </div>
                    )}
                </div>

                <div className="settings-footer">
                    <button 
                        onClick={() => {
                            setSettings({
                                masterVolume: 0.3,
                                enableStateChangeAlerts: true,
                                enableConnectionAlerts: true,
                                enableEmergencyAlerts: true,
                                emergencyVolume: 0.5,
                                stateChangeVolume: 0.2,
                                connectionVolume: 0.1
                            });
                        }}
                        className="reset-button"
                    >
                        기본값으로 재설정
                    </button>
                </div>
            </div>
        </div>
    );
};

// 설정 값을 다른 컴포넌트에서 사용할 수 있도록 내보내기
export const getNotificationSettings = () => {
    const saved = localStorage.getItem('notificationSettings');
    return saved ? JSON.parse(saved) : {
        masterVolume: 0.3,
        enableStateChangeAlerts: true,
        enableConnectionAlerts: true,
        enableEmergencyAlerts: true,
        emergencyVolume: 0.5,
        stateChangeVolume: 0.2,
        connectionVolume: 0.1
    };
};

export default NotificationSettings; 