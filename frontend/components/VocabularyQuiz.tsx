"use client";

import React, { useState, useEffect } from 'react';
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
  Loader2 
} from 'lucide-react';

const API_URL = '/api';

interface VocabItem {
  id: number;
  word: string;
  meaning: string;
  phonetic: string;
  image_url?: string;
  example?: string;
  memory_hook?: string;
}

type QuizMode = 'ABCD' | 'FILL_IN';

const VocabularyQuiz = ({ vocabList, onClose, onReview }: { 
  vocabList: VocabItem[], 
  onClose: () => void,
  onReview: (id: number, isCorrect: boolean) => Promise<void>
}) => {
  const [quizType, setQuizType] = useState<'vocab' | 'grammar' | 'srs' | null>(null);
  const [grammarQuestions, setGrammarQuestions] = useState<any[]>([]);
  const [isLoadingGrammar, setIsLoadingGrammar] = useState(false);
  const [srsQuestions, setSrsQuestions] = useState<any[]>([]);
  const [isLoadingSRS, setIsLoadingSRS] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<VocabItem[]>(() => {
    return [...vocabList].sort(() => Math.random() - 0.5);
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<QuizMode>('ABCD');
  const [options, setOptions] = useState<string[]>([]);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const activeQuestions = quizType === 'vocab' ? shuffledQuestions : quizType === 'grammar' ? grammarQuestions : srsQuestions;

  // Handle question setup when index or activeQuestions changes
  useEffect(() => {
    if (activeQuestions.length > 0 && !isFinished && feedback === null) {
      if (quizType === 'vocab') {
        const nextMode: QuizMode = Math.random() > 0.5 ? 'ABCD' : 'FILL_IN';
        setMode(nextMode);
        
        const current = activeQuestions[currentIndex];
        const others = activeQuestions.filter(v => v.word !== current.word);
        const shuffledOthers = [...others].sort(() => 0.5 - Math.random()).slice(0, 3);
        const newOptions = [...shuffledOthers.map(v => v.meaning), current.meaning].sort(() => 0.5 - Math.random());
        
        setOptions(newOptions);
      } else {
        // Grammar or SRS mode
        setMode('ABCD');
        const current = activeQuestions[currentIndex];
        if (current) {
          // If error_identification and options are just ["A", "B", "C", "D"], try to extract or construct from question
          let opts = current.options || [];
          if (current.type === 'error_identification' && opts.length === 4 && opts.every((o: string) => /^[A-D]$/i.test(o.trim()))) {
            // Attempt to extract underlined/bracketed phrases from question text if present
            const matches = current.question.match(/\[([A-D])\]\s*([^\[]+)/g);
            if (matches && matches.length === 4) {
              opts = matches.map((m: string) => m.trim());
            }
          }
          setOptions(opts);
        }
      }
      setUserInput('');
    }
  }, [currentIndex, activeQuestions, isFinished, quizType]);

  const fetchGrammarQuestions = async () => {
    setIsLoadingGrammar(true);
    try {
      const res = await fetch(`/api/quiz/grammar`);
      if (res.ok) {
        const data = await res.json();
        setGrammarQuestions(data.questions || []);
        setCurrentIndex(0);
      } else {
        alert("Không thể tải câu hỏi ngữ pháp từ AI.");
        setQuizType(null);
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối máy chủ.");
      setQuizType(null);
    } finally {
      setIsLoadingGrammar(false);
    }
  };

  const fetchSRSQuestions = async () => {
    setIsLoadingSRS(true);
    try {
      // Prioritize words with lowest mastery_level (weakest) or shuffle if none
      const sortedByWeakness = [...vocabList].sort((a: any, b: any) => {
        const levelA = a.mastery_level !== undefined ? a.mastery_level : 0;
        const levelB = b.mastery_level !== undefined ? b.mastery_level : 0;
        return levelA - levelB;
      });

      // Take a dynamic sample of up to 10 weak words (mixing top weak words with random sampling)
      const topWeak = sortedByWeakness.slice(0, 15).sort(() => Math.random() - 0.5).slice(0, 8);
      const words = topWeak.map(v => v.word);

      // Determine user level context if available
      let userBand = 6.5;
      try {
        const savedUser = localStorage.getItem("oasis_user");
        if (savedUser) {
          const u = JSON.parse(savedUser);
          if (u.target_band) userBand = parseFloat(u.target_band) || 6.5;
        }
      } catch (e) {}

      const grammarPool = [
        "Subject-verb agreement",
        "Conjunction vs Preposition (Although vs Despite)",
        "Relative clauses (who/which/that)",
        "Conditional sentences (Type 2 & 3)",
        "Parallel structure in lists",
        "Articles (a/an/the) with countable/uncountable nouns",
        "Gerund vs Infinitive after specific verbs",
        "Word form & Part of Speech errors (adverb vs adjective)"
      ];
      // Randomly pick 3-4 grammar points for variety each session
      const shuffledGrammar = [...grammarPool].sort(() => Math.random() - 0.5).slice(0, 4);

      const res = await fetch(`/api/skills/spaced-repetition-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weak_words: words.length > 0 ? words : ["mitigate", "profound", "facilitate", "resilient", "versatile"],
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

  // Hàm chuẩn hóa từ vựng: loại bỏ từ loại (n), (v), (adj)... và ký tự đặc biệt
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

  const handleAnswer = async (answer: string) => {
    if (feedback !== null) return;
    const current = activeQuestions[currentIndex];
    
    let isCorrect = false;
    if (quizType === 'vocab') {
      if (mode === 'ABCD') {
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

    if (quizType === 'vocab' && current.id) {
       onReview(current.id, isCorrect);
    }
  };

  const nextQuestion = () => {
    setFeedback(null);
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFinished(true);
    }
  };

  const skipQuestion = () => {
    if (feedback !== null) return;
    setFeedback('wrong');
  };

  // 1. Selection Screen
  if (quizType === null) {
    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white p-8 md:p-10 rounded-large shadow-2xl max-w-md w-full relative overflow-hidden border-4 border-primary/30 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <HelpCircle className="w-8 h-8 text-primary shrink-0" />
        </div>
        <h3 className="text-2xl font-display font-black text-accent mb-2">Matcha Quiz</h3>
        <p className="text-sm opacity-60 mb-8">Luyện tập giúp củng cố kiến thức tốt hơn. Hãy chọn phần thi bạn muốn ôn tập!</p>
        
        <div className="flex flex-col gap-3.5 w-full">
          <button type="button"
            onClick={() => {
              if (vocabList.length === 0) {
                (window as any).showAlert("Thư viện từ vựng đang trống rỗng. Hãy quét hoặc thêm vài từ vựng rồi quay lại ôn tập nhé!", "Thiếu nguyên liệu!", "warning");
                return;
              }
              setQuizType('vocab');
            }}
            className="w-full min-h-[44px] bg-primary text-white p-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer touch-manipulation"
          >
            <Layers className="w-6 h-6 text-white shrink-0" />
            <div className="text-left">
              <p className="text-base font-black leading-none">Trắc nghiệm Từ vựng</p>
              <p className="text-[10px] font-medium opacity-80 mt-1">Luyện từ vựng trong thư viện của bạn</p>
            </div>
          </button>
          
          <button type="button"
            onClick={() => {
              setQuizType('srs');
              fetchSRSQuestions();
            }}
            className="w-full min-h-[44px] bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer touch-manipulation"
          >
            <Brain className="w-6 h-6 text-white shrink-0" />
            <div className="text-left text-white">
              <div className="flex items-center gap-1.5">
                <p className="text-base font-black leading-none text-white">Ôn Tập SRS AI (Skill 5)</p>
                <span className="px-1.5 py-0.5 bg-white/25 text-[8px] font-black rounded uppercase">Spaced Rep</span>
              </div>
              <p className="text-[10px] font-medium opacity-90 mt-1 text-white/95">Bài tập trúng điểm yếu & Collocations C1</p>
            </div>
          </button>

          <button type="button"
            onClick={() => {
              setQuizType('grammar');
              fetchGrammarQuestions();
            }}
            className="w-full min-h-[44px] bg-accent text-white p-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer touch-manipulation"
          >
            <Languages className="w-6 h-6 text-white shrink-0" />
            <div className="text-left text-white">
              <p className="text-base font-black leading-none text-white">Trắc nghiệm Ngữ pháp</p>
              <p className="text-[10px] font-medium opacity-80 mt-1 text-white/90">Câu hỏi ngữ pháp sinh động từ AI</p>
            </div>
          </button>
        </div>
        
        <button type="button" onClick={onClose} className="absolute top-6 right-6 opacity-30 hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-black/5 touch-manipulation active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center" aria-label="Đóng">
           <X className="w-6 h-6 text-accent" />
        </button>
      </div>
    </div>
    );
  }

  // 2. Loading Screen for Grammar / SRS Mode
  if (isLoadingGrammar || isLoadingSRS) {
    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white p-10 rounded-large shadow-2xl text-center border-4 border-primary/30 max-w-md w-full flex flex-col items-center justify-center">
         <div className="w-16 h-16 relative mb-4">
           <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
           <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
         </div>
         <p className="text-sm font-bold uppercase tracking-widest text-primary animate-pulse">
           {isLoadingSRS ? "Gemini AI is generating SRS questions..." : "AI is brewing grammar questions..."}
         </p>
        </div>
      </div>
    );
  }

  // 3. Questions Empty Screen
  if (activeQuestions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white p-10 rounded-large shadow-2xl text-center border-4 border-primary/30 max-w-md w-full">
         <p className="text-xl font-display font-bold mb-6 text-accent">Không tìm thấy câu hỏi...</p>
         <button type="button" onClick={() => setQuizType(null)} className="min-h-[44px] bg-primary text-white px-10 py-3 rounded-full font-bold touch-manipulation active:scale-95">Quay lại</button>
        </div>
      </div>
    );
  }

  const current = activeQuestions[currentIndex];

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md md:max-w-lg w-full relative flex flex-col max-h-[88vh] border-2 border-primary/20 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-black/5 shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
              {quizType === 'vocab' 
                ? (mode === 'ABCD' ? 'Trắc nghiệm Từ vựng' : 'Điền từ vựng')
                : quizType === 'srs'
                ? `Ôn Tập SRS AI • ${current?.type === 'collocation_cloze' ? 'Collocation Cloze' : current?.type === 'error_identification' ? 'Tìm Lỗi Sai' : 'Định Nghĩa'}`
                : 'Trắc nghiệm Ngữ pháp'}
            </span>
            <span className="text-xs font-bold text-accent/50">{currentIndex + 1} / {activeQuestions.length}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {!isFinished && !feedback && (
              <button
                type="button"
                onClick={skipQuestion}
                className="text-xs font-bold text-accent/50 hover:text-accent px-2.5 py-1.5 rounded-lg hover:bg-black/5 transition-colors flex items-center gap-1 cursor-pointer touch-manipulation active:scale-95 min-h-[36px]"
                title="Bỏ qua câu này"
              >
                <span>Bỏ qua</span>
                <SkipForward className="w-4 h-4 shrink-0" />
              </button>
            )}
            <button 
              type="button" 
              onClick={onClose} 
              className="text-accent/40 hover:text-accent p-2 rounded-full hover:bg-black/5 transition-all cursor-pointer touch-manipulation active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Đóng"
              aria-label="Đóng"
            >
              <X className="w-5 h-5 shrink-0" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
          <AnimatePresence mode="wait">
            {!isFinished ? (
              <motion.div
                key={`${quizType}-${currentIndex}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col"
              >
                {/* Illustrative Image for Vocab Quiz */}
                {quizType === 'vocab' && current.image_url && (
                  <div className="w-full flex justify-center mb-3">
                    <img 
                      src={current.image_url} 
                      alt={current.word} 
                      className="w-40 h-28 object-cover rounded-2xl border-2 border-primary/20 shadow-md"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                )}
                
                {/* Instruction & Question Prompt */}
                <div className="text-center mb-5">
                  <p className="text-[11px] font-bold text-accent/70 uppercase tracking-wider mb-2">
                    {quizType === 'vocab'
                      ? (mode === 'ABCD' ? 'Nghĩa tiếng Việt của từ này là:' : 'Từ tiếng Anh nào có nghĩa là:')
                      : quizType === 'srs'
                      ? (current?.type === 'error_identification' 
                          ? 'Tìm và chọn phần bị sai ngữ pháp trong câu:' 
                          : current?.type === 'collocation_cloze'
                          ? 'Chọn từ học thuật thích hợp nhất để điền vào chỗ trống:'
                          : 'Chọn từ vựng chuẩn xác tương ứng với định nghĩa:')
                      : 'Chọn đáp án chính xác để hoàn thành câu:'}
                  </p>
                  
                  <div className="text-base sm:text-lg md:text-xl font-display font-black text-accent leading-relaxed tracking-normal px-2">
                    {quizType === 'vocab' ? (
                      mode === 'ABCD' ? current.word : current.meaning
                    ) : current?.type === 'error_identification' ? (
                      (() => {
                        const cleanQ = (current.question || '').replace(/^Identify the error:\s*/i, '');
                        const parts = cleanQ.split(/(\[[A-D]\]|\([A-D]\))/g);
                        return parts.map((part: string, idx: number) => {
                          const match = part.match(/^\[([A-D])\]$/) || part.match(/^\(([A-D])\)$/);
                          if (match) {
                            return (
                              <span 
                                key={idx} 
                                className="inline-flex items-center justify-center bg-amber-200 text-amber-950 border border-amber-400 font-sans font-black text-xs px-2 py-0.5 mx-1 rounded-md align-middle shadow-xs"
                              >
                                {match[1]}
                              </span>
                            );
                          }
                          return <span key={idx}>{part}</span>;
                        });
                      })()
                    ) : (
                      (() => {
                        const qText = current.question || '';
                        // Highlight blank if present
                        if (qText.includes('________') || qText.includes('[...]')) {
                          const parts = qText.split(/(_{3,}|\[\.\.\.\])/g);
                          return parts.map((p: string, idx: number) => {
                            if (/^(_{3,}|\[\.\.\.\])$/.test(p)) {
                              return (
                                <span 
                                  key={idx} 
                                  className="inline-block mx-1 px-3 py-0.5 bg-amber-100 text-amber-900 border-2 border-dashed border-amber-400 rounded-lg font-mono text-sm align-middle"
                                >
                                  _______
                                </span>
                              );
                            }
                            return <span key={idx}>{p}</span>;
                          });
                        }
                        return qText;
                      })()
                    )}
                  </div>
                  {(quizType === 'vocab' && mode === 'ABCD') && <p className="text-xs opacity-50 italic mt-1 font-sans">{current.phonetic}</p>}
                </div>
                
                {/* Options List */}
                {mode === 'ABCD' ? (
                  <div className="grid grid-cols-1 gap-2.5 w-full">
                    {options.map((option, i) => {
                      const cleanOpt = cleanOptionText(option).toLowerCase();
                      const cleanCorr = cleanOptionText(quizType === 'vocab' ? current.meaning : (current.correct_answer || '')).toLowerCase();
                      const isCorrectOption = cleanOpt === cleanCorr || (cleanCorr.length > 2 && cleanOpt.includes(cleanCorr));
                      
                      let btnStyle = "bg-amber-50/60 hover:bg-amber-100/70 border-amber-200/80 text-amber-950";
                      if (feedback) {
                        if (isCorrectOption) {
                          btnStyle = "bg-emerald-600 border-emerald-600 text-white shadow-md font-black";
                        } else if (feedback === 'wrong') {
                          btnStyle = "bg-rose-50 border-rose-200 text-rose-800 opacity-60";
                        }
                      }

                      return (
                        <button 
                          type="button" 
                          key={i}
                          onClick={() => handleAnswer(option)}
                          disabled={feedback !== null}
                          className={`p-3 rounded-2xl font-bold text-left transition-all border-2 flex justify-between items-center cursor-pointer ${btnStyle}`}
                        >
                          <span className="text-sm font-bold flex items-center gap-2.5">
                            <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                              feedback && isCorrectOption 
                                ? 'bg-white text-emerald-700' 
                                : 'bg-amber-200 text-amber-900'
                            }`}>
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="leading-snug">
                              {cleanOptionText(option)}
                            </span>
                          </span>
                          {feedback && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="w-full">
                    <input 
                      type="text"
                      autoFocus
                      className={`w-full min-h-[48px] p-3.5 rounded-2xl border-2 text-center text-lg font-display font-black outline-none transition-all
                        ${feedback === 'correct' ? 'border-green-500 bg-green-50 text-green-700' : 
                          feedback === 'wrong' ? 'border-red-500 bg-red-50 text-red-700' : 
                          'border-amber-200 focus:border-primary bg-amber-50/50 text-accent'}
                      `}
                      placeholder="Gõ từ tiếng Anh..."
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAnswer(userInput)}
                      disabled={feedback !== null}
                    />
                    {!feedback && (
                      <button 
                        type="button" 
                        onClick={() => handleAnswer(userInput)}
                        className="w-full min-h-[44px] mt-3 bg-primary text-white py-3 rounded-full font-bold shadow-md hover:bg-primary/90 transition-all active:scale-95 cursor-pointer touch-manipulation"
                      >
                        Xác nhận đáp án
                      </button>
                    )}
                  </div>
                )}

                {/* Feedback Panel */}
                {feedback && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex flex-col items-center gap-3">
                    <div className="text-center font-bold w-full">
                      {feedback === 'correct' ? (
                        <div className="flex items-center justify-center gap-1.5 text-emerald-700 text-base font-black">
                          <CheckCircle2 className="w-5 h-5 shrink-0" />
                          <span>Chính xác!</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="flex items-center justify-center gap-1.5 text-rose-600 text-base font-black">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>Chưa chính xác!</span>
                          </div>
                          <p className="text-accent text-xs font-bold mt-0.5">
                            {quizType === 'vocab' 
                              ? (mode === 'ABCD' ? `Đáp án đúng: "${current.meaning}"` : `Từ đúng là: "${normalizeWord(current.word) || current.word}"`)
                              : `Đáp án đúng: "${cleanOptionText(current.correct_answer || '')}"`}
                          </p>
                        </div>
                      )}

                      {/* Hints and Explanations */}
                      {(quizType === 'srs' && current?.explanation) && (
                        <div className="mt-3 p-3.5 bg-emerald-50 rounded-2xl text-left border border-emerald-200 text-xs text-neutral-800 font-medium leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                          <div className="flex items-center gap-1 font-black text-emerald-800 mb-0.5">
                            <GraduationCap className="w-4 h-4 shrink-0 text-emerald-800" />
                            <span>Giải thích Cambridge IELTS:</span>
                          </div>
                          <p className="text-neutral-700 text-[11px] leading-relaxed">{current.explanation}</p>
                          {current.target_word && (
                            <p className="text-[10px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
                              <Target className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
                              <span>Target Word: <span className="font-mono">{current.target_word}</span></span>
                            </p>
                          )}
                        </div>
                      )}
                      {(quizType === 'grammar' && current.explanation) && (
                        <div className="mt-3 p-3 bg-primary/10 rounded-2xl text-left border border-primary/20 text-xs text-accent font-medium leading-relaxed max-h-28 overflow-y-auto custom-scrollbar">
                          <span className="font-black text-primary flex items-center gap-1 mb-0.5">
                            <Lightbulb className="w-3.5 h-3.5 shrink-0 text-primary" />
                            <span>Giải thích:</span>
                          </span>
                          {current.explanation}
                        </div>
                      )}
                      {(quizType === 'vocab' && (current.memory_hook || current.example)) && (
                        <div className="mt-3 p-3 bg-primary/10 rounded-2xl text-left border border-primary/20 text-xs text-accent font-medium leading-relaxed max-h-28 overflow-y-auto custom-scrollbar">
                          <span className="font-black text-primary flex items-center gap-1 mb-0.5">
                            <Lightbulb className="w-3.5 h-3.5 shrink-0 text-primary" />
                            <span>Giải thích & Ví dụ:</span>
                          </span>
                          {current.memory_hook && <p className="mb-0.5"><b>Mẹo nhớ:</b> {current.memory_hook}</p>}
                          {current.example && <p className="italic opacity-85"><b>Ví dụ:</b> {current.example}</p>}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Sparkles className="w-8 h-8 text-primary shrink-0" />
                </div>
                <h3 className="text-2xl font-display font-black mb-1 text-accent">Hoàn thành bài ôn tập!</h3>
                <p className="text-sm opacity-70 mb-6 text-accent">Điểm số của bạn: <b>{score}</b> / {activeQuestions.length}</p>
                <div className="flex items-center justify-center gap-3">
                  <button 
                    type="button" 
                    onClick={() => setQuizType(null)} 
                    className="min-h-[44px] bg-primary text-white px-6 py-3 rounded-full font-bold shadow-md hover:scale-[1.02] transition-all cursor-pointer text-sm touch-manipulation active:scale-95"
                  >
                    Chơi tiếp
                  </button>
                  <button 
                    type="button" 
                    onClick={onClose} 
                    className="min-h-[44px] bg-accent text-white px-6 py-3 rounded-full font-bold shadow-md hover:scale-[1.02] transition-all cursor-pointer text-sm touch-manipulation active:scale-95"
                  >
                    Đóng
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Sticky Footer (Always Visible When Feedback Is Displayed) */}
        {!isFinished && feedback && (
          <div className="p-3.5 bg-white border-t border-black/5 shrink-0 flex items-center justify-center">
            <button 
              type="button" 
              onClick={nextQuestion}
              className="w-full min-h-[44px] py-3 bg-accent text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer text-sm touch-manipulation"
            >
              <span>Câu tiếp theo</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabularyQuiz;
