"use client";

import React, { useState, useEffect } from 'react';
import { Users, Coffee, Trophy, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const CommunityOasis = ({ onImport }: { onImport: (word: any) => void }) => {
  const [trending, setTrending] = useState<any[]>([]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(`${API_URL}/vocabulary/community`);
        const data = await res.json();
        setTrending(data);
      } catch (err) { console.error(err); }
    };
    fetchTrending();
  }, []);

  const virtualUsers = [
    { name: "User", xp: 2500, level: 15, avatar: "🐻" },
    { name: "MatchaLover", xp: 1800, level: 12, avatar: "🐨" },
    { name: "IELTSKing", xp: 1200, level: 8, avatar: "🐼" },
  ];

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-matcha-soft rounded-2xl flex items-center justify-center">
               <Users className="text-matcha-primary" />
            </div>
            <div>
               <h2 className="text-xl font-black text-latte-brown">Matcha Lounge</h2>
               <p className="text-[10px] font-bold text-matcha-primary uppercase tracking-widest">Community Corner</p>
            </div>
         </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Top Matcha Drinkers</h3>
           {virtualUsers.map((user, i) => (
             <div key={i} className="flex items-center justify-between bg-white/40 p-4 rounded-3xl border border-white/60">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-cream-yellow rounded-2xl flex items-center justify-center text-2xl shadow-inner border-2 border-white">
                      {user.avatar}
                   </div>
                   <div>
                      <p className="font-black text-latte-brown">{user.name}</p>
                      <p className="text-[10px] font-bold text-matcha-primary uppercase">Lv.{user.level} Oasis Walker</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="font-black text-matcha-primary">{user.xp}</p>
                   <p className="text-[8px] font-bold uppercase text-gray-400">Matcha XP</p>
                </div>
             </div>
           ))}
        </div>

        <div className="bg-matcha-primary/10 p-5 rounded-[2.5rem] border-2 border-dashed border-matcha-primary/20">
           <div className="flex items-center gap-3 mb-2">
              <Trophy className="text-matcha-primary w-5 h-5" />
              <p className="text-[10px] font-black uppercase tracking-widest text-matcha-primary">Active Challenge</p>
           </div>
           <p className="text-xs font-bold text-latte-brown leading-relaxed">
              "Collect 5 Technology-related Objects this week to earn a Golden Leaf!"
           </p>
        </div>

        <div className="flex items-center gap-2 bg-cream-yellow p-4 rounded-2xl border border-latte-brown/5 animate-pulse">
           <MessageCircle className="w-4 h-4 text-latte-brown/40" />
           <p className="text-[10px] italic text-latte-brown/60">Someone just learned 'Ubiquitous' in the lounge...</p>
        </div>
      </div>
    </div>
  );
};

export default CommunityOasis;
