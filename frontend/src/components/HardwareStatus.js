import React from 'react';

const HardwareStatus = ({ isConnected }) => {
  const deviceStatus = [
    {
      name: '라즈베리파이',
      status: isConnected ? 'connected' : 'disconnected',
      lastUpdate: isConnected ? new Date().toLocaleTimeString() : '-'
    },
    {
      name: 'IMU 센서',
      status: isConnected ? 'active' : 'inactive',
      lastUpdate: isConnected ? new Date().toLocaleTimeString() : '-'
    },
    {
      name: 'AI 분석 서버',
      status: 'connected',
      lastUpdate: new Date().toLocaleTimeString()
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
      case 'active':
        return '#4CAF50';
      case 'disconnected':
      case 'inactive':
        return '#F44336';
      default:
        return '#FF9800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected':
        return '연결됨';
      case 'disconnected':
        return '연결 해제됨';
      case 'active':
        return '활성';
      case 'inactive':
        return '비활성';
      default:
        return '알 수 없음';
    }
  };

  return (
    <div className="hardware-status">
      <h3>하드웨어 상태</h3>
      <div className="device-list">
        {deviceStatus.map((device, index) => (
          <div key={index} className="device-item">
            <div className="device-info">
              <span className="device-name">{device.name}</span>
              <span className="last-update">마지막 업데이트: {device.lastUpdate}</span>
            </div>
            <div 
              className="device-status"
              style={{ color: getStatusColor(device.status) }}
            >
              <span className="status-indicator">●</span>
              {getStatusText(device.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HardwareStatus;
