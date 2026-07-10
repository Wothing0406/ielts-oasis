"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  const [guestPassword, setGuestPassword] = useState("");
  const [isGuestLoggingIn, setIsGuestLoggingIn] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

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
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
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
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
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
      } catch (e) { }
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
    if (!guestName.trim() || !guestPassword || isGuestLoggingIn) return;
    setIsGuestLoggingIn(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: guestName.trim(),
          password: guestPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("oasis_token", data.token);
        localStorage.setItem("oasis_user", JSON.stringify(data.user));
        localStorage.setItem("oasis_guest_id", data.guest_id);
        setUser(data.user);
        fetchVocabs(data.token);
        (window as any).showToast("Đăng nhập thành công! Chào mừng cậu trở lại 🍵", "success");
      } else {
        (window as any).showToast(data.detail || "Đăng nhập thất bại.", "error");
      }
    } catch (err) {
      console.error(err);
      (window as any).showToast("Lỗi kết nối máy chủ. 🍵", "error");
    } finally {
      setIsGuestLoggingIn(false);
    }
  };

  const handleGuestRegister = async () => {
    if (!guestName.trim() || !guestPassword || isGuestLoggingIn) return;
    setIsGuestLoggingIn(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: guestName.trim(),
          password: guestPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        (window as any).showToast("Đăng ký thành công! Hãy nhấn nút Vào Học để bắt đầu nhé 🍵", "success");
      } else {
        (window as any).showToast(data.detail || "Đăng ký thất bại.", "error");
      }
    } catch (err) {
      console.error(err);
      (window as any).showToast("Lỗi kết nối máy chủ. 🍵", "error");
    } finally {
      setIsGuestLoggingIn(false);
    }
  };

  function handleLogout() {
    localStorage.removeItem("oasis_token");
    localStorage.removeItem("oasis_user");
    localStorage.removeItem("oasis_guest_id");
    setUser(null);
    window.location.reload();
  }

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

  if (!user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-tr from-[#9BB095] via-[#C8D6C3] to-[#EAEFE8] p-4 relative overflow-hidden select-none">
        {/* Soft Cozy Floating Leaves */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-[#8F9E8B]/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-[#A7D08C]/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute top-1/4 right-1/4 w-20 h-20 bg-[#6E8269]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-1/3 left-1/5 w-28 h-28 bg-[#E3EAE0]/50 rounded-full blur-xl pointer-events-none" />

        <div className="w-full max-w-md bg-[#FAFBF9]/95 backdrop-blur-xl border-4 border-[#8F9E8B]/40 rounded-[2.5rem] shadow-[0_25px_60px_rgba(46,62,43,0.22)] p-8 relative z-10 flex flex-col items-center">
          {/* Wooden Top Accent Tag */}
          <div className="absolute -top-3.5 bg-[#5D4037] text-[#FAF8F5] px-6 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
            🍵 Oasis Entryway
          </div>

          {/* Logo Brand */}
          <div className="w-18 h-18 bg-gradient-to-br from-[#A7D08C] to-[#6E8269] rounded-3xl flex items-center justify-center mb-4 shadow-[0_8px_25px_rgba(110,130,105,0.4)] transform hover:rotate-12 transition-transform duration-300">
            <span className="text-4xl filter drop-shadow-md">🍵</span>
          </div>
          
          <h1 className="text-3xl font-display font-black text-[#2E3E2B] tracking-tight">IELTS Oasis</h1>
          <p className="text-xs text-[#5D4037] font-extrabold tracking-widest uppercase mb-8 opacity-90">Zen Learning Space</p>

          {/* Form Tabs */}
          <div className="w-full bg-[#E3EAE0] p-1.5 rounded-full flex items-center mb-6 border border-[#8F9E8B]/20">
            <button
              onClick={() => { setAuthMode("login"); }}
              className={`flex-1 text-center py-2.5 rounded-full text-xs font-black transition-all duration-300 ${
                authMode === "login"
                  ? "bg-[#6E8269] text-white shadow-md transform scale-[1.02]"
                  : "text-[#5D6B57] hover:text-[#2E3E2B]"
              }`}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => { setAuthMode("register"); }}
              className={`flex-1 text-center py-2.5 rounded-full text-xs font-black transition-all duration-300 ${
                authMode === "register"
                  ? "bg-[#3E4F39] text-white shadow-md transform scale-[1.02]"
                  : "text-[#5D6B57] hover:text-[#2E3E2B]"
              }`}
            >
              Đăng Ký
            </button>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleGuestLogin} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-[#5D4037] tracking-wider px-2">Tên tài khoản</label>
              <input
                type="text"
                placeholder="Nhập tên tài khoản..."
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="bg-[#F4F7F2] border-2 border-[#8F9E8B]/20 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-[#8F9E8B] focus:bg-white font-bold text-[#2E3E2B] placeholder:font-bold placeholder:text-[#5D6B57]/30 shadow-inner transition-all"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-[#5D4037] tracking-wider px-2">Mật khẩu</label>
              <input
                type="password"
                placeholder="Nhập mật khẩu..."
                value={guestPassword}
                onChange={(e) => setGuestPassword(e.target.value)}
                className="bg-[#F4F7F2] border-2 border-[#8F9E8B]/20 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-[#8F9E8B] focus:bg-white font-bold text-[#2E3E2B] placeholder:font-bold placeholder:text-[#5D6B57]/30 shadow-inner transition-all"
                required
              />
            </div>

            {authMode === "login" ? (
              <button
                type="submit"
                disabled={isGuestLoggingIn}
                className="w-full bg-[#7A9A6A] hover:bg-[#688659] disabled:bg-[#7A9A6A]/50 text-white py-4 rounded-2xl text-xs font-black tracking-wider transition-all shadow-[0_8px_25px_rgba(122,154,106,0.35)] hover:shadow-lg active:scale-[0.97] mt-2"
              >
                {isGuestLoggingIn ? "Đang pha chế..." : "VÀO HỌC NGAY 🍵"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGuestRegister}
                disabled={isGuestLoggingIn}
                className="w-full bg-[#3E4F39] hover:bg-[#2F3D2B] disabled:bg-[#3E4F39]/50 text-white py-4 rounded-2xl text-xs font-black tracking-wider transition-all shadow-[0_8px_25px_rgba(62,79,57,0.35)] hover:shadow-lg active:scale-[0.97] mt-2"
              >
                {isGuestLoggingIn ? "Đang đăng ký..." : "TẠO TÀI KHOẢN MỚI 🍀"}
              </button>
            )}
          </form>

          {/* Validation Rules Scroll Card */}
          <div className="w-full bg-[#F5F2EB] border-l-4 border-[#8F9E8B] rounded-2xl p-4 mt-6 text-[10px] text-[#5D4037] leading-relaxed flex flex-col gap-1 shadow-sm">
            <div className="font-black text-[#2E3E2B] flex items-center gap-1 mb-1">
              <span>📌</span> Quy tắc xác thực:
            </div>
            <div>• <b>Tên tài khoản:</b> 3-20 kí tự, chỉ dùng chữ thường (a-z), số (0-9), gạch dưới (_) và chấm (.)</div>
            <div>• <b>Mật khẩu:</b> Độ dài tối thiểu 6 kí tự để bảo mật bài học.</div>
          </div>

          {/* Divider */}
          <div className="w-full flex items-center my-6 gap-3">
            <div className="flex-1 h-[1px] bg-[#8F9E8B]/25" />
            <span className="text-[9px] font-black text-[#5D4037]/60 uppercase tracking-widest">hoặc bằng</span>
            <div className="flex-1 h-[1px] bg-[#8F9E8B]/25" />
          </div>

          {/* Discord Brand Button */}
          <button
            onClick={handleLogin}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(88,101,242,0.25)] hover:shadow-lg transition-all active:scale-[0.97]"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 127.14 96.36">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,67.8,67.8,0,0,1-10.5-5A52,52,0,0,0,29,79.82a74.37,74.37,0,0,0,69.1,0,52,52,0,0,0,1,0.73,67.8,67.8,0,0,1-10.5,5A77.7,77.7,0,0,0,95.14,96.36a105.73,105.73,0,0,0,31-18.83C129.8,50.12,123.63,27.37,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
            </svg>
            Tài khoản Discord
          </button>
        </div>

        {/* Global Toast Overlay */}
        <MatchaNotification
          toast={toast}
          onCloseToast={() => setToast(null)}
          modal={modal}
          onCloseModal={() => setModal(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen p-4 lg:p-6 gap-6 max-w-[1600px] mx-auto w-full">
      <main className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-w-0">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 px-2">
          <div>
            <h2 className="text-4xl font-display font-bold">Hello {user ? user.username : 'Cậu nhé'}:3<span className="animate-pulse">🍵</span></h2>
            <p className="text-lg opacity-70">Ready for your daily brew of knowledge?</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-primary" />
              ) : (
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-primary bg-secondary/50 flex items-center justify-center font-bold text-primary text-xs sm:text-base">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
              )}
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow transition-all">
                Đăng Xuất
              </button>
            </div>
            <Link
              href="/games"
              className="bg-[#A7D08C] hover:bg-[#93bd7a] text-[#5D4037] hover:text-white px-3 py-2 sm:px-5 sm:py-3.5 rounded-full shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-1.5 sm:gap-2 font-bold text-xs sm:text-sm cursor-pointer flex-shrink-0"
            >
              <span className="material-symbols-rounded text-base sm:text-lg">sports_esports</span>
              Matcha Game
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="bg-primary hover:bg-primary/90 text-white p-2.5 sm:p-4 rounded-full shadow-lg shadow-primary/20 transition-all flex items-center justify-center relative"
              >
                <span className="material-symbols-rounded text-base sm:text-lg">notifications</span>
                {displayNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] sm:text-[10px] w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-bold border-2 border-white">
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
            <CommunityFeed 
              onAddVocab={handleAddVocab} 
              vocabList={vocabList} 
              onListenPost={handleSelectListening} 
              onReadPost={handleSelectReading} 
              onDeleteVocab={handleDeleteVocab}
            />
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
