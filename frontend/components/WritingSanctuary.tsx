"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = '/api';

const WritingSanctuary = () => {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // AI Rephrase States
  const [selectedPhrase, setSelectedPhrase] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [rephraseSuggestions, setRephraseSuggestions] = useState<string[]>([]);
  const [isRephrasing, setIsRephrasing] = useState(false);

  const handleTextSelection = (e: React.MouseEvent<HTMLTextAreaElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    
    if (start !== end) {
      const selected = target.value.substring(start, end).trim();
      if (selected.length > 0 && selected.split(/\s+/).length <= 15) {
        setSelectedPhrase(selected);
        setSelectionRange({ start, end });
      }
    }
  };

  const handleRephrase = async () => {
    if (!selectedPhrase || isRephrasing) return;
    setIsRephrasing(true);
    setRephraseSuggestions([]);
    try {
      const res = await fetch(`/api/writing/rephrase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, selected_phrase: selectedPhrase }),
      });
      if (res.ok) {
        const data = await res.json();
        setRephraseSuggestions(data.suggestions || []);
      } else {
        alert("Không thể kết nối AI để rephrase.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRephrasing(false);
    }
  };

  const applyRephrase = (suggestion: string) => {
    if (!selectionRange) return;
    const newText = text.substring(0, selectionRange.start) + suggestion + text.substring(selectionRange.end);
    setText(newText);
    setSelectedPhrase('');
    setSelectionRange(null);
    setRephraseSuggestions([]);
  };

  const handleAnalyze = async () => {
    if (!text) return;
    setIsAnalyzing(true);
    try {
      console.log("Starting analysis for text:", text);
      const startRes = await fetch(`/api/writing/analyze/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      if (!startRes.ok) throw new Error(`Server error: ${startRes.status}`);
      const { task_id } = await startRes.json();
      
      // Poll every 3 seconds
      const poll = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/writing/analyze/status/${task_id}`);
          if (statusRes.ok) {
            const data = await statusRes.json();
            if (data.status === "completed") {
              clearInterval(poll);
              console.log("Analysis result:", data.result);
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
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
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
                {/* AI Rephrase Box */}
                {selectedPhrase && (
                  <div className="p-4 bg-primary/10 rounded-2xl border-2 border-primary/20 shadow-sm transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase text-primary flex items-center gap-1">
                        <span className="material-symbols-rounded text-sm">lightbulb</span> AI Rephrase
                      </span>
                      <button 
                        onClick={() => { setSelectedPhrase(''); setRephraseSuggestions([]); }}
                        className="text-xs text-accent/40 hover:text-accent"
                      >
                        Hủy
                      </button>
                    </div>
                    <p className="text-xs italic text-accent opacity-80 mb-3 bg-white p-2.5 rounded-xl border border-primary/5">
                      "{selectedPhrase}"
                    </p>
                    
                    {rephraseSuggestions.length === 0 ? (
                      <button
                        onClick={handleRephrase}
                        disabled={isRephrasing}
                        className="w-full bg-primary text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isRephrasing ? (
                          <>
                            <span className="material-symbols-rounded text-xs animate-spin">refresh</span>
                            Đang tìm gợi ý...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-rounded text-xs">auto_awesome</span>
                            Gợi ý viết lại cụm từ
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase font-black text-accent/40 tracking-wider">Gợi ý từ AI (Click để áp dụng):</p>
                        {rephraseSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => applyRephrase(suggestion)}
                            className="w-full text-left p-2.5 bg-white border border-primary/10 hover:border-primary rounded-xl text-xs text-accent font-medium hover:bg-primary/5 transition-all shadow-sm flex items-start gap-1"
                          >
                            <span className="material-symbols-rounded text-primary text-xs mt-0.5">check_circle</span>
                            <span>{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {analysis?.strengths && analysis.strengths.length > 0 && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl shadow-sm border border-green-100 dark:border-green-900/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-rounded text-green-500 text-sm">check_circle</span>
                      <span className="text-xs font-bold uppercase text-green-600 dark:text-green-400">Ưu điểm (Strengths)</span>
                    </div>
                    <ul className="text-sm opacity-80 text-green-800 dark:text-green-300 list-disc pl-5 space-y-1">
                      {analysis.strengths.map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {analysis?.weaknesses && analysis.weaknesses.length > 0 && (
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl shadow-sm border border-orange-100 dark:border-orange-900/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-rounded text-orange-500 text-sm">warning</span>
                      <span className="text-xs font-bold uppercase text-orange-600 dark:text-orange-400">Nhược điểm (Weaknesses)</span>
                    </div>
                    <ul className="text-sm opacity-80 text-orange-800 dark:text-orange-300 list-disc pl-5 space-y-1">
                      {analysis.weaknesses.map((w: string, i: number) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {!analysis?.strengths && !analysis?.weaknesses && (
                  <div className="p-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-rounded text-primary text-sm">psychology</span>
                      <span className="text-xs font-bold uppercase text-accent dark:text-primary">Phân tích</span>
                    </div>
                    <p className="text-sm opacity-70 text-accent dark:text-secondary">
                      Bắt đầu viết để nhận được phân tích chi tiết về điểm mạnh và điểm yếu.
                    </p>
                  </div>
                )}
              
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
