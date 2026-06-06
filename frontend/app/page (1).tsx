"use client";

import React, { useState, useEffect } from 'react';
import VocabularyLab from '../components/VocabularyLab';
import MatchaLens from '../components/MatchaLens';
import WritingSanctuary from '../components/WritingSanctuary';
import Library from '../components/Library';
import WeeklyStats from '../components/WeeklyStats';
import VocabularyQuiz from '../components/VocabularyQuiz';
import ToastContainer, { Toast } from '../components/ToastContainer';
import MascotMessage from '../components/MascotMessage';
import HistoryModal from '../components/HistoryModal';
import ListeningLab from '../components/ListeningLab';
import DailyPlanner from '../components/DailyPlanner';
import CommunityFeed from '../components/CommunityFeed';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = '/api';

export default function Home() {
  const [vocab, setVocab] = useState<any[]>([]);
  const [greeting, setGreeting] = useState("Ready for your daily brew of knowledge?");
  const [showQuiz, setShowQuiz] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [stats, setStats] = useState({ streak: 0, masteredCount: 0, history: [] });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Client-side local storage check
    const token = localStorage.getItem('oasis_token');
    const storedUser = localStorage.getItem('oasis_user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('oasis_token');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  };

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/discord/login`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error(e);
      showToast('Lỗi khi kết nối Discord', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('oasis_token');
    localStorage.removeItem('oasis_user');
    setUser(null);
    setVocab([]);
    setStats({ streak: 0, masteredCount: 0, history: [] });
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter(t => t.id !== id));
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const fetchData = async () => {
    try {
      const reqOptions = { headers: getHeaders() };
      const [vRes, gRes, sRes] = await Promise.all([
        fetch(`${API_URL}/vocabulary`, reqOptions),
        fetch(`${API_URL}/encouragement`),
        fetch(`${API_URL}/stats`, reqOptions)
      ]);
      const vData = await vRes.json();
      const gData = await gRes.json();
      const sData = await sRes.json();
      
      setVocab(Array.isArray(vData) ? vData : []);
      if (gData.encouragement) setGreeting(gData.encouragement);
      if (sData) setStats({ streak: sData.streak || 0, masteredCount: sData.mastered_this_week || 0, history: sData.history || [] });
      
      // Calculate Due Count (SRS)
      const now = new Date();
      const due = vData.filter((item: any) => new Date(item.next_review) <= now).length;
      setDueCount(due);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddVocab = async (wordData: any) => {
    try {
      const res = await fetch(`${API_URL}/vocabulary`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(wordData),
      });
      if (res.ok) {
        showToast(`Added "${wordData.word}" to your library!`, 'success');
        fetchData();
      } else {
        showToast('Failed to add word.', 'error');
      }
    } catch (err) { 
      console.error(err);
      showToast('Connection error.', 'error');
    }
  };

  const handleGenerateTopic = async (topic: string) => {
    try {
      const res = await fetch(`${API_URL}/vocabulary/generate?topic=${topic}`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok) {
        showToast(`AI is brewing words for "${topic}"...`, 'success');
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const handleRemoveVocab = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/vocabulary/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        showToast('Word removed from library.', 'success');
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const handleReview = async (id: number, isCorrect: boolean) => {
    try {
      await fetch(`${API_URL}/vocabulary/${id}/review`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ is_correct: isCorrect }),
      });
      fetchData(); // Refresh counts
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex h-screen p-4 lg:p-6 gap-6 relative overflow-hidden bg-[#FFFDF5]">
      <main className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 px-2">
          <div>
            <h2 className="text-4xl font-display font-bold text-accent">
              Hello, {user ? user.username : 'Cậu'} nhớ <span className="animate-pulse">🍵</span>
            </h2>
            <p className="text-lg opacity-70 text-accent">{greeting}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group hidden md:block">
              <input 
                className="pl-12 pr-6 py-3 bg-white border-none rounded-full shadow-sm focus:ring-2 focus:ring-primary w-full md:w-64 text-accent" 
                placeholder="Search vocabulary..." 
                type="text"
              />
              <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 opacity-40 text-accent">search</span>
            </div>
            
            {user ? (
              <div className="flex items-center gap-3 bg-white pl-2 pr-4 py-1.5 rounded-full shadow-sm border border-primary/10">
                <img src={user.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} className="w-8 h-8 rounded-full border border-primary/20" alt="avatar" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-accent leading-tight">{user.username}</span>
                  <button onClick={handleLogout} className="text-[10px] text-red-500 hover:underline text-left">Đăng xuất</button>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white px-5 py-2.5 rounded-full font-bold transition-all shadow-md"
              >
                <img src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" className="w-5 h-5 brightness-0 invert" alt="Discord" />
                Login Discord
              </button>
            )}
          </div>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6 pb-8">
          <VocabularyLab 
            vocabList={vocab} 
            onAdd={handleAddVocab} 
            onDelete={handleRemoveVocab}
            onGenerateTopic={handleGenerateTopic}
            onStartQuiz={() => setShowQuiz(true)} 
          />
          <MatchaLens onAdd={handleAddVocab} />
          
          <DailyPlanner />
          
          <CommunityFeed />
          
          <WritingSanctuary />
          
          <ListeningLab onAddVocab={handleAddVocab} />
          
          <Library 
            vocabList={vocab} 
            onAdd={(word) => handleAddVocab({ word })} 
            onDelete={handleRemoveVocab}
          />
          <WeeklyStats 
            streak={stats.streak} 
            masteredCount={stats.masteredCount} 
            onOpenHistory={() => setShowHistory(true)} 
          />
          
          {/* Tip of the Day */}
          <section className="xl:col-span-12 bg-secondary rounded-large p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-primary/20">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-primary shadow-sm border-2 border-primary/10">
                <span className="material-symbols-rounded text-3xl">lightbulb</span>
              </div>
              <div>
                <h4 className="font-bold text-lg text-accent">Matcha Tip</h4>
                <p className="opacity-70 text-sm text-accent">Lặp lại ngắt quãng (SRS) giúp bạn nhớ từ vựng lâu hơn gấp 3 lần so với học vẹt.</p>
              </div>
            </div>
            <button className="bg-primary text-white font-bold py-4 px-10 rounded-full hover:scale-105 transition-transform whitespace-nowrap">
              Learn More
            </button>
          </section>
        </div>
      </main>

      {/* QUIZ AND HISTORY MODALS */}
      <AnimatePresence>
        {showQuiz && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowQuiz(false)}
              className="absolute inset-0 bg-accent/20 backdrop-blur-sm"
            />
            <VocabularyQuiz 
              vocabList={vocab} 
              onReview={handleReview}
              onClose={() => setShowQuiz(false)} 
            />
          </div>
        )}

        {showHistory && (
          <HistoryModal 
            history={stats.history} 
            onClose={() => setShowHistory(false)} 
          />
        )}
      </AnimatePresence>

      {/* Bottom Mobile Navigation Removed */}

      <MascotMessage dueCount={dueCount} />
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}
