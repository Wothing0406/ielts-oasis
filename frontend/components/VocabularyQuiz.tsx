"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':8000') : 'http://localhost:8000';

interface VocabItem {
  id: number;
  word: string;
  meaning: string;
  phonetic: string;
}

type QuizMode = 'ABCD' | 'FILL_IN';

const VocabularyQuiz = ({ vocabList, onClose, onReview }: { 
  vocabList: VocabItem[], 
  onClose: () => void,
  onReview: (id: number, isCorrect: boolean) => Promise<void>
}) => {
  // Store the shuffled list in state so it doesn't change when parent refreshes
  const [shuffledQuestions, setShuffledQuestions] = useState<VocabItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<QuizMode>('ABCD');
  const [options, setOptions] = useState<string[]>([]);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Initialize shuffled questions only once
  useEffect(() => {
    if (vocabList.length > 0 && shuffledQuestions.length === 0) {
      setShuffledQuestions([...vocabList].sort(() => Math.random() - 0.5));
    }
  }, [vocabList]);

  // Handle question setup when index or mode changes
  useEffect(() => {
    if (shuffledQuestions.length > 0 && !isFinished && feedback === null) {
      const nextMode: QuizMode = Math.random() > 0.5 ? 'ABCD' : 'FILL_IN';
      setMode(nextMode);
      
      const current = shuffledQuestions[currentIndex];
      const others = shuffledQuestions.filter(v => v.word !== current.word);
      const shuffledOthers = [...others].sort(() => 0.5 - Math.random()).slice(0, 3);
      const newOptions = [...shuffledOthers.map(v => v.meaning), current.meaning].sort(() => 0.5 - Math.random());
      
      setOptions(newOptions);
      setUserInput('');
    }
  }, [currentIndex, shuffledQuestions, isFinished]); // Removed feedback from deps to prevent loop

  const handleAnswer = async (answer: string) => {
    if (feedback !== null) return;
    const current = shuffledQuestions[currentIndex];
    const isCorrect = mode === 'ABCD' 
      ? answer === current.meaning 
      : answer.toLowerCase().trim() === current.word.toLowerCase().trim();

    if (isCorrect) {
      setFeedback('correct');
      setScore(score + 1);
    } else {
      setFeedback('wrong');
    }

    if (current.id) {
       // We don't await here to prevent UI lag, and we know page.tsx will refresh
       onReview(current.id, isCorrect);
    }
  };

  const nextQuestion = () => {
    setFeedback(null); // Explicitly reset feedback only when clicking "Next"
    if (currentIndex < shuffledQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFinished(true);
    }
  };

  if (shuffledQuestions.length === 0) return (
    <div className="bg-white p-10 rounded-large shadow-2xl text-center border-4 border-primary">
       <p className="text-xl font-display font-bold mb-6 text-accent">Đang chuẩn bị câu hỏi...</p>
       <button onClick={onClose} className="bg-primary text-white px-10 py-4 rounded-full font-bold">Đóng</button>
    </div>
  );

  const current = shuffledQuestions[currentIndex];

  return (
    <div className="bg-white p-6 md:p-10 rounded-large shadow-2xl max-w-lg w-full relative overflow-hidden border-4 border-primary/30">
      <AnimatePresence mode="wait">
        {!isFinished ? (
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col"
          >
            <div className="mb-6 w-full flex justify-between items-center">
               <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                 {mode === 'ABCD' ? 'Trắc nghiệm (ABCD)' : 'Điền từ còn thiếu'}
               </span>
               <span className="text-xs font-bold opacity-40">{currentIndex + 1} / {shuffledQuestions.length}</span>
            </div>
            
            <div className="text-center mb-8">
              <p className="text-sm opacity-60 mb-2">
                {mode === 'ABCD' ? 'Nghĩa tiếng Việt của từ này là:' : 'Từ tiếng Anh nào có nghĩa là:'}
              </p>
              <h3 className="text-3xl md:text-4xl font-display font-black text-accent">
                {mode === 'ABCD' ? current.word : current.meaning}
              </h3>
              {mode === 'ABCD' && <p className="text-sm opacity-40 italic mt-1">{current.phonetic}</p>}
            </div>
            
            {mode === 'ABCD' ? (
              <div className="grid grid-cols-1 gap-3 w-full">
                 {options.map((option, i) => (
                   <button 
                    key={i}
                    onClick={() => handleAnswer(option)}
                    disabled={feedback !== null}
                    className={`p-4 rounded-2xl font-bold text-left transition-all border-2 flex justify-between items-center
                      ${feedback && option === current.meaning ? 'bg-green-500 border-green-500 text-white shadow-lg scale-105' : 
                        feedback && option !== current.meaning && feedback === 'wrong' ? 'bg-red-500 border-red-500 text-white opacity-50' :
                        feedback && option !== current.meaning ? 'bg-red-50 border-red-200 text-red-300' : 
                        'bg-secondary border-transparent hover:border-primary/40 text-accent'}
                    `}
                   >
                     <span className="text-sm md:text-base">{String.fromCharCode(65 + i)}. {option}</span>
                     {feedback && option === current.meaning && <span className="material-symbols-rounded">check</span>}
                   </button>
                 ))}
              </div>
            ) : (
              <div className="w-full">
                <input 
                  type="text"
                  autoFocus
                  className={`w-full p-4 md:p-5 rounded-2xl border-4 text-center text-xl md:text-2xl font-display font-black outline-none transition-all
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
                  <button 
                    onClick={() => handleAnswer(userInput)}
                    className="w-full mt-4 bg-primary text-white py-4 rounded-full font-bold shadow-lg hover:bg-primary/90 transition-all active:scale-95"
                  >
                    Xác nhận đáp án
                  </button>
                )}
              </div>
            )}

            {feedback && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 flex flex-col items-center gap-4">
                <div className="text-center font-bold">
                  {feedback === 'correct' ? (
                    <span className="text-green-600 flex items-center justify-center gap-2 text-xl">
                      <span className="material-symbols-rounded text-3xl">sentiment_very_satisfied</span> Chính xác!
                    </span>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-red-600 flex items-center justify-center gap-2 text-xl">
                        <span className="material-symbols-rounded text-3xl">sentiment_very_dissatisfied</span> Sai rồi!
                      </span>
                      <p className="text-accent text-sm font-bold">
                        {mode === 'ABCD' ? `Đáp án: "${current.meaning}"` : `Từ đúng: "${current.word}"`}
                      </p>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={nextQuestion}
                  className="w-full py-4 bg-accent text-white rounded-full font-bold shadow-xl flex items-center justify-center gap-2 hover:scale-105 transition-all"
                >
                  Câu tiếp theo <span className="material-symbols-rounded">arrow_forward</span>
                </button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
             <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-rounded text-6xl text-primary">stars</span>
             </div>
             <h3 className="text-3xl md:text-4xl font-display font-black mb-2 text-accent">Hoàn thành!</h3>
             <p className="text-lg md:text-xl opacity-60 mb-10 text-accent">Điểm: <b>{score}</b> / {shuffledQuestions.length}</p>
             <button onClick={onClose} className="bg-primary text-white px-10 py-4 rounded-full font-bold shadow-xl hover:scale-105 transition-all">
                Quay lại Oasis
             </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <button onClick={onClose} className="absolute top-6 right-6 opacity-20 hover:opacity-100 transition-opacity">
         <span className="material-symbols-rounded text-3xl">close</span>
      </button>
    </div>
  );
};

export default VocabularyQuiz;
