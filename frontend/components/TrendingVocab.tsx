"use client";

import React, { useState, useEffect } from 'react';
import { Leaf, Plus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':8000') : 'http://localhost:8000';

const TrendingVocab = ({ onImport }: { onImport: (word: any) => void }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [vocabList, setVocabList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(`${API_URL}/vocabulary/community`);
        const data = await res.json();
        setVocabList(Array.isArray(data) ? data : []);
      } catch (err) { console.error(err); }
      finally { setIsLoading(false); }
    };
    fetchTrending();
  }, []);

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center gap-3 mb-8">
         <div className="w-12 h-12 bg-matcha-soft rounded-2xl flex items-center justify-center">
            <Leaf className="text-matcha-primary w-6 h-6" />
         </div>
         <div>
            <h2 className="text-xl font-black text-latte-brown">Trending IELTS</h2>
            <p className="text-[10px] font-bold text-matcha-primary uppercase tracking-widest">Global Collective Picks</p>
         </div>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide max-h-[400px]">
         {isLoading ? (
           <div className="flex flex-col items-center justify-center py-20 opacity-20">
              <Loader2 className="animate-spin w-8 h-8 text-matcha-primary" />
           </div>
         ) : vocabList.length > 0 ? (
           vocabList.map((item, i) => (
             <motion.div 
               key={i}
               onHoverStart={() => setHoveredIndex(i)}
               onHoverEnd={() => setHoveredIndex(null)}
               className="relative bg-white/40 border border-white/60 p-4 rounded-3xl flex items-center justify-between group hover:bg-matcha-primary transition-all duration-300 cursor-pointer overflow-hidden"
             >
                <div className="flex items-center gap-4 z-10">
                   <div className="w-2 h-2 rounded-full bg-matcha-primary group-hover:bg-white" />
                   <div>
                      <h3 className="font-black text-latte-brown group-hover:text-white transition-colors">{item.word}</h3>
                      <p className="text-[10px] font-bold text-matcha-primary group-hover:text-white/60 transition-colors">{item.phonetic || "/.../"}</p>
                   </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onImport(item); }}
                  className="bg-white p-2 rounded-xl text-matcha-primary shadow-sm opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0"
                >
                   <Plus className="w-4 h-4" />
                </button>

                <AnimatePresence>
                   {hoveredIndex === i && (
                     <motion.div 
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: 20 }}
                       className="absolute inset-y-0 right-12 flex items-center pr-4 pointer-events-none"
                     >
                        <p className="text-[10px] font-black text-white uppercase italic truncate max-w-[100px]">
                           {item.meaning}
                        </p>
                     </motion.div>
                   )}
                </AnimatePresence>
             </motion.div>
           ))
         ) : (
           <p className="text-center text-xs text-gray-400 italic py-10">No trending words yet.</p>
         )}
      </div>

      <div className="mt-8 p-4 bg-cream-yellow rounded-3xl border border-latte-brown/5">
         <p className="text-[10px] text-latte-brown/60 font-bold uppercase tracking-widest text-center">
            Collective Intelligence Feed
         </p>
      </div>
    </div>
  );
};

export default TrendingVocab;
