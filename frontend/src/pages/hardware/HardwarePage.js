import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import './HardwarePage.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const HardwarePage = () => {
  const navigate = useNavigate();
  const [hardwareData, setHardwareData] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState('sensor1');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadHardwareData();
    // 실시간 업데이트를 위한 인터벌 설정
    const interval = setInterval(loadHardwareData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadHardwareData = () => {
    // 임시 데이터 - 실제로는 API에서 가져옴
    const mockData = {
      devices: [
        {
          id: 'sensor1',
          name: '보행 센서 #1',
          type: 'IMU',
          status: 'connected',
          battery: 85,
          signalStrength: 92,
          lastUpdate: '2024-01-15 14:30:25',
          location: '오른쪽 발목',
          firmware: 'v2.1.3',
          serialNumber: 'GS001-2024-001',
          temperature: 23.5,
          humidity: 45
        },
        {
          id: 'sensor2',
          name: '보행 센서 #2',
          type: 'IMU',
          status: 'connected',
          battery: 72,
          signalStrength: 88,
          lastUpdate: '2024-01-15 14:30:22',
          location: '왼쪽 발목',
          firmware: 'v2.1.3',
          serialNumber: 'GS001-2024-002',
          temperature: 24.1,
          humidity: 43
        },
        {
          id: 'gateway',
          name: '게이트웨이',
          type: 'Gateway',
          status: 'connected',
          battery: 95,
          signalStrength: 100,
          lastUpdate: '2024-01-15 14:30:30',
          location: '허리',
          firmware: 'v1.5.2',
          serialNumber: 'GW001-2024-001',
          temperature: 22.8,
          humidity: 40
        },
        {
          id: 'emergency',
          name: '응급 버튼',
          type: 'Emergency',
          status: 'standby',
          battery: 68,
          signalStrength: 85,
          lastUpdate: '2024-01-15 14:29:45',
          location: '목걸이',
          firmware: 'v1.2.1',
          serialNumber: 'EB001-2024-001',
          temperature: 25.2,
          humidity: 38
        }
      ],
      systemInfo: {
        totalDevices: 4,
        connectedDevices: 3,
        averageBattery: 80,
        dataTransmissionRate: '98.5%',
        uptime: '15일 3시간 22분',
        lastMaintenance: '2024-01-01',
        nextMaintenance: '2024-02-01'
      },
      networkInfo: {
        wifiSSID: 'GaitAnalysis_Network',
        wifiStrength: 85,
        bluetoothDevices: 4,
        dataUsage: '2.3 GB',
        latency: '12ms'
      }
    };
    setHardwareData(mockData);
  };

  const handleDeviceAction = (deviceId, action) => {
    console.log(`Device ${deviceId}: ${action}`);
    // 실제로는 API 호출
    if (action === 'restart') {
      // 재시작 로직
    } else if (action === 'calibrate') {
      // 캘리브레이션 로직
    } else if (action === 'disconnect') {
      // 연결 해제 로직
    }
  };

  const handleScanDevices = () => {
    setIsScanning(true);
    // 실제로는 블루투스 스캔 API 호출
    setTimeout(() => {
      setIsScanning(false);
      loadHardwareData();
    }, 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return '#4caf50';
      case 'disconnected': return '#f44336';
      case 'standby': return '#ff9800';
      case 'error': return '#e91e63';
      default: return '#9e9e9e';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected': return '연결됨';
      case 'disconnected': return '연결 해제';
      case 'standby': return '대기중';
      case 'error': return '오류';
      default: return '알 수 없음';
    }
  };

  const batteryData = {
    labels: hardwareData?.devices.map(device => device.name) || [],
    datasets: [
      {
        label: '배터리 수준 (%)',
        data: hardwareData?.devices.map(device => device.battery) || [],
        backgroundColor: [
          'rgba(76, 175, 80, 0.8)',
          'rgba(33, 150, 243, 0.8)',
          'rgba(255, 152, 0, 0.8)',
          'rgba(156, 39, 176, 0.8)'
        ],
        borderColor: [
          'rgba(76, 175, 80, 1)',
          'rgba(33, 150, 243, 1)',
          'rgba(255, 152, 0, 1)',
          'rgba(156, 39, 176, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  const signalData = {
    labels: ['1분전', '2분전', '3분전', '4분전', '5분전', '현재'],
    datasets: [
      {
        label: '신호 강도 (%)',
        data: [88, 90, 87, 92, 89, 90],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      }
    ]
  };

  const systemStatusData = {
    labels: ['정상', '경고', '오류'],
    datasets: [
      {
        data: [85, 12, 3],
        backgroundColor: ['#4caf50', '#ff9800', '#f44336'],
        borderWidth: 0
      }
    ]
  };

  if (!hardwareData) {
    return (
      <div className="hardware-container">
        <div className="loading-spinner">
          <div className="spinner-only"></div>
          <div className="loading-text">하드웨어 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  const selectedDeviceData = hardwareData.devices.find(device => device.id === selectedDevice);

  return (
    <div className="hardware-container">
      <header className="hardware-header">
        <button className="back-button" onClick={() => navigate('/main')}>
          ← 뒤로가기
        </button>
        <h1>하드웨어 정보</h1>
        <div className="header-actions">
          <button 
            className={`scan-button ${isScanning ? 'scanning' : ''}`}
            onClick={handleScanDevices}
            disabled={isScanning}
          >
            {isScanning ? '🔄 스캔 중...' : '🔍 기기 스캔'}
          </button>
        </div>
      </header>

      <div className="hardware-content">
        {/* 시스템 개요 */}
        <div className="system-overview">
          <div className="overview-card">
            <h3>시스템 상태</h3>
            <div className="status-grid">
              <div className="status-item">
                <span className="status-label">총 기기 수</span>
                <span className="status-value">{hardwareData.systemInfo.totalDevices}</span>
              </div>
              <div className="status-item">
                <span className="status-label">연결된 기기</span>
                <span className="status-value connected">
                  {hardwareData.systemInfo.connectedDevices}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">평균 배터리</span>
                <span className="status-value">{hardwareData.systemInfo.averageBattery}%</span>
              </div>
              <div className="status-item">
                <span className="status-label">데이터 전송률</span>
                <span className="status-value">{hardwareData.systemInfo.dataTransmissionRate}</span>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <h3>시스템 상태 분포</h3>
            <Doughnut key="system-status-chart" data={systemStatusData} />
          </div>
        </div>

        {/* 기기 목록 */}
        <div className="devices-section">
          <h3>연결된 기기</h3>
          <div className="devices-grid">
            {hardwareData.devices.map((device) => (
              <div 
                key={device.id} 
                className={`device-card ${selectedDevice === device.id ? 'selected' : ''}`}
                onClick={() => setSelectedDevice(device.id)}
              >
                <div className="device-header">
                  <div className="device-info">
                    <h4>{device.name}</h4>
                    <span className="device-type">{device.type}</span>
                  </div>
                  <div 
                    className="device-status"
                    style={{ backgroundColor: getStatusColor(device.status) }}
                  >
                    {getStatusText(device.status)}
                  </div>
                </div>
                
                <div className="device-metrics">
                  <div className="metric">
                    <span className="metric-label">배터리</span>
                    <div className="battery-indicator">
                      <div 
                        className="battery-fill"
                        style={{ 
                          width: `${device.battery}%`,
                          backgroundColor: device.battery > 20 ? '#4caf50' : '#f44336'
                        }}
                      ></div>
                    </div>
                    <span className="metric-value">{device.battery}%</span>
                  </div>
                  
                  <div className="metric">
                    <span className="metric-label">신호 강도</span>
                    <div className="signal-bars">
                      {[1, 2, 3, 4, 5].map(bar => (
                        <div 
                          key={bar}
                          className={`signal-bar ${device.signalStrength >= bar * 20 ? 'active' : ''}`}
                        ></div>
                      ))}
                    </div>
                    <span className="metric-value">{device.signalStrength}%</span>
                  </div>
                </div>
                
                <div className="device-location">
                  📍 {device.location}
                </div>
                
                <div className="device-last-update">
                  마지막 업데이트: {device.lastUpdate}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 선택된 기기 상세 정보 */}
        {selectedDeviceData && (
          <div className="device-details">
            <h3>{selectedDeviceData.name} 상세 정보</h3>
            <div className="details-content">
              <div className="details-info">
                <div className="info-section">
                  <h4>기본 정보</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>시리얼 번호</label>
                      <span>{selectedDeviceData.serialNumber}</span>
                    </div>
                    <div className="info-item">
                      <label>펌웨어 버전</label>
                      <span>{selectedDeviceData.firmware}</span>
                    </div>
                    <div className="info-item">
                      <label>설치 위치</label>
                      <span>{selectedDeviceData.location}</span>
                    </div>
                    <div className="info-item">
                      <label>기기 타입</label>
                      <span>{selectedDeviceData.type}</span>
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <h4>환경 정보</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>온도</label>
                      <span>{selectedDeviceData.temperature}°C</span>
                    </div>
                    <div className="info-item">
                      <label>습도</label>
                      <span>{selectedDeviceData.humidity}%</span>
                    </div>
                    <div className="info-item">
                      <label>마지막 업데이트</label>
                      <span>{selectedDeviceData.lastUpdate}</span>
                    </div>
                    <div className="info-item">
                      <label>상태</label>
                      <span className={`status-badge ${selectedDeviceData.status}`}>
                        {getStatusText(selectedDeviceData.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="device-actions">
                  <h4>기기 제어</h4>
                  <div className="action-buttons">
                    <button 
                      className="action-btn restart"
                      onClick={() => handleDeviceAction(selectedDeviceData.id, 'restart')}
                    >
                      🔄 재시작
                    </button>
                    <button 
                      className="action-btn calibrate"
                      onClick={() => handleDeviceAction(selectedDeviceData.id, 'calibrate')}
                    >
                      ⚙️ 캘리브레이션
                    </button>
                    <button 
                      className="action-btn disconnect"
                      onClick={() => handleDeviceAction(selectedDeviceData.id, 'disconnect')}
                    >
                      🔌 연결 해제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 차트 섹션 */}
        <div className="charts-section">
          <div className="chart-card">
            <h3>배터리 상태</h3>
            <Bar key="battery-chart" data={batteryData} />
          </div>
          
          <div className="chart-card">
            <h3>신호 강도 추이</h3>
            <Line key="signal-chart" data={signalData} />
          </div>
        </div>

        {/* 네트워크 정보 */}
        <div className="network-info">
          <h3>네트워크 정보</h3>
          <div className="network-grid">
            <div className="network-item">
              <span className="network-label">Wi-Fi 네트워크</span>
              <span className="network-value">{hardwareData.networkInfo.wifiSSID}</span>
              <span className="network-strength">{hardwareData.networkInfo.wifiStrength}%</span>
            </div>
            <div className="network-item">
              <span className="network-label">블루투스 기기</span>
              <span className="network-value">{hardwareData.networkInfo.bluetoothDevices}개</span>
            </div>
            <div className="network-item">
              <span className="network-label">데이터 사용량</span>
              <span className="network-value">{hardwareData.networkInfo.dataUsage}</span>
            </div>
            <div className="network-item">
              <span className="network-label">네트워크 지연시간</span>
              <span className="network-value">{hardwareData.networkInfo.latency}</span>
            </div>
          </div>
        </div>

        {/* 유지보수 정보 */}
        <div className="maintenance-info">
          <h3>유지보수 정보</h3>
          <div className="maintenance-content">
            <div className="maintenance-item">
              <span className="maintenance-label">시스템 가동시간</span>
              <span className="maintenance-value">{hardwareData.systemInfo.uptime}</span>
            </div>
            <div className="maintenance-item">
              <span className="maintenance-label">마지막 점검</span>
              <span className="maintenance-value">{hardwareData.systemInfo.lastMaintenance}</span>
            </div>
            <div className="maintenance-item">
              <span className="maintenance-label">다음 점검 예정</span>
              <span className="maintenance-value next">{hardwareData.systemInfo.nextMaintenance}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HardwarePage; 