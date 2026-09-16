// components/meowcha/MeowchaGame.tsx - Native React & Canvas Xianxia Typing Game Engine
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Play, Pause, RefreshCw, Volume2, VolumeX, Shield, Swords, 
  Flame, Sparkles, Trophy, Heart, ArrowLeft, RotateCcw, AlertTriangle,
  Save, BookOpen, X, CheckCircle2, ChevronRight, Zap, Award
} from "lucide-react";

interface VocabWord {
  id: number;
  word: string;
  ipa: string;
  type: string;
  meaning: string;
  band_level: number;
  asteroid_type: string;
  difficulty_score: number;
}

interface Asteroid {
  id: number;
  word: string;
  ipa: string;
  meaning: string;
  type: string; // FROST, INFERNO, VOID, BLOOD_THUNDER, PRIMORDIAL
  x: number;
  y: number;
  speed: number;
  radius: number;
  color: string;
  glowColor: string;
  typedLen: number;
  wobbleSeed: number;
  wobbleSpeed: number;
  hitReaction: number;
}

interface SwordBeam {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  angle: number;
  color: string;
  alive: boolean;
  realm: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

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

const CULTIVATION_REALMS = [
  { 
    name: "Luyện Khí Kỳ", 
    title: "Tiểu Miêu Kiếm Đồng", 
    band: "4.0 - 5.0", 
    minScore: 0, 
    color: "#86efac", 
    swordName: "Thanh Trúc Kiếm", 
    swordColor: "#22c55e",
    spriteKey: "cat_idle",
    element: "Băng Phách Ma Thạch"
  },
  { 
    name: "Trúc Cơ Kỳ", 
    title: "Miêu Tiên Trúc Cơ", 
    band: "6.0 - 6.5", 
    minScore: 400, 
    color: "#67e8f9", 
    swordName: "Bích Ngọc Kiếm", 
    swordColor: "#06b6d4",
    spriteKey: "cat_idle", // With cyan aura
    element: "Hỏa Diễm Ma Thạch"
  },
  { 
    name: "Kim Đan Kỳ", 
    title: "Kim Đan Chân Nhân", 
    band: "7.0 - 7.5", 
    minScore: 1000, 
    color: "#fde047", 
    swordName: "Hoàng Kim Trảm Tiên", 
    swordColor: "#eab308",
    spriteKey: "cat_golden_core",
    element: "Hư Không Ma Thạch"
  },
  { 
    name: "Nguyên Anh Kỳ", 
    title: "Nguyên Anh Tiên Tôn", 
    band: "8.0+", 
    minScore: 2200, 
    color: "#c084fc", 
    swordName: "Cửu Thiên Thần Lôi", 
    swordColor: "#a855f7",
    spriteKey: "cat_nascent_soul",
    element: "Huyết Lôi Ma Thạch"
  },
  { 
    name: "Hóa Thần Kỳ", 
    title: "Thái Thượng Kiếm Tôn", 
    band: "Master C2", 
    minScore: 4500, 
    color: "#f43f5e", 
    swordName: "Thái Sơ Vô Cực Kiếm", 
    swordColor: "#f43f5e",
    spriteKey: "cat_celestial_sovereign",
    element: "Thái Sơ Hỗn Độn Thạch"
  }
];

const TALENT_POOL = [
  {
    id: "MAX_HP",
    icon: "🌿",
    name: "Cố Bản Bồi Nguyên",
    type: "Tâm Pháp Thể Chất",
    desc: "+25 Đan Điền Max HP và hồi phục toàn bộ sinh lực tức thời!",
    apply: (stats: any) => {
      stats.maxHp += 25;
      stats.hp = stats.maxHp;
    }
  },
  {
    id: "SLOW_TIME",
    icon: "⏳",
    name: "Định Thần Thanh Tâm",
    type: "Tâm Pháp Tinh Thần",
    desc: "Làm chậm -25% tốc độ rơi của toàn bộ Thiên Thạch Cổ Ngữ!",
    apply: (stats: any) => {
      stats.slowFactor *= 0.75;
    }
  },
  {
    id: "CRIT_STRIKE",
    icon: "⚡",
    name: "Nhất Kiếm Phân Thần",
    type: "Kiếm Đạo Chí Mạng",
    desc: "35% Tỷ lệ xuất hiện Bạo Kích trảm kép thêm 1 ma thạch lân cận!",
    apply: (stats: any) => {
      stats.critChance += 0.35;
    }
  },
  {
    id: "SCORE_FOCUS",
    icon: "🎯",
    name: "Thần Niệm Tỏa Định",
    type: "Tâm Đạo Ngộ Đạo",
    desc: "Gia tăng vĩnh viễn +50% Điểm Tu Vi thu hoạch sau mỗi từ trảm phá!",
    apply: (stats: any) => {
      stats.scoreMultiplier += 0.5;
    }
  },
  {
    id: "GOLDEN_SHIELD",
    icon: "🛡️",
    name: "Kim Chung Trào Hộ Thể",
    type: "Hộ Thân Thần Chú",
    desc: "Ngưng tụ 2 tầng Linh Thuẫn Kim Chung, chặn 2 lần ma thạch chạm đáy!",
    apply: (stats: any) => {
      stats.shieldCharges += 2;
    }
  },
  {
    id: "AUTO_SWORD",
    icon: "🌪️",
    name: "Vạn Kiếm Tự Động Trận",
    type: "Kiếm Trận Thần Thông",
    desc: "Mỗi khi đạt Combo x3 liên tiếp, tự phóng phi kiếm trảm diệt ma thạch tiếp theo!",
    apply: (stats: any) => {
      stats.autoKill = true;
    }
  }
];

// Virtual Keyboard Layout
const KB_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"]
];

export const MeowchaGame: React.FC<{
  currentUser?: any;
  onScoreSubmitted?: (score: number, realm: string) => void;
  targetInitialWord?: string | null;
  loadedSave?: any | null;
  onOpenLeaderboardTab?: () => void;
  onOpenSavesTab?: () => void;
  onOpenVocabTab?: () => void;
}> = ({
  currentUser,
  onScoreSubmitted,
  targetInitialWord,
  loadedSave,
  onOpenLeaderboardTab,
  onOpenSavesTab,
  onOpenVocabTab
}) => {
  // Game View Modes
  const [viewMode, setViewMode] = useState<"lobby" | "battle">("lobby");
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // In-game Modals
  const [showInGameLeaderboard, setShowInGameLeaderboard] = useState(false);
  const [showInGameSaveModal, setShowInGameSaveModal] = useState(false);
  const [showBreakthroughModal, setShowBreakthroughModal] = useState(false);
  const [talentChoices, setTalentChoices] = useState<typeof TALENT_POOL>([]);
  const [saveSlotsList, setSaveSlotsList] = useState<any[]>([]);
  const [savingSlotId, setSavingSlotId] = useState<number | null>(null);

  // Live in-game stats for UI display
  const [hp, setHp] = useState(50);
  const [maxHp, setMaxHp] = useState(50);
  const [shieldCount, setShieldCount] = useState(0);
  const [score, setScore] = useState(0);
  const [wordsSlain, setWordsSlain] = useState(0);
  const [currentRealmIdx, setCurrentRealmIdx] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [combo, setCombo] = useState(0);
  const [activeWordCard, setActiveWordCard] = useState<VocabWord | null>(null);
  const [typedLetters, setTypedLetters] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Canvas & Engine Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Game Engine mutable state
  const asteroidsRef = useRef<Asteroid[]>([]);
  const swordsRef = useRef<SwordBeam[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const vocabDeckRef = useRef<VocabWord[]>([]);
  const vocabPageRef = useRef<number>(1);
  const isFetchingVocabRef = useRef<boolean>(false);

  const statsRef = useRef({
    hp: 50,
    maxHp: 50,
    shieldCharges: 0,
    score: 0,
    wordsSlain: 0,
    realmIdx: 0,
    combo: 0,
    startTime: 0,
    correctKeystrokes: 0,
    totalKeystrokes: 0,
    screenShake: 0,
    stunTimer: 0,
    catLunge: 0,
    slowFactor: 1.0,
    critChance: 0.0,
    scoreMultiplier: 1.0,
    autoKill: false,
    catState: "IDLE",
    speechText: "",
    speechTimer: 0
  });

  // Assets Cache
  const assetsRef = useRef<{ [key: string]: HTMLImageElement }>({});
  const assetsLoadedRef = useRef(false);

  // 1. Determine Player Account Name
  const getPlayerAccountName = useCallback(() => {
    if (currentUser && (currentUser.username || currentUser.full_name || currentUser.name)) {
      return currentUser.username || currentUser.full_name || currentUser.name;
    }
    if (typeof window !== "undefined") {
      try {
        const localUser = localStorage.getItem("oasis_user");
        if (localUser) {
          const parsed = JSON.parse(localUser);
          if (parsed.username || parsed.full_name || parsed.email) {
            return parsed.username || parsed.full_name || parsed.email.split("@")[0];
          }
        }
        const guestId = localStorage.getItem("oasis_guest_id");
        if (guestId) return `Đạo Hữu [${guestId.slice(0, 6)}]`;
      } catch (e) {}
    }
    return "Tiên Khách Vô Danh";
  }, [currentUser]);

  // 2. Preload Assets & Detect Mobile
  useEffect(() => {
    // Check mobile screen
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Preload sprites
    const assetList: { key: string; src: string }[] = [
      { key: "bg", src: "/meowcha/bg_study_sanctuary.jpg" },
      { key: "cat_idle", src: "/meowcha/sprites/cat_idle.png" },
      { key: "cat_golden_core", src: "/meowcha/sprites/cat_golden_core.png" },
      { key: "cat_nascent_soul", src: "/meowcha/sprites/cat_nascent_soul.png" },
      { key: "cat_celestial_sovereign", src: "/meowcha/sprites/cat_celestial_sovereign.png" },
      { key: "cat_hurt", src: "/meowcha/sprites/cat_hurt.png" },
      { key: "cat_defeated", src: "/meowcha/sprites/cat_defeated.png" },
      { key: "cat_attack", src: "/meowcha/sprites/cat_weak_attack.png" },
      { key: "prop_asteroid", src: "/meowcha/sprites/prop_asteroid.png" },
      { key: "prop_slash", src: "/meowcha/sprites/prop_sword_slash.png" },
      { key: "prop_explosion", src: "/meowcha/sprites/prop_tea_explosion.png" }
    ];

    let loaded = 0;
    assetList.forEach(item => {
      const img = new Image();
      img.onload = () => {
        loaded++;
        if (loaded >= assetList.length) assetsLoadedRef.current = true;
      };
      img.src = item.src;
      assetsRef.current[item.key] = img;
    });

    // Load initial Oxford 5000 vocab pool
    fetchVocabFromSQL(0, 1);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 3. Dynamic Oxford 5000 Fetcher from Backend SQL
  const fetchVocabFromSQL = async (band: number, page: number) => {
    if (isFetchingVocabRef.current) return;
    isFetchingVocabRef.current = true;
    try {
      const res = await fetch(`/api/meowcha/vocab?band=${band}&page=${page}&page_size=60`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          vocabDeckRef.current = [...vocabDeckRef.current, ...json.data];
          vocabPageRef.current = page + 1;
        }
      }
    } catch (e) {
      console.warn("Could not fetch SQL vocab, using default xianxia bank.");
    } finally {
      isFetchingVocabRef.current = false;
    }
  };

  // 4. Sound Synthesis
  const playSound = useCallback((type: "slash" | "hit" | "kill" | "hurt" | "level" | "thunder") => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "slash") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(1300, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "kill") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.22);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === "hurt") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.28);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === "level") {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const chordOsc = ctx.createOscillator();
          const chordGain = ctx.createGain();
          chordOsc.type = "sine";
          chordOsc.frequency.setValueAtTime(freq, now + idx * 0.06);
          chordGain.gain.setValueAtTime(0.12, now + idx * 0.06);
          chordGain.gain.linearRampToValueAtTime(0.01, now + idx * 0.06 + 0.4);
          chordOsc.connect(chordGain);
          chordGain.connect(ctx.destination);
          chordOsc.start(now + idx * 0.06);
          chordOsc.stop(now + idx * 0.06 + 0.45);
        });
      }
    } catch (e) {}
  }, [soundEnabled]);

  // 5. Automatic Score Submission to SQL Leaderboard
  const submitScoreToSQL = useCallback(async () => {
    const finalScore = statsRef.current.score;
    if (finalScore <= 0) return;

    const playerName = getPlayerAccountName();
    const realmName = CULTIVATION_REALMS[statsRef.current.realmIdx]?.name || "Luyện Khí Kỳ";
    const durationMin = Math.max(0.1, (Date.now() - statsRef.current.startTime) / 60000);
    const finalWpm = Math.round((statsRef.current.correctKeystrokes / 5) / durationMin);
    const accuracy = Math.round((statsRef.current.correctKeystrokes / Math.max(1, statsRef.current.totalKeystrokes)) * 100);

    try {
      const payload = {
        player_name: playerName,
        score: finalScore,
        words_slain: statsRef.current.wordsSlain,
        realm: realmName,
        accuracy: Math.min(100, Math.max(50, accuracy)),
        wpm: Math.min(180, Math.max(5, finalWpm))
      };

      const res = await fetch("/api/meowcha/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        if (onScoreSubmitted) onScoreSubmitted(finalScore, realmName);
      }
    } catch (e) {
      console.warn("Could not auto-submit score to MySQL:", e);
    }
  }, [getPlayerAccountName, onScoreSubmitted]);

  // 6. Spawn New Asteroids (Progression over time)
  const spawnAsteroid = useCallback((forceWord?: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check deck size, replenish if low
    if (vocabDeckRef.current.length < 15) {
      fetchVocabFromSQL(statsRef.current.realmIdx, vocabPageRef.current);
    }

    let item: VocabWord;
    if (forceWord) {
      item = {
        id: Date.now(),
        word: forceWord.toUpperCase(),
        ipa: "/.../",
        type: "cổ ngữ",
        meaning: "Chỉ định trảm ma",
        band_level: statsRef.current.realmIdx,
        asteroid_type: "INFERNO",
        difficulty_score: forceWord.length * 5
      };
    } else if (vocabDeckRef.current.length > 0) {
      const isGodRealm = statsRef.current.realmIdx >= 4;
      // DẠNG THẦN CAO NHẤT (THÁI THƯỢNG KIẾM TÔN):
      // Ngẫu nhiên toàn bộ từ vựng từ đầu đến cuối (tất cả các Band 4.0 - 9.0 Oxford 5000), không giới hạn band
      const matching = isGodRealm 
        ? vocabDeckRef.current 
        : vocabDeckRef.current.filter(w => w.band_level <= statsRef.current.realmIdx);
      const pool = matching.length > 0 ? matching : vocabDeckRef.current;
      const idx = Math.floor(Math.random() * pool.length);
      item = pool[idx];
      // remove used word
      vocabDeckRef.current.splice(idx, 1);
    } else {
      item = {
        id: Date.now(),
        word: "ALERT",
        ipa: "/əˈlɜːt/",
        type: "adj",
        meaning: "Cảnh giác, tỉnh táo, lanh lẹ",
        band_level: 0,
        asteroid_type: "FROST",
        difficulty_score: 5
      };
    }

    const rIdx = statsRef.current.realmIdx;
    const word = item.word.toUpperCase();
    const asteroidTypes = ["FROST", "INFERNO", "VOID", "BLOOD_THUNDER", "PRIMORDIAL"];
    const type = asteroidTypes[rIdx] || "FROST";

    let color = "#38bdf8";
    let glow = "rgba(56, 189, 248, 0.7)";
    if (type === "INFERNO") {
      color = "#f97316";
      glow = "rgba(249, 115, 22, 0.7)";
    } else if (type === "VOID") {
      color = "#c084fc";
      glow = "rgba(192, 132, 252, 0.8)";
    } else if (type === "BLOOD_THUNDER") {
      color = "#f43f5e";
      glow = "rgba(244, 63, 94, 0.85)";
    } else if (type === "PRIMORDIAL") {
      color = "#eab308";
      glow = "rgba(234, 179, 8, 0.9)";
    }

    const padding = Math.max(60, canvas.width * 0.15);
    const spawnX = Math.random() * (canvas.width - padding * 2) + padding;
    let baseSpeed = (0.45 + rIdx * 0.12 + Math.min(0.8, statsRef.current.wordsSlain * 0.02)) * statsRef.current.slowFactor;
    if (rIdx >= 4) {
      // DẠNG THẦN CAO NHẤT: Tốc độ rơi cực hạn
      baseSpeed *= 1.65;
    }

    asteroidsRef.current.push({
      id: Date.now() + Math.random(),
      word: word,
      ipa: item.ipa,
      meaning: item.meaning,
      type: type,
      x: spawnX,
      y: -50,
      speed: baseSpeed,
      radius: Math.max(38, word.length * 6.5),
      color: color,
      glowColor: glow,
      typedLen: 0,
      wobbleSeed: Math.random() * 100,
      wobbleSpeed: 1.5 + Math.random(),
      hitReaction: 0
    });

    setActiveWordCard(item);
  }, []);

  // 7. Start Game
  const startBattle = useCallback((initialWord?: string) => {
    // If loaded save exists, restore stats
    const initialHp = loadedSave?.hp || 50;
    const initialMaxHp = loadedSave?.max_hp || 50;
    const initialScore = loadedSave?.score || 0;
    const initialWords = loadedSave?.words_slain || 0;
    const initialRealm = loadedSave?.realm_idx || 0;

    statsRef.current = {
      hp: initialHp,
      maxHp: initialMaxHp,
      shieldCharges: loadedSave?.talents?.shieldCharges || 0,
      score: initialScore,
      wordsSlain: initialWords,
      realmIdx: initialRealm,
      combo: 0,
      startTime: Date.now(),
      correctKeystrokes: 0,
      totalKeystrokes: 0,
      screenShake: 0,
      stunTimer: 0,
      catLunge: 0,
      slowFactor: loadedSave?.talents?.slowFactor || 1.0,
      critChance: loadedSave?.talents?.critChance || 0.0,
      scoreMultiplier: loadedSave?.talents?.scoreMultiplier || 1.0,
      autoKill: loadedSave?.talents?.autoKill || false,
      catState: "IDLE",
      speechText: "Tiểu Miêu xuất trận! Kiếm chỉ ma thạch!",
      speechTimer: Date.now() + 2500
    };

    asteroidsRef.current = [];
    swordsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];

    setHp(initialHp);
    setMaxHp(initialMaxHp);
    setShieldCount(statsRef.current.shieldCharges);
    setScore(initialScore);
    setWordsSlain(initialWords);
    setCurrentRealmIdx(initialRealm);
    setCombo(0);
    setWpm(0);
    setIsPaused(false);
    setIsGameOver(false);
    setShowInGameLeaderboard(false);
    setShowInGameSaveModal(false);
    setShowBreakthroughModal(false);
    setViewMode("battle");

    setTimeout(() => spawnAsteroid(initialWord), 150);
  }, [loadedSave, spawnAsteroid]);

  // Handle external launch target word
  useEffect(() => {
    if (targetInitialWord) startBattle(targetInitialWord);
  }, [targetInitialWord, startBattle]);

  // Handle external load save
  useEffect(() => {
    if (loadedSave) startBattle();
  }, [loadedSave, startBattle]);

  // 8. Keystroke Processor (Hardware keyboard & Virtual keyboard & Screen Touch)
  const processInputChar = useCallback((inputChar: string) => {
    if (isGameOver || isPaused || statsRef.current.stunTimer > 0) return;

    const char = inputChar.toUpperCase();
    statsRef.current.totalKeystrokes++;

    const asteroids = asteroidsRef.current;
    if (asteroids.length === 0) return;

    // 1. Kiểm tra xem có ma thạch nào đang gõ dở không (typedLen > 0)
    let activeLockedTarget: Asteroid | null = null;
    for (const ast of asteroids) {
      if (ast.typedLen > 0 && ast.typedLen < ast.word.length) {
        activeLockedTarget = ast;
        break;
      }
    }

    let target: Asteroid | null = null;
    if (activeLockedTarget) {
      // KHÓA CỐ ĐỊNH TARGET: Đang gõ dở từ này thì TUYỆT ĐỐI không nhảy sang từ khác!
      if (activeLockedTarget.word[activeLockedTarget.typedLen] === char) {
        target = activeLockedTarget;
      } else {
        // Gõ sai ký tự tiếp theo của từ hiện tại: Rung nhẹ báo hiệu, giữ nguyên mục tiêu
        statsRef.current.screenShake = 3;
        playSynthSound("hurt");
        return;
      }
    } else {
      // Chưa gõ dở từ nào: Tìm ma thạch ở vị trí thấp nhất bắt đầu bằng ký tự này
      let lowestY = -9999;
      for (const ast of asteroids) {
        if (ast.typedLen === 0 && ast.word[0] === char) {
          if (ast.y > lowestY) {
            lowestY = ast.y;
            target = ast;
          }
        }
      }
    }

    if (target) {
      // HIT!
      target.typedLen++;
      target.hitReaction = 1.0;
      statsRef.current.correctKeystrokes++;
      statsRef.current.catLunge = 15;
      statsRef.current.catState = "ATTACK";

      setTypedLetters(target.word.slice(0, target.typedLen));

      // Spawn projectile sword beam from cat position
      const canvas = canvasRef.current;
      const catX = canvas ? canvas.width / 2 : 450;
      const catY = canvas ? canvas.height - 110 : 550;
      const angle = Math.atan2(target.y - catY, target.x - catX);

      swordsRef.current.push({
        x: catX,
        y: catY - 25,
        targetX: target.x,
        targetY: target.y,
        speed: 22,
        angle: angle,
        color: CULTIVATION_REALMS[statsRef.current.realmIdx]?.swordColor || "#22c55e",
        alive: true,
        realm: statsRef.current.realmIdx
      });

      playSound("slash");

      // Check Word Slain!
      if (target.typedLen >= target.word.length) {
        // Slain!
        statsRef.current.wordsSlain++;
        statsRef.current.combo++;

        const baseVal = target.word.length * 100;
        const gainedTuVi = Math.round(baseVal * (1 + statsRef.current.combo * 0.1) * statsRef.current.scoreMultiplier);
        statsRef.current.score += gainedTuVi;

        setScore(statsRef.current.score);
        setWordsSlain(statsRef.current.wordsSlain);
        setCombo(statsRef.current.combo);

        // Floating points
        floatingTextsRef.current.push({
          x: target.x,
          y: target.y - 15,
          text: `+${gainedTuVi} Tu Vi`,
          color: "#ffdf79",
          alpha: 1.0,
          vy: -1.6
        });

        // Particle explosion
        for (let i = 0; i < 22; i++) {
          const pAngle = Math.random() * Math.PI * 2;
          const pSpeed = Math.random() * 5 + 2;
          particlesRef.current.push({
            x: target.x,
            y: target.y,
            vx: Math.cos(pAngle) * pSpeed,
            vy: Math.sin(pAngle) * pSpeed,
            color: target.color,
            size: Math.random() * 4 + 2,
            alpha: 1.0,
            decay: 0.025 + Math.random() * 0.02
          });
        }

        playSound("kill");
        setTypedLetters("");

        // Remove from active asteroids
        asteroidsRef.current = asteroidsRef.current.filter(a => a.id !== target!.id);

        // Auto-kill talent check (Combo x3)
        if (statsRef.current.autoKill && statsRef.current.combo % 3 === 0 && asteroidsRef.current.length > 0) {
          const nextTarget = asteroidsRef.current[0];
          nextTarget.typedLen = nextTarget.word.length;
          floatingTextsRef.current.push({
            x: nextTarget.x,
            y: nextTarget.y,
            text: "⚔️ VẠN KIẾM TỰ ĐỘNG TRẬN!",
            color: "#67e8f9",
            alpha: 1.2,
            vy: -1.5
          });
        }

        // Check CULTIVATION REALM BREAKTHROUGH!
        checkBreakthroughProgress();

        // Spawn next wave (1 or 2 asteroids depending on words slain)
        setTimeout(() => {
          spawnAsteroid();
          // At higher levels or survival time, occasionally drop a second asteroid!
          if (statsRef.current.wordsSlain > 5 && Math.random() < 0.35 && asteroidsRef.current.length < 2) {
            setTimeout(() => spawnAsteroid(), 800);
          }
        }, 300);
      }
    } else {
      // Typo deflection
      statsRef.current.catState = "HURT";
      statsRef.current.screenShake = 3;
      statsRef.current.combo = 0;
      setCombo(0);
      playSound("hurt");
    }
  }, [isGameOver, isPaused, playSound, spawnAsteroid]);

  // 9. Breakthrough Check
  const checkBreakthroughProgress = useCallback(() => {
    const curScore = statsRef.current.score;
    const curIdx = statsRef.current.realmIdx;

    for (let i = CULTIVATION_REALMS.length - 1; i >= 0; i--) {
      if (curScore >= CULTIVATION_REALMS[i].minScore) {
        if (i > curIdx) {
          // BREAKTHROUGH TRIGGERED!
          statsRef.current.realmIdx = i;
          setCurrentRealmIdx(i);
          playSound("level");

          // Pick 3 random talents
          const shuffled = [...TALENT_POOL].sort(() => Math.random() - 0.5);
          setTalentChoices(shuffled.slice(0, 3));
          setShowBreakthroughModal(true);
        }
        break;
      }
    }
  }, [playSound]);

  // Select Talent from Breakthrough Modal
  const handleSelectTalent = (talent: typeof TALENT_POOL[0]) => {
    talent.apply(statsRef.current);
    setHp(statsRef.current.hp);
    setMaxHp(statsRef.current.maxHp);
    setShieldCount(statsRef.current.shieldCharges);
    setShowBreakthroughModal(false);
    playSound("kill");
    setToastMsg(`Lĩnh ngộ thành công: ${talent.name}!`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Keyboard Event Listener
  useEffect(() => {
    if (viewMode !== "battle" || isPaused || isGameOver) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPaused(p => !p);
        return;
      }
      if (e.ctrlKey || e.altKey || e.metaKey || e.key.length !== 1) return;
      processInputChar(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, isPaused, isGameOver, processInputChar]);

  // 10. In-Game Save to SQL Slot
  const handleSaveToSQL = async (slotId: number) => {
    setSavingSlotId(slotId);
    try {
      const payload = {
        slot_id: slotId,
        slot_name: `FILE ${slotId} - ${CULTIVATION_REALMS[statsRef.current.realmIdx]?.title}`,
        is_occupied: true,
        realm: CULTIVATION_REALMS[statsRef.current.realmIdx]?.name || "Luyện Khí Kỳ",
        realm_idx: statsRef.current.realmIdx,
        title: CULTIVATION_REALMS[statsRef.current.realmIdx]?.title || "Kiếm Đồng",
        hp: statsRef.current.hp,
        max_hp: statsRef.current.maxHp,
        score: statsRef.current.score,
        words_slain: statsRef.current.wordsSlain,
        band_idx: statsRef.current.realmIdx,
        talents: {
          slowFactor: statsRef.current.slowFactor,
          critChance: statsRef.current.critChance,
          scoreMultiplier: statsRef.current.scoreMultiplier,
          shieldCharges: statsRef.current.shieldCharges,
          autoKill: statsRef.current.autoKill
        }
      };

      const res = await fetch(`/api/meowcha/saves/${slotId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setToastMsg(`Đã khắc ghi Đạo Quả vào Ngọc Giản File ${slotId}!`);
        setShowInGameSaveModal(false);
      }
    } catch (e) {
      console.warn("Save to SQL failed:", e);
    } finally {
      setSavingSlotId(null);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  // Fetch in-game leaderboard
  const openLeaderboardOverlay = async () => {
    setShowInGameLeaderboard(true);
    try {
      const res = await fetch("/api/meowcha/leaderboard?limit=20");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) setLeaderboardData(json.data);
      }
    } catch (e) {}
  };

  // Fetch in-game save slots
  const openSaveSlotsOverlay = async () => {
    setShowInGameSaveModal(true);
    try {
      const res = await fetch("/api/meowcha/saves");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) setSaveSlotsList(Object.values(json.data));
      }
    } catch (e) {}
  };

  // 11. Master Canvas Loop (60 FPS)
  useEffect(() => {
    if (viewMode !== "battle") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastFrameTime = performance.now();

    const loop = (timestamp: number) => {
      const dt = Math.min(0.05, (timestamp - lastFrameTime) / 1000);
      lastFrameTime = timestamp;

      // Handle Resize smoothly
      const width = canvas.width;
      const height = canvas.height;

      // Clear & Screen Shake
      ctx.clearRect(0, 0, width, height);
      ctx.save();

      if (statsRef.current.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * statsRef.current.screenShake * 2;
        const shakeY = (Math.random() - 0.5) * statsRef.current.screenShake * 2;
        ctx.translate(shakeX, shakeY);
        statsRef.current.screenShake = Math.max(0, statsRef.current.screenShake - dt * 15);
      }

      // 1. DRAW BACKGROUND (bg_study_sanctuary.jpg)
      const bgImg = assetsRef.current["bg"];
      if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
        ctx.drawImage(bgImg, 0, 0, width, height);
        // Subtle ambient darkening overlay
        ctx.fillStyle = "rgba(16, 8, 4, 0.25)";
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.fillStyle = "#100804";
        ctx.fillRect(0, 0, width, height);
      }

      // If paused or game over, stop updates
      if (!isPaused && !isGameOver && !showBreakthroughModal) {
        // Update WPM & Duration
        const durationMin = Math.max(0.05, (Date.now() - statsRef.current.startTime) / 60000);
        const curWpm = Math.round((statsRef.current.correctKeystrokes / 5) / durationMin);
        setWpm(curWpm);

        // Update stun timer
        if (statsRef.current.stunTimer > 0) {
          statsRef.current.stunTimer -= dt;
        }

        // UPDATE & DRAW ASTEROIDS
        const asteroids = asteroidsRef.current;
        const asteroidImg = assetsRef.current["prop_asteroid"];

        for (let i = asteroids.length - 1; i >= 0; i--) {
          const ast = asteroids[i];

          // Advance downward
          ast.y += ast.speed * 60 * dt;
          ast.wobbleSeed += ast.wobbleSpeed * dt;
          const wobbleX = Math.sin(ast.wobbleSeed) * 6;
          ast.x += wobbleX * dt * 4;

          // Check hit floor (Bottom platform reach ~ height - 140)
          if (ast.y >= height - 130) {
            // BREACH!
            asteroids.splice(i, 1);

            // Check shield charges
            if (statsRef.current.shieldCharges > 0) {
              statsRef.current.shieldCharges--;
              setShieldCount(statsRef.current.shieldCharges);
              floatingTextsRef.current.push({
                x: ast.x,
                y: height - 140,
                text: "🛡️ KIM CHUNG TRÀO HỘ THỂ CHẶN ĐÒN!",
                color: "#fde047",
                alpha: 1.3,
                vy: -1.8
              });
              playSound("slash");
            } else {
              // Damage HP
              statsRef.current.hp = Math.max(0, statsRef.current.hp - 15);
              statsRef.current.screenShake = 12;
              statsRef.current.stunTimer = 0.4;
              statsRef.current.combo = 0;
              statsRef.current.catState = "HURT";

              setHp(statsRef.current.hp);
              setCombo(0);
              playSound("hurt");

              floatingTextsRef.current.push({
                x: ast.x,
                y: height - 140,
                text: "-15 HP ĐAN ĐIỀN CHẤN ĐỘNG!",
                color: "#ef4444",
                alpha: 1.3,
                vy: -1.8
              });

              if (statsRef.current.hp <= 0) {
                // GAME OVER!
                setIsGameOver(true);
                submitScoreToSQL();
              }
            }

            // Spawn next asteroid if none left
            if (asteroidsRef.current.length === 0 && statsRef.current.hp > 0) {
              setTimeout(() => spawnAsteroid(), 400);
            }
            continue;
          }

          // DRAW ASTEROID STONE
          ctx.save();
          ctx.translate(ast.x, ast.y);

          // Aura glow
          const auraRad = ast.radius + 15 + Math.sin(ast.wobbleSeed * 2) * 5;
          const glowGrad = ctx.createRadialGradient(0, 0, ast.radius * 0.4, 0, 0, auraRad);
          glowGrad.addColorStop(0, ast.glowColor);
          glowGrad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(0, 0, auraRad, 0, Math.PI * 2);
          ctx.fill();

          // Stone Sprite
          if (asteroidImg && asteroidImg.complete && asteroidImg.naturalWidth > 0) {
            const drawSize = ast.radius * 2.2;
            ctx.drawImage(asteroidImg, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
          } else {
            ctx.fillStyle = "#334155";
            ctx.beginPath();
            ctx.arc(0, 0, ast.radius, 0, Math.PI * 2);
            ctx.fill();
          }

          // WORD BANNER IN FRONT OF ASTEROID
          const bannerW = Math.max(120, ast.word.length * 15 + 30);
          const bannerH = 34;
          ctx.fillStyle = "rgba(26, 16, 10, 0.9)";
          ctx.strokeStyle = ast.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 6);
          ctx.fill();
          ctx.stroke();

          // Text with typed progress highlight
          ctx.font = "bold 16px 'Cinzel', serif, monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          const totalW = ctx.measureText(ast.word).width;
          let curX = -totalW / 2;

          for (let cIdx = 0; cIdx < ast.word.length; cIdx++) {
            const letter = ast.word[cIdx];
            const letterW = ctx.measureText(letter).width;

            if (cIdx < ast.typedLen) {
              ctx.fillStyle = "#ffdf79"; // Completed letters (gold)
            } else if (cIdx === ast.typedLen) {
              ctx.fillStyle = "#ffffff"; // Current target letter (bright white)
            } else {
              ctx.fillStyle = "#94a3b8"; // Remaining letters (slate)
            }

            ctx.fillText(letter, curX + letterW / 2, 0);
            curX += letterW;
          }

          ctx.restore();
        }

        // UPDATE & DRAW SWORD PROJECTILES
        const swords = swordsRef.current;
        const slashImg = assetsRef.current["prop_slash"];

        for (let i = swords.length - 1; i >= 0; i--) {
          const sw = swords[i];
          const dist = Math.hypot(sw.targetX - sw.x, sw.targetY - sw.y);

          if (dist < 20) {
            swords.splice(i, 1);
            continue;
          }

          sw.x += Math.cos(sw.angle) * sw.speed;
          sw.y += Math.sin(sw.angle) * sw.speed;

          ctx.save();
          ctx.translate(sw.x, sw.y);
          ctx.rotate(sw.angle + Math.PI / 2);

          if (slashImg && slashImg.complete && slashImg.naturalWidth > 0) {
            ctx.drawImage(slashImg, -16, -28, 32, 56);
          } else {
            ctx.strokeStyle = sw.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 15);
            ctx.lineTo(0, -15);
            ctx.stroke();
          }

          ctx.restore();
        }

        // UPDATE & DRAW PARTICLES
        const particles = particlesRef.current;
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;

          if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
          }

          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // UPDATE & DRAW FLOATING TEXTS
        const floats = floatingTextsRef.current;
        for (let i = floats.length - 1; i >= 0; i--) {
          const ft = floats[i];
          ft.y += ft.vy;
          ft.alpha -= dt * 0.8;

          if (ft.alpha <= 0) {
            floats.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.font = "bold 14px 'Cinzel', serif, sans-serif";
          ctx.textAlign = "center";
          ctx.fillStyle = ft.color;
          ctx.globalAlpha = Math.max(0, ft.alpha);
          ctx.shadowColor = "rgba(0,0,0,0.9)";
          ctx.shadowBlur = 6;
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.restore();
        }
      }

      // 2. DRAW CAT CHARACTER ON ALTAR (Positioned on stone table)
      const catBaseX = width / 2;
      let catBaseY = height - 105;

      if (statsRef.current.catLunge > 0) {
        catBaseY -= statsRef.current.catLunge;
        statsRef.current.catLunge = Math.max(0, statsRef.current.catLunge - dt * 60);
      }

      // Determine Sprite based on Realm & State
      const realm = CULTIVATION_REALMS[statsRef.current.realmIdx] || CULTIVATION_REALMS[0];
      let spriteKey = realm.spriteKey;

      if (statsRef.current.catState === "HURT" || statsRef.current.stunTimer > 0) {
        spriteKey = "cat_hurt";
      } else if (isGameOver) {
        spriteKey = "cat_defeated";
      }

      const catImg = assetsRef.current[spriteKey] || assetsRef.current["cat_idle"];

      // Draw Realm Aura Ring under Cat
      ctx.save();
      ctx.translate(catBaseX, catBaseY);
      const ringGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 55);
      ringGrad.addColorStop(0, realm.color);
      ringGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = ringGrad;
      ctx.beginPath();
      ctx.ellipse(0, 10, 50, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw Character Sprite
      if (catImg && catImg.complete && catImg.naturalWidth > 0) {
        const catW = 105;
        const catH = 105;
        ctx.drawImage(catImg, -catW / 2, -catH + 15, catW, catH);
      }
      ctx.restore();

      // Stun Stars if hit
      if (statsRef.current.stunTimer > 0) {
        ctx.save();
        ctx.translate(catBaseX, catBaseY - 95);
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        const starOffset = Math.sin(timestamp * 0.015) * 15;
        ctx.fillText("⭐ ⭐ ⭐", starOffset, 0);
        ctx.restore();
      }

      ctx.restore(); // Restore screen shake
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameIdRef.current);
  }, [viewMode, isPaused, isGameOver, showBreakthroughModal, playSound, spawnAsteroid, submitScoreToSQL]);

  // Touch on Canvas -> Auto-type next character of lowest asteroid (Mobile Super Friendly!)
  const handleCanvasTouchOrClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (viewMode !== "battle" || isGameOver || isPaused) return;

    // Find lowest asteroid
    const asteroids = asteroidsRef.current;
    if (asteroids.length === 0) return;

    let target = asteroids[0];
    let lowestY = target.y;
    for (const ast of asteroids) {
      if (ast.y > lowestY) {
        lowestY = ast.y;
        target = ast;
      }
    }

    if (target && target.typedLen < target.word.length) {
      const nextChar = target.word[target.typedLen];
      processInputChar(nextChar);
    }
  };

  // =========================================================================
  // VIEW 1: SẢNH CHỜ THIỀN ĐỊNH (EXACT MATCH TO DEMO IMAGE 1)
  // =========================================================================
  if (viewMode === "lobby") {
    const curRealm = CULTIVATION_REALMS[currentRealmIdx] || CULTIVATION_REALMS[0];
    const realPlayerName = getPlayerAccountName();

    return (
      <div className="w-full h-full flex flex-col items-center justify-between bg-[#120a06] text-[#fbf8ea] p-2 sm:p-4 overflow-y-auto font-serif select-none relative">
        
        {/* TOP BANNER: SẢNH CHỜ THIỀN ĐỊNH • TIÊN ĐẠO TRÀ QUÁN */}
        <div className="w-full max-w-4xl bg-gradient-to-r from-[#24170e] via-[#3a2012] to-[#24170e] p-2.5 px-4 rounded-xl border-2 border-[#6d4a1b] flex items-center justify-between shadow-xl shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base">🏮</span>
            <span className="font-bold text-xs sm:text-sm text-[#ffdf79] tracking-wider">
              SẢNH CHỜ THIỀN ĐỊNH • TIÊN ĐẠO TRÀ QUÁN
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#f4c6cf]">
            <span>🌸</span>
            <span className="hidden sm:inline">Gió Xuân Yên Bình • Không Ma Thạch Quấy Nhiễu</span>
          </div>
        </div>

        {/* HERO ALTAR CARD: VÒNG TRÒN BÁT QUÁI & MIÊU TIÊN TỌA THIỀN */}
        <div 
          className="w-full max-w-4xl bg-[#1e130b] rounded-2xl border-2 border-[#6d4a1b] p-5 sm:p-7 flex flex-col items-center gap-5 shadow-2xl my-auto relative overflow-hidden"
          style={{
            backgroundImage: "radial-gradient(#3d2719 1.5px, transparent 1.5px)",
            backgroundSize: "16px 16px"
          }}
        >
          {/* Circular Altar with Rotating Ring and Orbiting Badges */}
          <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-full border-4 border-[#543924] bg-gradient-to-b from-[#3a2012] to-[#1a1008] flex items-center justify-center shadow-[0_0_35px_rgba(120,146,98,0.25)]">
            {/* Spinning decorative ring */}
            <div className="absolute inset-2 rounded-full border border-dashed border-[#ffdf79]/40 animate-spin [animation-duration:28s]" />
            
            {/* Orbiting mini sword */}
            <div className="absolute top-1 left-3 w-6 h-6 rounded-full bg-[#1e293b] border border-[#38bdf8] flex items-center justify-center text-[10px] shadow">
              🗡️
            </div>

            {/* Orbiting mini teacup */}
            <div className="absolute bottom-2 right-4 w-6 h-6 rounded-full bg-[#14532d] border border-[#22c55e] flex items-center justify-center text-[10px] shadow">
              🍵
            </div>

            {/* Cat sprite sitting on jade sword */}
            <img
              src="/meowcha/sprites/cat_idle.png"
              alt="Miêu Tiên Tọa Thiền"
              className="w-36 h-36 sm:w-44 sm:h-44 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)] transition-transform hover:scale-105 duration-300 z-10"
            />
          </div>

          {/* Title, Level & Quote */}
          <div className="flex flex-col items-center text-center gap-1.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg sm:text-xl text-[#ffdf79]">
                {realPlayerName} • {curRealm.title}
              </span>
              <span className="px-2 py-0.5 bg-[#b5372d] text-[#ffdf79] text-xs font-mono font-bold rounded border border-[#ca8a04]">
                CẤP {currentRealmIdx}
              </span>
            </div>
            <p className="italic text-xs text-[#d8ccb0] max-w-md">
              “Ngụm trà đắng lắng ngàn kiếm ý • Chờ gió xuân khai mở độ kiếp đài”
            </p>
          </div>

          {/* Big Action Button (▶ VÀO TRẬN ĐỘ KIẾP) */}
          <button
            onClick={() => startBattle()}
            className="w-full max-w-md py-3.5 px-6 bg-gradient-to-b from-[#15803d] to-[#14532d] hover:brightness-110 active:scale-95 text-[#fbf8ea] rounded-xl border-2 border-[#22c55e] shadow-[0_0_25px_rgba(34,197,94,0.4)] flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-wider">
              <Swords className="w-5 h-5 text-[#ffdf79]" />
              <span>▶ VÀO TRẬN ĐỘ KIẾP</span>
              <Swords className="w-5 h-5 text-[#ffdf79]" />
            </div>
            <span className="text-[11px] text-[#86efac] font-mono">
              [ Nhấn SPACE hoặc Click để xuất kiếm trảm ma thạch ]
            </span>
          </button>

          {/* 3 Stats Blocks */}
          <div className="w-full max-w-md grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 bg-[#2c1a0f] rounded-lg border border-[#543924] flex flex-col">
              <span className="text-[#d8ccb0]">Tu Vi Điểm:</span>
              <span className="font-mono font-bold text-sm text-[#ffdf79] mt-0.5">{score.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-[#2c1a0f] rounded-lg border border-[#543924] flex flex-col">
              <span className="text-[#d8ccb0]">Từ Đã Trảm:</span>
              <span className="font-mono font-bold text-sm text-[#98b06f] mt-0.5">{wordsSlain} Từ</span>
            </div>
            <div className="p-2.5 bg-[#2c1a0f] rounded-lg border border-[#543924] flex flex-col">
              <span className="text-[#d8ccb0]">Đan Điền HP:</span>
              <span className="font-mono font-bold text-sm text-[#34d399] mt-0.5">{hp} / {maxHp}</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[11px] text-[#98b06f]/80 text-center py-1">
          Tiên Đạo Trà Viện • Luyện từ vựng IELTS Oxford 5000 cùng Miêu Kiếm Tôn
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: BATTLE ARENA (100% RESPONSIVE + CANVAS + MOBILE KEYBOARD)
  // =========================================================================
  const realmObj = CULTIVATION_REALMS[currentRealmIdx] || CULTIVATION_REALMS[0];
  const realName = getPlayerAccountName();

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex flex-col items-center justify-between bg-[#100804] select-none font-serif overflow-hidden"
    >
      {/* 1. TOP BATTLE HUD */}
      <div className="w-full bg-[#1e130b]/95 border-b-2 border-[#6d4a1b] px-3 sm:px-6 py-1.5 flex items-center justify-between shadow-xl z-20 shrink-0">
        
        {/* Left: Avatar, Realm & HP Bar */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#2c1a0f] border border-[#6d4a1b] p-0.5 overflow-hidden shadow">
            <img src="/meowcha/sprites/cat_idle.png" alt="Miêu Tiên" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-[#ffdf79]">{realName}</span>
              <span className="px-1.5 py-0.2 bg-[#b5372d] text-[#ffdf79] text-[9px] font-mono rounded font-bold border border-[#ca8a04]">
                {realmObj.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-[#d8ccb0]">HP:</span>
              <div className="w-20 sm:w-28 h-2.5 bg-[#170e07] rounded border border-[#543924] p-0.5 flex overflow-hidden">
                <div 
                  className={`h-full transition-all duration-200 ${hp > 15 ? "bg-[#22c55e]" : "bg-[#ef4444]"}`}
                  style={{ width: `${Math.max(0, (hp / maxHp) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-[#34d399]">{hp}/{maxHp}</span>
              {shieldCount > 0 && (
                <span className="px-1 bg-[#ca8a04] text-black text-[9px] font-bold rounded">
                  🛡️x{shieldCount}
                </span>
              )}
            </div>
          </div>
        </div>


        {/* Right: Quick Controls & Fullscreen Leaderboard button */}
        <div className="flex items-center gap-2">
          {/* Tu Vi & WPM */}
          <div className="flex flex-col text-right">
            <span className="text-[9px] text-[#d8ccb0]">Tu Vi:</span>
            <span className="font-mono font-bold text-xs text-[#ffdf79]">{score.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#2c1a0f] rounded border border-[#543924]">
            <Flame className="w-3 h-3 text-[#f97316]" />
            <span className="font-mono font-bold text-[11px] text-[#f97316]">{wpm} WPM</span>
          </div>

          {/* In-Game Leaderboard Button */}
          <button
            onClick={openLeaderboardOverlay}
            className="p-1 px-2 bg-[#2c1a0f] hover:bg-[#3d2516] text-[#ffdf79] rounded border border-[#6d4a1b] text-xs font-semibold flex items-center gap-1 cursor-pointer"
            title="Xem Bảng Phong Thần"
          >
            <Trophy className="w-3.5 h-3.5 text-[#ffdf79]" />
            <span className="hidden sm:inline">Phong Thần</span>
          </button>

          {/* In-Game Save Button */}
          <button
            onClick={openSaveSlotsOverlay}
            className="p-1 px-2 bg-[#2c1a0f] hover:bg-[#3d2516] text-[#34d399] rounded border border-[#6d4a1b] text-xs font-semibold flex items-center gap-1 cursor-pointer"
            title="Khắc Ghi Đạo Quả"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lưu</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(s => !s)}
            className="p-1 bg-[#2c1a0f] text-[#d8ccb0] rounded border border-[#6d4a1b] cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#34d399]" /> : <VolumeX className="w-3.5 h-3.5 text-[#ef4444]" />}
          </button>

          {/* Pause */}
          <button
            onClick={() => setIsPaused(p => !p)}
            className="p-1 px-2 bg-[#2c1a0f] hover:bg-[#3d2516] text-[#ffdf79] rounded border border-[#6d4a1b] text-xs font-bold cursor-pointer"
            title="Tạm dừng [ESC]"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. MAIN CANVAS VIEWPORT (No dead space, responsive 100%) */}
      <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={900}
          height={650}
          onClick={handleCanvasTouchOrClick}
          onTouchStart={handleCanvasTouchOrClick}
          className="w-full h-full object-contain block cursor-crosshair"
        />

        {/* In-game typing hint at bottom */}
        {typedLetters && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-black/80 border border-[#ffdf79] rounded-full text-xs font-mono font-bold text-[#ffdf79] shadow-lg animate-pulse pointer-events-none">
            Đang trảm: <span className="text-[#34d399]">{typedLetters}</span>...
          </div>
        )}
      </div>

      {/* 3. VIRTUAL QWERTY KEYBOARD FOR MOBILE (Chạm là xuất kiếm) */}
      {isMobile && (
        <div className="w-full bg-[#1a1008] border-t-2 border-[#6d4a1b] p-1.5 flex flex-col gap-1 z-30 shrink-0 shadow-2xl">
          {KB_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1 w-full">
              {row.map(char => (
                <button
                  key={char}
                  onClick={(e) => {
                    e.preventDefault();
                    processInputChar(char);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    processInputChar(char);
                  }}
                  className="flex-1 max-w-[36px] h-10 bg-gradient-to-b from-[#3a2012] to-[#24140a] active:from-[#b5372d] active:to-[#7f1d1d] active:scale-95 text-[#ffdf79] rounded border border-[#6d4a1b] font-mono font-bold text-sm flex items-center justify-center shadow transition-transform cursor-pointer"
                >
                  {char}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: ROGUELIKE TALENT SELECTION (BREAKTHROUGH) */}
      {showBreakthroughModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1e130b] border-2 border-[#ffdf79] rounded-2xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 text-center">
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl">⚡</span>
              <h3 className="text-xl font-bold text-[#ffdf79] tracking-wider">
                ĐỘT PHÁ CẢNH GIỚI: {CULTIVATION_REALMS[currentRealmIdx]?.name}!
              </h3>
              <p className="text-xs text-[#d8ccb0]">
                Thiên kiếp giáng lâm! Hãy chọn 1 đạo thần thông để tăng tiến tu vi chiến đấu:
              </p>
            </div>

            <div className="flex flex-col gap-2.5 mt-2 text-left">
              {talentChoices.map(talent => (
                <button
                  key={talent.id}
                  onClick={() => handleSelectTalent(talent)}
                  className="p-3 bg-gradient-to-r from-[#2c1a0f] to-[#3a2012] hover:border-[#ffdf79] active:scale-98 rounded-xl border border-[#6d4a1b] flex items-center gap-3 transition-all cursor-pointer shadow"
                >
                  <span className="text-2xl">{talent.icon}</span>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#ffdf79]">{talent.name}</span>
                      <span className="text-[10px] text-[#98b06f]">{talent.type}</span>
                    </div>
                    <span className="text-[11px] text-[#d8ccb0] mt-0.5">{talent.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: IN-GAME LEADERBOARD (Accessible in Fullscreen) */}
      {showInGameLeaderboard && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1e130b] border-2 border-[#ffdf79] rounded-2xl p-5 max-w-2xl w-full shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#6d4a1b] pb-2.5">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#ffdf79]" />
                <h3 className="font-bold text-base text-[#ffdf79]">BẢNG PHONG THẦN TIÊN GIỚI (SQL)</h3>
              </div>
              <button
                onClick={() => setShowInGameLeaderboard(false)}
                className="text-[#d8ccb0] hover:text-[#ffdf79] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#3d2516]">
              {leaderboardData.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#d8ccb0]">
                  Chưa có ai lưu danh trên Bảng Phong Thần. Hãy chiến đấu để trở thành người đầu tiên!
                </div>
              ) : (
                leaderboardData.map((item, idx) => (
                  <div key={item.id || idx} className="grid grid-cols-12 p-2.5 text-xs items-center hover:bg-[#2c1a0f]/60">
                    <span className="col-span-1 text-center font-bold text-[#ffdf79]">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                    </span>
                    <span className="col-span-4 font-bold text-[#fbf8ea] truncate">{item.player_name}</span>
                    <span className="col-span-3 text-[#34d399]">{item.realm}</span>
                    <span className="col-span-2 text-right font-mono text-[#ffdf79] font-bold">{item.score.toLocaleString()}</span>
                    <span className="col-span-2 text-right font-mono text-[#98b06f]">{item.wpm} WPM</span>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowInGameLeaderboard(false)}
              className="w-full py-2 bg-[#2c1a0f] hover:bg-[#3d2516] text-[#ffdf79] rounded-xl border border-[#6d4a1b] text-xs font-bold cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: IN-GAME SAVE SLOTS */}
      {showInGameSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1e130b] border-2 border-[#34d399] rounded-2xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-4 text-center">
            <div className="flex items-center justify-between border-b border-[#6d4a1b] pb-2">
              <div className="flex items-center gap-2">
                <Save className="w-5 h-5 text-[#34d399]" />
                <h3 className="font-bold text-sm text-[#ffdf79]">LƯU TIẾN TRÌNH VÀO NGỌC GIẢN</h3>
              </div>
              <button onClick={() => setShowInGameSaveModal(false)} className="text-[#d8ccb0] hover:text-[#ffdf79]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {[1, 2, 3].map(slotId => (
                <button
                  key={slotId}
                  disabled={savingSlotId === slotId}
                  onClick={() => handleSaveToSQL(slotId)}
                  className="p-3 bg-[#2c1a0f] hover:bg-[#3d2516] active:scale-98 rounded-xl border border-[#543924] flex items-center justify-between text-xs text-left cursor-pointer transition-all"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-[#ffdf79]">FILE {slotId}</span>
                    <span className="text-[10px] text-[#d8ccb0]">
                      Ghi đè: {realmObj.name} • {score.toLocaleString()} pts
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-[#14532d] text-[#86efac] font-bold rounded text-[10px]">
                    {savingSlotId === slotId ? "Đang Lưu..." : "Lưu Vào Đây"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PAUSE MODAL */}
      {isPaused && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e130b] border-2 border-[#ffdf79] rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 text-center">
            <h3 className="text-lg font-bold text-[#ffdf79]">THIỀN ĐỊNH • TẠM DỪNG</h3>
            <p className="text-xs text-[#d8ccb0]">
              Tu Vi: {score.toLocaleString()} pts • Đã trảm {wordsSlain} từ • Cảnh giới: {realmObj.name}
            </p>

            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => setIsPaused(false)}
                className="w-full py-2.5 bg-gradient-to-b from-[#15803d] to-[#14532d] hover:brightness-110 text-[#fbf8ea] rounded-xl border border-[#22c55e] text-xs font-bold cursor-pointer"
              >
                ▶ Tiếp Tục Độ Kiếp
              </button>
              <button
                onClick={openSaveSlotsOverlay}
                className="w-full py-2.5 bg-[#2c1a0f] hover:bg-[#3d2516] text-[#34d399] rounded-xl border border-[#6d4a1b] text-xs font-bold cursor-pointer"
              >
                💾 Lưu Tiến Trình
              </button>
              <button
                onClick={() => {
                  setIsPaused(false);
                  setViewMode("lobby");
                }}
                className="w-full py-2.5 bg-[#2c1a0f] hover:bg-[#3d2516] text-[#d8ccb0] rounded-xl border border-[#6d4a1b] text-xs font-bold cursor-pointer"
              >
                ✕ Thoát Về Sảnh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: GAME OVER & AUTOMATIC SCORE CONFIRMATION */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1e130b] border-2 border-[#b5372d] rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 text-center">
            <div className="flex flex-col items-center gap-1">
              <span className="text-4xl">⚔️</span>
              <h3 className="text-xl font-bold text-[#f43f5e]">ĐAN ĐIỀN CẠN KIỆT • ĐỘ KIẾP TẠM DỪNG</h3>
              <p className="text-xs text-[#d8ccb0]">Ma thạch đã xuyên thủng phòng tuyến! Nhưng chiến tích của bạn đã được ghi nhận.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-[#2c1a0f] p-3 rounded-xl border border-[#543924] text-xs">
              <div className="flex flex-col">
                <span className="text-[#d8ccb0]">Tu Vi Thu Hoạch:</span>
                <span className="font-mono font-bold text-sm text-[#ffdf79]">{score.toLocaleString()} pts</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#d8ccb0]">Cổ Ngữ Trảm Phá:</span>
                <span className="font-mono font-bold text-sm text-[#98b06f]">{wordsSlain} Từ</span>
              </div>
            </div>

            <div className="p-3 bg-[#14532d]/40 rounded-lg border border-[#22c55e] text-xs text-[#86efac] font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
              <span>Đã tự động khắc ghi chiến tích cho tài khoản <strong>{realName}</strong> vào Bảng Phong Thần!</span>
            </div>

            <div className="flex gap-2.5 mt-2">
              <button
                onClick={() => startBattle()}
                className="flex-1 py-2.5 bg-gradient-to-b from-[#15803d] to-[#14532d] hover:brightness-110 text-[#fbf8ea] rounded-xl border border-[#22c55e] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Độ Kiếp Lại</span>
              </button>
              <button
                onClick={() => setViewMode("lobby")}
                className="flex-1 py-2.5 bg-[#2c1a0f] hover:bg-[#3d2516] text-[#d8ccb0] rounded-xl border border-[#6d4a1b] text-xs font-bold cursor-pointer"
              >
                Về Sảnh Chờ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST MESSAGE */}
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#2c1a0f] border-2 border-[#ffdf79] text-[#ffdf79] rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-[#ffdf79]" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
