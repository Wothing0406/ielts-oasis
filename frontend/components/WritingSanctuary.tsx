"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = '/api';

const WritingSanctuary = () => {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!text) return;
    setIsAnalyzing(true);
    try {
      console.log("Analyzing text:", text);
      const res = await fetch(`${API_URL}/writing/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      console.log("Analysis result:", data);
      setAnalysis(data);
    } catch (err: any) { 
      console.error("Analysis failed:", err);
      alert(`Grading failed: ${err.message}`);
    }
    finally { setIsAnalyzing(false); }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <section className="xl:col-span-12 matcha-card p-10 bento-card">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-secondary rounded-full flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-rounded text-xl">edit_note</span>
          </div>
          <div>
            <h3 className="font-display text-lg md:text-2xl font-bold text-accent dark:text-primary">Writing Sanctuary</h3>
            <p className="text-[10px] md:text-sm opacity-60 text-accent dark:text-secondary">Topic: The impact of technology on traditional education.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="text-sm font-bold text-primary bg-primary/10 px-6 py-3 rounded-full hover:bg-primary/20 transition-all">Save Draft</button>
          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="text-sm font-bold bg-primary text-white px-8 py-3 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
          >
            {isAnalyzing && <span className="material-symbols-rounded animate-spin text-sm">refresh</span>}
            Grade My Essay
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Writing Canvas */}
        <div className="lg:col-span-2">
          <div className="bg-secondary/40 dark:bg-neutral-800/40 rounded-medium p-8 relative min-h-[400px] border border-primary/5">
            <textarea 
              className="writing-lines font-sans text-lg bg-transparent border-none outline-none w-full h-full min-h-[350px] resize-none text-accent dark:text-secondary placeholder:opacity-30"
              placeholder="Modern technology has revolutionized the education sector..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="absolute bottom-6 right-8 text-xs font-bold opacity-40 uppercase tracking-widest text-accent dark:text-secondary">
              {wordCount} Words / Recommended: 250
            </div>
          </div>
        </div>
        
        {/* AI Insights Panel */}
        <div className="space-y-6">
          <div className="p-6 bg-primary/5 dark:bg-primary/10 rounded-medium border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-display font-bold flex items-center gap-2 text-accent dark:text-primary">
                <span className="material-symbols-rounded text-primary">auto_awesome</span> AI Insights
              </h4>
              <div className="px-3 py-1 bg-primary text-white rounded-full text-sm font-bold">
                {analysis ? `Band ${analysis.band_score}` : "Analyzing..."}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-rounded text-primary text-sm">psychology</span>
                  <span className="text-xs font-bold uppercase text-accent dark:text-primary">Task Response</span>
                </div>
                <p className="text-sm opacity-70 text-accent dark:text-secondary">
                  {analysis?.feedback || "Start writing to get feedback on your structure and content."}
                </p>
              </div>
              
              {analysis?.corrections && analysis.corrections.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h5 className="text-[10px] font-black uppercase text-red-500 tracking-wider">Detailed Corrections</h5>
                  {analysis.corrections.map((c: any, i: number) => (
                    <div key={i} className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                       <p className="text-[10px] line-through text-red-400 mb-1">{c.original}</p>
                       <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-1">{c.corrected}</p>
                       <p className="text-[10px] text-accent/60 italic">{c.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button className="w-full py-4 bg-accent text-white rounded-full font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-rounded">menu_book</span> View Full Report
          </button>
        </div>
      </div>
    </section>
  );
};

export default WritingSanctuary;
