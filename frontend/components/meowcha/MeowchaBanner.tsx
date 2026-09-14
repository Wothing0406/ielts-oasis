// components/meowcha/MeowchaBanner.tsx - Floating Xianxia HUD Overlay (Authentic Zen Taoist Aesthetic)

import React from "react";
import { 
  Pause, Save, LogOut, Volume2, VolumeX, Flame, Zap, Shield, Sparkles 
} from "lucide-react";
import { Realm, REALMS, Asteroid, Talent } from "@/types/meowcha";

interface MeowchaBannerProps {
  currentRealmIdx: number;
  hp: number;
  maxHp: number;
  score: number;
  wordsSlain: number;
  wpm: number;
  combo: number;
  activeAsteroid: Asteroid | null;
  activeTalents?: Talent[];
  isMuted: boolean;
  bgmEnabled: boolean;
  onToggleMute: () => void;
  onToggleBgm: () => void;
  onPause: () => void;
  onSaveGame: () => void;
  onExitGame: () => void;
}

export const MeowchaBanner: React.FC<MeowchaBannerProps> = ({
  currentRealmIdx,
  hp,
  maxHp,
  score,
  wordsSlain,
  wpm,
  combo,
  activeAsteroid,
  activeTalents = [],
  isMuted,
  bgmEnabled,
  onToggleMute,
  onToggleBgm,
  onPause,
  onSaveGame,
  onExitGame
}) => {
  const realm: Realm = REALMS[currentRealmIdx] || REALMS[0];
  const shieldTalent = activeTalents.find(t => t.baseId === "golden_shield");
  const shieldLevel = shieldTalent ? shieldTalent.level : 0;
  const thienKiepMultiplier = (1 + currentRealmIdx * 0.1).toFixed(1);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 select-none overflow-hidden">
      
      {/* ===================================================================== */}
      {/* 1. TOP-LEFT JADE ĐẠO VỊ HUD BOX (AUTHENTIC XIANXIA PANEL FROM IMAGE 1) */}
      {/* ===================================================================== */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 pointer-events-auto bg-[#0a1f13]/92 backdrop-blur-md border-2 border-[#ca8a04] rounded-lg p-2.5 sm:p-3 shadow-2xl shadow-black/80 font-serif text-xs min-w-[240px] sm:min-w-[280px] max-w-[320px]">
        {/* Row 1: Tông Môn Seal & Đạo Vị */}
        <div className="flex items-center justify-between border-b border-[#ca8a04]/40 pb-1 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 bg-[#b91c1c] text-[#fef08a] font-bold rounded flex items-center justify-center text-[10px] shadow border border-[#fbbf24]/50">
              宗
            </span>
            <span className="font-bold text-[#ffdf79] tracking-wide text-xs sm:text-sm">
              [ ĐẠO VỊ ] {realm.name} • {realm.title}
            </span>
          </div>
        </div>

        {/* Row 2: Tu Vi & Trảm Ma */}
        <div className="flex items-center justify-between text-[#ffdf79] text-[11px] sm:text-xs">
          <span>⭐ Tu Vi: {score} pts</span>
          <span>• Trảm Ma: {wordsSlain} từ</span>
        </div>

        {/* Row 3: Thiên Kiếp & Kim Chung Thuẫn */}
        <div className="flex items-center justify-between text-[#98b06f] text-[10px] sm:text-[11px] mt-0.5">
          <span>[ THIÊN KIẾP ] x{thienKiepMultiplier}</span>
          <span>| Kim Chung Thuẫn: {shieldLevel} tầng</span>
        </div>

        {/* Row 4: Khí Huyết Bar (Luminous Cyan-Emerald) */}
        <div className="pt-1.5">
          <div className="flex justify-between text-[10px] text-[#6ee7b7] font-mono mb-0.5">
            <span className="font-bold">[ KHÍ HUYẾT ]</span>
            <span>{hp} / {maxHp} HP</span>
          </div>
          <div className="w-full h-2.5 sm:h-3 bg-black/70 rounded-full border border-[#2dd4bf]/40 overflow-hidden p-0.5">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-[#059669] via-[#10b981] to-[#2dd4bf] shadow-[0_0_10px_#10b981] transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, (hp / maxHp) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. TOP-RIGHT FLOATING ACTION BUTTONS */}
      {/* ===================================================================== */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 pointer-events-auto flex items-center gap-1.5 sm:gap-2">
        {/* BGM Toggle */}
        <button
          onClick={onToggleBgm}
          className="px-2 sm:px-2.5 py-1.5 bg-[#0a1f13]/85 hover:bg-[#132e1e] text-[#ffdf79] border border-[#ca8a04]/70 rounded-lg text-xs font-serif flex items-center gap-1 shadow-lg transition-all active:scale-95 cursor-pointer backdrop-blur-sm"
          title="Bật/Tắt Nhạc Thiền Tu Tâm"
        >
          {bgmEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#34d399]" /> : <VolumeX className="w-3.5 h-3.5 text-stone-400" />}
          <span className="hidden sm:inline">Nhạc Thiền</span>
        </button>

        {/* Pause Button */}
        <button
          onClick={onPause}
          className="px-2 sm:px-2.5 py-1.5 bg-[#0a1f13]/85 hover:bg-[#132e1e] text-[#ffdf79] border border-[#ca8a04]/70 rounded-lg text-xs font-serif flex items-center gap-1 shadow-lg transition-all active:scale-95 cursor-pointer backdrop-blur-sm"
          title="Tạm Dừng Trận Chiến (Phím ESC hoặc P)"
        >
          <Pause className="w-3.5 h-3.5 text-[#ffdf79]" />
          <span className="hidden sm:inline">Tạm Dừng [ESC]</span>
        </button>

        {/* Save Button */}
        <button
          onClick={onSaveGame}
          className="px-2 sm:px-2.5 py-1.5 bg-[#0a1f13]/85 hover:bg-[#132e1e] text-[#6ee7b7] border border-[#ca8a04]/70 rounded-lg text-xs font-serif flex items-center gap-1 shadow-lg transition-all active:scale-95 cursor-pointer backdrop-blur-sm"
          title="Lưu tiến trình vào Ngọc Giản"
        >
          <Save className="w-3.5 h-3.5 text-[#34d399]" />
          <span className="hidden sm:inline">Lưu Đạo Quả</span>
        </button>

        {/* Exit Button */}
        <button
          onClick={onExitGame}
          className="px-2 sm:px-2.5 py-1.5 bg-[#1f0a0a]/85 hover:bg-[#2e1313] text-[#fca5a5] border border-[#b91c1c]/70 rounded-lg text-xs font-serif flex items-center gap-1 shadow-lg transition-all active:scale-95 cursor-pointer backdrop-blur-sm"
          title="Rời trận địa về Sảnh Tiên Viện"
        >
          <LogOut className="w-3.5 h-3.5 text-[#f87171]" />
          <span className="hidden sm:inline">Thoát</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* 3. BOTTOM-RIGHT KIẾM Ý SCROLL (AUTHENTIC SILK PARCHMENT FROM IMAGE 1) */}
      {/* ===================================================================== */}
      <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 pointer-events-auto max-w-[280px] sm:max-w-sm">
        <div className="bg-[#fef9c3]/92 text-[#713f12] border-2 border-[#ca8a04] rounded-lg px-3 py-1.5 shadow-xl flex items-center gap-2 font-serif text-xs backdrop-blur-sm">
          <span className="px-1.5 py-0.5 bg-[#b91c1c] text-[#fef08a] font-bold rounded text-[10px] shadow border border-[#ca8a04]/60">
            劍
          </span>
          <span className="truncate italic">
            {activeAsteroid ? (
              activeAsteroid.typed ? (
                <span>
                  Đang vận kiếm: <strong className="text-[#b91c1c]">{activeAsteroid.typed}</strong>
                </span>
              ) : (
                <span>Khí cơ tỏa định: <strong>{activeAsteroid.word}</strong></span>
              )
            ) : (
              "Chờ đạo hữu xuất kiếm..."
            )}
          </span>
        </div>
      </div>

    </div>
  );
};
