import React from 'react';

// MODIFIED [2025-01-27]: 건강정보 컴포넌트 개선 - BMI, 활동수준, 의료기록 추가
const HealthInfo = ({ healthInfo }) => {
  const defaultHealthInfo = {
    age: 65,
    gender: '남성',
    diseases: ['고혈압', '당뇨병'],
    height: 170,
    weight: 70,
    medications: ['혈압약', '당뇨약'],
    bmi: 24.2,
    activity_level: 'moderate',
    medical_history: {
      allergies: ['페니실린'],
      family_history: ['고혈압', '당뇨병']
    },
    emergency_contact: {
      name: '김영희',
      relationship: '딸',
      phone: '010-1234-5678'
    }
  };

  const info = healthInfo || defaultHealthInfo;

  const getBMIStatus = (bmi) => {
    if (!bmi) return '정보 없음';
    if (bmi < 18.5) return '저체중';
    if (bmi < 25) return '정상';
    if (bmi < 30) return '과체중';
    return '비만';
  };

  const getActivityLevelText = (level) => {
    const levels = {
      'low': '낮음',
      'moderate': '보통',
      'high': '높음'
    };
    return levels[level] || '정보 없음';
  };

  return (
    <div className="health-info">
      <h3>건강 정보</h3>
      <div className="health-details">
        <div className="health-section">
          <h4>기본 정보</h4>
          <div className="health-item">
            <label>나이:</label>
            <span>{info.age}세</span>
          </div>
          <div className="health-item">
            <label>성별:</label>
            <span>{info.gender}</span>
          </div>
          <div className="health-item">
            <label>신장:</label>
            <span>{info.height}cm</span>
          </div>
          <div className="health-item">
            <label>체중:</label>
            <span>{info.weight}kg</span>
          </div>
          {info.bmi && (
            <div className="health-item">
              <label>BMI:</label>
              <span>{info.bmi.toFixed(1)} ({getBMIStatus(info.bmi)})</span>
            </div>
          )}
          {info.activity_level && (
            <div className="health-item">
              <label>활동 수준:</label>
              <span>{getActivityLevelText(info.activity_level)}</span>
            </div>
          )}
        </div>

        <div className="health-section">
          <h4>의료 정보</h4>
          <div className="health-item">
            <label>질병:</label>
            <span>{info.diseases.join(', ')}</span>
          </div>
          <div className="health-item">
            <label>복용약물:</label>
            <span>{info.medications.join(', ')}</span>
          </div>
          {info.medical_history?.allergies && (
            <div className="health-item">
              <label>알레르기:</label>
              <span>{info.medical_history.allergies.join(', ')}</span>
            </div>
          )}
          {info.medical_history?.family_history && (
            <div className="health-item">
              <label>가족력:</label>
              <span>{info.medical_history.family_history.join(', ')}</span>
            </div>
          )}
        </div>

        {info.emergency_contact && (
          <div className="health-section">
            <h4>비상 연락처</h4>
            <div className="health-item">
              <label>이름:</label>
              <span>{info.emergency_contact.name}</span>
            </div>
            <div className="health-item">
              <label>관계:</label>
              <span>{info.emergency_contact.relationship}</span>
            </div>
            <div className="health-item">
              <label>전화번호:</label>
              <span>{info.emergency_contact.phone}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthInfo;
