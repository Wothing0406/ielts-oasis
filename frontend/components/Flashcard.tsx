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
      className="relative w-full max-w-[290px] xs:max-w-[320px] sm:max-w-sm h-80 perspective-1000 cursor-pointer group"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="w-full h-full relative preserve-3d transition-transform duration-500"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* Front Face (Matcha) */}
        <div className="absolute inset-0 backface-hidden bg-white border-4 border-primary rounded-large flex flex-col items-center justify-center p-6 shadow-xl">
           {topic && (
             <div className="absolute top-4 left-4">
               <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-1 rounded-full uppercase tracking-wider">{topic}</span>
             </div>
           )}
           {imageUrl ? (
             <img 
               src={imageUrl} 
               alt={word} 
               className="w-24 h-24 object-cover rounded-2xl border-2 border-primary/20 mb-2 shadow-sm"
               onError={(e) => {
                 e.currentTarget.style.display = 'none';
               }}
             />
           ) : (
             <div className="absolute top-4 right-4">
                <span className="material-symbols-rounded text-primary opacity-30 text-3xl">eco</span>
             </div>
           )}
           <h3 className={`font-display font-black text-accent mb-1 text-center px-2 break-words ${
             word.length > 15 ? 'text-xl md:text-2xl' : word.length > 10 ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl'
           }`}>{word}</h3>
           <p className="text-sm opacity-50 italic mb-4">{phonetic}</p>
           
           <button type="button" 
             onClick={(e) => {
               e.stopPropagation();
               onAudioClick();
             }}
             className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all active:scale-90"
           >
             <span className="material-symbols-rounded">volume_up</span>
           </button>
           
           <div className="absolute bottom-4 text-[10px] uppercase font-black tracking-widest opacity-20">Click to reveal</div>
        </div>

        {/* Back Face (Latte) */}
        <div 
          className="absolute inset-0 backface-hidden bg-secondary border-4 border-primary/20 rounded-large flex flex-col items-center justify-center p-4 shadow-xl overflow-hidden"
          style={{ transform: 'rotateY(180deg)' }}
        >
           <div className="bg-white/80 px-6 py-4 rounded-2xl border-2 border-primary/10 shadow-inner w-full mb-3 text-center">
              <h4 className="text-xl font-bold text-accent">{meaning}</h4>
           </div>
           
           {example && (
             <div className="w-full bg-white/50 p-2 rounded-xl border border-primary/10 flex flex-col gap-1 mb-2">
               <span className="text-[10px] font-black uppercase text-primary/60">Ví dụ:</span>
               <p className="text-xs text-accent italic">"{example}"</p>
             </div>
           )}
           
           {synonyms && synonyms.length > 0 && (
             <div className="w-full flex items-center gap-2 mb-2">
               <span className="text-[10px] font-black uppercase text-primary/60 min-w-[50px]">Đồng nghĩa:</span>
               <div className="flex flex-wrap gap-1">
                 {synonyms.map(syn => (
                   <span key={syn} className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-primary/10 text-accent">{syn}</span>
                 ))}
               </div>
             </div>
           )}
           
           {memoryHook && (
             <div className="w-full bg-primary/5 p-2 rounded-xl border border-primary/10 flex items-start gap-2">
               <span className="material-symbols-rounded text-primary text-sm mt-0.5">lightbulb</span>
               <p className="text-[10px] text-accent/80 italic leading-tight">{memoryHook}</p>
             </div>
           )}
           
           <div className="absolute bottom-2 text-[8px] uppercase font-black tracking-widest opacity-20 text-center w-full">Click to flip back</div>
        </div>
      </motion.div>
    </div>
  );
};

export default Flashcard;
