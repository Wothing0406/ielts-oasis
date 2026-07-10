"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  onStartQuiz: () => void 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [activeMode, setActiveMode] = useState<'ai' | 'scroll' | 'manual'>('scroll');
  const [dragOver, setDragOver] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedWords, setExtractedWords] = useState<any[]>([]);
  const [shareToCommunity, setShareToCommunity] = useState(true);
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
        setExtractedWords(data.extracted_words || []);
      } else {
        const errData = await res.json();
        alert(errData.detail || "Có lỗi xảy ra khi trích xuất tài liệu.");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối máy chủ.");
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
        (window as any).showToast("Đã lưu tất cả từ vựng mới! 🍵", "success");
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

  // Auto-focus on the newly added word when vocabulary list grows
  useEffect(() => {
    setCurrentIndex(0);
  }, [vocabList.length]);

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
    meaning: ''
  });

  const current = vocabList[currentIndex] || {
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
      setFormData({ word: '', phonetic: '', meaning: '' });
    } finally {
      setIsAdding(false);
    }
  };

  const next = () => setCurrentIndex((prev) => (prev + 1) % (vocabList.length || 1));
  const prev = () => setCurrentIndex((prev) => (prev - 1 + (vocabList.length || 1)) % (vocabList.length || 1));



  return (
    <div className="w-full h-full p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-bold flex items-center gap-2">
          <span className="material-symbols-rounded text-primary">edit_note</span> Thêm từ mới
        </h3>
        <div className="flex gap-2">
           <button type="button" 
             onClick={() => setActiveMode('ai')}
             className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all ${activeMode === 'ai' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}
           >
             AI
           </button>
           <button type="button" 
             onClick={() => setActiveMode('scroll')}
             className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all ${activeMode === 'scroll' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}
           >
             Scroll
           </button>
           <button type="button" 
             onClick={() => setActiveMode('manual')}
             className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all ${activeMode === 'manual' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}
           >
             Thủ công
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
                    className="w-full px-4 py-2.5 bg-white border border-primary/10 rounded-xl text-sm outline-none placeholder:text-accent/60" 
                    placeholder="Từ tiếng Anh"
                    value={formData.word}
                    onChange={(e) => setFormData({...formData, word: e.target.value})}
                  />
                  <input 
                    className="w-full px-4 py-2.5 bg-white border border-primary/10 rounded-xl text-sm outline-none placeholder:text-accent/60" 
                    placeholder="Phiên âm /.../"
                    value={formData.phonetic}
                    onChange={(e) => setFormData({...formData, phonetic: e.target.value})}
                  />
               </div>
               <input 
                 className="w-full px-4 py-2.5 bg-white border border-primary/10 rounded-xl text-sm outline-none placeholder:text-accent/60" 
                 placeholder="Nghĩa tiếng Việt"
                 value={formData.meaning}
                 onChange={(e) => setFormData({...formData, meaning: e.target.value})}
               />
               <button 
                 type="submit"
                 disabled={isAdding || !formData.word}
                 className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
               >
                 {isAdding ? "Đang thêm..." : "Thêm từ vựng"}
               </button>
            </motion.form>
          ) : activeMode === 'ai' ? (
            <motion.form 
              key="auto"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onSubmit={handleAdd} 
              className="flex items-center mb-6 relative"
            >
              <input 
                className="pl-6 pr-12 py-3.5 bg-secondary border-none rounded-full text-sm w-full outline-none placeholder:text-accent/60" 
                placeholder="Gõ từ để AI tự điền..."
                type="text"
                value={formData.word}
                onChange={(e) => setFormData({...formData, word: e.target.value})}
                disabled={isAdding}
              />
              <button 
                type="submit"
                disabled={isAdding || !formData.word}
                className="absolute right-1.5 w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-opacity"
              >
                {isAdding ? (
                  <span className="material-symbols-rounded animate-spin">sync</span>
                ) : (
                  <span className="material-symbols-rounded">auto_awesome</span>
                )}
              </button>
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
                  accept=".pdf,.docx,.png,.jpg,.jpeg" 
                  className="hidden" 
                />
                <span className="material-symbols-rounded text-4xl text-amber-900/60 mb-2">folder_open</span>
                <h4 className="font-display text-sm font-bold text-amber-950">Khay gỗ mộc mạc (Drag & Drop)</h4>
                <p className="text-xs text-amber-900/70 text-center mt-1">
                  Kéo thả PDF, Word (.docx) hoặc Ảnh chứa từ vựng vào đây
                </p>
                <span className="text-[10px] text-accent/40 mt-2 bg-white px-2 py-0.5 rounded-full border border-primary/10">Tối đa 5 trang / 5MB</span>
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
                      <span className="material-symbols-rounded text-primary text-3xl animate-bounce">eco</span>
                    </motion.div>
                  </div>
                  <p className="text-sm font-bold text-accent animate-pulse font-display">🍵 Đang pha chế Matcha Scroll...</p>
                  <p className="text-xs text-accent/60">Hệ thống đang trích xuất & tối ưu từ vựng IELTS</p>
                </div>
              )}

              {/* Extracted Words List */}
              {extractedWords.length > 0 && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-accent/70">
                      Tìm thấy {extractedWords.length} từ vựng gợi ý:
                    </span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-[11px] font-bold text-primary cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={shareToCommunity} 
                          onChange={(e) => setShareToCommunity(e.target.checked)} 
                          className="rounded border-primary/20 text-primary focus:ring-primary/20"
                        />
                        Chia sẻ Community 🍵
                      </label>
                      <button
                        type="button"
                        disabled={isSavingAll || extractedWords.every(item => vocabList.some(v => v.word.toLowerCase() === item.word.toLowerCase()))}
                        onClick={handleSaveAll}
                        className="bg-accent text-white text-[11px] font-bold px-3 py-1 rounded-full shadow hover:bg-accent-dark transition-all disabled:opacity-50 flex items-center gap-1 shrink-0"
                      >
                        {isSavingAll ? (
                          <>
                            <span className="material-symbols-rounded text-xs animate-spin">sync</span>
                            Đang lưu...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-rounded text-xs">done_all</span>
                            Lưu tất cả
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
                                  className="text-primary/70 hover:text-primary hover:scale-110 active:scale-95 transition-all"
                                >
                                  <span className="material-symbols-rounded text-sm">volume_up</span>
                                </button>
                              </h4>
                              <p className="text-xs font-bold text-primary/80 mt-0.5">Nghĩa: {item.meaning}</p>
                            </div>
                            
                            {isAlreadyAdded ? (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                                Đã có
                              </span>
                            ) : (
                              <button 
                                type="button"
                                onClick={() => handleAddExtracted(item)}
                                className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full shadow hover:bg-primary-dark transition-all flex items-center gap-1 shrink-0"
                              >
                                <span className="material-symbols-rounded text-[10px]">add</span> Thêm
                              </button>
                            )}
                          </div>
                          
                          {item.example && (
                            <p className="text-[11px] text-accent/70 bg-secondary/20 p-2 rounded-lg italic">
                              <strong>Ví dụ:</strong> "{item.example}"
                            </p>
                          )}
                          
                          {item.memory_hook && (
                            <p className="text-[11px] text-amber-900/80 bg-amber-50/20 p-2 rounded-lg border border-amber-900/5">
                              💡 {item.memory_hook}
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
        
        <div className="flex flex-wrap gap-2 mt-4 mb-6">
          {['Environment', 'Tech', 'Health', 'Education', 'Economy'].map((topic) => (
            <button type="button"
              key={topic}
              onClick={() => onGenerateTopic?.(topic)}
              className="px-3 py-1 rounded-full bg-secondary text-accent text-[10px] font-bold hover:bg-primary hover:text-white transition-all"
            >
              {topic}
            </button>
          ))}
        </div>
        
        <div className="flex flex-col items-center w-full mt-8">
          <div className="w-full max-w-[290px] xs:max-w-[320px] sm:max-w-sm flex justify-center">
            <div 
              className="w-full flex justify-center"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
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
            </div>
          </div>

          {/* Controller Row below the card */}
          <div className="flex items-center gap-6 mt-4 z-20">
            <button 
              type="button" 
              onClick={prev} 
              className="p-2.5 bg-white hover:bg-primary/20 rounded-full text-accent shadow-md border border-primary/10 active:scale-95 transition-all"
              aria-label="Previous card"
            >
              <span className="material-symbols-rounded text-xl">chevron_left</span>
            </button>
            <span className="text-xs font-bold text-accent/50">
              {vocabList.length > 0 ? `${currentIndex + 1} / ${vocabList.length}` : '0 / 0'}
            </span>
            <button 
              type="button" 
              onClick={next} 
              className="p-2.5 bg-white hover:bg-primary/20 rounded-full text-accent shadow-md border border-primary/10 active:scale-95 transition-all"
              aria-label="Next card"
            >
              <span className="material-symbols-rounded text-xl">chevron_right</span>
            </button>
          </div>
          
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
             <button type="button" 
               onClick={onStartQuiz}
               className="w-full sm:w-auto bg-accent text-white px-8 py-3 rounded-full font-bold shadow-lg text-sm flex items-center justify-center gap-2 hover:scale-105 transition-all"
             >
               <span className="material-symbols-rounded text-lg">quiz</span> Ôn tập ngay
             </button>
             
             {current.id && current.user_id !== null && current.user_id !== undefined && (
               <button type="button" 
                 onClick={() => onDelete(current.id!)}
                 className="w-full sm:w-auto bg-red-50 text-red-500 px-8 py-3 rounded-full font-bold border border-red-100 text-sm flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"
               >
                 <span className="material-symbols-rounded text-lg">delete</span> Xóa từ này
               </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VocabularyLab;
