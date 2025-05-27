import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoadingPage from './pages/LoadingPage';
import LoginPage from './pages/login/LoginPage';
import MainPage from './pages/main/MainPage';
import SettingsPage from './pages/settings/SettingsPage';
import ChatPage from './pages/ChatPage';
import AnalysisPage from './pages/analysis/AnalysisPage';
import HealthInfoPage from './pages/health/HealthInfoPage';
import HardwarePage from './pages/hardware/HardwarePage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LoadingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/main" element={<MainPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/health-info" element={<HealthInfoPage />} />
          <Route path="/hardware" element={<HardwarePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
