import React, { useState, useEffect } from 'react';
import SpeechSynthesis from './SpeechSynthesis';

const ChatInterface = ({ messages, onSendMessage, isLoading }) => {
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(false);

  // 새 메시지가 오면 자동 음성 재생 (설정에 따라)
  useEffect(() => {
    if (messages.length > 0 && autoSpeak) {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage.isUser && !isLoading) {
        setCurrentSpeechText(lastMessage.text);
        setIsSpeaking(true);
      }
    }
  }, [messages, isLoading, autoSpeak]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 특정 메시지 음성 재생
  const speakMessage = (messageText) => {
    // 현재 재생 중인 음성과 동일하면 토글
    if (messageText === currentSpeechText && isSpeaking) {
      setIsSpeaking(false);
    } else {
      setCurrentSpeechText(messageText);
      setIsSpeaking(true);
    }
  };

  // 자동 음성 재생 토글
  const toggleAutoSpeak = () => {
    setAutoSpeak(prev => !prev);
  };

  return (
    <div className="chat-interface">
      <div className="auto-speak-toggle">
        <label className="auto-speak-label">
          <input 
            type="checkbox" 
            checked={autoSpeak} 
            onChange={toggleAutoSpeak}
          />
          <span>AI 응답 자동 읽기</span>
        </label>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.isUser ? 'user-message' : 'bot-message'}`}
          >
            <div className="message-content">
              <p>{message.text}</p>
              <span className="message-time">{formatTime(message.timestamp)}</span>
              
              {/* 음성 재생 버튼 (AI 메시지만) */}
              {!message.isUser && (
                <button 
                  className="message-speak-button"
                  onClick={() => speakMessage(message.text)}
                  title="이 메시지 읽기"
                >
                  {isSpeaking && currentSpeechText === message.text ? '🔊' : '🔈'}
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot-message">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <form className="message-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="메시지를 입력하세요..."
          disabled={isLoading}
          className="message-input"
        />
        <button 
          type="submit" 
          disabled={!inputText.trim() || isLoading}
          className="send-button"
        >
          전송
        </button>
      </form>

      {/* 음성 합성 컨트롤 */}
      <SpeechSynthesis 
        text={currentSpeechText}
        isSpeaking={isSpeaking}
        onSpeakingChange={setIsSpeaking}
      />
    </div>
  );
};

export default ChatInterface; 