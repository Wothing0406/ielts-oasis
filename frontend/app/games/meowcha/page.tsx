"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { MeowchaGame } from "@/components/meowcha/MeowchaGame";
import { 
  ArrowLeft, Maximize2, Minimize2, Sparkles, Database, Shield, 
  Trophy, BookOpen, Save, RefreshCw, Volume2, Search, Swords, 
  ChevronRight, ChevronLeft, Flame, Zap, Award, CheckCircle2, 
  Play, Trash2, PlusCircle, X, Compass, Feather, Scroll
} from "lucide-react";

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
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [targetWord, setTargetWord] = useState<string | null>(null);
  const [activeLoadedSave, setActiveLoadedSave] = useState<any | null>(null);


  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);


  // Save slots state
  const [saveSlots, setSaveSlots] = useState<Record<number, SaveSlotItem>>({});
  const [loadingSaves, setLoadingSaves] = useState(false);

  // Vocab vault state (Oxford 5000)
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [selectedBand, setSelectedBand] = useState<number | "all">("all");
  const [vocabSearch, setVocabSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loadingVocab, setLoadingVocab] = useState(false);
  const [vocabPage, setVocabPage] = useState(1);
  const [vocabTotal, setVocabTotal] = useState(5946);
  const [gameKey, setGameKey] = useState(0);

  const gameIframeRef = useRef<HTMLIFrameElement | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(vocabSearch);
      setVocabPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [vocabSearch]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("oasis_user");
        if (raw) setCurrentUser(JSON.parse(raw));
      } catch (e) {}
    }

    fetchLeaderboard();
    fetchSaveSlots();
    fetchVocabList(1, selectedBand, debouncedSearch);

    // Lắng nghe tín hiệu đồng bộ từ Master Game Engine qua window.postMessage
    const handleGameMessage = (event: MessageEvent) => {
      if (!event.data) return;
      if (event.data.type === "MEOWCHA_SCORE_SUBMITTED") {
        fetchLeaderboard();
        setToastMsg(`Chiến tích ${event.data.data?.score || 0} pts đã được ghi danh vào Bảng Phong Thần!`);
        setTimeout(() => setToastMsg(null), 4000);
      } else if (event.data.type === "MEOWCHA_SAVE_UPDATED") {
        fetchSaveSlots();
        setToastMsg(`Đạo Quả File ${event.data.slotId || 1} đã được khắc ghi vào Ngọc Giản!`);
        setTimeout(() => setToastMsg(null), 4000);
      }
    };

    window.addEventListener("message", handleGameMessage);
    return () => window.removeEventListener("message", handleGameMessage);
  }, []);

  // Effect khi đổi band hoặc search
  useEffect(() => {
    if (mounted) {
      fetchVocabList(vocabPage, selectedBand, debouncedSearch);
    }
  }, [vocabPage, selectedBand, debouncedSearch]);

  // 1. Fetch Leaderboard from Backend SQL
  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetch("/api/meowcha/leaderboard?limit=20");
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



  // 3. Fetch Save Slots from Backend SQL
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

  // 4. Fetch Oxford 5000 Vocab Vault from Backend API
  const fetchVocabList = async (page: number, band: number | "all", search: string) => {
    setLoadingVocab(true);
    try {
      let url = `/api/meowcha/vocab?page=${page}&page_size=60`;
      if (band !== "all") url += `&band=${band}`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setVocabList(json.data);
          if (json.meta && json.meta.total) {
            setVocabTotal(json.meta.total);
          }
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
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const reloadGameClient = () => {
    setGameKey(k => k + 1);
    if (gameIframeRef.current && gameIframeRef.current.contentWindow) {
      gameIframeRef.current.contentWindow.postMessage({ type: "MEOWCHA_RELOAD" }, "*");
    }
    setToastMsg("Đã khởi động lại trận địa độ kiếp!");
    setTimeout(() => setToastMsg(null), 2500);
  };

    const handleLoadSlotIntoGame = (slot: SaveSlotItem) => {
    setActiveLoadedSave(slot);
    setActiveTab("arena");
    setToastMsg(`Đang nạp Đạo Quả File ${slot.slot_id} (${slot.realm}) vào trận chiến...`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleLaunchTargetWord = (word: string) => {
    setTargetWord(word.toUpperCase());
    setActiveTab("arena");
    setToastMsg(`Khởi tạo thiên thạch chứa cổ ngữ: "${word.toUpperCase()}"!`);
    setTimeout(() => setToastMsg(null), 3000);
  };



  const handleDeleteSlot = async (slotId: number) => {
    if (!confirm(`Đạo hữu có chắc chắn muốn giải trừ Đạo Quả lưu trữ tại File ${slotId}? Dữ liệu sẽ không thể khôi phục!`)) return;
    try {
      const res = await fetch(`/api/meowcha/saves/${slotId}`, { method: "DELETE" });
      if (res.ok) {
        fetchSaveSlots();
        setToastMsg(`Đã giải trừ Đạo Quả File ${slotId} về trạng thái trống!`);
        setTimeout(() => setToastMsg(null), 3000);
      }
    } catch (e) {
      console.warn("Xóa file thất bại:", e);
    }
  };

  if (!mounted) return null;

  const totalPages = Math.max(1, Math.ceil(vocabTotal / 60));

  return (
    <div className="min-h-screen bg-[#100905] text-[#fbf8ea] flex flex-col font-serif select-none overflow-x-hidden">
      
      {/* ===================================================================== */}
      {/* 1. MASTER XIANXIA RIBBON BAR (CỔ PHONG TIÊN ĐẠO - 44PX) */}
      {/* ===================================================================== */}
      <header className="w-full bg-gradient-to-r from-[#1a1008] via-[#24170d] to-[#1a1008] border-b-2 border-[#6d4a1b] px-3 sm:px-6 py-1.5 flex items-center justify-between shadow-[0_4px_25px_rgba(0,0,0,0.9)] z-30 sticky top-0 shrink-0">
        
        {/* Left: Brand & Back to Games Hub */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/games"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#281a10] hover:bg-[#3d2719] text-[#ffdf79] rounded border border-[#6d4a1b] text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Games Hub</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs sm:text-sm text-[#ffdf79] tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate max-w-[200px] sm:max-w-none">
              🍵 MEOW-CHA: VẠN KIẾM QUY TÔNG
            </span>
            <span className="hidden lg:inline-block px-1.5 py-0.2 bg-[#b5372d] text-[#ffdf79] text-[10px] font-mono rounded border border-[#ca8a04]">
              IELTS 4.0 - 8.5+
            </span>
          </div>
        </div>

        {/* Center: Ancient Seal Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab("arena")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              activeTab === "arena"
                ? "bg-gradient-to-b from-[#b5372d] to-[#7f1d1d] text-[#ffdf79] border border-[#ca8a04] shadow-[0_0_12px_rgba(181,55,45,0.7)] scale-105"
                : "bg-[#281a10] text-[#d8ccb0] hover:text-[#ffdf79] border border-[#6d4a1b] hover:border-[#ca8a04]"
            }`}
          >
            <Swords className="w-3.5 h-3.5 text-[#ffdf79]" />
            <span>Độ Kiếp Đài</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("leaderboard");
              fetchLeaderboard();
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              activeTab === "leaderboard"
                ? "bg-gradient-to-b from-[#b5372d] to-[#7f1d1d] text-[#ffdf79] border border-[#ca8a04] shadow-[0_0_12px_rgba(181,55,45,0.7)] scale-105"
                : "bg-[#281a10] text-[#d8ccb0] hover:text-[#ffdf79] border border-[#6d4a1b] hover:border-[#ca8a04]"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-[#ffdf79]" />
            <span>Phong Thần</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("saves");
              fetchSaveSlots();
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              activeTab === "saves"
                ? "bg-gradient-to-b from-[#b5372d] to-[#7f1d1d] text-[#ffdf79] border border-[#ca8a04] shadow-[0_0_12px_rgba(181,55,45,0.7)] scale-105"
                : "bg-[#281a10] text-[#d8ccb0] hover:text-[#ffdf79] border border-[#6d4a1b] hover:border-[#ca8a04]"
            }`}
          >
            <Save className="w-3.5 h-3.5 text-[#34d399]" />
            <span className="hidden sm:inline">Ngọc Giản</span> [Lưu]
          </button>

          <button
            onClick={() => {
              setActiveTab("vocab");
              fetchVocabList(1, selectedBand, debouncedSearch);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              activeTab === "vocab"
                ? "bg-gradient-to-b from-[#b5372d] to-[#7f1d1d] text-[#ffdf79] border border-[#ca8a04] shadow-[0_0_12px_rgba(181,55,45,0.7)] scale-105"
                : "bg-[#281a10] text-[#d8ccb0] hover:text-[#ffdf79] border border-[#6d4a1b] hover:border-[#ca8a04]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#60a5fa]" />
            <span className="hidden sm:inline">Đạo Tạng</span> [5000]
          </button>
        </div>

        {/* Right: Quick Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={reloadGameClient}
            className="p-1 px-2.5 bg-[#281a10] hover:bg-[#3d2719] text-[#d8ccb0] hover:text-[#ffdf79] rounded border border-[#6d4a1b] text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow"
            title="Làm mới trận địa"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#ffdf79]" />
            <span className="hidden md:inline">Khởi Động</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1 px-2.5 bg-[#281a10] hover:bg-[#3d2719] text-[#ffdf79] rounded border border-[#6d4a1b] text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow"
            title="Bật/Tắt Toàn Màn Hình"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Thu Nhỏ</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Toàn Màn</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. TAB 1: ĐỘ KIẾP ĐÀI (NATIVE REACT TSX + CANVAS GAME ENGINE) */}
      {/* ===================================================================== */}
      {activeTab === "arena" && (
        <main className="flex-1 w-full h-[calc(100vh-44px)] bg-[#100804] flex flex-col items-center justify-center p-0 m-0 overflow-hidden relative" id="meowcha-frame-container">
          <MeowchaGame
            key={gameKey}
            currentUser={currentUser}
            onScoreSubmitted={() => fetchLeaderboard()}
            targetInitialWord={targetWord}
            loadedSave={activeLoadedSave}
            onOpenLeaderboardTab={() => {
              setActiveTab("leaderboard");
              fetchLeaderboard();
            }}
            onOpenSavesTab={() => {
              setActiveTab("saves");
              fetchSaveSlots();
            }}
            onOpenVocabTab={() => {
              setActiveTab("vocab");
              fetchVocabList(1, selectedBand, debouncedSearch);
            }}
          />
        </main>
      )}

      {/* ===================================================================== */}
      {/* 3. TAB 2: BẢNG PHONG THẦN TIÊN GIỚI (AUTHENTIC XIANXIA GOLD TABLET) */}
      {/* ===================================================================== */}
      {activeTab === "leaderboard" && (
        <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 flex flex-col gap-5">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#6d4a1b] pb-3 bg-[#1e130b] p-4 rounded-xl shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#2c1a0f] border-2 border-[#ffdf79] flex items-center justify-center shadow-[0_0_12px_rgba(255,223,121,0.3)]">
                <Trophy className="w-6 h-6 text-[#ffdf79]" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#ffdf79] tracking-wider drop-shadow">
                  BẢNG PHONG THẦN TIÊN GIỚI
                </h2>
                <p className="text-xs text-[#d8ccb0]">
                  Khắc ghi danh tính cao thủ trảm ma thạch IELTS • Dữ liệu lưu trực tiếp tại SQL Database
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              

              <button
                onClick={fetchLeaderboard}
                disabled={loadingLeaderboard}
                className="px-3.5 py-1.5 bg-[#2c1a0f] hover:bg-[#3d2516] text-[#ffdf79] rounded-lg border border-[#6d4a1b] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLeaderboard ? "animate-spin" : ""}`} />
                <span>Khảo Chứng</span>
              </button>
            </div>
          </div>

          {/* Top 3 Podium Highlights */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Á Quân (#2) */}
              <div className="order-2 sm:order-1 p-3.5 bg-gradient-to-b from-[#24170d] to-[#1c1109] rounded-xl border-2 border-[#94a3b8]/60 flex flex-col items-center gap-2 text-center shadow-lg relative">
                <span className="text-2xl">🥈</span>
                <span className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider">Á Quân Tiên Khách</span>
                <span className="text-base font-bold text-[#fbf8ea] truncate max-w-full">{leaderboard[1]?.player_name}</span>
                <span className="px-2 py-0.5 bg-[#2c1a0f] text-[#ffdf79] text-xs rounded border border-[#6d4a1b] font-mono font-bold">
                  {leaderboard[1]?.score.toLocaleString()} pts
                </span>
                <span className="text-[11px] text-[#98b06f]">{leaderboard[1]?.realm} • {leaderboard[1]?.wpm} WPM</span>
              </div>

              {/* Quán Quân (#1) */}
              <div className="order-1 sm:order-2 p-4 bg-gradient-to-b from-[#3a2012] to-[#24140a] rounded-xl border-2 border-[#ffdf79] flex flex-col items-center gap-2 text-center shadow-[0_0_20px_rgba(255,223,121,0.25)] relative sm:-translate-y-1">
                <span className="text-3xl">🥇</span>
                <span className="text-xs font-bold text-[#ffdf79] uppercase tracking-wider">Chu Sa Quán Quân</span>
                <span className="text-lg font-bold text-[#ffdf79] truncate max-w-full">{leaderboard[0]?.player_name}</span>
                <span className="px-3 py-1 bg-gradient-to-b from-[#b5372d] to-[#7f1d1d] text-[#ffdf79] text-sm rounded border border-[#ca8a04] font-mono font-bold shadow">
                  {leaderboard[0]?.score.toLocaleString()} pts
                </span>
                <span className="text-xs text-[#34d399] font-semibold">{leaderboard[0]?.realm} • {leaderboard[0]?.wpm} WPM</span>
              </div>

              {/* Quý Quân (#3) */}
              <div className="order-3 p-3.5 bg-gradient-to-b from-[#24170d] to-[#1c1109] rounded-xl border-2 border-[#b45309]/60 flex flex-col items-center gap-2 text-center shadow-lg relative">
                <span className="text-2xl">🥉</span>
                <span className="text-xs font-bold text-[#fde68a] uppercase tracking-wider">Quý Quân Đạo Sĩ</span>
                <span className="text-base font-bold text-[#fbf8ea] truncate max-w-full">{leaderboard[2]?.player_name}</span>
                <span className="px-2 py-0.5 bg-[#2c1a0f] text-[#ffdf79] text-xs rounded border border-[#6d4a1b] font-mono font-bold">
                  {leaderboard[2]?.score.toLocaleString()} pts
                </span>
                <span className="text-[11px] text-[#98b06f]">{leaderboard[2]?.realm} • {leaderboard[2]?.wpm} WPM</span>
              </div>
            </div>
          )}

          {/* Leaderboard Table Card */}
          <div className="w-full bg-[#1e130b] rounded-xl border-2 border-[#6d4a1b] overflow-hidden shadow-2xl">
            <div className="grid grid-cols-12 bg-[#2c1a0f] px-4 py-3 border-b-2 border-[#6d4a1b] text-xs font-bold text-[#ffdf79] uppercase tracking-wider">
              <span className="col-span-1 text-center">Hạng</span>
              <span className="col-span-4 sm:col-span-4">Đạo Hiệu / Tu Sĩ</span>
              <span className="col-span-3 sm:col-span-3">Cảnh Giới</span>
              <span className="col-span-2 text-right">Tu Vi</span>
              <span className="col-span-2 text-right">Kiếm Tốc</span>
            </div>

            <div className="divide-y divide-[#3d2516]">
              {leaderboard.length === 0 ? (
                <div className="p-10 flex flex-col items-center justify-center gap-3 text-center">
                  <span className="text-3xl">📜</span>
                  <h4 className="font-bold text-sm text-[#ffdf79]">CHƯA CÓ ĐẠO HỮU NÀO LƯU DANH THIÊN CỔ</h4>
                  <p className="text-xs text-[#d8ccb0] max-w-md">
                    Bảng Phong Thần đang chờ đợi vị Chân Nhân đầu tiên trảm ma thạch IELTS. Hãy bước vào trận địa độ kiếp ngay!
                  </p>
                  <button
                    onClick={() => setActiveTab("arena")}
                    className="mt-2 px-5 py-2 bg-gradient-to-b from-[#15803d] to-[#14532d] hover:brightness-110 text-[#fbf8ea] rounded-xl border border-[#22c55e] text-xs font-bold flex items-center gap-2 cursor-pointer shadow"
                  >
                    <Swords className="w-4 h-4 text-[#ffdf79]" />
                    <span>▶ Vào Trận Độ Kiếp Ngay</span>
                  </button>
                </div>
              ) : (
                leaderboard.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className={`grid grid-cols-12 px-4 py-3 items-center text-xs transition-colors hover:bg-[#2c1a0f]/90 ${
                      idx === 0
                        ? "bg-[#3a2012]/40 text-[#ffdf79]"
                        : idx === 1
                        ? "bg-[#28160c]/30 text-[#e2e8f0]"
                        : idx === 2
                        ? "bg-[#24130a]/20 text-[#fed7aa]"
                        : "text-[#d8ccb0]"
                    }`}
                  >
                    {/* Hạng */}
                    <span className="col-span-1 text-center font-mono font-bold text-sm">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                    </span>

                    {/* Tên */}
                    <div className="col-span-4 flex items-center gap-2">
                      <span className="font-bold text-sm text-[#fbf8ea] truncate">
                        {item.player_name}
                      </span>
                      {idx === 0 && (
                        <span className="px-1.5 py-0.2 bg-[#b5372d] text-[#ffdf79] text-[9px] font-mono rounded font-bold border border-[#ca8a04]">
                          TOP 1
                        </span>
                      )}
                    </div>

                    {/* Cảnh Giới */}
                    <div className="col-span-3">
                      <span className="px-2 py-0.5 bg-[#2c1a0f] text-[#34d399] rounded border border-[#6d4a1b] text-xs font-semibold">
                        {item.realm || "Luyện Khí Kỳ"}
                      </span>
                    </div>

                    {/* Điểm Tu Vi */}
                    <span className="col-span-2 text-right font-mono font-bold text-[#ffdf79] text-sm">
                      {item.score.toLocaleString()} <span className="text-[10px] text-[#d8ccb0]">pts</span>
                    </span>

                    {/* Kiếm Tốc WPM */}
                    <span className="col-span-2 text-right font-mono text-[#98b06f] font-semibold">
                      {item.wpm} <span className="text-[10px] text-[#d8ccb0]">WPM</span>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      )}



      {/* ===================================================================== */}
      {/* 4. TAB 3: NGỌC GIẢN LƯU TRỮ TU VI (3 CLOUD SLOTS) */}
      {/* ===================================================================== */}
      {activeTab === "saves" && (
        <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 flex flex-col gap-5">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#6d4a1b] pb-3 bg-[#1e130b] p-4 rounded-xl shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#2c1a0f] border-2 border-[#34d399] flex items-center justify-center shadow-[0_0_12px_rgba(52,211,153,0.3)]">
                <Save className="w-6 h-6 text-[#34d399]" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#ffdf79] tracking-wider drop-shadow">
                  NGỌC GIẢN LƯU TRỮ TU VI (3 CLOUD SLOTS)
                </h2>
                <p className="text-xs text-[#d8ccb0]">
                  Lưu tiến trình vào SQL Database • F5 hoặc đổi máy vẫn nạp lại toàn vẹn 100%
                </p>
              </div>
            </div>

            <button
              onClick={fetchSaveSlots}
              disabled={loadingSaves}
              className="px-3.5 py-1.5 bg-[#2c1a0f] hover:bg-[#3d2516] text-[#ffdf79] rounded-lg border border-[#6d4a1b] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSaves ? "animate-spin" : ""}`} />
              <span>Đồng Bộ SQL</span>
            </button>
          </div>

          {/* 3 Jade Tablet Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(slotId => {
              const slot = saveSlots[slotId];
              const isOccupied = slot && slot.is_occupied;
              const slotTitle =
                slotId === 1
                  ? "FILE 1 - Bản Mệnh"
                  : slotId === 2
                  ? "FILE 2 - Hộ Đạo"
                  : "FILE 3 - Thí Luyện";

              return (
                <div
                  key={slotId}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between gap-4 shadow-xl ${
                    isOccupied
                      ? "bg-gradient-to-b from-[#24170e] to-[#1c1109] border-[#6d4a1b] hover:border-[#ffdf79]"
                      : "bg-[#1c1109]/70 border-dashed border-[#543924]"
                  }`}
                >
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between border-b border-[#543924] pb-2">
                      <span className="font-bold text-sm text-[#ffdf79]">{slotTitle}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          isOccupied
                            ? "bg-[#15803d] text-[#fbf8ea] border border-[#22c55e]"
                            : "bg-[#2c1a0f] text-[#d8ccb0] border border-[#543924]"
                        }`}
                      >
                        {isOccupied ? "ĐÃ LƯU" : "TRỐNG"}
                      </span>
                    </div>

                    <div className="p-3 bg-[#170e07] rounded-lg border border-[#3d2516] flex flex-col gap-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#d8ccb0]">Cảnh Giới:</span>
                        <span className="font-bold text-[#ffdf79]">
                          {isOccupied ? slot.realm : "--"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#d8ccb0]">Khí Huyết:</span>
                        <span className="font-mono text-[#34d399] font-bold">
                          {isOccupied ? `${slot.hp} / ${slot.max_hp} HP` : "--"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#d8ccb0]">Tu Vi Đạt:</span>
                        <span className="font-mono font-bold text-[#ffdf79]">
                          {isOccupied ? `${slot.score.toLocaleString()} pts` : "--"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#d8ccb0]">Đã Trảm:</span>
                        <span className="font-mono text-[#98b06f]">
                          {isOccupied ? `${slot.words_slain} Từ` : "--"}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-[#8c7a65] pt-1.5 border-t border-[#3d2516] mt-1">
                        <span>Cập nhật:</span>
                        <span>{slot?.updated_at || "--"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Nạp vào trận & Xóa */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => isOccupied && handleLoadSlotIntoGame(slot)}
                      disabled={!isOccupied}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isOccupied
                          ? "bg-gradient-to-b from-[#15803d] to-[#14532d] hover:brightness-110 text-[#fbf8ea] border border-[#22c55e] shadow active:scale-95"
                          : "bg-[#2c1a0f] text-[#6d5b4a] cursor-not-allowed border border-[#3d2516]"
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>NẠP VÀO TRẬN</span>
                    </button>

                    {isOccupied && (
                      <button
                        onClick={() => handleDeleteSlot(slotId)}
                        className="p-2 bg-[#3a1515] hover:bg-[#521b1b] text-[#fca5a5] rounded-lg border border-[#7f1d1d] text-xs font-bold transition-all active:scale-95 cursor-pointer"
                        title="Giải trừ ngọc giản này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* ===================================================================== */}
      {/* 5. TAB 4: ĐẠO TẠNG TỪ VỰNG IELTS (KHO OXFORD 5000) */}
      {/* ===================================================================== */}
      {activeTab === "vocab" && (
        <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 flex flex-col gap-4">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#6d4a1b] pb-3 bg-[#1e130b] p-4 rounded-xl shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#2c1a0f] border-2 border-[#60a5fa] flex items-center justify-center shadow-[0_0_12px_rgba(96,165,250,0.3)]">
                <BookOpen className="w-6 h-6 text-[#60a5fa]" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#ffdf79] tracking-wider drop-shadow">
                  ĐẠO TẠNG TỪ VỰNG IELTS (KHO OXFORD 5000)
                </h2>
                <p className="text-xs text-[#d8ccb0]">
                  Kho từ vựng 5,946 từ chuẩn Oxford CEFR • Bấm loa để nghe phát âm giọng bản xứ chuẩn xác
                </p>
              </div>
            </div>

            {/* Real-time Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#ffdf79] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tra từ Anh hoặc nghĩa Việt..."
                value={vocabSearch}
                onChange={e => setVocabSearch(e.target.value)}
                className="w-full bg-[#2c1a0f] border border-[#6d4a1b] rounded-lg pl-9 pr-3 py-2 text-xs text-[#fbf8ea] placeholder-[#8c7a65] focus:outline-none focus:border-[#ffdf79]"
              />
              {vocabSearch && (
                <button
                  onClick={() => setVocabSearch("")}
                  className="absolute right-2.5 top-2 text-[#8c7a65] hover:text-[#ffdf79] text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Band Filters & Total count */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#1e130b] p-3 rounded-lg border border-[#543924]">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "all", label: "Tất Cả (5000+)" },
                { id: 0, label: "Band 4.0 - 5.0 [ BĂNG PHÁCH ]" },
                { id: 1, label: "Band 6.0 - 6.5 [ HỎA DIỄM ]" },
                { id: 2, label: "Band 7.0 - 7.5 [ HƯ KHÔNG ]" },
                { id: 3, label: "Band 8.0+ [ HUYẾT LÔI ]" }
              ].map(b => (
                <button
                  key={String(b.id)}
                  onClick={() => {
                    setSelectedBand(b.id as any);
                    setVocabPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedBand === b.id
                      ? "bg-gradient-to-b from-[#b5372d] to-[#7f1d1d] text-[#ffdf79] border border-[#ca8a04] shadow"
                      : "bg-[#2c1a0f] text-[#d8ccb0] hover:bg-[#3d2516] border border-[#6d4a1b]"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-[#ffdf79] font-mono">
              Khớp {vocabTotal.toLocaleString()} từ
            </span>
          </div>

          {/* Vocab Cards Grid */}
          {loadingVocab ? (
            <div className="p-12 text-center text-[#ffdf79] flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Đang tra cứu Đạo Tạng Oxford 5000...</span>
            </div>
          ) : vocabList.length === 0 ? (
            <div className="p-12 text-center text-[#d8ccb0] bg-[#1e130b] rounded-xl border border-[#543924]">
              Không tìm thấy từ vựng nào phù hợp với từ khóa "{vocabSearch}". Vui lòng thử lại!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {vocabList.map(item => {
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
                    className="p-3.5 bg-[#1e130b] rounded-xl border border-[#543924] hover:border-[#ffdf79] transition-all flex flex-col justify-between gap-2.5 shadow-lg"
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-base text-[#ffdf79] tracking-wider">
                          {item.word}
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold ${badgeColor}`}>
                          {item.asteroid_type}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-[#98b06f] italic">{item.ipa}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-[#2c1a0f] text-[#d8ccb0] rounded border border-[#543924]">
                          {item.type}
                        </span>
                      </div>

                      <p className="text-xs text-[#fbf8ea] mt-1 leading-relaxed">
                        {item.meaning}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#3d2516] flex items-center justify-between">
                      <button
                        onClick={() => playWordAudio(item.word)}
                        className="flex items-center gap-1 text-[11px] text-[#34d399] hover:text-[#6ee7b7] font-semibold cursor-pointer"
                        title="Nghe phát âm chuẩn giọng bản xứ"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Nghe Đạo Âm</span>
                      </button>

                      <button
                        onClick={() => handleLaunchTargetWord(item.word)}
                        className="text-[11px] text-[#ffdf79] hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                        title="Khởi động trận đánh với từ này"
                      >
                        <span>Vào trận trảm từ này</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 py-3 mt-2">
              <button
                onClick={() => setVocabPage(p => Math.max(1, p - 1))}
                disabled={vocabPage <= 1}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 ${
                  vocabPage <= 1
                    ? "bg-[#1e130b] text-[#543924] border-[#3d2516] cursor-not-allowed"
                    : "bg-[#2c1a0f] text-[#ffdf79] border-[#6d4a1b] hover:bg-[#3d2516] cursor-pointer"
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trang Trước</span>
              </button>

              <span className="text-xs font-mono text-[#d8ccb0]">
                Trang <span className="text-[#ffdf79] font-bold">{vocabPage}</span> / {totalPages}
              </span>

              <button
                onClick={() => setVocabPage(p => Math.min(totalPages, p + 1))}
                disabled={vocabPage >= totalPages}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 ${
                  vocabPage >= totalPages
                    ? "bg-[#1e130b] text-[#543924] border-[#3d2516] cursor-not-allowed"
                    : "bg-[#2c1a0f] text-[#ffdf79] border-[#6d4a1b] hover:bg-[#3d2516] cursor-pointer"
                }`}
              >
                <span>Trang Tiếp</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </main>
      )}

      {/* ===================================================================== */}
      {/* 6. TOAST NOTIFICATION BADGE (ANCIENT GOLD SEAL) */}
      {/* ===================================================================== */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-[#2c1a0f] to-[#1c1109] text-[#ffdf79] border-2 border-[#ca8a04] px-4 py-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.9)] text-xs flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-4 h-4 text-[#ca8a04] shrink-0" />
          <span className="font-bold">{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
