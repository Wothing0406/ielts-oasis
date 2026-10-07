"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PenLine, 
  Sparkles, 
  FolderOpen, 
  RotateCw, 
  PlusCircle, 
  CheckCheck, 
  Volume2, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  GraduationCap, 
  Trash2, 
  Lightbulb, 
  Leaf, 
  Loader2 
} from 'lucide-react';
import Flashcard from './Flashcard';

const API_URL = '/api';

interface VocabItem {
  id?: number;
  user_id?: number | null;
  word: string;
  phonetic: string;
  meaning: string;
  example?: string;
  synonyms?: string[];
  memory_hook?: string;
  audio_path?: string;
  image_url?: string;
  topic?: string;
  source?: string;
}

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


const VocabularyLab = ({ vocabList, onAdd, onDelete, onGenerateTopic, onStartQuiz }: { 
  vocabList: VocabItem[], 
  onAdd: (word: any) => Promise<void>, 
  onDelete: (id: number) => Promise<void>, 
  onGenerateTopic?: (topic: string) => Promise<void>,
  onStartQuiz: (selectedTopic?: string | null, customVocabList?: VocabItem[]) => void 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [activeMode, setActiveMode] = useState<'ai' | 'scroll' | 'manual'>('scroll');
  const [dragOver, setDragOver] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedWords, setExtractedWords] = useState<any[]>([]);
  const [shareToCommunity, setShareToCommunity] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setIsExtracting(true);
    setExtractedWords([]);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_URL}/scroll/extract`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const words = data.extracted_words || [];
        setExtractedWords(words);
        if (words.length > 0) {
          if ((window as any).showToast) {
            (window as any).showToast(`Đã tìm thấy ${words.length} từ vựng từ tài liệu!`, "success");
          }
        } else {
          if ((window as any).showToast) {
            (window as any).showToast("Không tìm thấy từ vựng nào trong các trang đầu của tài liệu.", "info");
          }
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        const msg = errData.detail || "Có lỗi xảy ra khi trích xuất tài liệu.";
        if ((window as any).showToast) {
          (window as any).showToast(msg, "error");
        } else {
          alert(msg);
        }
      }
    } catch (err) {
      console.error(err);
      if ((window as any).showToast) {
        (window as any).showToast("Lỗi kết nối máy chủ khi tải tệp.", "error");
      } else {
        alert("Lỗi kết nối máy chủ.");
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddExtracted = async (item: any) => {
    const isDuplicate = vocabList.some(v => v.word.toLowerCase() === item.word.toLowerCase());
    if (isDuplicate) return;
    
    try {
      await onAdd({
        word: item.word,
        phonetic: item.phonetic,
        meaning: item.meaning,
        example: item.example,
        synonyms: item.synonyms,
        topic: item.topic,
        memory_hook: item.memory_hook,
        is_global: shareToCommunity,
        source: "Matcha Scroll"
      });
    } catch (e) {
      console.error(e);
    }
  };

  const [isSavingAll, setIsSavingAll] = useState(false);

  const handleSaveAll = async () => {
    const toAdd = extractedWords.filter(
      (item: any) => !vocabList.some((v) => v.word.toLowerCase() === item.word.toLowerCase())
    );
    if (toAdd.length === 0) return;
    
    setIsSavingAll(true);
    try {
      for (const item of toAdd) {
        await onAdd({
          word: item.word,
          phonetic: item.phonetic,
          meaning: item.meaning,
          example: item.example,
          synonyms: item.synonyms,
          topic: item.topic,
          memory_hook: item.memory_hook,
          is_global: shareToCommunity,
          source: "Matcha Scroll"
        });
      }
      if ((window as any).showToast) {
        (window as any).showToast("Đã lưu tất cả từ vựng mới!", "success");
      }
    } catch (e) {
      console.error(e);
      if ((window as any).showToast) {
        (window as any).showToast("Lỗi khi lưu danh sách từ vựng.", "error");
      }
    } finally {
      setIsSavingAll(false);
    }
  };

  // Topic Filter State & Filtered List
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const filteredVocabList = useMemo(() => {
    // 1. Filter by topic
    let list = vocabList;
    if (selectedTopic && selectedTopic !== 'All') {
      const t = selectedTopic.toLowerCase();
      list = vocabList.filter((v) => {
        const vTopic = (v.topic || '').toLowerCase();
        const vMeaning = (v.meaning || '').toLowerCase();
        const vSource = (v.source || '').toLowerCase();

        if (t === 'awl') {
          return vTopic.includes('awl') || vSource.includes('awl') || vTopic.includes('academic');
        }
        if (t === 'tech') {
          return vTopic.includes('tech') || vMeaning.includes('công nghệ');
        }
        if (t === 'health') {
          return vTopic.includes('health') || vTopic.includes('medicin') || vMeaning.includes('sức khỏe');
        }
        if (t === 'economy') {
          return vTopic.includes('econom') || vTopic.includes('business') || vMeaning.includes('kinh tế');
        }
        if (t === 'environment') {
          return vTopic.includes('environ') || vMeaning.includes('môi trường');
        }
        if (t === 'education') {
          return vTopic.includes('educat') || vMeaning.includes('giáo dục');
        }
        if (t === 'society') {
          return vTopic.includes('societ') || vTopic.includes('social') || vMeaning.includes('xã hội');
        }
        return vTopic.includes(t);
      });
    }

    // 2. Strict deduplication by word (case-insensitive and trimmed)
    const seen = new Set<string>();
    const deduplicated: any[] = [];
    for (const item of list) {
      const w = (item.word || '').trim().toLowerCase();
      if (w && !seen.has(w)) {
        seen.add(w);
        deduplicated.push(item);
      }
    }
    return deduplicated;
  }, [vocabList, selectedTopic]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedTopic]);

  // Keep currentIndex clamped safely within bounds when vocabulary list changes
  const prevListLengthRef = React.useRef(vocabList.length);
  useEffect(() => {
    if (vocabList.length > prevListLengthRef.current) {
      // If newly added, focus on top
      setCurrentIndex(0);
    } else {
      // If deleted/shrunk, safely clamp currentIndex
      setCurrentIndex(prev => Math.max(0, Math.min(prev, Math.max(0, filteredVocabList.length - 1))));
    }
    prevListLengthRef.current = vocabList.length;
  }, [vocabList.length, filteredVocabList.length]);

  // Swipe gesture hooks
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      next();
    } else if (isRightSwipe) {
      prev();
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    word: '',
    phonetic: '',
    meaning: '',
    topic: 'General',
    is_global: false
  });

  const TOPIC_OPTIONS = [
    { value: 'General', label: 'Chung / Khác' },
    { value: 'Environment', label: 'Môi trường (Environment)' },
    { value: 'Technology', label: 'Công nghệ (Technology)' },
    { value: 'Health', label: 'Sức khỏe (Health)' },
    { value: 'Education', label: 'Giáo dục (Education)' },
    { value: 'Economy', label: 'Kinh tế (Economy)' },
    { value: 'Society', label: 'Xã hội (Society)' },
    { value: 'AWL', label: 'Academic (AWL)' },
  ];

  const current = filteredVocabList[currentIndex] || {
    word: "Matcha",
    phonetic: "/ˈmætʃ.ə/",
    meaning: "Bột trà xanh Nhật Bản",
    example: "Matcha is a finely ground powder of specially grown and processed green tea leaves.",
    synonyms: ["Trà xanh", "Green tea"],
    topic: "Food & Drink",
    memory_hook: "Matcha (mát trà) -> Trà xanh rất mát.",
    image_url: "/logo.png"
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.word || isAdding) return;
    setIsAdding(true);
    try {
      await onAdd(formData);
      setFormData({ word: '', phonetic: '', meaning: '', topic: 'General', is_global: false });
    } finally {
      setIsAdding(false);
    }
  };

  const next = () => setCurrentIndex((prev) => (prev + 1) % (filteredVocabList.length || 1));
  const prev = () => setCurrentIndex((prev) => (prev - 1 + (filteredVocabList.length || 1)) % (filteredVocabList.length || 1));

  return (
    <div className="w-full h-full p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-bold flex items-center gap-2 text-accent">
          <PenLine className="w-5 h-5 text-primary shrink-0" /> Add New Vocab
        </h3>
        <div className="flex gap-2">
           <button type="button" 
             onClick={() => setActiveMode('ai')}
             className={`min-h-[36px] text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-all touch-manipulation active:scale-95 ${activeMode === 'ai' ? 'bg-primary text-white shadow-sm' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
           >
             AI
           </button>
           <button type="button" 
             onClick={() => setActiveMode('scroll')}
             className={`min-h-[36px] text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-all touch-manipulation active:scale-95 ${activeMode === 'scroll' ? 'bg-primary text-white shadow-sm' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
           >
             Scroll
           </button>
           <button type="button" 
             onClick={() => setActiveMode('manual')}
             className={`min-h-[36px] text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-all touch-manipulation active:scale-95 ${activeMode === 'manual' ? 'bg-primary text-white shadow-sm' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
           >
             Manual
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <AnimatePresence mode="wait">
          {activeMode === 'manual' ? (
            <motion.form 
              key="manual"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onSubmit={handleAdd} 
              className="mb-6 p-4 bg-secondary/30 rounded-2xl border border-primary/10 space-y-3"
            >
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input 
                    className="w-full min-h-[44px] px-4 py-2.5 bg-white border border-primary/10 rounded-xl text-sm outline-none placeholder:text-accent/60 focus:border-primary/40 focus:ring-1 focus:ring-primary/30" 
                    placeholder="English Word (e.g. Sustainable)" 
                    value={formData.word}
                    onChange={(e) => setFormData({...formData, word: e.target.value})}
                  />
                  <input 
                    className="w-full min-h-[44px] px-4 py-2.5 bg-white border border-primary/10 rounded-xl text-sm outline-none placeholder:text-accent/60 focus:border-primary/40 focus:ring-1 focus:ring-primary/30" 
                    placeholder="IPA Phonetics /.../" 
                    value={formData.phonetic}
                    onChange={(e) => setFormData({...formData, phonetic: e.target.value})}
                  />
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <input 
                   className="w-full min-h-[44px] px-4 py-2.5 bg-white border border-primary/10 rounded-xl text-sm outline-none placeholder:text-accent/60 focus:border-primary/40 focus:ring-1 focus:ring-primary/30" 
                   placeholder="Vietnamese Meaning"
                   value={formData.meaning}
                   onChange={(e) => setFormData({...formData, meaning: e.target.value})}
                 />
                 <select
                   className="w-full min-h-[44px] px-4 py-2.5 bg-white border border-primary/10 rounded-xl text-sm font-semibold text-accent outline-none cursor-pointer focus:border-primary/40 focus:ring-1 focus:ring-primary/30"
                   value={formData.topic}
                   onChange={(e) => setFormData({...formData, topic: e.target.value})}
                 >
                   {TOPIC_OPTIONS.map(opt => (
                     <option key={opt.value} value={opt.value}>{opt.label}</option>
                   ))}
                 </select>
               </div>

               <div className="flex items-center justify-between pt-1">
                 <label className="flex items-center gap-2 text-xs font-bold text-primary cursor-pointer select-none">
                   <input 
                     type="checkbox"
                     checked={formData.is_global}
                     onChange={(e) => setFormData({...formData, is_global: e.target.checked})}
                     className="rounded border-primary/20 text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer"
                   />
                   <span>Chia sẻ lên cộng đồng Oasis</span>
                 </label>
               </div>

               <button 
                 type="submit"
                 disabled={isAdding || !formData.word}
                 className="w-full min-h-[44px] bg-primary text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation active:scale-95"
               >
                 {isAdding ? (
                   <>
                     <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                     <span>Đang thêm...</span>
                   </>
                 ) : (
                   <>
                     <PlusCircle className="w-4 h-4 shrink-0" />
                     <span>Thêm từ vựng</span>
                   </>
                 )}
               </button>
            </motion.form>
          ) : activeMode === 'ai' ? (
            <motion.form 
              key="auto"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onSubmit={handleAdd} 
              className="mb-6 space-y-2.5"
            >
              <div className="flex items-center relative">
                <input 
                  className="pl-6 pr-12 py-3.5 min-h-[44px] bg-secondary border-none rounded-full text-sm w-full outline-none placeholder:text-accent/60 shadow-inner focus:ring-2 focus:ring-primary/20" 
                  placeholder="Gõ từ tiếng Anh để AI tự động tra cứu..."
                  type="text"
                  value={formData.word}
                  onChange={(e) => setFormData({...formData, word: e.target.value})}
                  disabled={isAdding}
                />
                <button 
                  type="submit"
                  disabled={isAdding || !formData.word}
                  className="absolute right-1.5 w-10 h-10 min-w-[40px] min-h-[40px] bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-all hover:shadow active:scale-95 touch-manipulation"
                  aria-label="AI Tra cứu"
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  ) : (
                    <Sparkles className="w-4 h-4 shrink-0" />
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between px-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-accent/60 font-semibold text-[11px]">Chủ đề:</span>
                  <select
                    className="bg-secondary/60 text-accent font-bold text-[11px] px-2.5 py-1 min-h-[32px] rounded-lg border border-primary/10 outline-none cursor-pointer"
                    value={formData.topic}
                    onChange={(e) => setFormData({...formData, topic: e.target.value})}
                  >
                    {TOPIC_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-1.5 font-bold text-primary cursor-pointer select-none text-[11px]">
                  <input 
                    type="checkbox"
                    checked={formData.is_global}
                    onChange={(e) => setFormData({...formData, is_global: e.target.checked})}
                    className="rounded border-primary/20 text-primary focus:ring-primary/20 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Chia sẻ cùng cộng đồng</span>
                </label>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="scroll"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-6 space-y-4"
            >
              {/* Cozy Wooden Tray Upload Zone */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`w-full py-8 px-4 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer ${
                  dragOver 
                    ? 'border-primary bg-primary/5 scale-[0.98]' 
                    : 'border-amber-950/20 bg-amber-50/10 hover:bg-amber-50/20'
                }`}
                style={{
                  boxShadow: 'inset 0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  backgroundImage: 'linear-gradient(to bottom right, rgba(139, 90, 43, 0.03), rgba(139, 90, 43, 0.08))',
                  border: '3px double rgba(139, 90, 43, 0.25)'
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp" 
                  className="hidden" 
                />
                <FolderOpen className="w-10 h-10 text-amber-900/60 mb-2 shrink-0" />
                <h4 className="font-display text-sm font-bold text-amber-950">Matcha Dropzone (Drag & Drop)</h4>
                <p className="text-xs text-amber-900/70 text-center mt-1">
                  Kéo thả file PDF, Word (.docx), hoặc ảnh chứa từ vựng vào đây
                </p>
                <span className="text-[10px] text-accent/50 mt-2 bg-white px-2.5 py-0.5 rounded-full border border-primary/10">Tối đa 5 trang / 5MB</span>
              </div>

              {/* Loading State - Matcha Infusing */}
              {isExtracting && (
                <div className="flex flex-col items-center justify-center py-10 space-y-4 bg-secondary/10 rounded-2xl border border-primary/5">
                  <div className="relative w-20 h-20">
                    <motion.div 
                      className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div 
                      className="absolute inset-3 rounded-full bg-primary/10 flex items-center justify-center"
                      animate={{ scale: [0.9, 1.1, 0.9] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Leaf className="w-8 h-8 text-primary animate-bounce shrink-0" />
                    </motion.div>
                  </div>
                  <p className="text-sm font-bold text-accent animate-pulse font-display">Đang xử lý Matcha Scroll...</p>
                  <p className="text-xs text-accent/60">Hệ thống đang trích xuất & tối ưu từ vựng IELTS</p>
                </div>
              )}

              {/* Extracted Words List */}
              {extractedWords.length > 0 && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-accent/70">
                      Tìm thấy {extractedWords.length} từ vựng:
                    </span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-[11px] font-bold text-primary cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={shareToCommunity} 
                          onChange={(e) => setShareToCommunity(e.target.checked)} 
                          className="rounded border-primary/20 text-primary focus:ring-primary/20"
                        />
                        <span>Chia sẻ cùng cộng đồng</span>
                      </label>
                      <button
                        type="button"
                        disabled={isSavingAll || extractedWords.every(item => vocabList.some(v => v.word.toLowerCase() === item.word.toLowerCase()))}
                        onClick={handleSaveAll}
                        className="bg-accent text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow hover:bg-accent-dark transition-all disabled:opacity-50 flex items-center gap-1 shrink-0 touch-manipulation active:scale-95 min-h-[32px]"
                      >
                        {isSavingAll ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                            <span>Đang lưu...</span>
                          </>
                        ) : (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>Lưu tất cả</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                    {extractedWords.map((item, idx) => {
                      const isAlreadyAdded = vocabList.some(v => v.word.toLowerCase() === item.word.toLowerCase());
                      return (
                        <div 
                          key={idx}
                          className="p-3 bg-white border border-primary/10 rounded-xl space-y-2 relative shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 pr-2">
                              <h4 className="font-display font-bold text-sm text-accent flex items-center flex-wrap gap-1.5">
                                <span className="text-primary">{item.word}</span>
                                {item.phonetic && (
                                  <span className="text-[11px] font-normal text-accent/50">{item.phonetic}</span>
                                )}
                                <button 
                                  type="button" 
                                  onClick={() => playAudio(item.word)}
                                  className="text-primary/70 hover:text-primary hover:scale-110 active:scale-95 transition-all p-1 rounded-full hover:bg-primary/10 min-w-[28px] min-h-[28px] inline-flex items-center justify-center"
                                  title="Nghe phát âm"
                                >
                                  <Volume2 className="w-4 h-4 shrink-0" />
                                </button>
                              </h4>
                              <p className="text-xs font-bold text-primary/80 mt-0.5">Nghĩa: {item.meaning}</p>
                            </div>
                            
                            {isAlreadyAdded ? (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full shrink-0">
                                Đã lưu
                              </span>
                            ) : (
                              <button 
                                type="button"
                                onClick={() => handleAddExtracted(item)}
                                className="bg-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow hover:bg-primary-dark transition-all flex items-center gap-1 shrink-0 touch-manipulation active:scale-95 min-h-[30px]"
                              >
                                <Plus className="w-3.5 h-3.5 shrink-0" /> Thêm
                              </button>
                            )}
                          </div>
                          
                          {item.example && (
                            <p className="text-[11px] text-accent/70 bg-secondary/20 p-2 rounded-lg italic">
                              <strong>Ví dụ:</strong> "{item.example}"
                            </p>
                          )}
                          
                          {item.memory_hook && (
                            <p className="text-[11px] text-amber-900/80 bg-amber-50/20 p-2 rounded-lg border border-amber-900/5 flex items-start gap-1">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                              <span>{item.memory_hook}</span>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Vault & Topic Info Banner */}
        <div className="flex items-center justify-between text-xs font-bold text-accent/70 mt-4 mb-2 px-1">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-primary shrink-0" />
            <span>Kho từ vựng: <strong className="text-primary">{vocabList.length}</strong> từ</span>
            {selectedTopic && (
              <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-black">
                {filteredVocabList.length} từ chủ đề {selectedTopic}
              </span>
            )}
          </div>
          {selectedTopic && (
            <button
              type="button"
              onClick={() => setSelectedTopic(null)}
              className="text-[11px] text-accent/60 hover:text-primary transition-colors underline decoration-dotted cursor-pointer"
            >
              Xem tất cả kho
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {['All', 'AWL', 'Environment', 'Tech', 'Health', 'Education', 'Economy', 'Society'].map((topic) => {
            const topicLabels: Record<string, string> = {
              'All': 'Tất cả',
              'AWL': 'AWL (Academic)',
              'Environment': 'Môi trường',
              'Tech': 'Công nghệ',
              'Health': 'Sức khỏe',
              'Education': 'Giáo dục',
              'Economy': 'Kinh tế',
              'Society': 'Xã hội'
            };
            return (
              <button type="button"
                key={topic}
                onClick={() => setSelectedTopic(topic === 'All' ? null : topic)}
                className={`min-h-[36px] px-3.5 py-1 rounded-full text-xs font-bold transition-all border touch-manipulation active:scale-95 cursor-pointer ${
                  (topic === 'All' && !selectedTopic) || (selectedTopic?.toLowerCase() === topic.toLowerCase())
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-secondary text-accent border-transparent hover:bg-primary hover:text-white'
                }`}
              >
                {topicLabels[topic] || topic}
              </button>
            );
          })}
        </div>
        
        <div className="flex flex-col items-center w-full mt-6">
          <div className="w-full max-w-[310px] xs:max-w-[340px] sm:max-w-sm flex justify-center">
            <div 
              className="w-full flex justify-center min-h-[380px] xs:min-h-[390px]"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id ? `card-${current.id}` : `card-${current.word}-${currentIndex}`}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full flex justify-center"
                >
                  <Flashcard 
                    word={current.word}
                    phonetic={current.phonetic}
                    meaning={current.meaning}
                    audioPath={current.audio_path}
                    synonyms={current.synonyms}
                    memoryHook={current.memory_hook}
                    imageUrl={current.image_url}
                    topic={current.topic}
                    example={current.example}
                    onAudioClick={() => playAudio(current.word)}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Controller Row below the card */}
          <div className="flex items-center gap-6 mt-4 z-20">
            <button 
              type="button" 
              onClick={prev} 
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white hover:bg-primary/20 rounded-full text-accent shadow-md border border-primary/10 active:scale-95 transition-all touch-manipulation cursor-pointer"
              aria-label="Previous card"
            >
              <ChevronLeft className="w-5 h-5 shrink-0" />
            </button>
            <span className="text-xs font-bold text-accent/50 select-none">
              {filteredVocabList.length > 0 ? `${currentIndex + 1} / ${filteredVocabList.length}` : '0 / 0'}
            </span>
            <button 
              type="button" 
              onClick={next} 
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white hover:bg-primary/20 rounded-full text-accent shadow-md border border-primary/10 active:scale-95 transition-all touch-manipulation cursor-pointer"
              aria-label="Next card"
            >
              <ChevronRight className="w-5 h-5 shrink-0" />
            </button>
          </div>
          
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
             <button type="button" 
               onClick={() => onStartQuiz(selectedTopic, filteredVocabList)}
               className="w-full sm:w-auto min-h-[44px] bg-primary text-white px-7 py-3 rounded-full font-bold shadow-lg text-sm flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all touch-manipulation cursor-pointer"
             >
               <GraduationCap className="w-5 h-5 shrink-0" />
               <span>
                 {selectedTopic 
                   ? `Ôn tập chủ đề (${filteredVocabList.length} từ)` 
                   : `Ôn tập toàn kho (${vocabList.length} từ)`}
               </span>
             </button>
             
             {selectedTopic && (
               <button 
                 type="button" 
                 onClick={() => onStartQuiz(null, vocabList)}
                 className="w-full sm:w-auto min-h-[44px] bg-accent text-white px-6 py-3 rounded-full font-bold shadow-md text-sm flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all touch-manipulation cursor-pointer"
                 title="Học hết toàn bộ từ vựng đã có trong kho"
               >
                 <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                 <span>Học hết cả kho ({vocabList.length} từ)</span>
               </button>
             )}
             
             {current.id && current.user_id !== null && current.user_id !== undefined && (
               <button type="button" 
                 onClick={() => onDelete(current.id!)}
                 className="w-full sm:w-auto min-h-[44px] bg-red-50 text-red-500 px-6 py-3 rounded-full font-bold border border-red-100 text-sm flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all active:scale-95 touch-manipulation cursor-pointer"
               >
                 <Trash2 className="w-5 h-5 shrink-0" />
                 <span>Xóa từ này</span>
               </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VocabularyLab;
