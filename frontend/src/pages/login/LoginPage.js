import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleDemoLogin = async () => {
    setIsLoading(true);
    
    // Demo 사용자로 로그인 (검증 없음)
    setTimeout(() => {
      localStorage.setItem('userId', 'demo_user');
      localStorage.setItem('userName', 'Demo User');
      navigate('/main');
    }, 1000);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>보행 분석 시스템</h2>
        <p>건강한 보행을 위한 AI 분석 서비스</p>
        
        <div className="login-options">
          <button 
            className="demo-login-btn"
            onClick={handleDemoLogin}
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : 'Demo 사용자로 시작'}
          </button>
        </div>
        
        <div className="login-info">
          <p>* Demo 모드에서는 모든 기능을 체험할 수 있습니다</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
