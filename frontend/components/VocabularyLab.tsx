"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Flashcard from './Flashcard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface VocabItem {
  id?: number;
  word: string;
  phonetic: string;
  meaning: string;
  example?: string;
  audio_path?: string;
}

const VocabularyLab = ({ vocabList, onAdd, onDelete, onGenerateTopic, onStartQuiz }: { 
  vocabList: VocabItem[], 
  onAdd: (word: any) => Promise<void>, 
  onDelete: (id: number) => Promise<void>, 
  onGenerateTopic: (topic: string) => Promise<void>,
  onStartQuiz: () => void 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(true);

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

  const playAudio = async (word: string) => {
    try {
      const res = await fetch(`${API_URL}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word }),
      });
      const data = await res.json();
      if (data.audio_url) {
        // Correct path for proxied static files
        const audio = new Audio(data.audio_url);
        audio.play();
      }
    } catch (err) { console.error("TTS error:", err); }
  };

  return (
    <section className="xl:col-span-8 matcha-card p-4 bento-card flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-bold flex items-center gap-2">
          <span className="material-symbols-rounded text-primary">edit_note</span> Thêm từ mới
        </h3>
        <div className="flex gap-2">
           <button 
             onClick={() => setShowAdvanced(false)}
             className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all ${!showAdvanced ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}
           >
             AI
           </button>
           <button 
             onClick={() => setShowAdvanced(true)}
             className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all ${showAdvanced ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}
           >
             Thủ công
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <AnimatePresence mode="wait">
          {showAdvanced ? (
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
                    className="w-full px-4 py-2.5 bg-white border border-primary/10 rounded-xl text-sm outline-none" 
                    placeholder="Từ tiếng Anh"
                    value={formData.word}
                    onChange={(e) => setFormData({...formData, word: e.target.value})}
                  />
                  <input 
                    className="w-full px-4 py-2.5 bg-white border border-primary/10 rounded-xl text-sm outline-none" 
                    placeholder="Phiên âm /.../"
                    value={formData.phonetic}
                    onChange={(e) => setFormData({...formData, phonetic: e.target.value})}
                  />
               </div>
               <input 
                 className="w-full px-4 py-2.5 bg-white border border-primary/10 rounded-xl text-sm outline-none" 
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
          ) : (
            <motion.form 
              key="auto"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onSubmit={handleAdd} 
              className="flex items-center mb-6 relative"
            >
              <input 
                className="pl-6 pr-12 py-3.5 bg-secondary border-none rounded-full text-sm w-full outline-none" 
                placeholder="Gõ từ để AI tự điền..."
                type="text"
                value={formData.word}
                onChange={(e) => setFormData({...formData, word: e.target.value})}
                disabled={isAdding}
              />
              <button 
                type="submit"
                className="absolute right-1.5 w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center"
              >
                <span className="material-symbols-rounded">auto_awesome</span>
              </button>
            </motion.form>
          )}
        </AnimatePresence>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {['Environment', 'Tech', 'Health', 'Education', 'Economy'].map((topic) => (
            <button
              key={topic}
              onClick={() => onGenerateTopic(topic)}
              className="px-3 py-1 rounded-full bg-secondary text-accent text-[10px] font-bold hover:bg-primary hover:text-white transition-all"
            >
              {topic}
            </button>
          ))}
        </div>
        
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-4 w-full justify-center">
            <button onClick={prev} className="p-2 hover:bg-primary/10 rounded-full text-accent">
              <span className="material-symbols-rounded text-3xl">chevron_left</span>
            </button>
            
            <Flashcard 
              word={current.word}
              phonetic={current.phonetic}
              meaning={current.meaning}
              audioPath={current.audio_path}
              onAudioClick={() => playAudio(current.word)}
            />
            
            <button onClick={next} className="p-2 hover:bg-primary/10 rounded-full text-accent">
              <span className="material-symbols-rounded text-3xl">chevron_right</span>
            </button>
          </div>
          
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
             <button 
               onClick={onStartQuiz}
               className="w-full sm:w-auto bg-accent text-white px-8 py-3 rounded-full font-bold shadow-lg text-sm flex items-center justify-center gap-2 hover:scale-105 transition-all"
             >
               <span className="material-symbols-rounded text-lg">quiz</span> Ôn tập ngay
             </button>
             
             {current.id && (
               <button 
                 onClick={() => onDelete(current.id!)}
                 className="w-full sm:w-auto bg-red-50 text-red-500 px-8 py-3 rounded-full font-bold border border-red-100 text-sm flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"
               >
                 <span className="material-symbols-rounded text-lg">delete</span> Xóa từ này
               </button>
             )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default VocabularyLab;
