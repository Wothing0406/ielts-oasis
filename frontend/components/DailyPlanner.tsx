"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = '/api';

interface DailyPlannerProps {
  vocabList?: any[];
  onAddVocab?: (vocab: any) => Promise<any>;
  onPracticeWriting?: (prompt: string) => void;
  onPracticeReading?: (text: string) => void;
  onPracticeListening?: (context: string) => void;
}

export default function DailyPlanner({ 
  vocabList = [],
  onAddVocab, 
  onPracticeWriting, 
  onPracticeReading, 
  onPracticeListening 
}: DailyPlannerProps) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingWords, setSavingWords] = useState<Set<string>>(new Set());

  const generatePlan = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setPlan(null);
    setSaved(false);
    try {
      const res = await fetch(`${API_URL}/study-plan/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Có lỗi xảy ra");
      setPlan(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    if (!plan) return;
    const token = localStorage.getItem("oasis_token");
    if (!token) return (window as any).showToast("Bạn cần đăng nhập để lưu lộ trình! 🍵", "info");
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/study-plan/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ topic, plan_data: plan }),
      });
      if (res.ok) setSaved(true);
      else (window as any).showToast("Không thể lưu lộ trình. 🍵", "error");
    } catch (err) {
      console.error(err);
      (window as any).showToast("Lỗi kết nối. 🍵", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="xl:col-span-12 matcha-card p-6 md:p-10 bento-card flex flex-col gap-6 bg-[#f8fdfa] border-4 border-primary/20 rounded-[3rem]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-black text-accent flex items-center gap-2">
            <span className="material-symbols-rounded text-primary text-3xl">calendar_month</span>
            Matcha Daily Plan
          </h2>
          <p className="text-sm text-accent/70 mt-1">Lộ trình học IELTS siêu tốc mỗi ngày do AI thiết kế</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <input 
          type="text"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && generatePlan()}
          placeholder="Nhập chủ đề bạn muốn học hôm nay (vd: Environment, Technology...)"
          className="flex-1 px-6 py-4 rounded-full border-2 border-primary/20 focus:border-primary outline-none text-accent font-medium shadow-inner placeholder:text-accent/60"
        />
        <button type="button" 
          onClick={generatePlan}
          disabled={loading || !topic.trim()}
          className="bg-primary text-white font-bold px-8 py-4 rounded-full flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap"
        >
          {loading ? (
            <><span className="material-symbols-rounded animate-spin">sync</span> Đang lên lịch...</>
          ) : (
            <><span className="material-symbols-rounded">magic_button</span> Tạo lộ trình</>
          )}
        </button>
      </div>

      {error && (
        <div className="text-red-500 text-sm font-bold bg-red-50 p-4 rounded-2xl border border-red-200">
          {error}
        </div>
      )}

      <AnimatePresence>
        {plan && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4"
          >
            {/* Vocab */}
            <div className="bg-white border-2 border-primary/10 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-black text-accent text-lg flex items-center gap-2">
                  <span className="material-symbols-rounded text-primary">local_library</span> 10 Từ vựng cốt lõi
                </h3>
                <button 
                  onClick={async () => {
                    if (onAddVocab && plan.vocabulary) {
                      let added = 0;
                      let skipped = 0;
                      for (const v of plan.vocabulary) {
                        const res = await onAddVocab({ ...v, source: "Matcha Daily Plan" });
                        if (res && res.success) added++;
                        else if (res && res.status === "duplicate") skipped++;
                      }
                      (window as any).showAlert(`Đã pha chế thành công ${added} từ vựng mới vào kho! (Bỏ qua ${skipped} từ đã có sẵn) 🍵`, "Pha chế hoàn tất!", "success");
                    }
                  }}
                  className="text-xs bg-primary/10 text-primary font-bold px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-colors"
                >
                  Lưu tất cả
                </button>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {plan.vocabulary?.map((v: any, i: number) => {
                  const isSaved = vocabList.some((sv: any) => sv.word.toLowerCase() === v.word.toLowerCase());
                  return (
                    <div key={i} className="p-3 bg-[#eef7f2] rounded-2xl border border-primary/10 flex justify-between items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-bold text-accent text-sm">{v.word}</p>
                          <p className="text-[10px] italic text-accent/50">{v.phonetic}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-auto">
                        <p className="text-xs text-right text-accent/80 font-medium">{v.meaning}</p>
                        <button 
                          type="button"
                          disabled={isSaved || savingWords.has(v.word)}
                          onClick={async () => {
                            if (!isSaved && onAddVocab && !savingWords.has(v.word)) {
                              setSavingWords(prev => {
                                const next = new Set(prev);
                                next.add(v.word);
                                return next;
                              });
                              try {
                                const res = await onAddVocab({ ...v, source: "Matcha Daily Plan" });
                                if (res && res.status === "duplicate") {
                                  (window as any).showToast(`Từ vựng "${v.word}" đã có sẵn trong kho! 🍵`, "info");
                                }
                              } catch (e) {
                                console.error(e);
                              } finally {
                                setSavingWords(prev => {
                                  const next = new Set(prev);
                                  next.delete(v.word);
                                  return next;
                                });
                              }
                            }
                          }}
                          className={`flex items-center gap-1 transition-colors px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                            isSaved 
                              ? 'bg-green-100 text-green-700 cursor-default font-semibold' 
                              : savingWords.has(v.word)
                              ? 'bg-primary/5 text-primary/40 cursor-wait animate-pulse'
                              : 'bg-primary/20 text-accent hover:bg-primary/30'
                          }`}
                        >
                          <span className="material-symbols-rounded text-[12px]">
                            {isSaved ? 'check_circle' : savingWords.has(v.word) ? 'sync' : 'bookmark_add'}
                          </span>
                          {isSaved ? 'Đã lưu' : savingWords.has(v.word) ? 'Đang lưu...' : 'Lưu'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              {/* Listening & Reading */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border-2 border-primary/10 rounded-3xl p-5 shadow-sm">
                  <h3 className="font-display font-black text-accent text-sm flex items-center gap-2 mb-2">
                    <span className="material-symbols-rounded text-primary text-base">headphones</span> Ý tưởng Nghe
                  </h3>
                  <p className="text-xs font-bold text-accent">{plan.listening?.title}</p>
                  <p className="text-[10px] mt-1 text-accent/70">{plan.listening?.description}</p>
                  <button 
                    onClick={() => onPracticeListening && onPracticeListening(plan.listening?.description || plan.listening?.title)}
                    className="mt-3 w-full bg-accent/5 hover:bg-accent/10 text-accent font-bold text-xs py-2 rounded-xl transition-colors"
                  >
                    Thực hành Nghe
                  </button>
                </div>
                
                <div className="bg-white border-2 border-primary/10 rounded-3xl p-5 shadow-sm">
                  <h3 className="font-display font-black text-accent text-sm flex items-center gap-2 mb-2">
                    <span className="material-symbols-rounded text-primary text-base">edit_document</span> Writing Task 2
                  </h3>
                  <p className="text-xs text-accent italic">{plan.writing?.prompt}</p>
                  <button 
                    onClick={() => onPracticeWriting && onPracticeWriting(plan.writing?.prompt)}
                    className="mt-3 w-full bg-accent/5 hover:bg-accent/10 text-accent font-bold text-xs py-2 rounded-xl transition-colors"
                  >
                    Thực hành Viết
                  </button>
                </div>
              </div>

              {/* Reading */}
              <div className="bg-white border-2 border-primary/10 rounded-3xl p-6 shadow-sm">
                <h3 className="font-display font-black text-accent text-lg flex items-center gap-2 mb-3">
                  <span className="material-symbols-rounded text-primary">menu_book</span> Bài đọc ngắn
                </h3>
                <p className="text-xs text-accent leading-relaxed bg-[#f9f9f9] p-4 rounded-2xl italic border border-black/5">
                  {plan.reading?.text}
                </p>
                <div className="mt-4 space-y-2">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Câu hỏi ôn tập:</p>
                  {plan.reading?.questions?.map((q: string, i: number) => (
                    <p key={i} className="text-xs font-medium text-accent flex gap-2">
                      <span className="text-primary font-black">{i+1}.</span> {q}
                    </p>
                  ))}
                </div>
                <button 
                  onClick={() => onPracticeReading && onPracticeReading(plan.reading?.text)}
                  className="mt-4 w-full bg-primary/10 hover:bg-primary hover:text-white text-primary font-bold text-sm py-3 rounded-xl transition-all"
                >
                  Thực hành Đọc ngay
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 flex justify-center mt-4">
              <button 
                onClick={savePlan}
                disabled={saving || saved}
                className="bg-primary text-white font-bold px-8 py-3 rounded-full flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:pointer-events-none"
              >
                {saved ? (
                  <><span className="material-symbols-rounded">check_circle</span> Đã lưu lộ trình</>
                ) : saving ? (
                  <><span className="material-symbols-rounded animate-spin">sync</span> Đang lưu...</>
                ) : (
                  <><span className="material-symbols-rounded">bookmark</span> Lưu lộ trình này</>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
