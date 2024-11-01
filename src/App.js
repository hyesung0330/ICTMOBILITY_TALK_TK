import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import logo from './imgs/logo.png';  // 이미지 파일 불러오기


const App = () => {
  const [isTalking, setIsTalking] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [responseText, setResponseText] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [audio, setAudio] = useState(null);
  const [questionText, setQuestionText] = useState('');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false); // 오디오 재생 여부 상태 추가

  // 권한 확인 함수
  const checkMicrophonePermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (error) {
      return false;
    }
  };

  const startConversation = async () => {
    if (isTalking || loading) {
      return;
    }

    // 오류 메시지 및 상태 초기화
    setErrorMessage('');
    setQuestionText('');
    setResponseText('');
    setAudioUrl(null);

    const hasPermission = await checkMicrophonePermission();
    if (!hasPermission) {
      setErrorMessage('마이크 접근 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
      return;
    }

    setIsTalking(true);
    setLoading(true);
    setMessage('');

    try {
      const mimeTypes = ['audio/webm; codecs=opus', 'audio/ogg; codecs=opus', 'audio/mp4'];
      let mimeType = '';

      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      if (!mimeType) {
        setErrorMessage('지원되는 오디오 형식이 없습니다.');
        setIsTalking(false);
        setLoading(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType });
      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        const formData = new FormData();
        audioChunks.length = 0; // 녹음 데이터를 초기화
        formData.append('file', audioBlob, 'input_audio');
      
        try {
          setLoading(true); // 로딩 애니메이션 시작
          setMessage('응답 생성중...');
          const response = await axios.post(`/api/ask`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
      
          const { status, question, answer, audio_url } = response.data;
      
          if (
            status === "no_meaningful_input" ||
            question.length < 2 || // 너무 짧은 텍스트
            /(you|mbc|이덕영)/i.test(question) || // 특정 무의미한 단어 필터링
            !/[가-힣]/.test(question) || // 한글이 포함되지 않은 경우 필터링
            (question.match(/[가-힣]/g) || []).length < question.length * 0.5 // 한글 비율이 50% 미만인 경우 필터링
          ) {
            alert('입력이 잘못되었습니다. 다시 입력해주세요'); // 알림창 출력
            setLoading(false);
            setIsTalking(false);
            return;
          }
          
          // 상태 업데이트
          setQuestionText(question);
          setResponseText(answer);
          setAudioUrl(audio_url);
        } catch (error) {
          setErrorMessage(`오디오 전송 중 오류가 발생했습니다. 다시 시도하세요. ${error}`);
        } finally {
          setLoading(false); // 로딩 애니메이션 종료
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        setErrorMessage('마이크 접근이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
      } else {
        setErrorMessage('마이크 접근 오류가 발생했습니다. 권한을 확인하세요.');
      }
      setIsTalking(false);
      setLoading(false);
    }
  };

  const stopConversation = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    setIsTalking(false);
    setMessage('대화가 종료되었습니다.');
  };

  const playAudio = () => {
    if (audioUrl && !isAudioPlaying) {
      const newAudio = new Audio(audioUrl);
      newAudio.play()
        .then(() => {
          setAudio(newAudio);
          setIsAudioPlaying(true);
          newAudio.onended = () => {
            setIsAudioPlaying(false); // 재생이 끝나면 상태를 false로 변경
          };
        })
        .catch((error) => {
          setErrorMessage('오디오 재생 중 오류가 발생했습니다. 사용자 상호작용이 필요합니다.');
        });
    }
  };

  const stopAudio = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0; // 재생 위치 초기화
      setIsAudioPlaying(false); // 오디오 정지 상태로 변경
    }
  };

  return (
    <div className="App">
      <img src={logo} alt="Logo" style={{ width: '250px', height: 'auto', marginBottom: '20px' }} />
      <h1 className="ai-chat-title">AI 음성 채팅</h1>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{message}</p>
        </div>
      )}
      {isTalking ? (
        <div>
          <p>녹음 중입니다...</p>
          {message && <p>{message}</p>}
          <button onClick={stopConversation}>입력 완료</button>
        </div>
      ) : (
        <div className="controls-container">
          <button onClick={startConversation} disabled={loading}>음성 입력</button>
        </div>
      )}
      {(questionText || responseText) && (
        <div className="dashboard-container">
          {questionText && (
            <div className="dashboard-box">
              <p><strong>입력:</strong> {questionText}</p>
            </div>
          )}
          {responseText && (
            <div className="dashboard-box">
              <p><strong>응답:</strong> {responseText}</p>
            </div>
          )}
        </div>
      )}
      {audioUrl && (
        <div style={{ marginTop: '20px' }}>
          <button onClick={playAudio} disabled={isAudioPlaying}>응답 재생</button>
          <button onClick={stopAudio} disabled={!isAudioPlaying}>응답 정지</button>
        </div>
      )}
    </div>
  );
  
}

export default App;
