"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Mic, Square, Volume2, Play, Sparkles, RefreshCw, Trophy, ArrowLeft, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Conversation history
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'bear' | 'user'; text: string; data?: any }>>([
    { sender: 'bear', text: "Hello buddy! I'm your host, Matcha Bear. Ready to challenge your speaking reflexes? 🐻" },
    { sender: 'bear', text: INITIAL_QUESTIONS[0] }
  ]);

  // Reflex timing
  const [reflexTimer, setReflexTimer] = useState<number | null>(null);
  const [startSpeakTime, setStartSpeakTime] = useState<number | null>(null);
  const [responseDelay, setResponseDelay] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const savedUser = localStorage.getItem("oasis_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
    }
    // Start timing first question
    questionStartTimeRef.current = Date.now();
  }, []);

  // Web Speech synthesis for Matcha Bear
  const speakQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    speakQuestion(currentQuestion);
    questionStartTimeRef.current = Date.now();
  }, [currentQuestion]);

  const startRecording = async () => {
    try {
      // Calculate delay before user started speaking
      const now = Date.now();
      const delay = (now - questionStartTimeRef.current) / 1000;
      setResponseDelay(delay);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const options = { mimeType: 'audio/webm' };
      
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
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
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        evaluateResponse(audioBlob);
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
      (window as any).showToast("Cannot access microphone.", "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const evaluateResponse = async (audioBlob: Blob) => {
    const token = localStorage.getItem("oasis_token");
    if (!token) {
      (window as any).showToast("Please log in to play!", "info");
      return;
    }

    setIsEvaluating(true);
    const formData = new FormData();
    formData.append("file", audioBlob, "reflex_response.webm");
    formData.append("question", currentQuestion);

    try {
      const res = await fetch(`${API_URL}/speaking/reflex`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        
        // Add user response to chat
        setChatHistory(prev => [...prev, { sender: 'user', text: data.transcript }]);
        
        // Award score points based on filler words and response speed
        let roundScore = 100;
        if (data.filler_words_count > 2) roundScore -= 20;
        if (responseDelay && responseDelay > 5) roundScore -= 30;
        roundScore = Math.max(20, roundScore);

        setScore(prev => prev + roundScore);
        setStreak(prev => prev + 1);

        // Add Matcha Bear response and witty reply
        setTimeout(() => {
          setChatHistory(prev => [...prev, { 
            sender: 'bear', 
            text: `${data.witty_reply} 🐻 (Fillers found: ${data.filler_words_count}. Reflex delay: ${responseDelay?.toFixed(1)}s)`,
            data: data
          }]);
          
          if (data.next_question) {
            setTimeout(() => {
              setCurrentQuestion(data.next_question);
              setChatHistory(prev => [...prev, { sender: 'bear', text: data.next_question }]);
            }, 1500);
          }
        }, 1000);
      } else {
        (window as any).showToast("Matcha Bear couldn't evaluate your voice.", "error");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-primary/10">
        <Link 
          href="/games"
          className="flex items-center gap-2 text-accent font-bold hover:text-primary transition-all bg-white border border-primary/20 px-4 py-2 rounded-full shadow-sm active:scale-95 text-xs sm:text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Về Arcade Hub
        </Link>
        <div className="flex items-center gap-3">
          <Trophy className="text-primary w-6 h-6" />
          <div className="text-right">
            <p className="text-[10px] font-black text-primary uppercase">Reflex Score</p>
            <p className="font-display font-black text-accent text-lg">{score} pts</p>
          </div>
        </div>
      </header>

      {/* Game Screen */}
      <div className="flex-1 bg-white border-4 border-primary/20 rounded-[3rem] p-6 shadow-sm flex flex-col overflow-hidden relative min-h-[500px]">
        {/* Chat History Panel */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-6 custom-scrollbar flex flex-col">
          {chatHistory.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex items-start gap-3 max-w-[80%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm border ${
                msg.sender === 'user' ? 'bg-[#A7D08C] border-primary/20' : 'bg-cream-yellow border-amber-950/15'
              }`}>
                {msg.sender === 'user' ? '🧑‍🚀' : '🐻'}
              </div>
              <div className={`p-4 rounded-3xl border text-sm font-medium leading-relaxed ${
                msg.sender === 'user' 
                  ? 'bg-primary text-white border-transparent rounded-tr-none' 
                  : 'bg-[#eef7f2] text-accent border-primary/10 rounded-tl-none'
              }`}>
                {msg.text}
                
                {/* Witty response details */}
                {msg.data && (
                  <div className="mt-2 pt-2 border-t border-primary/10 text-[10px] opacity-90 space-y-1">
                    <p className="font-bold">🐻 Matcha Bear Tip:</p>
                    <p className="italic">"{msg.data.feedback}"</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isEvaluating && (
            <div className="flex items-start gap-3 self-start max-w-[80%] animate-pulse">
              <div className="w-8 h-8 rounded-full bg-cream-yellow border border-amber-950/15 flex items-center justify-center text-lg">🐻</div>
              <div className="p-4 bg-secondary/30 rounded-3xl border border-primary/5 text-xs font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-rounded animate-spin text-sm">sync</span>
                Matcha Bear is typing a witty response...
              </div>
            </div>
          )}
        </div>

        {/* Input & Record Controls */}
        <div className="border-t border-primary/10 pt-4 flex flex-col items-center justify-center gap-3">
          <div className="relative">
            {isRecording ? (
              <button 
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all animate-pulse"
              >
                <Square className="w-6 h-6" />
              </button>
            ) : (
              <button 
                disabled={isEvaluating}
                onClick={startRecording}
                className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
              >
                <Mic className="w-7 h-7" />
              </button>
            )}
          </div>
          
          <div className="text-center">
            <h4 className="text-sm font-bold text-accent">
              {isRecording ? `Reflecting... ${formatTime(recordingSeconds)}` : isEvaluating ? "Evaluating..." : "Speak now to respond to Matcha Bear!"}
            </h4>
            <p className="text-[10px] text-accent/50 mt-1">Reflex speed matters! Avoid fillers like "um", "ah", or "like" to score high points.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
