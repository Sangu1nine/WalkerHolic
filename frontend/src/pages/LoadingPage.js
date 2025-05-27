import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoadingPage.css';

const LoadingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="loading-container">
      <div className="loading-content">
        <h1>보행 분석 시스템</h1>
        <p>시스템을 초기화하고 있습니다...</p>
      </div>
    </div>
  );
};

export default LoadingPage;
