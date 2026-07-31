"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Volume2, Info, Star, Award, AwardIcon, Compass, Play, RefreshCw, Sliders, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
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

const CUE_CARDS = [
  {
    topic: "Describe a technological device you use daily.",
    prompts: [
      "What device it is and when you got it",
      "What you use it for",
      "How it benefits your daily routine",
      "And explain whether you could live without it."
    ]
  },
  {
    topic: "Describe a memorable journey you took.",
    prompts: [
      "Where you went and how you traveled",
      "Who you went with",
      "What memorable activities you did",
      "And explain why this journey stands out in your memory."
    ]
  },
  {
    topic: "Describe an environmental problem in your country.",
    prompts: [
      "What the environmental problem is",
      "What causes this issue",
      "How it affects people's health and lifestyle",
      "And explain what measures could be taken to solve it."
    ]
  }
];

export default function MatchaSpeak() {
  const [activeMode, setActiveMode] = useState<'shadowing' | 'sandbox'>('shadowing');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Microphone & Filter Settings
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [noiseCancellation, setNoiseCancellation] = useState<boolean>(true);

  // Shadowing state
  const [currentLevel, setCurrentLevel] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedSentence, setSelectedSentence] = useState(LEVEL_SENTENCES.medium[0]);
  const [shadowResult, setShadowResult] = useState<any[] | null>(null);
  const [selectedWord, setSelectedWord] = useState<any | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  // Custom Text state
  const [customText, setCustomText] = useState<string>('');
  const [isUsingCustom, setIsUsingCustom] = useState<boolean>(false);

  // Sandbox state
  const [selectedCard, setSelectedCard] = useState(CUE_CARDS[0]);
  const [prepSeconds, setPrepSeconds] = useState(60);
  const [isPrepActive, setIsPrepActive] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<any | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const prepTimerRef = useRef<any>(null);

  // Load available audio devices
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        // Request temporary mic permission to query labels
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop()); // release temporary access
        
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const inputs = allDevices.filter(d => d.kind === 'audioinput');
        setAudioDevices(inputs);
        if (inputs.length > 0) {
          setSelectedDeviceId(inputs[0].deviceId);
        }
      } catch (err) {
        console.error("Failed to enumerate audio devices:", err);
      }
    };
    fetchDevices();
  }, []);

  // Update sentence when level changes
  useEffect(() => {
    if (!isUsingCustom) {
      setSelectedSentence(LEVEL_SENTENCES[currentLevel][0]);
      setShadowResult(null);
      setSelectedWord(null);
    }
  }, [currentLevel, isUsingCustom]);

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

  // Reset Shadowing / Practice
  const resetPractice = () => {
    setShadowResult(null);
    setSelectedWord(null);
    setAudioUrl(null);
    setCustomText('');
    setIsUsingCustom(false);
    setSelectedSentence(LEVEL_SENTENCES[currentLevel][0]);
    (window as any).showToast("Cleared results & reset sentence! 🍵", "success");
  };

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
        <div className="flex bg-secondary/50 p-1 rounded-full border border-primary/10">
          <button type="button" 
            onClick={() => {
              setActiveMode('shadowing');
              setShadowResult(null);
              setSandboxResult(null);
              setAudioUrl(null);
              setIsRecording(false);
            }}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeMode === 'shadowing' ? 'bg-primary text-white shadow-md' : 'text-accent/70 hover:text-accent'}`}
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
            }}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeMode === 'sandbox' ? 'bg-primary text-white shadow-md' : 'text-accent/70 hover:text-accent'}`}
          >
            Speaking Sandbox
          </button>
        </div>
      </div>

      {/* Audio Setup Settings Panel */}
      <div className="bg-[#fcfaf5] border border-amber-900/10 p-4 rounded-2xl flex flex-wrap gap-6 items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary" />
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
              <ToggleRight className="w-5 h-5 text-primary" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-accent/40" />
            )}
            Noise Filter
          </button>
        </div>
      </div>

      {/* Mode Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {activeMode === 'shadowing' ? (
          /* Shadowing Mode */
          <div className="lg:col-span-12 space-y-6">
            
            {/* Level Selector & Custom Text Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Level options */}
              <div className="flex gap-2">
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
                    Level: {lvl === 'easy' ? 'Dễ' : lvl === 'medium' ? 'Vừa' : 'Khó'}
                  </button>
                ))}
                
                <button
                  type="button"
                  onClick={() => setIsUsingCustom(true)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    isUsingCustom
                      ? 'bg-primary text-white border-transparent'
                      : 'bg-white text-accent border-primary/15 hover:bg-secondary/20'
                  }`}
                >
                  Tự nhập đoạn văn
                </button>
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
                <label className="text-[10px] font-black uppercase text-accent/50">Nhập đoạn văn của bạn:</label>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Paste your own IELTS writing submission, community post, or any paragraph to practice shadowing..."
                  className="w-full text-xs p-3 border border-primary/10 rounded-xl focus:outline-none focus:border-primary/40 bg-white"
                  rows={3}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customText.trim()) {
                      setSelectedSentence(customText.trim());
                      setShadowResult(null);
                      setSelectedWord(null);
                      (window as any).showToast("Loaded custom text successfully!", "success");
                    }
                  }}
                  className="bg-primary text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Áp dụng đoạn văn
                </button>
              </div>
            )}

            {/* Active reference sentence card */}
            <div className="bg-[#eef7f2] p-6 rounded-3xl border-2 border-primary/10 relative overflow-hidden">
              <div className="absolute top-4 right-4 flex gap-2">
                {!isUsingCustom && (
                  <button 
                    type="button"
                    onClick={() => {
                      const sentences = LEVEL_SENTENCES[currentLevel];
                      const nextIdx = (sentences.indexOf(selectedSentence) + 1) % sentences.length;
                      setSelectedSentence(sentences[nextIdx]);
                      setShadowResult(null);
                      setSelectedWord(null);
                    }}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-primary/10 transition-colors shadow-sm text-primary"
                    title="Next Sentence"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
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
              <p className="text-lg font-bold text-accent leading-relaxed pr-16">{selectedSentence}</p>
            </div>

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
                  <div>
                    <h4 className="text-sm font-black uppercase text-accent tracking-wider mb-3">Pronunciation Evaluation</h4>
                    <div className="flex flex-wrap gap-2 text-xl font-bold leading-relaxed">
                      {shadowResult.map((w, i) => {
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* Speaking Sandbox Mode (IELTS Part 2) */
          <div className="lg:col-span-12 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Cue Card Display */}
              <div className="lg:col-span-5 bg-[#eef7f2] p-6 rounded-3xl border-2 border-primary/10 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-primary uppercase tracking-wider">IELTS Speaking Part 2</span>
                    <button 
                      type="button"
                      onClick={() => {
                        const nextIdx = (CUE_CARDS.indexOf(selectedCard) + 1) % CUE_CARDS.length;
                        setSelectedCard(CUE_CARDS[nextIdx]);
                        setSandboxResult(null);
                      }}
                      className="text-xs bg-white text-primary border border-primary/20 px-2 py-1 rounded-full hover:bg-primary hover:text-white transition-all font-bold flex items-center gap-1 shadow-sm"
                    >
                      <RefreshCw className="w-3 h-3" /> Change Card
                    </button>
                  </div>
                  
                  <div className="p-4 bg-white rounded-2xl border border-primary/5 shadow-inner">
                    <h4 className="font-bold text-accent text-sm leading-snug mb-3">Topic: "{selectedCard.topic}"</h4>
                    <p className="text-xs text-accent/60 mb-2 font-semibold">You should say:</p>
                    <ul className="text-xs text-accent/80 space-y-1.5 list-disc pl-4 font-medium">
                      {selectedCard.prompts.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
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
                    disabled={isRecording || isPrepActive}
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
                      disabled={isEvaluating}
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
                      <Play className="w-4 h-4 ml-0.5" />
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
                  <p className="text-xs text-primary font-bold">AI Examiner is analyzing transcript and grammar complexity...</p>
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
      </div>
    </section>
  );
}
