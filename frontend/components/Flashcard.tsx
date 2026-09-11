"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface FlashcardProps {
  word: string;
  phonetic: string;
  meaning: string;
  audioPath?: string;
  synonyms?: string[];
  memoryHook?: string;
  imageUrl?: string;
  topic?: string;
  example?: string;
  onAudioClick: () => void;
}

const Flashcard = ({ word, phonetic, meaning, audioPath, synonyms, memoryHook, imageUrl, topic, example, onAudioClick }: FlashcardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="relative w-full max-w-[310px] xs:max-w-[340px] sm:max-w-sm h-[380px] xs:h-[390px] perspective-1000 cursor-pointer group select-none"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="w-full h-full relative preserve-3d transition-transform duration-500"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* Front Face (Matcha English Face) */}
        <div className="absolute inset-0 backface-hidden bg-white border-4 border-primary rounded-large flex flex-col items-center justify-between p-5 xs:p-6 shadow-xl overflow-hidden">
          {/* Top Bar: Topic & Flip hint */}
          <div className="w-full flex items-center justify-between z-10">
            {topic ? (
              <span className="text-[10px] bg-primary/15 text-primary font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                🌿 {topic}
              </span>
            ) : <span />}
            <span className="text-xs text-primary/40 group-hover:text-primary transition-colors flex items-center gap-1 font-semibold">
              <span>Lật thẻ</span>
              <span className="material-symbols-rounded text-sm">cached</span>
            </span>
          </div>

          {/* Center Body: Image + Word + Phonetic + Audio */}
          <div className="flex flex-col items-center justify-center my-auto w-full">
            {imageUrl && (
              <img 
                src={imageUrl} 
                alt={word} 
                className="w-20 h-20 xs:w-24 xs:h-24 object-cover rounded-2xl border-2 border-primary/20 mb-3 shadow-sm"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            
            <h3 className={`font-display font-black text-accent mb-1 text-center px-2 break-words leading-tight tracking-tight ${
              word.length > 15 ? 'text-2xl xs:text-3xl' : word.length > 10 ? 'text-3xl xs:text-4xl' : 'text-4xl xs:text-5xl'
            }`}>
              {word}
            </h3>

            {phonetic && (
              <p className="text-sm xs:text-base font-mono text-neutral-500 italic mt-1 mb-3">
                {phonetic}
              </p>
            )}
            
            <button 
              type="button" 
              onClick={(e) => {
                e.stopPropagation();
                onAudioClick();
              }}
              className="w-11 h-11 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-full flex items-center justify-center transition-all shadow-sm active:scale-90"
              title="Phát âm từ này"
            >
              <span className="material-symbols-rounded text-2xl">volume_up</span>
            </button>
          </div>

          {/* Bottom Hint */}
          <div className="text-[10px] uppercase font-bold tracking-widest text-primary/50 text-center w-full">
            Nhấp để xem nghĩa tiếng Việt & Ví dụ ➔
          </div>
        </div>

        {/* Back Face (Vietnamese Meaning, Context Example, Synonyms, Memory Hook) */}
        <div 
          className="absolute inset-0 backface-hidden bg-[#FFFDF7] border-4 border-primary/30 rounded-large flex flex-col p-4 xs:p-5 shadow-xl overflow-y-auto overscroll-contain"
          style={{ 
            transform: 'rotateY(180deg)',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(167, 208, 140, 0.6) transparent'
          }}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-primary/15 shrink-0">
            <span className="text-[11px] font-bold text-primary flex items-center gap-1">
              <span>🍵</span>
              <span className="uppercase tracking-wider">IELTS Oasis Flashcard</span>
            </span>
            <span className="text-[10px] text-neutral-400 flex items-center gap-0.5">
              <span>Mặt sau</span>
            </span>
          </div>

          {/* Meaning Block */}
          <div className="bg-primary/10 border-2 border-primary/30 px-3.5 py-2.5 rounded-2xl text-center shadow-xs shrink-0 mb-3">
            <div className="text-[10px] font-bold text-primary tracking-wider uppercase mb-0.5">
              Nghĩa tiếng Việt chuẩn
            </div>
            <h4 className="text-xl xs:text-2xl font-black text-emerald-900 break-words leading-snug">
              {meaning || "Chưa có nghĩa"}
            </h4>
          </div>

          {/* Context Example */}
          {example && (
            <div className="bg-white border border-primary/20 rounded-xl p-3 shadow-xs shrink-0 mb-2.5">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-primary/80 mb-1">
                <span className="material-symbols-rounded text-xs">format_quote</span>
                <span>Ví dụ ngữ cảnh (Context):</span>
              </div>
              <p className="text-xs xs:text-sm text-neutral-700 italic leading-relaxed font-serif pl-1">
                "{example}"
              </p>
            </div>
          )}

          {/* Synonyms */}
          {synonyms && synonyms.length > 0 && (
            <div className="bg-white border border-primary/20 rounded-xl p-2.5 shadow-xs shrink-0 mb-2.5">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-primary/80 mb-1.5">
                <span className="material-symbols-rounded text-xs">swap_horiz</span>
                <span>Từ đồng nghĩa (Synonyms):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {synonyms.map((syn, idx) => (
                  <span 
                    key={idx} 
                    className="text-[11px] font-medium bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200"
                  >
                    {syn}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Memory Hook */}
          {memoryHook && (
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 shadow-xs shrink-0 mb-2">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-amber-800 mb-1">
                <span className="material-symbols-rounded text-xs text-amber-600">lightbulb</span>
                <span>Mẹo nhớ siêu tốc (Memory Hook):</span>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed pl-1">
                {memoryHook}
              </p>
            </div>
          )}

          {/* Flip back footer */}
          <div className="mt-auto pt-2 text-[9px] uppercase font-bold tracking-widest text-primary/40 text-center shrink-0">
            Nhấp để lật lại mặt trước ↻
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Flashcard;
