"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  SkipForward, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  Eye, 
  EyeOff,
  Headphones
} from 'lucide-react';

interface VocabItem {
  id?: number;
  word: string;
  meaning: string;
  phonetic?: string;
  example?: string;
  memory_hook?: string;
}

interface Props {
  currentWord: VocabItem;
  onAnswer: (isCorrect: boolean, score: number) => void;
  onSkipWord: (word: VocabItem) => void;
  onNext: () => void;
  onPlayAudio?: (word: string) => void;
}

// Tính khoảng cách Levenshtein đơn giản và trả về điểm phần trăm khớp (0-100)
function calculateSpeechAccuracy(spoken: string, target: string): number {
  const s = spoken.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const t = target.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  
  if (!s || !t) return 0;
  if (s === t) return 100;
  if (s.includes(t) || t.includes(s)) return 85;

  const m = s.length;
  const n = t.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s[i - 1] === t[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  const distance = dp[m][n];
  const maxLen = Math.max(m, n);
  const similarity = Math.max(0, 1 - distance / maxLen);
  return Math.round(similarity * 100);
}

export default function SpeechPronunciationDrill({
  currentWord,
  onAnswer,
  onSkipWord,
  onNext,
  onPlayAudio
}: Props) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [peekEnglish, setPeekEnglish] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [browserSupport, setBrowserSupport] = useState(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Reset state khi đổi câu
    setIsListening(false);
    setTranscript('');
    setScore(null);
    setHasEvaluated(false);
    setPeekEnglish(false);
    setIsSkipping(false);

    // Khởi tạo Web Speech Recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript || '';
          setTranscript(text);
          evaluateTranscript(text);
        };

        recognition.onerror = (e: any) => {
          console.warn("Speech recognition error:", e);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setBrowserSupport(false);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, [currentWord]);

  const startListening = () => {
    if (!recognitionRef.current) {
      alert("Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói trực tiếp. Hãy dùng Google Chrome hoặc Microsoft Edge.");
      return;
    }
    setTranscript('');
    setScore(null);
    setHasEvaluated(false);
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.warn("Speech start warning:", e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setIsListening(false);
  };

  const evaluateTranscript = (spokenText: string) => {
    const accuracy = calculateSpeechAccuracy(spokenText, currentWord.word);
    setScore(accuracy);
    setHasEvaluated(true);
    const isPass = accuracy >= 75;
    onAnswer(isPass, accuracy);
  };

  // Nút "Bỏ qua từ mới" (Skip): Phát âm mẫu 2 lần, không trừ điểm, đưa vào hàng đợi ôn lại
  const handleSkip = () => {
    setIsSkipping(true);
    if (onPlayAudio) {
      onPlayAudio(currentWord.word);
      // Phát lại lần 2 sau 1.2s để học viên nghe rõ
      setTimeout(() => {
        onPlayAudio(currentWord.word);
      }, 1300);
    }
    onSkipWord(currentWord);
  };

  return (
    <div className="flex flex-col items-center w-full space-y-6">
      {/* Question Card */}
      <div className="w-full p-6 rounded-3xl bg-amber-50/50 dark:bg-neutral-800/60 border-2 border-primary/20 text-center relative shadow-sm">
        <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
          Luyện Phát Âm • Speaking Reflex Drill
        </span>

        {/* Word Display with Peek Option */}
        <div className="mt-4 mb-2">
          <p className="text-xs font-bold text-accent/60 dark:text-neutral-400 mb-1">
            Nghĩa tiếng Việt:
          </p>
          <h3 className="text-xl sm:text-2xl font-display font-black text-accent dark:text-amber-100">
            "{currentWord.meaning}"
          </h3>

          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-xs font-bold text-accent/70 dark:text-neutral-300">
              Từ tiếng Anh:
            </span>
            <button
              type="button"
              onClick={() => setPeekEnglish(!peekEnglish)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              {peekEnglish ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span className="font-mono text-base font-black">{currentWord.word}</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Bấm để xem từ gợi ý</span>
                </>
              )}
            </button>
          </div>

          {currentWord.phonetic && (
            <p className="text-xs font-mono text-accent/50 dark:text-neutral-400 mt-1">
              Phát âm: {currentWord.phonetic}
            </p>
          )}
        </div>

        {/* Native Audio Sample Button */}
        {onPlayAudio && (
          <button
            type="button"
            onClick={() => onPlayAudio(currentWord.word)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-white dark:bg-neutral-700 px-3 py-1.5 rounded-full border border-primary/20 shadow-xs hover:bg-primary hover:text-white transition-all cursor-pointer mt-2"
          >
            <Headphones className="w-3.5 h-3.5 shrink-0" />
            <span>Nghe mẫu chuẩn bản xứ</span>
          </button>
        )}
      </div>

      {/* Center Interactive Microphone Button */}
      <div className="flex flex-col items-center justify-center my-2 relative">
        {/* Ripple Waves when recording */}
        {isListening && (
          <motion.div
            className="absolute w-28 h-28 rounded-full bg-primary/20 -z-10"
            animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          disabled={isSkipping}
          className={`w-20 h-20 min-w-[80px] min-h-[80px] rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer touch-manipulation active:scale-95 ${
            isListening 
              ? 'bg-rose-500 text-white ring-8 ring-rose-200 animate-pulse' 
              : 'bg-primary text-white hover:bg-primary-dark hover:scale-105'
          }`}
          aria-label={isListening ? "Dừng ghi âm" : "Bắt đầu đọc"}
        >
          {isListening ? (
            <MicOff className="w-8 h-8 animate-bounce" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>

        <p className="text-xs font-bold text-accent/70 dark:text-neutral-300 mt-3">
          {isListening ? "Đang lắng nghe... Hãy đọc to rõ từ tiếng Anh!" : "Chạm vào Micro để đọc từ này"}
        </p>

        {transcript && (
          <div className="mt-2 text-xs font-mono bg-secondary/60 dark:bg-neutral-700 px-3 py-1 rounded-full text-accent/80">
            Giọng nói nhận diện: "<strong>{transcript}</strong>"
          </div>
        )}
      </div>

      {/* Pronunciation Score Feedback Gauge */}
      {hasEvaluated && score !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full p-4 rounded-2xl border-2 text-center space-y-2 ${
            score >= 75
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-100'
              : score >= 50
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-950 dark:text-amber-100'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-950 dark:text-rose-100'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {score >= 75 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <span className="text-base font-black">
              Độ chính xác phát âm: {score}%
            </span>
          </div>

          <p className="text-xs font-semibold leading-relaxed">
            {score >= 85
              ? "Tuyệt vời! Phát âm chuẩn âm tiết và trọng âm phong cách Band 8.0!"
              : score >= 70
              ? "Khá tốt! Hãy chú ý phát âm rõ hơn các phụ âm đuôi (/s/, /t/, /d/)."
              : `Gần đúng! Từ chuẩn là "${currentWord.word}". Hãy nghe lại audio mẫu và thử lại nhé!`}
          </p>

          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={startListening}
              className="min-h-[40px] px-4 py-1.5 rounded-full border border-current text-xs font-bold hover:bg-black/5 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đọc lại</span>
            </button>
            <button
              type="button"
              onClick={onNext}
              className="min-h-[40px] bg-primary text-white px-6 py-1.5 rounded-full text-xs font-bold shadow-md hover:bg-primary-dark flex items-center gap-1.5 cursor-pointer"
            >
              <span>Tiếp tục</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Skip Word (Bỏ qua từ mới) Panel */}
      <div className="w-full flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
        <button
          type="button"
          onClick={handleSkip}
          disabled={isSkipping}
          className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-accent/60 hover:text-accent hover:bg-amber-100/60 dark:hover:bg-neutral-800 transition-all flex items-center gap-2 cursor-pointer touch-manipulation active:scale-95"
          title="Bỏ qua từ này để nghe phát âm mẫu và ôn lại ở cuối buổi"
        >
          <SkipForward className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Bỏ qua từ mới (Sẽ ôn lại cuối buổi)</span>
        </button>

        {isSkipping && (
          <span className="text-xs font-bold text-amber-700 animate-pulse flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Đang phát âm mẫu...</span>
          </span>
        )}
      </div>
    </div>
  );
}
