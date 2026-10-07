"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  Layers, 
  Brain, 
  Languages, 
  X, 
  SkipForward, 
  CheckCircle2, 
  AlertCircle, 
  GraduationCap, 
  Target, 
  Lightbulb, 
  Sparkles, 
  ArrowRight, 
  Loader2,
  BookOpen,
  Mic,
  FolderOpen,
  RotateCcw
} from 'lucide-react';

import TextbookSentenceMatching from './quiz/TextbookSentenceMatching';
import SpeechPronunciationDrill from './quiz/SpeechPronunciationDrill';
import GrammarMasteryLab from './grammar/GrammarMasteryLab';

const API_URL = '/api';

interface VocabItem {
  id?: number;
  word: string;
  meaning: string;
  phonetic?: string;
  image_url?: string;
  example?: string;
  memory_hook?: string;
  topic?: string;
  mastery_level?: number;
}

type QuizType = 'textbook' | 'speech' | 'classic_vocab' | 'grammar_sanctuary' | 'srs';
type ClassicMode = 'ABCD' | 'FILL_IN';

const playAudio = async (word: string) => {
  try {
    const res = await fetch(`${API_URL}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word }),
    });
    const data = await res.json();
    if (data.audio_url) {
      const audio = new Audio(data.audio_url);
      audio.play();
    }
  } catch (err) { console.error("TTS error:", err); }
};

interface Props {
  vocabList: VocabItem[];
  initialTopic?: string | null;
  initialWordList?: VocabItem[] | null;
  onClose: () => void;
  onReview: (id: number, isCorrect: boolean) => Promise<void>;
}

export default function VocabularyQuiz({ 
  vocabList, 
  initialTopic = null,
  initialWordList = null,
  onClose, 
  onReview 
}: Props) {
  // Topic Filter State in Quiz
  const [selectedTopic, setSelectedTopic] = useState<string | null>(initialTopic);
  
  // Available topics derived from vocabList
  const availableTopics = useMemo(() => {
    const topicsMap = new Map<string, number>();
    for (const v of vocabList) {
      const t = (v.topic || 'General').trim();
      topicsMap.set(t, (topicsMap.get(t) || 0) + 1);
    }
    return Array.from(topicsMap.entries());
  }, [vocabList]);

  // Current active word list for the quiz
  const activeVocabList = useMemo(() => {
    if (!selectedTopic || selectedTopic === 'All') {
      return vocabList;
    }
    const tLower = selectedTopic.toLowerCase();
    return vocabList.filter(v => {
      const vTopic = (v.topic || '').toLowerCase();
      const vMeaning = (v.meaning || '').toLowerCase();
      if (tLower === 'awl') return vTopic.includes('awl') || vTopic.includes('academic');
      if (tLower === 'tech') return vTopic.includes('tech') || vMeaning.includes('công nghệ');
      if (tLower === 'health') return vTopic.includes('health') || vMeaning.includes('sức khỏe');
      if (tLower === 'economy') return vTopic.includes('econom') || vMeaning.includes('kinh tế');
      if (tLower === 'environment') return vTopic.includes('environ') || vMeaning.includes('môi trường');
      if (tLower === 'education') return vTopic.includes('educat') || vMeaning.includes('giáo dục');
      if (tLower === 'society') return vTopic.includes('societ') || vMeaning.includes('xã hội');
      return vTopic.includes(tLower);
    });
  }, [vocabList, selectedTopic]);

  const [quizType, setQuizType] = useState<QuizType | null>(null);
  const [srsQuestions, setSrsQuestions] = useState<any[]>([]);
  const [isLoadingSRS, setIsLoadingSRS] = useState(false);
  
  // Question tracking & Shuffled list
  const [shuffledQuestions, setShuffledQuestions] = useState<VocabItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Retry Queue for skipped words in Speech drill
  const [retryQueue, setRetryQueue] = useState<VocabItem[]>([]);
  const [isDoingRetryRound, setIsDoingRetryRound] = useState(false);

  // Classic Vocab Mode state
  const [classicMode, setClassicMode] = useState<ClassicMode>('ABCD');
  const [classicOptions, setClassicOptions] = useState<string[]>([]);
  const [userInput, setUserInput] = useState('');

  // Initialize questions when quiz starts
  const startQuizWithQuestions = (type: QuizType) => {
    if (type === 'grammar_sanctuary') {
      setQuizType('grammar_sanctuary');
      return;
    }

    if (type === 'srs') {
      setQuizType('srs');
      fetchSRSQuestions();
      return;
    }

    if (activeVocabList.length < 3) {
      alert(`Chủ đề này chỉ có ${activeVocabList.length} từ. Vui lòng chọn "Tất cả từ" hoặc thêm từ vựng để ôn tập!`);
      return;
    }

    const shuffled = [...activeVocabList].sort(() => Math.random() - 0.5);
    setShuffledQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setFeedback(null);
    setRetryQueue([]);
    setIsDoingRetryRound(false);
    setQuizType(type);
  };

  const activeQuestions = quizType === 'srs' ? srsQuestions : shuffledQuestions;

  // Setup Classic ABCD or Fill-in options
  useEffect(() => {
    if (quizType === 'classic_vocab' && activeQuestions.length > 0 && !isFinished && feedback === null) {
      const nextMode: ClassicMode = Math.random() > 0.5 ? 'ABCD' : 'FILL_IN';
      setClassicMode(nextMode);

      const current = activeQuestions[currentIndex];
      if (current) {
        const others = activeQuestions.filter(v => v.word !== current.word);
        const shuffledOthers = [...others].sort(() => 0.5 - Math.random()).slice(0, 3);
        const newOptions = [...shuffledOthers.map(v => v.meaning), current.meaning].sort(() => 0.5 - Math.random());
        setClassicOptions(newOptions);
      }
      setUserInput('');
    }
  }, [currentIndex, activeQuestions, isFinished, quizType, feedback]);

  const fetchSRSQuestions = async () => {
    setIsLoadingSRS(true);
    try {
      const sortedByWeakness = [...vocabList].sort((a: any, b: any) => {
        const levelA = a.mastery_level !== undefined ? a.mastery_level : 0;
        const levelB = b.mastery_level !== undefined ? b.mastery_level : 0;
        return levelA - levelB;
      });

      const topWeak = sortedByWeakness.slice(0, 15).sort(() => Math.random() - 0.5).slice(0, 8);
      const words = topWeak.map(v => v.word);

      let userBand = 6.5;
      try {
        const savedUser = localStorage.getItem("oasis_user");
        if (savedUser) {
          const u = JSON.parse(savedUser);
          if (u.target_band) userBand = parseFloat(u.target_band) || 6.5;
        }
      } catch (e) {}

      const grammarPool = [
        "Past Simple vs Past Perfect in Task 1",
        "Definite article 'the' with proportions",
        "Zero article with abstract nouns in Task 2",
        "Future projections (is projected to reach)",
        "Subject-verb agreement in complex sentences"
      ];
      const shuffledGrammar = [...grammarPool].sort(() => Math.random() - 0.5).slice(0, 3);

      const res = await fetch(`${API_URL}/skills/spaced-repetition-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weak_words: words.length > 0 ? words : ["mitigate", "profound", "facilitate", "resilient", "sustainable"],
          weak_grammar_points: shuffledGrammar,
          target_band: userBand,
          count: 5
        })
      });

      if (res.ok) {
        const data = await res.json();
        const items = data.quiz_items || data.items || [];
        setSrsQuestions(items);
        setCurrentIndex(0);
      } else {
        alert("Không thể tạo bài tập ôn tập SRS.");
        setQuizType(null);
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối máy chủ.");
      setQuizType(null);
    } finally {
      setIsLoadingSRS(false);
    }
  };

  const normalizeWord = (str: string) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/\s*\((n|v|adj|adv|prep|conj|pron|phr|idiom|slang|phrase)\b[^)]*\)/gi, '')
      .replace(/[\/\\()]/g, ' ')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const cleanOptionText = (text: string) => {
    if (!text) return '';
    return text
      .replace(/^\[[a-d]\]\s*/i, '')
      .replace(/^[a-d][.)]\s*/i, '')
      .trim();
  };

  const handleNextQuestion = () => {
    setFeedback(null);
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Check if there are skipped words in retryQueue
      if (retryQueue.length > 0 && !isDoingRetryRound) {
        setIsDoingRetryRound(true);
        setShuffledQuestions([...retryQueue]);
        setRetryQueue([]);
        setCurrentIndex(0);
      } else {
        setIsFinished(true);
      }
    }
  };

  // Skip in Speech Mode
  const handleSkipWord = (word: VocabItem) => {
    setRetryQueue(prev => [...prev, word]);
    handleNextQuestion();
  };

  // Answer handler for Classic Vocab & SRS
  const handleAnswerClassic = async (answer: string) => {
    if (feedback !== null) return;
    const current = activeQuestions[currentIndex];
    
    let isCorrect = false;
    if (quizType === 'classic_vocab') {
      if (classicMode === 'ABCD') {
        isCorrect = answer === current.meaning;
      } else {
        const cleanUser = normalizeWord(answer);
        const cleanCorrect = normalizeWord(current.word);
        isCorrect = cleanUser === cleanCorrect ||
          answer.toLowerCase().trim() === current.word.toLowerCase().trim() ||
          (cleanCorrect.length > 2 && cleanUser === cleanCorrect.split(' ')[0]);
      }
    } else {
      const cleanAnswer = cleanOptionText(answer).toLowerCase();
      const cleanCorrect = cleanOptionText(current.correct_answer || '').toLowerCase();
      isCorrect = cleanAnswer === cleanCorrect ||
        (cleanCorrect.length > 2 && (cleanAnswer.includes(cleanCorrect) || cleanCorrect.includes(cleanAnswer)));
    }

    if (isCorrect) {
      setFeedback('correct');
      setScore(score + 1);
    } else {
      setFeedback('wrong');
    }

    if (current.id) {
      onReview(current.id, isCorrect);
    }
  };

  // ==========================================
  // 1. SELECTION SCREEN (QUIZ SETUP BENTO MODAL)
  // ==========================================
  if (quizType === null) {
    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl shadow-2xl max-w-xl w-full relative overflow-hidden border-2 border-primary/20 text-center flex flex-col items-center max-h-[90vh] overflow-y-auto custom-scrollbar">
          
          <button 
            type="button" 
            onClick={onClose} 
            className="absolute top-5 right-5 text-accent/40 hover:text-accent p-2 rounded-full hover:bg-black/5 dark:hover:bg-neutral-800 transition-all cursor-pointer touch-manipulation active:scale-95" 
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary">
            <GraduationCap className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-display font-black text-accent dark:text-amber-100 mb-1">
            Matcha Quiz & Sanctuary
          </h3>
          <p className="text-xs text-accent/60 dark:text-neutral-400 mb-5 max-w-sm">
            Nâng tầm từ vựng và ngữ pháp IELTS với 3 chế độ kiểm tra chuyên sâu cùng Mascot Mát Cha!
          </p>

          {/* Topic Scope Selector */}
          <div className="w-full bg-secondary/40 dark:bg-neutral-800/60 p-3.5 rounded-2xl border border-primary/10 mb-6 text-left">
            <div className="flex items-center justify-between text-xs font-bold text-accent/70 dark:text-neutral-300 mb-2">
              <span className="flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-primary" />
                <span>Chọn phạm vi từ vựng ôn tập:</span>
              </span>
              <span className="text-primary font-black text-[11px]">
                {activeVocabList.length} từ khả dụng
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedTopic(null)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  !selectedTopic || selectedTopic === 'All'
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-white dark:bg-neutral-700 text-accent dark:text-neutral-200 border-primary/10 hover:border-primary/40'
                }`}
              >
                🌿 Tất cả ({vocabList.length} từ)
              </button>

              {availableTopics.map(([t, count]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTopic(t)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                    selectedTopic?.toLowerCase() === t.toLowerCase()
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-white dark:bg-neutral-700 text-accent dark:text-neutral-200 border-primary/10 hover:border-primary/40'
                  }`}
                >
                  {t} ({count})
                </button>
              ))}
            </div>
          </div>

          {/* 5 Distinct Mode Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            
            {/* Mode 1: Textbook Context Matching */}
            <button
              type="button"
              onClick={() => startQuizWithQuestions('textbook')}
              className="p-4 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 dark:bg-neutral-800 border-2 border-primary/20 hover:border-primary text-left transition-all hover:scale-[1.01] active:scale-95 shadow-sm cursor-pointer group flex flex-col justify-between min-h-[105px]"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-accent dark:text-amber-100 uppercase tracking-wider">
                    1. Nối Câu Sách Giáo Khoa
                  </h4>
                  <span className="text-[10px] font-bold text-primary">Cambridge Context</span>
                </div>
              </div>
              <p className="text-[11px] text-accent/70 dark:text-neutral-400 leading-snug">
                Nối từ với câu dịch nghĩa chuẩn xác trong 3 câu ngữ cảnh học thuật.
              </p>
            </button>

            {/* Mode 2: Speech Pronunciation Drill */}
            <button
              type="button"
              onClick={() => startQuizWithQuestions('speech')}
              className="p-4 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 dark:bg-neutral-800 border-2 border-emerald-300 dark:border-emerald-800 text-left transition-all hover:scale-[1.01] active:scale-95 shadow-sm cursor-pointer group flex flex-col justify-between min-h-[105px]"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-accent dark:text-amber-100 uppercase tracking-wider">
                    2. Luyện Đọc & Chấm Điểm Mic
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700">Speaking Reflex 0-100%</span>
                </div>
              </div>
              <p className="text-[11px] text-accent/70 dark:text-neutral-400 leading-snug">
                Đọc to từ vào Micro, chấm điểm tức thì và có nút bỏ qua từ mới.
              </p>
            </button>

            {/* Mode 3: Enhanced Classic Vocab ABCD & Cloze */}
            <button
              type="button"
              onClick={() => startQuizWithQuestions('classic_vocab')}
              className="p-4 rounded-2xl bg-white hover:bg-secondary/40 dark:bg-neutral-800 border-2 border-primary/20 text-left transition-all hover:scale-[1.01] active:scale-95 shadow-sm cursor-pointer group flex flex-col justify-between min-h-[105px]"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent dark:text-neutral-200 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-accent dark:text-amber-100 uppercase tracking-wider">
                    3. Trắc Nghiệm & Điền Từ
                  </h4>
                  <span className="text-[10px] font-bold text-accent/60">Classic Active Recall</span>
                </div>
              </div>
              <p className="text-[11px] text-accent/70 dark:text-neutral-400 leading-snug">
                Trắc nghiệm ABCD 4 lựa chọn và gõ từ vào câu ví dụ có gợi ý.
              </p>
            </button>

            {/* Mode 4: IELTS Grammar Sanctuary */}
            <button
              type="button"
              onClick={() => startQuizWithQuestions('grammar_sanctuary')}
              className="p-4 rounded-2xl bg-gradient-to-br from-amber-100/70 to-emerald-100/60 dark:from-neutral-800 dark:to-neutral-700 border-2 border-primary/30 text-left transition-all hover:scale-[1.01] active:scale-95 shadow-sm cursor-pointer group flex flex-col justify-between min-h-[105px]"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
                  <Languages className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-accent dark:text-amber-100 uppercase tracking-wider">
                    4. Ngữ Pháp: Thì & Mạo Từ
                  </h4>
                  <span className="text-[10px] font-bold text-primary">Grammar Sanctuary (NEW)</span>
                </div>
              </div>
              <p className="text-[11px] text-accent/70 dark:text-neutral-400 leading-snug">
                Dòng thời gian 12 Thì, Cây quyết định mạo từ và luyện đề từ kho cá nhân.
              </p>
            </button>
          </div>

          {/* Mode 5: Spaced Repetition Review (Full Width) */}
          <button
            type="button"
            onClick={() => startQuizWithQuestions('srs')}
            className="w-full mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-800 text-white font-bold text-left transition-all hover:scale-[1.01] active:scale-95 shadow-md cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <Brain className="w-5 h-5 shrink-0 text-emerald-200" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider">5. Ôn Tập SRS AI Spaced Repetition</p>
                <p className="text-[10px] font-medium opacity-85">Luyện Collocations C1 và khắc phục điểm yếu cá nhân</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 shrink-0 text-emerald-200" />
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. GRAMMAR MASTERY LAB SCREEN
  // ==========================================
  if (quizType === 'grammar_sanctuary') {
    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-3 sm:p-5 backdrop-blur-sm">
        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-3xl w-full p-5 sm:p-7 relative max-h-[92vh] overflow-y-auto custom-scrollbar border-2 border-primary/20">
          <button
            type="button"
            onClick={() => setQuizType(null)}
            className="absolute top-5 right-5 text-accent/40 hover:text-accent p-2 rounded-full hover:bg-black/5 dark:hover:bg-neutral-800 transition-all cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
          <GrammarMasteryLab vocabList={activeVocabList} onClose={() => setQuizType(null)} />
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. LOADING SCREEN (SRS MODE)
  // ==========================================
  if (isLoadingSRS) {
    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-2xl text-center border-2 border-primary/30 max-w-sm w-full flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
          <p className="text-sm font-bold text-accent dark:text-neutral-200 animate-pulse">
            AI đang pha chế bài tập SRS từ kho từ vựng của bạn...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // 4. QUESTIONS CONTAINER SCREEN
  // ==========================================
  const current = activeQuestions[currentIndex];

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-lg w-full relative flex flex-col max-h-[90vh] border-2 border-primary/20 overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/5 dark:border-white/5 shrink-0 bg-white dark:bg-neutral-900">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
              {quizType === 'textbook' ? 'Sách Giáo Khoa' :
               quizType === 'speech' ? 'Luyện Đọc Mic' :
               quizType === 'classic_vocab' ? (classicMode === 'ABCD' ? 'Trắc Nghiệm' : 'Điền Từ') :
               'Ôn Tập SRS AI'}
            </span>
            <span className="text-xs font-bold text-accent/50 dark:text-neutral-400">
              {currentIndex + 1} / {activeQuestions.length}
            </span>
            {isDoingRetryRound && (
              <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase">
                Vòng ôn từ đã bỏ qua
              </span>
            )}
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="text-accent/40 hover:text-accent p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-neutral-800 transition-all cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
          <AnimatePresence mode="wait">
            {!isFinished ? (
              <motion.div
                key={`${quizType}-${currentIndex}-${isDoingRetryRound}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="w-full"
              >
                {/* 1. TEXTBOOK CONTEXT MATCHING MODE */}
                {quizType === 'textbook' && current && (
                  <TextbookSentenceMatching
                    currentWord={current}
                    vocabPool={activeVocabList}
                    onAnswer={(isCorrect) => {
                      if (isCorrect) setScore(score + 1);
                      if (current.id) onReview(current.id, isCorrect);
                    }}
                    onNext={handleNextQuestion}
                    onPlayAudio={playAudio}
                  />
                )}

                {/* 2. SPEECH PRONUNCIATION DRILL MODE */}
                {quizType === 'speech' && current && (
                  <SpeechPronunciationDrill
                    currentWord={current}
                    onAnswer={(isCorrect) => {
                      if (isCorrect) setScore(score + 1);
                      if (current.id) onReview(current.id, isCorrect);
                    }}
                    onSkipWord={handleSkipWord}
                    onNext={handleNextQuestion}
                    onPlayAudio={playAudio}
                  />
                )}

                {/* 3. CLASSIC VOCAB ABCD & FILL-IN MODE */}
                {quizType === 'classic_vocab' && current && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-[11px] font-bold text-accent/60 uppercase tracking-wider mb-2">
                        {classicMode === 'ABCD' ? 'Nghĩa tiếng Việt của từ này là:' : 'Từ tiếng Anh nào có nghĩa là:'}
                      </p>
                      <h3 className="text-2xl font-display font-black text-accent dark:text-amber-100">
                        {classicMode === 'ABCD' ? current.word : current.meaning}
                      </h3>
                      {classicMode === 'ABCD' && current.phonetic && (
                        <p className="text-xs font-mono text-accent/50 mt-1">{current.phonetic}</p>
                      )}
                    </div>

                    {classicMode === 'ABCD' ? (
                      <div className="grid grid-cols-1 gap-2.5 w-full pt-2">
                        {classicOptions.map((opt, i) => {
                          const isCorrect = opt === current.meaning;
                          let btnStyle = "bg-secondary/40 hover:bg-primary/10 border-primary/20 text-accent dark:text-neutral-200";
                          if (feedback) {
                            if (isCorrect) {
                              btnStyle = "bg-emerald-600 text-white border-emerald-600 font-black shadow-md";
                            } else if (feedback === 'wrong') {
                              btnStyle = "bg-rose-50 text-rose-800 border-rose-200 opacity-60";
                            }
                          }

                          return (
                            <button
                              key={i}
                              type="button"
                              disabled={feedback !== null}
                              onClick={() => handleAnswerClassic(opt)}
                              className={`p-3.5 rounded-2xl border-2 font-bold text-left transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                            >
                              <span className="text-sm font-semibold flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black">
                                  {String.fromCharCode(65 + i)}
                                </span>
                                <span>{opt}</span>
                              </span>
                              {feedback && isCorrect && <CheckCircle2 className="w-4 h-4 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-3 pt-2">
                        <input
                          type="text"
                          autoFocus
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAnswerClassic(userInput)}
                          placeholder="Gõ từ tiếng Anh..."
                          disabled={feedback !== null}
                          className="w-full min-h-[48px] p-3 rounded-2xl border-2 border-primary/30 text-center font-bold text-lg outline-none focus:border-primary bg-secondary/30"
                        />
                        {!feedback && (
                          <button
                            type="button"
                            onClick={() => handleAnswerClassic(userInput)}
                            className="w-full min-h-[44px] bg-primary text-white rounded-full font-bold shadow-md hover:bg-primary-dark transition-all cursor-pointer"
                          >
                            Xác nhận đáp án
                          </button>
                        )}
                      </div>
                    )}

                    {feedback && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={handleNextQuestion}
                          className="min-h-[44px] bg-primary text-white px-7 py-2.5 rounded-full font-bold shadow-md hover:bg-primary-dark transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <span>Câu tiếp theo</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. SRS AI MODE */}
                {quizType === 'srs' && current && (
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-accent/70 text-center">
                      {current.question}
                    </p>
                    <div className="grid grid-cols-1 gap-2.5">
                      {(current.options || []).map((opt: string, i: number) => {
                        const isCorrect = cleanOptionText(opt).toLowerCase() === cleanOptionText(current.correct_answer || '').toLowerCase();
                        let btnStyle = "bg-secondary/40 hover:bg-primary/10 border-primary/20 text-accent dark:text-neutral-200";
                        if (feedback) {
                          if (isCorrect) btnStyle = "bg-emerald-600 text-white border-emerald-600 font-black shadow-md";
                          else if (feedback === 'wrong') btnStyle = "bg-rose-50 text-rose-800 border-rose-200 opacity-60";
                        }
                        return (
                          <button
                            key={i}
                            type="button"
                            disabled={feedback !== null}
                            onClick={() => handleAnswerClassic(opt)}
                            className={`p-3.5 rounded-2xl border-2 font-bold text-left transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                          >
                            <span className="text-sm font-semibold">{cleanOptionText(opt)}</span>
                            {feedback && isCorrect && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </button>
                        );
                      })}
                    </div>
                    {feedback && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={handleNextQuestion}
                          className="min-h-[44px] bg-primary text-white px-7 py-2.5 rounded-full font-bold shadow-md hover:bg-primary-dark transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <span>Câu tiếp theo</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              /* Finish Screen */
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-display font-black text-accent dark:text-amber-100">
                  Hoàn thành phiên ôn tập!
                </h3>
                <p className="text-sm font-bold text-accent/70 dark:text-neutral-300">
                  Điểm số đạt được: <strong className="text-primary text-lg">{score}</strong> / {activeQuestions.length}
                </p>

                <div className="flex justify-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setQuizType(null)}
                    className="min-h-[44px] bg-primary text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:bg-primary-dark transition-all cursor-pointer text-xs"
                  >
                    Chọn phần thi khác
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-[44px] bg-accent text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:bg-accent-dark transition-all cursor-pointer text-xs"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
