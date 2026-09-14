// components/meowcha/MeowchaBanner.tsx - Top HUD Console for Meow-Cha

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
  const hpRatio = Math.max(0, Math.min(1, hp / maxHp));
  const hpSegments = 10;
  const activeSegments = Math.round(hpRatio * hpSegments);

  return (
    <div className="w-full bg-[#180f08] border-b-2 border-[#3b2719] px-3 py-2 flex flex-col gap-1.5 shadow-xl z-20 select-none">
      
      {/* 1. TOP ROW: AVATAR, HP, REALM & ACTION BUTTONS */}
      <div className="flex items-center justify-between gap-2">
        
        {/* Left: Avatar & Realm & Active Skill */}
        <div className="flex items-center gap-2.5">
          {/* Realm Avatar Box */}
          <div 
            className="w-10 h-10 rounded-lg bg-[#281a11] border-2 flex items-center justify-center relative shadow-inner overflow-hidden"
            style={{ borderColor: realm.auraColor }}
          >
            <img 
              src={realm.sprite} 
              alt={realm.name}
              className="w-8 h-8 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <span className="absolute bottom-0 right-0 px-1 text-[8px] font-mono font-bold bg-black/80 text-[#ffdf79] rounded-tl">
              L.{currentRealmIdx + 1}
            </span>
          </div>

          {/* Realm Title & HP Bar */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-xs sm:text-sm text-[#ffdf79] tracking-wide">
                {realm.name}
              </span>
              <span 
                className="text-[10px] px-1.5 py-0.2 rounded font-serif border font-semibold hidden sm:inline"
                style={{ 
                  color: realm.auraColor, 
                  borderColor: realm.auraColor, 
                  backgroundColor: `${realm.auraColor}15` 
                }}
              >
                {realm.skillName}
              </span>
            </div>

            {/* 10 Segmented HP Blocks */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-[#a09070] font-semibold">HP:</span>
              <div className="flex items-center gap-0.5 bg-[#100a06] p-0.5 rounded border border-[#3b2719]">
                {Array.from({ length: hpSegments }).map((_, idx) => {
                  const isLit = idx < activeSegments;
                  const blockColor =
                    hpRatio > 0.5
                      ? "bg-[#34d399]"
                      : hpRatio > 0.25
                      ? "bg-[#f59e0b]"
                      : "bg-[#ef4444]";

                  return (
                    <div
                      key={idx}
                      className={`w-2.5 sm:w-3.5 h-2 rounded-[1px] transition-colors ${
                        isLit ? blockColor : "bg-[#281a11]"
                      }`}
                    />
                  );
                })}
              </div>
              <span className="text-[10px] font-mono text-[#f9f5e8] font-bold">
                {hp}/{maxHp}
              </span>
            </div>
          </div>
        </div>

        {/* Center: WPM, Slain, Score */}
        <div className="hidden md:flex items-center gap-4 bg-[#24160d] px-3 py-1 rounded-lg border border-[#3b2719] text-xs">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-[#a09070] uppercase font-mono">Kiếm Tốc</span>
            <span className="font-mono font-bold text-[#34d399]">{wpm} WPM</span>
          </div>

          <div className="w-[1px] h-5 bg-[#3b2719]" />

          <div className="flex flex-col items-center">
            <span className="text-[9px] text-[#a09070] uppercase font-mono">Đã Trảm</span>
            <span className="font-mono font-bold text-[#f9f5e8]">{wordsSlain} Từ</span>
          </div>

          <div className="w-[1px] h-5 bg-[#3b2719]" />

          <div className="flex flex-col items-center">
            <span className="text-[9px] text-[#a09070] uppercase font-mono">Tu Vi Đạt</span>
            <span className="font-mono font-bold text-[#ffdf79]">{score.toLocaleString()}</span>
          </div>

          {combo > 1 && (
            <>
              <div className="w-[1px] h-5 bg-[#3b2719]" />
              <div className="flex items-center gap-1 text-[#f59e0b] font-bold animate-pulse">
                <Flame className="w-3.5 h-3.5" />
                <span className="font-mono">{combo}x Combo!</span>
              </div>
            </>
          )}
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Zen BGM Toggle */}
          <button
            onClick={onToggleBgm}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
              bgmEnabled
                ? "bg-[#281a11] text-[#ffdf79] border-[#543924] hover:bg-[#3b2719]"
                : "bg-[#180f08] text-[#716154] border-[#2a1b10]"
            }`}
            title={bgmEnabled ? "Tắt Nhạc Thiền" : "Bật Nhạc Thiền"}
          >
            {bgmEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline text-[11px] font-serif">Nhạc Thiền</span>
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="px-2.5 py-1 bg-[#281a11] hover:bg-[#3b2719] text-[#f9f5e8] rounded-lg border border-[#543924] text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            title="Tạm dừng trận chiến [Phím ESC]"
          >
            <Pause className="w-3.5 h-3.5 text-[#ffdf79]" />
            <span className="hidden sm:inline">Tạm Dừng [ESC]</span>
          </button>

          {/* Quick Save */}
          <button
            onClick={onSaveGame}
            className="px-2.5 py-1 bg-[#789262] hover:bg-[#8aa970] text-[#f9f5e8] rounded-lg border border-[#98b06f] text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
            title="Lưu tiến trình vào SQL Database"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lưu Đạo Quả</span>
          </button>

          {/* Exit / Return to Lobby */}
          <button
            onClick={onExitGame}
            className="px-2 py-1 bg-[#450a0a] hover:bg-[#7f1d1d] text-[#fca5a5] rounded-lg border border-[#991b1b] text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            title="Dừng tu tập và về sảnh"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thoát</span>
          </button>
        </div>
      </div>

      {/* 2. BOTTOM ROW: WORD RADAR (TARGETED WORD & MEANING PREVIEW) */}
      <div className="w-full bg-[#110a05] px-3 py-1 rounded border border-[#2d1b0e] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 truncate">
          <span className="text-[10px] px-1.5 py-0.2 bg-[#24160d] text-[#ffdf79] font-mono rounded font-bold border border-[#3b2719]">
            {activeAsteroid ? `[ ${activeAsteroid.type} ]` : "[ CHỜ LỆNH ]"}
          </span>

          {activeAsteroid ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-serif font-bold text-[#ffdf79] tracking-wide">
                {activeAsteroid.word}
              </span>
              <span className="font-mono text-[#98b06f] italic text-[11px] hidden sm:inline">
                {activeAsteroid.ipa}
              </span>
              <span className="text-[#d8ccb0] font-serif text-[11px] truncate hidden md:inline">
                — {activeAsteroid.meaning}
              </span>
            </div>
          ) : (
            <span className="text-[#a09070] italic text-[11px]">
              Đang vận chuyển kiếm ý... Gõ ký tự tiếng Anh trên thiên thạch để xuất kiếm!
            </span>
          )}
        </div>

        {/* Skill visual name & Active Talents */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#ffdf79]">
          {activeTalents.length > 0 && (
            <div className="hidden sm:flex items-center gap-1">
              {activeTalents.map(t => (
                <span 
                  key={t.id}
                  className="px-1.5 py-0.2 rounded bg-[#281a11] text-[#34d399] border border-[#543924] font-serif text-[9px] font-bold"
                  title={t.desc}
                >
                  ⚡ {t.name}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#ffdf79]" />
            <span>{realm.skillName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
