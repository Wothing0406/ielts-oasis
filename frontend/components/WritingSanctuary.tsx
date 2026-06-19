"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = '/api';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

interface WritingSanctuaryProps {
  initialPrompt?: string;
  onListenWriting?: (text: string) => void;
}

const WritingSanctuary = ({ initialPrompt, onListenWriting }: WritingSanctuaryProps) => {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // AI Rephrase States
  const [selectedPhrase, setSelectedPhrase] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [rephraseSuggestions, setRephraseSuggestions] = useState<string[]>([]);
  const [isRephrasing, setIsRephrasing] = useState(false);

  // Timer States
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval: any;
    if (timerActive && timeLeft !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev !== null ? prev - 1 : null);
      }, 1000);
    } else if (timerActive && timeLeft === 0) {
      setTimerActive(false);
      handleAnalyze(); // Auto submit
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, timeLeft]);



  const startTimer = (minutes: number) => {
    setTimeLeft(minutes * 60);
    setTimerActive(true);
  };

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
      const token = localStorage.getItem('oasis_token');
      const startRes = await fetch(`/api/writing/analyze/start`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
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
      (window as any).showToast(`Đánh giá thất bại: ${err.message} 🍵`, "error");
      setIsAnalyzing(false);
    }
  };

  const handleShareToCommunity = async () => {
    if (!analysis || !text) return;
    const token = localStorage.getItem('oasis_token');
    if (!token) return (window as any).showToast('Bạn cần đăng nhập để chia sẻ bài viết! 🍵', 'info');
    
    try {
      const res = await fetch(`/api/community/share-writing`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: text,
          band_score: String(analysis.band_score),
          feedback: analysis
        }),
      });
      if (!res.ok) throw new Error('Không thể chia sẻ');
      (window as any).showAlert('Bài viết của bạn đã được gửi tới Oasis Community thành công! 🍵', 'Đăng bài hoàn tất!', 'success');
    } catch (err: any) {
      (window as any).showToast(`Lỗi: ${err.message} 🍵`, 'error');
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <section className="xl:col-span-12 bg-[#FFFDF5] border-4 border-primary/30 rounded-[3rem] p-6 md:p-10 shadow-sm flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-secondary rounded-full flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-rounded text-xl">edit_note</span>
          </div>
          <div>
            <h3 className="font-display text-lg md:text-2xl font-bold text-accent dark:text-primary">Writing Sanctuary</h3>
            <p className="text-[10px] md:text-sm opacity-60 text-accent dark:text-secondary">Topic: The impact of technology on traditional education.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          {timeLeft !== null && (
            <div className={`font-mono font-bold text-xl ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
              {formatTime(timeLeft)}
            </div>
          )}
          {!timerActive && timeLeft === null && (
            <div className="flex gap-2">
              <button type="button" onClick={() => startTimer(20)} className="text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/20 transition-all">Task 1 (20m)</button>
              <button type="button" onClick={() => startTimer(40)} className="text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/20 transition-all">Task 2 (40m)</button>
            </div>
          )}
          <button type="button" className="text-sm font-bold text-primary bg-primary/10 px-6 py-3 rounded-full hover:bg-primary/20 transition-all">Save Draft</button>
          <button type="button" 
            onClick={handleAnalyze}
            disabled={isAnalyzing || isRephrasing}
            className="text-sm font-bold bg-primary text-white px-8 py-3 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
          >
            {isAnalyzing && <span className="material-symbols-rounded animate-spin text-sm">refresh</span>}
            Grade My Essay
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Writing Canvas */}
        <div className="xl:col-span-2">
          <div className="bg-secondary/40 dark:bg-neutral-800/40 rounded-medium p-8 relative min-h-[400px] border border-primary/5">
            {initialPrompt && (
              <div className="mb-6 p-4 bg-primary/5 rounded-2xl border border-primary/20">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Topic</p>
                <p className="text-sm text-accent italic font-medium">{initialPrompt}</p>
              </div>
            )}
            <textarea 
              aria-label="Write your essay here"
              className="writing-lines font-sans text-lg bg-transparent border-none outline-none w-full h-full min-h-[350px] resize-none text-accent dark:text-secondary placeholder:text-accent/60 placeholder:opacity-80"
              placeholder="Modern technology has revolutionized the education sector..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              disabled={isAnalyzing || (timerActive && timeLeft === 0)}
            />
            <div className="absolute bottom-6 right-8 text-xs font-bold opacity-40 uppercase tracking-widest text-accent dark:text-secondary">
              {wordCount} Words / Recommended: 250
            </div>
          </div>
        </div>
        
        {/* AI Insights Panel */}
        <div className="space-y-6">
          <div className="p-6 bg-primary/5 dark:bg-primary/10 rounded-medium border border-primary/20">
            <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
              <h4 className="font-display font-bold flex items-center gap-2 text-accent dark:text-primary">
                <span className="material-symbols-rounded text-primary">auto_awesome</span> AI Insights
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                {analysis && (
                  <button type="button" onClick={handleShareToCommunity} className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-full text-sm font-bold flex items-center gap-1 transition-colors">
                    <span className="material-symbols-rounded text-[18px]">public</span> Chia sẻ
                  </button>
                )}
                {text.trim().length > 10 && onListenWriting && (
                  <button type="button" onClick={() => onListenWriting(text)} className="px-3 py-1 bg-primary text-white hover:bg-primary/90 rounded-full text-xs font-bold flex items-center gap-1 transition-colors shadow-sm">
                    <span className="material-symbols-rounded text-[14px]">headphones</span> Matcha Radio
                  </button>
                )}
                <div className="px-3 py-1 bg-primary text-white rounded-full text-xs font-bold whitespace-nowrap">
                  {analysis ? `Band ${analysis.band_score}` : isAnalyzing ? "Đang chấm..." : "Chưa chấm"}
                </div>
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
                      <button type="button" 
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
                      <button type="button"
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
                        {rephraseSuggestions.map((suggestion) => (
                          <button type="button"
                            key={suggestion}
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
                
                {analysis?.criteria && (
                  <div className="p-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-primary/10 grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <div className="text-[10px] uppercase font-bold text-accent/60">Task Achievement</div>
                      <div className="font-bold text-primary">{analysis.criteria.task_achievement || analysis.criteria.task_response || "-"}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] uppercase font-bold text-accent/60">Coherence</div>
                      <div className="font-bold text-primary">{analysis.criteria.coherence || "-"}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] uppercase font-bold text-accent/60">Lexical Resource</div>
                      <div className="font-bold text-primary">{analysis.criteria.lexical_resource || "-"}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] uppercase font-bold text-accent/60">Grammar</div>
                      <div className="font-bold text-primary">{analysis.criteria.grammar || "-"}</div>
                    </div>
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
          <button type="button" className="w-full py-4 bg-accent text-white rounded-full font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-rounded">menu_book</span> View Full Report
          </button>
        </div>
      </div>
    </section>
  );
};

export default WritingSanctuary;
