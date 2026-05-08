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
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = '/api';

export default function Home() {
  const [vocab, setVocab] = useState<any[]>([]);
  const [greeting, setGreeting] = useState("Ready for your daily brew of knowledge?");
  const [showQuiz, setShowQuiz] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dueCount, setDueCount] = useState(0);

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
      const [vRes, gRes] = await Promise.all([
        fetch(`${API_URL}/vocabulary`),
        fetch(`${API_URL}/encouragement`)
      ]);
      const vData = await vRes.json();
      const gData = await gRes.json();
      
      setVocab(Array.isArray(vData) ? vData : []);
      if (gData.encouragement) setGreeting(gData.encouragement);
      
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
              Hello, Cậu nhớ <span className="animate-pulse">🍵</span>
            </h2>
            <p className="text-lg opacity-70 text-accent">{greeting}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <input 
                className="pl-12 pr-6 py-4 bg-white border-none rounded-full shadow-sm focus:ring-2 focus:ring-primary w-full md:w-64 text-accent" 
                placeholder="Search vocabulary..." 
                type="text"
              />
              <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 opacity-40 text-accent">search</span>
            </div>
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
          
          <WritingSanctuary />
          
          <Library 
            vocabList={vocab} 
            onAdd={(word) => handleAddVocab({ word })} 
            onDelete={handleRemoveVocab}
          />
          <WeeklyStats />
          
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

      {/* QUIZ MODAL */}
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
      </AnimatePresence>

      <MascotMessage dueCount={dueCount} />
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}
