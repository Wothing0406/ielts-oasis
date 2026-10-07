"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Languages, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  GraduationCap, 
  Target, 
  ChevronRight, 
  RotateCcw,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Check,
  GitBranch,
  XCircle,
  HelpCircle as QuestionIcon
} from 'lucide-react';
import { 
  TENSE_LESSONS, 
  ARTICLE_LESSONS, 
  generateVaultInfusedExercises, 
  GrammarExercise 
} from '@/data/grammarLessons';

interface VocabItem {
  id?: number;
  word: string;
  meaning: string;
  phonetic?: string;
  topic?: string;
}

interface Props {
  vocabList: VocabItem[];
  onClose?: () => void;
}

export default function GrammarMasteryLab({ vocabList, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'tenses' | 'articles' | 'drills'>('drills');
  const [selectedTenseId, setSelectedTenseId] = useState<string>('past_simple');
  const [selectedArticleId, setSelectedArticleId] = useState<string>('the_definite');

  // Interactive Decision Tree State for Articles
  const [isSpecific, setIsSpecific] = useState<boolean | null>(null);
  const [isCountable, setIsCountable] = useState<boolean | null>(null);
  const [isPlural, setIsPlural] = useState<boolean | null>(null);

  // Drill State
  const drills: GrammarExercise[] = useMemo(() => {
    return generateVaultInfusedExercises(vocabList);
  }, [vocabList]);

  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
  const [drillAnswer, setDrillAnswer] = useState<string | null>(null);
  const [drillScore, setDrillScore] = useState(0);
  const [isDrillFinished, setIsDrillFinished] = useState(false);

  const currentDrill = drills[currentDrillIndex];

  const handleSelectDrillAnswer = (option: string) => {
    if (drillAnswer !== null) return;
    setDrillAnswer(option);
    if (option.toLowerCase() === currentDrill.correct_answer.toLowerCase()) {
      setDrillScore(prev => prev + 1);
    }
  };

  const nextDrill = () => {
    setDrillAnswer(null);
    if (currentDrillIndex < drills.length - 1) {
      setCurrentDrillIndex(prev => prev + 1);
    } else {
      setIsDrillFinished(true);
    }
  };

  const resetDrill = () => {
    setCurrentDrillIndex(0);
    setDrillAnswer(null);
    setDrillScore(0);
    setIsDrillFinished(false);
  };

  const activeTense = TENSE_LESSONS.find(t => t.id === selectedTenseId) || TENSE_LESSONS[0];
  const activeArticle = ARTICLE_LESSONS.find(a => a.id === selectedArticleId) || ARTICLE_LESSONS[0];

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-primary/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-xs">
            <Languages className="w-5 h-5 shrink-0 stroke-[1.8]" />
          </div>
          <div>
            <h2 className="text-lg font-display font-black text-accent dark:text-amber-100">
              Matcha Grammar Sanctuary
            </h2>
            <p className="text-xs text-accent/60 dark:text-neutral-400">
              Chuyên sâu 12 Thì & Mạo từ chuẩn Cambridge IELTS GRA Band 7.5+
            </p>
          </div>
        </div>

        <div className="flex items-center bg-secondary/80 dark:bg-neutral-800 p-1.5 rounded-2xl gap-1 w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('drills')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer touch-manipulation active:scale-95 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'drills'
                ? 'bg-primary text-white shadow-sm'
                : 'text-accent/70 hover:text-accent dark:text-neutral-300'
            }`}
          >
            <Target className="w-3.5 h-3.5 shrink-0 stroke-2" />
            <span>Luyện tập Đề thi ({drills.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tenses')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer touch-manipulation active:scale-95 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'tenses'
                ? 'bg-primary text-white shadow-sm'
                : 'text-accent/70 hover:text-accent dark:text-neutral-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0 stroke-2" />
            <span>12 Thì IELTS</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('articles')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer touch-manipulation active:scale-95 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'articles'
                ? 'bg-primary text-white shadow-sm'
                : 'text-accent/70 hover:text-accent dark:text-neutral-300'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 shrink-0 stroke-2" />
            <span>Mạo từ & Sơ đồ</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DRILLS (LUYỆN TẬP TƯƠNG TÁC DỰA VÀO KHO TỪ VỰNG) */}
      {activeTab === 'drills' && (
        <div className="space-y-5">
          {!isDrillFinished ? (
            <div className="bg-white dark:bg-neutral-800 rounded-3xl p-5 sm:p-6 border-2 border-primary/20 shadow-sm space-y-5">
              {/* Drill Header */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span>{currentDrill.category === 'tenses' ? 'Chia Thì Động Từ Task 1/2' : 'Luyện Mạo Từ (a / an / the / Ø)'}</span>
                </span>
                <span className="text-xs font-bold text-accent/50 dark:text-neutral-400">
                  Câu {currentDrillIndex + 1} / {drills.length}
                </span>
              </div>

              {/* Title & Prompt */}
              <div>
                <h3 className="text-base sm:text-lg font-display font-black text-accent dark:text-amber-100">
                  {currentDrill.title}
                </h3>
                <p className="text-xs font-medium text-accent/70 dark:text-neutral-300 mt-1">
                  {currentDrill.prompt}
                </p>
              </div>

              {/* Sentence with Highlighted Blank */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 dark:bg-neutral-700/50 border border-primary/15 font-serif text-base sm:text-lg leading-relaxed text-accent dark:text-neutral-100 text-center">
                {currentDrill.sentence_with_blank.split(/(\[ _{3,} \]|\[ _____ \])/g).map((part, i) => {
                  if (part.includes('___')) {
                    return (
                      <span
                        key={i}
                        className="inline-block mx-1.5 px-4 py-0.5 bg-amber-200 text-amber-950 font-sans font-black rounded-lg border-2 border-dashed border-amber-400 align-middle text-sm"
                      >
                        {drillAnswer ? drillAnswer : '_______'}
                      </span>
                    );
                  }
                  return <span key={i}>{part}</span>;
                })}
              </div>

              {/* Options - Quick Tap 4 Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {currentDrill.options.map((option, i) => {
                  const isSelected = drillAnswer === option;
                  const isCorrect = option.toLowerCase() === currentDrill.correct_answer.toLowerCase();

                  let btnStyle = "bg-secondary/60 hover:bg-primary/10 border-primary/20 text-accent dark:text-neutral-200";
                  if (drillAnswer !== null) {
                    if (isCorrect) {
                      btnStyle = "bg-emerald-600 text-white border-emerald-600 font-black shadow-md";
                    } else if (isSelected && !isCorrect) {
                      btnStyle = "bg-rose-100 text-rose-800 border-rose-300 opacity-60";
                    } else {
                      btnStyle = "opacity-40 border-black/5";
                    }
                  }

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={drillAnswer !== null}
                      onClick={() => handleSelectDrillAnswer(option)}
                      className={`min-h-[50px] p-3 rounded-2xl border-2 font-bold text-center transition-all cursor-pointer touch-manipulation active:scale-95 flex items-center justify-center gap-2 text-sm ${btnStyle}`}
                    >
                      <span className="font-mono text-base">{option}</span>
                      {drillAnswer !== null && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Pedagogical Feedback */}
              {drillAnswer !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl border ${
                    drillAnswer.toLowerCase() === currentDrill.correct_answer.toLowerCase()
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-950 dark:text-emerald-100'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-950 dark:text-rose-100'
                  } space-y-2`}
                >
                  <div className="flex items-center gap-2 font-black text-sm">
                    {drillAnswer.toLowerCase() === currentDrill.correct_answer.toLowerCase() ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Chính xác tuyệt đối!</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span>Đáp án đúng là: "{currentDrill.correct_answer}"</span>
                      </>
                    )}
                  </div>

                  <p className="text-xs leading-relaxed font-medium">
                    {currentDrill.explanation}
                  </p>

                  <div className="pt-1 text-[11px] font-bold text-primary flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 shrink-0" />
                    <span>Mẹo IELTS Band 8.0: {currentDrill.ielts_tip}</span>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={nextDrill}
                      className="min-h-[44px] bg-primary text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-primary-dark transition-all flex items-center gap-2 cursor-pointer touch-manipulation active:scale-95 text-xs sm:text-sm"
                    >
                      <span>Câu tiếp theo</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            /* Finished Summary */
            <div className="p-8 rounded-3xl bg-white dark:bg-neutral-800 border-2 border-primary/20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <Sparkles className="w-8 h-8 shrink-0" />
              </div>
              <h3 className="text-2xl font-display font-black text-accent dark:text-amber-100">
                Hoàn thành phần Luyện tập Ngữ pháp!
              </h3>
              <p className="text-sm font-semibold text-accent/70 dark:text-neutral-300">
                Điểm số của bạn: <strong className="text-primary text-xl">{drillScore} / {drills.length}</strong> câu chính xác.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={resetDrill}
                  className="min-h-[44px] bg-primary text-white px-8 py-2.5 rounded-full font-bold shadow-md hover:bg-primary-dark transition-all inline-flex items-center gap-2 cursor-pointer touch-manipulation active:scale-95 text-sm"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>Luyện tập lại vòng mới</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 12 THÌ ĐỘNG TỪ IELTS (INTERACTIVE TIMELINE) */}
      {activeTab === 'tenses' && (
        <div className="space-y-6">
          {/* Timeline Visual Bar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-neutral-800 border-2 border-primary/20 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                Trục Dòng Thời Gian IELTS (Interactive Timeline)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {TENSE_LESSONS.map((tense) => (
                <button
                  key={tense.id}
                  type="button"
                  onClick={() => setSelectedTenseId(tense.id)}
                  className={`min-h-[52px] p-3 rounded-2xl border-2 text-left transition-all cursor-pointer touch-manipulation active:scale-95 ${
                    selectedTenseId === tense.id
                      ? 'bg-primary text-white border-primary shadow-md'
                      : 'bg-secondary/40 hover:bg-primary/10 border-primary/10 text-accent dark:text-neutral-300'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase opacity-80">
                    {tense.timeline_position}
                  </div>
                  <div className="text-xs font-black truncate mt-0.5">
                    {tense.title.split(' ')[0]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Tense Detail Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-neutral-800 border-2 border-primary/20 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 dark:border-white/5 pb-3">
              <div>
                <h3 className="text-xl font-display font-black text-accent dark:text-amber-100">
                  {activeTense.vietnameseTitle}
                </h3>
                <p className="text-xs font-mono text-primary font-bold mt-1">
                  Công thức: {activeTense.formula}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-medium leading-relaxed text-accent/80 dark:text-neutral-300">
              {activeTense.rule_summary}
            </p>

            {/* IELTS Real Application */}
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-neutral-700/50 border border-amber-200/60 space-y-1.5">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Ứng dụng thực chiến trong phòng thi IELTS:</span>
              </span>
              <p className="text-xs text-amber-950 dark:text-neutral-200 leading-relaxed">
                {activeTense.ielts_application}
              </p>
            </div>

            {/* Cambridge IELTS Benchmark Examples */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-accent/70 dark:text-neutral-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 shrink-0 text-primary" />
                <span>Câu văn mẫu IELTS Band 8.0+ thực tế:</span>
              </h4>
              {activeTense.academic_examples.map((ex, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-secondary/30 dark:bg-neutral-700/30 border border-primary/10 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                      {ex.task_type} • {ex.band_score}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-serif font-bold text-accent dark:text-neutral-100">
                    "{ex.sentence}"
                  </p>
                  <p className="text-[11px] text-accent/70 dark:text-neutral-400 flex items-start gap-1">
                    <span className="font-bold text-primary shrink-0">• Phân tích:</span>
                    <span>{ex.analysis}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* Pitfalls */}
            <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 space-y-1.5 text-xs text-rose-900 dark:text-rose-200">
              <span className="font-bold flex items-center gap-1.5 text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Bẫy lỗi sai thí sinh Việt Nam hay gặp:</span>
              </span>
              <ul className="list-disc list-inside space-y-1 pl-1">
                {activeTense.common_pitfalls.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MẠO TỪ & CÂY QUYẾT ĐỊNH (ARTICLE DECISION TREE) */}
      {activeTab === 'articles' && (
        <div className="space-y-6">
          {/* Decision Tree Interactive Wizard */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-neutral-800 border-2 border-primary/20 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary shrink-0" />
              <h3 className="text-base font-display font-black text-accent dark:text-amber-100">
                Sơ Đồ Quyết Định Mạo Từ 3 Bước (Decision Flow)
              </h3>
            </div>
            <p className="text-xs text-accent/70 dark:text-neutral-300">
              Trả lời 3 câu hỏi nhanh dưới đây để biết chính xác bạn cần dùng <strong>a</strong>, <strong>an</strong>, <strong>the</strong> hay <strong>Ø (không mạo từ)</strong>:
            </p>

            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-secondary/40 dark:bg-neutral-700/40 border border-primary/10 space-y-3">
              <p className="text-xs font-bold text-accent dark:text-neutral-200 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                <span>Danh từ này người nghe/đọc đã biết cụ thể là cái nào chưa? (Đã xác định, duy nhất hoặc có "of / who / which" phía sau chưa?)</span>
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setIsSpecific(true)}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer touch-manipulation active:scale-95 flex items-center gap-1.5 ${
                    isSpecific === true ? 'bg-primary text-white shadow-sm' : 'bg-white dark:bg-neutral-800 border border-primary/20 text-accent dark:text-neutral-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Đã xác định rõ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSpecific(false)}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer touch-manipulation active:scale-95 flex items-center gap-1.5 ${
                    isSpecific === false ? 'bg-primary text-white shadow-sm' : 'bg-white dark:bg-neutral-800 border border-primary/20 text-accent dark:text-neutral-200'
                  }`}
                >
                  <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>Chưa xác định / Nói chung chung</span>
                </button>
              </div>
            </div>

            {/* Specific Result */}
            {isSpecific === true && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100 space-y-1 text-xs"
              >
                <div className="flex items-center gap-1.5 text-base font-black text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>KẾT LUẬN: BẮT BUỘC DÙNG "THE"</span>
                </div>
                <p>Ví dụ: <strong>The</strong> proportion of water, <strong>the</strong> environment, <strong>the</strong> students who passed.</p>
              </motion.div>
            )}

            {/* Step 2 if not specific */}
            {isSpecific === false && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-secondary/40 dark:bg-neutral-700/40 border border-primary/10 space-y-3"
              >
                <p className="text-xs font-bold text-accent dark:text-neutral-200 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                  <span>Danh từ này đếm được (Countable) hay KHÔNG đếm được (Uncountable)?</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCountable(true)}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer touch-manipulation active:scale-95 ${
                      isCountable === true ? 'bg-primary text-white shadow-sm' : 'bg-white dark:bg-neutral-800 border border-primary/20 text-accent dark:text-neutral-200'
                    }`}
                  >
                    Đếm được (car, student, policy)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCountable(false)}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer touch-manipulation active:scale-95 ${
                      isCountable === false ? 'bg-primary text-white shadow-sm' : 'bg-white dark:bg-neutral-800 border border-primary/20 text-accent dark:text-neutral-200'
                    }`}
                  >
                    Không đếm được (water, education, pollution)
                  </button>
                </div>
              </motion.div>
            )}

            {/* Uncountable Result */}
            {isSpecific === false && isCountable === false && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100 space-y-1 text-xs"
              >
                <div className="flex items-center gap-1.5 text-base font-black text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>KẾT LUẬN: DÙNG ZERO ARTICLE "Ø" (KHÔNG MẠO TỪ)</span>
                </div>
                <p>Ví dụ: <strong>Ø</strong> Education is essential, <strong>Ø</strong> pollution causes harm. (Tuyệt đối không dùng "the").</p>
              </motion.div>
            )}

            {/* Step 3 if countable */}
            {isSpecific === false && isCountable === true && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-secondary/40 dark:bg-neutral-700/40 border border-primary/10 space-y-3"
              >
                <p className="text-xs font-bold text-accent dark:text-neutral-200 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black shrink-0">3</span>
                  <span>Danh từ này là Số ít (Singular) hay Số nhiều (Plural)?</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPlural(false)}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer touch-manipulation active:scale-95 ${
                      isPlural === false ? 'bg-primary text-white shadow-sm' : 'bg-white dark:bg-neutral-800 border border-primary/20 text-accent dark:text-neutral-200'
                    }`}
                  >
                    Số ít (a solution, an issue)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPlural(true)}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer touch-manipulation active:scale-95 ${
                      isPlural === true ? 'bg-primary text-white shadow-sm' : 'bg-white dark:bg-neutral-800 border border-primary/20 text-accent dark:text-neutral-200'
                    }`}
                  >
                    Số nhiều (solutions, issues)
                  </button>
                </div>
              </motion.div>
            )}

            {/* Countable Singular / Plural Results */}
            {isSpecific === false && isCountable === true && isPlural === false && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100 space-y-1 text-xs"
              >
                <div className="flex items-center gap-1.5 text-base font-black text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>KẾT LUẬN: DÙNG "A" HOẶC "AN"</span>
                </div>
                <p>Bắt đầu bằng nguyên âm dùng <strong>an</strong> (an opportunity), bắt đầu bằng phụ âm dùng <strong>a</strong> (a sustainable approach).</p>
              </motion.div>
            )}

            {isSpecific === false && isCountable === true && isPlural === true && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100 space-y-1 text-xs"
              >
                <div className="flex items-center gap-1.5 text-base font-black text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>KẾT LUẬN: DÙNG ZERO ARTICLE "Ø" (KHÔNG MẠO TỪ)</span>
                </div>
                <p>Ví dụ: <strong>Ø</strong> Electric vehicles are cleaner, <strong>Ø</strong> students should practice daily.</p>
              </motion.div>
            )}
          </div>

          {/* Golden Rules Accordions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-accent/70 dark:text-neutral-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Chi tiết 3 Quy Tắc Mạo Từ Cốt Tử:</span>
            </h4>
            {ARTICLE_LESSONS.map((art) => (
              <div
                key={art.id}
                className="p-5 rounded-2xl bg-white dark:bg-neutral-800 border-2 border-primary/15 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-display font-black text-accent dark:text-amber-100">
                    {art.vietnameseTitle}
                  </h4>
                  <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                    {art.formula}
                  </span>
                </div>
                <p className="text-xs text-accent/80 dark:text-neutral-300 leading-relaxed">
                  {art.rule_summary}
                </p>
                <div className="p-3 bg-secondary/30 dark:bg-neutral-700/40 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-primary">Ví dụ Task 1/2:</span>
                  <p className="font-serif italic text-accent dark:text-neutral-200">
                    "{art.academic_examples[0]?.sentence}"
                  </p>
                  <p className="text-[11px] text-accent/70 dark:text-neutral-400 flex items-start gap-1">
                    <span className="font-bold text-primary shrink-0">• Phân tích:</span>
                    <span>{art.academic_examples[0]?.analysis}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
