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
  Lightbulb,
  Play,
  Youtube,
  Bot,
  Send,
  X,
  Sliders,
  Database,
  MessageSquare,
  Award
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

type MainMode = 'taxonomy' | 'adaptive_exam' | 'vault_drills' | 'custom_ai' | 'mirror_errors';

export default function GrammarMasteryLab({ vocabList = [], onClose }: Props) {
  // Main Navigation Modes
  const [activeMode, setActiveMode] = useState<MainMode>('taxonomy');

  // Mode 1: Taxonomy State
  const [selectedTopicId, setSelectedTopicId] = useState<string>('tenses');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('past_simple');
  const [taxonomyView, setTaxonomyView] = useState<'theory' | 'video' | 'practice'>('theory');

  // Mode 2: Adaptive Personal Exam State
  const [adaptiveCefrLevel, setAdaptiveCefrLevel] = useState<string>('B2');
  const [adaptiveDatasetType, setAdaptiveDatasetType] = useState<string>('cambridge_ielts');
  const [adaptiveTopicId, setAdaptiveTopicId] = useState<string>('all');
  const [adaptiveIncludeVault, setAdaptiveIncludeVault] = useState<boolean>(true);
  const [adaptiveFocusWeak, setAdaptiveFocusWeak] = useState<boolean>(true);
  const [adaptiveExercises, setAdaptiveExercises] = useState<ExerciseItem[]>([]);
  const [isGeneratingAdaptive, setIsGeneratingAdaptive] = useState(false);
  const [adaptiveGenError, setAdaptiveGenError] = useState<string | null>(null);

  // Mode 3: Vault Infused Drills
  const vaultDrills: GrammarDrill[] = useMemo(() => {
    return generateVaultInfusedExercises(vocabList);
  }, [vocabList]);

  // Mode 4: Custom AI Generation State
  const [customInputText, setCustomInputText] = useState("");
  const [customExercises, setCustomExercises] = useState<ExerciseItem[]>([]);
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
  const [customGenError, setCustomGenError] = useState<string | null>(null);

  // Mode 5: Mirror Errors State
  const [mirrorExercises, setMirrorExercises] = useState<ExerciseItem[]>([]);
  const [isLoadingMirror, setIsLoadingMirror] = useState(false);

  // Active Quiz Session State
  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
  const [drillScore, setDrillScore] = useState(0);
  const [isSessionFinished, setIsSessionFinished] = useState(false);

  // AI Coach Chatbot State
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [coachInput, setCoachInput] = useState("");
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const [coachMessages, setCoachMessages] = useState<Array<{
    role: 'user' | 'assistant';
    text: string;
    study_plan?: any;
    recommended_video?: any;
    practice_exercise?: any;
  }>>([
    {
      role: 'assistant',
      text: 'Chào bạn! Mình là Cố vấn Ngữ pháp & Lịch học Oasis. Bạn cần mình tư vấn lịch học 7 ngày, giải thích chi tiết 12 thì (3 dạng công thức +, -, ?), hay hướng dẫn mẹo dùng mạo từ A/An/The/Ø?'
    }
  ]);

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

  // Trigger Adaptive Exam Generation
  const handleGenerateAdaptiveExam = async () => {
    setIsGeneratingAdaptive(true);
    setAdaptiveGenError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("oasis_token") : null;
      const res = await fetch("/api/grammar/adaptive-personal-exam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          cefr_level: adaptiveCefrLevel,
          topic_id: adaptiveTopicId,
          dataset_type: adaptiveDatasetType,
          count: 5,
          focus_weak_areas: adaptiveFocusWeak,
          include_vault_words: adaptiveIncludeVault
        })
      });
      const resData = await res.json();
      if (resData.success && resData.data && resData.data.length > 0) {
        setAdaptiveExercises(resData.data);
        setCurrentDrillIndex(0);
        setDrillScore(0);
        setIsSessionFinished(false);
      } else {
        setAdaptiveGenError("Không thể kết nối máy chủ sinh đề AI. Đang kích hoạt ngân hàng đề chuẩn Cambridge.");
        setAdaptiveExercises(STATIC_DRILLS as any);
      }
    } catch (err) {
      console.error(err);
      setAdaptiveGenError("Lỗi kết nối. Đang kích hoạt ngân hàng đề chuẩn Cambridge.");
      setAdaptiveExercises(STATIC_DRILLS as any);
    } finally {
      setIsGeneratingAdaptive(false);
    }
  };

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
    } catch (err) {
      console.error(err);
      setCustomGenError("Lỗi kết nối AI. Đang dùng ngân hàng đề dự phòng.");
      setCustomExercises(STATIC_DRILLS as any);
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  // Send message to AI Coach
  const handleSendCoachMessage = async (customMsg?: string) => {
    const textToSend = customMsg || coachInput.trim();
    if (!textToSend || isCoachLoading) return;

    setCoachInput("");
    setCoachMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setIsCoachLoading(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("oasis_token") : null;
      const history = coachMessages.slice(-6).map(m => ({ role: m.role, content: m.text }));
      
      const res = await fetch("/api/grammar/ai-coach-consult", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: textToSend,
          user_goal: "IELTS 7.0+",
          history
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        setCoachMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: d.reply || "Cố vấn đã ghi nhận câu hỏi của bạn.",
            study_plan: d.study_plan,
            recommended_video: d.recommended_video,
            practice_exercise: d.practice_exercise
          }
        ]);
      } else {
        setCoachMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: "Cố vấn tạm thời bận. Bạn hãy xem qua các bài giảng trong Lộ Trình 6 Chuyên Đề nhé!"
          }
        ]);
      }
    } catch (e) {
      console.error(e);
      setCoachMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: "Có lỗi khi kết nối với Cố vấn AI. Vui lòng thử lại sau ít phút."
        }
      ]);
    } finally {
      setIsCoachLoading(false);
    }
  };

  // Determine current active exercise queue based on mode
  const currentExerciseList: ExerciseItem[] = useMemo(() => {
    if (activeMode === 'adaptive_exam') {
      return adaptiveExercises.length > 0 ? adaptiveExercises : (STATIC_DRILLS as any);
    }
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
  }, [activeMode, adaptiveExercises, vaultDrills, customExercises, mirrorExercises, selectedTopicId]);

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
            Học trọn bộ 12 thì và mạo từ với công thức 3 dạng (+, -, ?), video bài giảng trực quan, tự sinh đề thi cá nhân hóa từ các bộ dataset học thuật chuẩn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Floating Coach Consultation Trigger */}
          <button
            onClick={() => setIsCoachOpen(true)}
            className="min-h-[44px] px-4 py-2 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-500 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-sm transition-all active:scale-95 touch-manipulation inline-flex items-center gap-2 shrink-0"
          >
            <Bot className="w-4 h-4 shrink-0" />
            Cố Vấn Lịch Học & Ngữ Pháp
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 bg-white/90 hover:bg-white text-accent font-bold text-xs sm:text-sm rounded-2xl border border-primary/20 shadow-xs transition-all active:scale-95 touch-manipulation inline-flex items-center gap-2 shrink-0"
            >
              <BookOpen className="w-4 h-4 shrink-0 text-primary" />
              Về Tủ Từ Vựng
            </button>
          )}
        </div>
      </div>

      {/* 5 Core Mode Navigation Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
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
            <span className="text-xs font-black block truncate">1. 12 Thì & Mạo Từ</span>
            <span className={`text-[10px] block truncate ${activeMode === 'taxonomy' ? 'text-white/80' : 'text-accent/60'}`}>
              Lý thuyết, 3 dạng & video
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchMode('adaptive_exam')}
          className={`min-h-[48px] p-3 rounded-2xl border text-left transition-all active:scale-95 touch-manipulation flex items-center gap-3 ${
            activeMode === 'adaptive_exam'
              ? 'bg-primary text-white border-primary shadow-sm ring-2 ring-primary/25'
              : 'bg-white hover:bg-primary/5 border-primary/15 text-accent'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            activeMode === 'adaptive_exam' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
          }`}>
            <Database className="w-4 h-4 shrink-0" />
          </div>
          <div className="overflow-hidden">
            <span className="text-xs font-black block truncate">2. Đề Cá Nhân Hóa (AI)</span>
            <span className={`text-[10px] block truncate ${activeMode === 'adaptive_exam' ? 'text-white/80' : 'text-accent/60'}`}>
              Adaptive theo Dataset
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
            <span className="text-xs font-black block truncate">3. May Đo Tủ Từ</span>
            <span className={`text-[10px] block truncate ${activeMode === 'vault_drills' ? 'text-white/80' : 'text-accent/60'}`}>
              Lồng ghép từ của bạn
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
            <span className="text-xs font-black block truncate">4. Tạo Đề Từ Bài Đọc</span>
            <span className={`text-[10px] block truncate ${activeMode === 'custom_ai' ? 'text-white/80' : 'text-accent/60'}`}>
              Dán essay / đoạn văn
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
            <span className="text-xs font-black block truncate">5. Mirror Error Spotting</span>
            <span className={`text-[10px] block truncate ${activeMode === 'mirror_errors' ? 'text-white/80' : 'text-accent/60'}`}>
              Lỗi bài viết của bạn
            </span>
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: TAXONOMY ROUTE (6 CLUSTERS + LESSONS + THEORY, VIDEO & PRACTICE)  */}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {topicLessons.map((lesson) => (
              <button
                key={lesson.id}
                type="button"
                onClick={() => {
                  setSelectedLessonId(lesson.id);
                  setTaxonomyView('theory');
                }}
                className={`min-h-[48px] p-3 text-left rounded-2xl border transition-all active:scale-95 touch-manipulation flex flex-col justify-between ${
                  selectedLessonId === lesson.id
                    ? 'bg-white border-primary shadow-xs ring-2 ring-primary/20'
                    : 'bg-white/70 hover:bg-white border-primary/15 text-accent/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase text-primary">
                      {lesson.cefr_level || 'B2'}
                    </span>
                    {lesson.youtube_id && (
                      <span className="text-[10px] text-rose-500 font-bold inline-flex items-center gap-1">
                        <Youtube className="w-3 h-3" /> Video
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-black text-accent block leading-tight">
                    {lesson.title}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Lesson Main Detail Container */}
          <div className="bg-white rounded-3xl border border-primary/20 shadow-xs overflow-hidden">
            {/* View Switcher Bar: Theory | Video | Practice */}
            <div className="flex flex-wrap p-2 bg-[#FAF9F5] border-b border-primary/10 gap-1.5">
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
                Lý Thuyết & 3 Dạng (+, -, ?)
              </button>
              <button
                type="button"
                onClick={() => setTaxonomyView('video')}
                className={`min-h-[40px] flex-1 py-2 rounded-xl font-black text-xs sm:text-sm transition-all active:scale-95 touch-manipulation inline-flex items-center justify-center gap-2 ${
                  taxonomyView === 'video'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-accent/60 hover:text-accent'
                }`}
              >
                <Youtube className="w-4 h-4 shrink-0 text-rose-500" />
                Video Bài Giảng (YouTube)
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

                  {/* 3 Forms Box (+, -, ?) */}
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-black text-accent uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-primary shrink-0" /> Công Thức Chi Tiết 3 Dạng Căn Bản
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200">
                        <span className="text-[11px] font-black text-emerald-800 uppercase block mb-1">
                          (+) Thể Khẳng Định
                        </span>
                        <span className="text-xs sm:text-sm font-mono font-bold text-emerald-950 block">
                          {activeLesson.three_forms?.affirmative || (typeof activeLesson.formula === 'string' ? activeLesson.formula : activeLesson.formula.positive)}
                        </span>
                      </div>
                      <div className="bg-rose-50/80 p-3.5 rounded-2xl border border-rose-200">
                        <span className="text-[11px] font-black text-rose-800 uppercase block mb-1">
                          (-) Thể Phủ Định
                        </span>
                        <span className="text-xs sm:text-sm font-mono font-bold text-rose-950 block">
                          {activeLesson.three_forms?.negative || (typeof activeLesson.formula === 'object' ? activeLesson.formula.negative : 'S + Trợ động từ + not + V-inf')}
                        </span>
                      </div>
                      <div className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-200">
                        <span className="text-[11px] font-black text-blue-800 uppercase block mb-1">
                          (?) Thể Nghi Vấn / Câu Hỏi
                        </span>
                        <span className="text-xs sm:text-sm font-mono font-bold text-blue-950 block">
                          {activeLesson.three_forms?.interrogative || (typeof activeLesson.formula === 'object' ? activeLesson.formula.question : 'Trợ động từ + S + V-inf...?')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Signal Markers */}
                  {activeLesson.signal_markers && activeLesson.signal_markers.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xs font-black text-accent uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary shrink-0" /> Dấu Hiệu Nhận Biết & Trạng Từ Thời Gian
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {activeLesson.signal_markers.map((marker, i) => (
                          <span key={i} className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold">
                            {marker}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

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
                        <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" /> Bẫy Thường Gặp & Trường Hợp Đặc Biệt
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

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setTaxonomyView('video')}
                      className="min-h-[44px] px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs sm:text-sm rounded-2xl border border-rose-200 transition-all active:scale-95 touch-manipulation inline-flex items-center gap-2"
                    >
                      <Youtube className="w-4 h-4 shrink-0 text-rose-600" /> Xem Video Giảng Giải
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxonomyView('practice')}
                      className="min-h-[44px] px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-sm transition-all active:scale-95 touch-manipulation inline-flex items-center gap-2"
                    >
                      Luyện Tập Đề Ngay <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </div>
              ) : taxonomyView === 'video' ? (
                /* Video Lecture View */
                <div className="flex flex-col gap-6">
                  <div className="border-b border-primary/10 pb-4">
                    <div className="flex items-center gap-2 text-rose-600 text-xs font-black uppercase mb-1">
                      <Youtube className="w-4 h-4" /> Bài Giảng Tuyển Chọn Chuẩn Quốc Tế
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-accent">
                      {activeLesson.youtube_title || `${activeLesson.title} Mastery`}
                    </h2>
                    <p className="text-xs text-accent/70 mt-1">
                      Kênh phát hành: <span className="font-bold text-primary">{activeLesson.youtube_channel || 'Oxford Online English'}</span>
                    </p>
                  </div>

                  {/* Responsive 16:9 Video Embed */}
                  <div className="w-full aspect-video rounded-3xl overflow-hidden border border-primary/20 shadow-md bg-black">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${activeLesson.youtube_id || 'L9AWrJnhsRI'}?rel=0`}
                      title={activeLesson.youtube_title || "IELTS Grammar Lecture"}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>

                  <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 flex flex-col gap-2">
                    <span className="text-xs font-black text-emerald-950 uppercase flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-emerald-600" /> Tóm Lược Kiến Thức Khi Nghe Giảng
                    </span>
                    <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed font-medium">
                      Hãy chú ý cách giáo viên bản ngữ phân biệt các trạng từ chỉ tần suất và dấu hiệu ngữ cảnh. Đối với 12 thì, ghi nhớ sự khác biệt giữa hành động tức thời vs tiến trình kéo dài; đối với mạo từ, hãy chú ý âm phát âm nguyên âm thay vì chữ cái viết.
                    </p>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setTaxonomyView('practice')}
                      className="min-h-[44px] px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-sm transition-all active:scale-95 touch-manipulation inline-flex items-center gap-2"
                    >
                      Bắt Đầu Luyện Bài Tập <ArrowRight className="w-4 h-4 shrink-0" />
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
      {/* MODE 2: ADAPTIVE PERSONAL EXAM GENERATOR (CEFR & BENCHMARK DATASET)       */}
      {/* ========================================================================= */}
      {activeMode === 'adaptive_exam' && (
        <div className="flex flex-col gap-5">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-primary/20 shadow-xs flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-primary/10 text-primary text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                  Adaptive AI Engine
                </span>
                <span className="text-xs text-accent/60 font-semibold">Tự động điều chỉnh độ khó</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-accent">
                Tạo Đề Thi Cá Nhân Hóa Dựa Trên Năng Lực & Dataset
              </h2>
              <p className="text-xs sm:text-sm text-accent/70 mt-1 max-w-2xl leading-relaxed">
                Hệ thống AI sẽ phân tích các điểm yếu ngữ pháp từ lịch sử làm bài, lồng ghép từ vựng cá nhân trong tủ từ, và sinh đề theo các bộ benchmark học thuật uy tín.
              </p>
            </div>

            {/* Filter 1: Target CEFR Level */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-accent uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-primary" /> Chọn Trình Độ CEFR Cá Nhân:
              </label>
              <div className="grid grid-cols-5 gap-2">
                {['A1', 'A2', 'B1', 'B2', 'C1'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setAdaptiveCefrLevel(lvl)}
                    className={`min-h-[44px] rounded-2xl border font-black text-xs sm:text-sm transition-all active:scale-95 touch-manipulation flex items-center justify-center ${
                      adaptiveCefrLevel === lvl
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-white hover:bg-primary/5 border-primary/20 text-accent/80'
                    }`}
                  >
                    Band {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter 2: Academic Benchmark Dataset */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-accent uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-4 h-4 text-primary" /> Chọn Bộ Dataset Học Thuật / Benchmark:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'cambridge_ielts',
                    name: 'Cambridge IELTS Academic',
                    desc: 'Writing Task 1 & 2 thực chiến, biểu đồ xu hướng'
                  },
                  {
                    id: 'wi_locness',
                    name: 'W&I + LOCNESS (BEA GEC)',
                    desc: 'Chuẩn benchmark sửa lỗi ngữ pháp người học'
                  },
                  {
                    id: 'conll_2014',
                    name: 'CoNLL-2014 Benchmark',
                    desc: 'Tìm và sửa 1 lỗi tinh vi trong câu học thuật'
                  },
                  {
                    id: 'jfleg',
                    name: 'JFLEG (Fluency-Extended)',
                    desc: 'Tái cấu trúc câu tự nhiên, mượt mà chuẩn bản xứ'
                  },
                  {
                    id: 'mmlu',
                    name: 'MMLU Linguistics & Syntax',
                    desc: 'Trắc nghiệm cấu trúc câu và phân tích cú pháp'
                  }
                ].map((ds) => (
                  <button
                    key={ds.id}
                    type="button"
                    onClick={() => setAdaptiveDatasetType(ds.id)}
                    className={`min-h-[52px] p-3 rounded-2xl border text-left transition-all active:scale-95 touch-manipulation flex flex-col justify-between ${
                      adaptiveDatasetType === ds.id
                        ? 'bg-primary/10 border-primary ring-2 ring-primary/20'
                        : 'bg-white hover:bg-primary/5 border-primary/15'
                    }`}
                  >
                    <span className="text-xs font-black text-accent">{ds.name}</span>
                    <span className="text-[10px] text-accent/65 mt-0.5">{ds.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Personal Preferences Toggles */}
            <div className="flex flex-wrap gap-4 pt-1 border-t border-primary/10">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-accent">
                <input
                  type="checkbox"
                  checked={adaptiveIncludeVault}
                  onChange={(e) => setAdaptiveIncludeVault(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                Lồng ghép từ vựng trong Tủ từ ({vocabList.length} từ khả dụng)
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-accent">
                <input
                  type="checkbox"
                  checked={adaptiveFocusWeak}
                  onChange={(e) => setAdaptiveFocusWeak(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                Ưu tiên điểm yếu từ các bài kiểm tra & bài viết cũ
              </label>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
              {adaptiveGenError && (
                <span className="text-xs text-rose-600 font-bold">{adaptiveGenError}</span>
              )}
              <button
                type="button"
                onClick={handleGenerateAdaptiveExam}
                disabled={isGeneratingAdaptive}
                className="w-full sm:w-auto min-h-[44px] px-6 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-2xl shadow-sm transition-all active:scale-95 touch-manipulation inline-flex items-center justify-center gap-2 self-end"
              >
                {isGeneratingAdaptive ? (
                  <>
                    <RefreshCw className="w-4 h-4 shrink-0 animate-spin" /> AI Đang Cá Nhân Hóa Đề Thi...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 shrink-0" /> Sinh 5 Câu Adaptive Tương Tác Ngay
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Render Adaptive Exercises */}
          {adaptiveExercises.length > 0 && (
            <div>
              {isSessionFinished ? (
                <SessionSummaryCard
                  score={drillScore}
                  total={adaptiveExercises.length}
                  onRestart={handleRestartSession}
                  onBack={() => setAdaptiveExercises([])}
                />
              ) : activeDrill ? (
                <div>
                  <div className="flex justify-between items-center text-xs font-bold text-accent/60 mb-2">
                    <span>Bộ đề Adaptive: Câu {currentDrillIndex + 1} / {adaptiveExercises.length}</span>
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
      {/* MODE 3: PERSONAL VAULT INFUSION DRILLS                                    */}
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
      {/* MODE 4: CUSTOM AI GENERATOR FROM ANY TEXT                                 */}
      {/* ========================================================================= */}
      {activeMode === 'custom_ai' && (
        <div className="flex flex-col gap-5">
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
      {/* MODE 5: MIRROR ERROR SPOTTING FROM USER WRITING LOGS                      */}
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

      {/* ========================================================================= */}
      {/* AI STUDY COACH & GRAMMAR CONSULTATION DRAWER MODAL                        */}
      {/* ========================================================================= */}
      {isCoachOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl border border-primary/20 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border-b border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xs">
                  <Bot className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-accent">Cố Vấn IELTS Oasis & Lộ Trình</h3>
                  <span className="text-[10px] text-accent/60 font-semibold block">Tư vấn lịch học 7 ngày & giải đáp 12 thì</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCoachOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-accent/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="p-3 bg-[#FAF9F5] border-b border-primary/10 flex gap-2 overflow-x-auto text-xs no-scrollbar">
              {[
                "Lập cho tôi lịch học 7 ngày cân đối Từ vựng & Ngữ pháp",
                "Giải thích 12 thì và 3 dạng công thức (+, -, ?)",
                "Mẹo phân biệt A, An, The và Zero Article (Ø)",
                "Hướng dẫn cách dùng đảo ngữ trong IELTS Task 2"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendCoachMessage(chip)}
                  disabled={isCoachLoading}
                  className="px-3 py-1.5 bg-white border border-primary/20 rounded-xl text-accent/80 hover:text-primary hover:border-primary text-[11px] font-bold shrink-0 transition-all active:scale-95 touch-manipulation whitespace-nowrap shadow-2xs"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
              {coachMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-white font-medium shadow-xs'
                        : 'bg-[#FAF9F5] text-accent border border-primary/15 shadow-2xs'
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.text}</div>

                    {/* Render Study Plan if included */}
                    {msg.study_plan && msg.study_plan.daily_focus && (
                      <div className="mt-3 pt-3 border-t border-primary/15 flex flex-col gap-2">
                        <span className="font-black text-primary text-xs uppercase flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> Lộ Trình 7 Ngày Đề Xuất
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          {msg.study_plan.daily_focus.map((d: any, idx: number) => (
                            <div key={idx} className="bg-white p-2.5 rounded-xl border border-primary/10">
                              <span className="font-extrabold text-primary block">{d.day}: {d.skill}</span>
                              <span className="text-accent/75 block mt-0.5">Trọng tâm: {d.grammar_target}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Render Recommended Video if included */}
                    {msg.recommended_video && (
                      <div className="mt-3 pt-3 border-t border-primary/15 flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-rose-200">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Youtube className="w-4 h-4 text-rose-600 shrink-0" />
                          <div className="truncate">
                            <span className="text-xs font-bold text-accent block truncate">{msg.recommended_video.video_title}</span>
                            <span className="text-[10px] text-accent/60 block">{msg.recommended_video.channel_name}</span>
                          </div>
                        </div>
                        <a
                          href={`https://www.youtube.com/watch?v=${msg.recommended_video.youtube_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-rose-600 text-white font-bold text-[11px] rounded-lg shrink-0 hover:bg-rose-700 transition-colors"
                        >
                          Xem Ngay
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isCoachLoading && (
                <div className="flex items-center gap-2 text-xs text-primary font-bold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Cố vấn AI đang phân tích và chuẩn bị lộ trình...
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 bg-white border-t border-primary/10 flex items-center gap-2">
              <input
                type="text"
                value={coachInput}
                onChange={(e) => setCoachInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendCoachMessage();
                }}
                placeholder="Nhập câu hỏi ngữ pháp hoặc yêu cầu lịch học..."
                className="flex-1 min-h-[44px] px-4 text-xs sm:text-sm font-medium text-accent border border-primary/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/25 bg-[#FAF9F5]/70"
              />
              <button
                type="button"
                onClick={() => handleSendCoachMessage()}
                disabled={isCoachLoading || !coachInput.trim()}
                className="min-h-[44px] px-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-2xl transition-all active:scale-95 touch-manipulation inline-flex items-center justify-center gap-1.5 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
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
