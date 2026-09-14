"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
        if (current && current.options) {
          setOptions(current.options);
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
      const words = vocabList.map(v => v.word).slice(0, 10);
      const res = await fetch(`/api/skills/spaced-repetition-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weak_words: words.length > 0 ? words : ["mitigate", "profound", "facilitate", "resilient", "versatile"],
          weak_grammar_points: ["Subject-verb agreement", "Conjunction vs Preposition", "Relative clauses", "Conditional clauses"],
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
      isCorrect = answer === current.correct_answer;
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

  // 1. Selection Screen
  if (quizType === null) {
    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white p-8 md:p-10 rounded-large shadow-2xl max-w-md w-full relative overflow-hidden border-4 border-primary/30 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-rounded text-primary text-4xl">quiz</span>
        </div>
        <h3 className="text-2xl font-display font-black text-accent mb-2">Matcha Quiz 🍵</h3>
        <p className="text-sm opacity-60 mb-8">Luyện tập giúp củng cố kiến thức tốt hơn. Hãy chọn phần thi bạn muốn ôn tập!</p>
        
        <div className="flex flex-col gap-3.5 w-full">
          <button type="button"
            onClick={() => {
              if (vocabList.length === 0) {
                (window as any).showAlert("Oops! Thư viện từ vựng đang trống rỗng rồi. Quét hoặc thêm vài từ vựng rồi quay lại ôn tập nhé! 🍵", "Thiếu nguyên liệu!", "warning");
                return;
              }
              setQuizType('vocab');
            }}
            className="w-full bg-primary text-white p-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer"
          >
            <span className="material-symbols-rounded text-2xl">style</span>
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
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer"
          >
            <span className="material-symbols-rounded text-2xl text-white">psychology</span>
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
            className="w-full bg-accent text-white p-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer"
          >
            <span className="material-symbols-rounded text-2xl text-white">translate</span>
            <div className="text-left text-white">
              <p className="text-base font-black leading-none text-white">Trắc nghiệm Ngữ pháp</p>
              <p className="text-[10px] font-medium opacity-80 mt-1 text-white/90">Câu hỏi ngữ pháp sinh động từ AI</p>
            </div>
          </button>
        </div>
        
        <button type="button" onClick={onClose} className="absolute top-6 right-6 opacity-20 hover:opacity-100 transition-opacity">
           <span className="material-symbols-rounded text-3xl">close</span>
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
         <button type="button" onClick={() => setQuizType(null)} className="bg-primary text-white px-10 py-4 rounded-full font-bold">Quay lại</button>
        </div>
      </div>
    );
  }

  const current = activeQuestions[currentIndex];

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white p-6 md:p-10 rounded-large shadow-2xl max-w-lg w-full relative overflow-hidden border-4 border-primary/30">
      <AnimatePresence mode="wait">
        {!isFinished ? (
          <motion.div
            key={`${quizType}-${currentIndex}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col"
          >
            <div className="mb-4 w-full flex justify-between items-center">
               <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                 {quizType === 'vocab' 
                   ? (mode === 'ABCD' ? 'Trắc nghiệm Từ vựng (ABCD)' : 'Điền từ vựng còn thiếu')
                   : quizType === 'srs'
                   ? `Ôn Tập SRS AI • ${current?.type === 'collocation_cloze' ? 'Collocation Cloze C1' : 'Error Identification'}`
                   : 'Trắc nghiệm Ngữ pháp (IELTS)'}
               </span>
               <span className="text-xs font-bold opacity-40">{currentIndex + 1} / {activeQuestions.length}</span>
            </div>

            {/* Illustrative Image for Vocab Quiz */}
            {quizType === 'vocab' && current.image_url && (
              <div className="w-full flex justify-center mb-4">
                <img 
                  src={current.image_url} 
                  alt={current.word} 
                  className="w-48 h-32 object-cover rounded-2xl border-2 border-primary/20 shadow-md"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            )}
            
            <div className="text-center mb-6">
              <p className="text-xs opacity-60 mb-2">
                {quizType === 'vocab'
                  ? (mode === 'ABCD' ? 'Nghĩa tiếng Việt của từ này là:' : 'Từ tiếng Anh nào có nghĩa là:')
                  : quizType === 'srs'
                  ? (current?.type === 'error_identification' 
                      ? 'Tìm và chọn phần bị sai ngữ pháp trong câu dưới đây:' 
                      : 'Chọn từ học thuật (Collocation) phù hợp nhất điền vào chỗ trống:')
                  : 'Chọn đáp án chính xác để điền vào chỗ trống:'}
              </p>
              <h3 className="text-2xl md:text-3xl font-display font-black text-accent leading-tight">
                {quizType === 'vocab' 
                  ? (mode === 'ABCD' ? current.word : current.meaning)
                  : current.question}
              </h3>
              {(quizType === 'vocab' && mode === 'ABCD') && <p className="text-sm opacity-40 italic mt-1">{current.phonetic}</p>}
            </div>
            
            {mode === 'ABCD' ? (
              <div className="grid grid-cols-1 gap-3 w-full">
                  {options.map((option, i) => {
                    const isCorrectOption = quizType === 'vocab' 
                      ? option === current.meaning 
                      : option === current.correct_answer;
                    return (
                      <button type="button" 
                       key={i}
                       onClick={() => handleAnswer(option)}
                       disabled={feedback !== null}
                       className={`p-3.5 rounded-2xl font-bold text-left transition-all border-2 flex justify-between items-center
                         ${feedback && isCorrectOption ? 'bg-green-500 border-green-500 text-white shadow-lg scale-[1.02]' : 
                           feedback && !isCorrectOption && feedback === 'wrong' ? 'bg-red-500 border-red-500 text-white opacity-50' :
                           feedback && !isCorrectOption ? 'bg-red-50 border-red-200 text-red-300' : 
                           'bg-secondary border-transparent hover:border-primary/40 text-accent'}
                       `}
                      >
                        <span className="text-sm">{String.fromCharCode(65 + i)}. {option}</span>
                        {feedback && isCorrectOption && <span className="material-symbols-rounded text-sm">check</span>}
                      </button>
                    );
                  })}
              </div>
            ) : (
              <div className="w-full">
                <input 
                  type="text"
                  autoFocus
                  className={`w-full p-4 rounded-2xl border-4 text-center text-xl font-display font-black outline-none transition-all
                    ${feedback === 'correct' ? 'border-green-500 bg-green-50 text-green-700' : 
                      feedback === 'wrong' ? 'border-red-500 bg-red-50 text-red-700' : 
                      'border-secondary focus:border-primary bg-secondary/30 text-accent'}
                  `}
                  placeholder="Gõ từ tiếng Anh..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnswer(userInput)}
                  disabled={feedback !== null}
                />
                {!feedback && (
                  <button type="button" 
                    onClick={() => handleAnswer(userInput)}
                    className="w-full mt-4 bg-primary text-white py-3.5 rounded-full font-bold shadow-lg hover:bg-primary/90 transition-all active:scale-95"
                  >
                    Xác nhận đáp án
                  </button>
                )}
              </div>
            )}

            {feedback && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex flex-col items-center gap-4">
                <div className="text-center font-bold w-full">
                  {feedback === 'correct' ? (
                    <span className="text-green-600 flex items-center justify-center gap-2 text-lg">
                      <span className="material-symbols-rounded text-2xl">sentiment_very_satisfied</span> Chính xác!
                    </span>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-red-600 flex items-center justify-center gap-2 text-lg">
                        <span className="material-symbols-rounded text-2xl">sentiment_very_dissatisfied</span> Chưa chính xác!
                      </span>
                      <p className="text-accent text-sm font-bold mt-1">
                        {quizType === 'vocab' 
                          ? (mode === 'ABCD' ? `Đáp án đúng: "${current.meaning}"` : `Từ đúng là: "${normalizeWord(current.word) || current.word}"`)
                          : `Đáp án đúng: "${current.correct_answer}"`}
                      </p>
                    </div>
                  )}

                  {/* Hints and Explanations */}
                  {(quizType === 'srs' && current?.explanation) && (
                    <div className="mt-4 p-4 bg-emerald-50 rounded-2xl text-left border border-emerald-200 text-xs text-neutral-800 font-medium leading-relaxed max-h-36 overflow-y-auto custom-scrollbar">
                      <div className="flex items-center gap-1.5 font-black text-emerald-800 mb-1">
                        <span className="material-symbols-rounded text-sm">school</span>
                        <span>Giải thích chuẩn Cambridge IELTS:</span>
                      </div>
                      <p className="mb-1 text-neutral-700">{current.explanation}</p>
                      {current.target_word && (
                        <p className="text-[11px] font-bold text-emerald-700 mt-1">🎯 Target Word: <span className="font-mono">{current.target_word}</span></p>
                      )}
                      {current.target_grammar && (
                        <p className="text-[11px] font-bold text-teal-700 mt-1">📐 Target Rule: <span className="font-mono">{current.target_grammar}</span></p>
                      )}
                    </div>
                  )}
                  {(quizType === 'grammar' && current.explanation) && (
                    <div className="mt-4 p-4 bg-primary/5 rounded-2xl text-left border border-primary/10 text-xs text-accent font-medium leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                      <span className="font-black text-primary block mb-1">💡 Giải thích:</span>
                      {current.explanation}
                    </div>
                  )}
                  {(quizType === 'vocab' && (current.memory_hook || current.example)) && (
                    <div className="mt-4 p-4 bg-primary/5 rounded-2xl text-left border border-primary/10 text-xs text-accent font-medium leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                      <span className="font-black text-primary block mb-1">💡 Giải thích & Ví dụ:</span>
                      {current.memory_hook && <p className="mb-1"><b>Mẹo nhớ:</b> {current.memory_hook}</p>}
                      {current.example && <p className="italic opacity-85"><b>Ví dụ:</b> {current.example}</p>}
                    </div>
                  )}
                </div>
                
                <button type="button" 
                  onClick={nextQuestion}
                  className="w-full py-3.5 bg-accent text-white rounded-full font-bold shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                >
                  Câu tiếp theo <span className="material-symbols-rounded">arrow_forward</span>
                </button>
              </motion.div>
            )}
          </motion.div>
        ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
               <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <span className="material-symbols-rounded text-5xl text-primary">stars</span>
               </div>
               <h3 className="text-3xl font-display font-black mb-2 text-accent">Hoàn thành!</h3>
               <p className="text-lg opacity-60 mb-8 text-accent">Điểm của bạn: <b>{score}</b> / {activeQuestions.length}</p>
               <button type="button" onClick={() => setQuizType(null)} className="bg-primary text-white px-10 py-4 rounded-full font-bold shadow-xl hover:scale-[1.02] transition-all mr-2">
                  Chơi tiếp
               </button>
               <button type="button" onClick={onClose} className="bg-accent text-white px-10 py-4 rounded-full font-bold shadow-xl hover:scale-[1.02] transition-all">
                  Đóng
               </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button type="button" onClick={onClose} className="absolute top-6 right-6 opacity-20 hover:opacity-100 transition-opacity">
           <span className="material-symbols-rounded text-3xl">close</span>
        </button>
      </div>
    </div>
  );
};

export default VocabularyQuiz;
