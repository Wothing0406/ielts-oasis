"use client";

import { useState, useEffect } from "react";
import DailyPlanner from "@/components/DailyPlanner";
import VocabularyLab from "@/components/VocabularyLab";
import MatchaLens from "@/components/MatchaLens";
import WritingSanctuary from "@/components/WritingSanctuary";
import CommunityFeed from "@/components/CommunityFeed";
import MatchaBook from "@/components/MatchaBook";
import MatchaRadio from "@/components/MatchaRadio";
import VocabularyQuiz from "@/components/VocabularyQuiz";
import MatchaNotification, { ToastData, ModalData } from "@/components/MatchaNotification";

const API_URL = "/api";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [vocabList, setVocabList] = useState<any[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [guestName, setGuestName] = useState("");
  const [isGuestLoggingIn, setIsGuestLoggingIn] = useState(false);
  
  // Custom Toast/Modal state
  const [toast, setToast] = useState<ToastData | null>(null);
  const [modal, setModal] = useState<ModalData | null>(null);

  // States for Daily Plan interaction
  const [activeWritingPrompt, setActiveWritingPrompt] = useState("");
  const [activeReadingContext, setActiveReadingContext] = useState("");
  const [activeListeningContext, setActiveListeningContext] = useState("");

  const [dueCountFromApi, setDueCountFromApi] = useState(0);

  useEffect(() => {
    (window as any).showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      setToast({ message, type });
    };
    (window as any).showAlert = (message: string, title: string = "Thông báo", type: 'success' | 'error' | 'warning' = 'success') => {
      setModal({ title, message, type, onConfirm: () => setModal(null) });
    };
    (window as any).showConfirm = (message: string, onConfirm: () => void, title: string = "Xác nhận") => {
      setModal({
        title,
        message,
        type: 'confirm',
        confirmText: 'Đồng ý',
        cancelText: 'Hủy',
        onConfirm: () => {
          onConfirm();
          setModal(null);
        },
        onCancel: () => setModal(null)
      });
    };
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);


  const dueCount = dueCountFromApi || vocabList.length;

  const fetchNotifications = async () => {
    const token = localStorage.getItem("oasis_token");
    const headers: any = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    try {
      const res = await fetch(`${API_URL}/notifications`, { headers });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setDueCountFromApi(data.due_count || 0);
      }
    } catch (e) {
      console.error("Fetch notifications failed:", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [user]);

  const displayNotifications = [...notifications];
  if (dueCount > 0 && !displayNotifications.some(n => n.id === 'due-vocab')) {
    displayNotifications.unshift({
      id: "due-vocab",
      icon: "eco",
      color: "text-green-500 bg-green-50",
      title: "Nhắc nhở ôn tập",
      content: `Cậu ơi ơi, có ${dueCount} từ vựng đang bị "bỏ rơi" rồi. Ôn tập một chút cho mau thuộc nhé! 🍵`,
      time: "Bây giờ"
    });
  }

  const fetchVocabs = async (tokenStr: string) => {
    try {
      const res = await fetch(`${API_URL}/vocabulary`, {
        headers: { Authorization: `Bearer ${tokenStr}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVocabList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("oasis_user");
    const savedToken = localStorage.getItem("oasis_token");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
    }
    if (savedToken) {
      fetchVocabs(savedToken);
    } else {
      fetch(`${API_URL}/vocabulary`).then(res => res.json()).then(setVocabList).catch(console.error);
    }
  }, []);

  const handleAddVocab = async (formData: any) => {
    // 1. Prevent client-side duplicate before sending API call
    const isDuplicate = vocabList.some(v => v.word.toLowerCase() === formData.word.toLowerCase());
    if (isDuplicate) {
      return { success: false, status: "duplicate", word: formData.word };
    }

    const token = localStorage.getItem("oasis_token");
    if (!token) {
      (window as any).showToast("Bạn cần đăng nhập để lưu từ vựng! 🍵", "info");
      return { success: false, status: "unauthorized", word: formData.word };
    }
    const headers: any = { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
    
    try {
      const res = await fetch(`${API_URL}/vocabulary`, {
        method: "POST",
        headers,
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const newVocab = await res.json();
        setVocabList(prev => {
          if (prev.some(v => v.word.toLowerCase() === newVocab.word.toLowerCase())) return prev;
          return [newVocab, ...prev];
        });
        return { success: true, word: formData.word };
      } else if (res.status === 409) {
        return { success: false, status: "duplicate", word: formData.word };
      }
    } catch (e) {
      console.error(e);
    }
    return { success: false, status: "error", word: formData.word };
  };

  const handleDeleteVocab = async (id: number) => {
    const token = localStorage.getItem("oasis_token");
    const headers: any = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    
    try {
      const res = await fetch(`${API_URL}/vocabulary/${id}`, {
        method: "DELETE",
        headers
      });
      if (res.ok) {
        setVocabList(prev => prev.filter(v => v.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateTopic = async (topic: string) => {
    console.log("Generate topic:", topic);
  };

  const handleStartQuiz = () => {
    if (vocabList.length < 4) {
      (window as any).showAlert("Oops! Trạm nạp năng lượng cần ít nhất 4 từ vựng để pha chế. Thêm từ đi bạn ơi! 🍵", "Thiếu nguyên liệu rồi!", "warning");
      return;
    }
    setShowQuiz(true);
  };

  const handleReview = async (id: number, isCorrect: boolean) => {
    const token = localStorage.getItem("oasis_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/vocabulary/review/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ is_correct: isCorrect })
      });
      if (res.ok) {
        // Refresh local vocabulary list to reflect new next_review / mastery_level states
        fetchVocabs(token);
      }
    } catch (e) {
      console.error("Failed to submit SRS review:", e);
    }
  };

  const handleLogin = () => {
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
    fetch(`${API_URL}/auth/discord/login?redirect_uri=${redirectUri}`)
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          window.location.href = data.url;
        }
      })
      .catch(err => console.error("Login err:", err));
  };

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || isGuestLoggingIn) return;
    setIsGuestLoggingIn(true);
    
    const savedGuestId = localStorage.getItem("oasis_guest_id");
    try {
      const res = await fetch(`${API_URL}/auth/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: guestName.trim(),
          guest_id: savedGuestId || undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("oasis_token", data.token);
        localStorage.setItem("oasis_user", JSON.stringify(data.user));
        localStorage.setItem("oasis_guest_id", data.guest_id);
        setUser(data.user);
        fetchVocabs(data.token);
        (window as any).showToast("Chào mừng bạn đến với IELTS Oasis! 🍵", "success");
      } else {
        (window as any).showToast("Không thể đăng nhập tài khoản Khách. 🍵", "error");
      }
    } catch (err) {
      console.error(err);
      (window as any).showToast("Lỗi kết nối máy chủ. 🍵", "error");
    } finally {
      setIsGuestLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("oasis_token");
    localStorage.removeItem("oasis_user");
    localStorage.removeItem("oasis_guest_id");
    setUser(null);
    window.location.reload();
  };

  const handleSelectListening = (text: string) => {
    setActiveListeningContext(text);
    const el = document.getElementById("matcha-radio");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSelectReading = (text: string) => {
    setActiveReadingContext(text);
    const el = document.getElementById("matcha-book");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex h-screen p-4 lg:p-6 gap-6 max-w-[1600px] mx-auto w-full">
      <main className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-w-0">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 px-2">
          <div>
            <h2 className="text-4xl font-display font-bold">Hello {user ? user.username : 'Cậu nhé'}:3<span className="animate-pulse">🍵</span></h2>
            <p className="text-lg opacity-70">Ready for your daily brew of knowledge?</p>
          </div>
          <div className="flex items-center gap-4">
            {!user ? (
              <div className="flex flex-wrap items-center gap-3 bg-secondary/35 border border-primary/20 p-2.5 rounded-3xl">
                <form onSubmit={handleGuestLogin} className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Nhập tên học nhanh..." 
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="bg-white border border-primary/20 rounded-full px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-primary w-40 font-bold text-accent"
                  />
                  <button 
                    type="submit" 
                    disabled={isGuestLoggingIn}
                    className="bg-primary hover:bg-primary/95 text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm"
                  >
                    Vào Học
                  </button>
                </form>
                <span className="text-xs text-accent/40 font-bold">hoặc</span>
                <button onClick={handleLogin} className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all">
                  Discord
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="avatar" className="w-12 h-12 rounded-full border-2 border-primary" />
                ) : (
                  <div className="w-12 h-12 rounded-full border-2 border-primary bg-secondary/50 flex items-center justify-center font-bold text-primary">
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow transition-all">
                  Logout
                </button>
              </div>
            )}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="bg-primary hover:bg-primary/90 text-white p-4 rounded-full shadow-lg shadow-primary/20 transition-all flex items-center justify-center relative"
              >
                <span className="material-symbols-rounded">notifications</span>
                {displayNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white">
                    {displayNotifications.length}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div 
                  className="fixed left-4 right-4 top-24 md:absolute md:left-auto md:right-0 md:top-auto md:w-80 mt-3 bg-white border-2 border-primary/20 rounded-2xl shadow-2xl p-4 max-h-96 overflow-y-auto z-[9999]"
                  style={{ opacity: 1, backgroundColor: '#ffffff' }}
                >
                  <h4 className="font-bold text-sm text-accent mb-3 flex items-center justify-between">
                    <span>Thông báo mới</span>
                    <button 
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      Đóng
                    </button>
                  </h4>
                  <div className="flex flex-col gap-2">
                    {displayNotifications.map((n) => (
                      <div key={n.id} className="flex gap-3 p-2 hover:bg-secondary/35 rounded-xl border border-transparent hover:border-primary/5 transition-all text-left">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.color}`}>
                          <span className="material-symbols-rounded text-lg">{n.icon}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-black text-accent leading-none">{n.title}</span>
                          <span className="text-[10px] text-accent/70 leading-relaxed mt-0.5">{n.content}</span>
                          <span className="text-[8px] text-accent/40 mt-1">{n.time}</span>
                        </div>
                      </div>
                    ))}
                    {displayNotifications.length === 0 && (
                      <p className="text-center text-xs text-accent/40 py-6">Không có thông báo mới nào.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6 pb-8">
          
          {/* Gợi ý AI - Lên trên cùng */}
          <section className="xl:col-span-12">
            <DailyPlanner 
              vocabList={vocabList}
              onAddVocab={(vocabData: any) => handleAddVocab(vocabData)}
              onPracticeWriting={(prompt: string) => {
                setActiveWritingPrompt(prompt);
                document.getElementById('writing-sanctuary')?.scrollIntoView({ behavior: 'smooth' });
              }}
              onPracticeReading={(text: string) => {
                setActiveReadingContext(text);
                document.getElementById('matcha-book')?.scrollIntoView({ behavior: 'smooth' });
              }}
              onPracticeListening={(text: string) => {
                setActiveListeningContext(text);
                document.getElementById('matcha-radio')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </section>

          {/* Hàng 2: Vocab Lab và Matcha Lens */}
          <section className="xl:col-span-8 bg-white dark:bg-neutral-900 rounded-large shadow-sm border border-primary/10 bento-card">
            <VocabularyLab 
              vocabList={vocabList}
              onAdd={async (formData: any) => { await handleAddVocab(formData); }}
              onDelete={handleDeleteVocab}
              onGenerateTopic={handleGenerateTopic}
              onStartQuiz={handleStartQuiz}
            />
          </section>
          
          <section className="xl:col-span-4 bg-white dark:bg-neutral-900 rounded-large shadow-sm border border-primary/10 bento-card flex flex-col items-center">
            <MatchaLens onAdd={handleAddVocab} vocabList={vocabList} />
          </section>

          {/* Hàng 3: Reading và Listening Lab */}
          <section id="matcha-book" className="xl:col-span-12">
            <MatchaBook initialReading={activeReadingContext} />
          </section>
          
          <section id="matcha-radio" className="xl:col-span-12">
            <MatchaRadio initialContext={activeListeningContext} />
          </section>

          {/* Hàng 4: Writing Sanctuary */}
          <section id="writing-sanctuary" className="xl:col-span-12">
            <WritingSanctuary 
              initialPrompt={activeWritingPrompt} 
              onListenWriting={handleSelectListening} 
              onReadWriting={handleSelectReading}
            />
          </section>
          
          {/* Hàng 5: Community Feed */}
          <section className="xl:col-span-12">
            <CommunityFeed onAddVocab={handleAddVocab} vocabList={vocabList} onListenPost={handleSelectListening} />
          </section>

        </div>
      </main>

      {showQuiz && (
        <VocabularyQuiz 
          vocabList={vocabList}
          onClose={() => setShowQuiz(false)}
          onReview={handleReview}
        />
      )}

      <MatchaNotification 
        toast={toast} 
        onCloseToast={() => setToast(null)} 
        modal={modal} 
        onCloseModal={() => setModal(null)} 
      />
    </div>
  );
}
