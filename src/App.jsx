import { Canvas } from '@react-three/fiber';
import { Suspense, useState, useCallback, useRef, useEffect } from 'react';
import { Leva } from 'leva';
import GDScene from './scenes/GDScene';
import GDOverlay from './components/GDOverlay';
import { gdEventBus } from './utils/eventBus';

const WS_URL = `ws://${window.location.hostname}:3000/ws`;

export default function App() {
  const [topic, setTopic] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [speakerInfo, setSpeakerInfo] = useState({
    currentSpeaker: null,
    currentText: '',
    currentSpeakerName: '',
    isSpeaking: false,
    waitingForUser: false,
    connected: false,
  });

  const wsRef = useRef(null);
  const listenersRef = useRef(new Map());
  const audioRef = useRef(null);
  const currentSpeakerRef = useRef(null);
  const isAudioPlayingRef = useRef(false);
  const micQueuedRef = useRef(false);

  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === 1) return wsRef.current;

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setSpeakerInfo((prev) => ({ ...prev, connected: true }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type } = data;
          if (listenersRef.current.has(type)) {
            listenersRef.current.get(type).forEach((cb) => cb(data));
          }
          if (listenersRef.current.has('*')) {
            listenersRef.current.get('*').forEach((cb) => cb(data));
          }
        } catch (e) {}
      };

      ws.onclose = () => {
        setSpeakerInfo((prev) => ({ ...prev, connected: false }));
        wsRef.current = null;
        setTimeout(connectWs, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
      return ws;
    } catch (err) {
      setTimeout(connectWs, 3000);
      return null;
    }
  }, []);

  useEffect(() => {
    const ws = connectWs();
    return () => {
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [connectWs]);

  const sendWs = useCallback((data) => {
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    const ws = connectWs();
    if (ws) {
      ws.addEventListener('open', () => {
        ws.send(JSON.stringify(data));
      }, { once: true });
    }
    return false;
  }, [connectWs]);

  const onWsEvent = useCallback((type, callback) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set());
    }
    listenersRef.current.get(type).add(callback);
    return () => {
      const set = listenersRef.current.get(type);
      if (set) set.delete(callback);
    };
  }, []);

  const playAudio = useCallback((url, seatIndex, emotion, fallbackText) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onplay = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }

    if (currentSpeakerRef.current !== null) {
      gdEventBus.emit({ type: 'STOP_TALKING', seatIndex: currentSpeakerRef.current });
    }

    currentSpeakerRef.current = seatIndex;

    if (url) {
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => {
        isAudioPlayingRef.current = true;
        setIsAudioPlaying(true);
        gdEventBus.emit({ type: 'START_TALKING', seatIndex, emotion });
      };

      audio.onended = () => {
        isAudioPlayingRef.current = false;
        setIsAudioPlaying(false);
        gdEventBus.emit({ type: 'STOP_TALKING', seatIndex });
        audioRef.current = null;
        if (currentSpeakerRef.current === seatIndex) {
          currentSpeakerRef.current = null;
        }
      };

      audio.onerror = () => {
        console.warn('Audio playback error, falling back to timer');
        isAudioPlayingRef.current = false;
        setIsAudioPlaying(false);
        audioRef.current = null;
        
        // Fallback: use text length timer
        gdEventBus.emit({ type: 'START_TALKING', seatIndex, emotion });
        const duration = Math.min((fallbackText || '').length * 60, 4000);
        setTimeout(() => {
          gdEventBus.emit({ type: 'STOP_TALKING', seatIndex });
          if (currentSpeakerRef.current === seatIndex) {
            currentSpeakerRef.current = null;
          }
        }, duration);
      };

      audio.play().catch((err) => {
        console.warn('Audio play failed, falling back to timer:', err.message);
        audio.onerror();
      });
    } else {
      // Fallback: no audio url, use estimated duration
      isAudioPlayingRef.current = false;
      setIsAudioPlaying(false);
      gdEventBus.emit({ type: 'START_TALKING', seatIndex, emotion });
      const duration = Math.min((fallbackText || '').length * 60, 4000);
      setTimeout(() => {
        gdEventBus.emit({ type: 'STOP_TALKING', seatIndex });
        if (currentSpeakerRef.current === seatIndex) {
          currentSpeakerRef.current = null;
        }
      }, duration);
    }
  }, []);

  const handleGdEvent = useCallback((event) => {
    switch (event.type) {
      case 'SPEAK': {
        const seatIdx = event.seatIndex ?? (parseInt(event.speaker?.replace('P', '')) - 1) ?? 0;
        setSpeakerInfo((prev) => ({
          ...prev,
          currentSpeaker: event.speaker,
          currentText: event.text,
          currentSpeakerName: event.speakerName,
          isSpeaking: true,
          waitingForUser: false,
        }));

        if (event.audioUrl) {
          playAudio(event.audioUrl, seatIdx, event.emotion || 'neutral', event.text);
        }
        break;
      }

      case 'SPEAK_AUDIO': {
        const seatIdx = event.speaker ? (parseInt(event.speaker.replace('P', '')) - 1) : 0;
        if (event.url && !audioRef.current) {
          playAudio(event.url, seatIdx, 'neutral', '');
        }
        break;
      }

      case 'STOP_SPEAKING':
        // Only clear subtitles if audio is not playing
        if (!audioRef.current || audioRef.current.paused) {
          setSpeakerInfo((prev) => ({
            ...prev, isSpeaking: false, currentText: '',
          }));
          if (currentSpeakerRef.current !== null) {
            gdEventBus.emit({ type: 'STOP_TALKING', seatIndex: currentSpeakerRef.current });
            currentSpeakerRef.current = null;
          }
        }
        break;

      case 'WAITING_FOR_USER':
        setSpeakerInfo((prev) => ({ ...prev, waitingForUser: true }));
        if (micQueuedRef.current) {
          micQueuedRef.current = false;
          setTimeout(() => {
            handleRequestMic();
          }, 100);
        }
        break;

      case 'USER_TIMEOUT':
        setSpeakerInfo((prev) => ({ ...prev, waitingForUser: false }));
        break;

      case 'SIMULATION_START':
        setTopic(event.topic);
        break;

      case 'SIMULATION_END':
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        isAudioPlayingRef.current = false;
        setIsAudioPlaying(false);
        if (currentSpeakerRef.current !== null) {
          gdEventBus.emit({ type: 'STOP_TALKING', seatIndex: currentSpeakerRef.current });
          currentSpeakerRef.current = null;
        }
        setSpeakerInfo((prev) => ({
          ...prev, isSpeaking: false, waitingForUser: false,
          currentSpeaker: null, currentText: '', currentSpeakerName: '',
        }));
        break;
    }
  }, [playAudio]);

  useEffect(() => {
    const unsubs = [
      onWsEvent('SPEAK', (d) => handleGdEvent(d)),
      onWsEvent('SPEAK_AUDIO', (d) => handleGdEvent(d)),
      onWsEvent('STOP_SPEAKING', (d) => handleGdEvent(d)),
      onWsEvent('WAITING_FOR_USER', (d) => handleGdEvent(d)),
      onWsEvent('USER_TIMEOUT', (d) => handleGdEvent(d)),
      onWsEvent('SIMULATION_START', (d) => handleGdEvent(d)),
      onWsEvent('SIMULATION_END', (d) => handleGdEvent(d)),
    ];
    return () => unsubs.forEach((u) => u());
  }, [onWsEvent, handleGdEvent]);

  const handleStart = useCallback((topicText) => {
    setTopic(topicText);
    sendWs({ type: 'START_SIMULATION', topic: topicText });
  }, [sendWs]);

  const handleUserInterrupt = useCallback(() => {
    sendWs({ type: 'USER_INTERRUPT' });
  }, [sendWs]);

  const handleSendMessage = useCallback((text) => {
    sendWs({ type: 'USER_MESSAGE', text });
  }, [sendWs]);

  const handleRequestMic = useCallback(() => {
    if (isListening) return;

    if (!speakerInfo.waitingForUser) {
      micQueuedRef.current = true;
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not available in this browser. Please type your response.');
      return;
    }

    setIsListening(true);
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setIsListening(false);
      if (text.trim()) {
        handleSendMessage(text.trim());
      } else {
        alert('No speech detected. Please try again or type.');
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      const messages = {
        'not-allowed': 'Microphone access was denied. Please allow mic access or type your response.',
        'no-speech': 'No speech was detected. Please try again.',
        'aborted': '',
        'audio-capture': 'No microphone found. Please type your response.',
        'network': 'Network error occurred. Please type your response.',
        'service-not-allowed': 'Speech service is not allowed.',
      };
      const msg = messages[event.error];
      if (msg) alert(msg);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      setIsListening(false);
      alert('Could not start speech recognition. Please type your response.');
    }
  }, [isListening, handleSendMessage]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 2.4, 6.5], fov: 45, near: 0.1, far: 50 }}
        dpr={[1, 2]}
        gl={{ outputColorSpace: 'srgb', toneMapping: 3, toneMappingExposure: 1.0 }}
        shadows
      >
        <Suspense fallback={null}>
          <GDScene onWsEvent={onWsEvent} sendWs={sendWs} />
        </Suspense>
      </Canvas>

      <GDOverlay
        connected={speakerInfo.connected}
        currentSpeaker={speakerInfo.currentSpeaker}
        currentText={speakerInfo.currentText}
        currentSpeakerName={speakerInfo.currentSpeakerName}
        isSpeaking={speakerInfo.isSpeaking || isAudioPlaying}
        waitingForUser={speakerInfo.waitingForUser}
        topic={topic}
        isListening={isListening}
        isAudioPlaying={isAudioPlaying}
        onStart={handleStart}
        onSendMessage={handleSendMessage}
        onRequestMic={handleRequestMic}
        onUserInterrupt={handleUserInterrupt}
      />

      <Leva collapsed />
    </div>
  );
}
