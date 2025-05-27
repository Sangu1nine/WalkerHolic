import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './AnalysisPage.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

const AnalysisPage = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalysisData();
  }, [selectedPeriod]);

  const loadAnalysisData = async () => {
    setLoading(true);
    // 임시 데이터 - 실제로는 API에서 가져옴
    setTimeout(() => {
      setAnalysisData(generateMockData());
      setLoading(false);
    }, 1000);
  };

  const generateMockData = () => {
    const dates = [];
    const steps = [];
    const cadence = [];
    const strideLength = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }));
      steps.push(Math.floor(Math.random() * 3000) + 7000);
      cadence.push(Math.floor(Math.random() * 20) + 110);
      strideLength.push((Math.random() * 0.3 + 0.6).toFixed(2));
    }

    return {
      dates,
      steps,
      cadence,
      strideLength,
      gaitScore: Math.floor(Math.random() * 20) + 75,
      riskLevel: 'low',
      recommendations: [
        '보행 속도가 안정적입니다. 현재 패턴을 유지하세요.',
        '좌우 균형이 약간 불균형합니다. 균형 운동을 권장합니다.',
        '보폭이 일정합니다. 좋은 보행 패턴입니다.'
      ]
    };
  };

  const stepData = {
    labels: analysisData?.dates || [],
    datasets: [
      {
        label: '일일 걸음 수',
        data: analysisData?.steps || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const gaitMetricsData = {
    labels: analysisData?.dates || [],
    datasets: [
      {
        label: '보행 리듬 (steps/min)',
        data: analysisData?.cadence || [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        yAxisID: 'y',
      },
      {
        label: '보폭 (m)',
        data: analysisData?.strideLength || [],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        yAxisID: 'y1',
      },
    ],
  };

  const radarData = {
    labels: ['보행 속도', '보폭 일관성', '좌우 균형', '보행 리듬', '안정성', '대칭성'],
    datasets: [
      {
        label: '현재 보행 점수',
        data: [85, 78, 92, 88, 82, 90],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
      {
        label: '평균 점수',
        data: [80, 80, 80, 80, 80, 80],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const radarOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      r: {
        angleLines: {
          display: false
        },
        suggestedMin: 0,
        suggestedMax: 100
      }
    }
  };

  if (loading) {
    return (
      <div className="analysis-container">
        <div className="loading-content">
          <div className="loading-text">데이터를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-container">
      <header className="analysis-header">
        <button className="back-button" onClick={() => navigate('/main')}>
          ← 뒤로가기
        </button>
        <h1>보행 분석 결과</h1>
        <div className="period-selector">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="week">최근 1주일</option>
            <option value="month">최근 1개월</option>
            <option value="quarter">최근 3개월</option>
          </select>
        </div>
      </header>

      <div className="analysis-content">
        {/* 종합 점수 카드 */}
        <div className="score-card">
          <h2>종합 보행 점수</h2>
          <div className="score-display">
            <div className="score-number">{analysisData?.gaitScore}</div>
            <div className="score-label">/ 100</div>
          </div>
          <div className={`risk-level ${analysisData?.riskLevel}`}>
            위험도: {analysisData?.riskLevel === 'low' ? '낮음' : 
                    analysisData?.riskLevel === 'medium' ? '보통' : '높음'}
          </div>
        </div>

        {/* 차트 섹션 */}
        <div className="charts-section">
          <div className="chart-card">
            <h3>일일 걸음 수 추이</h3>
            <Line data={stepData} options={chartOptions} />
          </div>

          <div className="chart-card">
            <h3>보행 지표 분석</h3>
            <Line data={gaitMetricsData} options={chartOptions} />
          </div>

          <div className="chart-card">
            <h3>보행 능력 레이더 차트</h3>
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>

        {/* 상세 분석 */}
        <div className="detailed-analysis">
          <h3>상세 분석 결과</h3>
          <div className="analysis-metrics">
            <div className="metric-item">
              <span className="metric-label">평균 보행 속도</span>
              <span className="metric-value">1.2 m/s</span>
              <span className="metric-status normal">정상</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">평균 보폭</span>
              <span className="metric-value">0.68 m</span>
              <span className="metric-status normal">정상</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">보행 리듬</span>
              <span className="metric-value">115 steps/min</span>
              <span className="metric-status normal">정상</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">좌우 균형</span>
              <span className="metric-value">92%</span>
              <span className="metric-status good">우수</span>
            </div>
          </div>
        </div>

        {/* 권장사항 */}
        <div className="recommendations">
          <h3>개선 권장사항</h3>
          <ul>
            {analysisData?.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>

        {/* 히스토리 */}
        <div className="analysis-history">
          <h3>분석 히스토리</h3>
          <div className="history-list">
            <div className="history-item">
              <span className="history-date">2024-01-15 14:30</span>
              <span className="history-score">점수: 87</span>
              <span className="history-status">정상</span>
            </div>
            <div className="history-item">
              <span className="history-date">2024-01-14 09:15</span>
              <span className="history-score">점수: 82</span>
              <span className="history-status">정상</span>
            </div>
            <div className="history-item">
              <span className="history-date">2024-01-13 16:45</span>
              <span className="history-score">점수: 79</span>
              <span className="history-status">주의</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage; 