"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = "/api";

interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar_url: string | null;
  points: number;
  max_level: number;
}

interface GameState {
  current_level: number;
  theme: string;
  hint: string;
  guesses: string[];
  points: number;
  status: "playing" | "won" | "lost";
  secret_word_revealed?: string | null;
}

export default function GamePage() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  // Game States
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>("");
  const [showHint, setShowHint] = useState<boolean>(false);

  // Keyboard state tracking (letter -> color status: 'green' | 'yellow' | 'gray' | 'none')
  const [letterStatuses, setLetterStatuses] = useState<{ [key: string]: "green" | "yellow" | "gray" }>({});

  // UI States
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"wordle" | "other">("wordle");
  const [showEndModal, setShowEndModal] = useState<boolean>(false);
  const [endModalType, setEndModalType] = useState<"won" | "lost" | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number>(0);
  const [revealedWord, setRevealedWord] = useState<string>("");

  const inputRef = useRef<HTMLInputElement>(null);

  // Load Auth
  useEffect(() => {
    const savedUser = localStorage.getItem("oasis_user");
    const savedToken = localStorage.getItem("oasis_token");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
    }
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // Fetch initial game state and leaderboard
  useEffect(() => {
    fetchGameState();
    fetchLeaderboard();
  }, [token]);

  // Compute keyboard letter statuses whenever guesses change
  useEffect(() => {
    if (!gameState || !gameState.guesses) return;
    const statuses: { [key: string]: "green" | "yellow" | "gray" } = {};
    const secret = gameState.secret_word_revealed || "";

    gameState.guesses.forEach((guess) => {
      for (let i = 0; i < 5; i++) {
        const char = guess[i];
        if (secret && secret[i] === char) {
          statuses[char] = "green";
        } else if (secret && secret.includes(char)) {
          // Only upgrade to yellow if it's not already green
          if (statuses[char] !== "green") {
            statuses[char] = "yellow";
          }
        } else {
          // Only mark gray if not green or yellow
          if (statuses[char] !== "green" && statuses[char] !== "yellow") {
            statuses[char] = "gray";
          }
        }
      }
    });
    setLetterStatuses(statuses);
  }, [gameState]);

  const fetchGameState = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/game/wordle/state`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGameState(data);
      }
    } catch (e) {
      console.error("Fetch state error:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_URL}/game/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (e) {
      console.error("Fetch leaderboard error:", e);
    }
  };

  const handleKeyPress = (char: string) => {
    if (gameState?.status !== "playing") return;
    if (char === "ENTER") {
      submitGuess();
    } else if (char === "BACKSPACE" || char === "DEL") {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else if (currentGuess.length < 5 && /^[a-zA-Z]$/.test(char)) {
      setCurrentGuess((prev) => (prev + char).toUpperCase());
    }
  };

  const submitGuess = async () => {
    if (!token || !gameState) return;
    if (currentGuess.length !== 5) {
      setMessage("Từ đoán phải có đúng 5 chữ cái!");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/game/wordle/guess`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ guess: currentGuess }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentGuess("");
        
        if (data.result === "won") {
          setRevealedWord(currentGuess);
          setPointsEarned(data.points_earned);
          setEndModalType("won");
          setShowEndModal(true);
          // Refresh state
          fetchGameState();
          fetchLeaderboard();
        } else if (data.result === "lost") {
          setRevealedWord(revealedWord || "OUT"); // The word they failed to guess
          setEndModalType("lost");
          setShowEndModal(true);
          fetchGameState();
          fetchLeaderboard();
        } else {
          // Still playing
          setGameState((prev: any) => ({
            ...prev,
            guesses: data.guesses,
            points: data.points,
          }));
        }
      } else {
        const err = await res.json();
        setMessage(err.detail || "Từ đoán không hợp lệ!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (e) {
      console.error("Guess submit error:", e);
    }
  };

  const resetGame = async () => {
    if (!token) return;
    if (!confirm("Bạn có chắc chắn muốn reset toàn bộ tiến trình game về cấp độ 1? Số điểm tích lũy hiện tại sẽ bị xóa.")) return;
    try {
      const res = await fetch(`${API_URL}/game/wordle/reset`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchGameState();
        setCurrentGuess("");
        setShowHint(false);
      }
    } catch (e) {
      console.error("Reset game error:", e);
    }
  };

  // Keyboard physical listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handleKeyPress("ENTER");
      } else if (e.key === "Backspace") {
        handleKeyPress("BACKSPACE");
      } else {
        handleKeyPress(e.key.toUpperCase());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentGuess, gameState]);

  // Compute tile colors for Wordle grid
  const getTileColor = (guess: string, index: number) => {
    const secret = gameState?.secret_word_revealed || "";
    if (!secret) return "bg-white border-primary/20 text-accent";

    const char = guess[index];
    if (secret[index] === char) {
      return "bg-[#A7D08C] border-[#A7D08C] text-white"; // Green
    } else if (secret.includes(char)) {
      return "bg-[#FBC02D] border-[#FBC02D] text-white"; // Yellow
    } else {
      return "bg-neutral-300 border-neutral-300 text-white"; // Gray
    }
  };

  const renderGrid = () => {
    const rows = [];
    const guesses = gameState?.guesses || [];
    const maxGuesses = 6;

    for (let i = 0; i < maxGuesses; i++) {
      const guess = guesses[i] || "";
      const isCurrentRow = i === guesses.length;
      
      const tiles = [];
      for (let j = 0; j < 5; j++) {
        let char = "";
        let tileStyle = "border-2 flex items-center justify-center text-xl sm:text-2xl font-bold w-12 h-12 sm:w-14 sm:h-14 rounded-xl transition-all duration-300 ";
        
        if (isCurrentRow) {
          char = currentGuess[j] || "";
          tileStyle += char ? "border-accent scale-105" : "border-primary/20";
        } else if (i < guesses.length) {
          char = guess[j] || "";
          tileStyle += getTileColor(guess, j);
        } else {
          tileStyle += "border-primary/10 opacity-40";
        }

        tiles.push(
          <div key={j} className={tileStyle}>
            {char}
          </div>
        );
      }
      rows.push(
        <div key={i} className="flex gap-2 justify-center">
          {tiles}
        </div>
      );
    }
    return <div className="flex flex-col gap-2">{rows}</div>;
  };

  const keyboardRows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
  ];

  const getKeyboardKeyStyle = (key: string) => {
    const status = letterStatuses[key];
    const base = "px-1.5 sm:px-3 py-3 sm:py-4 rounded-lg font-bold text-xs sm:text-sm active:scale-95 transition-all cursor-pointer select-none ";
    if (key === "ENTER" || key === "BACKSPACE") {
      return base + "bg-primary/20 hover:bg-primary/35 text-accent flex-1 text-[10px] sm:text-xs";
    }
    if (status === "green") return base + "bg-[#A7D08C] text-white";
    if (status === "yellow") return base + "bg-[#FBC02D] text-white";
    if (status === "gray") return base + "bg-neutral-300 text-neutral-500 opacity-60";
    return base + "bg-[#FFF9E6] hover:bg-[#FFF3CD] text-accent border border-primary/10";
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col max-w-7xl mx-auto w-full relative">
      
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-primary/10">
        <Link href="/" className="flex items-center gap-2 text-accent font-bold hover:text-primary transition-all">
          <span className="material-symbols-rounded">arrow_back</span>
          Quay lại Thư viện
        </Link>
        <div className="flex items-center gap-3">
          <span className="material-symbols-rounded text-primary text-3xl">sports_esports</span>
          <h1 className="text-2xl md:text-3xl font-display font-extrabold text-accent">Matcha Game Center 🍵</h1>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <div className="bg-secondary/40 border border-primary/20 px-4 py-1.5 rounded-full text-xs font-bold text-accent flex items-center gap-2">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" className="w-6 h-6 rounded-full border border-primary" />
              ) : (
                <span className="material-symbols-rounded text-sm">person</span>
              )}
              {user.username}
            </div>
          ) : (
            <div className="text-xs text-red-500 font-bold">Hãy đăng nhập để lưu điểm!</div>
          )}
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        
        {/* Left Side: Game Selector & Stats */}
        <section className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white border border-primary/20 p-5 rounded-3xl shadow-sm">
            <h3 className="font-display font-black text-sm uppercase tracking-wider text-accent mb-4">Danh sách trò chơi</h3>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setActiveTab("wordle")}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-left transition-all ${activeTab === "wordle" ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-secondary/40 hover:bg-secondary/70 text-accent"}`}
              >
                <span className="material-symbols-rounded">translate</span>
                Wordle Matcha
              </button>
              <button 
                disabled 
                className="flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm text-left bg-neutral-100 text-neutral-400 cursor-not-allowed opacity-60"
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-rounded">record_voice_over</span>
                  Matcha Speak
                </span>
                <span className="material-symbols-rounded text-xs">lock</span>
              </button>
              <button 
                disabled 
                className="flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm text-left bg-neutral-100 text-neutral-400 cursor-not-allowed opacity-60"
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-rounded">bubble_chart</span>
                  Grammar Pop
                </span>
                <span className="material-symbols-rounded text-xs">lock</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-primary/20 p-5 rounded-3xl shadow-sm flex flex-col justify-between flex-1 min-h-[220px]">
            <div>
              <h3 className="font-display font-black text-sm uppercase tracking-wider text-accent mb-4">Thành tích cá nhân</h3>
              {gameState ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-primary/5 pb-2">
                    <span className="text-xs text-accent/60">Cấp độ hiện tại:</span>
                    <span className="text-lg font-black text-primary">Level {gameState.current_level}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-primary/5 pb-2">
                    <span className="text-xs text-accent/60">Điểm số tích lũy:</span>
                    <span className="text-lg font-black text-accent">{gameState.points} pts</span>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-xs text-accent/60">Lượt đã đoán:</span>
                    <span className="text-xs font-bold text-accent">{gameState.guesses?.length || 0} / 6 lượt</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-accent/40 italic">Chưa có thông tin. Đang tải...</p>
              )}
            </div>
            
            {gameState && (
              <button 
                onClick={resetGame} 
                className="mt-6 w-full py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1"
              >
                <span className="material-symbols-rounded text-sm">restart_alt</span>
                Reset Level 1
              </button>
            )}
          </div>
        </section>

        {/* Center: The Game Loop */}
        <main className="lg:col-span-6 bg-white border-2 border-primary/20 p-6 rounded-[3rem] shadow-lg flex flex-col items-center justify-center min-h-[600px] relative overflow-hidden">
          
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <span className="material-symbols-rounded text-5xl text-primary animate-spin">eco</span>
              <p className="text-sm font-bold text-accent/60">Đang chuẩn bị Matcha từ vựng...</p>
            </div>
          ) : !token ? (
            <div className="flex flex-col items-center text-center p-8 max-w-sm gap-4">
              <span className="material-symbols-rounded text-6xl text-primary animate-bounce">sports_esports</span>
              <h2 className="text-xl font-bold font-display text-accent">Tham gia Matcha Game!</h2>
              <p className="text-xs text-accent/70 leading-relaxed">
                Bạn cần đăng nhập tài khoản Khách hoặc qua Discord ở trang chủ để chơi game, lưu điểm tích lũy và đua bảng xếp hạng hàng tuần nhé!
              </p>
              <Link href="/" className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-full text-xs transition-all shadow-md mt-2">
                Quay lại Đăng nhập
              </Link>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-6">
              
              {/* Game Info Row */}
              <div className="w-full flex items-center justify-between px-2">
                <div className="bg-secondary px-4 py-1.5 rounded-full text-xs font-black text-accent flex items-center gap-1.5 border border-primary/10">
                  <span className="material-symbols-rounded text-xs text-primary">layers</span>
                  Level {gameState?.current_level}
                </div>
                <div className="bg-primary/10 px-4 py-1.5 rounded-full text-xs font-black text-primary flex items-center gap-1.5 border border-primary/15">
                  <span className="material-symbols-rounded text-xs">interests</span>
                  Chủ đề: {gameState?.theme || "Đang tải"}
                </div>
                <button 
                  onClick={() => setShowHint(!showHint)}
                  className="bg-[#FBC02D]/10 hover:bg-[#FBC02D]/25 border border-[#FBC02D]/30 text-[#FBC02D] p-2.5 rounded-full transition-all active:scale-95 flex items-center justify-center"
                  title="Xem gợi ý"
                >
                  <span className="material-symbols-rounded text-base">lightbulb</span>
                </button>
              </div>

              {/* Clue/Hint Box */}
              <AnimatePresence>
                {showHint && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full bg-[#FFFDF5] border border-[#FBC02D]/30 p-3.5 rounded-2xl text-left"
                  >
                    <p className="text-[10px] uppercase font-black tracking-widest text-[#FBC02D] mb-1">Gợi ý từ vựng:</p>
                    <p className="text-xs font-bold text-accent leading-relaxed">{gameState?.hint}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Grid */}
              <div className="my-4">
                {renderGrid()}
              </div>

              {/* Error Message Box */}
              {message && (
                <div className="bg-red-50 border border-red-100 text-red-500 px-4 py-2 rounded-xl text-xs font-bold transition-all animate-pulse">
                  {message}
                </div>
              )}

              {/* Virtual Keyboard */}
              <div className="w-full flex flex-col gap-2 mt-4 max-w-lg">
                {keyboardRows.map((row, rIdx) => (
                  <div key={rIdx} className="flex gap-1.5 justify-center w-full">
                    {row.map((key) => (
                      <button 
                        key={key} 
                        onClick={() => handleKeyPress(key)}
                        className={getKeyboardKeyStyle(key)}
                      >
                        {key === "BACKSPACE" ? (
                          <span className="material-symbols-rounded text-sm">backspace</span>
                        ) : key}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

            </div>
          )}

        </main>

        {/* Right Side: Weekly Leaderboard */}
        <section className="lg:col-span-3 bg-white border border-primary/20 p-5 rounded-3xl shadow-sm flex flex-col min-h-[400px]">
          <h3 className="font-display font-black text-sm uppercase tracking-wider text-accent mb-4 flex items-center gap-2 border-b border-primary/5 pb-2">
            <span className="material-symbols-rounded text-primary">emoji_events</span>
            Bảng Xếp Hạng Tuần
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
            {leaderboard.map((item) => (
              <div key={item.rank} className="flex items-center justify-between p-2.5 bg-secondary/35 rounded-xl border border-primary/5">
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${item.rank === 1 ? "bg-amber-400 text-white" : item.rank === 2 ? "bg-slate-300 text-white" : item.rank === 3 ? "bg-amber-600 text-white" : "bg-neutral-100 text-accent/60"}`}>
                    {item.rank}
                  </div>
                  {item.avatar_url ? (
                    <img src={item.avatar_url} alt="avatar" className="w-8 h-8 rounded-full border border-primary/20" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                      {item.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-black text-accent truncate max-w-[80px]">{item.username}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-primary">{item.points} pts</p>
                  <p className="text-[9px] text-accent/40 font-bold">Lvl {item.max_level}</p>
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p className="text-center text-xs text-accent/40 py-12 italic">Chưa có thành tích tuần này.</p>
            )}
          </div>
        </section>

      </div>

      {/* Cute End Game Modal */}
      <AnimatePresence>
        {showEndModal && (
          <div className="fixed inset-0 bg-accent/40 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-4 border-primary p-6 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center space-y-4 relative overflow-hidden"
            >
              
              {/* Cute Mascot Header */}
              {endModalType === "won" ? (
                <div className="space-y-2">
                  <div className="text-6xl animate-bounce">🎉🍵🌟</div>
                  <h2 className="text-2xl font-display font-extrabold text-[#A7D08C]">TUYỆT VỜI CẬU ƠI!</h2>
                  <p className="text-xs text-accent/70 leading-relaxed">
                    Bạn đã xuất sắc tìm ra từ khóa bí ẩn: <strong className="text-primary text-base font-black tracking-widest">{revealedWord}</strong>!
                  </p>
                  <div className="bg-secondary/70 border border-primary/20 p-3 rounded-2xl inline-block mt-2">
                    <p className="text-xs text-accent/50 font-bold uppercase tracking-wider">Điểm nhận được:</p>
                    <p className="text-2xl font-black text-accent">+{pointsEarned} pts</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-6xl animate-pulse">😢💔🍵</div>
                  <h2 className="text-2xl font-display font-extrabold text-red-500">MẤT TRÀ RỒI...</h2>
                  <p className="text-xs text-accent/70 leading-relaxed">
                    Rất tiếc! Bạn đã hết 6 lượt đoán. Hãy rèn luyện thêm từ vựng để thử thách lại nhé!
                  </p>
                  <p className="text-xs text-accent/60">
                    Từ bí ẩn của màn chơi là: <strong className="text-red-500 font-bold">{gameState?.secret_word_revealed}</strong>
                  </p>
                  <div className="bg-red-50 border border-red-100 p-3 rounded-2xl inline-block mt-2 text-red-500">
                    <p className="text-[10px] font-bold uppercase tracking-wider">Trạng thái:</p>
                    <p className="text-sm font-black">Level reset về 1 💔</p>
                  </div>
                </div>
              )}

              <button 
                onClick={() => {
                  setShowEndModal(false);
                  setEndModalType(null);
                }}
                className="w-full py-3 bg-primary hover:bg-primary/95 text-white font-bold rounded-2xl shadow-md text-sm transition-all active:scale-95 cursor-pointer mt-4"
              >
                {endModalType === "won" ? "Tiếp tục Level tiếp theo! 🚀" : "Chơi lại từ đầu 🔄"}
              </button>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
