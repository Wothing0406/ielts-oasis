"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Maximize2, Minimize2, Sparkles, Database, Shield, 
  Trophy, BookOpen, Save, RefreshCw, Volume2, Search, Swords, 
  ChevronRight, Flame, Zap, Award, CheckCircle2, Play
} from "lucide-react";
import { MeowchaGame } from "@/components/meowcha/MeowchaGame";

interface LeaderboardItem {
  id: number;
  rank: number;
  player_name: string;
  score: number;
  words_slain: number;
  realm: string;
  accuracy: number;
  wpm: number;
  created_at: string;
}

interface SaveSlotItem {
  slot_id: number;
  slot_name: string;
  is_occupied: boolean;
  realm: string;
  realm_idx: number;
  title: string;
  hp: number;
  max_hp: number;
  score: number;
  words_slain: number;
  band_idx: number;
  talents: Record<string, any>;
  updated_at: string;
}

interface VocabItem {
  id: number;
  word: string;
  ipa: string;
  type: string;
  meaning: string;
  band_level: number;
  asteroid_type: string;
  difficulty_score: number;
}

export default function MeowchaGamePage() {
  const [activeTab, setActiveTab] = useState<"arena" | "leaderboard" | "saves" | "vocab">("arena");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Save slots state
  const [saveSlots, setSaveSlots] = useState<Record<number, SaveSlotItem>>({});
  const [loadingSaves, setLoadingSaves] = useState(false);

  // Vocab vault state
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [selectedBand, setSelectedBand] = useState<number | "all">("all");
  const [vocabSearch, setVocabSearch] = useState("");
  const [loadingVocab, setLoadingVocab] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    setMounted(true);
    fetchLeaderboard();
    fetchSaveSlots();
    fetchVocabList();
  }, []);

  // 1. Fetch Leaderboard from API
  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetch("/api/meowcha/leaderboard?limit=15");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setLeaderboard(json.data);
        }
      }
    } catch (e) {
      console.warn("Could not fetch leaderboard, using fallback default.", e);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // 2. Fetch Save Slots from API
  const fetchSaveSlots = async () => {
    setLoadingSaves(true);
    try {
      const res = await fetch("/api/meowcha/saves");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSaveSlots(json.data);
        }
      }
    } catch (e) {
      console.warn("Could not fetch save slots.", e);
    } finally {
      setLoadingSaves(false);
    }
  };

  // 3. Fetch Vocab Vault from API
  const fetchVocabList = async () => {
    setLoadingVocab(true);
    try {
      const res = await fetch("/api/meowcha/vocab?limit=100");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setVocabList(json.data);
        }
      }
    } catch (e) {
      console.warn("Could not fetch vocab list.", e);
    } finally {
      setLoadingVocab(false);
    }
  };

  const toggleFullscreen = () => {
    const elem = document.getElementById("meowcha-frame-container");
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const playWordAudio = (word: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const reloadGameClient = () => {
    setGameKey(k => k + 1);
  };

  // Filtered Vocab
  const filteredVocab = vocabList.filter(item => {
    const matchesBand = selectedBand === "all" || item.band_level === selectedBand;
    const matchesQuery = !vocabSearch || 
      item.word.toLowerCase().includes(vocabSearch.toLowerCase()) || 
      item.meaning.toLowerCase().includes(vocabSearch.toLowerCase());
    return matchesBand && matchesQuery;
  });

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#050b07] text-[#f9f5e8] flex flex-col font-sans select-none">
      
      {/* ===================================================================== */}
      {/* 1. TOP HEADER & BRAND BAR */}
      {/* ===================================================================== */}
      <header className="w-full bg-[#08160e] border-b border-[#1b432a] px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 shadow-md z-30 sticky top-0">
        
        {/* Brand & Back Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/games"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0c2417] hover:bg-[#133521] text-[#ffdf79] rounded-lg border border-[#ca8a04]/50 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Games Hub</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-sm sm:text-base text-[#ffdf79] tracking-wider drop-shadow">
              MEOW-CHA: VẠN KIẾM QUY TÔNG
            </span>
          </div>
        </div>

        {/* Action Buttons & Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Refresh Client Button */}
          <button
            onClick={reloadGameClient}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-[#0c2417] hover:bg-[#133521] text-[#a7f3d0] rounded-lg border border-[#1b432a] text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            title="Làm mới trận địa"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#ffdf79]" />
            <span className="hidden sm:inline">Khởi Động Lại</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-[#0c2417] hover:bg-[#133521] text-[#ffdf79] rounded-lg border border-[#ca8a04]/50 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            title="Bật/Tắt Toàn Màn Hình"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-[#ffdf79]" />
                <span className="hidden sm:inline">Thu Nhỏ</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-[#ffdf79]" />
                <span className="hidden sm:inline">Toàn Màn Hình</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. SUB NAVIGATION TABS BAR */}
      {/* ===================================================================== */}
      <div className="w-full bg-[#07130c] border-b border-[#1b432a] px-3 py-1 flex items-center justify-center">
        <div className="flex items-center gap-1.5 sm:gap-3 bg-[#0a1f13] p-1 rounded-xl border border-[#1b432a] max-w-2xl w-full justify-between sm:justify-center">
          
          {/* Tab 1: Trận Địa */}
          <button
            onClick={() => setActiveTab("arena")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "arena"
                ? "bg-[#15803d] text-[#ffdf79] border border-[#ca8a04]/60 shadow-[0_0_12px_#15803d]"
                : "text-[#a7f3d0] hover:text-[#ffdf79] hover:bg-[#0c2417]"
            }`}
          >
            <Swords className="w-4 h-4 text-[#ffdf79]" />
            <span>Độ Kiếp Đài</span>
          </button>

          {/* Tab 2: Bảng Phong Thần */}
          <button
            onClick={() => {
              setActiveTab("leaderboard");
              fetchLeaderboard();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "leaderboard"
                ? "bg-[#15803d] text-[#ffdf79] border border-[#ca8a04]/60 shadow-[0_0_12px_#15803d]"
                : "text-[#a7f3d0] hover:text-[#ffdf79] hover:bg-[#0c2417]"
            }`}
          >
            <Trophy className="w-4 h-4 text-[#ffdf79]" />
            <span>Phong Thần Bảng</span>
          </button>

          {/* Tab 3: Ngọc Giản Save Slots */}
          <button
            onClick={() => {
              setActiveTab("saves");
              fetchSaveSlots();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "saves"
                ? "bg-[#15803d] text-[#ffdf79] border border-[#ca8a04]/60 shadow-[0_0_12px_#15803d]"
                : "text-[#a7f3d0] hover:text-[#ffdf79] hover:bg-[#0c2417]"
            }`}
          >
            <Save className="w-4 h-4 text-[#34d399]" />
            <span>Ngọc Giản (Saves)</span>
          </button>

          {/* Tab 4: Đạo Tạng IELTS Vocab */}
          <button
            onClick={() => {
              setActiveTab("vocab");
              fetchVocabList();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "vocab"
                ? "bg-[#15803d] text-[#ffdf79] border border-[#ca8a04]/60 shadow-[0_0_12px_#15803d]"
                : "text-[#a7f3d0] hover:text-[#ffdf79] hover:bg-[#0c2417]"
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#60a5fa]" />
            <span>Đạo Tạng (Oxford)</span>
          </button>

        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. TAB 1: ĐỘ KIẾP ĐÀI (GAME ARENA VIEWPORT) */}
      {/* ===================================================================== */}
      {activeTab === "arena" && (
        <main className="flex-1 w-full flex flex-col items-center justify-center p-0 md:p-2" id="meowcha-frame-container">
          <div className="w-full max-w-5xl h-[calc(100vh-100px)] md:h-[820px] bg-black rounded-none md:rounded-2xl overflow-hidden border-0 md:border-2 border-[#1b432a] shadow-2xl relative flex flex-col">
            <MeowchaGame key={gameKey} />
          </div>
        </main>
      )}

      {/* ===================================================================== */}
      {/* 4. TAB 2: BẢNG PHONG THẦN (SQL LEADERBOARD) */}
      {/* ===================================================================== */}
      {activeTab === "leaderboard" && (
        <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#1b432a] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#1b432a] border border-[#ffdf79] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-[#ffdf79]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-serif text-[#ffdf79]">
                  BẢNG PHONG THẦN TIÊN GIỚI
                </h2>
                <p className="text-xs text-[#86efac]">
                  Ghi danh cao thủ trảm ma thạch IELTS • Dữ liệu lưu trực tiếp tại SQL Database
                </p>
              </div>
            </div>
            <button
              onClick={fetchLeaderboard}
              disabled={loadingLeaderboard}
              className="px-3 py-1.5 bg-[#0d2618] hover:bg-[#1b432a] text-[#ffdf79] rounded-lg border border-[#22543d] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLeaderboard ? "animate-spin" : ""}`} />
              <span>Cập Nhật</span>
            </button>
          </div>

          {/* Leaderboard Table Card */}
          <div className="w-full bg-[#0a1f13] rounded-xl border border-[#1b432a] overflow-hidden shadow-xl">
            <div className="grid grid-cols-12 bg-[#0d2618] px-4 py-2.5 border-b border-[#1b432a] text-[11px] sm:text-xs font-bold text-[#e2e8f0] uppercase tracking-wider">
              <span className="col-span-1 text-center">Hạng</span>
              <span className="col-span-4 sm:col-span-4">Đạo Hiệu / Người Chơi</span>
              <span className="col-span-3 sm:col-span-3">Cảnh Giới</span>
              <span className="col-span-2 text-right">Điểm Tu Vi</span>
              <span className="col-span-2 text-right">Kiếm Tốc</span>
            </div>

            <div className="divide-y divide-[#2a1b10]">
              {leaderboard.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className={`grid grid-cols-12 px-4 py-3 items-center text-xs transition-colors hover:bg-[#0d2618]/80 ${
                    idx === 0
                      ? "bg-[#1b432a]/40 text-[#ffdf79]"
                      : idx === 1
                      ? "bg-[#0d2618]/30 text-[#e2e8f0]"
                      : idx === 2
                      ? "bg-[#0d2618]/20 text-[#fed7aa]"
                      : "text-[#e2e8f0]"
                  }`}
                >
                  {/* Hạng */}
                  <span className="col-span-1 text-center font-mono font-bold text-sm">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                  </span>

                  {/* Tên */}
                  <div className="col-span-4 flex items-center gap-2">
                    <span className="font-serif font-bold text-sm text-[#f9f5e8] truncate">
                      {item.player_name}
                    </span>
                    {idx === 0 && (
                      <span className="hidden sm:inline px-1.5 py-0.2 bg-[#ffdf79] text-[#0a1f13] font-mono text-[9px] rounded font-bold">
                        TOP 1
                      </span>
                    )}
                  </div>

                  {/* Cảnh giới */}
                  <div className="col-span-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-[#0d2618] rounded border border-[#22543d] font-serif text-[11px] text-[#98b06f]">
                      {item.realm || "Luyện Khí Kỳ"}
                    </span>
                  </div>

                  {/* Điểm Tu Vi */}
                  <span className="col-span-2 text-right font-mono font-bold text-[#ffdf79] text-sm">
                    {item.score.toLocaleString()} pts
                  </span>

                  {/* Kiếm Tốc / WPM */}
                  <span className="col-span-2 text-right font-mono text-[#98b06f]">
                    {item.wpm} WPM
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* ===================================================================== */}
      {/* 5. TAB 3: NGỌC GIẢN TU VI (3 SAVE SLOTS CLOUD) */}
      {/* ===================================================================== */}
      {activeTab === "saves" && (
        <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#1b432a] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#1b432a] border border-[#34d399] flex items-center justify-center">
                <Save className="w-5 h-5 text-[#34d399]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-serif text-[#ffdf79]">
                  NGỌC GIẢN LƯU TRỮ TU VI (3 CLOUD SLOTS)
                </h2>
                <p className="text-xs text-[#86efac]">
                  Lưu tiến trình vào SQL Database • F5 hoặc đổi thiết bị vẫn nạp lại toàn vẹn
                </p>
              </div>
            </div>
            <button
              onClick={fetchSaveSlots}
              disabled={loadingSaves}
              className="px-3 py-1.5 bg-[#0d2618] hover:bg-[#1b432a] text-[#34d399] rounded-lg border border-[#22543d] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSaves ? "animate-spin" : ""}`} />
              <span>Đồng Bộ</span>
            </button>
          </div>

          {/* 3 Save Slots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(slotId => {
              const slot = saveSlots[slotId];
              const isOccupied = slot && slot.is_occupied;

              return (
                <div
                  key={slotId}
                  className={`p-4 rounded-xl border-2 flex flex-col justify-between gap-4 transition-all shadow-lg ${
                    isOccupied
                      ? "bg-[#0a1f13] border-[#15803d] hover:border-[#ffdf79]"
                      : "bg-[#060f09] border-[#1b432a] opacity-80"
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#ffdf79]">
                        {slot?.slot_name || `FILE ${slotId}`}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          isOccupied
                            ? "bg-[#15803d] text-[#f9f5e8]"
                            : "bg-[#0d2618] text-[#86efac]"
                        }`}
                      >
                        {isOccupied ? "ĐÃ LƯU" : "TRỐNG"}
                      </span>
                    </div>

                    <div className="p-2.5 bg-[#0d2618] rounded-lg border border-[#1b432a] flex flex-col gap-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#86efac]">Cảnh Giới:</span>
                        <span className="font-bold text-[#f9f5e8]">
                          {isOccupied ? slot.realm : "--"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#86efac]">Khí Huyết:</span>
                        <span className="font-mono text-[#34d399]">
                          {isOccupied ? `${slot.hp} / ${slot.max_hp} HP` : "--"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#86efac]">Tu Vi Đạt:</span>
                        <span className="font-mono font-bold text-[#ffdf79]">
                          {isOccupied ? `${slot.score.toLocaleString()} pts` : "--"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#86efac]">Đã Trảm:</span>
                        <span className="font-mono text-[#98b06f]">
                          {isOccupied ? `${slot.words_slain} Từ` : "--"}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-[#86efac] pt-1 border-t border-[#1b432a] mt-1">
                        <span>Cập nhật:</span>
                        <span>{slot?.updated_at || "--"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Nạp vào trận button */}
                  <button
                    onClick={() => {
                      setActiveTab("arena");
                    }}
                    disabled={!isOccupied}
                    className={`w-full py-2 rounded-lg text-xs font-bold font-serif flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isOccupied
                        ? "bg-[#15803d] hover:bg-[#8aa970] text-[#f9f5e8] shadow"
                        : "bg-[#0d2618] text-[#334e3f] cursor-not-allowed"
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>NẠP VÀO TRẬN ĐẤU</span>
                  </button>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* ===================================================================== */}
      {/* 6. TAB 4: ĐẠO TẠNG IELTS (115+ VOCABULARY VAULT) */}
      {/* ===================================================================== */}
      {activeTab === "vocab" && (
        <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1b432a] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#1b432a] border border-[#60a5fa] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-[#60a5fa]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-serif text-[#ffdf79]">
                  ĐẠO TẠNG TỪ VỰNG IELTS (115+ TỪ AWL & OXFORD)
                </h2>
                <p className="text-xs text-[#86efac]">
                  Kho từ vựng phân tầng 4 cấp độ ma thạch • Bấm loa để nghe phát âm giọng bản xứ
                </p>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#86efac] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tra từ hoặc nghĩa..."
                value={vocabSearch}
                onChange={e => setVocabSearch(e.target.value)}
                className="w-full bg-[#0a1f13] border border-[#22543d] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#f9f5e8] placeholder-[#86efac] focus:outline-none focus:border-[#ffdf79]"
              />
            </div>
          </div>

          {/* Band Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "Tất Cả (115+)" },
              { id: 0, label: "Band 4.0 - 5.0 [ BĂNG PHÁCH ]" },
              { id: 1, label: "Band 6.0 - 6.5 [ HỎA DIỄM ]" },
              { id: 2, label: "Band 7.0 - 7.5 [ HƯ KHÔNG ]" },
              { id: 3, label: "Band 8.0+ [ HUYẾT LÔI ]" }
            ].map(b => (
              <button
                key={String(b.id)}
                onClick={() => setSelectedBand(b.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedBand === b.id
                    ? "bg-[#15803d] text-[#f9f5e8] shadow"
                    : "bg-[#0a1f13] text-[#e2e8f0] hover:bg-[#0d2618] border border-[#1b432a]"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Vocab Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredVocab.map(item => {
              const badgeColor =
                item.asteroid_type === "BLOOD_THUNDER"
                  ? "bg-rose-950 text-rose-300 border-rose-600"
                  : item.asteroid_type === "VOID"
                  ? "bg-purple-950 text-purple-300 border-purple-600"
                  : item.asteroid_type === "INFERNO"
                  ? "bg-amber-950 text-amber-300 border-amber-600"
                  : "bg-cyan-950 text-cyan-300 border-cyan-600";

              return (
                <div
                  key={item.id}
                  className="p-3.5 bg-[#0a1f13] rounded-xl border border-[#1b432a] hover:border-[#ffdf79] transition-all flex flex-col justify-between gap-2 shadow"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-base text-[#ffdf79] tracking-wider">
                        {item.word}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold ${badgeColor}`}>
                        {item.asteroid_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-[#98b06f] italic">{item.ipa}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-[#0d2618] text-[#86efac] rounded border border-[#22543d]">
                        {item.type}
                      </span>
                    </div>

                    <p className="text-xs text-[#e2e8f0] mt-1 font-serif">
                      {item.meaning}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#2a1b10] flex items-center justify-between">
                    <button
                      onClick={() => playWordAudio(item.word)}
                      className="flex items-center gap-1 text-[11px] text-[#34d399] hover:text-[#6ee7b7] font-semibold cursor-pointer"
                      title="Nghe phát âm chuẩn"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Nghe Đọc</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("arena");
                      }}
                      className="text-[11px] text-[#ffdf79] hover:underline font-serif flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Vào trận diệt từ này</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* ===================================================================== */}
      {/* 7. FOOTER */}
      {/* ===================================================================== */}
      <footer className="w-full bg-[#0a1f13] border-t border-[#1b432a] py-2 px-4 text-center text-xs text-[#86efac] font-serif">
        <span>Tiên Đạo Trà Viện • Luyện từ vựng IELTS 4.0 - 8.5+ cùng Miêu Kiếm Tôn • IELTS Oasis Platform</span>
      </footer>
    </div>
  );
}
