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
  RotateCcw,
  Volume2,
  PenTool
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

  // Classic Vocab Options & User input state
  const [meaningOptions, setMeaningOptions] = useState<string[]>([]);
  const [userInput, setUserInput] = useState('');
  const [userSelectedOption, setUserSelectedOption] = useState<string | null>(null);
  const [showMeaningHint, setShowMeaningHint] = useState<boolean>(false);

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
    setUserSelectedOption(null);
    setShowMeaningHint(false);
    setUserInput('');
    setRetryQueue([]);
    setIsDoingRetryRound(false);
    setQuizType(type);
  };

  const activeQuestions = quizType === 'srs' ? srsQuestions : shuffledQuestions;

  // Automatically interleaved 50/50: Even index = ABCD (Meaning Choice), Odd index = FILL_IN (Active Recall)
  const activeClassicMode: ClassicMode = useMemo(() => {
    return currentIndex % 2 === 0 ? 'ABCD' : 'FILL_IN';
  }, [currentIndex]);

  // Setup Classic ABCD options: 1 correct Vietnamese meaning + 3 Vietnamese distractors
  useEffect(() => {
    if (quizType === 'classic_vocab' && activeQuestions.length > 0 && !isFinished && feedback === null) {
      const current = activeQuestions[currentIndex];
      if (current) {
        // Collect distinct Vietnamese meanings from other words in the vault
        const otherMeanings = Array.from(new Set(
          activeVocabList
            .filter(v => v.word.toLowerCase() !== current.word.toLowerCase() && v.meaning.trim().toLowerCase() !== current.meaning.trim().toLowerCase())
            .map(v => v.meaning.trim())
        ));

        const fallbackMeanings = [
          "tạo điều kiện thuận lợi, hỗ trợ thúc đẩy",
          "giảm thiểu tác động tiêu cực, làm dịu bớt",
          "ủng hộ công khai, đề xuất chủ trương",
          "chứng minh, đưa ra luận cứ xác thực",
          "thấu hiểu trọn vẹn, bao hàm toàn diện",
          "kích thích, tạo động lực phát triển",
          "bền vững, thân thiện với môi trường",
          "kiên cường, có khả năng phục hồi nhanh"
        ];

        const shuffledDistractors = [...otherMeanings].sort(() => 0.5 - Math.random()).slice(0, 3);
        while (shuffledDistractors.length < 3) {
          const candidate = fallbackMeanings.find(f => 
            f.toLowerCase() !== current.meaning.toLowerCase() &&
            !shuffledDistractors.some(d => d.toLowerCase() === f.toLowerCase())
          );
          if (candidate) shuffledDistractors.push(candidate);
          else break;
        }

        const opts = [
          current.meaning.trim(),
          ...shuffledDistractors
        ].sort(() => 0.5 - Math.random());

        setMeaningOptions(opts);
      }
      setUserInput('');
      setUserSelectedOption(null);
      setShowMeaningHint(false);
    }
  }, [currentIndex, activeQuestions, isFinished, quizType, feedback, activeVocabList]);

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

  const getWordHint = (word: string) => {
    if (!word) return '';
    const clean = word.trim();
    if (clean.length <= 2) return `${clean[0].toUpperCase()} _ (${clean.length} chữ cái)`;
    const first = clean[0];
    const last = clean[clean.length - 1];
    const blanks = '_ '.repeat(clean.length - 2).trim();
    return `${first.toUpperCase()} ${blanks} ${last.toLowerCase()} (${clean.length} chữ cái)`;
  };

  const handleNextQuestion = () => {
    setFeedback(null);
    setUserSelectedOption(null);
    setShowMeaningHint(false);
    setUserInput('');
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
    if (!current) return;
    
    setUserSelectedOption(answer);
    let isCorrect = false;
    
    if (quizType === 'classic_vocab') {
      if (activeClassicMode === 'ABCD') {
        isCorrect = answer.trim().toLowerCase() === current.meaning.trim().toLowerCase();
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

  // 1. SELECTION SCREEN (QUIZ SETUP BENTO MODAL)
  if (quizType === null) {
    return (
      <div className="fixed inset-0 bg-stone-900/60 z-[100] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm">
        <div className="bg-[#FAF7F2] p-6 sm:p-8 rounded-3xl shadow-2xl max-w-xl w-full relative overflow-hidden border-2 border-[#A7D08C] text-center flex flex-col items-center max-h-[90vh] overflow-y-auto custom-scrollbar text-[#2E3E2B]">
          
          <button 
            type="button" 
            onClick={onClose} 
            className="absolute top-5 right-5 text-stone-400 hover:text-[#2E3E2B] p-2 rounded-full hover:bg-stone-200/50 transition-all cursor-pointer touch-manipulation active:scale-95" 
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 bg-[#EAF2E3] rounded-2xl flex items-center justify-center mb-4 text-[#4A7C39] border border-[#A7D08C]/40">
            <GraduationCap className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-display font-black text-[#2E3E2B] mb-1">
            Matcha Quiz & Sanctuary
          </h3>
          <p className="text-xs text-stone-600 mb-5 max-w-sm">
            Nâng tầm từ vựng và ngữ pháp IELTS với 3 chế độ kiểm tra chuyên sâu cùng Mascot Mát Cha!
          </p>

          {/* Topic Scope Selector */}
          <div className="w-full bg-white p-3.5 rounded-2xl border border-[#A7D08C]/30 mb-6 text-left shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-2">
              <span className="flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-[#4A7C39]" />
                <span>Chọn phạm vi từ vựng ôn tập:</span>
              </span>
              <span className="text-[#4A7C39] font-black text-[11px]">
                {activeVocabList.length} từ khả dụng
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedTopic(null)}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer touch-manipulation active:scale-95 flex items-center gap-1.5 ${
                  !selectedTopic || selectedTopic === 'All'
                    ? 'bg-[#4A7C39] text-white border-[#4A7C39] shadow-xs'
                    : 'bg-[#FAF7F2] hover:bg-[#EAF2E3] text-[#2E3E2B] border-[#A7D08C]/30'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Tất cả ({vocabList.length} từ)</span>
              </button>

              {availableTopics.map(([t, count]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTopic(t)}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer touch-manipulation active:scale-95 ${
                    selectedTopic?.toLowerCase() === t.toLowerCase()
                      ? 'bg-[#4A7C39] text-white border-[#4A7C39] shadow-xs'
                      : 'bg-[#FAF7F2] hover:bg-[#EAF2E3] text-[#2E3E2B] border-[#A7D08C]/30'
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
              className="p-4 rounded-2xl bg-white hover:bg-[#FDFBF7] border-2 border-[#A7D08C]/30 hover:border-[#4A7C39] text-left transition-all hover:scale-[1.01] active:scale-95 shadow-xs cursor-pointer group flex flex-col justify-between min-h-[105px]"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-[#EAF2E3] text-[#4A7C39] flex items-center justify-center group-hover:bg-[#4A7C39] group-hover:text-white transition-colors">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#2E3E2B] uppercase tracking-wider">
                    1. Nối Câu Sách Giáo Khoa
                  </h4>
                  <span className="text-[10px] font-bold text-[#4A7C39]">Cambridge Context</span>
                </div>
              </div>
              <p className="text-[11px] text-stone-600 leading-snug">
                Nối từ với câu dịch nghĩa chuẩn xác trong 3 câu ngữ cảnh học thuật.
              </p>
            </button>

            {/* Mode 2: Speech Pronunciation Drill */}
            <button
              type="button"
              onClick={() => startQuizWithQuestions('speech')}
              className="p-4 rounded-2xl bg-white hover:bg-[#F0FDF4] border-2 border-emerald-300 hover:border-emerald-600 text-left transition-all hover:scale-[1.01] active:scale-95 shadow-xs cursor-pointer group flex flex-col justify-between min-h-[105px]"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#2E3E2B] uppercase tracking-wider">
                    2. Luyện Đọc & Chấm Điểm Mic
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700">Speaking Reflex 0-100%</span>
                </div>
              </div>
              <p className="text-[11px] text-stone-600 leading-snug">
                Đọc to từ vào Micro, chấm điểm tức thì và có nút bỏ qua từ mới.
              </p>
            </button>

            {/* Mode 3: Enhanced Classic Vocab ABCD & Cloze */}
            <button
              type="button"
              onClick={() => startQuizWithQuestions('classic_vocab')}
              className="p-4 rounded-2xl bg-white hover:bg-[#FAF7F2] border-2 border-[#A7D08C]/40 hover:border-[#4A7C39] text-left transition-all hover:scale-[1.01] active:scale-95 shadow-xs cursor-pointer group flex flex-col justify-between min-h-[105px]"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-[#EAF2E3] text-[#4A7C39] flex items-center justify-center group-hover:bg-[#4A7C39] group-hover:text-white transition-colors">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#2E3E2B] uppercase tracking-wider">
                    3. Trắc Nghiệm & Điền Từ
                  </h4>
                  <span className="text-[10px] font-bold text-[#4A7C39]">Active Recall Xen Kẽ</span>
                </div>
              </div>
              <p className="text-[11px] text-stone-600 leading-snug">
                Trắc nghiệm 4 lựa chọn xen kẽ điền từ khuyết ngữ cảnh và giải thích chi tiết.
              </p>
            </button>

            {/* Mode 4: IELTS Grammar Sanctuary */}
            <button
              type="button"
              onClick={() => startQuizWithQuestions('grammar_sanctuary')}
              className="p-4 rounded-2xl bg-white hover:bg-[#FEFCE8] border-2 border-amber-300 hover:border-amber-500 text-left transition-all hover:scale-[1.01] active:scale-95 shadow-xs cursor-pointer group flex flex-col justify-between min-h-[105px]"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
                  <Languages className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#2E3E2B] uppercase tracking-wider">
                    4. Ngữ Pháp: Thì & Mạo Từ
                  </h4>
                  <span className="text-[10px] font-bold text-amber-700">Grammar Sanctuary</span>
                </div>
              </div>
              <p className="text-[11px] text-stone-600 leading-snug">
                Dòng thời gian 12 Thì, Cây quyết định mạo từ và luyện đề từ kho cá nhân.
              </p>
            </button>
          </div>

          {/* Mode 5: Spaced Repetition Review (Full Width) */}
          <button
            type="button"
            onClick={() => startQuizWithQuestions('srs')}
            className="w-full mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-[#2E5E26] to-[#1E4318] text-white font-bold text-left transition-all hover:scale-[1.01] active:scale-95 shadow-md cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <Brain className="w-5 h-5 shrink-0 text-emerald-300" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider">5. Ôn Tập SRS AI Spaced Repetition</p>
                <p className="text-[10px] font-medium opacity-90">Luyện Collocations C1 và khắc phục điểm yếu cá nhân</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 shrink-0 text-emerald-300" />
          </button>
        </div>
      </div>
    );
  }

  // 2. GRAMMAR MASTERY LAB SCREEN
  if (quizType === 'grammar_sanctuary') {
    return (
      <div className="fixed inset-0 bg-stone-900/60 z-[100] flex items-center justify-center p-3 sm:p-5 backdrop-blur-sm">
        <div className="bg-[#FAF7F2] rounded-3xl shadow-2xl max-w-5xl w-full p-4 sm:p-7 relative max-h-[92vh] overflow-y-auto custom-scrollbar border-2 border-[#A7D08C] text-[#2E3E2B]">
          <button
            type="button"
            onClick={() => setQuizType(null)}
            className="absolute top-5 right-5 text-stone-400 hover:text-[#2E3E2B] p-2 rounded-full hover:bg-stone-200/50 transition-all cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
          <GrammarMasteryLab vocabList={activeVocabList} onClose={() => setQuizType(null)} />
        </div>
      </div>
    );
  }

  // 3. LOADING SCREEN (SRS MODE)
  if (isLoadingSRS) {
    return (
      <div className="fixed inset-0 bg-stone-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-[#FAF7F2] p-8 rounded-3xl shadow-2xl text-center border-2 border-[#A7D08C] max-w-sm w-full flex flex-col items-center text-[#2E3E2B]">
          <Loader2 className="w-10 h-10 text-[#4A7C39] animate-spin mb-3" />
          <p className="text-sm font-bold text-[#2E3E2B] animate-pulse">
            AI đang pha chế bài tập SRS từ kho từ vựng của bạn...
          </p>
        </div>
      </div>
    );
  }

  // 4. QUESTIONS CONTAINER SCREEN
  const current = activeQuestions[currentIndex];

  // Helper cloze sentence computed for current word
  const currentCloze = (() => {
    if (!current) return { sentenceWithBlank: '', fullSentence: '', translation: '' };
    const word = current.word.trim();
    const meaning = current.meaning.trim();
    
    if (current.example && current.example.trim().length > 15) {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      if (regex.test(current.example)) {
        return {
          sentenceWithBlank: current.example.replace(regex, '_______'),
          fullSentence: current.example,
          translation: `Ngữ cảnh học thuật mang nghĩa: ${meaning}`
        };
      }
      const stem = word.length > 4 ? word.slice(0, word.length - 2) : word;
      const stemEscaped = stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const stemRegex = new RegExp(`\\b${stemEscaped}\\w*\\b`, 'gi');
      if (stemRegex.test(current.example)) {
        return {
          sentenceWithBlank: current.example.replace(stemRegex, '_______'),
          fullSentence: current.example,
          translation: `Ngữ cảnh học thuật mang nghĩa: ${meaning}`
        };
      }
      return {
        sentenceWithBlank: `The lecturer emphasized that students should _______ this concept in their essays.`,
        fullSentence: `The lecturer emphasized that students should ${word} this concept in their essays.`,
        translation: `Giảng viên nhấn mạnh rằng sinh viên nên ${meaning} khái niệm này trong bài luận.`
      };
    }
    
    return {
      sentenceWithBlank: `The policy was formulated to _______ long-term sustainable growth.`,
      fullSentence: `The policy was formulated to ${word} long-term sustainable growth.`,
      translation: `Chính sách được đề ra nhằm ${meaning} tăng trưởng bền vững lâu dài.`
    };
  })();

  return (
    <div className="fixed inset-0 bg-stone-900/60 z-[100] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm">
      <div className="bg-[#FAF7F2] rounded-3xl shadow-2xl max-w-2xl sm:max-w-3xl w-full relative flex flex-col max-h-[92vh] border-2 border-[#A7D08C] overflow-hidden text-[#2E3E2B]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#A7D08C]/30 shrink-0 bg-[#F4EFE6]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-[#4A7C39] uppercase tracking-widest bg-[#EAF2E3] px-3 py-1 rounded-full border border-[#A7D08C]/40">
              {quizType === 'textbook' ? 'Sách Giáo Khoa' :
               quizType === 'speech' ? 'Luyện Đọc Mic' :
               quizType === 'classic_vocab' ? (activeClassicMode === 'ABCD' ? 'Trắc Nghiệm' : 'Điền Từ') :
               'Ôn Tập SRS AI'}
            </span>
            <span className="text-xs font-bold text-stone-500">
              {currentIndex + 1} / {activeQuestions.length}
            </span>
            {isDoingRetryRound && (
              <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full uppercase border border-amber-200">
                Vòng ôn từ đã bỏ qua
              </span>
            )}
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="text-stone-400 hover:text-[#2E3E2B] p-1.5 rounded-full hover:bg-stone-200/50 transition-all cursor-pointer" 
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div 
          className="p-5 sm:p-7 overflow-y-auto custom-scrollbar flex-1 bg-[#FAF7F2] pb-10"
          style={{ overscrollBehavior: 'contain' }}
        >
          <AnimatePresence mode="wait">
            {!isFinished ? (
              <motion.div
                key={`${quizType}-${currentIndex}-${isDoingRetryRound}-${activeClassicMode}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="w-full space-y-4"
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
                    onSkip={handleNextQuestion}
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

                {/* 3. CLASSIC VOCAB INTERLEAVED (ABCD MEANING + ACTIVE RECALL FILL-IN) */}
                {quizType === 'classic_vocab' && current && (
                  <div className="space-y-4">
                    {/* Question Type Indicator Badge */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-[#4A7C39] bg-[#EAF2E3] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 border border-[#A7D08C]/40">
                        {activeClassicMode === 'ABCD' ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            <span>Trắc nghiệm 4 lựa chọn: Chọn nghĩa tiếng Việt đúng</span>
                          </>
                        ) : (
                          <>
                            <PenTool className="w-3.5 h-3.5 shrink-0" />
                            <span>Điền từ tiếng Anh: Active Recall từ vựng</span>
                          </>
                        )}
                      </span>
                      {current.topic && (
                        <span className="text-[11px] font-bold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">
                          {current.topic}
                        </span>
                      )}
                    </div>

                    {/* DẠNG 1: TRẮC NGHIỆM ABCD (HỎI NGHĨA TIẾNG VIỆT CỦA TỪ TIẾNG ANH) */}
                    {activeClassicMode === 'ABCD' ? (
                      <div className="space-y-4">
                        {/* Target English Word Card */}
                        <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-[#A7D08C]/40 shadow-xs text-center space-y-2">
                          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                            Nghĩa tiếng Việt chuẩn xác nhất của từ vựng này là gì?
                          </p>

                          <div className="flex items-center justify-center gap-3">
                            <h3 className="text-2xl sm:text-3xl font-display font-black text-[#2E3E2B]">
                              {current.word}
                            </h3>
                            <button
                              type="button"
                              onClick={() => playAudio(current.word)}
                              className="p-1.5 rounded-full hover:bg-[#EAF2E3] text-[#4A7C39] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                              title="Nghe phát âm"
                            >
                              <Volume2 className="w-5 h-5 shrink-0" />
                            </button>
                          </div>

                          {current.phonetic && (
                            <p className="text-xs font-mono text-stone-500">{current.phonetic}</p>
                          )}
                        </div>

                        {/* 4 Vietnamese Meaning Options (A, B, C, D) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {meaningOptions.map((optMeaning, i) => {
                            const isCorrect = optMeaning.trim().toLowerCase() === current.meaning.trim().toLowerCase();
                            const isSelected = userSelectedOption?.trim().toLowerCase() === optMeaning.trim().toLowerCase();

                            let btnStyle = "bg-white hover:bg-[#F0FDF4] hover:border-[#4A7C39] border-2 border-[#A7D08C]/30 text-[#2E3E2B]";
                            if (feedback) {
                              if (isCorrect) {
                                btnStyle = "bg-[#DCFCE7] border-[#22C55E] text-[#14532D] font-black ring-2 ring-[#22C55E]/40";
                              } else if (isSelected && !isCorrect) {
                                btnStyle = "bg-[#FEE2E2] border-[#EF4444] text-[#991B1B] font-bold opacity-85";
                              } else {
                                btnStyle = "bg-stone-50 border-stone-200 text-stone-400 opacity-50";
                              }
                            }

                            return (
                              <button
                                key={i}
                                type="button"
                                disabled={feedback !== null}
                                onClick={() => handleAnswerClassic(optMeaning)}
                                className={`p-3.5 rounded-2xl border-2 font-bold text-left transition-all flex items-center justify-between cursor-pointer min-h-[56px] shadow-xs ${btnStyle}`}
                              >
                                <span className="text-sm flex items-center gap-2.5">
                                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                    feedback && isCorrect ? 'bg-[#22C55E] text-white' : 'bg-[#EAF2E3] text-[#4A7C39]'
                                  }`}>
                                    {String.fromCharCode(65 + i)}
                                  </span>
                                  <span className="font-sans leading-snug">{optMeaning}</span>
                                </span>
                                {feedback && isCorrect && <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />}
                                {feedback && isSelected && !isCorrect && <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0" />}
                              </button>
                            );
                          })}
                        </div>

                        {/* Skip Question Button */}
                        {!feedback && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={handleNextQuestion}
                              className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold text-stone-500 hover:text-[#2E3E2B] hover:bg-stone-200/50 transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation active:scale-95"
                            >
                              <SkipForward className="w-4 h-4 text-amber-700 shrink-0" />
                              <span>Bỏ qua câu này (Chuyển sang từ khác)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* DẠNG 2: ĐIỀN TỪ (GÕ TỪ TIẾNG ANH KHI BIẾT NGHĨA TIẾNG VIỆT) */
                      <div className="space-y-4">
                        <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-[#A7D08C]/40 shadow-xs space-y-3">
                          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                            Từ tiếng Anh nào mang ý nghĩa sau đây?
                          </p>

                          {/* Prominent Vietnamese Meaning */}
                          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#A7D08C]/30 text-center">
                            <h3 className="text-xl sm:text-2xl font-bold text-[#4A7C39]">
                              "{current.meaning}"
                            </h3>
                          </div>

                          {/* Cloze Academic Context Sentence if available */}
                          <div className="space-y-1 pt-1">
                            <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5 text-[#4A7C39]" />
                              <span>Ngữ cảnh học thuật (câu khuyết từ):</span>
                            </span>
                            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-[#2E3E2B] font-serif text-sm leading-relaxed font-semibold">
                              "{currentCloze.sentenceWithBlank}"
                            </div>
                          </div>

                          {/* Word Hint (Letters count & First/Last characters) */}
                          <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                            <span className="text-stone-600 font-medium flex items-center gap-1.5">
                              <span className="text-[#4A7C39] font-black">Gợi ý ký tự:</span>
                              <span className="font-mono bg-stone-100 px-2.5 py-1 rounded-md font-bold text-[#2E3E2B] tracking-widest">
                                {getWordHint(current.word)}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Input Field & Submit Button */}
                        <div className="space-y-3">
                          <input
                            type="text"
                            autoFocus
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && userInput.trim() && handleAnswerClassic(userInput)}
                            placeholder="Gõ từ tiếng Anh cần điền..."
                            disabled={feedback !== null}
                            className="w-full min-h-[50px] px-4 py-3 rounded-2xl border-2 border-[#A7D08C] text-center font-bold text-lg outline-none focus:border-[#4A7C39] bg-white text-[#2E3E2B] shadow-inner placeholder:text-stone-400 placeholder:font-normal placeholder:text-sm"
                          />

                          {!feedback && (
                            <div className="flex flex-col sm:flex-row items-center gap-2">
                              <button
                                type="button"
                                disabled={!userInput.trim()}
                                onClick={() => handleAnswerClassic(userInput)}
                                className="w-full min-h-[46px] bg-[#4A7C39] disabled:bg-stone-300 text-white rounded-full font-black text-sm shadow-md hover:bg-[#3B642D] transition-all cursor-pointer flex items-center justify-center gap-2"
                              >
                                <span>Xác nhận đáp án</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={handleNextQuestion}
                                className="w-full sm:w-auto min-h-[44px] px-4 rounded-full text-xs font-bold text-stone-500 hover:text-[#2E3E2B] hover:bg-stone-200/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                              >
                                <SkipForward className="w-4 h-4 text-amber-700 shrink-0" />
                                <span>Bỏ qua</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* BẢNG GIẢI THÍCH CHI TIẾT & ĐÁP ÁN ĐÚNG/SAI */}
                    {feedback && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3 pt-2"
                      >
                        {/* 1. Status Banner */}
                        {feedback === 'correct' ? (
                          <div className="bg-[#DCFCE7] border-2 border-[#22C55E] text-[#14532D] p-3.5 sm:p-4 rounded-2xl flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-[#22C55E] text-white flex items-center justify-center shrink-0 shadow-xs">
                                <CheckCircle2 className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-black text-sm text-[#14532D]">Chính xác! Xuất sắc!</p>
                                <p className="text-xs text-[#166534]">
                                  {activeClassicMode === 'ABCD'
                                    ? `"${current.word}" mang nghĩa là "${current.meaning}".`
                                    : `Bạn đã nhớ chính xác từ vựng "${current.word}".`}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-black bg-[#16A34A] text-white px-3 py-1 rounded-full shadow-xs">+1 Điểm</span>
                          </div>
                        ) : (
                          <div className="bg-[#FEE2E2] border-2 border-[#EF4444] text-[#991B1B] p-3.5 sm:p-4 rounded-2xl flex items-start gap-2.5 shadow-xs">
                            <div className="w-9 h-9 rounded-xl bg-[#EF4444] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                              <AlertCircle className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-black text-sm text-[#991B1B]">Chưa chính xác!</p>
                              <div className="text-xs text-[#7F1D1D] mt-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span>Từ vựng:</span>
                                  <span className="font-black text-sm text-[#15803D] bg-white px-2.5 py-0.5 rounded-lg border border-[#A7D08C] shadow-xs">
                                    {current.word}
                                  </span>
                                  <span>- Định nghĩa:</span>
                                  <span className="font-bold text-[#15803D]">"{current.meaning}"</span>
                                </div>
                                {activeClassicMode === 'ABCD' && userSelectedOption && (
                                  <p className="text-stone-500 text-[11px]">
                                    (Bạn đã chọn: <span className="line-through text-[#DC2626] font-medium">{userSelectedOption}</span>)
                                  </p>
                                )}
                                {activeClassicMode === 'FILL_IN' && userInput && (
                                  <p className="text-stone-500 text-[11px]">
                                    (Bạn đã nhập: <span className="line-through text-[#DC2626] font-medium">{userInput}</span>)
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 2. Bento Box Giải thích học thuật chuyên sâu */}
                        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-[#A7D08C]/40 shadow-xs space-y-3.5">
                          {/* Pronunciation & Audio */}
                          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xl font-display font-black text-[#2E3E2B]">
                                  {current.word}
                                </h4>
                                {current.phonetic && (
                                  <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                                    {current.phonetic}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-bold text-[#4A7C39] mt-0.5">
                                Định nghĩa: <span className="font-normal text-stone-800">{current.meaning}</span>
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => playAudio(current.word)}
                              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#EAF2E3] hover:bg-[#A7D08C] text-[#2E3E2B] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                              <Volume2 className="w-4 h-4 text-[#4A7C39]" />
                              <span>Phát âm</span>
                            </button>
                          </div>

                          {/* IELTS Academic Sentence Analysis */}
                          <div className="space-y-1.5 text-xs">
                            <span className="font-black text-[#2E3E2B] flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-stone-500">
                              <BookOpen className="w-3.5 h-3.5 text-[#4A7C39]" />
                              <span>Ngữ cảnh học thuật & Câu ví dụ:</span>
                            </span>
                            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#A7D08C]/20 text-stone-800 font-serif leading-relaxed text-sm font-medium">
                              {currentCloze.fullSentence}
                            </div>
                            <p className="text-stone-600 text-xs italic pl-1">
                              Dịch: {currentCloze.translation}
                            </p>
                          </div>

                          {/* Memory Hook / Collocation if present */}
                          {current.memory_hook && (
                            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <strong className="text-amber-800">Mẹo nhớ nhanh:</strong> {current.memory_hook}
                              </div>
                            </div>
                          )}

                          {/* Nút Chuyển Câu Tiếp Theo */}
                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={handleNextQuestion}
                              className="w-full sm:w-auto min-h-[46px] bg-[#4A7C39] text-white px-8 py-2.5 rounded-full font-black text-sm shadow-md hover:bg-[#3B642D] transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation active:scale-95"
                            >
                              <span>Câu tiếp theo</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* 4. SRS AI MODE */}
                {quizType === 'srs' && current && (
                  <div className="space-y-4">
                    <div className="bg-white p-5 rounded-2xl border-2 border-[#A7D08C]/40 shadow-xs">
                      <p className="text-sm font-bold text-[#2E3E2B] text-center leading-relaxed">
                        {current.question}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {(current.options || []).map((opt: string, i: number) => {
                        const isCorrect = cleanOptionText(opt).toLowerCase() === cleanOptionText(current.correct_answer || '').toLowerCase();
                        let btnStyle = "bg-white hover:bg-[#F0FDF4] border-2 border-[#A7D08C]/30 text-[#2E3E2B]";
                        if (feedback) {
                          if (isCorrect) btnStyle = "bg-[#DCFCE7] border-[#22C55E] text-[#14532D] font-black shadow-xs ring-2 ring-[#22C55E]/40";
                          else if (feedback === 'wrong') btnStyle = "bg-[#FEE2E2] border-[#EF4444] text-[#991B1B] font-bold opacity-75";
                        }
                        return (
                          <button
                            key={i}
                            type="button"
                            disabled={feedback !== null}
                            onClick={() => handleAnswerClassic(opt)}
                            className={`p-3.5 rounded-2xl border-2 font-bold text-left transition-all flex items-center justify-between cursor-pointer min-h-[50px] shadow-xs ${btnStyle}`}
                          >
                            <span className="text-sm font-semibold">{cleanOptionText(opt)}</span>
                            {feedback && isCorrect && <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    {feedback && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={handleNextQuestion}
                          className="min-h-[44px] bg-[#4A7C39] text-white px-7 py-2.5 rounded-full font-bold shadow-md hover:bg-[#3B642D] transition-all flex items-center gap-2 cursor-pointer"
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
                <div className="w-16 h-16 bg-[#EAF2E3] border border-[#A7D08C]/40 rounded-full flex items-center justify-center mx-auto text-[#4A7C39]">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-display font-black text-[#2E3E2B]">
                  Hoàn thành phiên ôn tập!
                </h3>
                <p className="text-sm font-bold text-stone-600">
                  Điểm số đạt được: <strong className="text-[#4A7C39] text-lg font-black">{score}</strong> / {activeQuestions.length}
                </p>

                <div className="flex justify-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setQuizType(null)}
                    className="min-h-[44px] bg-[#4A7C39] text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:bg-[#3B642D] transition-all cursor-pointer text-xs"
                  >
                    Chọn phần thi khác
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-[44px] bg-stone-700 text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:bg-stone-800 transition-all cursor-pointer text-xs"
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
