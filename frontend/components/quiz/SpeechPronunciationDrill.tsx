"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  SkipForward, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RotateCcw, 
  Eye, 
  EyeOff,
  Headphones,
  Sparkles,
  Radio
} from 'lucide-react';

interface VocabItem {
  id?: number;
  word: string;
  meaning: string;
  phonetic?: string;
  audio_url?: string;
  example?: string;
  memory_hook?: string;
}

interface Props {
  currentWord: VocabItem;
  onAnswer: (isCorrect: boolean, score: number, transcript?: string) => void;
  onSkipWord: (word: VocabItem) => void;
  onNext: () => void;
  onPlayAudio?: (word: string, audioUrl?: string) => void;
}

// Chuẩn hóa token: loại bỏ dấu câu, chỉ giữ chữ cái và số
function cleanToken(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Thuật toán Levenshtein Distance đo khoảng cách ký tự
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

// Danh sách từ đệm thường gặp khi học viên mở đầu phát âm
const FILLER_WORDS = new Set([
  'the', 'a', 'an', 'is', 'it', 'to', 'in', 'of', 'word', 'say', 
  'said', 'this', 'that', 'uh', 'um', 'ah', 'please', 'my', 'read'
]);

// Chấm điểm độ tương đồng giữa một từ nói và từ mục tiêu
function scoreWordMatch(spokenWord: string, targetWord: string): number {
  const s = cleanToken(spokenWord);
  const t = cleanToken(targetWord);
  if (!s || !t) return 0;
  if (s === t) return 100;

  // Biến thể ngữ pháp thường gặp: số nhiều (-s, -es), quá khứ (-ed), tiếp diễn (-ing), trạng từ (-ly)
  if (
    s === t + 's' || s === t + 'es' ||
    s === t + 'ed' || s === t + 'ing' ||
    s === t + 'ly' || (t.endsWith('e') && s === t.slice(0, -1) + 'ing') ||
    (t.endsWith('y') && s === t.slice(0, -1) + 'ies')
  ) {
    return 95;
  }
  if (t === s + 's' || t === s + 'es' || t === s + 'ed') {
    return 90;
  }

  // So sánh khoảng cách ký tự Levenshtein
  const dist = levenshteinDistance(s, t);
  const maxLen = Math.max(s.length, t.length);
  const sim = Math.max(0, 1 - dist / maxLen);

  if (sim >= 0.85) return Math.round(sim * 100);
  if (sim >= 0.70) return Math.round(sim * 95);
  if (sim >= 0.50) return Math.round(sim * 85);
  return Math.max(15, Math.round(sim * 70));
}

// Đánh giá phát âm đa tầng (Multi-candidate Evaluation):
// 1. Toàn chuỗi
// 2. Từng token đơn lẻ
// 3. Chuỗi ghép liền không khoảng trắng (cho từ đa âm tiết bị ngắt như "sus tain able")
// 4. Chuỗi sau khi lọc bỏ từ đệm (filler words)
// 5. Toàn bộ danh sách candidate alternatives do trình duyệt cung cấp
function evaluateSpeechUtterance(
  spokenText: string, 
  target: string, 
  alternatives?: string[]
): { accuracy: number; bestTranscript: string } {
  const targetClean = cleanToken(target);
  let bestAccuracy = 0;
  let bestTrans = (spokenText || '').trim();

  const allPhrases = new Set<string>();
  if (spokenText) allPhrases.add(spokenText.trim());
  if (alternatives && alternatives.length > 0) {
    for (const alt of alternatives) {
      if (alt && alt.trim()) allPhrases.add(alt.trim());
    }
  }

  for (const phrase of Array.from(allPhrases)) {
    if (!phrase) continue;

    // 1. So khớp toàn chuỗi
    const wholeAcc = scoreWordMatch(phrase, targetClean);
    if (wholeAcc > bestAccuracy) {
      bestAccuracy = wholeAcc;
      bestTrans = phrase.trim();
    }

    // 2. So khớp chuỗi ghép liền (bỏ toàn bộ khoảng trắng)
    const squashed = phrase.replace(/\s+/g, '');
    const squashedAcc = scoreWordMatch(squashed, targetClean);
    if (squashedAcc > bestAccuracy) {
      bestAccuracy = squashedAcc;
      bestTrans = phrase.trim();
    }

    // 3. Tách từng từ đơn lẻ và loại bỏ từ đệm
    const tokens = phrase.split(/\s+/).map(cleanToken).filter(Boolean);
    const nonFillers = tokens.filter(t => !FILLER_WORDS.has(t));
    const tokenCandidates = nonFillers.length > 0 ? nonFillers : tokens;

    for (const tok of tokenCandidates) {
      const tokAcc = scoreWordMatch(tok, targetClean);
      if (tokAcc > bestAccuracy) {
        bestAccuracy = tokAcc;
        bestTrans = tok;
      }
      if (bestAccuracy === 100) break;
    }

    if (bestAccuracy === 100) break;
  }

  return { accuracy: bestAccuracy, bestTranscript: bestTrans || spokenText };
}

export default function SpeechPronunciationDrill({
  currentWord,
  onAnswer,
  onSkipWord,
  onNext,
  onPlayAudio
}: Props) {
  const [isListening, setIsListening] = useState(false);
  const [liveInterim, setLiveInterim] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [peekEnglish, setPeekEnglish] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);

  // Lưu trữ các callback vào Ref để tránh re-render phụ thuộc làm reset SpeechRecognition
  const onAnswerRef = useRef(onAnswer);
  onAnswerRef.current = onAnswer;

  const onSkipWordRef = useRef(onSkipWord);
  onSkipWordRef.current = onSkipWord;

  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;

  const onPlayAudioRef = useRef(onPlayAudio);
  onPlayAudioRef.current = onPlayAudio;

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const latestTranscriptRef = useRef('');
  const candidateAlternativesRef = useRef<string[]>([]);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const skipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const manualStopRef = useRef(false);
  const isEvaluatedRef = useRef(false);

  // Đánh giá và chốt điểm cho từ hiện tại
  const commitEvaluation = useCallback(() => {
    if (isEvaluatedRef.current) return;
    
    const candidateText = latestTranscriptRef.current.trim();
    if (!candidateText) {
      setSpeechNotice("Chưa nhận được giọng nói rõ ràng. Bạn hãy bấm Micro và đọc to lại nhé!");
      return;
    }

    isEvaluatedRef.current = true;
    setLiveInterim('');
    setSpeechNotice(null);

    const { accuracy, bestTranscript } = evaluateSpeechUtterance(
      candidateText, 
      currentWord.word, 
      candidateAlternativesRef.current
    );

    setFinalTranscript(bestTranscript || candidateText);
    setScore(accuracy);
    setHasEvaluated(true);

    const isPass = accuracy >= 70;
    onAnswerRef.current(isPass, accuracy, bestTranscript || candidateText);
  }, [currentWord.word]);

  // Dừng nhận diện và chấm điểm
  const stopListeningAndEvaluate = useCallback(() => {
    manualStopRef.current = true;
    isListeningRef.current = false;
    setIsListening(false);

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop error
      }
    }

    commitEvaluation();
  }, [commitEvaluation]);

  // Bắt đầu lắng nghe
  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt chưa hỗ trợ Web Speech API. Vui lòng sử dụng Google Chrome hoặc Microsoft Edge.");
      return;
    }

    // Reset các trạng thái của lượt đọc mới
    setLiveInterim('');
    setFinalTranscript('');
    setScore(null);
    setHasEvaluated(false);
    setSpeechNotice(null);
    latestTranscriptRef.current = '';
    candidateAlternativesRef.current = [];
    manualStopRef.current = false;
    isEvaluatedRef.current = false;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Nếu recognition đang chạy thì dừng trước khi tạo phiên mới
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;       // Giữ mic liên tục, không tự ngắt sau 1 từ
      recognition.interimResults = true;   // Bắt từng âm tiết realtime
      recognition.maxAlternatives = 5;     // Lấy 5 biến thể âm học tốt nhất
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
        setSpeechNotice("Đang lắng nghe... Hãy đọc to từ tiếng Anh!");
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';
        const alternatives: string[] = [];

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalText += ' ' + res[0].transcript;
          } else {
            interimText += ' ' + res[0].transcript;
          }
          for (let k = 0; k < res.length; ++k) {
            if (res[k]?.transcript) {
              alternatives.push(res[k].transcript.trim());
            }
          }
        }

        const heardSoFar = (finalText || interimText).trim();
        if (heardSoFar) {
          latestTranscriptRef.current = heardSoFar;
          setLiveInterim(heardSoFar);
          setSpeechNotice(null);
        }

        if (alternatives.length > 0) {
          candidateAlternativesRef.current = Array.from(
            new Set([...candidateAlternativesRef.current, ...alternatives])
          );
        }

        // Tự động chốt kết quả và chấm điểm sau 1.4s im lặng khi học viên đã nói
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        silenceTimerRef.current = setTimeout(() => {
          if (isListeningRef.current && latestTranscriptRef.current.trim()) {
            stopListeningAndEvaluate();
          }
        }, 1400);
      };

      recognition.onerror = (e: any) => {
        // Lỗi aborted là do stop hoặc unmount, không coi là lỗi
        if (e.error === 'aborted') {
          return;
        }

        if (e.error === 'no-speech') {
          setSpeechNotice("Chưa nhận được âm thanh. Hãy nói to, rõ ràng vào Micro nhé!");
          return;
        }

        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setSpeechNotice("Trình duyệt chưa được cấp quyền Micro. Vui lòng bấm vào icon ổ khóa trên thanh địa chỉ để Cho phép (Allow) Micro.");
          setIsListening(false);
          isListeningRef.current = false;
          return;
        }

        if (e.error === 'network') {
          setSpeechNotice("Web Speech API cần kết nối mạng để nhận diện giọng nói tiếng Anh.");
          setIsListening(false);
          isListeningRef.current = false;
          return;
        }

        console.warn("Speech recognition notice:", e.error);
      };

      recognition.onend = () => {
        // Nếu kết thúc tự nhiên và học viên đã nói nhưng chưa được evaluate -> Chấm điểm ngay!
        if (!manualStopRef.current && !isEvaluatedRef.current && latestTranscriptRef.current.trim()) {
          commitEvaluation();
        }
        isListeningRef.current = false;
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn("Speech start exception:", err);
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, [commitEvaluation, stopListeningAndEvaluate]);

  // Reset toàn bộ state khi đổi sang từ mới
  useEffect(() => {
    setIsListening(false);
    isListeningRef.current = false;
    setLiveInterim('');
    setFinalTranscript('');
    setScore(null);
    setHasEvaluated(false);
    setPeekEnglish(false);
    setIsSkipping(false);
    setSpeechNotice(null);
    latestTranscriptRef.current = '';
    candidateAlternativesRef.current = [];
    isEvaluatedRef.current = false;
    manualStopRef.current = false;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (skipTimerRef.current) {
      clearTimeout(skipTimerRef.current);
      skipTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, [currentWord.word]);

  // Nút "Bỏ qua từ mới" (Skip): Phát âm mẫu chuẩn bản xứ và chuyển mượt mà sau 1.5s
  const handleSkip = () => {
    setIsSkipping(true);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (skipTimerRef.current) clearTimeout(skipTimerRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    setIsListening(false);

    if (onPlayAudioRef.current) {
      onPlayAudioRef.current(currentWord.word, currentWord.audio_url);
    }

    skipTimerRef.current = setTimeout(() => {
      onSkipWordRef.current(currentWord);
    }, 1500);
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
                  <span className="font-mono text-base font-black text-emerald-800 dark:text-emerald-400">{currentWord.word}</span>
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
            <p className="text-xs font-mono text-stone-500 mt-1">
              Phát âm chuẩn: {currentWord.phonetic}
            </p>
          )}
        </div>

        {/* Native Audio Sample Button */}
        {onPlayAudio && (
          <button
            type="button"
            onClick={() => onPlayAudio(currentWord.word, currentWord.audio_url)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A7C39] bg-white px-3.5 py-1.5 rounded-full border border-[#A7D08C]/40 shadow-xs hover:bg-[#4A7C39] hover:text-white transition-colors cursor-pointer mt-2"
          >
            <Headphones className="w-3.5 h-3.5 shrink-0" />
            <span>Nghe mẫu chuẩn bản xứ</span>
          </button>
        )}
      </div>

      {/* Center Interactive Microphone Button */}
      <div className="flex flex-col items-center justify-center my-2 relative w-full">
        {/* Ripple Waves when recording */}
        {isListening && (
          <div className="absolute flex items-center justify-center pointer-events-none">
            <motion.div
              className="w-28 h-28 rounded-full bg-rose-400/30"
              animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0.1, 0.8] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute w-36 h-36 rounded-full bg-rose-300/20"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={isListening ? stopListeningAndEvaluate : startListening}
          disabled={isSkipping}
          className={`w-20 h-20 min-w-[80px] min-h-[80px] rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer touch-manipulation active:scale-95 ${
            isListening 
              ? 'bg-rose-500 text-white ring-8 ring-rose-200 shadow-rose-300' 
              : 'bg-[#4A7C39] text-white hover:bg-[#3B642D] shadow-[#A7D08C]/50'
          }`}
          aria-label={isListening ? "Dừng và chấm điểm" : "Bắt đầu đọc"}
        >
          {isListening ? (
            <MicOff className="w-8 h-8 animate-pulse text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}
        </button>

        <p className="text-xs font-bold text-stone-600 mt-3 text-center">
          {isListening 
            ? "Đang lắng nghe... Hãy đọc to rõ từ tiếng Anh! (Chạm để chốt đáp án)" 
            : "Chạm vào Micro để đọc từ này"}
        </p>

        {/* Thông báo hướng dẫn / Gợi ý mic */}
        {speechNotice && (
          <div className="mt-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-4 py-1.5 rounded-full shadow-xs text-center max-w-md animate-fade-in">
            {speechNotice}
          </div>
        )}

        {/* Real-time Live Interim Voice Badge */}
        {isListening && liveInterim && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3 text-sm font-mono bg-emerald-50 border-2 border-emerald-400 px-5 py-2 rounded-full text-emerald-900 flex items-center gap-2.5 shadow-sm"
          >
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>Đang nghe: "<strong>{liveInterim}</strong>"</span>
          </motion.div>
        )}

        {/* Final Evaluated Transcript */}
        {!isListening && finalTranscript && (
          <div className="mt-3 text-xs font-mono bg-stone-100 border border-stone-300 px-4 py-1.5 rounded-full text-stone-800 shadow-xs flex items-center gap-2">
            <span className="font-bold text-stone-500">Giọng nói nhận diện:</span>
            <span className="font-black text-[#2E3E2B]">"{finalTranscript}"</span>
          </div>
        )}
      </div>

      {/* Pronunciation Score Feedback Gauge */}
      {hasEvaluated && score !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full p-5 rounded-3xl border-2 text-center space-y-3 shadow-sm ${
            score >= 70
              ? 'bg-[#DCFCE7] border-[#22C55E] text-[#14532D]'
              : score >= 50
              ? 'bg-amber-50 border-amber-400 text-amber-950'
              : 'bg-[#FEE2E2] border-[#EF4444] text-[#991B1B]'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {score >= 70 ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
            )}
            <span className="text-lg font-black tracking-wide">
              Độ chính xác phát âm: {score}%
            </span>
          </div>

          <p className="text-xs sm:text-sm font-semibold leading-relaxed max-w-lg mx-auto">
            {score >= 85
              ? "Tuyệt vời! Phát âm cực chuẩn âm tiết và trọng âm phong cách Band 8.0!"
              : score >= 70
              ? "Đạt chuẩn! Âm thanh rõ ràng, hãy duy trì ngữ điệu và bật rõ phụ âm cuối."
              : score >= 50
              ? `Khá tốt nhưng còn chệch âm tiết! Bạn đã nói "${finalTranscript}" (từ mục tiêu: "${currentWord.word}"). Hãy nghe lại mẫu chuẩn nhé!`
              : `Chưa chuẩn xác! Máy nghe thành "${finalTranscript || 'âm thanh chưa rõ'}" (từ mục tiêu: "${currentWord.word}"). Hãy bấm nghe lại mẫu chuẩn và luyện lại nhé!`}
          </p>

          {/* Bảng so sánh âm vị chi tiết */}
          <div className="bg-white/80 dark:bg-neutral-900/40 p-3 rounded-2xl border border-current/20 flex flex-wrap items-center justify-around gap-2 text-xs">
            <div>
              <span className="text-stone-500 font-bold block text-[10px] uppercase">Bạn đã phát âm</span>
              <span className="font-mono font-black text-sm text-[#2E3E2B] dark:text-stone-100">
                "{finalTranscript || 'Chưa rõ'}"
              </span>
            </div>
            <div className="h-6 w-px bg-current/20 hidden sm:block" />
            <div>
              <span className="text-stone-500 font-bold block text-[10px] uppercase">Từ mục tiêu</span>
              <span className="font-mono font-black text-sm text-[#15803D]">
                "{currentWord.word}"
              </span>
            </div>
            {currentWord.phonetic && (
              <>
                <div className="h-6 w-px bg-current/20 hidden sm:block" />
                <div>
                  <span className="text-stone-500 font-bold block text-[10px] uppercase">Phiên âm IPA</span>
                  <span className="font-mono font-semibold text-xs text-stone-600">
                    {currentWord.phonetic}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={startListening}
              className="min-h-[42px] px-5 py-2 rounded-full border border-current text-xs font-bold hover:bg-black/5 flex items-center gap-2 cursor-pointer transition-colors shadow-xs active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Đọc lại</span>
            </button>
            {onPlayAudio && (
              <button
                type="button"
                onClick={() => onPlayAudio(currentWord.word, currentWord.audio_url)}
                className="min-h-[42px] px-4 py-2 rounded-full bg-white border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 flex items-center gap-2 cursor-pointer transition-colors shadow-xs active:scale-95"
              >
                <Volume2 className="w-4 h-4 text-[#4A7C39]" />
                <span>Nghe mẫu</span>
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              className="min-h-[42px] bg-[#4A7C39] text-white px-7 py-2 rounded-full text-xs font-black shadow-md hover:bg-[#3B642D] flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <span>Tiếp tục</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Skip Word (Bỏ qua từ mới) Panel */}
      <div className="w-full flex items-center justify-between pt-2 border-t border-stone-200">
        <button
          type="button"
          onClick={handleSkip}
          disabled={isSkipping}
          className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-[#2E3E2B] hover:bg-stone-100 transition-colors flex items-center gap-2 cursor-pointer touch-manipulation active:scale-95"
          title="Bỏ qua từ này để nghe phát âm mẫu và ôn lại ở cuối buổi"
        >
          <SkipForward className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Bỏ qua từ mới (Sẽ ôn lại cuối buổi)</span>
        </button>

        {isSkipping && (
          <span className="text-xs font-bold text-amber-700 animate-pulse flex items-center gap-1.5">
            <Volume2 className="w-4 h-4" />
            <span>Đang phát âm mẫu...</span>
          </span>
        )}
      </div>
    </div>
  );
}
