// components/meowcha/MeowchaModals.tsx - React Modal Controllers for Meow-Cha

import React, { useState } from "react";
import { 
  Play, RotateCcw, LogOut, Save, Sparkles, Trophy, Flame, Shield, Zap, Heart, BookOpen 
} from "lucide-react";
import { Talent, REALMS } from "@/types/meowcha";

// =========================================================================
// 1. MODAL: TẠM DỪNG TU TẬP (PAUSE MODAL)
// =========================================================================
interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onSave: () => void;
  onExit: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onSave,
  onExit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#0a1f13] border-2 border-[#ffdf79] rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-center">
        <div>
          <h3 className="font-serif font-bold text-xl text-[#ffdf79] tracking-wider">
            TẠM DỪNG TRẬN CHIẾN
          </h3>
          <p className="text-xs text-[#a09070] mt-1 font-serif">
            Kiếm ý ngưng trệ • Đạo hữu có thể nghỉ ngơi hoặc lưu lại tiến trình tu vi.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-2.5 bg-[#789262] hover:bg-[#8aa970] text-[#f9f5e8] rounded-xl font-bold font-serif text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Tiếp Tục Tu Tập [ESC]</span>
          </button>

          <button
            onClick={onSave}
            className="w-full py-2.5 bg-[#0d2618] hover:bg-[#1b432a] text-[#ffdf79] border border-[#22543d] rounded-xl font-bold font-serif text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Vào Ngọc Giản (SQL)</span>
          </button>

          <button
            onClick={onExit}
            className="w-full py-2.5 bg-[#3b1212] hover:bg-[#501a1a] text-[#fca5a5] border border-[#7f1d1d] rounded-xl font-semibold font-serif text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Dừng Trận & Về Sảnh</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 2. MODAL: XÁC NHẬN THOÁT (EXIT CONFIRM MODAL)
// =========================================================================
interface ExitConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onCancel,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#0a1f13] border-2 border-[#ef4444] rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-center">
        <div>
          <h3 className="font-serif font-bold text-lg text-[#fca5a5]">
            ĐÌNH CHỈ TU TẬP?
          </h3>
          <p className="text-xs text-[#e2e8f0] mt-2 font-serif">
            Đạo hữu có chắc chắn muốn rời trận địa? Mọi ma thạch đang giáng thế sẽ biến mất và dữ liệu chưa lưu sẽ được làm mới sạch sẽ.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onCancel}
            className="py-2 bg-[#0d2618] hover:bg-[#1b432a] text-[#f9f5e8] border border-[#22543d] rounded-xl text-xs font-bold font-serif transition-all cursor-pointer"
          >
            Ở Lại Chiến Đấu
          </button>

          <button
            onClick={onConfirm}
            className="py-2 bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-xl text-xs font-bold font-serif transition-all cursor-pointer shadow"
          >
            Xác Nhận Rời Đi
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 3. MODAL: ĐỘT PHÁ CẢNH GIỚI (3 ROGUELIKE TALENT CARDS)
// =========================================================================
interface BreakthroughModalProps {
  isOpen: boolean;
  nextRealmIdx: number;
  options: Talent[];
  onSelectTalent: (talent: Talent) => void;
}

export const BreakthroughModal: React.FC<BreakthroughModalProps> = ({
  isOpen,
  nextRealmIdx,
  options,
  onSelectTalent
}) => {
  if (!isOpen) return null;
  const realm = REALMS[nextRealmIdx] || REALMS[REALMS.length - 1];

  const getTalentIcon = (iconName: string) => {
    switch (iconName) {
      case "wind": return <Sparkles className="w-5 h-5 text-cyan-400" />;
      case "shield": return <Shield className="w-5 h-5 text-emerald-400" />;
      case "heart": return <Heart className="w-5 h-5 text-rose-400" />;
      case "zap": return <Zap className="w-5 h-5 text-amber-400" />;
      case "book": return <BookOpen className="w-5 h-5 text-blue-400" />;
      default: return <Flame className="w-5 h-5 text-orange-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#0a1f13] border-2 border-[#ffdf79] rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-center">
        
        {/* Header */}
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-mono text-[#98b06f] uppercase tracking-widest font-bold">
            THIÊN ĐẠO CHÚC PHÚC
          </span>
          <h2 className="font-serif font-bold text-2xl text-[#ffdf79] mt-1 tracking-wider">
            ĐỘT PHÁ: {realm.name}
          </h2>
          <p className="text-xs text-[#e2e8f0] mt-1 font-serif">
            Đạo hữu lĩnh ngộ thần thông mới: <span className="text-[#34d399] font-bold">[{realm.skillName}]</span>! Hãy chọn 1 Tiên Thiên Đạo Quả gia trì:
          </p>
        </div>

        {/* 3 Talent Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {options.map((t) => {
            const isMax = t.level >= 3;
            return (
              <div
                key={t.id}
                onClick={() => onSelectTalent(t)}
                className={`p-4 bg-[#0d2618] hover:bg-[#1b432a] border-2 rounded-xl flex flex-col items-center justify-between gap-3 text-center transition-all hover:scale-105 cursor-pointer shadow-lg group relative ${
                  isMax 
                    ? "border-[#f59e0b] shadow-[#f59e0b]/20 hover:border-[#ffdf79]" 
                    : "border-[#22543d] hover:border-[#ffdf79]"
                }`}
              >
                {/* Level Stars Badge */}
                <div className="flex items-center gap-0.5 text-xs text-[#f59e0b]">
                  {Array.from({ length: t.level }).map((_, i) => (
                    <span key={i}>⭐</span>
                  ))}
                  <span className="ml-1 text-[10px] font-mono text-[#98b06f] font-bold">
                    Lv.{t.level}
                  </span>
                </div>

                <div className="w-11 h-11 rounded-full bg-[#0a1f13] border border-[#ffdf79] flex items-center justify-center shadow">
                  {getTalentIcon(t.icon)}
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-serif font-bold text-sm text-[#ffdf79] group-hover:text-white">
                    {t.name}
                  </span>
                  <p className="text-[11px] text-[#e2e8f0] font-serif leading-relaxed">
                    {t.desc}
                  </p>
                </div>

                <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                  isMax 
                    ? "bg-[#451a03] text-[#fde047] border-[#ca8a04]"
                    : "bg-[#050b07] text-[#98b06f] border-[#1b432a]"
                }`}>
                  {isMax ? "ĐỈNH PHONG" : t.rarity}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 4. MODAL: ĐẠO THÂN TAN BIẾN (GAME OVER: TRÙNG SINH HOẶC VỀ SẢNH)
// =========================================================================
interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  wordsSlain: number;
  wpm: number;
  accuracy: number;
  realmName: string;
  onRebirth: () => void;
  onReturnLobby: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  score,
  wordsSlain,
  wpm,
  accuracy,
  realmName,
  onRebirth,
  onReturnLobby
}) => {
  const [playerName, setPlayerName] = useState<string>("Tiểu Miêu Kiếm Sĩ");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmitScore = async () => {
    if (submitted || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/meowcha/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_name: playerName.trim() || "Tiểu Miêu Kiếm Sĩ",
          score,
          words_slain: wordsSlain,
          realm: realmName,
          accuracy,
          wpm
        })
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch (e) {
      console.error("Leaderboard submit error:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0a1f13] border-2 border-[#ca8a04] rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-center">
        
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#f87171] font-bold">
            KHÍ HUYẾT KIỆT QUỆ
          </span>
          <h2 className="font-serif font-bold text-2xl text-[#ef4444] mt-0.5 tracking-wider">
            ĐẠO THÂN TAN BIẾN
          </h2>
          <p className="text-xs text-[#a7f3d0] mt-1 font-serif">
            Ma thạch chấn thương đạo căn • Hãy ghi danh chiến tích vào Bảng Phong Thần!
          </p>
        </div>

        {/* Stats Recap Box */}
        <div className="bg-[#0d2618] p-3 rounded-xl border border-[#1b432a] grid grid-cols-2 gap-2 text-xs">
          <div className="flex flex-col items-center">
            <span className="text-[#6ee7b7] font-mono text-[10px]">CẢNH GIỚI ĐẠT</span>
            <span className="font-serif font-bold text-[#ffdf79] text-sm">{realmName}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[#6ee7b7] font-mono text-[10px]">TU VI TỔNG KẾT</span>
            <span className="font-mono font-bold text-[#34d399] text-sm">{score.toLocaleString()} pts</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[#6ee7b7] font-mono text-[10px]">SỐ TỪ ĐÃ TRẢM</span>
            <span className="font-mono font-bold text-[#f9f5e8]">{wordsSlain} Từ</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[#6ee7b7] font-mono text-[10px]">KIẾM TỐC / CHÍNH XÁC</span>
            <span className="font-mono font-bold text-[#60a5fa]">{wpm} WPM • {accuracy}%</span>
          </div>
        </div>

        {/* Ghi Danh Phong Thần Form */}
        <div className="bg-[#08160e] p-3 rounded-xl border border-[#ca8a04]/50 flex flex-col gap-2">
          <label className="text-[11px] font-serif text-[#ffdf79] text-left font-semibold">
            📜 Đạo Hiệu Ghi Danh Phong Thần:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              disabled={submitted}
              className="flex-1 px-3 py-1.5 bg-[#0a1f13] border border-[#1b432a] rounded-lg text-xs font-serif text-[#f9f5e8] focus:outline-none focus:border-[#fbbf24]"
              placeholder="Nhập đạo hiệu..."
            />
            <button
              onClick={handleSubmitScore}
              disabled={submitted || isSubmitting}
              className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition-all flex items-center gap-1 cursor-pointer ${
                submitted 
                  ? "bg-[#059669] text-white cursor-default" 
                  : "bg-gradient-to-r from-[#ca8a04] to-[#eab308] hover:from-[#eab308] hover:to-[#fde047] text-black shadow"
              }`}
            >
              {submitted ? "✓ Đã Ghi Danh" : isSubmitting ? "Đang Ghi..." : "Khắc Bia"}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Rebirth in Place */}
          <button
            onClick={onRebirth}
            className="py-2.5 px-3 bg-[#059669] hover:bg-[#10b981] text-[#f9f5e8] rounded-xl font-bold font-serif text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg active:scale-95 border border-[#6ee7b7]/40"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Trùng Sinh [Tại Chỗ]</span>
          </button>

          {/* Return to Lobby & Clean Cache */}
          <button
            onClick={onReturnLobby}
            className="py-2.5 px-3 bg-[#0d2618] hover:bg-[#1b432a] text-[#e2e8f0] border border-[#22543d] rounded-xl font-bold font-serif text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <LogOut className="w-4 h-4 text-[#ffdf79]" />
            <span>Về Sảnh Chờ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
