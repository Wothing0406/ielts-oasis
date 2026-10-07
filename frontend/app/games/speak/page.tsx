"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Mic, Square, Volume2, VolumeX, Sparkles, Trophy, ArrowLeft, 
  Info, Zap, Radio, RefreshCw, Flame, Award, CheckCircle2, AlertTriangle, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MatchaBearSticker, LearnerSticker, MatchaStickerBadge } from '@/components/MatchaStickers';

const API_URL = '/api';

const INITIAL_QUESTIONS = [
  "What is your favorite hobby during weekends?",
  "Do you prefer studying alone or in a group?",
  "How does technology affect your daily lifestyle?",
  "What is your favorite type of food? Why?",
  "Do you prefer living in a city or the countryside?"
];

export default function SpeakingReflexGame() {
  const [user, setUser] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(INITIAL_QUESTIONS[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  
  // Gemini Live mechanism state
  const [isLiveHandsFree, setIsLiveHandsFree] = useState(true);
  const [isBearSpeaking, setIsBearSpeaking] = useState(false);
  const [speakingPhase, setSpeakingPhase] = useState<'idle' | 'reply_and_critique' | 'next_question'>('idle');
  const [liveVolume, setLiveVolume] = useState<number>(0);

  // Conversation history
  const [chatHistory, setChatHistory] = useState<Array<{ 
    sender: 'bear' | 'user'; 
    text: string; 
    data?: any;
    spokenReply?: string;
    spokenQuestion?: string;
  }>>([
    { 
      sender: 'bear', 
      text: "Hello buddy! I'm your Cambridge IELTS Coach, Matcha Bear. Let's talk directly with voice! Answer my question to test your reflexes and pronunciation. 🐻🍵",
      spokenReply: "Hello buddy! I am your Cambridge IELTS Coach, Matcha Bear. Let us talk directly with voice! Answer my question to test your reflexes and pronunciation."
    },
    { 
      sender: 'bear', 
      text: INITIAL_QUESTIONS[0],
      spokenQuestion: INITIAL_QUESTIONS[0]
    }
  ]);

  // Reflex timing
  const [responseDelay, setResponseDelay] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const questionStartTimeRef = useRef<number>(Date.now());
  const audioContextRef = useRef<AudioContext | null>(null);
  const volumeTimerRef = useRef<any>(null);
  const peakVolumeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Audio playback and VAD refs
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const silenceTimerRef = useRef<any>(null);
  const hasSpokenRef = useRef<boolean>(false);
  const consecutiveVoiceRef = useRef<number>(0);
  const activeSpeechIdRef = useRef<number>(0);
  const speechWatchdogRef = useRef<any>(null);

  // Pre-unlock mobile audio on user gesture
  const primeMobileAudio = () => {
    if (!currentAudioRef.current && typeof window !== 'undefined') {
      try {
        const audio = new Audio();
        audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        audio.volume = 0.01;
        audio.play().then(() => {
          audio.pause();
        }).catch(() => {});
        currentAudioRef.current = audio;
      } catch (e) {}
    }
    if ('speechSynthesis' in window) {
      try {
        const dummyUtterance = new SpeechSynthesisUtterance(' ');
        dummyUtterance.volume = 0.01;
        window.speechSynthesis.speak(dummyUtterance);
      } catch (e) {}
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("oasis_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
    }
    questionStartTimeRef.current = Date.now();

    return () => {
      interruptSpeech();
      stopRecordingCleanup();
    };
  }, []);

  // Universal Audio Player (Neural Edge-TTS via /api/tts with SpeechSynthesis fallback)
  const playSpeech = (text: string, onEnd?: () => void) => {
    const currentSpeechId = ++activeSpeechIdRef.current;
    if (speechWatchdogRef.current) {
      clearTimeout(speechWatchdogRef.current);
      speechWatchdogRef.current = null;
    }

    // Clean text for speech synthesis (remove markdown and emojis)
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[*_~`#\[\]\(\)]/g, ' ')
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    // Single-fire callback protector
    let hasEnded = false;
    const safeOnEnd = () => {
      if (hasEnded) return;
      hasEnded = true;
      if (speechWatchdogRef.current) {
        clearTimeout(speechWatchdogRef.current);
        speechWatchdogRef.current = null;
      }
      if (activeSpeechIdRef.current === currentSpeechId) {
        if (onEnd) onEnd();
      }
    };

    // Watchdog timer to prevent deadlocks (max duration based on word count + safety buffer)
    const estimatedSecs = Math.max(4, Math.ceil(cleanText.split(/\s+/).length / 2.2) + 3);
    speechWatchdogRef.current = setTimeout(() => {
      if (!hasEnded && activeSpeechIdRef.current === currentSpeechId) {
        console.warn("Speech playback watchdog expired, auto-resolving speech sequence");
        safeOnEnd();
      }
    }, estimatedSecs * 1000);

    // Stop current audio if any
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      activeUtteranceRef.current = null;
    }

    // Attempt 1: Call /api/tts (Neural Edge-TTS)
    let isHandled = false;
    const fetchTts = async () => {
      try {
        const res = await fetch(`${API_URL}/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word: cleanText })
        });
        if (activeSpeechIdRef.current !== currentSpeechId) return;

        if (res.ok) {
          const data = await res.json();
          if (activeSpeechIdRef.current !== currentSpeechId) return;

          if (data.audio_url) {
            isHandled = true;
            let audio = currentAudioRef.current;
            if (!audio) {
              audio = new Audio();
              currentAudioRef.current = audio;
            }
            audio.src = data.audio_url;
            audio.volume = 1.0;
            audio.onended = () => {
              safeOnEnd();
            };
            audio.onerror = () => {
              console.warn("Edge-TTS playback error, falling back to Web Speech Synthesis");
              fallbackWebSpeech(cleanText, safeOnEnd);
            };
            const p = audio.play();
            if (p !== undefined) {
              p.catch(e => {
                console.warn("Autoplay prevented, fallback to Web Speech:", e);
                fallbackWebSpeech(cleanText, safeOnEnd);
              });
            }
            return;
          }
        }
      } catch (err) {
        console.warn("Network error calling /api/tts, using fallback:", err);
      }
      if (!isHandled && activeSpeechIdRef.current === currentSpeechId) {
        fallbackWebSpeech(cleanText, safeOnEnd);
      }
    };

    const fallbackWebSpeech = (textToSpeak: string, callback?: () => void) => {
      if (activeSpeechIdRef.current !== currentSpeechId) return;
      if (!('speechSynthesis' in window)) {
        if (callback) callback();
        return;
      }
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        
        // Select an English voice if available
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Jenny') || v.name.includes('Samantha')));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }

        // Retain ref against Chrome GC bug
        activeUtteranceRef.current = utterance;
        utterance.onend = () => {
          activeUtteranceRef.current = null;
          if (callback) callback();
        };
        utterance.onerror = (e) => {
          console.warn("SpeechSynthesis error:", e);
          activeUtteranceRef.current = null;
          if (callback) callback();
        };

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error("SpeechSynthesis execution failed:", e);
        if (callback) callback();
      }
    };

    fetchTts();
  };

  // Gemini Live 2-Phase Response Sequence:
  // Phase 1: Speak Reply & Coaching Critique FIRST
  // Phase 2: Speak Next Follow-up Question
  const speakSequence = (replyAndCritiqueText: string, nextQuestionText: string, shouldAutoArm: boolean = true) => {
    setIsBearSpeaking(true);
    setSpeakingPhase('reply_and_critique');

    playSpeech(replyAndCritiqueText, () => {
      // Phase 1 completed -> Brief pause before Phase 2
      setTimeout(() => {
        setSpeakingPhase('next_question');
        playSpeech(nextQuestionText, () => {
          // Phase 2 completed
          setIsBearSpeaking(false);
          setSpeakingPhase('idle');
          questionStartTimeRef.current = Date.now(); // Accurate reflex baseline timing!
          
          // If Live Hands-Free mode is enabled AND speech was valid, automatically arm microphone for learner!
          if (isLiveHandsFree && shouldAutoArm) {
            setTimeout(() => {
              startRecording();
            }, 1000);
          }
        });
      }, 700);
    });
  };

  // Interrupt anytime (Famous Gemini Live feature)
  const interruptSpeech = () => {
    activeSpeechIdRef.current++;
    if (speechWatchdogRef.current) {
      clearTimeout(speechWatchdogRef.current);
      speechWatchdogRef.current = null;
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      activeUtteranceRef.current = null;
    }
    setIsBearSpeaking(false);
    setSpeakingPhase('idle');
  };

  // Change Question / Skip to New Topic
  const changeQuestion = async () => {
    interruptSpeech();
    stopRecording();
    primeMobileAudio();

    const token = localStorage.getItem("oasis_token");
    let newQ = "";
    if (token) {
      try {
        const res = await fetch(`${API_URL}/speaking/generate-sentence?level=medium`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const d = await res.json();
          if (d.sentence) {
            newQ = `How do you feel about this topic: "${d.sentence}"? What are your thoughts?`;
          }
        }
      } catch (e) {}
    }
    if (!newQ) {
      const remaining = INITIAL_QUESTIONS.filter(q => q !== currentQuestion);
      newQ = remaining[Math.floor(Math.random() * remaining.length)] || INITIAL_QUESTIONS[0];
    }
    setCurrentQuestion(newQ);
    questionStartTimeRef.current = Date.now();
    setChatHistory(prev => [...prev, {
      sender: 'bear',
      text: `Let's switch topics! ${newQ}`,
      spokenQuestion: `Let's switch topics! ${newQ}`
    }]);
    playSpeech(`Let's switch to a new topic! ${newQ}`);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    // If Bear is currently speaking, interrupt
    interruptSpeech();
    primeMobileAudio();

    try {
      const now = Date.now();
      const delay = (now - questionStartTimeRef.current) / 1000;
      setResponseDelay(delay);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;
      audioChunksRef.current = [];
      hasSpokenRef.current = false;
      consecutiveVoiceRef.current = 0;
      peakVolumeRef.current = 0;
      const recStartTime = Date.now();
      
      // Setup Web Audio API volume analyzer for real-time waveform & VAD
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        audioContextRef.current = audioContext;
        
        const dataArray = new Uint8Array(analyser.fftSize);
        if (volumeTimerRef.current) clearInterval(volumeTimerRef.current);

        volumeTimerRef.current = setInterval(() => {
          analyser.getByteTimeDomainData(dataArray);
          let sumSq = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const val = (dataArray[i] - 128) / 128;
            sumSq += val * val;
          }
          const rms = Math.sqrt(sumSq / dataArray.length);
          setLiveVolume(Math.min(1, rms * 4));

          if (rms > peakVolumeRef.current) {
            peakVolumeRef.current = rms;
          }

          const recDuration = (Date.now() - recStartTime) / 1000;

          // Voice Activity Detection (VAD) for Gemini Live Hands-Free mode
          // Require at least 4 consecutive frames > 0.028 (~320ms) to confirm real vocal speech
          if (rms > 0.028) {
            consecutiveVoiceRef.current += 1;
            if (consecutiveVoiceRef.current >= 4) {
              hasSpokenRef.current = true;
            }
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
          } else {
            consecutiveVoiceRef.current = 0;
            // Only auto-submit after user has genuinely spoken and audio is at least 2.0s
            if (hasSpokenRef.current && isLiveHandsFree && recDuration >= 2.0) {
              if (!silenceTimerRef.current) {
                silenceTimerRef.current = setTimeout(() => {
                  console.log("Gemini Live VAD: Silence detected, auto-submitting speech!");
                  stopRecording();
                }, 2600);
              }
            }
          }
        }, 80);
      } catch (e) {
        console.error("Audio analyzer failed to initialize:", e);
      }

      // Supported MIME detection
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        }
      }

      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType });
      } catch (e) {
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const recordedMime = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: recordedMime });
        evaluateResponse(audioBlob, recordedMime);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
      if ((window as any).showToast) {
        (window as any).showToast("Cannot access microphone. Please allow mic permissions!", "error");
      }
    }
  };

  const stopRecordingCleanup = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (volumeTimerRef.current) {
      clearInterval(volumeTimerRef.current);
      volumeTimerRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setLiveVolume(0);
  };

  const stopRecording = () => {
    stopRecordingCleanup();
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const evaluateResponse = async (audioBlob: Blob, mimeType?: string) => {
    const token = localStorage.getItem("oasis_token");
    if (!token) {
      if ((window as any).showToast) {
        (window as any).showToast("Please log in to play!", "info");
      }
      return;
    }

    // Client-side silence check
    if (peakVolumeRef.current > 0 && peakVolumeRef.current < 0.003) {
      if ((window as any).showToast) {
        (window as any).showToast("No speech detected from microphone. Please speak louder into your mic! 🎙️", "warning");
      }
      setIsEvaluating(false);
      return;
    }

    setIsEvaluating(true);
    const rawMime = mimeType || audioBlob.type || 'audio/webm';
    const ext = rawMime.includes('mp4') || rawMime.includes('m4a') || rawMime.includes('aac') ? 'mp4' : 'webm';
    const formData = new FormData();
    formData.append("file", audioBlob, `reflex_response.${ext}`);
    formData.append("question", currentQuestion);

    try {
      const res = await fetch(`${API_URL}/speaking/reflex`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        
        // 1. Add user response to chat
        setChatHistory(prev => [...prev, { 
          sender: 'user', 
          text: data.transcript || "Spoken response" 
        }]);
        
        // 2. Score computation
        let roundScore = 100;
        if (data.filler_words_count > 2) roundScore -= 20;
        if (responseDelay && responseDelay > 5) roundScore -= 30;
        roundScore = Math.max(20, roundScore);

        setScore(prev => prev + roundScore);
        setStreak(prev => prev + 1);

        // 3. Add Matcha Bear response and follow-up question
        const bearReplyText = data.witty_reply || "That's an insightful answer! 🐻";
        const spokenReply = data.spoken_reply_and_critique || data.witty_reply || "Great response!";
        const spokenNext = data.spoken_next_question || `Now, here is my next question: ${data.next_question || currentQuestion}`;
        
        setChatHistory(prev => [
          ...prev, 
          { 
            sender: 'bear', 
            text: `${bearReplyText} (Fillers: ${data.filler_words_count || 0} • Reflex: ${responseDelay?.toFixed(1) || '1.8'}s)`,
            data: data,
            spokenReply: spokenReply,
            spokenQuestion: spokenNext
          }
        ]);

        if (data.next_question) {
          setCurrentQuestion(data.next_question);
        }

        // 4. GEMINI LIVE MECHANISM:
        // Matcha Bear responds by VOICE, answering the user and giving coaching critique FIRST!
        const isSilent = data.transcript === "No speech detected" || !data.transcript;
        speakSequence(spokenReply, spokenNext, !isSilent);

      } else {
        if ((window as any).showToast) {
          (window as any).showToast("Matcha Bear couldn't evaluate your voice. Please try again!", "error");
        }
      }
    } catch (err) {
      console.error("Evaluation error:", err);
      if ((window as any).showToast) {
        (window as any).showToast("Network connection issue.", "error");
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] flex flex-col p-3 md:p-6 max-w-5xl mx-auto w-full font-sans">
      {/* Header */}
      <header className="flex items-center justify-between mb-4 pb-3 border-b border-primary/10">
        <Link 
          href="/games"
          className="flex items-center gap-2 text-accent font-bold hover:text-primary transition-all bg-white border border-primary/20 px-3.5 py-1.5 rounded-full shadow-sm active:scale-95 text-xs sm:text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Về Arcade Hub
        </Link>
        
        <div className="flex items-center gap-3">
          {/* Gemini Live Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsLiveHandsFree(!isLiveHandsFree)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm ${
              isLiveHandsFree 
                ? 'bg-[#1F4E3D] text-white border-transparent shadow-[#1F4E3D]/20' 
                : 'bg-white text-accent/70 border-primary/20 hover:text-accent'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveHandsFree ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>Gemini Live: {isLiveHandsFree ? "Rảnh tay (Auto VAD)" : "Bấm nút"}</span>
          </button>

          <div className="flex items-center gap-2 bg-white border border-primary/10 px-3.5 py-1.5 rounded-full shadow-sm">
            <Trophy className="text-amber-500 w-4 h-4" />
            <div className="text-right">
              <span className="font-extrabold text-accent text-sm">{score} pts</span>
              {streak > 1 && (
                <span className="ml-1.5 inline-block">
                  <MatchaStickerBadge type="streak" label={`${streak} combo`} />
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Live Conversation Canvas */}
      <div className="flex-1 bg-white border-4 border-primary/20 rounded-[2.5rem] p-4 md:p-6 shadow-md flex flex-col overflow-hidden relative min-h-[560px]">
        
        {/* Active Question Banner */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50/40 border border-primary/15 rounded-2xl p-4 mb-4 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="shrink-0 drop-shadow-sm flex items-center justify-center">
              <MatchaBearSticker size="md" variant={isBearSpeaking ? "speaking" : "default"} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-wider uppercase text-primary/80 bg-primary/10 px-2 py-0.5 rounded-md">
                  Chủ đề phản xạ hiện tại
                </span>
                {isBearSpeaking && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md animate-pulse flex items-center gap-1">
                    <Volume2 className="w-3 h-3" /> 
                    {speakingPhase === 'reply_and_critique' ? "Gấu đang trả lời & nhận xét..." : "Gấu đang hỏi câu mới..."}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-accent mt-1 leading-snug">
                "{currentQuestion}"
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={changeQuestion}
              className="px-2.5 py-1.5 bg-white text-emerald-800 hover:text-emerald-900 border border-emerald-200/80 rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all text-xs flex items-center gap-1.5 font-bold cursor-pointer"
              title="Đổi chủ đề / câu hỏi mới"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đổi câu hỏi</span>
            </button>
            <button
              type="button"
              onClick={() => {
                primeMobileAudio();
                playSpeech(currentQuestion);
              }}
              className="p-2 bg-white text-primary hover:text-primary-dark border border-primary/15 rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all text-xs flex items-center gap-1 font-bold cursor-pointer"
              title="Nghe lại câu hỏi"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="p-2 bg-white text-accent/60 hover:text-accent border border-primary/10 rounded-xl shadow-sm text-xs font-bold cursor-pointer"
              title="Hướng dẫn"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Guide */}
        <AnimatePresence>
          {showGuide && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#FCFAF5] border border-amber-900/10 p-4 rounded-2xl mb-4 text-xs text-accent/80 overflow-hidden"
            >
              <div className="flex justify-between items-center pb-2 border-b border-amber-900/5 mb-2">
                <h4 className="font-extrabold text-primary flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> CƠ CHẾ ĐÀM THOẠI GEMINI LIVE VỚI MATCHA BEAR
                </h4>
                <button 
                  type="button" 
                  onClick={() => setShowGuide(false)}
                  className="text-[10px] font-bold text-accent/50 hover:text-accent"
                >
                  ✕ Đóng
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                <div>
                  <strong className="text-accent">1. Trả lời & Nhận xét trước:</strong> Khi bạn nói xong, Bé Gấu sẽ phát giọng nói đối thoại và nhận xét phản xạ, phát âm, từ đệm trước rồi mới hỏi câu tiếp theo.
                </div>
                <div>
                  <strong className="text-accent">2. Ngắt lời bất cứ lúc nào (Interrupt):</strong> Khi Bé Gấu đang nói, bạn có thể bấm nút "Ngắt lời" để nói ngay lập tức giống hệt Gemini Live!
                </div>
                <div>
                  <strong className="text-accent">3. Rảnh tay (Hands-free VAD):</strong> Bật chế độ Gemini Live để nói tự nhiên, hệ thống tự nhận diện khi bạn ngừng nói ~1.8s để gửi và tự động bật lại mic.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 custom-scrollbar flex flex-col">
          {chatHistory.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex items-start gap-2.5 max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
            >
              <div className="shrink-0 drop-shadow-sm flex items-center justify-center">
                {msg.sender === 'user' ? (
                  <LearnerSticker size="sm" />
                ) : (
                  <MatchaBearSticker size="sm" variant={isBearSpeaking ? "speaking" : "happy"} />
                )}
              </div>

              <div className={`p-4 rounded-3xl border text-xs sm:text-sm font-medium leading-relaxed shadow-md ${
                msg.sender === 'user' 
                  ? 'bg-[#1B4332] text-white border border-[#2D6A4F] rounded-tr-none' 
                  : 'bg-white text-stone-900 border-2 border-emerald-100/80 rounded-tl-none shadow-sm'
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <span className={`leading-relaxed ${
                    msg.sender === 'user' ? 'text-white !text-white font-medium' : 'text-stone-900 !text-stone-900 font-semibold'
                  }`}>{msg.text}</span>
                  {msg.sender === 'bear' && (msg.spokenReply || msg.spokenQuestion) && (
                    <button
                      type="button"
                      onClick={() => {
                        primeMobileAudio();
                        playSpeech(msg.spokenReply || msg.text);
                      }}
                      className="p-1 rounded-lg hover:bg-primary/10 text-primary transition-all shrink-0 cursor-pointer"
                      title="Nghe lại câu nói này"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Academic Feedback Details from docs/skills.md */}
                {msg.data && (
                  <div className="mt-3 pt-3 border-t border-primary/10 text-[11px] space-y-2.5">
                    {/* Feedback & Coaching Tip */}
                    {msg.data.feedback && (
                      <div className="bg-white/80 p-2.5 rounded-xl border border-primary/10">
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <MatchaStickerBadge type="bulb" label="Matcha Bear Coaching" />
                        </div>
                        <p className="text-accent/80 italic">{msg.data.feedback}</p>
                      </div>
                    )}

                    {/* Skill 4: Shadow Error Logging (docs/skills.md) */}
                    {msg.data.shadow_errors_logged && msg.data.shadow_errors_logged.length > 0 && (
                      <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60 space-y-1.5">
                        <div className="flex items-center gap-1.5 font-extrabold text-amber-900 text-[10px] uppercase">
                          <MatchaStickerBadge type="lightning" label="Shadow Logging" />
                          <span>Ghi nhận lỗi ngầm & Nâng cấp Band 8.5+</span>
                        </div>
                        {msg.data.shadow_errors_logged.map((err: any, eIdx: number) => (
                          <div key={eIdx} className="text-[11px] bg-white/90 p-2 rounded-lg border border-amber-100">
                            <div className="flex items-center gap-1.5 text-red-700 font-medium">
                              <MatchaStickerBadge type="cross" label="Bạn nói" />
                              <span className="italic line-through text-red-600">{err.learner_utterance || err.original}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold mt-1">
                              <MatchaStickerBadge type="spark" label="Chuẩn Band 8.5+" />
                              <span>{err.band_8_alternative || err.suggestion}</span>
                            </div>
                            {err.identified_flaw && (
                              <div className="text-[10px] text-accent/60 mt-0.5">
                                Ghi chú: {err.identified_flaw}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Skill 1: Phonetic Feedback (docs/skills.md) */}
                    {msg.data.phonetic_feedback && (
                      <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/50 space-y-1 text-[10px]">
                        <div className="flex items-center gap-1.5 font-extrabold text-emerald-900 uppercase">
                          <MatchaStickerBadge type="target" label="Phân tích Ngữ âm" />
                          <span className="text-[10px] font-bold text-emerald-800/80">(Phonetic Assessment)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                          <div className="bg-white/90 p-1.5 rounded border border-emerald-100">
                            <strong className="text-accent">Âm cuối (Endings):</strong> {msg.data.phonetic_feedback.ending_sounds || "Tốt"}
                          </div>
                          <div className="bg-white/90 p-1.5 rounded border border-emerald-100">
                            <strong className="text-accent">Nối âm (Liaison):</strong> {msg.data.phonetic_feedback.linking_sounds || "Tự nhiên"}
                          </div>
                          <div className="bg-white/90 p-1.5 rounded border border-emerald-100">
                            <strong className="text-accent">Ngữ điệu (Intonation):</strong> {msg.data.phonetic_feedback.intonation || "Rõ ràng"}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reflex & Fluency Metrics */}
                    {msg.data.reflex_stats && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                        <MatchaStickerBadge type="lightning" label={`Nhịp độ: ${msg.data.reflex_stats.response_pace || "Natural"}`} />
                        {msg.data.reflex_stats.estimated_wpm > 0 && (
                          <MatchaStickerBadge type="speech" label={`${msg.data.reflex_stats.estimated_wpm} WPM`} />
                        )}
                        {msg.data.reflex_stats.fluency_score > 0 && (
                          <MatchaStickerBadge type="trophy" label={`Fluency: Band ${msg.data.reflex_stats.fluency_score}`} />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Thinking / Analyzing Animation */}
          {isEvaluating && (
            <div className="flex items-start gap-2.5 self-start max-w-[80%]">
              <div className="shrink-0 drop-shadow-sm flex items-center justify-center">
                <MatchaBearSticker size="sm" variant="thinking" />
              </div>
              <div className="p-4 bg-emerald-50/80 rounded-3xl border border-primary/15 text-xs font-bold text-primary flex items-center gap-3">
                <div className="relative flex items-center justify-center w-6 h-6">
                  <span className="absolute w-6 h-6 rounded-full bg-primary/20 animate-ping"></span>
                  <span className="w-3 h-3 rounded-full bg-primary animate-pulse"></span>
                </div>
                <span>Matcha Bear đang phân tích âm thanh & chuẩn bị câu trả lời...</span>
              </div>
            </div>
          )}
        </div>

        {/* Gemini Live Active Waveform & Interactive Control Bar */}
        <div className="border-t border-primary/15 pt-3 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-transparent to-emerald-50/30 rounded-b-3xl">
          
          {/* Live Waveform Visualizer */}
          <div className="h-10 flex items-center justify-center gap-1.5 w-full max-w-xs">
            {isRecording ? (
              // Audio reactive frequency bars
              [...Array(12)].map((_, i) => {
                const heightVal = Math.max(6, Math.min(36, liveVolume * 40 * ((i % 3 + 1) * 0.8)));
                return (
                  <motion.div
                    key={i}
                    animate={{ height: `${heightVal}px` }}
                    transition={{ duration: 0.08 }}
                    className="w-1.5 bg-gradient-to-t from-[#1F4E3D] to-emerald-400 rounded-full"
                  />
                );
              })
            ) : isBearSpeaking ? (
              // Bear speaking dynamic waveform
              [...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: [8, 28, 12, 34, 10][(i + Math.floor(Date.now() / 200)) % 5] + 'px'
                  }}
                  transition={{ repeat: Infinity, duration: 0.35, ease: "easeInOut" }}
                  className="w-1.5 bg-gradient-to-t from-amber-500 to-emerald-500 rounded-full"
                />
              ))
            ) : (
              // Idle subtle dots
              <div className="flex items-center gap-2 text-xs font-bold text-accent/50">
                <span className="w-2 h-2 rounded-full bg-primary/30"></span>
                <span>Sẵn sàng phản xạ bằng giọng nói</span>
                <span className="w-2 h-2 rounded-full bg-primary/30"></span>
              </div>
            )}
          </div>

          {/* Action Buttons: Record / Interrupt / Push to talk */}
          <div className="flex items-center gap-4">
            {isBearSpeaking ? (
              // Interrupt Button (Gemini Live interrupt feature)
              <button
                type="button"
                onClick={interruptSpeech}
                className="px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer animate-pulse"
              >
                <VolumeX className="w-4 h-4" />
                Ngắt lời Gấu (Interrupt)
              </button>
            ) : isRecording ? (
              // Stop Recording Button
              <button 
                type="button"
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all animate-pulse cursor-pointer"
                title="Bấm để gửi câu trả lời"
              >
                <Square className="w-6 h-6" />
              </button>
            ) : (
              // Start Speaking Button
              <button 
                type="button"
                disabled={isEvaluating}
                onClick={() => {
                  primeMobileAudio();
                  startRecording();
                }}
                className="w-16 h-16 rounded-full bg-[#1F4E3D] hover:bg-[#16382c] text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer relative"
                title="Bắt đầu nói"
              >
                <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></span>
                <Mic className="w-7 h-7 relative z-10" />
              </button>
            )}
          </div>

          {/* Status microcopy */}
          <div className="text-center">
            <h4 className="text-xs sm:text-sm font-extrabold text-accent">
              {isRecording 
                ? `Đang lắng nghe bạn... ${formatTime(recordingSeconds)}` 
                : isEvaluating 
                ? "Matcha Bear đang phân tích..." 
                : isBearSpeaking 
                ? (speakingPhase === 'reply_and_critique' ? "Bé Gấu đang trả lời & nhận xét bạn..." : "Bé Gấu đang hỏi câu tiếp theo...") 
                : "Bấm Micro để nói chuyện trực tiếp với Bé Gấu!"}
            </h4>
            <p className="text-[10px] text-accent/50 mt-0.5">
              {isLiveHandsFree 
                ? "Chế độ Rảnh tay: Hãy nói thoải mái, hệ thống tự động nhận diện khi bạn nói xong!"
                : "Chế độ Bấm nút: Nhấn Micro để bắt đầu nói, nhấn nút vuông đỏ khi nói xong."}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
