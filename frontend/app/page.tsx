"use client";

import { useState, useEffect } from "react";
import DailyPlanner from "@/components/DailyPlanner";
import VocabularyLab from "@/components/VocabularyLab";
import MatchaLens from "@/components/MatchaLens";
import WritingSanctuary from "@/components/WritingSanctuary";
import CommunityFeed from "@/components/CommunityFeed";
import MatchaBook from "@/components/MatchaBook";
import MatchaRadio from "@/components/MatchaRadio";
import MascotMessage from "@/components/MascotMessage";
import VocabularyQuiz from "@/components/VocabularyQuiz";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [vocabList, setVocabList] = useState<any[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // States for Daily Plan interaction
  const [activeWritingPrompt, setActiveWritingPrompt] = useState("");
  const [activeReadingContext, setActiveReadingContext] = useState("");
  const [activeListeningContext, setActiveListeningContext] = useState("");

  const dueCount = vocabList.length;

  useEffect(() => {
    const list = [];
    if (dueCount > 0) {
      list.push({
        id: "due-vocab",
        icon: "eco",
        color: "text-green-500 bg-green-50",
        title: "Nhắc nhở ôn tập",
        content: `Cậu ơi ơi, có ${dueCount} từ vựng đang bị "bỏ rơi" rồi. Ôn tập một chút cho mau thuộc nhé! 🍵`,
        time: "Bây giờ"
      });
    }
    
    list.push({
      id: "like-writing",
      icon: "favorite",
      color: "text-red-500 bg-red-50",
      title: "Minh Thư đã thích bài viết",
      content: `${user ? user.username : "Cậu"} ơi, bài viết Writing Sanctuary của bạn vừa nhận được lượt thích từ Minh Thư.`,
      time: "1 giờ trước"
    });
    
    list.push({
      id: "comment-writing",
      icon: "chat",
      color: "text-blue-500 bg-blue-50",
      title: "Thành Nam đã bình luận",
      content: 'Thành Nam: "Lập luận rất sắc bén! Cố gắng phát huy nhé!"',
      time: "2 giờ trước"
    });

    if (vocabList.length > 0) {
      const sampleWord = vocabList[0].word;
      list.push({
        id: "like-vocab",
        icon: "bookmark",
        color: "text-orange-500 bg-orange-50",
        title: "An Nguyễn đã lưu từ vựng",
        content: `An Nguyễn đã lưu lại từ vựng '${sampleWord}' mà bạn đã đóng góp.`,
        time: "4 giờ trước"
      });
    }

    setNotifications(list);
  }, [vocabList, user, dueCount]);

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
    const token = localStorage.getItem("oasis_token");
    const headers: any = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    
    try {
      const res = await fetch(`${API_URL}/vocabulary`, {
        method: "POST",
        headers,
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const newVocab = await res.json();
        setVocabList(prev => [newVocab, ...prev]);
      }
    } catch (e) {
      console.error(e);
    }
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
      alert("Bạn cần ít nhất 4 từ vựng để bắt đầu ôn tập!");
      return;
    }
    setShowQuiz(true);
  };

  const handleReview = async (id: number, isCorrect: boolean) => {
    console.log(`Reviewed word ${id}: ${isCorrect}`);
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

  const handleLogout = () => {
    localStorage.removeItem("oasis_token");
    localStorage.removeItem("oasis_user");
    setUser(null);
    window.location.reload();
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
              <button onClick={handleLogin} className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg transition-all">
                Login with Discord
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <img src={user.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="avatar" className="w-12 h-12 rounded-full border-2 border-primary" />
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
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white">
                    {notifications.length}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-neutral-900 border border-primary/10 rounded-2xl shadow-xl z-50 p-4 max-h-96 overflow-y-auto">
                  <h4 className="font-bold text-sm text-accent dark:text-white mb-3 flex items-center justify-between">
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
                    {notifications.map((n) => (
                      <div key={n.id} className="flex gap-3 p-2 hover:bg-secondary/35 rounded-xl border border-transparent hover:border-primary/5 transition-all">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.color}`}>
                          <span className="material-symbols-rounded text-lg">{n.icon}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-black text-accent dark:text-white leading-none">{n.title}</span>
                          <span className="text-[10px] text-accent/70 dark:text-white/70 leading-relaxed mt-0.5">{n.content}</span>
                          <span className="text-[8px] text-accent/40 dark:text-white/40 mt-1">{n.time}</span>
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
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
          <section className="xl:col-span-12 bg-white dark:bg-neutral-900 rounded-large shadow-sm border border-primary/10 bento-card">
            <DailyPlanner 
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
              onAdd={handleAddVocab}
              onDelete={handleDeleteVocab}
              onGenerateTopic={handleGenerateTopic}
              onStartQuiz={handleStartQuiz}
            />
          </section>
          
          <section className="xl:col-span-4 bg-white dark:bg-neutral-900 rounded-large shadow-sm border border-primary/10 bento-card flex flex-col items-center">
            <MatchaLens onAdd={handleAddVocab} />
          </section>

          {/* Hàng 3: Reading và Listening Lab */}
          <section id="matcha-book" className="xl:col-span-12 bg-white dark:bg-neutral-900 rounded-large shadow-sm border border-primary/10 bento-card">
            <MatchaBook initialReading={activeReadingContext} />
          </section>
          
          <section id="matcha-radio" className="xl:col-span-12 bg-white dark:bg-neutral-900 rounded-large shadow-sm border border-primary/10 bento-card">
            <MatchaRadio initialContext={activeListeningContext} />
          </section>

          {/* Hàng 4: Writing Sanctuary */}
          <section id="writing-sanctuary" className="xl:col-span-12 bg-white dark:bg-neutral-900 rounded-large shadow-sm border border-primary/10 bento-card">
            <WritingSanctuary initialPrompt={activeWritingPrompt} />
          </section>
          
          {/* Hàng 5: Community Feed */}
          <section className="xl:col-span-12 bg-white dark:bg-neutral-900 rounded-large shadow-sm border border-primary/10 bento-card">
            <CommunityFeed />
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

      {/* Mascot (Fixed Position) */}
      <MascotMessage dueCount={dueCount} />
    </div>
  );
}
