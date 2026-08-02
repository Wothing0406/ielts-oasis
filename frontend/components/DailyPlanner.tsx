"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = '/api';

interface DailyPlannerProps {
  vocabList?: any[];
  onAddVocab?: (vocab: any) => Promise<any>;
  onPracticeWriting?: (prompt: string) => void;
  onPracticeReading?: (text: string) => void;
  onPracticeListening?: (context: string) => void;
  onPracticeSpeaking?: (prompt: string) => void;
}

const DAY_LABELS: { [key: string]: string } = {
  "Monday": "Thứ 2",
  "Tuesday": "Thứ 3",
  "Wednesday": "Thứ 4",
  "Thursday": "Thứ 5",
  "Friday": "Thứ 6",
  "Saturday": "Thứ 7",
  "Sunday": "Chủ nhật"
};

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function DailyPlanner({ 
  vocabList = [],
  onAddVocab, 
  onPracticeWriting, 
  onPracticeReading, 
  onPracticeListening,
  onPracticeSpeaking
}: DailyPlannerProps) {
  const [topic, setTopic] = useState("");
  const [studyFocus, setStudyFocus] = useState("Toàn diện");
  const [studyTime, setStudyTime] = useState("20:00");
  const [weeklyPlan, setWeeklyPlan] = useState<any>(null);
  const [activeDay, setActiveDay] = useState<string>("Monday");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [savingWords, setSavingWords] = useState<Set<string>>(new Set());
  const [savingAll, setSavingAll] = useState(false);

  const loadPlan = async () => {
    const token = localStorage.getItem("oasis_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/study-plan/get`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.has_plan) {
          setWeeklyPlan(data.weekly_plan);
          setTopic(data.preferences.topic);
          setStudyFocus(data.preferences.study_focus);
          setStudyTime(data.preferences.study_time);
          
          // Auto select today
          const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
          const todayName = days[todayIndex];
          if (data.weekly_plan[todayName]) {
            setActiveDay(todayName);
          } else {
            setActiveDay(Object.keys(data.weekly_plan)[0] || "Monday");
          }
        }
      }
    } catch (err) {
      console.error("Failed to load study plan", err);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  const updatePreferences = async () => {
    if (!topic.trim()) return;
    const token = localStorage.getItem("oasis_token");
    if (!token) return (window as any).showToast("Bạn cần đăng nhập để lưu cấu hình lộ trình! 🍵", "info");
    
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/study-plan/update-preferences`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ topic, study_focus: studyFocus, study_time: studyTime }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Có lỗi xảy ra");
      
      setWeeklyPlan(data.weekly_plan);
      setTopic(data.preferences.topic);
      setStudyFocus(data.preferences.study_focus);
      setStudyTime(data.preferences.study_time);
      
      // Auto select today or Monday
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const todayIndex = new Date().getDay();
      const todayName = days[todayIndex];
      if (data.weekly_plan[todayName]) {
        setActiveDay(todayName);
      } else {
        setActiveDay("Monday");
      }
      
      setShowSettings(false);
      (window as any).showToast("Lộ trình học đã được thiết lập thành công! 🍵", "success");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyCalendarLink = () => {
    const token = localStorage.getItem("oasis_token");
    if (!token) return (window as any).showToast("Bạn cần đăng nhập để lấy link lịch! 🍵", "info");
    
    const calUrl = `${window.location.origin}${API_URL}/study-plan/calendar.ics?token=${token}`;
    navigator.clipboard.writeText(calUrl);
    
    (window as any).showAlert(
      "Đã sao chép link lịch vào bộ nhớ tạm! Để đồng bộ lên Google Calendar:\n\n" +
      "1. Mở trang Google Calendar (Lịch Google).\n" +
      "2. Nhấn vào nút '+' ở cạnh mục 'Lịch khác' (Other Calendars) bên trái.\n" +
      "3. Chọn 'Từ URL' (From URL) và dán link vừa copy vào.\n" +
      "4. Nhấn 'Thêm lịch' để hoàn tất! Lịch học sẽ tự động đồng bộ hàng ngày. 🍵", 
      "Đồng bộ Google Lịch!", 
      "success"
    );
  };

  // Get active day plan data
  const currentDayPlan = weeklyPlan ? weeklyPlan[activeDay] : null;

  return (
    <section className="xl:col-span-12 matcha-card p-6 md:p-10 bento-card flex flex-col gap-6 bg-[#f8fdfa] border-4 border-primary/20 rounded-[3rem]">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-black text-accent flex items-center gap-2">
            <span className="material-symbols-rounded text-primary text-3xl">calendar_month</span>
            Matcha Daily Plan
          </h2>
          <p className="text-sm text-accent/70 mt-1">Lộ trình học IELTS 7 ngày thông minh, đồng bộ hóa đa nền tảng</p>
        </div>
        <div className="flex gap-2">
          {weeklyPlan && (
            <button 
              type="button"
              onClick={copyCalendarLink}
              className="bg-[#eef7f2] border-2 border-primary/20 text-primary font-bold px-4 py-2 rounded-full flex items-center gap-2 hover:scale-105 transition-all text-xs"
            >
              <span className="material-symbols-rounded text-sm">edit_calendar</span>
              Đồng bộ Google Lịch
            </button>
          )}
          <button 
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`font-bold px-4 py-2 rounded-full flex items-center gap-2 transition-all text-xs ${
              showSettings ? 'bg-primary text-white' : 'bg-[#eef7f2] border-2 border-primary/20 text-primary'
            }`}
          >
            <span className="material-symbols-rounded text-sm">settings</span>
            Cài đặt lộ trình
          </button>
        </div>
      </div>

      {/* Settings Section */}
      <AnimatePresence>
        {(showSettings || !weeklyPlan) && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#FFFDF5] border-2 border-primary/10 p-6 rounded-3xl flex flex-col gap-4 shadow-sm"
          >
            <h3 className="font-display font-bold text-accent flex items-center gap-2 border-b border-primary/10 pb-2">
              <span className="material-symbols-rounded text-primary">tune</span> Cấu hình lộ trình học cá nhân hóa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Topic Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-accent/80">Chủ đề học mục tiêu</label>
                <input 
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="Nhập chủ đề (ví dụ: Environment, Education...)"
                  className="px-4 py-2.5 rounded-full border-2 border-primary/20 focus:border-primary outline-none text-accent font-medium shadow-inner placeholder:text-accent/60 text-sm"
                />
              </div>

              {/* Study Focus */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-accent/80">Trọng tâm học thuật</label>
                <select
                  value={studyFocus}
                  onChange={e => setStudyFocus(e.target.value)}
                  className="px-4 py-2.5 rounded-full border-2 border-primary/20 focus:border-primary outline-none text-accent font-medium bg-white text-sm"
                >
                  <option value="Toàn diện">Toàn diện (Đều các kỹ năng)</option>
                  <option value="Từ vựng">Chuyên sâu Từ vựng (SRS, Đọc báo)</option>
                  <option value="Nói">Chuyên sâu Nói (Shadowing, Sandbox)</option>
                  <option value="Viết">Chuyên sâu Viết (Writing Sanctuary)</option>
                </select>
              </div>

              {/* Study Time */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-accent/80">Giờ nhắc học hàng ngày (Discord)</label>
                <input 
                  type="text"
                  value={studyTime}
                  onChange={e => setStudyTime(e.target.value)}
                  placeholder="Ví dụ: 20:00 hoặc 08:30"
                  className="px-4 py-2.5 rounded-full border-2 border-primary/20 focus:border-primary outline-none text-accent font-medium shadow-inner text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              {weeklyPlan && (
                <button 
                  type="button" 
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-2.5 rounded-full font-bold text-accent hover:bg-black/5 text-sm"
                >
                  Hủy
                </button>
              )}
              <button 
                type="button" 
                onClick={updatePreferences}
                disabled={loading || !topic.trim()}
                className="bg-primary text-white font-bold px-8 py-2.5 rounded-full flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none text-sm"
              >
                {loading ? (
                  <><span className="material-symbols-rounded animate-spin text-sm">sync</span> Đang khởi tạo...</>
                ) : (
                  <><span className="material-symbols-rounded text-sm">magic_button</span> Tạo Lộ Trình Mới</>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="text-red-500 text-sm font-bold bg-red-50 p-4 rounded-2xl border border-red-200">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      {weeklyPlan ? (
        <div className="flex flex-col gap-6">
          {/* Day selectors tab bar */}
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar pr-2">
            {DAYS_ORDER.map((day) => {
              const isActive = activeDay === day;
              const hasData = !!weeklyPlan[day];
              if (!hasData) return null;
              
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setActiveDay(day)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                    isActive 
                      ? 'bg-primary text-white' 
                      : 'bg-white border border-primary/10 text-accent hover:bg-[#eef7f2]'
                  }`}
                >
                  {DAY_LABELS[day]}
                </button>
              );
            })}
          </div>

          {/* Active Day Content */}
          {currentDayPlan ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Day Overview & Tasks */}
              <div className="flex flex-col gap-6">
                {/* Topic card */}
                <div className="bg-white border-2 border-primary/10 rounded-3xl p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <div>
                      <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider mb-2">
                        Kỹ năng: {currentDayPlan.focus}
                      </span>
                      <h3 className="font-display font-black text-accent text-lg">
                        {currentDayPlan.topic}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-primary/5 pt-4">
                    <p className="text-xs font-black text-primary uppercase tracking-widest mb-3">Nhiệm vụ hôm nay:</p>
                    <div className="space-y-2">
                      {currentDayPlan.tasks?.map((t: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-accent/80 font-medium">
                          <span className="material-symbols-rounded text-primary text-base mt-0.5">check_circle</span>
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Vocabulary Card */}
                <div className="bg-white border-2 border-primary/10 rounded-3xl p-6 shadow-sm flex-1">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-display font-black text-accent text-base flex items-center gap-2">
                      <span className="material-symbols-rounded text-primary">local_library</span> 3 Từ vựng tiêu biểu
                    </h3>
                    <button 
                      type="button"
                      disabled={savingAll || !currentDayPlan.vocabulary || currentDayPlan.vocabulary.length === 0}
                      onClick={async () => {
                        if (onAddVocab && currentDayPlan.vocabulary) {
                          const unsavedWords = currentDayPlan.vocabulary.filter((v: any) => 
                            !vocabList.some((sv: any) => sv.word.toLowerCase() === v.word.toLowerCase())
                          );
                          
                          if (unsavedWords.length === 0) {
                            (window as any).showAlert("Tất cả từ vựng này đều đã có sẵn trong thư viện của bạn! 🍵", "Thông báo", "info");
                            return;
                          }
                          
                          setSavingAll(true);
                          try {
                            const results = await Promise.all(
                              unsavedWords.map((v: any) => onAddVocab({ ...v, source: "Discord Reminder" }))
                            );
                            let added = 0;
                            let duplicates = 0;
                            let errors = 0;
                            
                            results.forEach((res) => {
                              if (res && res.success) added++;
                              else if (res && res.status === "duplicate") duplicates++;
                              else errors++;
                            });
                            
                            const msg = `Đã lưu thành công ${added} từ vựng mới!` + 
                              (duplicates > 0 ? ` (${duplicates} từ trùng lặp)` : "") + " 🍵";
                            
                            (window as any).showAlert(msg, "Lưu hoàn tất!", "success");
                          } catch (err) {
                            console.error(err);
                            (window as any).showAlert("Lỗi xảy ra khi lưu từ vựng.", "Lỗi", "error");
                          } finally {
                            setSavingAll(false);
                          }
                        }
                      }}
                      className="text-[10px] bg-primary/10 text-primary font-bold px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                    >
                      {savingAll ? "Đang lưu..." : "Lưu Tất Cả"}
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {currentDayPlan.vocabulary?.map((v: any, i: number) => {
                      const isSaved = vocabList.some((sv: any) => sv.word.toLowerCase() === v.word.toLowerCase());
                      return (
                        <div key={i} className="p-3 bg-[#eef7f2] rounded-2xl border border-primary/10 flex justify-between items-center gap-4">
                          <div className="flex-1">
                            <p className="font-bold text-accent text-sm flex items-center gap-1.5">
                              {v.word}
                              <span className="text-[10px] italic font-normal text-accent/50">{v.phonetic}</span>
                            </p>
                            <p className="text-[11px] text-accent/80 mt-0.5">{v.meaning}</p>
                            {v.example && <p className="text-[10px] italic text-accent/60 mt-0.5">Ex: {v.example}</p>}
                          </div>
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
                                  const res = await onAddVocab({ ...v, source: "Discord Reminder" });
                                  if (res && res.status === "duplicate") {
                                    (window as any).showToast(`Từ "${v.word}" đã tồn tại trong thư viện! 🍵`, "info");
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
                            {isSaved ? 'Đã lưu' : savingWords.has(v.word) ? 'Lưu...' : 'Lưu'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Day Skill Practice Card */}
              <div className="flex flex-col">
                {/* Render corresponding practice widget based on focus skill */}
                {currentDayPlan.focus === "Nghe" && currentDayPlan.listening && (
                  <div className="bg-white border-2 border-primary/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full">
                    <div>
                      <h3 className="font-display font-black text-accent text-sm flex items-center gap-2 mb-2">
                        <span className="material-symbols-rounded text-primary text-base">headphones</span> IELTS Listening Transcript
                      </h3>
                      <h4 className="text-sm font-bold text-accent mb-2">{currentDayPlan.listening.title}</h4>
                      <p className="text-xs text-accent/70 line-clamp-6 italic bg-[#f9f9f9] p-4 rounded-2xl border border-black/5 whitespace-pre-line overflow-y-auto max-h-[160px] custom-scrollbar">
                        {currentDayPlan.listening.audio_script || currentDayPlan.listening.description}
                      </p>
                      {currentDayPlan.listening.questions && (
                        <div className="mt-4 space-y-1">
                          <p className="text-[10px] font-bold text-primary uppercase">CÂU HỎI ĐỌC HIỂU:</p>
                          {currentDayPlan.listening.questions.map((q: string, qIdx: number) => (
                            <p key={qIdx} className="text-xs font-semibold text-accent/80">{qIdx+1}. {q}</p>
                          ))}
                        </div>
                      )}
                    </div>
                    <button 
                      type="button"
                      onClick={() => onPracticeListening && onPracticeListening(currentDayPlan.listening.audio_script || currentDayPlan.listening.description)}
                      className="mt-6 w-full bg-primary hover:bg-primary-dark text-white font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-1 shadow-md shadow-primary/10"
                    >
                      <span className="material-symbols-rounded text-base">play_circle</span> Luyện Nghe Ngay
                    </button>
                  </div>
                )}

                {currentDayPlan.focus === "Đọc" && currentDayPlan.reading && (
                  <div className="bg-white border-2 border-primary/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full">
                    <div>
                      <h3 className="font-display font-black text-accent text-sm flex items-center gap-2 mb-2">
                        <span className="material-symbols-rounded text-primary text-base">menu_book</span> IELTS Reading Passage
                      </h3>
                      <h4 className="text-sm font-bold text-primary mb-2 uppercase tracking-wide">{currentDayPlan.reading.title}</h4>
                      <p className="text-xs text-accent leading-relaxed bg-[#f9f9f9] p-4 rounded-2xl italic border border-black/5 max-h-[160px] overflow-y-auto custom-scrollbar">
                        {currentDayPlan.reading.text}
                      </p>
                      {currentDayPlan.reading.questions && (
                        <div className="mt-4 space-y-1">
                          <p className="text-[10px] font-bold text-primary uppercase">CÂU HỎI:</p>
                          {currentDayPlan.reading.questions.map((q: string, qIdx: number) => (
                            <p key={qIdx} className="text-xs font-semibold text-accent/80">{qIdx+1}. {q}</p>
                          ))}
                        </div>
                      )}
                    </div>
                    <button 
                      type="button"
                      onClick={() => onPracticeReading && onPracticeReading(currentDayPlan.reading.text)}
                      className="mt-6 w-full bg-primary hover:bg-primary-dark text-white font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-1 shadow-md shadow-primary/10"
                    >
                      <span className="material-symbols-rounded text-base">auto_stories</span> Luyện Đọc Ngay
                    </button>
                  </div>
                )}

                {currentDayPlan.focus === "Viết" && currentDayPlan.writing && (
                  <div className="bg-white border-2 border-primary/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full">
                    <div>
                      <h3 className="font-display font-black text-accent text-sm flex items-center gap-2 mb-2">
                        <span className="material-symbols-rounded text-primary text-base">edit_document</span> IELTS Writing Task
                      </h3>
                      <p className="text-sm text-accent italic bg-[#f9f9f9] p-4 rounded-2xl border border-black/5 leading-relaxed font-semibold">
                        {currentDayPlan.writing.prompt}
                      </p>
                      {currentDayPlan.writing.key_points && (
                        <div className="mt-4 space-y-1">
                          <p className="text-[10px] font-bold text-primary uppercase">GỢI Ý CÁC Ý CHÍNH (KEY POINTS):</p>
                          {currentDayPlan.writing.key_points.map((pt: string, ptIdx: number) => (
                            <p key={ptIdx} className="text-xs text-accent/80 flex gap-2">
                              <span className="text-primary font-black">•</span> {pt}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <button 
                      type="button"
                      onClick={() => onPracticeWriting && onPracticeWriting(currentDayPlan.writing.prompt)}
                      className="mt-6 w-full bg-primary hover:bg-primary-dark text-white font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-1 shadow-md shadow-primary/10"
                    >
                      <span className="material-symbols-rounded text-base">edit</span> Luyện Viết Ngay
                    </button>
                  </div>
                )}

                {currentDayPlan.focus === "Nói" && currentDayPlan.speaking && (
                  <div className="bg-white border-2 border-primary/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full">
                    <div>
                      <h3 className="font-display font-black text-accent text-sm flex items-center gap-2 mb-2">
                        <span className="material-symbols-rounded text-primary text-base">record_voice_over</span> IELTS Speaking Prompt
                      </h3>
                      <div className="bg-[#f9f9f9] p-5 rounded-2xl border border-black/5 flex flex-col gap-2">
                        <p className="text-[10px] font-bold text-primary uppercase">CÂU HỎI LUYỆN NÓI:</p>
                        <p className="text-base text-accent italic font-semibold leading-relaxed">
                          "{currentDayPlan.speaking.prompt}"
                        </p>
                      </div>
                      <p className="text-xs text-accent/60 mt-4 leading-relaxed">
                        💡 **Gợi ý:** Nhấn nút bên dưới để chuyển thẳng prompt này sang **Speaking Studio**, thực hiện ghi âm 2 phút và nhận phân tích phát âm, ngữ pháp từ AI IELTS Oasis!
                      </p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => onPracticeSpeaking && onPracticeSpeaking(currentDayPlan.speaking.prompt)}
                      className="mt-6 w-full bg-primary hover:bg-primary-dark text-white font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-1 shadow-md shadow-primary/10"
                    >
                      <span className="material-symbols-rounded text-base">mic</span> Luyện Nói Tại Studio
                    </button>
                  </div>
                )}

                {/* Default Vocabulary/Quiz Focus */}
                {(!currentDayPlan.focus || currentDayPlan.focus === "Từ vựng") && (
                  <div className="bg-[#FFFDF5] border-2 border-primary/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full border-dashed">
                    <div>
                      <h3 className="font-display font-black text-accent text-sm flex items-center gap-2 mb-2">
                        <span className="material-symbols-rounded text-primary text-base">spellcheck</span> Luyện tập Từ vựng hàng ngày
                      </h3>
                      <p className="text-xs text-accent/70 leading-relaxed mt-2">
                        Hôm nay là ngày học tập trung chuyên sâu vào từ vựng học thuật. Hãy thực hiện lưu các từ vựng tiêu biểu bên cạnh vào **Vocabulary Lab** để tiến hành ôn luyện lặp lại ngắt quãng (SRS).
                      </p>
                      <div className="mt-4 p-4 bg-primary/5 rounded-2xl flex items-center gap-3 border border-primary/10">
                        <span className="material-symbols-rounded text-primary text-2xl">auto_stories</span>
                        <div>
                          <p className="text-xs font-bold text-accent">Đọc báo MatchaScroll</p>
                          <p className="text-[10px] text-accent/60">Tải các bài báo tin tức học thuật và quét từ vựng để lưu vào thư viện.</p>
                        </div>
                      </div>
                    </div>
                    <a 
                      href="/scroll"
                      className="mt-6 w-full bg-primary hover:bg-primary-dark text-white font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-1 shadow-md shadow-primary/10 text-center"
                    >
                      <span className="material-symbols-rounded text-base">article</span> Mở MatchaScroll Đọc Báo
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-3xl border border-primary/10">
              <p className="text-accent/60">Không tìm thấy lộ trình học cho ngày này.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-primary/20 p-8">
          <span className="material-symbols-rounded text-primary/40 text-5xl mb-3">auto_awesome</span>
          <h3 className="font-display font-bold text-accent text-lg">Bạn chưa khởi tạo lộ trình học IELTS</h3>
          <p className="text-sm text-accent/60 max-w-sm mt-1 mb-6">Nhập chủ đề học tập mục tiêu của bạn ở phần Cài đặt phía trên để AI sinh giáo án 7 ngày cá nhân hóa!</p>
          <button 
            type="button"
            onClick={() => setShowSettings(true)}
            className="bg-primary text-white font-bold px-6 py-2.5 rounded-full hover:scale-105 transition-all text-xs shadow-md"
          >
            Bắt đầu Thiết lập Lộ trình
          </button>
        </div>
      )}
    </section>
  );
}
