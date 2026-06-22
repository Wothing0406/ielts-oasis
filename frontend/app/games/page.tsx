"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function GamesHubPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("oasis_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
    }
  }, []);

  const games = [
    {
      id: "wordle",
      title: "Wordle Matcha 🍵",
      description: "Thách thức đoán từ vựng IELTS gồm 5 chữ cái cùng gợi ý từ Gemini AI. Vượt qua các cấp độ để ghi danh bảng vàng!",
      icon: "translate",
      color: "bg-[#A7D08C] text-[#5D4037]",
      badge: "Đang mở",
      active: true,
      link: "/games/wordle"
    },
    {
      id: "speak",
      title: "Matcha Speak 🎙️",
      description: "Luyện phát âm chuẩn IELTS Academic cùng Mascot Matcha dễ thương nhận xét khẩu hình và âm điệu của bạn.",
      icon: "record_voice_over",
      color: "bg-neutral-100 text-neutral-400 border-neutral-200",
      badge: "Sắp ra mắt",
      active: false,
      link: "#"
    },
    {
      id: "grammar",
      title: "Grammar Pop 🎈",
      description: "Bắn bóng ngữ pháp tiếng Anh. Trả lời nhanh các câu hỏi ngữ pháp IELTS để ngăn chặn những quả bóng chạm đất.",
      icon: "bubble_chart",
      color: "bg-neutral-100 text-neutral-400 border-neutral-200",
      badge: "Sắp ra mắt",
      active: false,
      link: "#"
    }
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col max-w-7xl mx-auto w-full">
      
      {/* Header */}
      <header className="flex items-center justify-between mb-12 pb-4 border-b border-primary/10">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-accent font-bold hover:text-primary transition-all bg-white border border-primary/20 px-4 py-2 rounded-full shadow-sm active:scale-95 text-xs sm:text-sm cursor-pointer"
        >
          <span className="material-symbols-rounded text-sm sm:text-base">arrow_back</span>
          Về Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <span className="material-symbols-rounded text-primary text-3xl animate-bounce">sports_esports</span>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-extrabold text-accent">Matcha Arcade Hub 🎮</h1>
        </div>
        <div>
          {user ? (
            <div className="bg-secondary/40 border border-primary/20 px-4 py-1.5 rounded-full text-xs font-bold text-accent flex items-center gap-2">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" className="w-5 h-5 rounded-full border border-primary" />
              ) : (
                <span className="material-symbols-rounded text-xs">person</span>
              )}
              {user.username}
            </div>
          ) : (
            <div className="w-10"></div>
          )}
        </div>
      </header>

      {/* Intro section */}
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
        <h2 className="text-3xl sm:text-4xl font-display font-black text-accent leading-tight">
          Học Tiếng Anh Thật Vui Cùng <span className="text-primary text-shadow-sm">Arcade</span>!
        </h2>
        <p className="text-sm sm:text-base text-accent/70 font-medium">
          Chào mừng cậu đến với tổ hợp trò chơi tiếng Anh IELTS Oasis. Hãy tích lũy điểm Matcha Point và nâng cao kỹ năng từ vựng hàng ngày nhé! 🍵
        </p>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto w-full mb-12">
        {games.map((game) => (
          <motion.div
            key={game.id}
            whileHover={game.active ? { y: -8, scale: 1.02 } : {}}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`bg-white border-2 rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between min-h-[320px] relative overflow-hidden ${game.active ? "border-primary/30 shadow-lg shadow-primary/5 cursor-pointer" : "border-neutral-200 opacity-75"}`}
          >
            {/* Background elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-secondary/15 pointer-events-none" />

            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${game.active ? "bg-primary/20 text-primary border border-primary/25" : "bg-neutral-100 text-neutral-400"}`}>
                  <span className="material-symbols-rounded text-2xl">{game.icon}</span>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${game.active ? "bg-primary/25 text-primary" : "bg-neutral-200 text-neutral-500"}`}>
                  {game.badge}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2.5">
                <h3 className="text-lg sm:text-xl font-display font-extrabold text-accent">
                  {game.title}
                </h3>
                <p className="text-xs sm:text-sm text-accent/70 leading-relaxed font-medium">
                  {game.description}
                </p>
              </div>
            </div>

            {/* Play Button */}
            <div className="mt-8">
              {game.active ? (
                <Link 
                  href={game.link}
                  className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-3.5 rounded-2xl shadow-md text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer border border-primary/10"
                >
                  <span className="material-symbols-rounded text-sm sm:text-base">play_arrow</span>
                  Vào Chơi Ngay
                </Link>
              ) : (
                <button 
                  disabled
                  className="w-full bg-neutral-200 text-neutral-400 font-bold py-3.5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed border border-neutral-300"
                >
                  <span className="material-symbols-rounded text-sm sm:text-base">lock</span>
                  Chưa Mở Khóa
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
}
