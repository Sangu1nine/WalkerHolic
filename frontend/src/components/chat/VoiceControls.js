import React, { useState, useEffect, useRef } from 'react';

const VoiceControls = ({ onVoiceMessage, isLoading }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [supported, setSupported] = useState(false);
  const [volume, setVolume] = useState(0);
  const [showSubmitButton, setShowSubmitButton] = useState(false);
  const inactivityTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    // 음성 인식 API 지원 확인
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      // 향상된 인식 설정
      recognitionInstance.continuous = true; // 연속 인식 모드 활성화
      recognitionInstance.interimResults = true;
      recognitionInstance.maxAlternatives = 3; // 여러 인식 결과 후보 활성화
      recognitionInstance.lang = 'ko-KR';
      
      // 음성 인식 감도를 높이기 위한 추가 설정
      if ('audioContext' in window || 'webkitAudioContext' in window) {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          const audioContext = new AudioContext();
          
          // 오디오 컨텍스트를 통해 마이크 입력 처리
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
              const source = audioContext.createMediaStreamSource(stream);
              const gainNode = audioContext.createGain();
              
              // 마이크 게인 증가 (감도 향상)
              gainNode.gain.value = 2.0;
              
              source.connect(gainNode);
              // 출력은 연결하지 않음 (피드백 방지)
            })
            .catch(err => console.error('마이크 접근 오류:', err));
        } catch (err) {
          console.error('오디오 처리 오류:', err);
        }
      }
      
      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        // 모든 결과를 처리하여 더 정확한 인식 제공
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        // 최종 결과가 있으면 사용, 아니면 임시 결과 사용
        const transcriptValue = finalTranscript || interimTranscript;
        setTranscript(transcriptValue);
        
        // 텍스트가 인식되면 제출 버튼 표시
        if (transcriptValue.trim() !== '') {
          setShowSubmitButton(true);
          // 비활성 타이머 재설정
          resetInactivityTimer();
        }
      };
      
      // 오류 처리 강화
      recognitionInstance.onerror = (event) => {
        console.error('음성 인식 오류:', event.error);
        // 오류 발생 시 재시작 시도
        if (event.error === 'no-speech' && isListening) {
          try {
            recognitionInstance.stop();
            setTimeout(() => {
              if (isListening) {
                recognitionInstance.start();
              }
            }, 300);
          } catch (e) {
            console.error('음성 인식 재시작 오류:', e);
          }
        }
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
        stopAudioAnalysis();
        
        // 인식 중단 시 제출 버튼이 필요한 경우에만 남겨둠
        if (transcript.trim() === '') {
          setShowSubmitButton(false);
        }
      };
      
      setRecognition(recognitionInstance);
      setSupported(true);
    }

    return () => {
      stopAudioAnalysis();
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [onVoiceMessage, isListening]);

  const resetInactivityTimer = () => {
    // 기존 타이머 제거
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // 3초 후 자동 제출 타이머 설정 (음성 인식 중일 때만)
    if (isListening) {
      inactivityTimerRef.current = setTimeout(() => {
        if (isListening && transcript.trim() !== '') {
          console.log('음성 비활성 감지 - 자동 제출');
          submitTranscript();
        }
      }, 3000);
    }
  };

  const startAudioAnalysis = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        // FFT 크기를 늘려 더 정밀한 분석
        analyserRef.current.fftSize = 1024;
        // 감도 향상을 위한 분석 설정 조정
        analyserRef.current.minDecibels = -90; // 기본값 -100에서 상향 조정
        analyserRef.current.maxDecibels = -10; // 기본값 -30에서 상향 조정
        analyserRef.current.smoothingTimeConstant = 0.5; // 반응성 조정 (0-1)
      }

      if (!microphoneRef.current) {
        // 향상된 오디오 설정으로 마이크 접근
        const constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: 48000, // 높은 샘플레이트 사용
            sampleSize: 16
          }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        microphoneRef.current = stream;
        
        // 게인 노드를 추가하여 마이크 볼륨 증가
        const source = audioContextRef.current.createMediaStreamSource(stream);
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.value = 2.5; // 2.5배 증폭
        
        source.connect(gainNode);
        gainNode.connect(analyserRef.current);
        
        // 상태 로깅
        console.log('오디오 분석 설정 완료', {
          sampleRate: audioContextRef.current.sampleRate,
          fftSize: analyserRef.current.fftSize,
          minDecibels: analyserRef.current.minDecibels,
          maxDecibels: analyserRef.current.maxDecibels
        });
      }

      const updateVolume = () => {
        // 주파수 데이터와 시간 도메인 데이터 모두 분석
        const frequencyData = new Uint8Array(analyserRef.current.frequencyBinCount);
        const timeData = new Uint8Array(analyserRef.current.fftSize);
        
        analyserRef.current.getByteFrequencyData(frequencyData);
        analyserRef.current.getByteTimeDomainData(timeData);
        
        // 주파수 기반 평균 볼륨 계산
        const frequencyAverage = frequencyData.reduce((acc, val) => acc + val, 0) / 
                               frequencyData.length;
        
        // 시간 도메인 데이터에서 RMS(Root Mean Square) 볼륨 계산
        let sumSquares = 0;
        for(let i = 0; i < timeData.length; i++) {
          // 128을 빼서 -128에서 127 범위로 변환
          const value = ((timeData[i] - 128) / 128) * 2;
          sumSquares += value * value;
        }
        const rms = Math.sqrt(sumSquares / timeData.length);
        const rmsVolume = Math.min(100, Math.round(rms * 200)); // 0-100 범위로 조정
        
        // 두 값의 가중 평균으로 더 정확한 볼륨 계산
        const combinedVolume = Math.round((frequencyAverage * 0.6 + rmsVolume * 0.4));
        
        // 볼륨 값이 5 이상일 때만 업데이트 (노이즈 필터링)
        if (combinedVolume > 5) {
          setVolume(combinedVolume);
        } else {
          setVolume(0);
        }
        
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      
      updateVolume();
    } catch (error) {
      console.error('마이크 접근 오류:', error);
    }
  };

  const stopAudioAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (microphoneRef.current) {
      microphoneRef.current.getTracks().forEach(track => track.stop());
      microphoneRef.current = null;
    }
    
    setVolume(0);
  };

  const startListening = () => {
    if (recognition && !isLoading) {
      try {
        setTranscript('');
        setIsListening(true);
        setShowSubmitButton(false);
        
        // 오디오 분석 시작
        startAudioAnalysis();
        
        // 약간의 지연 후 인식 시작 (오디오 컨텍스트 초기화 시간 고려)
        setTimeout(() => {
          try {
            recognition.start();
            console.log('음성 인식 시작됨');
          } catch (error) {
            console.error('음성 인식 시작 오류:', error);
            // 오류 발생 시 재시도
            setTimeout(() => {
              try {
                recognition.start();
              } catch (innerError) {
                console.error('음성 인식 재시도 실패:', innerError);
                setIsListening(false);
                stopAudioAnalysis();
              }
            }, 300);
          }
        }, 100);
      } catch (error) {
        console.error('음성 인식 준비 오류:', error);
        setIsListening(false);
      }
    }
  };

  const stopListening = () => {
    if (recognition) {
      try {
        recognition.stop();
        console.log('음성 인식 중지됨');
      } catch (error) {
        console.error('음성 인식 중지 오류:', error);
      }
      
      setIsListening(false);
      stopAudioAnalysis();
      
      // 타이머 초기화
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    }
  };

  const submitTranscript = () => {
    if (transcript.trim() !== '') {
      console.log('음성 메시지 제출:', transcript);
      onVoiceMessage(transcript);
      setTranscript('');
      setShowSubmitButton(false);
      stopListening();
    } else {
      console.log('제출할 텍스트가 없음');
    }
  };

  return (
    <div className="voice-controls">
      {supported ? (
        <div>
          <button 
            className={`voice-button ${isListening ? 'listening' : ''}`}
            onClick={isListening ? stopListening : startListening}
            disabled={isLoading}
          >
            {isListening ? '음성 인식 중...' : '음성으로 말하기'}
          </button>
          
          {isListening && (
            <div className="voice-feedback">
              <div className="volume-meter">
                <div className="volume-bar" style={{ width: `${volume}%` }}></div>
                <span className="volume-text">{volume}%</span>
              </div>
              <div className="transcript-preview">
                <p>{transcript || '말씀해주세요...'}</p>
              </div>
            </div>
          )}
          
          {showSubmitButton && (
            <button 
              className="submit-transcript-button"
              onClick={submitTranscript}
              disabled={isLoading}
            >
              입력하기
            </button>
          )}
        </div>
      ) : (
        <p className="voice-not-supported">이 브라우저는 음성 인식을 지원하지 않습니다.</p>
      )}
    </div>
  );
};

export default VoiceControls; 