"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface FlashcardProps {
  word: string;
  phonetic: string;
  meaning: string;
  audioPath?: string;
  onAudioClick: () => void;
}

const Flashcard = ({ word, phonetic, meaning, audioPath, onAudioClick }: FlashcardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="relative w-full max-w-sm h-64 perspective-1000 cursor-pointer group"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="w-full h-full relative preserve-3d transition-transform duration-500"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* Front Face (Matcha) */}
        <div className="absolute inset-0 backface-hidden bg-white border-4 border-primary rounded-large flex flex-col items-center justify-center p-6 shadow-xl">
           <div className="absolute top-4 right-4">
              <span className="material-symbols-rounded text-primary opacity-30 text-3xl">eco</span>
           </div>
           <h3 className="text-4xl font-display font-black text-accent mb-2">{word}</h3>
           <p className="text-sm opacity-50 italic mb-6">{phonetic}</p>
           
           <button 
             onClick={(e) => {
               e.stopPropagation();
               onAudioClick();
             }}
             className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all active:scale-90"
           >
             <span className="material-symbols-rounded">volume_up</span>
           </button>
           
           <div className="absolute bottom-4 text-[10px] uppercase font-black tracking-widest opacity-20">Click to reveal</div>
        </div>

        {/* Back Face (Latte) */}
        <div 
          className="absolute inset-0 backface-hidden bg-secondary border-4 border-primary/20 rounded-large flex flex-col items-center justify-center p-6 shadow-xl"
          style={{ transform: 'rotateY(180deg)' }}
        >
           <div className="bg-white/80 px-8 py-6 rounded-2xl border-2 border-primary/10 shadow-inner">
              <h4 className="text-2xl font-bold text-accent text-center">{meaning}</h4>
           </div>
           
           <div className="absolute bottom-4 text-[10px] uppercase font-black tracking-widest opacity-20">Click to flip back</div>
        </div>
      </motion.div>
    </div>
  );
};

export default Flashcard;
