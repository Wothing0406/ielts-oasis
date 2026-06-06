"use client";

import React from 'react';
import { PieChart, ListChecks, Music, Timer, Sparkles } from 'lucide-react';

const PersonalProgress = () => {
  return (
    <div className="flex flex-col h-full p-8 space-y-8">
      <div>
         <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-matcha-primary/20 rounded-2xl flex items-center justify-center">
               <PieChart className="text-matcha-primary" />
            </div>
            <div>
               <h2 className="text-xl font-black text-latte-brown">Lab Progress</h2>
               <p className="text-[10px] font-bold text-matcha-primary uppercase tracking-widest">Skill Distribution</p>
            </div>
         </div>
         
         <div className="flex items-center justify-center py-4 relative">
            <div className="w-32 h-32 rounded-full border-[12px] border-matcha-primary border-t-matcha-soft border-r-cream-yellow transform rotate-45 shadow-xl shadow-matcha-primary/5" />
            <div className="absolute inset-0 flex items-center justify-center">
               <p className="text-xl font-black text-latte-brown">75%</p>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-matcha-primary" />
               <span className="text-[10px] font-bold text-gray-400">Writing</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-matcha-soft" />
               <span className="text-[10px] font-bold text-gray-400">Listening</span>
            </div>
         </div>
      </div>

      <div className="pt-6 border-t-2 border-dashed border-latte-brown/5">
         <div className="flex items-center gap-3 mb-4">
            <ListChecks className="text-matcha-primary w-5 h-5" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Daily Quests</h3>
         </div>
         <div className="space-y-3">
            {[
              "Scan 5 Tech Objects",
              "Write 250 words Sanctuary",
              "Take 1 Vocabulary Quiz"
            ].map((quest, i) => (
              <div key={i} className="flex items-center gap-3 group">
                 <div className="w-5 h-5 rounded-md border-2 border-matcha-primary/30 group-hover:bg-matcha-primary transition-all" />
                 <p className="text-xs font-bold text-latte-brown/70">{quest}</p>
              </div>
            ))}
         </div>
      </div>

      <div className="bg-cream-yellow p-5 rounded-[2rem] border border-latte-brown/5">
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
               <Music className="text-latte-brown w-4 h-4" />
               <p className="text-[10px] font-black uppercase text-latte-brown">Matcha Beats</p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
         </div>
         <div className="space-y-2">
            <button type="button" className="w-full py-2 bg-white rounded-xl text-[10px] font-black text-matcha-primary uppercase tracking-widest shadow-sm border border-latte-brown/5">
               Lofi Radio
            </button>
            <button type="button" className="w-full py-2 bg-matcha-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md">
               Pomodoro Timer
            </button>
         </div>
      </div>
    </div>
  );
};

export default PersonalProgress;
