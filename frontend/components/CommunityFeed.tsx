"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = '/api';

export default function CommunityFeed() {
  const [data, setData] = useState<{ vocabularies: any[]; writings: any[] }>({ vocabularies: [], writings: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'writings' | 'vocabularies'>('writings');
  const [lesson, setLesson] = useState<any>(null);
  const [convertingId, setConvertingId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/community/feed`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleConvertToLesson = async (writingId: number) => {
    setConvertingId(writingId);
    setLesson(null);
    setAnswers({});
    setShowFeedback(false);
    try {
      const res = await fetch(`${API_URL}/community/convert/${writingId}`, { method: 'POST' });
      const lessonData = await res.json();
      if (!res.ok) throw new Error(lessonData.detail);
      setLesson(lessonData);
    } catch (err) {
      alert("Lỗi: " + err);
    } finally {
      setConvertingId(null);
    }
  };

  const handleOptionSelect = (qId: number, option: string) => {
    if (showFeedback) return;
    setAnswers({ ...answers, [qId]: option });
  };

  const handleSubmitQuiz = () => {
    let tempScore = 0;
    lesson.questions.forEach((q: any) => {
      if (answers[q.id] === q.correctAnswer) tempScore++;
    });
    setScore(tempScore);
    setShowFeedback(true);
  };

  if (loading) {
    return <div className="p-10 text-center text-primary font-bold animate-pulse">Đang tải dữ liệu cộng đồng...</div>;
  }

  return (
    <section className="xl:col-span-12 matcha-card p-6 md:p-10 bento-card flex flex-col gap-6 bg-white border-4 border-primary/20 rounded-[3rem]">
      <div className="flex flex-col md:flex-row justify-between items-center border-b border-primary/10 pb-4">
        <div>
          <h2 className="font-display text-2xl font-black text-accent flex items-center gap-2">
            <span className="material-symbols-rounded text-primary text-3xl">public</span>
            Oasis Community
          </h2>
          <p className="text-sm text-accent/70">Cùng học hỏi từ các bài viết và từ vựng xuất sắc của mọi người</p>
        </div>
        <div className="flex bg-secondary/50 p-1 rounded-full border border-primary/10 mt-4 md:mt-0">
          <button 
            onClick={() => setActiveTab('writings')}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'writings' ? 'bg-primary text-white shadow-md' : 'text-accent/70 hover:text-accent'}`}
          >
            Bài luận hay
          </button>
          <button 
            onClick={() => setActiveTab('vocabularies')}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'vocabularies' ? 'bg-primary text-white shadow-md' : 'text-accent/70 hover:text-accent'}`}
          >
            Từ vựng nổi bật
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        {activeTab === 'writings' && data.writings.map(w => (
          <div key={w.id} className="bg-[#f9fdfa] border-2 border-primary/10 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-black/5 pb-3">
              <img src={w.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} className="w-8 h-8 rounded-full border border-primary/30" />
              <div>
                <p className="text-xs font-black text-accent">{w.username}</p>
                <p className="text-[10px] text-accent/60">Band Score: <span className="text-primary font-bold">{w.band_score}</span></p>
              </div>
            </div>
            <p className="text-xs text-accent italic leading-relaxed line-clamp-3">"{w.content}"</p>
            <button 
              onClick={() => handleConvertToLesson(w.id)}
              disabled={convertingId === w.id}
              className="mt-auto self-start bg-accent text-white text-[10px] font-bold px-4 py-2 rounded-full flex items-center gap-1 hover:bg-primary transition-colors disabled:opacity-50"
            >
              {convertingId === w.id ? (
                <><span className="material-symbols-rounded animate-spin text-[14px]">sync</span> Đang tạo bài học AI...</>
              ) : (
                <><span className="material-symbols-rounded text-[14px]">psychology</span> Biến thành bài Nghe/Đọc</>
              )}
            </button>
          </div>
        ))}

        {activeTab === 'vocabularies' && data.vocabularies.map(v => (
          <div key={v.id} className="bg-white border-2 border-primary/10 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <img src={v.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} className="w-10 h-10 rounded-full border-2 border-primary/20" />
              <div>
                <p className="font-display font-black text-primary text-lg leading-none">{v.word}</p>
                <p className="text-[10px] text-accent/50 italic">{v.phonetic} - bởi {v.username}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-accent">{v.meaning}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lesson Modal */}
      <AnimatePresence>
        {lesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLesson(null)} className="absolute inset-0 bg-accent/30 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#FFFDF5] w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6 md:p-8 rounded-[2rem] border-4 border-primary/30 relative z-10 shadow-2xl">
              <button onClick={() => setLesson(null)} className="absolute top-4 right-4 bg-secondary/50 text-accent/50 hover:text-accent p-2 rounded-full"><span className="material-symbols-rounded">close</span></button>
              
              <h3 className="font-display font-black text-2xl text-primary mb-6 flex items-center gap-2">
                <span className="material-symbols-rounded">auto_awesome</span> AI Interactive Lesson
              </h3>

              {lesson.audio_url && (
                <div className="mb-6 bg-white p-4 rounded-3xl border-2 border-primary/10 flex flex-col gap-2">
                  <p className="text-xs font-bold text-accent">Nghe bài viết này:</p>
                  <audio controls src={lesson.audio_url} className="w-full" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-bold text-accent mb-3 flex items-center gap-1"><span className="material-symbols-rounded text-primary">local_library</span> Từ Vựng Trích Xuất</h4>
                  <div className="space-y-3">
                    {lesson.vocabulary?.map((v: any, i: number) => (
                      <div key={i} className="bg-white border border-primary/10 p-3 rounded-xl">
                        <span className="font-bold text-primary mr-2">{v.word}</span>
                        <span className="text-xs text-accent italic">- {v.meaning}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-accent mb-3 flex items-center gap-1"><span className="material-symbols-rounded text-primary">quiz</span> Quiz Đọc / Nghe hiểu</h4>
                  <div className="space-y-4">
                    {lesson.questions?.map((q: any, i: number) => (
                      <div key={i} className="bg-white border border-primary/10 p-4 rounded-xl space-y-2">
                        <p className="text-xs font-bold text-accent">{i + 1}. {q.question}</p>
                        <div className="space-y-1 mt-2">
                          {q.options?.map((opt: string) => {
                            const isSelected = answers[q.id] === opt;
                            const isCorrect = opt === q.correctAnswer;
                            let btnClass = "bg-[#f9f9f9] border-black/5 hover:border-primary/30 text-accent";
                            if (isSelected && !showFeedback) btnClass = "bg-[#eef7f2] border-primary text-primary";
                            if (showFeedback && isCorrect) btnClass = "bg-green-500 border-green-500 text-white";
                            if (showFeedback && isSelected && !isCorrect) btnClass = "bg-red-500 border-red-500 text-white";
                            
                            return (
                              <button key={opt} onClick={() => handleOptionSelect(q.id, opt)} className={`w-full text-left px-3 py-2 text-[10px] font-bold rounded-lg border transition-all ${btnClass}`}>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {showFeedback && (
                          <div className="mt-2 text-[10px] italic text-accent/80 bg-blue-50 p-2 rounded border border-blue-100">
                            <b>Giải thích:</b> {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    {showFeedback ? (
                       <span className="text-sm font-bold text-accent mr-4">Kết quả: <b className="text-primary">{score}</b> / {lesson.questions?.length}</span>
                    ) : (
                      <button onClick={handleSubmitQuiz} className="bg-primary text-white text-xs font-bold px-6 py-3 rounded-full hover:scale-105">Nộp bài</button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
