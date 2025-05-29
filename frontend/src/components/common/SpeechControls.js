import React, { useState } from 'react';
import { useSpeechRecognition, useSpeechSynthesis } from '../../hooks';

const SpeechControls = () => {
  const [message, setMessage] = useState('');
  
  // 음성 인식 훅 사용
  const {
    transcript,
    listening,
    startListening,
    stopListening,
    resetTranscript,
    supported: sttSupported
  } = useSpeechRecognition();
  
  // 음성 합성 훅 사용
  const {
    speak,
    speaking,
    cancel,
    supported: ttsSupported
  } = useSpeechSynthesis();
  
  // 음성 인식된 텍스트를 메시지에 추가
  const handleAddTranscript = () => {
    setMessage(prev => prev + ' ' + transcript);
    resetTranscript();
  };
  
  // 메시지 음성으로 읽기
  const handleSpeak = () => {
    speak({ text: message });
  };
  
  if (!sttSupported && !ttsSupported) {
    return <div>이 브라우저는 음성 기능을 지원하지 않습니다.</div>;
  }
  
  return (
    <div className="speech-controls">
      <h3>음성 제어</h3>
      
      <div className="transcript-container">
        <h4>음성 인식 결과:</h4>
        <p>{transcript}</p>
        <div className="button-group">
          <button 
            onClick={listening ? stopListening : startListening}
            disabled={!sttSupported}
          >
            {listening ? '음성 인식 중지' : '음성 인식 시작'}
          </button>
          <button 
            onClick={handleAddTranscript} 
            disabled={!transcript}
          >
            인식된 텍스트 추가
          </button>
        </div>
      </div>
      
      <div className="message-container">
        <h4>메시지:</h4>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          style={{ width: '100%' }}
        />
        <div className="button-group">
          <button 
            onClick={handleSpeak}
            disabled={!ttsSupported || !message || speaking}
          >
            {speaking ? '말하는 중...' : '소리내어 읽기'}
          </button>
          <button 
            onClick={cancel}
            disabled={!speaking}
          >
            읽기 중지
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpeechControls; 