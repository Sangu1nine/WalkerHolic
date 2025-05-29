import React, { useState, useEffect, useRef } from 'react';

// 음성 합성 컴포넌트
const SpeechSynthesis = ({ text, isSpeaking, onSpeakingChange }) => {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isPaused, setIsPaused] = useState(false);
  const [isUIExpanded, setIsUIExpanded] = useState(false);
  
  const utteranceRef = useRef(null);
  const synth = window.speechSynthesis;

  // 사용 가능한 음성 목록 로드
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
      
      // 한국어 음성 기본 선택
      const koreanVoice = availableVoices.find(voice => voice.lang.includes('ko'));
      if (koreanVoice) {
        setSelectedVoice(koreanVoice);
      } else if (availableVoices.length > 0) {
        setSelectedVoice(availableVoices[0]);
      }
    };

    // 브라우저에 따라 다른 방식으로 음성 로드
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    } else {
      loadVoices();
    }
    
    // 컴포넌트 언마운트 시 음성 중지
    return () => {
      if (synth) {
        synth.cancel();
      }
    };
  }, []);

  // 음성 재생 시작/중지
  useEffect(() => {
    if (isSpeaking && text && selectedVoice) {
      startSpeaking(text);
    } else {
      stopSpeaking();
    }
    
    return () => {
      if (synth) {
        synth.cancel();
      }
    };
  }, [isSpeaking, text, selectedVoice, rate, pitch, volume]);

  // 음성 재생 시작
  const startSpeaking = (text) => {
    if (synth.speaking) {
      synth.cancel();
    }

    if (text) {
      utteranceRef.current = new SpeechSynthesisUtterance(text);
      
      if (selectedVoice) {
        utteranceRef.current.voice = selectedVoice;
      }
      
      utteranceRef.current.rate = rate;
      utteranceRef.current.pitch = pitch;
      utteranceRef.current.volume = volume;
      
      utteranceRef.current.onstart = () => {
        console.log('음성 재생 시작');
      };
      
      utteranceRef.current.onend = () => {
        console.log('음성 재생 종료');
        onSpeakingChange(false);
        setIsPaused(false);
      };
      
      utteranceRef.current.onerror = (event) => {
        console.error('음성 재생 오류:', event);
        onSpeakingChange(false);
        setIsPaused(false);
      };

      synth.speak(utteranceRef.current);
    }
  };

  // 음성 재생 중지
  const stopSpeaking = () => {
    if (synth.speaking) {
      synth.cancel();
      setIsPaused(false);
    }
  };

  // 음성 재생 일시정지/재개
  const togglePause = () => {
    if (synth.speaking) {
      if (isPaused) {
        synth.resume();
        setIsPaused(false);
      } else {
        synth.pause();
        setIsPaused(true);
      }
    }
  };

  // 음성 선택 변경 핸들러
  const handleVoiceChange = (e) => {
    const voiceURI = e.target.value;
    const voice = voices.find(v => v.voiceURI === voiceURI);
    setSelectedVoice(voice);
    
    if (isSpeaking) {
      stopSpeaking();
      onSpeakingChange(true); // 재시작 트리거
    }
  };

  // UI 토글
  const toggleUI = () => {
    setIsUIExpanded(!isUIExpanded);
  };

  return (
    <div className="speech-synthesis">
      <div className="speech-controls">
        <button 
          className={`speech-toggle-button ${isSpeaking ? 'speaking' : ''}`}
          onClick={() => onSpeakingChange(!isSpeaking)}
          title={isSpeaking ? '음성 중지' : '음성으로 듣기'}
        >
          <span className="speech-icon">
            {isSpeaking ? '🔊' : '🔈'}
          </span>
        </button>
        
        {isSpeaking && (
          <button 
            className={`speech-pause-button ${isPaused ? 'paused' : ''}`}
            onClick={togglePause}
            title={isPaused ? '계속 듣기' : '일시정지'}
          >
            {isPaused ? '▶' : '⏸'}
          </button>
        )}
        
        <button 
          className="speech-settings-button"
          onClick={toggleUI}
          title="음성 설정"
        >
          ⚙️
        </button>
      </div>
      
      {isUIExpanded && (
        <div className="speech-settings">
          <div className="speech-setting">
            <label>음성:</label>
            <select 
              value={selectedVoice?.voiceURI || ''} 
              onChange={handleVoiceChange}
            >
              {voices.map(voice => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>
          
          <div className="speech-setting">
            <label>속도:</label>
            <input 
              type="range" 
              min="0.5" 
              max="2" 
              step="0.1" 
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
            />
            <span>{rate.toFixed(1)}x</span>
          </div>
          
          <div className="speech-setting">
            <label>음높이:</label>
            <input 
              type="range" 
              min="0.5" 
              max="2" 
              step="0.1" 
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
            />
            <span>{pitch.toFixed(1)}</span>
          </div>
          
          <div className="speech-setting">
            <label>볼륨:</label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
            />
            <span>{Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeechSynthesis; 