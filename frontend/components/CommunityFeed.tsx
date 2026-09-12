"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = '/api';

const LEVEL_BADGE_STYLES: Record<string, string> = {
  'A1': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'A2': 'bg-teal-50 text-teal-700 border-teal-200',
  'B1': 'bg-blue-50 text-blue-700 border-blue-200',
  'B2': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'C1': 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function CommunityFeed({ 
  onAddVocab, 
  vocabList = [], 
  onListenPost,
  onReadPost,
  onSpeakPost,
  onDeleteVocab
}: { 
  onAddVocab?: (vocab: any) => Promise<any>, 
  vocabList?: any[], 
  onListenPost?: (text: string) => void,
  onReadPost?: (text: string) => void,
  onSpeakPost?: (text: string) => void,
  onDeleteVocab?: (id: number) => void
}) {
  const [data, setData] = useState<{ vocabularies: any[]; writings: any[] }>({ vocabularies: [], writings: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'writings' | 'vocabularies' | 'oxford'>('writings');
  const [sortBy, setSortBy] = useState('new');
  const [lesson, setLesson] = useState<any>(null);
  const [convertingId, setConvertingId] = useState<number | null>(null);
  const [expandedWritings, setExpandedWritings] = useState<Record<number, boolean>>({});
  const [selectedWritingContent, setSelectedWritingContent] = useState<string>("");

  const [activeComments, setActiveComments] = useState<{type: string, id: number} | null>(null);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [savingWords, setSavingWords] = useState<Set<string>>(new Set());
  const [savingAll, setSavingAll] = useState(false);

  // Oxford 5000 CEFR Curated Dataset state
  const [oxfordLevel, setOxfordLevel] = useState<string>('All');
  const [oxfordPage, setOxfordPage] = useState<number>(1);
  const [oxfordData, setOxfordData] = useState<{ total: number; page: number; total_pages: number; items: any[] }>({
    total: 0,
    page: 1,
    total_pages: 1,
    items: []
  });
  const [oxfordLoading, setOxfordLoading] = useState<boolean>(false);
  const [playingAudioWord, setPlayingAudioWord] = useState<string | null>(null);

  // High performance in-memory caches & fast lookup refs
  const oxfordCacheRef = React.useRef<Record<string, any>>({});
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // O(1) set lookup for saved words to avoid scanning vocabList on every render
  const savedWordsSet = useMemo(() => {
    return new Set(vocabList.map((v: any) => (v.word || '').toLowerCase()));
  }, [vocabList]);

  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Pagination & Compact view
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => {
    const savedUser = localStorage.getItem("oasis_user");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {}
    }
  }, []);

  const [selectedTopic, setSelectedTopic] = useState('All');
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
      setOxfordPage(1);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchFeed = (silent = false) => {
    if (!silent) setLoading(true);
    const token = localStorage.getItem("oasis_token");
    const headers: any = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : "";
    fetch(`${API_URL}/community/feed?sort_by=${sortBy}&filter_mine=${showOnlyMine}&topic=${selectedTopic === 'All' ? '' : selectedTopic}${searchParam}`, { headers })
      .then(res => res.json())
      .then(resData => {
        setData(resData || { vocabularies: [], writings: [] });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchOxfordVocab = (force = false) => {
    const cacheKey = `${oxfordLevel}_${debouncedSearch}_${oxfordPage}`;
    if (!force && oxfordCacheRef.current[cacheKey]) {
      setOxfordData(oxfordCacheRef.current[cacheKey]);
      setOxfordLoading(false);
      return;
    }

    setOxfordLoading(true);
    const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : "";
    const levelParam = oxfordLevel !== 'All' ? `&level=${oxfordLevel}` : "";
    fetch(`${API_URL}/community/curated-vocab?page=${oxfordPage}&limit=16${levelParam}${searchParam}`)
      .then(res => res.json())
      .then(resData => {
        const valid = resData || { total: 0, page: 1, total_pages: 1, items: [] };
        oxfordCacheRef.current[cacheKey] = valid;
        setOxfordData(valid);
        setOxfordLoading(false);
      })
      .catch(err => {
        console.error(err);
        setOxfordLoading(false);
      });
  };

  // Only trigger feed fetch when community feed filters change
  useEffect(() => {
    fetchFeed();
    setPage(1);
  }, [sortBy, showOnlyMine, selectedTopic, debouncedSearch]);

  // Only trigger oxford fetch when oxford tab is active or oxford filters change
  useEffect(() => {
    if (activeTab === 'oxford') {
      fetchOxfordVocab();
    }
  }, [activeTab, oxfordLevel, oxfordPage, debouncedSearch]);

  const handleLike = async (postType: string, postId: number) => {
    const token = localStorage.getItem("oasis_token");
    if (!token) return (window as any).showToast("Bạn cần đăng nhập để thả tim! 🍵", "info");
    try {
      const res = await fetch(`${API_URL}/community/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ post_type: postType, post_id: postId })
      });
      if (res.ok) fetchFeed();
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
    if (!token) return (window as any).showToast("Bạn cần đăng nhập để lưu từ vựng! 🍵", "info");
    if (savingWords.has(vocab.word)) return;

    const isDuplicate = savedWordsSet.has(vocab.word.toLowerCase());
    if (isDuplicate) {
      return (window as any).showToast(`Từ vựng "${vocab.word}" đã có sẵn trong kho! 🍵`, "info");
    }

    setSavingWords(prev => {
      const next = new Set(prev);
      next.add(vocab.word);
      return next;
    });

    try {
      if (onAddVocab) {
        const result = await onAddVocab({
          word: vocab.word,
          meaning: vocab.meaning,
          phonetic: vocab.phonetic,
          image_url: vocab.image_url,
          example: vocab.example,
          synonyms: vocab.synonyms,
          memory_hook: vocab.memory_hook,
          source: "Oasis Community",
          creator_username: vocab.username,
          is_global: false
        });
        if (result && result.status === "duplicate") {
          (window as any).showToast(`Từ vựng "${vocab.word}" đã có sẵn trong kho! 🍵`, "info");
        }
      } else {
        const res = await fetch(`${API_URL}/vocabulary`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({
            word: vocab.word,
            meaning: vocab.meaning,
            phonetic: vocab.phonetic,
            image_url: vocab.image_url,
            example: vocab.example,
            synonyms: vocab.synonyms,
            memory_hook: vocab.memory_hook,
            source: "Oasis Community",
            creator_username: vocab.username,
            is_global: false
          })
        });
        if (res.ok) {
          const newVocab = await res.json();
          if (typeof window !== "undefined") {
            const syncMsg = {
              type: "OASIS_VOCAB_UPDATED",
              action: "ADD",
              vocab: newVocab,
              token: token,
              origin: window.location.origin
            };
            window.postMessage(syncMsg, "*");
            window.dispatchEvent(new CustomEvent("oasis_extension_sync", { detail: syncMsg }));
          }
          (window as any).showToast(`Đã lưu "${vocab.word}" vào kho từ! 🍵`, "success");
        } else if (res.status === 409) {
          (window as any).showToast(`Từ vựng "${vocab.word}" đã có sẵn trong kho! 🍵`, "info");
        }
      }
    } catch (e) {
      console.error(e);
      (window as any).showToast("Lỗi kết nối! 🍵", "error");
    } finally {
      setSavingWords(prev => {
        const next = new Set(prev);
        next.delete(vocab.word);
        return next;
      });
    }
  };

  const playOxfordAudio = (word: string, audioUrl: string) => {
    if (!audioUrl) return;
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setPlayingAudioWord(word);
      audio.onended = () => setPlayingAudioWord(null);
      audio.onerror = () => setPlayingAudioWord(null);
      audio.play().catch(() => setPlayingAudioWord(null));
    } catch (e) {
      setPlayingAudioWord(null);
    }
  };

  const handleSaveCuratedToVault = async (item: any) => {
    const token = localStorage.getItem("oasis_token");
    if (!token) return (window as any).showToast("Bạn cần đăng nhập để lưu từ vựng! 🍵", "info");
    if (savingWords.has(item.word)) return;

    const isDuplicate = savedWordsSet.has(item.word.toLowerCase());
    if (isDuplicate) {
      return (window as any).showToast(`Từ vựng "${item.word}" đã có sẵn trong Tủ từ! 🍵`, "info");
    }

    setSavingWords(prev => {
      const next = new Set(prev);
      next.add(item.word);
      return next;
    });

    try {
      if (onAddVocab) {
        const result = await onAddVocab({
          word: item.word,
          phonetic: item.phonetic,
          meaning: item.meaning,
          example: item.example,
          topic: item.topic || `Oxford ${item.level}`,
          audio_url: item.audio_url,
          synonyms: item.synonyms || [],
          source: "Kho từ vựng Oxford 5000",
          creator_username: currentUser?.username || "Oxford 5000",
          memory_hook: item.memory_hook || `Ghi nhớ từ ${item.word}: ${item.meaning}`,
          is_global: false
        });
        if (result && result.status === "duplicate") {
          (window as any).showToast(`Từ vựng "${item.word}" đã có sẵn trong Tủ từ! 🍵`, "info");
        } else {
          (window as any).showToast(`Đã thêm từ "${item.word}" (${item.level}) vào Tủ từ thành công! 🍵`, "success");
        }
      } else {
        const res = await fetch(`${API_URL}/community/curated-vocab/save-to-lab`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ word: item.word, topic: `Oxford ${item.level}` })
        });
        const resData = await res.json();
        if (res.ok) {
          if (resData.vocab && typeof window !== "undefined") {
            const syncMsg = {
              type: "OASIS_VOCAB_UPDATED",
              action: "ADD",
              vocab: resData.vocab,
              token: token,
              origin: window.location.origin
            };
            window.postMessage(syncMsg, "*");
            window.dispatchEvent(new CustomEvent("oasis_extension_sync", { detail: syncMsg }));
          }
          (window as any).showToast(resData.message || "Đã lưu thành công! 🍵", "success");
        } else {
          (window as any).showToast(resData.detail || "Không thể lưu từ vựng", "error");
        }
      }
    } catch (err) {
      console.error(err);
      (window as any).showToast("Lỗi kết nối khi lưu từ vựng.", "error");
    } finally {
      setSavingWords(prev => {
        const next = new Set(prev);
        next.delete(item.word);
        return next;
      });
    }
  };

  const handleDeleteWriting = async (writingId: number) => {
    (window as any).showConfirm("Bạn có chắc chắn muốn xóa bài viết này khỏi Oasis Community? 🍵", async () => {
      const token = localStorage.getItem("oasis_token");
      if (!token) return (window as any).showToast("Bạn cần đăng nhập! 🍵", "info");
      try {
        const res = await fetch(`${API_URL}/community/writing/${writingId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          (window as any).showToast("Đã xóa bài viết thành công! 🍵", "success");
          fetchFeed();
        } else {
          const errData = await res.json();
          (window as any).showToast("Lỗi: " + (errData.detail || "Không thể xóa bài viết"), "error");
        }
      } catch (e) {
        console.error(e);
        (window as any).showToast("Lỗi kết nối.", "error");
      }
    }, "Xác nhận xóa");
  };

  const handleDeleteVocab = async (vocabId: number) => {
    (window as any).showConfirm("Bạn có chắc chắn muốn xóa bài từ vựng này khỏi Oasis Community? 🍵", async () => {
      const token = localStorage.getItem("oasis_token");
      if (!token) return (window as any).showToast("Bạn cần đăng nhập! 🍵", "info");
      try {
        const res = await fetch(`${API_URL}/community/vocab/${vocabId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          (window as any).showToast("Đã xóa từ vựng khỏi Community! 🍵", "success");
          fetchFeed();
        } else {
          const errData = await res.json();
          (window as any).showToast("Lỗi: " + (errData.detail || "Không thể xóa bài viết này"), "error");
        }
      } catch (e) {
        console.error(e);
        (window as any).showToast("Lỗi kết nối.", "error");
      }
    }, "Xác nhận xóa");
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !activeComments) return;
    const token = localStorage.getItem("oasis_token");
    if (!token) return (window as any).showToast("Bạn cần đăng nhập để bình luận! 🍵", "info");
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
        fetchFeed();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConvertToLesson = async (writingId: number, fullContent: string) => {
    setConvertingId(writingId);
    setSelectedWritingContent(fullContent);
    setLesson(null);
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

  // Paginated items
  const activeItems = activeTab === 'writings' ? (data.writings || []) : (data.vocabularies || []);
  const totalPages = Math.max(1, Math.ceil(activeItems.length / PAGE_SIZE));
  const displayedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return activeItems.slice(start, start + PAGE_SIZE);
  }, [activeItems, page]);

  return (
    <section className="xl:col-span-12 bg-white/95 backdrop-blur-md border border-primary/20 rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm flex flex-col gap-5">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col gap-4 border-b border-primary/10 pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-black text-accent flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-2xl sm:text-3xl">public</span>
              Oasis Community
            </h2>
            <p className="text-xs text-accent/60 mt-0.5">
              {activeTab === 'oxford' 
                ? '5.000 Năm Tu Luyện Khí Công Từ Vựng Mát Chá & IELTS' 
                : 'Kho bài viết & từ vựng chia sẻ bởi cộng đồng người học'}
            </p>
          </div>

          {/* Quick Segment Tab (Essays vs Vocab vs Oxford) */}
          <div className="flex bg-[#F4F1EA] p-1 rounded-2xl border border-primary/15 self-stretch sm:self-auto justify-center flex-wrap gap-1">
            <button 
              type="button" 
              onClick={() => { setActiveTab('writings'); setPage(1); }}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'writings' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-accent/70 hover:text-accent'
              }`}
            >
              <span className="material-symbols-rounded text-sm">article</span>
              Bài viết ({data.writings?.length || 0})
            </button>
            <button 
              type="button" 
              onClick={() => { setActiveTab('vocabularies'); setPage(1); }}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'vocabularies' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-accent/70 hover:text-accent'
              }`}
            >
              <span className="material-symbols-rounded text-sm">group</span>
              Cộng đồng ({data.vocabularies?.length || 0})
            </button>
            <button 
              type="button" 
              onClick={() => { setActiveTab('oxford'); setOxfordPage(1); }}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'oxford' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-accent/70 hover:text-accent'
              }`}
            >
              <span className="material-symbols-rounded text-sm">school</span>
              Kho Trà Mát Chá
            </button>
          </div>
        </div>

        {/* Compact Filters & Real-time Search */}
        <div className="flex flex-wrap items-center gap-2.5 justify-between">
          {/* Search Field */}
          <div className="relative flex-1 min-w-[200px] flex items-center bg-[#F9F8F5] border border-primary/20 rounded-xl px-3 py-1.5 shadow-inner focus-within:border-primary transition-colors">
            <span className="material-symbols-rounded text-primary text-base mr-2 select-none">search</span>
            <input
              type="text"
              placeholder={
                activeTab === 'writings' 
                  ? 'Tìm bài viết, tác giả...' 
                  : activeTab === 'vocabularies'
                  ? 'Tìm từ vựng cộng đồng, định nghĩa...'
                  : 'Tra cứu từ vựng Oxford (e.g. abandon, ability, academic)...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-accent text-xs font-semibold placeholder-accent/40 border-none outline-none w-full"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery("")} 
                className="text-accent/40 hover:text-accent p-0.5"
              >
                <span className="material-symbols-rounded text-xs">close</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === 'oxford' ? (
              <div className="bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                <span className="material-symbols-rounded text-sm">school</span>
                <span>{oxfordData.total ? oxfordData.total.toLocaleString() : '5,946'} từ Oxford</span>
              </div>
            ) : (
              <>
                {currentUser && (
                  <button
                    type="button"
                    onClick={() => setShowOnlyMine(prev => !prev)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${
                      showOnlyMine 
                        ? 'bg-primary border-primary text-white shadow-sm' 
                        : 'bg-[#F9F8F5] border-primary/20 text-accent/70 hover:bg-white'
                    }`}
                  >
                    <span className="material-symbols-rounded text-xs">person</span>
                    Của tôi
                  </button>
                )}

                <select 
                  className="bg-[#F9F8F5] border border-primary/20 text-accent text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="new">Mới nhất</option>
                  <option value="hot">Nổi bật</option>
                  <option value="top">Điểm cao</option>
                </select>
              </>
            )}
          </div>
        </div>

        {/* Topic Filter for Community Vocabularies */}
        {activeTab === 'vocabularies' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {['All', 'Environment', 'Tech', 'Health', 'Education', 'Economy'].map((topic) => {
              const topicLabels: Record<string, string> = {
                'All': 'Tất cả',
                'Environment': 'Môi trường',
                'Tech': 'Công nghệ',
                'Health': 'Sức khỏe',
                'Education': 'Giáo dục',
                'Economy': 'Kinh tế'
              };
              return (
                <button
                  type="button"
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all border whitespace-nowrap ${
                    selectedTopic === topic 
                      ? 'bg-primary border-primary text-white shadow-xs' 
                      : 'bg-[#F9F8F5] border-primary/15 text-accent/65 hover:text-accent hover:bg-white'
                  }`}
                >
                  {topicLabels[topic] || topic}
                </button>
              );
            })}
          </div>
        )}

        {/* CEFR Level Filter for Oxford 5000 */}
        {activeTab === 'oxford' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {[
              { id: 'All', label: 'Tất cả (5,946)', activeCls: 'bg-primary border-primary text-white shadow-xs' },
              { id: 'A1', label: 'A1 Căn bản', activeCls: 'bg-emerald-600 border-emerald-600 text-white shadow-xs' },
              { id: 'A2', label: 'A2 Sơ cấp', activeCls: 'bg-teal-600 border-teal-600 text-white shadow-xs' },
              { id: 'B1', label: 'B1 Trung cấp', activeCls: 'bg-blue-600 border-blue-600 text-white shadow-xs' },
              { id: 'B2', label: 'B2 Học thuật', activeCls: 'bg-indigo-600 border-indigo-600 text-white shadow-xs' },
              { id: 'C1', label: 'C1 Chuyên sâu', activeCls: 'bg-rose-600 border-rose-600 text-white shadow-xs' }
            ].map((lvl) => (
              <button
                type="button"
                key={lvl.id}
                onClick={() => { setOxfordLevel(lvl.id); setOxfordPage(1); }}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all border whitespace-nowrap ${
                  oxfordLevel === lvl.id 
                    ? lvl.activeCls 
                    : 'bg-[#F9F8F5] border-primary/15 text-accent/65 hover:text-accent hover:bg-white'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Feed */}
      {activeTab === 'oxford' ? (
        oxfordLoading ? (
          <div className="py-16 text-center text-primary font-bold animate-pulse">
            Đang nạp kho từ vựng chuẩn Oxford 5000 CEFR... 🍵
          </div>
        ) : oxfordData.items.length === 0 ? (
          <div className="py-16 text-center bg-[#F9F8F5] rounded-2xl border border-primary/10">
            <span className="material-symbols-rounded text-accent/30 text-4xl mb-2">school</span>
            <p className="text-xs text-accent/60 font-semibold">Không tìm thấy từ vựng Oxford nào phù hợp</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Oxford Vocabularies Grid (Compact 4-column responsive) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {oxfordData.items.map((item: any, idx: number) => {
                const isSaved = savedWordsSet.has(item.word.toLowerCase());
                const isSaving = savingWords.has(item.word);
                const isPlaying = playingAudioWord === item.word;

                return (
                  <div 
                    key={`${item.word}-${item.level}-${idx}`}
                    className="bg-[#FFFDF8] border border-primary/15 hover:border-primary/35 hover:shadow-md p-3.5 rounded-2xl flex flex-col justify-between gap-2.5 shadow-xs transition-all group"
                  >
                    {/* Card Header: Level Badge, POS, Audio */}
                    <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase ${LEVEL_BADGE_STYLES[item.level] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                          {item.level}
                        </span>
                        <span className="text-[10px] font-semibold text-accent/50 italic">
                          {item.type}
                        </span>
                      </div>

                      {item.audio_url && (
                        <button
                          type="button"
                          onClick={() => playOxfordAudio(item.word, item.audio_url)}
                          title="Nghe phát âm chuẩn Oxford"
                          className={`p-1 rounded-full transition-colors ${
                            isPlaying 
                              ? 'bg-primary text-white animate-pulse' 
                              : 'text-primary/70 hover:text-primary hover:bg-primary/10'
                          }`}
                        >
                          <span className="material-symbols-rounded text-base">
                            {isPlaying ? 'volume_up' : 'volume_down'}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Card Body: Word, IPA, Meaning, Example */}
                    <div className="flex flex-col gap-1.5 my-0.5">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h4 className="font-display font-extrabold text-primary text-base leading-tight break-words group-hover:text-primary/90">
                          {item.word}
                        </h4>
                        {item.phonetic && (
                          <span className="text-[11px] text-accent/40 font-mono">
                            {item.phonetic}
                          </span>
                        )}
                      </div>

                      <div className="px-2.5 py-1 bg-[#F0F6EB] text-accent font-bold text-xs rounded-xl border border-primary/15 line-clamp-2">
                        {item.meaning}
                      </div>

                      {item.example && (
                        <p className="text-[11px] text-accent/65 italic line-clamp-2 mt-0.5 leading-snug">
                          "{item.example}"
                        </p>
                      )}
                    </div>

                    {/* Card Footer: Topic & Save to Vault Button */}
                    <div className="flex items-center justify-between pt-2 border-t border-primary/10 gap-1 mt-auto">
                      <span className="text-[10px] font-medium text-accent/40 truncate max-w-[120px]">
                        {item.topic || `IELTS ${item.level}`}
                      </span>

                      <button
                        type="button"
                        onClick={() => !isSaved && !isSaving && handleSaveCuratedToVault(item)}
                        disabled={isSaved || isSaving}
                        className={`flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                          isSaved 
                            ? 'bg-green-100 text-green-700 border border-green-200 cursor-default' 
                            : isSaving
                            ? 'bg-primary/10 text-primary animate-pulse'
                            : 'bg-primary text-white hover:bg-primary/90 shadow-xs hover:scale-[1.02] active:scale-95'
                        }`}
                      >
                        <span className="material-symbols-rounded text-[13px]">
                          {isSaved ? 'check' : isSaving ? 'sync' : 'bookmark_add'}
                        </span>
                        <span>{isSaved ? 'Đã lưu' : isSaving ? 'Đang lưu...' : 'Lưu vào tủ'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Oxford Pagination */}
            {oxfordData.total_pages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-3 border-t border-primary/10">
                <button
                  type="button"
                  onClick={() => setOxfordPage(p => Math.max(1, p - 1))}
                  disabled={oxfordPage === 1}
                  className="px-3 py-1 rounded-xl text-xs font-bold border border-primary/15 text-accent/70 hover:bg-primary/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  ← Trước
                </button>
                <span className="text-xs font-bold text-accent/70 px-2">
                  Trang {oxfordPage} / {oxfordData.total_pages} ({oxfordData.total} từ)
                </span>
                <button
                  type="button"
                  onClick={() => setOxfordPage(p => Math.min(oxfordData.total_pages, p + 1))}
                  disabled={oxfordPage === oxfordData.total_pages}
                  className="px-3 py-1 rounded-xl text-xs font-bold border border-primary/15 text-accent/70 hover:bg-primary/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  Sau →
                </button>
              </div>
            )}
          </div>
        )
      ) : loading ? (
        <div className="py-16 text-center text-primary font-bold animate-pulse">
          Đang tải dữ liệu cộng đồng... 🍵
        </div>
      ) : activeItems.length === 0 ? (
        <div className="py-16 text-center bg-[#F9F8F5] rounded-2xl border border-primary/10">
          <span className="material-symbols-rounded text-accent/30 text-4xl mb-2">find_in_page</span>
          <p className="text-xs text-accent/60 font-semibold">Không tìm thấy bài viết hoặc từ vựng phù hợp</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Writings Grid (Compact 1 col mobile, 2 cols desktop) */}
          {activeTab === 'writings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {displayedItems.map((w: any) => (
                <div 
                  key={w.id} 
                  className="bg-[#FAFCF8] border border-primary/15 hover:border-primary/30 p-4 rounded-2xl shadow-xs transition-all flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-primary/10 pb-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <img 
                          src={w.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                          alt={`${w.username}'s avatar`} 
                          className="w-6 h-6 rounded-full border border-primary/20 object-cover" 
                        />
                        <span className="text-xs font-bold text-accent">{w.username}</span>
                      </div>
                      <span className="bg-primary/10 text-primary text-[11px] font-extrabold px-2 py-0.5 rounded-lg border border-primary/20">
                        Band {w.band_score}
                      </span>
                    </div>

                    <p className={`text-xs text-accent/85 leading-relaxed italic ${expandedWritings[w.id] ? '' : 'line-clamp-2'}`}>
                      "{w.full_content || w.content}"
                    </p>
                    {(w.full_content || w.content).length > 140 && (
                      <button
                        type="button"
                        onClick={() => setExpandedWritings(prev => ({ ...prev, [w.id]: !prev[w.id] }))}
                        className="text-primary text-[10px] font-bold mt-1 hover:underline inline-block"
                      >
                        {expandedWritings[w.id] ? "Thu gọn ⌃" : "Xem thêm ⌄"}
                      </button>
                    )}
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-primary/10 text-xs">
                    <div className="flex items-center gap-3 text-accent/65 font-bold text-[11px]">
                      <button 
                        type="button" 
                        onClick={() => handleLike('writing', w.id)} 
                        className="flex items-center gap-1 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-rounded text-[15px]">favorite</span>
                        <span>{w.likes || 0}</span>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleShowComments('writing', w.id)} 
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-rounded text-[15px]">chat_bubble</span>
                        <span>{w.comments || 0}</span>
                      </button>
                      {currentUser && currentUser.user_id === w.user_id && (
                        <button 
                          type="button" 
                          onClick={() => handleDeleteWriting(w.id)} 
                          className="text-red-500 hover:text-red-700 transition-colors text-[10px]"
                        >
                          Xóa
                        </button>
                      )}
                    </div>

                    <button 
                      type="button" 
                      onClick={() => handleConvertToLesson(w.id, w.full_content || w.content)}
                      disabled={convertingId === w.id}
                      className="bg-primary text-white text-[11px] font-bold px-3 py-1 rounded-xl flex items-center gap-1 hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
                    >
                      {convertingId === w.id ? (
                        <><span className="material-symbols-rounded animate-spin text-[13px]">sync</span> Đang tạo...</>
                      ) : (
                        <><span className="material-symbols-rounded text-[13px]">auto_stories</span> Học bài này</>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vocabularies Grid (Compact cards: 1 col on mobile, 2 sm, 3 lg, 4 xl) */}
          {activeTab === 'vocabularies' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {displayedItems.map((v: any) => {
                const isSaved = savedWordsSet.has(v.word.toLowerCase());
                const isSaving = savingWords.has(v.word);

                return (
                  <div 
                    key={v.id} 
                    className="bg-[#FFFDF8] border border-primary/15 hover:border-primary/30 p-3 rounded-2xl flex flex-col justify-between gap-2 shadow-xs transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-primary/10 pb-1.5">
                      <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                        <img 
                          src={v.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                          alt={`${v.username}'s avatar`} 
                          className="w-4 h-4 rounded-full border border-primary/20 object-cover flex-shrink-0" 
                        />
                        <span className="text-[10px] font-bold text-accent/60 truncate">{v.username}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-accent/50 font-bold">
                        <button type="button" onClick={() => handleLike('vocabulary', v.id)} className="flex items-center gap-0.5 hover:text-red-500">
                          <span className="material-symbols-rounded text-[13px]">favorite</span> {v.likes || 0}
                        </button>
                        <button type="button" onClick={() => handleShowComments('vocabulary', v.id)} className="flex items-center gap-0.5 hover:text-primary ml-1">
                          <span className="material-symbols-rounded text-[13px]">chat_bubble</span> {v.comments || 0}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col items-center text-center my-0.5">
                      <h4 className="font-display font-extrabold text-primary text-base leading-tight break-words">{v.word}</h4>
                      {v.phonetic && <p className="text-[10px] text-accent/40 font-mono italic mt-0.5">{v.phonetic}</p>}
                      <div className="mt-1.5 px-2.5 py-0.5 bg-[#F0F6EB] text-accent font-bold text-[11px] rounded-lg border border-primary/10 max-w-full truncate">
                        {v.meaning}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-primary/10 gap-1">
                      {currentUser && (currentUser.user_id === v.user_id || (currentUser.username && v.username === currentUser.username)) ? (
                        <button 
                          type="button" 
                          onClick={() => handleDeleteVocab(v.id)} 
                          className="text-[10px] font-bold text-red-500 hover:text-red-700"
                        >
                          Xóa
                        </button>
                      ) : <span />}

                      <button 
                        type="button" 
                        onClick={() => !isSaved && !isSaving && handleSaveToVault(v)} 
                        disabled={isSaved || isSaving}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all ${
                          isSaved 
                            ? 'bg-green-100 text-green-700 cursor-default' 
                            : isSaving
                            ? 'bg-primary/10 text-primary animate-pulse'
                            : 'bg-primary text-white hover:bg-primary/90 shadow-xs'
                        }`}
                      >
                        <span className="material-symbols-rounded text-[12px]">
                          {isSaved ? 'check' : isSaving ? 'sync' : 'bookmark_add'}
                        </span>
                        <span>{isSaved ? 'Đã lưu' : isSaving ? 'Đang lưu...' : 'Lưu'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Minimalist Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-3 border-t border-primary/10">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-xl text-xs font-bold border border-primary/15 text-accent/70 hover:bg-primary/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                ← Trước
              </button>
              <span className="text-xs font-bold text-accent/70 px-2">
                Trang {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded-xl text-xs font-bold border border-primary/15 text-accent/70 hover:bg-primary/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Interactive Lesson Modal */}
      <AnimatePresence>
        {lesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLesson(null)} className="absolute inset-0 bg-accent/30 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#FFFDF8] w-full max-w-3xl max-h-[85vh] overflow-y-auto custom-scrollbar p-5 sm:p-7 rounded-3xl border border-primary/30 relative z-10 shadow-xl">
              <button type="button" onClick={() => setLesson(null)} className="absolute top-4 right-4 bg-secondary/50 text-accent/60 hover:text-accent p-1.5 rounded-full"><span className="material-symbols-rounded text-lg">close</span></button>
              
              <h3 className="font-display font-black text-xl text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-rounded">auto_awesome</span> AI Interactive Lesson
              </h3>

              {selectedWritingContent && (
                <div className="mb-5 bg-white p-4 rounded-2xl border border-primary/15">
                  <h4 className="text-xs font-bold text-accent mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-rounded text-primary text-base">menu_book</span> Bài đọc (Passage)
                  </h4>
                  <p className="text-xs text-accent leading-relaxed italic whitespace-pre-wrap">"{selectedWritingContent}"</p>
                </div>
              )}

              {/* Study Mode Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    if (onListenPost && selectedWritingContent) {
                      onListenPost(selectedWritingContent);
                      setLesson(null);
                    }
                  }}
                  className="p-4 bg-primary/10 border border-primary/20 hover:border-primary rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition-all group"
                >
                  <span className="material-symbols-rounded text-primary text-3xl group-hover:scale-105 transition-transform">headphones</span>
                  <span className="font-bold text-accent text-xs">Luyện Nghe Radio</span>
                  <span className="text-[10px] text-accent/60">Tải vào Matcha Radio</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onReadPost && selectedWritingContent) {
                      onReadPost(selectedWritingContent);
                      setLesson(null);
                    }
                  }}
                  className="p-4 bg-primary/10 border border-primary/20 hover:border-primary rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition-all group"
                >
                  <span className="material-symbols-rounded text-primary text-3xl group-hover:scale-105 transition-transform">menu_book</span>
                  <span className="font-bold text-accent text-xs">Luyện Đọc Book</span>
                  <span className="text-[10px] text-accent/60">Tải vào Matcha Book</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onSpeakPost && selectedWritingContent) {
                      onSpeakPost(selectedWritingContent);
                      setLesson(null);
                    }
                  }}
                  className="p-4 bg-primary/10 border border-primary/20 hover:border-primary rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition-all group"
                >
                  <span className="material-symbols-rounded text-primary text-3xl group-hover:scale-105 transition-transform">record_voice_over</span>
                  <span className="font-bold text-accent text-xs">Luyện Nói Studio</span>
                  <span className="text-[10px] text-accent/60">Shadowing phát âm</span>
                </button>
              </div>

              {/* Extracted Vocabulary */}
              {lesson.vocabulary && lesson.vocabulary.length > 0 && (
                <div className="bg-white border border-primary/15 rounded-2xl p-4 shadow-xs">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-accent flex items-center gap-1">
                      <span className="material-symbols-rounded text-primary text-base">local_library</span> Từ Vựng Trích Xuất ({lesson.vocabulary.length})
                    </h4>
                    <button
                      type="button"
                      disabled={savingAll}
                      onClick={async () => {
                        const token = localStorage.getItem("oasis_token");
                        if (!token) return (window as any).showToast("Bạn cần đăng nhập để lưu từ vựng! 🍵", "info");
                        setSavingAll(true);
                        let savedCount = 0;
                        for (const v of lesson.vocabulary) {
                          const isAlreadyInVault = vocabList.some((sv: any) => sv.word.toLowerCase() === v.word.toLowerCase());
                          if (isAlreadyInVault) continue;
                          try {
                            if (onAddVocab) {
                              const res = await onAddVocab({
                                word: v.word,
                                meaning: v.meaning,
                                phonetic: v.phonetic,
                                example: v.example,
                                source: "Oasis Lesson",
                                creator_username: "Matcha AI"
                              });
                              if (res && res.success) savedCount++;
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }
                        setSavingAll(false);
                        (window as any).showToast(`Đã lưu ${savedCount} từ vựng vào kho! 🍵`, "success");
                      }}
                      className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {savingAll ? "Đang lưu..." : "Lưu tất cả vào kho"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {lesson.vocabulary.map((v: any, idx: number) => {
                      const isSaved = vocabList.some((sv: any) => sv.word.toLowerCase() === v.word.toLowerCase());
                      return (
                        <div key={idx} className="bg-[#FAF9F5] p-2.5 rounded-xl border border-primary/10 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-primary">{v.word}</span>
                            <span className="text-accent/60 ml-1.5 text-[11px]">{v.meaning}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${isSaved ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}`}>
                            {isSaved ? 'Đã có' : 'Mới'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Comments Modal */}
      <AnimatePresence>
        {activeComments && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveComments(null)} className="absolute inset-0 bg-accent/30 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-md max-h-[75vh] flex flex-col rounded-3xl border border-primary/20 relative z-10 shadow-xl overflow-hidden">
              <div className="p-3.5 border-b border-primary/10 flex justify-between items-center bg-[#F9F8F5]">
                <h3 className="font-bold text-accent text-xs flex items-center gap-1.5">
                  <span className="material-symbols-rounded text-base text-primary">chat_bubble</span>
                  Bình luận
                </h3>
                <button type="button" onClick={() => setActiveComments(null)} className="text-accent/50 hover:text-accent p-1">
                  <span className="material-symbols-rounded text-base">close</span>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {commentsList.length === 0 ? (
                  <p className="text-center text-xs text-accent/40 py-6">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                ) : (
                  commentsList.map((c: any) => (
                    <div key={c.id} className="flex gap-2.5 items-start">
                      <img src={c.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt={`${c.username}'s avatar`} className="w-6 h-6 rounded-full border border-primary/20 object-cover mt-0.5" />
                      <div className="bg-[#F6F5F0] px-3 py-2 rounded-2xl rounded-tl-none border border-primary/5 flex-1">
                        <p className="text-[10px] font-black text-primary mb-0.5">{c.username}</p>
                        <p className="text-xs text-accent/85 leading-normal">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-primary/10 bg-[#F9F8F5] flex gap-2">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                  placeholder="Viết bình luận..."
                  className="flex-1 bg-white border border-primary/20 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
                <button 
                  type="button" 
                  onClick={handlePostComment} 
                  className="bg-primary text-white w-7 h-7 rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors"
                >
                  <span className="material-symbols-rounded text-xs">send</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
