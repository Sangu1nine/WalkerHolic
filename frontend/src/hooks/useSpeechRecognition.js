import { useState, useEffect } from 'react';

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 
        (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      setSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'ko-KR'; // 한국어 설정
      
      recognitionInstance.onstart = () => setListening(true);
      recognitionInstance.onend = () => setListening(false);
      recognitionInstance.onerror = () => setListening(false);
      
      recognitionInstance.onresult = (event) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const transcriptValue = result[0].transcript;
        
        if (result.isFinal) {
          setTranscript(prevTranscript => prevTranscript + ' ' + transcriptValue);
        }
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  const startListening = () => {
    if (!supported || !recognition) return;
    
    // 기존 인식 중지
    recognition.abort();
    
    // 새로운 인식 시작
    setTranscript('');
    recognition.start();
  };

  const stopListening = () => {
    if (!supported || !recognition) return;
    recognition.stop();
  };

  return {
    supported,
    transcript,
    listening,
    startListening,
    stopListening,
    resetTranscript: () => setTranscript('')
  };
} 