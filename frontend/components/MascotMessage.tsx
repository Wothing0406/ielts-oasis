"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Flame, X } from 'lucide-react';

const MascotMessage = ({ dueCount }: { dueCount: number }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (dueCount > 0) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [dueCount]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed bottom-10 left-10 z-50 hidden md:flex flex-col items-start gap-2"
        >
          <div className="bg-white p-4 rounded-2xl shadow-2xl border-2 border-primary relative max-w-xs">
            <p className="text-accent text-sm font-bold leading-relaxed">
              Hey friend! You have <span className="text-primary">{dueCount} words</span> due for SRS review. Let's do a quick review to keep your streak!
            </p>
            {/* Speech Bubble Tail */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r-2 border-b-2 border-primary rotate-45"></div>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white overflow-hidden group hover:scale-110 transition-transform">
                <Leaf className="text-white w-8 h-8 group-hover:animate-bounce shrink-0" />
             </div>
             <button type="button" 
               onClick={() => setIsVisible(false)}
               className="w-7 h-7 bg-accent text-white rounded-full flex items-center justify-center text-xs shadow-sm hover:bg-red-500 active:scale-90 transition-all cursor-pointer"
               aria-label="Close notification"
             >
               <X className="w-3.5 h-3.5 shrink-0" />
             </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MascotMessage;
