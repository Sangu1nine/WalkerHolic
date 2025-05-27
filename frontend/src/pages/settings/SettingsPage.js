import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SettingsPage.css';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    notifications: {
      gaitAnalysis: true,
      fallDetection: true,
      systemAlerts: true,
      batteryWarning: true,
      maintenanceReminder: true
    },
    privacy: {
      dataSharing: false,
      analytics: true,
      locationTracking: false
    },
    display: {
      theme: 'light',
      language: 'ko',
      fontSize: 'medium',
      autoRefresh: true
    },
    analysis: {
      sensitivity: 'medium',
      dataRetention: '30',
      autoAnalysis: true,
      realTimeProcessing: true
    },
    hardware: {
      autoConnect: true,
      batteryOptimization: true,
      dataCompression: false,
      calibrationReminder: true
    }
  });

  const [systemInfo, setSystemInfo] = useState({
    appVersion: '1.2.3',
    serverStatus: 'connected',
    lastUpdate: '2024-01-15 14:30:00',
    dataUsage: '2.3 GB',
    storageUsed: '1.8 GB',
    totalStorage: '10 GB',
    connectedDevices: 4,
    uptime: '15일 3시간 22분'
  });

  useEffect(() => {
    loadSettings();
    loadSystemInfo();
  }, []);

  const loadSettings = () => {
    // 실제로는 API에서 설정을 불러옴
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const loadSystemInfo = () => {
    // 실제로는 API에서 시스템 정보를 불러옴
    // 현재는 mock 데이터 사용
  };

  const handleSettingChange = (category, key, value) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    };
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('appSettings');
    navigate('/login');
  };

  const handleResetSettings = () => {
    if (window.confirm('모든 설정을 초기화하시겠습니까?')) {
      localStorage.removeItem('appSettings');
      window.location.reload();
    }
  };

  const handleExportData = () => {
    // 데이터 내보내기 기능
    const dataToExport = {
      settings,
      systemInfo,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gait-analysis-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStoragePercentage = () => {
    const used = parseFloat(systemInfo.storageUsed);
    const total = parseFloat(systemInfo.totalStorage);
    return (used / total) * 100;
  };

  return (
    <div className="settings-container">
      <header className="settings-header">
        <button onClick={() => navigate('/main')} className="back-button">
          ← 뒤로가기
        </button>
        <h1>설정</h1>
        <div className="header-actions">
          <button className="export-button" onClick={handleExportData}>
            📤 데이터 내보내기
          </button>
        </div>
      </header>

      <div className="settings-content">
        {/* 계정 정보 */}
        <div className="settings-section">
          <h3>계정 정보</h3>
          <div className="account-info">
            <div className="user-avatar">
              <span>👤</span>
            </div>
            <div className="user-details">
              <div className="user-name">{localStorage.getItem('userName') || 'Demo User'}</div>
              <div className="user-id">ID: {localStorage.getItem('userId') || 'demo_user'}</div>
              <div className="user-status">활성 상태</div>
            </div>
          </div>
          <div className="account-actions">
            <button className="profile-button">프로필 편집</button>
            <button className="logout-button" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </div>

        {/* 알림 설정 */}
        <div className="settings-section">
          <h3>알림 설정</h3>
          <div className="settings-group">
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">보행 분석 알림</span>
                <span className="setting-description">분석 완료 시 알림을 받습니다</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.notifications.gaitAnalysis}
                  onChange={(e) => handleSettingChange('notifications', 'gaitAnalysis', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
            
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">낙상 감지 알림</span>
                <span className="setting-description">낙상이 감지되면 즉시 알림을 받습니다</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.notifications.fallDetection}
                  onChange={(e) => handleSettingChange('notifications', 'fallDetection', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">시스템 알림</span>
                <span className="setting-description">시스템 상태 변경 시 알림을 받습니다</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.notifications.systemAlerts}
                  onChange={(e) => handleSettingChange('notifications', 'systemAlerts', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">배터리 경고</span>
                <span className="setting-description">기기 배터리가 부족할 때 알림을 받습니다</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.notifications.batteryWarning}
                  onChange={(e) => handleSettingChange('notifications', 'batteryWarning', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* 화면 설정 */}
        <div className="settings-section">
          <h3>화면 설정</h3>
          <div className="settings-group">
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">테마</span>
                <span className="setting-description">앱의 색상 테마를 선택합니다</span>
              </div>
              <select
                value={settings.display.theme}
                onChange={(e) => handleSettingChange('display', 'theme', e.target.value)}
                className="setting-select"
              >
                <option value="light">라이트</option>
                <option value="dark">다크</option>
                <option value="auto">자동</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">언어</span>
                <span className="setting-description">앱에서 사용할 언어를 선택합니다</span>
              </div>
              <select
                value={settings.display.language}
                onChange={(e) => handleSettingChange('display', 'language', e.target.value)}
                className="setting-select"
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">글자 크기</span>
                <span className="setting-description">화면의 글자 크기를 조정합니다</span>
              </div>
              <select
                value={settings.display.fontSize}
                onChange={(e) => handleSettingChange('display', 'fontSize', e.target.value)}
                className="setting-select"
              >
                <option value="small">작게</option>
                <option value="medium">보통</option>
                <option value="large">크게</option>
              </select>
            </div>
          </div>
        </div>

        {/* 분석 설정 */}
        <div className="settings-section">
          <h3>분석 설정</h3>
          <div className="settings-group">
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">감지 민감도</span>
                <span className="setting-description">보행 이상 감지의 민감도를 조정합니다</span>
              </div>
              <select
                value={settings.analysis.sensitivity}
                onChange={(e) => handleSettingChange('analysis', 'sensitivity', e.target.value)}
                className="setting-select"
              >
                <option value="low">낮음</option>
                <option value="medium">보통</option>
                <option value="high">높음</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">데이터 보관 기간</span>
                <span className="setting-description">분석 데이터를 보관할 기간을 설정합니다</span>
              </div>
              <select
                value={settings.analysis.dataRetention}
                onChange={(e) => handleSettingChange('analysis', 'dataRetention', e.target.value)}
                className="setting-select"
              >
                <option value="7">7일</option>
                <option value="30">30일</option>
                <option value="90">90일</option>
                <option value="365">1년</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">실시간 처리</span>
                <span className="setting-description">데이터를 실시간으로 분석합니다</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.analysis.realTimeProcessing}
                  onChange={(e) => handleSettingChange('analysis', 'realTimeProcessing', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* 하드웨어 설정 */}
        <div className="settings-section">
          <h3>하드웨어 설정</h3>
          <div className="settings-group">
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">자동 연결</span>
                <span className="setting-description">앱 시작 시 기기에 자동으로 연결합니다</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.hardware.autoConnect}
                  onChange={(e) => handleSettingChange('hardware', 'autoConnect', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">배터리 최적화</span>
                <span className="setting-description">배터리 사용량을 최적화합니다</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.hardware.batteryOptimization}
                  onChange={(e) => handleSettingChange('hardware', 'batteryOptimization', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* 시스템 정보 */}
        <div className="settings-section">
          <h3>시스템 정보</h3>
          <div className="system-info-grid">
            <div className="info-card">
              <div className="info-icon">📱</div>
              <div className="info-content">
                <div className="info-label">앱 버전</div>
                <div className="info-value">{systemInfo.appVersion}</div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">🌐</div>
              <div className="info-content">
                <div className="info-label">서버 상태</div>
                <div className={`info-value ${systemInfo.serverStatus}`}>
                  {systemInfo.serverStatus === 'connected' ? '연결됨' : '연결 해제'}
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">📊</div>
              <div className="info-content">
                <div className="info-label">데이터 사용량</div>
                <div className="info-value">{systemInfo.dataUsage}</div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">💾</div>
              <div className="info-content">
                <div className="info-label">저장공간</div>
                <div className="info-value">{systemInfo.storageUsed} / {systemInfo.totalStorage}</div>
                <div className="storage-bar">
                  <div 
                    className="storage-fill" 
                    style={{ width: `${getStoragePercentage()}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">🔗</div>
              <div className="info-content">
                <div className="info-label">연결된 기기</div>
                <div className="info-value">{systemInfo.connectedDevices}개</div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">⏱️</div>
              <div className="info-content">
                <div className="info-label">가동 시간</div>
                <div className="info-value">{systemInfo.uptime}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 고급 설정 */}
        <div className="settings-section">
          <h3>고급 설정</h3>
          <div className="advanced-actions">
            <button className="action-button secondary" onClick={handleResetSettings}>
              🔄 설정 초기화
            </button>
            <button className="action-button secondary">
              🔧 진단 실행
            </button>
            <button className="action-button secondary">
              📋 로그 보기
            </button>
            <button className="action-button secondary">
              🆘 지원 요청
            </button>
          </div>
        </div>

        {/* 정보 */}
        <div className="settings-section">
          <h3>정보</h3>
          <div className="info-links">
            <a href="#" className="info-link">개인정보 처리방침</a>
            <a href="#" className="info-link">이용약관</a>
            <a href="#" className="info-link">오픈소스 라이선스</a>
            <a href="#" className="info-link">문의하기</a>
          </div>
          <div className="app-info">
            <p>© 2024 보행 분석 시스템. All rights reserved.</p>
            <p>마지막 업데이트: {systemInfo.lastUpdate}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
