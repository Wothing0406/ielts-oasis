"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Mic, Square, Volume2, VolumeX, Play, MessageSquare, Flame, CheckCircle2, AlertCircle, Info, Star, Award, Trash2, Sparkles, BookOpen, RefreshCw, Heart, Zap, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = '/api';

const LEVEL_SENTENCES = {
  easy: [
    "I enjoy learning English daily.",
    "Practicing speaking is fun.",
    "The weather is very nice today.",
    "We love drinking hot matcha tea.",
    "She walks to school every morning."
  ],
  medium: [
    "Artificial intelligence is playing an increasingly vital role in modern medical research.",
    "Traditional educational methods are being revolutionized by advanced digital learning platforms.",
    "Promoting cultural diversity contributes significantly to a more harmonious and empathetic society."
  ],
  hard: [
    "Environmental conservation requires immediate international cooperation to combat global warming.",
    "The rapid pace of urbanization has placed immense pressure on public infrastructure and housing.",
    "Socioeconomic disparities significantly influence access to high-quality healthcare and educational opportunities."
  ]
};

const LEVEL_CUE_CARDS = {
  easy: {
    topic: "Describe a favorite book that you read recently.",
    prompts: [
      "What the book is and who wrote it",
      "When you read it and what it is about",
      "How you felt after reading it",
      "And explain why you would recommend it to others."
    ]
  },
  medium: {
    topic: "Describe a technological device you use daily.",
    prompts: [
      "What device it is and when you got it",
      "What you use it for",
      "How it benefits your daily routine",
      "And explain whether you could live without it."
    ]
  },
  hard: {
    topic: "Describe an environmental problem in your country.",
    prompts: [
      "What the environmental problem is",
      "What causes this issue",
      "How it affects people's health and lifestyle",
      "And explain what measures could be taken to solve it."
    ]
  }
};

const STATIC_COMMUNITY_SUGGESTIONS = [
  {
    id: "static_1",
    username: "ielts_champion",
    content: "The rapid pace of urbanization has placed immense pressure on public infrastructure and housing. Many major cities around the globe face severe challenges.",
    likes: 24,
    comments: 5
  },
  {
    id: "static_2",
    username: "green_future",
    content: "Environmental conservation requires immediate international cooperation to combat global warming. Individual actions alone are no longer sufficient to solve it.",
    likes: 18,
    comments: 2
  },
  {
    id: "static_3",
    username: "ai_educator",
    content: "Traditional educational methods are being revolutionized by advanced digital learning platforms. Students now have access to customized tutoring globally.",
    likes: 31,
    comments: 9
  }
];

export default function MatchaSpeak({ initialContext }: { initialContext?: string }) {
  const [activeMode, setActiveMode] = useState<'shadowing' | 'sandbox' | 'gemini_live'>('shadowing');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Microphone & Filter Settings
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [noiseCancellation, setNoiseCancellation] = useState<boolean>(true);

  // Shadowing state
  const [currentLevel, setCurrentLevel] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [selectedSentence, setSelectedSentence] = useState<string>("");
  const [shadowResult, setShadowResult] = useState<any | null>(null);
  const [selectedWord, setSelectedWord] = useState<any | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  // AI generation and guide states for Shadowing
  const [isGeneratingSentence, setIsGeneratingSentence] = useState(false);
  const [isFetchingGuide, setIsFetchingGuide] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [pronunciationGuide, setPronunciationGuide] = useState<any | null>(null);
  
  // Custom Text state
  const [customText, setCustomText] = useState<string>('');
  const [isUsingCustom, setIsUsingCustom] = useState<boolean>(false);
  const [communitySuggestions, setCommunitySuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);

  // Sandbox state
  const [sandboxLevel, setSandboxLevel] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [prepSeconds, setPrepSeconds] = useState(60);
  const [isPrepActive, setIsPrepActive] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<any | null>(null);
  const [isGeneratingCueCard, setIsGeneratingCueCard] = useState(false);

  // Gemini Live Reflex Embedded Studio States
  const [liveChatHistory, setLiveChatHistory] = useState<Array<{
    sender: 'bear' | 'user';
    text: string;
    data?: any;
    spokenReply?: string;
    spokenQuestion?: string;
  }>>([
    {
      sender: 'bear',
      text: "Hello buddy! I'm your Cambridge IELTS Speaking Coach, Matcha Bear. Tap the microphone below and let's talk directly with voice! 🐻🍵",
      spokenReply: "Hello buddy! I am your Cambridge IELTS Speaking Coach, Matcha Bear. Tap the microphone below and let us talk directly with voice!"
    },
    {
      sender: 'bear',
      text: "What is your favorite hobby during weekends and why do you enjoy it?",
      spokenQuestion: "What is your favorite hobby during weekends and why do you enjoy it?"
    }
  ]);
  const [currentLiveQuestion, setCurrentLiveQuestion] = useState<string>("What is your favorite hobby during weekends and why do you enjoy it?");
  const [isLiveRecording, setIsLiveRecording] = useState<boolean>(false);
  const [liveRecordingSeconds, setLiveRecordingSeconds] = useState<number>(0);
  const [isLiveEvaluating, setIsLiveEvaluating] = useState<boolean>(false);
  const [isBearSpeaking, setIsBearSpeaking] = useState<boolean>(false);
  const [speakingPhase, setSpeakingPhase] = useState<'idle' | 'reply_and_critique' | 'next_question'>('idle');
  const [liveVolume, setLiveVolume] = useState<number>(0);
  const [liveHandsFree, setLiveHandsFree] = useState<boolean>(false);
  const [liveScore, setLiveScore] = useState<number>(0);
  const [liveStreak, setLiveStreak] = useState<number>(0);
  const [liveReflexDelay, setLiveReflexDelay] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const prepTimerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const volumeTimerRef = useRef<any>(null);
  const peakVolumeRef = useRef<number>(0);

  // Gemini Live Audio & Recording Refs
  const sharedAudioRef = useRef<HTMLAudioElement | null>(null);
  const liveMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const liveAudioChunksRef = useRef<Blob[]>([]);
  const liveRecordingTimerRef = useRef<any>(null);
  const liveAudioContextRef = useRef<AudioContext | null>(null);
  const liveVolumeTimerRef = useRef<any>(null);
  const liveSilenceTimerRef = useRef<any>(null);
  const liveConsecutiveVoiceRef = useRef<number>(0);
  const liveHasSpokenRef = useRef<boolean>(false);
  const liveStartTimeRef = useRef<number>(Date.now());
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const liveActiveSpeechIdRef = useRef<number>(0);
  const liveSpeechWatchdogRef = useRef<any>(null);

  // Load initial context if passed (e.g. from community feed)
  useEffect(() => {
    if (initialContext) {
      setIsUsingCustom(true);
      setCustomText(initialContext);
      setSelectedSentence(initialContext);
      setShadowResult(null);
      setSelectedWord(null);
      setPronunciationGuide(null);
      setShowGuide(false);
    }
  }, [initialContext]);

  const loadCommunitySuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const token = localStorage.getItem("oasis_token");
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/community/feed?sort_by=hot`, { headers });
      if (res.ok) {
        const data = await res.json();
        setCommunitySuggestions(data.writings || []);
      }
    } catch (e) {
      console.error("Failed to load community suggestions:", e);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    if (isUsingCustom) {
      loadCommunitySuggestions();
    }
  }, [isUsingCustom]);

  // Reset sentence when level changes (user must click AI Generate)
  useEffect(() => {
    if (!isUsingCustom && currentLevel) {
      setSelectedSentence("");
      setShadowResult(null);
      setSelectedWord(null);
      setPronunciationGuide(null);
      setShowGuide(false);
    }
  }, [currentLevel, isUsingCustom]);
  
  // Clear sandbox cue card when sandboxLevel changes (user must click AI Generate)
  useEffect(() => {
    if (sandboxLevel) {
      setSelectedCard(null);
      setSandboxResult(null);
      setIsPrepActive(false);
      if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    }
  }, [sandboxLevel]);

  // Cleanup timers and audio contexts on component unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (volumeTimerRef.current) clearInterval(volumeTimerRef.current);
      if (prepTimerRef.current) clearInterval(prepTimerRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      stopLiveRecordingCleanup();
      interruptLiveSpeech();
    };
  }, []);

  // Format timer
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Preparation Timer
  const startPrepTimer = () => {
    setIsPrepActive(true);
    setPrepSeconds(60);
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    prepTimerRef.current = setInterval(() => {
      setPrepSeconds(prev => {
        if (prev <= 1) {
          clearInterval(prepTimerRef.current);
          setIsPrepActive(false);
          startRecording(); // Auto start recording after 1 min prep
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Web Speech synthesis for reference sentence
  const speakReference = () => {
    if (!selectedSentence) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(selectedSentence);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      (window as any).showToast("Speech synthesis is not supported on this browser.", "warning");
    }
  };

  // Generate Sentence via AI for current level
  const generateAISentence = async () => {
    const token = localStorage.getItem("oasis_token");
    if (!token) return (window as any).showToast("Please log in first! 🍵", "info");
    
    setIsGeneratingSentence(true);
    try {
      const lvl = currentLevel || 'medium';
      const res = await fetch(`${API_URL}/speaking/generate-sentence?level=${lvl}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sentence) {
          setSelectedSentence(data.sentence);
          setShadowResult(null);
          setSelectedWord(null);
          setPronunciationGuide(null);
          setShowGuide(false);
          (window as any).showToast("✨ AI generated a new sentence!", "success");
        }
      } else {
        throw new Error("Failed response");
      }
    } catch (err) {
      console.error(err);
      (window as any).showToast("Failed to generate sentence from AI.", "error");
    } finally {
      setIsGeneratingSentence(false);
    }
  };

  // Generate Cue Card via AI for sandbox level
  const generateAICueCard = async () => {
    const token = localStorage.getItem("oasis_token");
    if (!token) return (window as any).showToast("Please log in first! 🍵", "info");
    
    setIsGeneratingCueCard(true);
    try {
      const res = await fetch(`${API_URL}/speaking/generate-cuecard?level=${sandboxLevel}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.topic) {
          setSelectedCard(data);
          setSandboxResult(null);
          setIsPrepActive(false);
          if (prepTimerRef.current) clearInterval(prepTimerRef.current);
          (window as any).showToast("✨ AI generated a new IELTS Cue Card!", "success");
        }
      } else {
        throw new Error("Failed response");
      }
    } catch (err) {
      console.error(err);
      (window as any).showToast("Failed to generate cue card from AI.", "error");
    } finally {
      setIsGeneratingCueCard(false);
    }
  };

  // Fetch Pronunciation Guide via AI
  const fetchPronunciationGuide = async () => {
    if (!selectedSentence) return;
    const token = localStorage.getItem("oasis_token");
    if (!token) return (window as any).showToast("Please log in first! 🍵", "info");
    
    setIsFetchingGuide(true);
    setShowGuide(true);
    try {
      const res = await fetch(`${API_URL}/speaking/pronunciation-guide`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ sentence: selectedSentence })
      });
      if (res.ok) {
        const data = await res.json();
        setPronunciationGuide(data);
      } else {
        (window as any).showToast("Failed to fetch pronunciation guide.", "error");
      }
    } catch (err) {
      console.error(err);
      (window as any).showToast("Network error fetching guide.", "error");
    } finally {
      setIsFetchingGuide(false);
    }
  };

  // Start Recording
  const startRecording = async () => {
    try {
      const constraints = {
        audio: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          echoCancellation: noiseCancellation,
          noiseSuppression: noiseCancellation,
          autoGainControl: noiseCancellation
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      audioChunksRef.current = [];
      
      // Setup Web Audio API volume analyzer
      peakVolumeRef.current = 0;
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
        volumeTimerRef.current = setInterval(() => {
          analyser.getByteTimeDomainData(dataArray);
          let sumSq = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const val = (dataArray[i] - 128) / 128;
            sumSq += val * val;
          }
          const rms = Math.sqrt(sumSq / dataArray.length);
          if (rms > peakVolumeRef.current) {
            peakVolumeRef.current = rms;
          }
        }, 100);
      } catch (e) {
        console.error("Audio analyzer failed to initialize:", e);
      }

      const options = { mimeType: 'audio/webm' };
      
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        mediaRecorder = new MediaRecorder(stream); // fallback
      }

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Auto trigger evaluation
        evaluateAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      setAudioUrl(null);
      setShadowResult(null);
      setSandboxResult(null);

      // Lazy load devices list on first record start (prevents mic popup on mount)
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const inputs = allDevices.filter(d => d.kind === 'audioinput');
        setAudioDevices(inputs);
        if (inputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(inputs[0].deviceId);
        }
      } catch (e) {
        console.error("Enumerate devices failed:", e);
      }

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          const maxSecs = activeMode === 'shadowing' ? 30 : 120;
          if (prev >= maxSecs) {
            stopRecording();
            return maxSecs;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Microphone access failed:", err);
      (window as any).showToast("Could not access microphone. Please grant permission.", "error");
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (volumeTimerRef.current) {
      clearInterval(volumeTimerRef.current);
      volumeTimerRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  // Evaluate voice audio
  const evaluateAudio = async (audioBlob: Blob) => {
    const token = localStorage.getItem("oasis_token");
    if (!token) {
      (window as any).showToast("Please log in to practice speaking! 🍵", "info");
      return;
    }

    console.log("Peak audio RMS volume analyzed:", peakVolumeRef.current);
    // Client-side silence check (peak RMS volume must exceed 0.003)
    if (peakVolumeRef.current > 0 && peakVolumeRef.current < 0.003) {
      (window as any).showToast("No speech detected from microphone. Please speak louder and clearer! 🎙️", "warning");
      setIsEvaluating(false);
      return;
    }

    setIsEvaluating(true);
    const formData = new FormData();
    formData.append("file", audioBlob, `speaking_${activeMode}.webm`);

    try {
      if (activeMode === 'shadowing') {
        formData.append("reference_text", selectedSentence);
        const res = await fetch(`${API_URL}/speaking/shadowing`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          setShadowResult(data);
        } else {
          (window as any).showToast("Evaluation failed. Please try again.", "error");
        }
      } else {
        formData.append("cue_card_prompt", selectedCard.topic);
        const res = await fetch(`${API_URL}/speaking/sandbox`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          setSandboxResult(data);
        } else {
          (window as any).showToast("Evaluation failed. Please try again.", "error");
        }
      }
    } catch (err) {
      console.error(err);
      (window as any).showToast("Network error during evaluation.", "error");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Reset Practice
  const resetPractice = () => {
    setShadowResult(null);
    setSelectedWord(null);
    setAudioUrl(null);
    setCustomText('');
    setIsUsingCustom(false);
    setPronunciationGuide(null);
    setShowGuide(false);
    setSelectedSentence(""); // Reset to empty welcome screen
    (window as any).showToast("Cleared results & reset sentence! 🍵", "success");
  };

  // Mobile Audio Unlock: Pre-primes HTMLAudioElement and Web Speech API on user gesture
  const primeMobileAudio = () => {
    if (!sharedAudioRef.current && typeof window !== 'undefined') {
      try {
        const audio = new Audio();
        audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        audio.volume = 0.01;
        audio.play().then(() => {
          audio.pause();
        }).catch(() => {});
        sharedAudioRef.current = audio;
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

  const playLiveSpeech = (text: string, onEnd?: () => void) => {
    const currentSpeechId = ++liveActiveSpeechIdRef.current;
    if (liveSpeechWatchdogRef.current) {
      clearTimeout(liveSpeechWatchdogRef.current);
      liveSpeechWatchdogRef.current = null;
    }

    const cleanText = text
      .replace(/[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[*_~`#\[\]\(\)]/g, ' ')
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    let hasEnded = false;
    const safeOnEnd = () => {
      if (hasEnded) return;
      hasEnded = true;
      if (liveSpeechWatchdogRef.current) {
        clearTimeout(liveSpeechWatchdogRef.current);
        liveSpeechWatchdogRef.current = null;
      }
      if (liveActiveSpeechIdRef.current === currentSpeechId) {
        if (onEnd) onEnd();
      }
    };

    // Watchdog safety timeout
    const estimatedSecs = Math.max(4, Math.ceil(cleanText.split(/\s+/).length / 2.2) + 3);
    liveSpeechWatchdogRef.current = setTimeout(() => {
      if (!hasEnded && liveActiveSpeechIdRef.current === currentSpeechId) {
        console.warn("Live speech watchdog triggered, auto-advancing");
        safeOnEnd();
      }
    }, estimatedSecs * 1000);

    // Stop ongoing audio
    if (sharedAudioRef.current) {
      sharedAudioRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      activeUtteranceRef.current = null;
    }

    const fallbackWebSpeech = (txt: string, cb?: () => void) => {
      if (liveActiveSpeechIdRef.current !== currentSpeechId) return;
      if (!('speechSynthesis' in window)) {
        if (cb) cb();
        return;
      }
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(txt);
        utterance.lang = 'en-US';
        utterance.rate = 0.95;
        const voices = window.speechSynthesis.getVoices();
        const enVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Jenny') || v.name.includes('Samantha')));
        if (enVoice) utterance.voice = enVoice;
        activeUtteranceRef.current = utterance;
        utterance.onend = () => {
          activeUtteranceRef.current = null;
          if (cb) cb();
        };
        utterance.onerror = () => {
          activeUtteranceRef.current = null;
          if (cb) cb();
        };
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        if (cb) cb();
      }
    };

    const fetchTts = async () => {
      try {
        const res = await fetch(`${API_URL}/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word: cleanText })
        });
        if (liveActiveSpeechIdRef.current !== currentSpeechId) return;

        if (res.ok) {
          const data = await res.json();
          if (liveActiveSpeechIdRef.current !== currentSpeechId) return;

          if (data.audio_url) {
            let audio = sharedAudioRef.current;
            if (!audio) {
              audio = new Audio();
              sharedAudioRef.current = audio;
            }
            audio.src = data.audio_url;
            audio.volume = 1.0;
            audio.onended = () => {
              safeOnEnd();
            };
            audio.onerror = () => {
              fallbackWebSpeech(cleanText, safeOnEnd);
            };
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.catch((err) => {
                console.warn("Mobile playback caught, fallback to WebSpeech:", err);
                fallbackWebSpeech(cleanText, safeOnEnd);
              });
            }
            return;
          }
        }
      } catch (err) {
        console.warn("TTS fetch error, using WebSpeech:", err);
      }
      if (liveActiveSpeechIdRef.current === currentSpeechId) {
        fallbackWebSpeech(cleanText, safeOnEnd);
      }
    };

    fetchTts();
  };

  const speakLiveSequence = (replyAndCritiqueText: string, nextQuestionText: string, shouldAutoArm: boolean = true) => {
    setIsBearSpeaking(true);
    setSpeakingPhase('reply_and_critique');

    playLiveSpeech(replyAndCritiqueText, () => {
      setTimeout(() => {
        setSpeakingPhase('next_question');
        playLiveSpeech(nextQuestionText, () => {
          setIsBearSpeaking(false);
          setSpeakingPhase('idle');
          liveStartTimeRef.current = Date.now(); // Accurate reflex baseline timing!
          
          if (liveHandsFree && shouldAutoArm) {
            setTimeout(() => {
              startLiveRecording();
            }, 1000);
          }
        });
      }, 700);
    });
  };

  const interruptLiveSpeech = () => {
    liveActiveSpeechIdRef.current++;
    if (liveSpeechWatchdogRef.current) {
      clearTimeout(liveSpeechWatchdogRef.current);
      liveSpeechWatchdogRef.current = null;
    }
    if (sharedAudioRef.current) {
      sharedAudioRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      activeUtteranceRef.current = null;
    }
    setIsBearSpeaking(false);
    setSpeakingPhase('idle');
  };

  // Change Question in Gemini Live Studio
  const changeLiveQuestion = async () => {
    interruptLiveSpeech();
    stopLiveRecording();
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
      const backupQuestions = [
        "Do you prefer living in a city or the countryside? Why?",
        "How has technology changed the way students learn today?",
        "What is your favorite book or movie, and what lessons did you learn from it?",
        "What type of music do you like to listen to when you relax?"
      ];
      const remaining = backupQuestions.filter(q => q !== currentLiveQuestion);
      newQ = remaining[Math.floor(Math.random() * remaining.length)] || backupQuestions[0];
    }
    setCurrentLiveQuestion(newQ);
    liveStartTimeRef.current = Date.now();
    setLiveChatHistory(prev => [...prev, {
      sender: 'bear',
      text: `Let's switch to a new topic! ${newQ}`,
      spokenQuestion: `Let's switch to a new topic! ${newQ}`
    }]);
    playLiveSpeech(`Let's switch to a new topic! ${newQ}`);
  };

  const stopLiveRecordingCleanup = () => {
    if (liveSilenceTimerRef.current) {
      clearTimeout(liveSilenceTimerRef.current);
      liveSilenceTimerRef.current = null;
    }
    if (liveVolumeTimerRef.current) {
      clearInterval(liveVolumeTimerRef.current);
      liveVolumeTimerRef.current = null;
    }
    if (liveRecordingTimerRef.current) {
      clearInterval(liveRecordingTimerRef.current);
      liveRecordingTimerRef.current = null;
    }
    if (liveAudioContextRef.current) {
      liveAudioContextRef.current.close().catch(() => {});
      liveAudioContextRef.current = null;
    }
    if (liveMediaRecorderRef.current && liveMediaRecorderRef.current.stream) {
      liveMediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    setLiveVolume(0);
  };

  const stopLiveRecording = () => {
    if (liveMediaRecorderRef.current && isLiveRecording) {
      stopLiveRecordingCleanup();
      liveMediaRecorderRef.current.stop();
      setIsLiveRecording(false);
    }
  };

  const startLiveRecording = async () => {
    interruptLiveSpeech();
    primeMobileAudio();

    try {
      const now = Date.now();
      setLiveReflexDelay((now - liveStartTimeRef.current) / 1000);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      liveAudioChunksRef.current = [];
      liveHasSpokenRef.current = false;
      liveConsecutiveVoiceRef.current = 0;

      // Audio analyzer for live waveform & smart VAD
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        liveAudioContextRef.current = audioCtx;

        const dataArray = new Uint8Array(analyser.fftSize);
        if (liveVolumeTimerRef.current) clearInterval(liveVolumeTimerRef.current);

        let recDuration = 0;
        liveVolumeTimerRef.current = setInterval(() => {
          recDuration += 0.08;
          analyser.getByteTimeDomainData(dataArray);
          let sumSq = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const val = (dataArray[i] - 128) / 128;
            sumSq += val * val;
          }
          const rms = Math.sqrt(sumSq / dataArray.length);
          setLiveVolume(Math.min(1, rms * 4));

          // Voice activity detection
          if (rms > 0.028) {
            liveConsecutiveVoiceRef.current += 1;
            if (liveConsecutiveVoiceRef.current >= 4) {
              liveHasSpokenRef.current = true;
            }
            if (liveSilenceTimerRef.current) {
              clearTimeout(liveSilenceTimerRef.current);
              liveSilenceTimerRef.current = null;
            }
          } else {
            liveConsecutiveVoiceRef.current = 0;
            // Only auto-submit if user genuinely spoke and recording >= 2.0s
            if (liveHasSpokenRef.current && liveHandsFree && recDuration >= 2.0) {
              if (!liveSilenceTimerRef.current) {
                liveSilenceTimerRef.current = setTimeout(() => {
                  stopLiveRecording();
                }, 2600); // Generous 2.6s silence timeout
              }
            }
          }
        }, 80);
      } catch (e) {
        console.error("Audio analyzer init failed:", e);
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

      liveMediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          liveAudioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const recordedMime = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(liveAudioChunksRef.current, { type: recordedMime });
        evaluateLiveResponse(audioBlob, recordedMime);
      };

      mediaRecorder.start();
      setIsLiveRecording(true);
      setLiveRecordingSeconds(0);

      if (liveRecordingTimerRef.current) clearInterval(liveRecordingTimerRef.current);
      liveRecordingTimerRef.current = setInterval(() => {
        setLiveRecordingSeconds(prev => {
          if (prev >= 60) {
            stopLiveRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Microphone error:", err);
      (window as any).showToast?.("Cannot access microphone. Please allow mic permissions!", "error");
    }
  };

  const evaluateLiveResponse = async (audioBlob: Blob, mimeType: string) => {
    const token = localStorage.getItem("oasis_token");
    if (!token) {
      (window as any).showToast?.("Please log in to practice speaking! 🍵", "info");
      return;
    }

    setIsLiveEvaluating(true);
    const ext = mimeType.includes('mp4') || mimeType.includes('m4a') || mimeType.includes('aac') ? 'mp4' : 'webm';
    const formData = new FormData();
    formData.append("file", audioBlob, `reflex_voice.${ext}`);
    formData.append("question", currentLiveQuestion);

    try {
      const res = await fetch(`${API_URL}/speaking/reflex`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const userText = data.transcript || "Spoken response";

        setLiveChatHistory(prev => [...prev, {
          sender: 'user',
          text: userText
        }]);

        let roundScore = 100;
        if (data.filler_words_count > 2) roundScore -= 20;
        if (liveReflexDelay && liveReflexDelay > 5) roundScore -= 30;
        roundScore = Math.max(20, roundScore);

        setLiveScore(prev => prev + roundScore);
        setLiveStreak(prev => prev + 1);

        const bearReplyText = data.witty_reply || "That's a nice response! 🐻";
        const spokenReply = data.spoken_reply_and_critique || data.witty_reply || "Great response!";
        const nextQ = data.next_question || "What else can you tell me about that topic?";
        const spokenNext = data.spoken_next_question || `Now, here is my next question: ${nextQ}`;

        setLiveChatHistory(prev => [
          ...prev,
          {
            sender: 'bear',
            text: `${bearReplyText} (Fillers: ${data.filler_words_count || 0} • Reflex: ${liveReflexDelay?.toFixed(1) || '2.0'}s)`,
            data: data,
            spokenReply: spokenReply,
            spokenQuestion: spokenNext
          }
        ]);

        setCurrentLiveQuestion(nextQ);

        // Speak Bear's voice aloud on speaker! Prevent silent auto-loop
        const isSilent = data.transcript === "No speech detected" || !data.transcript;
        speakLiveSequence(spokenReply, spokenNext, !isSilent);
      } else {
        (window as any).showToast?.("Could not evaluate speech. Please try again!", "error");
      }
    } catch (err) {
      console.error("Live reflex eval failed:", err);
      (window as any).showToast?.("Network connection error.", "error");
    } finally {
      setIsLiveEvaluating(false);
    }
  };

  // Calculate Shadowing Score
  const calculateShadowScore = () => {
    if (!shadowResult) return 0;
    if (typeof shadowResult === 'object' && !Array.isArray(shadowResult) && typeof shadowResult.overall_score === 'number') {
      return shadowResult.overall_score;
    }
    const words = Array.isArray(shadowResult) ? shadowResult : (shadowResult.words || []);
    if (words.length === 0) return 0;
    let correctCount = 0;
    let warningCount = 0;
    words.forEach((w: any) => {
      if (w.status === 'correct') correctCount += 1;
      else if (w.status === 'warning') warningCount += 1;
    });
    return Math.round(((correctCount + warningCount * 0.5) / words.length) * 100);
  };

  const accuracyScore = calculateShadowScore();

  return (
    <section className="bg-white border-4 border-primary/20 rounded-[3rem] p-6 md:p-10 shadow-sm flex flex-col gap-6 w-full">
      {/* Title & Modes */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-primary/10 pb-4 gap-4 w-full">
        <div>
          <h2 className="font-display text-2xl font-black text-accent flex items-center gap-2">
            <span className="material-symbols-rounded text-primary text-3xl">record_voice_over</span>
            Mát Cha Speaking Studio
          </h2>
          <p className="text-sm text-accent/70">Cozy space to sharpen your IELTS Speaking skills & pronunciation with smart feedback</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 bg-secondary/50 p-1 rounded-full border border-primary/10">
          <button type="button" 
            onClick={() => {
              setActiveMode('shadowing');
              setShadowResult(null);
              setSandboxResult(null);
              setAudioUrl(null);
              setIsRecording(false);
              interruptLiveSpeech();
            }}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${activeMode === 'shadowing' ? 'bg-primary text-white shadow-md' : 'text-accent/70 hover:text-accent'}`}
          >
            Matcha Shadowing
          </button>
          <button type="button" 
            onClick={() => {
              setActiveMode('sandbox');
              setShadowResult(null);
              setSandboxResult(null);
              setAudioUrl(null);
              setIsRecording(false);
              interruptLiveSpeech();
            }}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${activeMode === 'sandbox' ? 'bg-primary text-white shadow-md' : 'text-accent/70 hover:text-accent'}`}
          >
            Speaking Sandbox
          </button>
          <button type="button"
            onClick={() => {
              setActiveMode('gemini_live');
              setShadowResult(null);
              setSandboxResult(null);
              setAudioUrl(null);
              setIsRecording(false);
              primeMobileAudio();
            }}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'gemini_live' ? 'bg-[#5D4037] text-white shadow-md' : 'text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300'
            }`}
          >
            <span className="text-sm">🐻</span> Gemini Live Reflex 🎙️
          </button>
        </div>
      </div>

      {/* Audio Setup Settings Panel */}
      <div className="bg-[#fcfaf5] border border-amber-900/10 p-4 rounded-2xl flex flex-wrap gap-6 items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-accent">Audio & Microphone Setup:</span>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          {/* Audio Input Device Select */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] uppercase font-bold text-accent/60">Device:</label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="text-xs font-bold bg-white border border-primary/10 px-2 py-1 rounded-xl text-accent"
            >
              {audioDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                </option>
              ))}
              {audioDevices.length === 0 && <option value="">Default Microphone</option>}
            </select>
          </div>

          {/* Noise Cancellation Toggle */}
          <button
            type="button"
            onClick={() => setNoiseCancellation(!noiseCancellation)}
            className="flex items-center gap-1.5 text-xs font-bold text-accent/80 hover:text-accent"
          >
            {noiseCancellation ? (
              <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-accent/30 inline-block"></span>
            )}
            Noise Filter
          </button>
        </div>
      </div>

      {/* Mode Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {activeMode === 'shadowing' && (
          /* Shadowing Mode */
          <div className="lg:col-span-12 space-y-6">
            
            {/* Level Selector & Custom Text Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Level options */}
              <div className="flex flex-wrap gap-2 items-center">
                {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setIsUsingCustom(false);
                      setCurrentLevel(lvl);
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      currentLevel === lvl && !isUsingCustom
                        ? 'bg-primary text-white border-transparent'
                        : 'bg-white text-accent border-primary/15 hover:bg-secondary/20'
                    }`}
                  >
                    Level: {lvl === 'easy' ? 'Easy' : lvl === 'medium' ? 'Medium' : 'Hard'}
                  </button>
                ))}
                
                <button
                  type="button"
                  onClick={() => {
                    setIsUsingCustom(true);
                    setSelectedSentence(""); // Clear shadowing sentence
                    setShadowResult(null);
                    setSelectedWord(null);
                    setPronunciationGuide(null);
                    setShowGuide(false);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    isUsingCustom
                      ? 'bg-primary text-white border-transparent'
                      : 'bg-white text-accent border-primary/15 hover:bg-secondary/20'
                  }`}
                >
                  Custom Text
                </button>

                {/* AI Generate Sentence Button */}
                {!isUsingCustom && (
                  <button
                    type="button"
                    onClick={generateAISentence}
                    disabled={isGeneratingSentence}
                    className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-4 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingSentence ? 'animate-spin' : ''}`} />
                    {isGeneratingSentence ? "Generating..." : "✨ AI Generate"}
                  </button>
                )}
              </div>

              {/* Reset Actions */}
              <button
                type="button"
                onClick={resetPractice}
                className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3.5 py-1.5 rounded-xl transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            {/* Custom Text input area */}
            {isUsingCustom && (
              <div className="space-y-2 bg-[#fcfcfc] p-4 rounded-2xl border border-primary/10">
                <label className="text-[10px] font-black uppercase text-accent/50">Enter your custom text:</label>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Paste your own IELTS writing submission, community post, or any paragraph to practice shadowing..."
                  className="w-full text-xs p-3 border border-primary/10 rounded-xl focus:outline-none focus:border-primary/40 bg-white"
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      if (customText.trim()) {
                        setSelectedSentence(customText.trim());
                        setShadowResult(null);
                        setSelectedWord(null);
                        setPronunciationGuide(null);
                        setShowGuide(false);
                        (window as any).showToast("Loaded custom text successfully!", "success");
                      }
                    }}
                    className="bg-primary text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Apply Custom Text
                  </button>
                  <span className="text-[10px] font-bold text-primary/80 bg-primary/5 px-2 py-0.5 rounded-md">
                    ✨ 100% AI Grading Supported
                  </span>
                </div>

                {/* Community Suggestions */}
                <div className="mt-4 pt-3 border-t border-primary/10 space-y-2">
                  <span className="text-[10px] font-black text-primary uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Suggestions from Oasis Community:
                  </span>
                  {isLoadingSuggestions ? (
                    <p className="text-[10px] text-accent/50 animate-pulse">Loading hot community posts...</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
                      {(communitySuggestions.length > 0 ? communitySuggestions : STATIC_COMMUNITY_SUGGESTIONS).slice(0, 4).map((post) => (
                        <button
                          key={post.id}
                          type="button"
                          onClick={() => {
                            const content = post.full_content || post.content;
                            setCustomText(content);
                            setSelectedSentence(content);
                            setShadowResult(null);
                            setSelectedWord(null);
                            setPronunciationGuide(null);
                            setShowGuide(false);
                            (window as any).showToast(`Loaded post by @${post.username}! 🍵`, "success");
                          }}
                          className="text-left p-2.5 bg-white hover:bg-primary/5 rounded-xl border border-primary/10 transition-all group flex flex-col justify-between"
                        >
                          <p className="text-[11px] text-accent font-semibold line-clamp-2 italic mb-1.5 group-hover:text-primary">
                            "{post.content}"
                          </p>
                          <div className="flex justify-between items-center text-[9px] text-accent/50 w-full mt-auto">
                            <span className="font-bold text-primary">@{post.username}</span>
                            <span className="flex items-center gap-0.5">
                              <Heart className="w-2.5 h-2.5 text-red-400 fill-red-400" /> {post.likes || 0}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Active reference sentence card */}
            {selectedSentence ? (
              <div className="bg-[#eef7f2] p-6 rounded-3xl border-2 border-primary/10 relative overflow-hidden">
                <div className="absolute top-4 right-4 flex gap-2">
                  {/* Guide Button */}
                  <button 
                    type="button"
                    onClick={fetchPronunciationGuide}
                    disabled={isFetchingGuide}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-primary/10 transition-colors shadow-sm text-primary disabled:opacity-50"
                    title="Pronunciation & Linking Guide"
                  >
                    <BookOpen className={`w-4 h-4 ${isFetchingGuide ? 'animate-pulse' : ''}`} />
                  </button>

                  <button 
                    type="button"
                    onClick={speakReference}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-primary/10 transition-colors shadow-sm text-primary"
                    title="Listen Native"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <span className="text-[10px] font-black text-primary uppercase tracking-wider block mb-2">Practice Sentence</span>
                <p className="text-lg font-bold text-accent leading-relaxed pr-24">{selectedSentence}</p>
              </div>
            ) : (
              <div className="bg-[#f7fdf9] p-8 rounded-3xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center text-center gap-3">
                <Info className="text-primary w-8 h-8 animate-bounce" />
                <h4 className="font-display font-bold text-accent text-sm">No Practice Sentence Selected</h4>
                <p className="text-xs text-accent/60 max-w-sm">
                  {currentLevel 
                    ? `Click the "✨ AI Generate" button above to generate a new English shadowing sentence for the ${currentLevel} level!` 
                    : "Select a difficulty level above (Easy/Medium/Hard) and click 'AI Generate' to practice, or switch to 'Custom Text' to paste your own sentence."}
                </p>
              </div>
            )}

            {/* Pronunciation & Linking Guide Panel */}
            <AnimatePresence>
              {showGuide && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#fcfaf5] border border-amber-900/10 p-5 rounded-3xl space-y-4 overflow-hidden"
                >
                  <div className="flex justify-between items-center border-b border-amber-900/5 pb-2">
                    <h4 className="text-xs font-black uppercase text-amber-800 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Pronunciation & Liaison Guide
                    </h4>
                    <button 
                      type="button"
                      onClick={() => setShowGuide(false)}
                      className="text-[10px] font-bold text-accent/50 hover:text-accent"
                    >
                      Close
                    </button>
                  </div>

                  {isFetchingGuide ? (
                    <div className="flex items-center gap-2 text-xs text-amber-800/60 py-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Analyzing liaison, phonetics and intonation...
                    </div>
                  ) : pronunciationGuide ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2">
                        <p className="font-semibold text-accent">🗣️ IPA Transcription:</p>
                        <p className="text-sm font-bold text-primary italic bg-white px-3 py-1.5 rounded-xl border border-primary/5">
                          {pronunciationGuide.ipa_sentence}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="font-semibold text-accent">🎯 Keyword Stresses:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {pronunciationGuide.stresses?.map((word: string, idx: number) => (
                            <span key={idx} className="bg-white border border-primary/10 px-2 py-0.5 rounded-lg font-bold text-[#4c663c]">
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-2 border-t border-amber-900/5 pt-3">
                        <p className="font-semibold text-accent">🔗 Liaison & Word-Linking Tips:</p>
                        <ul className="list-disc pl-4 space-y-1 text-accent/80 font-medium">
                          {pronunciationGuide.liaisons?.map((tip: string, idx: number) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="md:col-span-2 space-y-1">
                        <p className="font-semibold text-accent">📈 Intonation & Pauses:</p>
                        <p className="text-accent/80 font-medium">{pronunciationGuide.intonation}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-accent/50">Guide details failed to load.</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mic control container */}
            {selectedSentence && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex items-center gap-3">
                  {isRecording ? (
                    <button 
                      type="button"
                      onClick={stopRecording}
                      className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all animate-pulse"
                    >
                      <Square className="w-6 h-6" />
                    </button>
                  ) : (
                    <button 
                      type="button"
                      disabled={isEvaluating}
                      onClick={startRecording}
                      className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
                    >
                      <Mic className="w-7 h-7" />
                    </button>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-accent">
                    {isRecording ? `Recording... ${formatTime(recordingSeconds)}` : isEvaluating ? "AI is analyzing your pronunciation..." : "Click Mic to Shadow"}
                  </p>
                  <p className="text-xs text-accent/50 mt-1">Read the sentence clearly. Intonation & ending sounds matter.</p>
                </div>
              </div>
            )}

            {/* Shadowing Evaluation Output */}
            <AnimatePresence mode="wait">
              {isEvaluating && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-10 space-y-3"
                >
                  <span className="material-symbols-rounded text-4xl text-primary animate-spin">sync</span>
                  <p className="text-xs text-primary font-bold">Evaluating phonetic details...</p>
                </motion.div>
              )}

              {shadowResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-primary/10 p-6 rounded-3xl space-y-6 shadow-sm"
                >
                  {/* Score Indicator */}
                  <div className="flex flex-col md:flex-row items-center justify-between border-b border-primary/10 pb-4 gap-4">
                    <div className="flex items-center gap-4">
                      {/* Circle Progress Bar */}
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-100"
                            strokeWidth="3"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className={`${
                              accuracyScore >= 80 ? 'text-green-500' :
                              accuracyScore >= 50 ? 'text-amber-500' : 'text-red-500'
                            }`}
                            strokeWidth="3"
                            strokeDasharray={`${accuracyScore}, 100`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <span className="absolute text-sm font-black text-accent">{accuracyScore}%</span>
                      </div>
                      
                      <div>
                        <h5 className="text-xs font-black uppercase text-accent/50 tracking-wider">Pronunciation Accuracy</h5>
                        <p className="text-sm font-bold text-accent">
                          {accuracyScore >= 80 ? "🌟 Excellent! Native-like speech." :
                           accuracyScore >= 50 ? "👍 Good job! Keep practicing links and ending sounds." :
                           "⚠️ Needs Practice. Try slower with clearer sounds."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-black uppercase text-accent/50 tracking-wider mb-3">Word-by-word Breakdown</h4>
                    <div className="flex flex-wrap gap-2 text-xl font-bold leading-relaxed">
                      {(Array.isArray(shadowResult) ? shadowResult : (shadowResult?.words || [])).map((w: any, i: number) => {
                        const statusColors = {
                          correct: 'text-green-600 bg-green-50 hover:bg-green-100 border-green-200',
                          warning: 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200',
                          incorrect: 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200'
                        };
                        return (
                          <span 
                            key={i}
                            onClick={() => setSelectedWord(w)}
                            className={`px-2 py-0.5 rounded-lg border-2 cursor-pointer transition-all ${statusColors[w.status as keyof typeof statusColors] || 'text-accent border-transparent'}`}
                          >
                            {w.word}
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-accent/50 mt-3">💡 Click on any word to view IPA pronunciation details & improvement tips.</p>
                  </div>

                  {/* Word Details Card */}
                  {selectedWord && (
                    <div className="p-4 bg-[#f9fdfa] rounded-2xl border border-primary/10 space-y-2 animate-fade-in">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-accent text-sm">{selectedWord.word}</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          selectedWord.status === 'correct' ? 'bg-green-100 text-green-700' :
                          selectedWord.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {selectedWord.status}
                        </span>
                      </div>
                      {selectedWord.ipa && (
                        <p className="text-xs italic text-primary font-bold">IPA: {selectedWord.ipa}</p>
                      )}
                      {selectedWord.tip && (
                        <p className="text-xs text-accent/80 font-medium bg-white p-2 rounded-lg border border-primary/5">{selectedWord.tip}</p>
                      )}
                    </div>
                  )}

                  {/* Skill 1: Phonetic Assessment Academic Card (docs/skills.md) */}
                  {shadowResult?.phonetic_feedback && (
                    <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/60 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-black uppercase text-emerald-900 tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                          Đánh Giá Ngữ Âm Chuyên Sâu Band 8.5+ (Skill 1 - docs/skills.md)
                        </h5>
                        {shadowResult.wpm > 0 && (
                          <span className="text-[10px] font-extrabold bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-emerald-800">
                            Tốc độ: {shadowResult.wpm} WPM
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                        <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-1">
                          <p className="font-bold text-accent text-[11px]">🎯 Âm cuối (Ending Sounds):</p>
                          <p className="text-accent/80 text-[11px] leading-relaxed">
                            {shadowResult.phonetic_feedback.ending_sounds}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-1">
                          <p className="font-bold text-accent text-[11px]">🔗 Nối âm (Linking Sounds):</p>
                          <p className="text-accent/80 text-[11px] leading-relaxed">
                            {shadowResult.phonetic_feedback.linking_sounds}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-1">
                          <p className="font-bold text-accent text-[11px]">🎵 Ngữ điệu (Intonation):</p>
                          <p className="text-accent/80 text-[11px] leading-relaxed">
                            {shadowResult.phonetic_feedback.intonation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {activeMode === 'sandbox' && (
          /* Speaking Sandbox Mode (IELTS Part 2) */
          <div className="lg:col-span-12 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Cue Card Display */}
              <div className="lg:col-span-5 bg-[#eef7f2] p-6 rounded-3xl border-2 border-primary/10 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-primary uppercase tracking-wider">IELTS Speaking Part 2</span>
                  </div>

                  {/* Difficulty level selector and AI generation for Cue Card */}
                  <div className="flex flex-wrap gap-2 items-center justify-between mb-4 border-b border-primary/10 pb-3">
                    <div className="flex gap-1 bg-white p-0.5 rounded-full border border-primary/15">
                      {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setSandboxLevel(lvl)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                            sandboxLevel === lvl
                              ? 'bg-primary text-white'
                              : 'text-accent/60 hover:text-accent'
                          }`}
                        >
                          {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={generateAICueCard}
                      disabled={isGeneratingCueCard}
                      className="flex items-center gap-1 bg-white border border-primary/20 px-2.5 py-1 rounded-full text-[10px] font-bold text-primary hover:bg-primary/5 transition-all disabled:opacity-50 shadow-sm"
                    >
                      <Sparkles className={`w-3 h-3 ${isGeneratingCueCard ? 'animate-spin' : ''}`} />
                      AI Generate
                    </button>
                  </div>
                  
                  {selectedCard?.topic ? (
                    <div className="p-4 bg-white rounded-2xl border border-primary/5 shadow-inner">
                      <h4 className="font-bold text-accent text-sm leading-snug mb-3">Topic: "{selectedCard.topic}"</h4>
                      <p className="text-xs text-accent/60 mb-2 font-semibold">You should say:</p>
                      <ul className="text-xs text-accent/80 space-y-1.5 list-disc pl-4 font-medium">
                        {selectedCard.prompts.map((p: string, idx: number) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="p-6 bg-white rounded-2xl border border-dashed border-primary/20 flex flex-col items-center justify-center text-center gap-2">
                      <Sparkles className="text-primary w-5 h-5 animate-pulse" />
                      <h5 className="font-bold text-accent text-xs">No IELTS Card Generated</h5>
                      <p className="text-[10px] text-accent/50 max-w-[200px]">Select a level and click 'AI Generate' above to create your IELTS Part 2 cue card.</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    {isPrepActive ? (
                      <p className="text-xs font-bold text-red-500 animate-pulse">Prep Time: {prepSeconds}s remaining...</p>
                    ) : (
                      <p className="text-xs font-bold text-accent/60">Take 1 minute to plan your keywords.</p>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={startPrepTimer}
                    disabled={isRecording || isPrepActive || !selectedCard?.topic}
                    className="bg-accent/10 hover:bg-accent/20 text-accent font-bold text-xs px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Start 1-Min Prep
                  </button>
                </div>
              </div>

              {/* Recording Controls */}
              <div className="lg:col-span-7 bg-white border border-primary/10 p-6 rounded-3xl flex flex-col items-center justify-center gap-4 text-center min-h-[250px]">
                <div className="relative">
                  {isRecording ? (
                    <button 
                      type="button"
                      onClick={stopRecording}
                      className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all animate-pulse"
                    >
                      <Square className="w-8 h-8" />
                    </button>
                  ) : (
                    <button 
                      type="button"
                      disabled={isEvaluating || !selectedCard?.topic}
                      onClick={startRecording}
                      className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
                    >
                      <Mic className="w-8 h-8" />
                    </button>
                  )}
                </div>
                
                <div>
                  <h4 className="text-base font-bold text-accent">
                    {isRecording ? `Recording Response... ${formatTime(recordingSeconds)}` : isEvaluating ? "AI Examiner is reviewing your response..." : "Record Part 2 Essay"}
                  </h4>
                  <p className="text-xs text-accent/50 max-w-xs mt-1">Talk for 1-2 minutes. Cover all key prompt bullet points clearly.</p>
                </div>

                {audioUrl && (
                  <div className="w-full max-w-xs bg-secondary/20 p-2.5 rounded-2xl border border-primary/5 flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        const audio = new Audio(audioUrl);
                        audio.play();
                      }}
                      className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:scale-105 transition-all"
                    >
                      <span className="material-symbols-rounded text-white text-base">play_arrow</span>
                    </button>
                    <span className="text-[10px] font-bold text-accent/60">Play your response</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sandbox Evaluation Output */}
            <AnimatePresence mode="wait">
              {isEvaluating && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-10 space-y-3"
                >
                  <span className="material-symbols-rounded text-4xl text-primary animate-spin">sync</span>
                  <p className="text-xs text-primary font-bold">AI Examiner is reviewing transcript and grammar complexity...</p>
                </motion.div>
              )}

              {sandboxResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Score & Main Metric */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#eef7f2] p-6 rounded-3xl border border-primary/10 flex flex-col items-center justify-center text-center">
                      <Award className="w-8 h-8 text-primary mb-2" />
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">IELTS Band Score</span>
                      <h3 className="text-4xl font-display font-black text-accent mt-1">Band {sandboxResult.band_score}</h3>
                    </div>
                    <div className="bg-white border border-primary/10 p-6 rounded-3xl flex flex-col items-center justify-center text-center">
                      <Volume2 className="w-8 h-8 text-accent/60 mb-2" />
                      <span className="text-[10px] font-black text-accent/50 uppercase tracking-widest">Speech Tempo</span>
                      <h3 className="text-3xl font-display font-black text-accent mt-1">{sandboxResult.wpm} WPM</h3>
                    </div>
                    <div className="bg-[#fcfaf5] p-6 rounded-3xl border border-amber-950/10 flex flex-col items-center justify-center text-center">
                      <Star className="w-8 h-8 text-amber-500 mb-2" />
                      <span className="text-[10px] font-black text-amber-700/60 uppercase tracking-widest">Evaluation Status</span>
                      <h3 className="text-base font-bold text-amber-800 mt-1">Examiner Review Completed</h3>
                    </div>
                  </div>

                  {/* Transcript */}
                  {sandboxResult.transcript && (
                    <div className="bg-white border border-primary/10 p-6 rounded-3xl space-y-2">
                      <h4 className="text-xs font-black uppercase text-accent tracking-wider">Your Speech Transcript</h4>
                      <p className="text-xs text-accent/80 italic leading-relaxed bg-[#fcfcfc] p-4 rounded-2xl border border-black/5">{sandboxResult.transcript}</p>
                    </div>
                  )}

                  {/* 4 Assessment Criteria */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-primary/5 p-5 rounded-2xl space-y-2 shadow-sm">
                      <h4 className="text-xs font-bold text-accent flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary"></span> Fluency & Coherence</h4>
                      <p className="text-[11px] text-accent/70 leading-relaxed font-medium">{sandboxResult.criteria?.fluency}</p>
                    </div>
                    <div className="bg-white border border-primary/5 p-5 rounded-2xl space-y-2 shadow-sm">
                      <h4 className="text-xs font-bold text-accent flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary"></span> Lexical Resource</h4>
                      <p className="text-[11px] text-accent/70 leading-relaxed font-medium">{sandboxResult.criteria?.lexical}</p>
                    </div>
                    <div className="bg-white border border-primary/5 p-5 rounded-2xl space-y-2 shadow-sm">
                      <h4 className="text-xs font-bold text-accent flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary"></span> Grammatical Accuracy</h4>
                      <p className="text-[11px] text-accent/70 leading-relaxed font-medium">{sandboxResult.criteria?.grammar}</p>
                    </div>
                    <div className="bg-white border border-primary/5 p-5 rounded-2xl space-y-2 shadow-sm">
                      <h4 className="text-xs font-bold text-accent flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary"></span> Pronunciation</h4>
                      <p className="text-[11px] text-accent/70 leading-relaxed font-medium">{sandboxResult.criteria?.pronunciation}</p>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50/50 border border-green-100 p-5 rounded-2xl space-y-2">
                      <h4 className="text-xs font-bold text-green-700 flex items-center gap-1.5">🌟 Key Strengths</h4>
                      <ul className="text-xs text-green-800 space-y-1.5 list-disc pl-4 font-medium">
                        {sandboxResult.strengths?.map((s: string, idx: number) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-orange-50/50 border border-orange-100 p-5 rounded-2xl space-y-2">
                      <h4 className="text-xs font-bold text-orange-700 flex items-center gap-1.5">⚠️ Areas for Improvement</h4>
                      <ul className="text-xs text-orange-800 space-y-1.5 list-disc pl-4 font-medium">
                        {sandboxResult.weaknesses?.map((w: string, idx: number) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Pronunciation & Accent Feedback */}
                  {sandboxResult.mispronounced_words && sandboxResult.mispronounced_words.length > 0 && (
                    <div className="bg-white border border-primary/10 p-6 rounded-3xl space-y-3">
                      <h4 className="text-xs font-black uppercase text-accent tracking-wider">Pronunciation & Accent Feedback</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {sandboxResult.mispronounced_words.map((w: any, idx: number) => (
                          <div key={idx} className="p-3.5 bg-amber-50/40 rounded-2xl border border-amber-100/50 flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-accent text-xs">"{w.word}"</span>
                              {w.ipa && <span className="text-[10px] text-primary italic font-bold">IPA: {w.ipa}</span>}
                            </div>
                            {w.tip && <p className="text-[10px] text-accent/70 font-semibold mt-1">💡 {w.tip}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grammatical Corrections */}
                  {sandboxResult.corrections && sandboxResult.corrections.length > 0 && (
                    <div className="bg-white border border-primary/10 p-6 rounded-3xl space-y-3">
                      <h4 className="text-xs font-black uppercase text-accent tracking-wider">Grammatical Corrections</h4>
                      <div className="space-y-3">
                        {sandboxResult.corrections.map((c: any, idx: number) => (
                          <div key={idx} className="p-3 bg-red-50/40 rounded-2xl border border-red-100/50 flex flex-col gap-1">
                            <p className="text-[11px] line-through text-red-400">{c.original}</p>
                            <p className="text-xs font-bold text-green-600">➔ {c.corrected}</p>
                            <p className="text-[10px] text-accent/60 italic font-medium">Why: {c.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skill 4: Shadow Error Logging (docs/skills.md) */}
                  {sandboxResult.shadow_errors_logged && sandboxResult.shadow_errors_logged.length > 0 && (
                    <div className="p-6 bg-amber-50/70 rounded-3xl border border-amber-200/80 space-y-3">
                      <h4 className="text-xs font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                        Ghi Nhận Lỗi Ngầm & Nâng Cấp Band 8.5+ (Skill 4 - docs/skills.md)
                      </h4>
                      <div className="space-y-2">
                        {sandboxResult.shadow_errors_logged.map((err: any, idx: number) => (
                          <div key={idx} className="bg-white p-3 rounded-2xl border border-amber-100 text-xs space-y-1">
                            <p className="text-red-700 font-medium">
                              ❌ Học viên nói: <span className="line-through italic">{err.learner_utterance}</span>
                            </p>
                            <p className="text-emerald-800 font-extrabold">
                              ✨ Diễn đạt Band 8.5+: <span>{err.band_8_alternative}</span>
                            </p>
                            {err.identified_flaw && (
                              <p className="text-[10px] text-accent/60">
                                Nhận diện lỗi: {err.identified_flaw}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Band 8.5+ Model Rephrase */}
                  {sandboxResult.model_answer && (
                    <div className="bg-[#eef7f2] p-6 rounded-3xl border border-primary/10 space-y-3">
                      <h4 className="text-xs font-black uppercase text-primary tracking-wider">Band 8.5+ Model Rephrase</h4>
                      <p className="text-xs text-accent font-medium leading-relaxed italic bg-white p-4 rounded-2xl border border-primary/10 shadow-inner">
                        {sandboxResult.model_answer}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {activeMode === 'gemini_live' && (
          /* Gemini Live Reflex Mode */
          <div className="lg:col-span-12 space-y-6">
            {/* Top Gemini Live Status & Control Banner */}
            <div className="bg-gradient-to-r from-[#2c402e] via-[#3a563d] to-[#2c402e] text-white p-6 rounded-3xl shadow-xl relative overflow-hidden border border-emerald-700/40">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                
                {/* Bear Coach Avatar & Current State */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-2 ${
                      isBearSpeaking 
                        ? 'bg-amber-400 border-white animate-bounce' 
                        : isLiveRecording 
                          ? 'bg-red-500 border-white animate-pulse'
                          : 'bg-[#405c43] border-white/20'
                    }`}>
                      🐻
                    </div>
                    {isBearSpeaking && (
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-400 text-[8px] text-accent font-bold items-center justify-center">🔊</span>
                      </span>
                    )}
                    {isLiveRecording && (
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[8px] text-white font-bold items-center justify-center">●</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black tracking-widest uppercase bg-white/10 px-2 py-0.5 rounded-full text-emerald-200">
                        Cambridge IELTS Live Coach
                      </span>
                      {liveHandsFree && (
                        <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-300/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Radio className="w-2.5 h-2.5 animate-pulse" /> Auto VAD Active
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-white mt-0.5">Matcha Bear Live Studio</h3>
                    <p className="text-xs text-white/80 font-medium">
                      {isBearSpeaking ? (
                        <span className="text-amber-200 font-bold flex items-center gap-1">
                          <Volume2 className="w-3.5 h-3.5 animate-pulse" /> Matcha Bear is speaking... (Listen or Interrupt)
                        </span>
                      ) : isLiveEvaluating ? (
                        <span className="text-emerald-200 font-bold flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 animate-spin" /> Analyzing reflex speed, phonetics & IELTS grammar...
                        </span>
                      ) : isLiveRecording ? (
                        <span className="text-red-200 font-bold flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-ping" /> Listening to you ({liveRecordingSeconds}s) - Speak clearly!
                        </span>
                      ) : (
                        "Ready! Tap the mic to reply directly with your voice."
                      )}
                    </p>
                  </div>
                </div>

                {/* Live Stats & Toggles */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-black/25 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/10 text-center">
                    <span className="text-[9px] uppercase tracking-wider text-white/60 block font-bold">Reflex Score</span>
                    <span className="text-base font-black text-amber-300">{liveScore} pts</span>
                  </div>
                  <div className="bg-black/25 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/10 text-center">
                    <span className="text-[9px] uppercase tracking-wider text-white/60 block font-bold">Streak</span>
                    <span className="text-base font-black text-emerald-300 flex items-center justify-center gap-0.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" /> {liveStreak}
                    </span>
                  </div>

                  {/* Hands-Free VAD Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      primeMobileAudio();
                      setLiveHandsFree(!liveHandsFree);
                    }}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                      liveHandsFree 
                        ? 'bg-amber-400 text-stone-900 border-amber-300 shadow-md' 
                        : 'bg-white/10 text-white/80 border-white/15 hover:bg-white/20'
                    }`}
                  >
                    <Radio className={`w-3.5 h-3.5 ${liveHandsFree ? 'animate-pulse text-stone-900' : ''}`} />
                    Hands-Free: {liveHandsFree ? 'ON' : 'OFF'}
                  </button>

                  {/* Interrupt Button (When Bear is talking) */}
                  {isBearSpeaking && (
                    <button
                      type="button"
                      onClick={interruptLiveSpeech}
                      className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-red-500/90 hover:bg-red-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer animate-pulse"
                    >
                      <VolumeX className="w-3.5 h-3.5" /> Interrupt Bear
                    </button>
                  )}
                </div>
              </div>

              {/* Current Question Spotlight */}
              <div className="mt-5 pt-4 border-t border-white/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-black/20 p-3.5 rounded-2xl">
                <div className="flex-1">
                  <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">🎯 Current Question:</span>
                  <p className="text-sm font-bold text-white mt-0.5 leading-snug">"{currentLiveQuestion}"</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={changeLiveQuestion}
                    className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition-all border border-white/10 shrink-0 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Switch Topic
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      primeMobileAudio();
                      playLiveSpeech(currentLiveQuestion);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition-all border border-white/10 shrink-0 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Replay Question
                  </button>
                </div>
              </div>
            </div>

            {/* Conversation Feed */}
            <div className="bg-[#f8faf8] border border-primary/10 rounded-3xl p-4 md:p-6 space-y-4 max-h-[500px] overflow-y-auto shadow-inner">
              {liveChatHistory.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-2`}
                >
                  <div className="flex items-center gap-2 text-[10px] font-bold text-accent/50 px-1">
                    {msg.sender === 'user' ? (
                      <span>You (Learner) 🎙️</span>
                    ) : (
                      <span className="flex items-center gap-1">🐻 Matcha Bear Coach</span>
                    )}
                  </div>

                  <div 
                    className={`max-w-[88%] md:max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-[#1B4332] text-white border border-[#2D6A4F] font-medium rounded-tr-none'
                        : 'bg-white border-2 border-emerald-100/80 text-stone-900 font-medium rounded-tl-none space-y-3'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <p className={`text-xs md:text-sm font-semibold leading-relaxed ${
                        msg.sender === 'user' ? 'text-white !text-white' : 'text-stone-900 !text-stone-900'
                      }`}>{msg.text}</p>
                      {msg.sender === 'bear' && (
                        <button
                          type="button"
                          onClick={() => {
                            primeMobileAudio();
                            speakLiveSequence(msg.spokenReply || msg.text, msg.spokenQuestion || '');
                          }}
                          className="p-1 rounded-lg text-primary hover:bg-primary/10 transition-colors shrink-0 cursor-pointer"
                          title="Listen to this reply aloud"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Skill 4: Shadow Error Logging Card (if data attached) */}
                    {msg.data?.shadow_errors_logged && msg.data.shadow_errors_logged.length > 0 && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2">
                        <div className="flex items-center gap-1 text-[11px] font-black text-amber-900 uppercase">
                          <Zap className="w-3 h-3 text-amber-600" />
                          Skill 4: Lỗi Ngầm & Diễn Đạt Band 8.5+ (docs/skills.md)
                        </div>
                        {msg.data.shadow_errors_logged.map((err: any, errIdx: number) => (
                          <div key={errIdx} className="bg-white p-2.5 rounded-lg border border-amber-100 space-y-1">
                            <p className="text-red-600 font-medium">❌ Bạn nói: <span className="line-through">{err.learner_utterance}</span></p>
                            <p className="text-emerald-700 font-bold">✨ Nâng cấp: <span>{err.band_8_alternative}</span></p>
                            {err.identified_flaw && <p className="text-[10px] text-accent/60">Ghi chú: {err.identified_flaw}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Skill 1: Phonetic Assessment Card (if data attached) */}
                    {msg.data?.phonetic_feedback && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-emerald-900 uppercase">🎯 Phân Tích Ngữ Âm Học Thuật</span>
                          {msg.data.phonetic_feedback.speech_tempo && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                              ⚡ Nhịp độ: {msg.data.phonetic_feedback.speech_tempo}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div className="bg-white p-2 rounded-lg border border-emerald-100">
                            <span className="text-[10px] text-emerald-800 font-bold block">Âm cuối (Endings)</span>
                            <span className="text-[11px] text-accent">{msg.data.phonetic_feedback.ending_sounds || 'Good'}</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-emerald-100">
                            <span className="text-[10px] text-emerald-800 font-bold block">Nối âm (Liaison)</span>
                            <span className="text-[11px] text-accent">{msg.data.phonetic_feedback.connected_speech || 'Natural'}</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-emerald-100">
                            <span className="text-[10px] text-emerald-800 font-bold block">Ngữ điệu (Intonation)</span>
                            <span className="text-[11px] text-accent">{msg.data.phonetic_feedback.intonation || 'Clear'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Interactive Voice Control Bar */}
            <div className="bg-white border border-primary/10 p-6 rounded-3xl shadow-sm flex flex-col items-center justify-center text-center gap-4">
              
              {/* Dynamic Waveform Visualizer */}
              {isLiveRecording && (
                <div className="flex items-center gap-1.5 h-8">
                  {[...Array(12)].map((_, i) => {
                    const height = Math.max(8, Math.min(32, (liveVolume * 36) * Math.sin((i + 1) * 0.8)));
                    return (
                      <div
                        key={i}
                        className="w-1.5 rounded-full bg-red-500 transition-all duration-75"
                        style={{ height: `${height}px` }}
                      />
                    );
                  })}
                </div>
              )}

              {/* Microphone Center Button */}
              <div className="relative">
                {isLiveRecording ? (
                  <button
                    type="button"
                    onClick={stopLiveRecording}
                    className="w-24 h-24 rounded-full bg-red-500 text-white flex flex-col items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all animate-pulse border-4 border-red-200 cursor-pointer"
                  >
                    <Square className="w-8 h-8 fill-current" />
                    <span className="text-[10px] font-black uppercase mt-1 tracking-wider">Tap to Stop</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isLiveEvaluating}
                    onClick={() => {
                      primeMobileAudio();
                      startLiveRecording();
                    }}
                    className={`w-24 h-24 rounded-full text-white flex flex-col items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all border-4 border-emerald-200 cursor-pointer ${
                      isLiveEvaluating ? 'bg-gray-400 opacity-60 cursor-not-allowed' : 'bg-primary'
                    }`}
                  >
                    <Mic className="w-9 h-9" />
                    <span className="text-[10px] font-black uppercase mt-1 tracking-wider">
                      {isLiveEvaluating ? 'Evaluating...' : 'Tap & Speak'}
                    </span>
                  </button>
                )}
              </div>

              {/* Status / Instructions */}
              <div>
                <h4 className="text-base font-bold text-accent">
                  {isLiveRecording
                    ? `Recording Voice Response... ${formatTime(liveRecordingSeconds)}`
                    : isLiveEvaluating
                      ? "Matcha Bear is grading your speech with Gemini..."
                      : "Tap Microphone to Answer Aloud"}
                </h4>
                <p className="text-xs text-accent/60 max-w-md mt-1">
                  {isLiveRecording
                    ? "Speak into your phone/mic. When finished, tap the button to submit immediately, or pause 2.6s for automatic submission."
                    : "💡 Mobile tip: Unmute your phone ring switch and turn volume up. Matcha Bear will talk back directly through your speaker!"}
                </p>
              </div>

              {/* Direct reset conversation link */}
              <button
                type="button"
                onClick={() => {
                  interruptLiveSpeech();
                  setLiveScore(0);
                  setLiveStreak(0);
                  setLiveChatHistory([
                    {
                      sender: 'bear',
                      text: "Hello buddy! I'm your Cambridge IELTS Speaking Coach, Matcha Bear. Tap the microphone below and let's talk directly with voice! 🐻🍵",
                      spokenReply: "Hello buddy! I am your Cambridge IELTS Speaking Coach, Matcha Bear. Tap the microphone below and let us talk directly with voice!"
                    },
                    {
                      sender: 'bear',
                      text: "What is your favorite hobby during weekends and why do you enjoy it?",
                      spokenQuestion: "What is your favorite hobby during weekends and why do you enjoy it?"
                    }
                  ]);
                  setCurrentLiveQuestion("What is your favorite hobby during weekends and why do you enjoy it?");
                  (window as any).showToast?.("Gemini Live session reset!", "info");
                }}
                className="text-[11px] font-bold text-accent/50 hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Reset Live Session
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
