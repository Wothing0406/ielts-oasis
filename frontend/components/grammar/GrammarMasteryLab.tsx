"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Languages, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Target, 
  RotateCcw,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  GitBranch,
  XCircle,
  Layers,
  PenTool,
  MoveHorizontal,
  AlertTriangle,
  RefreshCw,
  FileText,
  UploadCloud,
  ChevronRight,
  Lightbulb
} from 'lucide-react';

import { 
  GRAMMAR_TOPICS, 
  ALL_GRAMMAR_LESSONS, 
  GrammarLesson, 
  GrammarDrill, 
  STATIC_DRILLS,
  generateVaultInfusedExercises,
  GrammarTopicMeta
} from '@/data/grammarLessons';

import InteractiveGrammarCard, { ExerciseItem } from './mechanics/InteractiveGrammarCard';

interface VocabItem {
  id?: number;
  word: string;
  meaning: string;
  phonetic?: string;
  topic?: string;
}

interface Props {
  vocabList?: VocabItem[];
  onClose?: () => void;
}

type MainMode = 'taxonomy' | 'vault_drills' | 'custom_ai' | 'mirror_errors';

export default function GrammarMasteryLab({ vocabList = [], onClose }: Props) {
  // Main Navigation Modes
  const [activeMode, setActiveMode] = useState<MainMode>('taxonomy');

  // Mode 1: Taxonomy State
  const [selectedTopicId, setSelectedTopicId] = useState<string>('tenses');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('past_simple');
  const [taxonomyView, setTaxonomyView] = useState<'theory' | 'practice'>('theory');

  // Mode 2: Vault Infused Drills
  const vaultDrills: GrammarDrill[] = useMemo(() => {
    return generateVaultInfusedExercises(vocabList);
  }, [vocabList]);

  // Mode 3: Custom AI Generation State
  const [customInputText, setCustomInputText] = useState("");
  const [customExercises, setCustomExercises] = useState<ExerciseItem[]>([]);
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
  const [customGenError, setCustomGenError] = useState<string | null>(null);

  // Mode 4: Mirror Errors State
  const [mirrorExercises, setMirrorExercises] = useState<ExerciseItem[]>([]);
  const [isLoadingMirror, setIsLoadingMirror] = useState(false);

  // Active Quiz Session State
  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
  const [drillScore, setDrillScore] = useState(0);
  const [isSessionFinished, setIsSessionFinished] = useState(false);

  // Lessons filtered by active topic
  const activeTopic = useMemo(() => {
    return GRAMMAR_TOPICS.find(t => t.id === selectedTopicId) || GRAMMAR_TOPICS[0];
  }, [selectedTopicId]);

  const topicLessons = useMemo(() => {
    const list = ALL_GRAMMAR_LESSONS.filter(l => l.category === selectedTopicId);
    return list.length > 0 ? list : [ALL_GRAMMAR_LESSONS[0]];
  }, [selectedTopicId]);

  const activeLesson = useMemo(() => {
    return topicLessons.find(l => l.id === selectedLessonId) || topicLessons[0];
  }, [topicLessons, selectedLessonId]);

  // Reset drill session when switching modes
  const handleSwitchMode = (mode: MainMode) => {
    setActiveMode(mode);
    setCurrentDrillIndex(0);
    setDrillScore(0);
    setIsSessionFinished(false);
  };

  // Fetch Mirror Errors from API
  const fetchMirrorErrors = async () => {
    setIsLoadingMirror(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("oasis_token") : null;
      const res = await fetch("/api/grammar/mirror-errors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ limit_writings: 5, target_band: 7.5 })
      });
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        setMirrorExercises(data.data);
      } else {
        // Fallback default error spotting drills
        setMirrorExercises(STATIC_DRILLS.filter(d => d.mechanic === 'ERROR_SPOTTING') as any);
      }
    } catch (e) {
      console.error(e);
      setMirrorExercises(STATIC_DRILLS.filter(d => d.mechanic === 'ERROR_SPOTTING') as any);
    } finally {
      setIsLoadingMirror(false);
    }
  };

  useEffect(() => {
    if (activeMode === 'mirror_errors' && mirrorExercises.length === 0) {
      fetchMirrorErrors();
    }
  }, [activeMode]);

  // Trigger Custom Text AI Generation
  const handleGenerateFromText = async () => {
    if (!customInputText.trim()) return;
    setIsGeneratingCustom(true);
    setCustomGenError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("oasis_token") : null;
      const res = await fetch("/api/grammar/custom-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          custom_text: customInputText.trim(),
          count: 4,
          mechanics: ["MULTIPLE_CHOICE", "GAP_FILL", "SENTENCE_SCRAMBLE", "ERROR_SPOTTING"]
        })
      });
      const resData = await res.json();
      if (resData.success && resData.data && resData.data.length > 0) {
        setCustomExercises(resData.data);
        setCurrentDrillIndex(0);
        setDrillScore(0);
        setIsSessionFinished(false);
      } else {
        setCustomGenError("Không thể sinh đề từ văn bản này. Đang dùng đề mẫu chất lượng cao.");
        setCustomExercises(STATIC_DRILLS as any);
      }
    } catch (err: any) {
      console.error(err);
      setCustomGenError("Lỗi kết nối AI. Đang dùng ngân hàng đề dự phòng.");
      setCustomExercises(STATIC_DRILLS as any);
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  // Determine current active exercise queue based on mode
  const currentExerciseList: ExerciseItem[] = useMemo(() => {
    if (activeMode === 'vault_drills') {
      return vaultDrills as any;
    }
    if (activeMode === 'custom_ai') {
      return customExercises.length > 0 ? customExercises : (STATIC_DRILLS as any);
    }
    if (activeMode === 'mirror_errors') {
      return mirrorExercises.length > 0 ? mirrorExercises : (STATIC_DRILLS.filter(d => d.mechanic === 'ERROR_SPOTTING') as any);
    }
    // Taxonomy practice
    return STATIC_DRILLS.filter(d => d.category === selectedTopicId) as any;
  }, [activeMode, vaultDrills, customExercises, mirrorExercises, selectedTopicId]);

  const activeDrill = currentExerciseList[currentDrillIndex] || currentExerciseList[0];

  const handleAnswerSubmit = (isCorrect: boolean) => {
    if (isCorrect) {
      setDrillScore(prev => prev + 1);
    }
  };

  const handleNextDrill = () => {
    if (currentDrillIndex < currentExerciseList.length - 1) {
      setCurrentDrillIndex(prev => prev + 1);
    } else {
      setIsSessionFinished(true);
    }
  };

  const handleRestartSession = () => {
    setCurrentDrillIndex(0);
    setDrillScore(0);
    setIsSessionFinished(false);
  };

  return (
    <div className="w-full flex flex-col space-y-6 text-[#2D3748]">
      {/* Top Header & Branding */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 p-6 rounded-3xl border border-primary/20 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-primary/20 text-primary text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 shrink-0" /> Cambridge GRA Band 7.5+
            </span>
            <span className="text-xs text-accent/60 font-semibold">Adaptive Grammar & CEFR Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-accent">Grammar Mastery Lab</h1>
          <p className="text-xs sm:text-sm text-accent/75 mt-1 max-w-2xl leading-relaxed">
            Làm chủ 6 cụm chuyên đề CEFR A1–C1, tự tạo đề từ bài đọc bất kỳ, và rèn luyện trực tiếp trên các lỗi sai từ bài viết của chính bạn.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 bg-white/90 hover:bg-white text-accent font-bold text-xs sm:text-sm rounded-2xl border border-primary/20 shadow-xs transition-all active:scale-95 touch-manipulation inline-flex items-center gap-2 shrink-0 self-start sm:self-center"
          >
            <BookOpen className="w-4 h-4 shrink-0 text-primary" />
            Về Tủ Từ Vựng
          </button>
        )}
      </div>

      {/* 4 Core Mode Navigation Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => handleSwitchMode('taxonomy')}
          className={`min-h-[48px] p-3 rounded-2xl border text-left transition-all active:scale-95 touch-manipulation flex items-center gap-3 ${
            activeMode === 'taxonomy'
              ? 'bg-primary text-white border-primary shadow-sm ring-2 ring-primary/25'
              : 'bg-white hover:bg-primary/5 border-primary/15 text-accent'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            activeMode === 'taxonomy' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
          }`}>
            <Layers className="w-4 h-4 shrink-0" />
          </div>
          <div className="overflow-hidden">
            <span className="text-xs font-black block truncate">1. Lộ Trình 6 Chuyên Đề</span>
            <span className={`text-[10px] block truncate ${activeMode === 'taxonomy' ? 'text-white/80' : 'text-accent/60'}`}>
              Chuẩn Raymond Murphy
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchMode('vault_drills')}
          className={`min-h-[48px] p-3 rounded-2xl border text-left transition-all active:scale-95 touch-manipulation flex items-center gap-3 ${
            activeMode === 'vault_drills'
              ? 'bg-primary text-white border-primary shadow-sm ring-2 ring-primary/25'
              : 'bg-white hover:bg-primary/5 border-primary/15 text-accent'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            activeMode === 'vault_drills' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
          }`}>
            <Sparkles className="w-4 h-4 shrink-0" />
          </div>
          <div className="overflow-hidden">
            <span className="text-xs font-black block truncate">2. Đề May Đo Tủ Từ</span>
            <span className={`text-[10px] block truncate ${activeMode === 'vault_drills' ? 'text-white/80' : 'text-accent/60'}`}>
              Lồng ghép flashcard của bạn
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchMode('custom_ai')}
          className={`min-h-[48px] p-3 rounded-2xl border text-left transition-all active:scale-95 touch-manipulation flex items-center gap-3 ${
            activeMode === 'custom_ai'
              ? 'bg-primary text-white border-primary shadow-sm ring-2 ring-primary/25'
              : 'bg-white hover:bg-primary/5 border-primary/15 text-accent'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            activeMode === 'custom_ai' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
          }`}>
            <PenTool className="w-4 h-4 shrink-0" />
          </div>
          <div className="overflow-hidden">
            <span className="text-xs font-black block truncate">3. Tự Tạo Đề AI</span>
            <span className={`text-[10px] block truncate ${activeMode === 'custom_ai' ? 'text-white/80' : 'text-accent/60'}`}>
              Dán bài đọc / essay bất kỳ
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchMode('mirror_errors')}
          className={`min-h-[48px] p-3 rounded-2xl border text-left transition-all active:scale-95 touch-manipulation flex items-center gap-3 ${
            activeMode === 'mirror_errors'
              ? 'bg-primary text-white border-primary shadow-sm ring-2 ring-primary/25'
              : 'bg-white hover:bg-primary/5 border-primary/15 text-accent'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            activeMode === 'mirror_errors' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0" />
          </div>
          <div className="overflow-hidden">
            <span className="text-xs font-black block truncate">4. Mirror Error Spotting</span>
            <span className={`text-[10px] block truncate ${activeMode === 'mirror_errors' ? 'text-white/80' : 'text-accent/60'}`}>
              Sửa lỗi từ Writing cũ
            </span>
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: TAXONOMY ROUTE (6 CLUSTERS + LESSONS + THEORY & PRACTICE)         */}
      {/* ========================================================================= */}
      {activeMode === 'taxonomy' && (
        <div className="flex flex-col gap-5">
          {/* 6 Cluster Selector Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {GRAMMAR_TOPICS.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => {
                  setSelectedTopicId(topic.id);
                  const firstLesson = ALL_GRAMMAR_LESSONS.find(l => l.category === topic.id);
                  if (firstLesson) setSelectedLessonId(firstLesson.id);
                  setTaxonomyView('theory');
                }}
                className={`min-h-[40px] px-3.5 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95 touch-manipulation inline-flex items-center gap-1.5 ${
                  selectedTopicId === topic.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white hover:bg-primary/10 border border-primary/15 text-accent/80'
                }`}
              >
                <span>{topic.title_vi}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                  selectedTopicId === topic.id ? 'bg-white/25 text-white' : 'bg-primary/10 text-primary'
                }`}>
                  {topic.cefr_span}
                </span>
              </button>
            ))}
          </div>

          {/* Sub-lessons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {topicLessons.map((lesson) => (
              <button
                key={lesson.id}
                type="button"
                onClick={() => {
                  setSelectedLessonId(lesson.id);
                  setTaxonomyView('theory');
                }}
                className={`min-h-[44px] p-3 text-left rounded-2xl border transition-all active:scale-95 touch-manipulation flex flex-col justify-between ${
                  selectedLessonId === lesson.id
                    ? 'bg-white border-primary shadow-xs ring-2 ring-primary/20'
                    : 'bg-white/70 hover:bg-white border-primary/15 text-accent/80'
                }`}
              >
                <span className="text-[10px] font-bold text-primary uppercase">{lesson.cefr_level || 'B1'}</span>
                <span className="text-xs font-extrabold text-accent truncate mt-0.5">{lesson.title}</span>
              </button>
            ))}
          </div>

          {/* Lesson Main View Area */}
          <div className="bg-white rounded-3xl border border-primary/20 shadow-xs overflow-hidden flex flex-col">
            {/* View Sub-Tabs: Lý Thuyết vs Luyện Đề */}
            <div className="flex border-b border-primary/15 bg-[#FAF9F5]/70 p-2 gap-2">
              <button
                type="button"
                onClick={() => setTaxonomyView('theory')}
                className={`min-h-[40px] flex-1 py-2 rounded-xl font-black text-xs sm:text-sm transition-all active:scale-95 touch-manipulation inline-flex items-center justify-center gap-2 ${
                  taxonomyView === 'theory'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-accent/60 hover:text-accent'
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                Lý Thuyết & Công Thức
              </button>
              <button
                type="button"
                onClick={() => setTaxonomyView('practice')}
                className={`min-h-[40px] flex-1 py-2 rounded-xl font-black text-xs sm:text-sm transition-all active:scale-95 touch-manipulation inline-flex items-center justify-center gap-2 ${
                  taxonomyView === 'practice'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-accent/60 hover:text-accent'
                }`}
              >
                <Target className="w-4 h-4 shrink-0" />
                Luyện Tập Thực Chiến ({currentExerciseList.length} câu)
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {taxonomyView === 'theory' ? (
                <div className="flex flex-col gap-6">
                  {/* Header Title */}
                  <div className="border-b border-primary/10 pb-4">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">{activeTopic.title_en}</span>
                    <h2 className="text-xl sm:text-2xl font-black text-accent mt-1">{activeLesson.vietnameseTitle}</h2>
                    <p className="text-xs sm:text-sm text-accent/80 mt-1 italic leading-relaxed">{activeLesson.rule_summary}</p>
                  </div>

                  {/* Formula Box */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xs font-black text-accent uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-primary shrink-0" /> Công Thức Ngữ Pháp
                    </h3>
                    <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
                      <span className="text-xs sm:text-sm font-mono font-bold text-emerald-950 block">
                        {typeof activeLesson.formula === 'string' 
                          ? activeLesson.formula 
                          : `${activeLesson.formula.positive} | Phủ định: ${activeLesson.formula.negative}`}
                      </span>
                    </div>
                  </div>

                  {/* IELTS Application */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xs font-black text-accent uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-primary shrink-0" /> Ứng Dụng Trong Bài Thi IELTS
                    </h3>
                    <p className="bg-[#FAF9F5] p-4 rounded-2xl border border-primary/15 text-xs sm:text-sm font-medium text-accent leading-relaxed">
                      {activeLesson.ielts_application}
                    </p>
                  </div>

                  {/* Common Pitfalls */}
                  {activeLesson.common_pitfalls && activeLesson.common_pitfalls.length > 0 && (
                    <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200">
                      <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" /> Bẫy Thường Gặp & Lưu Ý
                      </h3>
                      <ul className="list-disc list-inside text-xs text-amber-900/90 flex flex-col gap-1.5 leading-relaxed font-medium">
                        {activeLesson.common_pitfalls.map((pitfall, idx) => (
                          <li key={idx}>{pitfall}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Academic Examples */}
                  {activeLesson.academic_examples && activeLesson.academic_examples.length > 0 && (
                    <div className="flex flex-col gap-2.5">
                      <h3 className="text-xs font-black text-accent uppercase tracking-wider">
                        Ví Dụ Câu Mẫu Band 8.0+
                      </h3>
                      <div className="flex flex-col gap-2">
                        {activeLesson.academic_examples.map((ex, idx) => (
                          <div key={idx} className="bg-white p-3.5 rounded-2xl border border-primary/15 shadow-2xs">
                            <p className="text-xs sm:text-sm font-bold text-primary font-serif">"{ex.sentence}"</p>
                            <div className="flex items-center justify-between text-[11px] text-accent/60 mt-2 pt-2 border-t border-primary/10">
                              <span>{ex.analysis}</span>
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                {ex.band_score}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setTaxonomyView('practice')}
                      className="min-h-[44px] px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-sm transition-all active:scale-95 touch-manipulation inline-flex items-center gap-2"
                    >
                      Luyện Tập Đề Ngay <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Practice View inside Taxonomy */
                <div className="flex flex-col gap-4">
                  {isSessionFinished ? (
                    <SessionSummaryCard
                      score={drillScore}
                      total={currentExerciseList.length}
                      onRestart={handleRestartSession}
                      onBack={() => setTaxonomyView('theory')}
                    />
                  ) : activeDrill ? (
                    <div>
                      <div className="flex justify-between items-center text-xs font-bold text-accent/60 mb-2">
                        <span>Câu hỏi {currentDrillIndex + 1} / {currentExerciseList.length}</span>
                        <span className="text-primary font-black">Điểm: {drillScore}</span>
                      </div>
                      <InteractiveGrammarCard
                        exercise={activeDrill}
                        onNext={handleNextDrill}
                        onAnswerSubmit={handleAnswerSubmit}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs font-bold text-accent/60">
                      Chưa có câu hỏi cho bài học này.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: PERSONAL VAULT INFUSION DRILLS                                    */}
      {/* ========================================================================= */}
      {activeMode === 'vault_drills' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white p-5 rounded-3xl border border-primary/20 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-accent flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" /> Đề May Đo Từ Tủ Từ Vựng Của Bạn
              </h2>
              <p className="text-xs text-accent/70 mt-0.5">
                AI tự động lồng ghép các từ vựng bạn đang lưu trong Flashcard vào các bài tập chia thì, mạo từ và đảo ngữ.
              </p>
            </div>
            <span className="bg-primary/10 text-primary text-xs font-extrabold px-3 py-1 rounded-xl shrink-0">
              {vocabList.length} từ trong kho
            </span>
          </div>

          {isSessionFinished ? (
            <SessionSummaryCard
              score={drillScore}
              total={currentExerciseList.length}
              onRestart={handleRestartSession}
              onBack={() => handleSwitchMode('taxonomy')}
            />
          ) : activeDrill ? (
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-accent/60 mb-2">
                <span>Câu hỏi {currentDrillIndex + 1} / {currentExerciseList.length}</span>
                <span className="text-primary font-black">Điểm: {drillScore}</span>
              </div>
              <InteractiveGrammarCard
                exercise={activeDrill}
                onNext={handleNextDrill}
                onAnswerSubmit={handleAnswerSubmit}
              />
            </div>
          ) : null}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: CUSTOM AI GENERATOR FROM ANY TEXT                                 */}
      {/* ========================================================================= */}
      {activeMode === 'custom_ai' && (
        <div className="flex flex-col gap-5">
          {/* Custom Textarea Input Card */}
          <div className="bg-white p-5 rounded-3xl border border-primary/20 shadow-xs flex flex-col gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-accent flex items-center gap-2">
                <PenTool className="w-4 h-4 text-primary shrink-0" /> Tự Nhập Văn Bản Bất Kỳ Để AI Sinh Đề
              </h2>
              <p className="text-xs text-accent/70 mt-0.5">
                Dán bài đọc báo (BBC, Economist), bài luận mẫu hoặc danh sách câu bạn muốn học. AI sẽ phân tích và trích xuất 4 dạng bài tập ngay tức thì.
              </p>
            </div>

            <textarea
              value={customInputText}
              onChange={(e) => setCustomInputText(e.target.value)}
              rows={4}
              placeholder="Dán đoạn văn tiếng Anh học thuật vào đây (khoảng 100 - 300 từ)... Ví dụ: Although renewable energy investments have accelerated across Europe, fossil fuel consumption remains prevalent in developing nations due to financial constraints..."
              className="w-full text-xs sm:text-sm font-medium text-accent border border-primary/20 rounded-2xl p-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none bg-[#FAF9F5]/60 leading-relaxed"
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
              {customGenError && (
                <span className="text-xs text-rose-600 font-bold">{customGenError}</span>
              )}
              <button
                type="button"
                onClick={handleGenerateFromText}
                disabled={isGeneratingCustom || !customInputText.trim()}
                className="w-full sm:w-auto min-h-[44px] px-6 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-2xl shadow-sm transition-all active:scale-95 touch-manipulation inline-flex items-center justify-center gap-2 shrink-0 self-end"
              >
                {isGeneratingCustom ? (
                  <>
                    <RefreshCw className="w-4 h-4 shrink-0 animate-spin" /> AI Đang Phân Tích & Sinh Đề...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 shrink-0" /> Sinh 4 Dạng Bài Tập Ngay
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Render Generated Drills */}
          {customExercises.length > 0 && (
            <div>
              {isSessionFinished ? (
                <SessionSummaryCard
                  score={drillScore}
                  total={customExercises.length}
                  onRestart={handleRestartSession}
                  onBack={() => setCustomExercises([])}
                />
              ) : activeDrill ? (
                <div>
                  <div className="flex justify-between items-center text-xs font-bold text-accent/60 mb-2">
                    <span>Đề sinh từ văn bản: Câu {currentDrillIndex + 1} / {customExercises.length}</span>
                    <span className="text-primary font-black">Điểm: {drillScore}</span>
                  </div>
                  <InteractiveGrammarCard
                    exercise={activeDrill}
                    onNext={handleNextDrill}
                    onAnswerSubmit={handleAnswerSubmit}
                  />
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 4: MIRROR ERROR SPOTTING FROM USER WRITING LOGS                      */}
      {/* ========================================================================= */}
      {activeMode === 'mirror_errors' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white p-5 rounded-3xl border border-primary/20 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-accent flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" /> Mirror Error: Luyện Sửa Lỗi Của Chính Bạn
              </h2>
              <p className="text-xs text-accent/70 mt-0.5">
                AI bóc tách các câu bị trừ điểm ngữ pháp từ các bài viết bạn từng nộp tại Writing Sanctuary và biến thành bài tập Error Spotting.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchMirrorErrors}
              disabled={isLoadingMirror}
              className="min-h-[40px] px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl active:scale-95 touch-manipulation transition-all inline-flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isLoadingMirror ? 'animate-spin' : ''}`} />
              Làm Mới Lỗi
            </button>
          </div>

          {isLoadingMirror ? (
            <div className="bg-white p-12 rounded-3xl border border-primary/15 text-center flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 text-primary animate-spin shrink-0" />
              <p className="text-xs font-bold text-accent/70">Đang quét bài viết cũ và trích xuất lỗi sai ngữ pháp...</p>
            </div>
          ) : isSessionFinished ? (
            <SessionSummaryCard
              score={drillScore}
              total={currentExerciseList.length}
              onRestart={handleRestartSession}
              onBack={() => handleSwitchMode('taxonomy')}
            />
          ) : activeDrill ? (
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-accent/60 mb-2">
                <span>Câu lỗi {currentDrillIndex + 1} / {currentExerciseList.length}</span>
                <span className="text-primary font-black">Điểm: {drillScore}</span>
              </div>
              <InteractiveGrammarCard
                exercise={activeDrill}
                onNext={handleNextDrill}
                onAnswerSubmit={handleAnswerSubmit}
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// Session Finished Summary Component
function SessionSummaryCard({
  score,
  total,
  onRestart,
  onBack
}: {
  score: number;
  total: number;
  onRestart: () => void;
  onBack: () => void;
}) {
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-primary/20 shadow-xs max-w-lg mx-auto text-center flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center text-primary">
        <Sparkles className="w-8 h-8 shrink-0" />
      </div>

      <h3 className="text-xl font-black text-accent">Hoàn Thành Phiên Luyện Đề!</h3>
      <p className="text-xs text-accent/70">
        Bạn đã hoàn tất bài tập thực hành thích ứng của phiên này.
      </p>

      <div className="p-4 bg-[#FAF9F5] rounded-2xl border border-primary/20 w-full my-2">
        <span className="text-xs font-bold text-accent/60 block mb-1">Kết quả bài làm</span>
        <span className="text-3xl font-black text-primary">
          {score} / {total} ({percent}%)
        </span>
        <p className="text-xs text-accent/75 mt-2 font-medium">
          {percent >= 80 
            ? "Tuyệt vời! Bạn kiểm soát cấu trúc câu và từ vựng rất chuẩn xác."
            : percent >= 50
            ? "Khá tốt! Hãy xem lại các bẫy thường gặp để cải thiện thêm."
            : "Hãy tiếp tục ôn luyện để củng cố các cấu trúc còn yếu nhé!"}
        </p>
      </div>

      <div className="flex gap-3 w-full">
        <button
          type="button"
          onClick={onRestart}
          className="min-h-[44px] flex-1 py-2.5 rounded-2xl bg-white border border-primary/25 text-accent font-bold text-xs hover:bg-primary/5 active:scale-95 touch-manipulation inline-flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4 shrink-0 text-primary" /> Làm Lại Phiên Này
        </button>
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] flex-1 py-2.5 rounded-2xl bg-primary text-white font-bold text-xs hover:bg-primary/90 active:scale-95 touch-manipulation inline-flex items-center justify-center gap-2"
        >
          <BookOpen className="w-4 h-4 shrink-0" /> Đọc Lý Thuyết
        </button>
      </div>
    </div>
  );
}
