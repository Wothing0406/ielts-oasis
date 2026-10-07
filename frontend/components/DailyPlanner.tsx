"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Settings, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  BookmarkPlus, 
  Headphones, 
  PlayCircle, 
  FileText, 
  PenTool, 
  Mic, 
  SpellCheck, 
  Lightbulb, 
  Coffee, 
  RefreshCw, 
  Trash2, 
  Sliders, 
  Layers
} from 'lucide-react';

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
          const todayIndex = new Date().getDay();
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
    if (!token) return (window as any).showToast("You need to log in to save your study plan!", "info");
    
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/study-plan/update-preferences`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          topic,
          study_focus: studyFocus,
          study_time: studyTime,
          active_days: activeDays.join(',')
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setWeeklyPlan(data.weekly_plan);
        setShowSettings(false);
        (window as any).showToast("Study plan configured successfully!", "success");
      } else {
        const data = await res.json();
        throw new Error(data.detail || "An error occurred");
      }
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
      "Are you sure you want to delete your current study plan? All 7-day progress and routines will be cleared.",
      async () => {
        setLoading(true);
        try {
          const res = await fetch(`${API_URL}/study-plan/clear`, {
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
            (window as any).showToast("Study plan deleted successfully!", "success");
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
    if (!token) return (window as any).showToast("You need to log in to get the calendar link!", "info");
    
    const calUrl = `${window.location.origin}${API_URL}/study-plan/calendar.ics?token=${token}`;
    navigator.clipboard.writeText(calUrl);
    
    (window as any).showAlert(
      "Calendar link copied to clipboard! To sync with Google Calendar:\n\n" +
      "1. Open Google Calendar.\n" +
      "2. Click '+' next to 'Other calendars' on the left side.\n" +
      "3. Select 'From URL' and paste the copied link.\n" +
      "4. Click 'Add calendar' to complete! It will sync automatically daily.", 
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
            <Calendar className="w-7 h-7 text-primary shrink-0" />
            <span>Matcha Daily Plan</span>
          </h2>
          <p className="text-sm text-accent/70 mt-1">Smart 7-day IELTS adaptive study plan, synced across platforms</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {weeklyPlan && (
            <button 
              type="button"
              onClick={copyCalendarLink}
              className="min-h-[44px] bg-[#eef7f2] border-2 border-primary/20 text-primary font-bold px-4 py-2 rounded-full flex items-center justify-center gap-2 hover:bg-primary/10 active:scale-95 transition-all text-xs shrink-0 flex-1 sm:flex-initial"
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Sync Google Calendar</span>
            </button>
          )}
          <button 
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`min-h-[44px] font-bold px-4 py-2 rounded-full flex items-center justify-center gap-2 transition-all text-xs active:scale-95 shrink-0 flex-1 sm:flex-initial ${
              showSettings ? 'bg-primary text-white shadow-md' : 'bg-[#eef7f2] border-2 border-primary/20 text-primary hover:bg-primary/10'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Plan Settings</span>
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
              <Sliders className="w-4 h-4 text-primary shrink-0" />
              <span>Configure Personalized Study Plan</span>
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
                  className="px-4 py-2.5 rounded-full border-2 border-primary/20 focus:border-primary outline-none text-accent font-medium shadow-inner placeholder:text-accent/60 text-sm min-h-[44px]"
                />
              </div>

              {/* Study Focus */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-accent/80">Skill Focus</label>
                <select 
                  value={studyFocus}
                  onChange={e => setStudyFocus(e.target.value)}
                  className="px-4 py-2.5 rounded-full border-2 border-primary/20 focus:border-primary outline-none text-accent font-medium bg-white text-sm min-h-[44px]"
                >
                  <option value="Toàn diện">Comprehensive (4 Skills)</option>
                  <option value="Nghe">Listening Focus</option>
                  <option value="Đọc">Reading Focus</option>
                  <option value="Viết">Writing Focus</option>
                  <option value="Nói">Speaking Focus</option>
                  <option value="Từ vựng">Vocabulary & SRS Focus</option>
                </select>
              </div>

              {/* Study Time */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-accent/80">Preferred Study Time</label>
                <input 
                  type="time"
                  value={studyTime}
                  onChange={e => setStudyTime(e.target.value)}
                  className="px-4 py-2.5 rounded-full border-2 border-primary/20 focus:border-primary outline-none text-accent font-medium bg-white text-sm min-h-[44px]"
                />
              </div>
            </div>

            {/* Active Days Multi-select */}
            <div className="flex flex-col gap-2 mt-2">
              <label className="text-xs font-bold text-accent/80 flex items-center justify-between">
                <span>Active Study Days:</span>
                <span className="text-[10px] text-accent/60">Selected days will have study tasks assigned</span>
              </label>
              <div className="flex flex-wrap gap-2">
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
                            (window as any).showToast("You must select at least 1 study day!", "info");
                          }
                        } else {
                          setActiveDays([...activeDays, day]);
                        }
                      }}
                      className={`min-h-[40px] px-4 py-2 rounded-full text-xs font-bold transition-all border-2 active:scale-95 ${
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

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-2 w-full">
              {weeklyPlan ? (
                <button 
                  type="button" 
                  onClick={clearPlan}
                  className="min-h-[44px] w-full sm:w-auto px-5 py-2.5 rounded-full font-bold text-red-600 border-2 border-red-500/20 hover:bg-red-50 text-sm active:scale-95 transition-all inline-flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                  <span>Delete Current Plan</span>
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-2 w-full sm:w-auto">
                {weeklyPlan && (
                  <button 
                    type="button" 
                    onClick={() => setShowSettings(false)}
                    className="min-h-[44px] flex-1 sm:flex-initial px-6 py-2.5 rounded-full font-bold text-accent hover:bg-black/5 text-sm active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={updatePreferences}
                  disabled={loading || !topic.trim()}
                  className="min-h-[44px] flex-1 sm:flex-initial bg-primary text-white font-bold px-8 py-2.5 rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none text-sm"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>Generate New Plan</span>
                    </>
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
                  className={`min-h-[40px] px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm active:scale-95 shrink-0 ${
                    isActive 
                      ? 'bg-primary text-white shadow-md' 
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
              <Coffee className="w-12 h-12 text-primary/40 shrink-0 mb-2 animate-pulse" />
              <h3 className="font-display font-black text-accent text-lg mt-2 flex items-center gap-2">
                <span>Today is your Rest Day!</span>
                <Coffee className="w-5 h-5 text-primary shrink-0" />
              </h3>
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
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Vocabulary Card */}
                <div className="bg-white border-2 border-primary/10 rounded-3xl p-6 shadow-sm flex-1">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                    <h3 className="font-display font-black text-accent text-base flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary shrink-0" />
                      <span>3 Target Vocabulary Words</span>
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
                            (window as any).showAlert("All of these vocabulary words are already in your library!", "Information", "info");
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
                            results.forEach(res => {
                              if (res && res.success) added++;
                              else if (res && res.status === "duplicate") duplicates++;
                              else errors++;
                            });
                            
                            const msg = `Saved ${added} new words` + 
                              (duplicates > 0 ? ` (${duplicates} duplicates)` : "");
                            (window as any).showToast(msg, "success");
                          } catch (err) {
                            (window as any).showToast("Error saving words to library.", "error");
                          } finally {
                            setSavingAll(false);
                          }
                        }
                      }}
                      className="min-h-[36px] text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-all disabled:opacity-50 active:scale-95 inline-flex items-center gap-1.5"
                    >
                      {savingAll ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-3.5 h-3.5 shrink-0" />
                          <span>Save All to Lab</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {currentDayPlan.vocabulary?.map((v: any, vIdx: number) => {
                      const isSaved = vocabList.some((sv: any) => sv.word.toLowerCase() === v.word.toLowerCase());
                      return (
                        <div key={vIdx} className="p-3 bg-[#fcfaf5] rounded-2xl border border-amber-900/5 flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="font-display font-black text-accent text-sm">{v.word}</span>
                              <span className="text-[11px] font-mono text-accent/60 italic">{v.phonetic}</span>
                            </div>
                            <p className="text-xs text-accent/80 font-medium truncate mt-0.5">{v.meaning}</p>
                          </div>
                          <button
                            type="button"
                            disabled={isSaved || savingWords.has(v.word)}
                            onClick={async () => {
                              if (onAddVocab && !isSaved) {
                                setSavingWords(prev => new Set(prev).add(v.word));
                                try {
                                  const res = await onAddVocab({ ...v, source: "Discord Reminder" });
                                  if (res && res.status === "duplicate") {
                                    (window as any).showToast(`Word "${v.word}" already exists in library!`, "info");
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
                            className={`min-h-[36px] flex items-center justify-center gap-1.5 transition-colors px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 shrink-0 ${
                              isSaved 
                                ? 'bg-green-100 text-green-700 cursor-default font-semibold' 
                                : savingWords.has(v.word)
                                ? 'bg-primary/5 text-primary/40 cursor-wait animate-pulse'
                                : 'bg-primary/20 text-accent hover:bg-primary/30'
                            }`}
                          >
                            {isSaved ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-green-600" />
                                <span>Saved</span>
                              </>
                            ) : savingWords.has(v.word) ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <BookmarkPlus className="w-3.5 h-3.5 shrink-0" />
                                <span>Save</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Day Skill Practice Card */}
              <div className="flex flex-col">
                {/* Listening Practice */}
                {(currentDayPlan.focus === "Nghe" || currentDayPlan.focus === "Listening") && currentDayPlan.listening && (
                  <div className="bg-white border-2 border-primary/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full">
                    <div>
                      <h3 className="font-display font-black text-accent text-sm flex items-center gap-2 mb-2">
                        <Headphones className="w-4 h-4 text-primary shrink-0" />
                        <span>IELTS Listening Transcript</span>
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
                      className="mt-6 w-full min-h-[44px] bg-primary hover:bg-primary/90 text-white font-bold text-sm py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/10 active:scale-95"
                    >
                      <PlayCircle className="w-4 h-4 shrink-0" />
                      <span>Start Listening</span>
                    </button>
                  </div>
                )}

                {/* Reading Practice */}
                {(currentDayPlan.focus === "Đọc" || currentDayPlan.focus === "Reading") && currentDayPlan.reading && (
                  <div className="bg-white border-2 border-primary/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full">
                    <div>
                      <h3 className="font-display font-black text-accent text-sm flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-primary shrink-0" />
                        <span>IELTS Reading Passage</span>
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
                      className="mt-6 w-full min-h-[44px] bg-primary hover:bg-primary/90 text-white font-bold text-sm py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/10 active:scale-95"
                    >
                      <BookOpen className="w-4 h-4 shrink-0" />
                      <span>Start Reading</span>
                    </button>
                  </div>
                )}

                {/* Writing Practice */}
                {(currentDayPlan.focus === "Viết" || currentDayPlan.focus === "Writing") && currentDayPlan.writing && (
                  <div className="bg-white border-2 border-primary/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full">
                    <div>
                      <h3 className="font-display font-black text-accent text-sm flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span>IELTS Writing Task</span>
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
                      className="mt-6 w-full min-h-[44px] bg-primary hover:bg-primary/90 text-white font-bold text-sm py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/10 active:scale-95"
                    >
                      <PenTool className="w-4 h-4 shrink-0" />
                      <span>Start Writing</span>
                    </button>
                  </div>
                )}

                {/* Speaking Practice */}
                {(currentDayPlan.focus === "Nói" || currentDayPlan.focus === "Speaking") && currentDayPlan.speaking && (
                  <div className="bg-white border-2 border-primary/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full">
                    <div>
                      <h3 className="font-display font-black text-accent text-sm flex items-center gap-2 mb-2">
                        <Mic className="w-4 h-4 text-primary shrink-0" />
                        <span>IELTS Speaking Prompt</span>
                      </h3>
                      <div className="bg-[#f9f9f9] p-5 rounded-2xl border border-black/5 flex flex-col gap-2">
                        <p className="text-[10px] font-bold text-primary uppercase">Speaking Topic:</p>
                        <p className="text-base text-accent italic font-semibold leading-relaxed">
                          "{currentDayPlan.speaking.prompt}"
                        </p>
                      </div>
                      <div className="text-xs text-accent/70 mt-4 leading-relaxed flex items-start gap-1.5 bg-amber-50/60 p-3 rounded-2xl border border-amber-200/50">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span><strong>Hint:</strong> Click the button below to send this prompt to <strong>Speaking Studio</strong>, record a 2-minute response, and get pronunciation and grammar feedback from IELTS Oasis AI!</span>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => onPracticeSpeaking && onPracticeSpeaking(currentDayPlan.speaking.prompt)}
                      className="mt-6 w-full min-h-[44px] bg-primary hover:bg-primary/90 text-white font-bold text-sm py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/10 active:scale-95"
                    >
                      <Mic className="w-4 h-4 shrink-0" />
                      <span>Start Speaking Studio</span>
                    </button>
                  </div>
                )}

                {/* Default Vocabulary/Quiz Focus */}
                {(!currentDayPlan.focus || currentDayPlan.focus === "Từ vựng" || currentDayPlan.focus === "Vocabulary") && (
                  <div className="bg-[#FFFDF5] border-2 border-primary/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full border-dashed">
                    <div>
                      <h3 className="font-display font-black text-accent text-sm flex items-center gap-2 mb-2">
                        <SpellCheck className="w-4 h-4 text-primary shrink-0" />
                        <span>Daily Vocabulary Practice</span>
                      </h3>
                      <p className="text-xs text-accent/70 leading-relaxed mt-2">
                        Today is dedicated to academic vocabulary acquisition. Save target words to your Vocabulary Lab to practice Spaced Repetition (SRS).
                      </p>
                      <div className="mt-4 p-4 bg-primary/5 rounded-2xl flex items-center gap-3 border border-primary/10">
                        <BookOpen className="w-6 h-6 text-primary shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-accent">Read with MatchaScroll</p>
                          <p className="text-[10px] text-accent/60">Import news articles/documents and extract vocabulary to save to your library.</p>
                        </div>
                      </div>
                    </div>
                    <a 
                      href="/scroll"
                      className="mt-6 w-full min-h-[44px] bg-primary hover:bg-primary/90 text-white font-bold text-sm py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/10 text-center active:scale-95"
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      <span>Open MatchaScroll Reader</span>
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
          <Sparkles className="w-12 h-12 text-primary/40 shrink-0 mb-3" />
          <h3 className="font-display font-bold text-accent text-lg">You haven't generated an IELTS study plan yet</h3>
          <p className="text-sm text-accent/60 max-w-sm mt-1 mb-6">Enter your target study topic in Settings above to generate your customized 7-day plan!</p>
          <button 
            type="button"
            onClick={() => setShowSettings(true)}
            className="min-h-[44px] bg-primary text-white font-bold px-8 py-3 rounded-full hover:scale-105 active:scale-95 transition-all text-xs shadow-md inline-flex items-center gap-2"
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Configure Study Plan</span>
          </button>
        </div>
      )}
    </section>
  );
}
