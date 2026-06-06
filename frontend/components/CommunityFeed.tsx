"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = '/api';

export default function CommunityFeed() {
  const [data, setData] = useState<{ vocabularies: any[]; writings: any[] }>({ vocabularies: [], writings: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'writings' | 'vocabularies'>('writings');
  const [sortBy, setSortBy] = useState('new');
  const [lesson, setLesson] = useState<any>(null);
  const [convertingId, setConvertingId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);

  const [activeComments, setActiveComments] = useState<{type: string, id: int} | null>(null);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  const fetchFeed = () => {
    setLoading(true);
    fetch(`${API_URL}/community/feed?sort_by=${sortBy}`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFeed();
  }, [sortBy]);

  const handleLike = async (postType: string, postId: number) => {
    const token = localStorage.getItem("oasis_token");
    if (!token) return alert("Bạn cần đăng nhập để thả tim!");
    try {
      const res = await fetch(`${API_URL}/community/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ post_type: postType, post_id: postId })
      });
      if (res.ok) fetchFeed(); // Refresh feed to update like count
    } catch (e) {
      console.error(e);
    }
  };

  const handleShowComments = async (postType: string, postId: number) => {
    setActiveComments({type: postType, id: postId});
    setCommentsList([]);
    try {
      const res = await fetch(`${API_URL}/community/comments/${postType}/${postId}`);
      const data = await res.json();
      setCommentsList(data.comments);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveToVault = async (vocab: any) => {
    const token = localStorage.getItem("oasis_token");
    if (!token) return alert("Bạn cần đăng nhập để lưu từ vựng!");
    try {
      const res = await fetch(`${API_URL}/vocabulary`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          word: vocab.word,
          meaning: vocab.meaning,
          phonetic: vocab.phonetic,
          image_url: vocab.image_url
        })
      });
      if (res.ok) {
        alert(`Đã lưu "${vocab.word}" vào kho từ vựng của bạn!`);
      } else {
        alert("Có lỗi xảy ra khi lưu từ vựng.");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối.");
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !activeComments) return;
    const token = localStorage.getItem("oasis_token");
    if (!token) return alert("Bạn cần đăng nhập để bình luận!");
    try {
      const res = await fetch(`${API_URL}/community/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ post_type: activeComments.type, post_id: activeComments.id, content: newComment })
      });
      if (res.ok) {
        const comment = await res.json();
        setCommentsList([comment, ...commentsList]);
        setNewComment("");
        fetchFeed(); // Update comment count on feed
      }
    } catch (e) {
      console.error(e);
    }
  };

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
          <select 
            className="bg-white border border-primary/20 text-accent text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary mr-4"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="new">Mới nhất</option>
            <option value="hot">Đang Hot</option>
            <option value="top">Điểm cao nhất</option>
          </select>
          <div className="flex bg-secondary/50 p-1 rounded-full border border-primary/10 mt-4 md:mt-0">
            <button type="button" 
              onClick={() => setActiveTab('writings')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'writings' ? 'bg-primary text-white shadow-md' : 'text-accent/70 hover:text-accent'}`}
            >
              Bài luận hay
            </button>
            <button type="button" 
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
              <img src={w.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt={`${w.username}'s avatar`} className="w-8 h-8 rounded-full border border-primary/30" />
              <div>
                <p className="text-xs font-black text-accent">{w.username}</p>
                <p className="text-[10px] text-accent/60">Band Score: <span className="text-primary font-bold">{w.band_score}</span></p>
              </div>
            </div>
            <p className="text-xs text-accent italic leading-relaxed line-clamp-3">"{w.content}"</p>
            
            {/* Tương tác */}
            <div className="flex items-center gap-4 text-xs font-bold text-accent/60 mt-auto border-t border-black/5 pt-3">
              <button type="button" onClick={() => handleLike('writing', w.id)} className="flex items-center gap-1 hover:text-red-500 transition-colors">
                <span className="material-symbols-rounded text-[16px]">favorite</span> {w.likes || 0}
              </button>
              <button type="button" onClick={() => handleShowComments('writing', w.id)} className="flex items-center gap-1 hover:text-primary transition-colors">
                <span className="material-symbols-rounded text-[16px]">chat_bubble</span> {w.comments || 0}
              </button>
              <button type="button" 
                onClick={() => handleConvertToLesson(w.id)}
                disabled={convertingId === w.id}
                className="ml-auto bg-accent text-white text-[10px] font-bold px-4 py-2 rounded-full flex items-center gap-1 hover:bg-primary transition-colors disabled:opacity-50"
              >
                {convertingId === w.id ? (
                  <><span className="material-symbols-rounded animate-spin text-[14px]">sync</span> Đang tạo bài học AI...</>
                ) : (
                  <><span className="material-symbols-rounded text-[14px]">psychology</span> Học bài này</>
                )}
              </button>
            </div>
          </div>
        ))}

        {activeTab === 'vocabularies' && data.vocabularies.map(v => (
          <div key={v.id} className="bg-white border-2 border-primary/10 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <img src={v.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt={`${v.username}'s avatar`} className="w-10 h-10 rounded-full border-2 border-primary/20" />
              <div>
                <p className="font-display font-black text-primary text-lg leading-none">{v.word}</p>
                <p className="text-[10px] text-accent/50 italic">{v.phonetic} - bởi {v.username}</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              <p className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{v.meaning}</p>
              <div className="flex items-center gap-3 text-[10px] font-bold text-accent/60">
                <button type="button" onClick={() => handleLike('vocabulary', v.id)} className="flex items-center gap-1 hover:text-red-500 transition-colors">
                  <span className="material-symbols-rounded text-[14px]">favorite</span> {v.likes || 0}
                </button>
                <button type="button" onClick={() => handleShowComments('vocabulary', v.id)} className="flex items-center gap-1 hover:text-primary transition-colors">
                  <span className="material-symbols-rounded text-[14px]">chat_bubble</span> {v.comments || 0}
                </button>
                <button type="button" onClick={() => handleSaveToVault(v)} className="flex items-center gap-1 text-primary hover:text-primary/70 transition-colors bg-primary/10 px-2 py-1 rounded-md ml-2">
                  <span className="material-symbols-rounded text-[14px]">bookmark_add</span> Lưu
                </button>
              </div>
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
              <button type="button" onClick={() => setLesson(null)} className="absolute top-4 right-4 bg-secondary/50 text-accent/50 hover:text-accent p-2 rounded-full"><span className="material-symbols-rounded">close</span></button>
              
              <h3 className="font-display font-black text-2xl text-primary mb-6 flex items-center gap-2">
                <span className="material-symbols-rounded">auto_awesome</span> AI Interactive Lesson
              </h3>

              {lesson.audio_url && (
                <div className="mb-6 bg-white p-4 rounded-3xl border-2 border-primary/10 flex flex-col gap-2">
                  <p className="text-xs font-bold text-accent">Nghe bài viết này:</p>
                  <audio controls src={lesson.audio_url} className="w-full">
                    <track kind="captions" />
                  </audio>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-bold text-accent mb-3 flex items-center gap-1"><span className="material-symbols-rounded text-primary">local_library</span> Từ Vựng Trích Xuất</h4>
                  <div className="space-y-3">
                    {lesson.vocabulary?.map((v: any, i: number) => (
                      <div key={v.word || i} className="bg-white border border-primary/10 p-3 rounded-xl">
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
                      <div key={q.id || q.question || i} className="bg-white border border-primary/10 p-4 rounded-xl space-y-2">
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
                              <button type="button" key={opt} onClick={() => handleOptionSelect(q.id, opt)} className={`w-full text-left px-3 py-2 text-[10px] font-bold rounded-lg border transition-all ${btnClass}`}>
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
                      <button type="button" onClick={handleSubmitQuiz} className="bg-primary text-white text-xs font-bold px-6 py-3 rounded-full hover:scale-105">Nộp bài</button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Comments Modal */}
      <AnimatePresence>
        {activeComments && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveComments(null)} className="absolute inset-0 bg-accent/30 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg max-h-[80vh] flex flex-col rounded-[2rem] border border-primary/20 relative z-10 shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-primary/10 flex justify-between items-center bg-secondary/20">
                <h3 className="font-bold text-accent flex items-center gap-2"><span className="material-symbols-rounded">chat_bubble</span> Bình luận</h3>
                <button type="button" onClick={() => setActiveComments(null)} className="text-accent/50 hover:text-accent p-1"><span className="material-symbols-rounded">close</span></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {commentsList.length === 0 ? (
                  <p className="text-center text-xs opacity-50 py-4">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                ) : (
                  commentsList.map((c: any) => (
                    <div key={c.id} className="flex gap-3">
                      <img src={c.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt={`${c.username}'s avatar`} className="w-8 h-8 rounded-full border border-primary/20" />
                      <div className="bg-secondary/30 px-4 py-2 rounded-2xl rounded-tl-none border border-primary/5">
                        <p className="text-[10px] font-black text-primary mb-1">{c.username}</p>
                        <p className="text-xs text-accent">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-primary/10 bg-secondary/10 flex gap-2">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                  placeholder="Viết bình luận..."
                  className="flex-1 bg-white border border-primary/20 rounded-full px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-primary"
                />
                <button type="button" onClick={handlePostComment} className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                  <span className="material-symbols-rounded text-[14px]">send</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
