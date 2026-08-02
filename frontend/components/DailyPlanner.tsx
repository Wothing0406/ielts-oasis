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
  "Monday": "Mon",
  "Tuesday": "Tue",
  "Wednesday": "Wed",
  "Thursday": "Thu",
  "Friday": "Fri",
  "Saturday": "Sat",
  "Sunday": "Sun"
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
  const [activeDays, setActiveDays] = useState<string[]>(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
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
          if (data.preferences.active_days) {
            setActiveDays(data.preferences.active_days.split(',').map((s: string) => s.trim()));
          }
          
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
    if (!token) return (window as any).showToast("You need to log in to save your study plan! 🍵", "info");
    
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/study-plan/update-preferences`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ topic, study_focus: studyFocus, study_time: studyTime, active_days: activeDays.join(",") }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "An error occurred");
      
      setWeeklyPlan(data.weekly_plan);
      setTopic(data.preferences.topic);
      setStudyFocus(data.preferences.study_focus);
      setStudyTime(data.preferences.study_time);
      if (data.preferences.active_days) {
        setActiveDays(data.preferences.active_days.split(',').map((s: string) => s.trim()));
      }
      
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
      (window as any).showToast("Study plan configured successfully! 🍵", "success");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearPlan = async () => {
    const token = localStorage.getItem("oasis_token");
    if (!token) return;
    
    (window as any).showConfirm(
      "Are you sure you want to delete your current study plan? This will also remove your daily Discord study schedule reminders.",
      async () => {
        setLoading(true);
        setError("");
        try {
          const res = await fetch(`${API_URL}/study-plan/delete`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            setWeeklyPlan(null);
            setTopic("");
            setStudyFocus("Toàn diện");
            setStudyTime("20:00");
            setActiveDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
            setShowSettings(false);
            (window as any).showToast("Study plan deleted successfully! 🍵", "success");
          } else {
            const data = await res.json();
            throw new Error(data.detail || "An error occurred");
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
      "Delete Plan"
    );
  };

  const copyCalendarLink = () => {
    const token = localStorage.getItem("oasis_token");
    if (!token) return (window as any).showToast("You need to log in to get the calendar link! 🍵", "info");
    
    const calUrl = `${window.location.origin}${API_URL}/study-plan/calendar.ics?token=${token}`;
    navigator.clipboard.writeText(calUrl);
    
    (window as any).showAlert(
      "Calendar link copied to clipboard! To sync with Google Calendar:\n\n" +
      "1. Open Google Calendar.\n" +
      "2. Click '+' next to 'Other calendars' on the left side.\n" +
      "3. Select 'From URL' and paste the copied link.\n" +
      "4. Click 'Add calendar' to complete! It will sync automatically daily. 🍵", 
      "Google Calendar Sync", 
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
          <p className="text-sm text-accent/70 mt-1">Smart 7-day IELTS adaptive study plan, synced across platforms</p>
        </div>
        <div className="flex gap-2">
          {weeklyPlan && (
            <button 
              type="button"
              onClick={copyCalendarLink}
              className="bg-[#eef7f2] border-2 border-primary/20 text-primary font-bold px-4 py-2 rounded-full flex items-center gap-2 hover:scale-105 transition-all text-xs"
            >
              <span className="material-symbols-rounded text-sm">edit_calendar</span>
              Sync Google Calendar
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
            Plan Settings
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
              <span className="material-symbols-rounded text-primary">tune</span> Configure Personalized Study Plan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Topic Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-accent/80">Target Study Topic</label>
                <input 
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="Enter topic (e.g. Environment, Education...)"
                  className="px-4 py-2.5 rounded-full border-2 border-primary/20 focus:border-primary outline-none text-accent font-medium shadow-inner placeholder:text-accent/60 text-sm"
                />
              </div>

              {/* Study Focus */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-accent/80">Study Focus</label>
                <select
                  value={studyFocus}
                  onChange={e => setStudyFocus(e.target.value)}
                  className="px-4 py-2.5 rounded-full border-2 border-primary/20 focus:border-primary outline-none text-accent font-medium bg-white text-sm"
                >
                  <option value="Toàn diện">Comprehensive (All Skills)</option>
                  <option value="Từ vựng">Vocabulary Focus (SRS, News)</option>
                  <option value="Nói">Speaking Focus (Shadowing, Sandbox)</option>
                  <option value="Viết">Writing Focus (Writing Sanctuary)</option>
                </select>
              </div>

              {/* Study Time */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-accent/80">Daily Discord Reminder Time</label>
                <input 
                  type="text"
                  value={studyTime}
                  onChange={e => setStudyTime(e.target.value)}
                  placeholder="e.g. 20:00 or 08:30"
                  className="px-4 py-2.5 rounded-full border-2 border-primary/20 focus:border-primary outline-none text-accent font-medium shadow-inner text-sm"
                />
              </div>
            </div>

            {/* Active Study Days */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-accent/80">Active Study Days of Week</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {DAYS_ORDER.map((day) => {
                  const isSelected = activeDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          if (activeDays.length > 1) {
                            setActiveDays(activeDays.filter(d => d !== day));
                          } else {
                            (window as any).showToast("You must select at least 1 study day! 🍵", "info");
                          }
                        } else {
                          setActiveDays([...activeDays, day]);
                        }
                      }}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all border-2 ${
                        isSelected
                          ? "bg-primary border-primary text-white shadow-sm"
                          : "bg-white border-primary/20 text-accent/70 hover:bg-[#eef7f2]"
                      }`}
                    >
                      {DAY_LABELS[day]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center gap-2 mt-2 w-full">
              {weeklyPlan ? (
                <button 
                  type="button" 
                  onClick={clearPlan}
                  className="px-5 py-2.5 rounded-full font-bold text-red-600 border-2 border-red-500/20 hover:bg-red-50 text-sm transition-all"
                >
                  Delete Current Plan
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                {weeklyPlan && (
                  <button 
                    type="button" 
                    onClick={() => setShowSettings(false)}
                    className="px-6 py-2.5 rounded-full font-bold text-accent hover:bg-black/5 text-sm"
                  >
                    Cancel
                  </button>
                )}
              <button 
                type="button" 
                onClick={updatePreferences}
                disabled={loading || !topic.trim()}
                className="bg-primary text-white font-bold px-8 py-2.5 rounded-full flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none text-sm"
              >
                {loading ? (
                  <><span className="material-symbols-rounded animate-spin text-sm">sync</span> Generating...</>
                ) : (
                  <><span className="material-symbols-rounded text-sm">magic_button</span> Generate New Plan</>
                )}
              </button>
              </div>
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
          {!activeDays.includes(activeDay) ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-white border-2 border-primary/10 rounded-3xl shadow-sm">
              <span className="material-symbols-rounded text-6xl text-primary/40 animate-pulse">spa</span>
              <h3 className="font-display font-black text-accent text-lg mt-4">Today is your Rest Day! 🍵</h3>
              <p className="text-sm text-accent/60 mt-2 max-w-md">Relax and recharge. You can still access other practice labs from the menu to study on your own!</p>
            </div>
          ) : currentDayPlan ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Day Overview & Tasks */}
              <div className="flex flex-col gap-6">
                {/* Topic card */}
                <div className="bg-white border-2 border-primary/10 rounded-3xl p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <div>
                      <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider mb-2">
                        Focus: {currentDayPlan.focus}
                      </span>
                      <h3 className="font-display font-black text-accent text-lg">
                        {currentDayPlan.topic}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-primary/5 pt-4">
                    <p className="text-xs font-black text-primary uppercase tracking-widest mb-3">Today's Tasks:</p>
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
                      <span className="material-symbols-rounded text-primary">local_library</span> 3 Target Vocabulary Words
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
                            (window as any).showAlert("All of these vocabulary words are already in your library! 🍵", "Information", "info");
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
                            
                            const msg = `Successfully saved ${added} new words!` + 
                              (duplicates > 0 ? ` (${duplicates} duplicates)` : "") + " 🍵";
                            
                            (window as any).showAlert(msg, "Save Completed!", "success");
                          } catch (err) {
                            console.error(err);
                            (window as any).showAlert("An error occurred while saving vocabulary.", "Error", "error");
                          } finally {
                            setSavingAll(false);
                          }
                        }
                      }}
                      className="text-[10px] bg-primary/10 text-primary font-bold px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                    >
                      {savingAll ? "Saving..." : "Save All"}
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
                                    (window as any).showToast(`Word "${v.word}" already exists in library! 🍵`, "info");
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
                            {isSaved ? 'Saved' : savingWords.has(v.word) ? 'Saving...' : 'Save'}
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
                {(currentDayPlan.focus === "Nghe" || currentDayPlan.focus === "Listening") && currentDayPlan.listening && (
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
                          <p className="text-[10px] font-bold text-primary uppercase">Comprehension Questions:</p>
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
                      <span className="material-symbols-rounded text-base">play_circle</span> Start Listening
                    </button>
                  </div>
                )}

                {(currentDayPlan.focus === "Đọc" || currentDayPlan.focus === "Reading") && currentDayPlan.reading && (
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
                          <p className="text-[10px] font-bold text-primary uppercase">Questions:</p>
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
                      <span className="material-symbols-rounded text-base">auto_stories</span> Start Reading
                    </button>
                  </div>
                )}

                {(currentDayPlan.focus === "Viết" || currentDayPlan.focus === "Writing") && currentDayPlan.writing && (
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
                          <p className="text-[10px] font-bold text-primary uppercase">Suggested Key Points:</p>
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
                      <span className="material-symbols-rounded text-base">edit</span> Start Writing
                    </button>
                  </div>
                )}

                {(currentDayPlan.focus === "Nói" || currentDayPlan.focus === "Speaking") && currentDayPlan.speaking && (
                  <div className="bg-white border-2 border-primary/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full">
                    <div>
                      <h3 className="font-display font-black text-accent text-sm flex items-center gap-2 mb-2">
                        <span className="material-symbols-rounded text-primary text-base">record_voice_over</span> IELTS Speaking Prompt
                      </h3>
                      <div className="bg-[#f9f9f9] p-5 rounded-2xl border border-black/5 flex flex-col gap-2">
                        <p className="text-[10px] font-bold text-primary uppercase">Speaking Topic:</p>
                        <p className="text-base text-accent italic font-semibold leading-relaxed">
                          "{currentDayPlan.speaking.prompt}"
                        </p>
                      </div>
                      <p className="text-xs text-accent/60 mt-4 leading-relaxed">
                        💡 **Hint:** Click the button below to send this prompt to **Speaking Studio**, record a 2-minute response, and get pronunciation and grammar feedback from IELTS Oasis AI!
                      </p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => onPracticeSpeaking && onPracticeSpeaking(currentDayPlan.speaking.prompt)}
                      className="mt-6 w-full bg-primary hover:bg-primary-dark text-white font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-1 shadow-md shadow-primary/10"
                    >
                      <span className="material-symbols-rounded text-base">mic</span> Start Speaking Studio
                    </button>
                  </div>
                )}

                {/* Default Vocabulary/Quiz Focus */}
                {(!currentDayPlan.focus || currentDayPlan.focus === "Từ vựng" || currentDayPlan.focus === "Vocabulary") && (
                  <div className="bg-[#FFFDF5] border-2 border-primary/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full border-dashed">
                    <div>
                      <h3 className="font-display font-black text-accent text-sm flex items-center gap-2 mb-2">
                        <span className="material-symbols-rounded text-primary text-base">spellcheck</span> Daily Vocabulary Practice
                      </h3>
                      <p className="text-xs text-accent/70 leading-relaxed mt-2">
                        Today is dedicated to academic vocabulary acquisition. Save target words to your Vocabulary Lab to practice Spaced Repetition (SRS).
                      </p>
                      <div className="mt-4 p-4 bg-primary/5 rounded-2xl flex items-center gap-3 border border-primary/10">
                        <span className="material-symbols-rounded text-primary text-2xl">auto_stories</span>
                        <div>
                          <p className="text-xs font-bold text-accent">Read with MatchaScroll</p>
                          <p className="text-[10px] text-accent/60">Import news articles/documents and extract vocabulary to save to your library.</p>
                        </div>
                      </div>
                    </div>
                    <a 
                      href="/scroll"
                      className="mt-6 w-full bg-primary hover:bg-primary-dark text-white font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-1 shadow-md shadow-primary/10 text-center"
                    >
                      <span className="material-symbols-rounded text-base">article</span> Open MatchaScroll Reader
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-3xl border border-primary/10">
              <p className="text-accent/60">No study plan found for this day.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-primary/20 p-8">
          <span className="material-symbols-rounded text-primary/40 text-5xl mb-3">auto_awesome</span>
          <h3 className="font-display font-bold text-accent text-lg">You haven't generated an IELTS study plan yet</h3>
          <p className="text-sm text-accent/60 max-w-sm mt-1 mb-6">Enter your target study topic in Settings above to generate your customized 7-day plan!</p>
          <button 
            type="button"
            onClick={() => setShowSettings(true)}
            className="bg-primary text-white font-bold px-6 py-2.5 rounded-full hover:scale-105 transition-all text-xs shadow-md"
          >
            Configure Study Plan
          </button>
        </div>
      )}
    </section>
  );
}
