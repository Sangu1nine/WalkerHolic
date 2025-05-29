import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import './HealthInfoPage.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const HealthInfoPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [healthData, setHealthData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = () => {
    // 임시 데이터 - 실제로는 API에서 가져옴
    const mockData = {
      personalInfo: {
        name: '김건강',
        age: 65,
        gender: '남성',
        height: 170,
        weight: 68,
        bloodType: 'A+',
        emergencyContact: '010-1234-5678'
      },
      vitalSigns: {
        bloodPressure: { systolic: 125, diastolic: 80 },
        heartRate: 72,
        temperature: 36.5,
        oxygenSaturation: 98,
        lastUpdated: '2024-01-15 09:30'
      },
      medicalHistory: [
        { date: '2023-12-15', condition: '고혈압', status: '관리중', doctor: '김의사' },
        { date: '2023-10-20', condition: '당뇨병 전단계', status: '완치', doctor: '이의사' },
        { date: '2023-08-10', condition: '관절염', status: '관리중', doctor: '박의사' }
      ],
      medications: [
        { name: '혈압약', dosage: '1정/일', frequency: '아침', startDate: '2023-12-15' },
        { name: '관절 영양제', dosage: '2정/일', frequency: '아침, 저녁', startDate: '2023-08-10' }
      ],
      healthMetrics: {
        bmi: 23.5,
        bodyFat: 18.2,
        muscleMass: 32.1,
        boneDensity: 'T-score: -1.2'
      },
      riskFactors: [
        { factor: '낙상 위험', level: 'medium', description: '보행 불안정성으로 인한 중간 위험도' },
        { factor: '심혈관 질환', level: 'low', description: '혈압 관리로 낮은 위험도' },
        { factor: '골절 위험', level: 'medium', description: '골밀도 감소로 인한 중간 위험도' }
      ]
    };
    setHealthData(mockData);
    setEditForm(mockData.personalInfo);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setHealthData(prev => ({
      ...prev,
      personalInfo: editForm
    }));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm(healthData.personalInfo);
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const bmiData = {
    labels: ['정상 체중', '현재 BMI', '남은 범위'],
    datasets: [
      {
        data: [18.5, healthData?.healthMetrics.bmi || 0, 25 - (healthData?.healthMetrics.bmi || 0)],
        backgroundColor: ['#4caf50', '#2196f3', '#e0e0e0'],
        borderWidth: 0,
      },
    ],
  };

  const vitalTrendData = {
    labels: ['1월 1주', '1월 2주', '1월 3주', '현재'],
    datasets: [
      {
        label: '수축기 혈압',
        data: [130, 128, 126, 125],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
      },
      {
        label: '이완기 혈압',
        data: [85, 83, 82, 80],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.1,
      },
    ],
  };

  if (!healthData) {
    return (
      <div className="health-container">
        <div className="loading-spinner">
          <div className="spinner-only"></div>
          <div className="loading-text">건강 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="health-container">
      <header className="health-header">
        <button className="back-button" onClick={() => navigate('/main')}>
          ← 뒤로가기
        </button>
        <h1>건강 정보</h1>
        <div className="header-actions">
          <button className="emergency-button">🚨 응급연락</button>
        </div>
      </header>

      <div className="health-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          개요
        </button>
        <button 
          className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          개인정보
        </button>
        <button 
          className={`tab-button ${activeTab === 'medical' ? 'active' : ''}`}
          onClick={() => setActiveTab('medical')}
        >
          의료기록
        </button>
        <button 
          className={`tab-button ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          건강지표
        </button>
      </div>

      <div className="health-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="vital-signs-card">
              <h3>현재 생체신호</h3>
              <div className="vital-grid">
                <div className="vital-item">
                  <span className="vital-label">혈압</span>
                  <span className="vital-value">
                    {healthData.vitalSigns.bloodPressure.systolic}/
                    {healthData.vitalSigns.bloodPressure.diastolic} mmHg
                  </span>
                  <span className="vital-status normal">정상</span>
                </div>
                <div className="vital-item">
                  <span className="vital-label">심박수</span>
                  <span className="vital-value">{healthData.vitalSigns.heartRate} bpm</span>
                  <span className="vital-status normal">정상</span>
                </div>
                <div className="vital-item">
                  <span className="vital-label">체온</span>
                  <span className="vital-value">{healthData.vitalSigns.temperature}°C</span>
                  <span className="vital-status normal">정상</span>
                </div>
                <div className="vital-item">
                  <span className="vital-label">산소포화도</span>
                  <span className="vital-value">{healthData.vitalSigns.oxygenSaturation}%</span>
                  <span className="vital-status normal">정상</span>
                </div>
              </div>
              <p className="last-updated">
                마지막 업데이트: {healthData.vitalSigns.lastUpdated}
              </p>
            </div>

            <div className="chart-section">
              <div className="chart-card">
                <h3>혈압 추이</h3>
                <Line key="vital-trend-chart" data={vitalTrendData} />
              </div>
              <div className="chart-card">
                <h3>BMI 현황</h3>
                <Doughnut key="bmi-chart" data={bmiData} />
                <p className="bmi-value">현재 BMI: {healthData.healthMetrics.bmi}</p>
              </div>
            </div>

            <div className="risk-assessment">
              <h3>위험도 평가</h3>
              <div className="risk-list">
                {healthData.riskFactors.map((risk, index) => (
                  <div key={index} className={`risk-item ${risk.level}`}>
                    <div className="risk-header">
                      <span className="risk-factor">{risk.factor}</span>
                      <span className={`risk-level ${risk.level}`}>
                        {risk.level === 'low' ? '낮음' : 
                         risk.level === 'medium' ? '보통' : '높음'}
                      </span>
                    </div>
                    <p className="risk-description">{risk.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'personal' && (
          <div className="personal-section">
            <div className="personal-info-card">
              <div className="card-header">
                <h3>개인 정보</h3>
                {!isEditing ? (
                  <button className="edit-button" onClick={handleEdit}>
                    ✏️ 수정
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button className="save-button" onClick={handleSave}>
                      💾 저장
                    </button>
                    <button className="cancel-button" onClick={handleCancel}>
                      ❌ 취소
                    </button>
                  </div>
                )}
              </div>
              
              <div className="info-grid">
                <div className="info-item">
                  <label>이름</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  ) : (
                    <span>{healthData.personalInfo.name}</span>
                  )}
                </div>
                <div className="info-item">
                  <label>나이</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                    />
                  ) : (
                    <span>{healthData.personalInfo.age}세</span>
                  )}
                </div>
                <div className="info-item">
                  <label>성별</label>
                  {isEditing ? (
                    <select
                      value={editForm.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                    >
                      <option value="남성">남성</option>
                      <option value="여성">여성</option>
                    </select>
                  ) : (
                    <span>{healthData.personalInfo.gender}</span>
                  )}
                </div>
                <div className="info-item">
                  <label>신장</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.height}
                      onChange={(e) => handleInputChange('height', e.target.value)}
                    />
                  ) : (
                    <span>{healthData.personalInfo.height}cm</span>
                  )}
                </div>
                <div className="info-item">
                  <label>체중</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                    />
                  ) : (
                    <span>{healthData.personalInfo.weight}kg</span>
                  )}
                </div>
                <div className="info-item">
                  <label>혈액형</label>
                  {isEditing ? (
                    <select
                      value={editForm.bloodType}
                      onChange={(e) => handleInputChange('bloodType', e.target.value)}
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  ) : (
                    <span>{healthData.personalInfo.bloodType}</span>
                  )}
                </div>
                <div className="info-item">
                  <label>응급연락처</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.emergencyContact}
                      onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    />
                  ) : (
                    <span>{healthData.personalInfo.emergencyContact}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'medical' && (
          <div className="medical-section">
            <div className="medical-history-card">
              <h3>의료 기록</h3>
              <div className="history-list">
                {healthData.medicalHistory.map((record, index) => (
                  <div key={index} className="history-item">
                    <div className="history-date">{record.date}</div>
                    <div className="history-condition">{record.condition}</div>
                    <div className={`history-status ${record.status === '완치' ? 'cured' : 'ongoing'}`}>
                      {record.status}
                    </div>
                    <div className="history-doctor">담당의: {record.doctor}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="medications-card">
              <h3>복용 중인 약물</h3>
              <div className="medication-list">
                {healthData.medications.map((med, index) => (
                  <div key={index} className="medication-item">
                    <div className="med-name">{med.name}</div>
                    <div className="med-details">
                      <span>용량: {med.dosage}</span>
                      <span>복용시간: {med.frequency}</span>
                      <span>시작일: {med.startDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="metrics-section">
            <div className="body-composition-card">
              <h3>신체 구성</h3>
              <div className="composition-grid">
                <div className="composition-item">
                  <span className="comp-label">BMI</span>
                  <span className="comp-value">{healthData.healthMetrics.bmi}</span>
                  <span className="comp-status normal">정상</span>
                </div>
                <div className="composition-item">
                  <span className="comp-label">체지방률</span>
                  <span className="comp-value">{healthData.healthMetrics.bodyFat}%</span>
                  <span className="comp-status normal">정상</span>
                </div>
                <div className="composition-item">
                  <span className="comp-label">근육량</span>
                  <span className="comp-value">{healthData.healthMetrics.muscleMass}kg</span>
                  <span className="comp-status good">우수</span>
                </div>
                <div className="composition-item">
                  <span className="comp-label">골밀도</span>
                  <span className="comp-value">{healthData.healthMetrics.boneDensity}</span>
                  <span className="comp-status warning">주의</span>
                </div>
              </div>
            </div>

            <div className="health-goals-card">
              <h3>건강 목표</h3>
              <div className="goals-list">
                <div className="goal-item">
                  <span className="goal-title">일일 걸음 수</span>
                  <div className="goal-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width: '75%'}}></div>
                    </div>
                    <span className="progress-text">7,500 / 10,000 걸음</span>
                  </div>
                </div>
                <div className="goal-item">
                  <span className="goal-title">체중 관리</span>
                  <div className="goal-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width: '90%'}}></div>
                    </div>
                    <span className="progress-text">68kg / 65kg 목표</span>
                  </div>
                </div>
                <div className="goal-item">
                  <span className="goal-title">혈압 관리</span>
                  <div className="goal-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width: '85%'}}></div>
                    </div>
                    <span className="progress-text">125/80 / 120/80 목표</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthInfoPage; 