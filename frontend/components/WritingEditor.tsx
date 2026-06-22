"use client";

import React, { useState } from 'react';
import { PenTool, CheckCircle, Sparkles, Send, Loader2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = '/api';

const WritingSanctuary = () => {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async (mode?: string) => {
    if (!text) return;
    setIsAnalyzing(true);
    try {
      const startRes = await fetch(`/api/writing/analyze/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      if (!startRes.ok) throw new Error(`Server error: ${startRes.status}`);
      const { task_id } = await startRes.json();
      
      const poll = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/writing/analyze/status/${task_id}`);
          if (statusRes.ok) {
            const data = await statusRes.json();
            if (data.status === "completed") {
              clearInterval(poll);
              setAnalysis(data.result);
              setIsAnalyzing(false);
            } else if (data.status === "failed") {
              clearInterval(poll);
              throw new Error(data.error || "Analysis failed");
            }
          }
        } catch (err: any) {
          clearInterval(poll);
          console.error("Polling error:", err);
          alert(`Grading failed: ${err.message}`);
          setIsAnalyzing(false);
        }
      }, 3000);

    } catch (err: any) { 
      console.error("Analysis failed:", err);
      alert(`Grading failed: ${err.message}`);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-8 bg-cream-yellow/30 relative overflow-hidden">
      {/* Bear Mascot Sticker */}
      <div className="absolute top-6 right-8 w-24 h-24 pointer-events-none opacity-20">
         <span className="text-6xl">✍️</span>
      </div>

      <div className="flex items-center gap-3 mb-8">
         <div className="w-14 h-14 bg-matcha-primary rounded-3xl flex items-center justify-center shadow-lg shadow-matcha-primary/20">
            <PenTool className="text-white w-7 h-7" />
         </div>
         <div>
            <h2 className="text-2xl font-black text-latte-brown tracking-tighter">AI Writing Mentor</h2>
            <p className="text-[10px] font-bold text-matcha-primary uppercase tracking-[0.2em]">Task 2 Sanctuary</p>
         </div>
      </div>

      <div className="relative flex-1 group">
        <textarea 
          className="w-full h-full p-10 bg-cream-yellow paper-texture rounded-[2.5rem] border-2 border-latte-brown/5 focus:border-matcha-primary focus:ring-0 transition-all text-latte-brown font-medium text-lg resize-none shadow-inner"
          placeholder="Start your IELTS essay journey here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="absolute bottom-6 right-6 flex gap-3">
           <button type="button" 
             onClick={() => handleAnalyze('score')}
             disabled={isAnalyzing}
             className="matcha-btn flex items-center gap-2"
           >
             {isAnalyzing ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
             Check Band
           </button>
           <button type="button" 
             onClick={() => handleAnalyze('feedback')}
             disabled={isAnalyzing}
             className="bg-white text-latte-brown font-black px-6 py-3 rounded-2xl shadow-md hover:bg-matcha-soft transition-all flex items-center gap-2 border border-latte-brown/10"
           >
             <Sparkles className="text-matcha-primary w-4 h-4" />
             Get Feedback
           </button>
        </div>
      </div>

      <AnimatePresence>
        {analysis && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-8 bg-white border-4 border-matcha-primary rounded-[3rem] shadow-2xl relative"
          >
             <button type="button" onClick={() => setAnalysis(null)} className="absolute top-4 right-4 text-gray-300 hover:text-red-400"><Send className="w-4 h-4 rotate-45" /></button>
             <div className="flex items-center gap-4 mb-4">
                <div className="bg-matcha-primary text-white px-4 py-2 rounded-xl font-black text-xl shadow-md">
                   Band {analysis.band_score}
                </div>
                <h3 className="font-black text-latte-brown">Oasis Analysis</h3>
             </div>
             <p className="text-sm text-latte-brown/80 leading-relaxed font-medium italic">
                "{analysis.feedback}"
             </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WritingSanctuary;
