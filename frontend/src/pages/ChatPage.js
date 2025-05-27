import React, { useState, useEffect, useRef } from 'react';
import ChatInterface from '../components/chat/ChatInterface';
import VoiceControls from '../components/chat/VoiceControls';
import { apiService } from '../services/api';
import './ChatPage.css';

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState(localStorage.getItem('userId') || 'demo_user');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // 초기 인사 메시지
    setMessages([
      {
        id: 1,
        text: '안녕하세요! 보행 분석 AI 어시스턴트입니다. 궁금한 점이 있으시면 언제든 물어보세요.',
        isUser: false,
        timestamp: new Date()
      }
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageText) => {
    const userMessage = {
      id: Date.now(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await apiService.sendChatMessage({
        user_id: userId,
        message: messageText,
        timestamp: new Date().toISOString(),
        is_user: true
      });

      // 성공적인 응답이지만 오류 상태가 포함된 경우 (예: API 키 누락)
      if (response.status === 'error') {
        const errorMessage = {
          id: Date.now() + 1,
          text: response.response || '서버에서 오류가 발생했습니다.',
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }

      const botMessage = {
        id: Date.now() + 1,
        text: response.response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      
      // 서버 응답이 있는 경우
      let errorText = '죄송합니다. 메시지 처리 중 오류가 발생했습니다.';
      if (error.response && error.response.data) {
        if (error.response.data.detail) {
          errorText = `오류: ${error.response.data.detail}`;
        } else if (error.response.data.response) {
          errorText = error.response.data.response;
        }
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceMessage = (transcript) => {
    if (transcript) {
      handleSendMessage(transcript);
    }
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h2>AI 어시스턴트</h2>
        <p>보행 분석 및 건강 상담</p>
      </header>

      <div className="chat-content">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
        <div ref={messagesEndRef} />
      </div>

      <VoiceControls
        onVoiceMessage={handleVoiceMessage}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ChatPage;
