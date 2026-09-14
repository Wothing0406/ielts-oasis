// components/meowcha/MeowchaLobby.tsx - Streamlined Cultivation Lobby

import React from "react";
import { 
  Play, Sparkles, Trophy, BookOpen, Shield, Flame, Zap, Award, ChevronRight 
} from "lucide-react";
import { Realm, REALMS } from "@/types/meowcha";

interface MeowchaLobbyProps {
  onStartBattle: () => void;
  onOpenLeaderboard?: () => void;
  onOpenSaves?: () => void;
}

export const MeowchaLobby: React.FC<MeowchaLobbyProps> = ({
  onStartBattle,
  onOpenLeaderboard,
  onOpenSaves
}) => {
  return (
    <div className="w-full h-full min-h-[640px] flex flex-col items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-[#050b07] via-[#091a10] to-[#040805] text-[#f9f5e8] select-none overflow-y-auto">
      
      {/* 1. CELESTIAL TITLE & HEADER */}
      <div className="flex flex-col items-center text-center gap-1.5 mt-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-[#0c2417] rounded-full border border-[#ca8a04]/50 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#fbbf24]" />
          <span className="text-[11px] font-mono font-bold text-[#ffdf79] uppercase tracking-wider">
            IELTS Oasis Cultivation Roguelike
          </span>
        </div>

        <h1 className="font-serif font-black text-2xl sm:text-3xl md:text-4xl text-[#ffdf79] tracking-wider drop-shadow-lg mt-1">
          MEOW-CHA: VẠN KIẾM QUY TÔNG
        </h1>
        <p className="text-xs sm:text-sm text-[#a7f3d0] font-serif max-w-lg leading-relaxed">
          Ngự kiếm phi hành, trảm ma thạch dị giới bằng từ vựng chuẩn IELTS Oxford. Càng tu luyện điểm tu vi càng cao, nhân vật tự động đột phá cảnh giới và biến hóa thần thông vô lượng!
        </p>
      </div>

      {/* 2. CULTIVATION PATH (CÁC DẠNG THẦN & TIẾN TRÌNH TỰ ĐỘNG) */}
      <div className="w-full max-w-4xl bg-[#0a1f13]/90 border border-[#1b432a] rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3 my-3 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-[#1b432a] pb-2">
          <span className="font-serif font-bold text-xs sm:text-sm text-[#ffdf79] flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#34d399]" />
            <span>LỘ TRÌNH ĐỘT PHÁ CẢNH GIỚI & BIẾN HÓA DẠNG THẦN</span>
          </span>
          <span className="text-[10px] font-mono text-[#6ee7b7] font-semibold hidden sm:inline">
            Tự động tăng tốc & nâng cấp ma thạch theo điểm tu vi
          </span>
        </div>

        {/* 5 Realms Carousel / Progression Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {REALMS.map((r, idx) => (
            <div
              key={r.name}
              className="bg-[#0d2618] p-3 rounded-xl border border-[#1b432a] flex flex-col items-center text-center gap-2 hover:border-[#fbbf24] transition-all group shadow"
            >
              {/* Realm Avatar */}
              <div 
                className="w-12 h-12 rounded-xl bg-[#050b07] border-2 flex items-center justify-center relative overflow-hidden shadow"
                style={{ borderColor: r.auraColor }}
              >
                <img
                  src={r.sprite}
                  alt={r.name}
                  className="w-9 h-9 object-contain group-hover:scale-110 transition-transform"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="font-serif font-bold text-xs text-[#f9f5e8] group-hover:text-[#ffdf79]">
                  {r.name}
                </span>
                <span className="text-[10px] font-serif text-[#34d399] font-medium">
                  {r.skillName}
                </span>
              </div>

              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#050b07] text-[#98b06f] border border-[#1b432a]">
                {idx === 0 ? "Khởi Đầu" : `≥ ${r.reqScore} pts`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. BIG CALL TO ACTION: START CULTIVATION BATTLE */}
      <div className="flex flex-col items-center gap-3 w-full max-w-sm mb-2">
        <button
          onClick={onStartBattle}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-[#059669] via-[#10b981] to-[#059669] hover:from-[#10b981] hover:to-[#34d399] text-[#f9f5e8] rounded-2xl font-serif font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all shadow-xl hover:shadow-[#10b981]/40 hover:scale-105 active:scale-95 cursor-pointer border border-[#6ee7b7]/60"
        >
          <Play className="w-5 h-5 fill-current text-[#ffdf79]" />
          <span>VÀO TRẬN TU LUYỆN NGAY</span>
        </button>

        <div className="flex items-center gap-4 text-xs font-serif text-[#6ee7b7]">
          <span>Gõ phím để ngự kiếm</span>
          <span>•</span>
          <span>Tự động tăng tốc độ</span>
          <span>•</span>
          <span>Bấm ESC để tạm dừng</span>
        </div>
      </div>

    </div>
  );
};
