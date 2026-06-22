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
  evaluations?: string[][];
  points: number;
  status: "playing" | "won" | "lost";
  secret_word_revealed?: string | null;
}

export default function WordleMatchaPage() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  // Responsive state
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Game States
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>("");
  const [showHint, setShowHint] = useState<boolean>(false);

  // Keyboard state tracking (letter -> color status: 'green' | 'yellow' | 'gray')
  const [letterStatuses, setLetterStatuses] = useState<{ [key: string]: "green" | "yellow" | "gray" }>({});

  // UI Modals
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [leaderboardTab, setLeaderboardTab] = useState<"server" | "personal">("server");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [highestLevelPlayer, setHighestLevelPlayer] = useState<any>(null);
  const [showEndModal, setShowEndModal] = useState<boolean>(false);
  const [endModalType, setEndModalType] = useState<"won" | "lost" | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number>(0);
  const [revealedWord, setRevealedWord] = useState<string>("");

  // Resize listener for responsive layouts
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // Compute keyboard letter statuses whenever guesses and evaluations change
  useEffect(() => {
    if (!gameState || !gameState.guesses) return;
    const statuses: { [key: string]: "green" | "yellow" | "gray" } = {};
    const evaluations = gameState.evaluations;

    gameState.guesses.forEach((guess, rowIndex) => {
      const rowEval = evaluations?.[rowIndex];
      for (let i = 0; i < 5; i++) {
        const char = guess[i];
        
        // If we have evaluations from the backend, use them (secure & handles duplicates correctly)
        if (rowEval && rowEval[i]) {
          const status = rowEval[i];
          if (status === "green") {
            statuses[char] = "green";
          } else if (status === "yellow") {
            if (statuses[char] !== "green") {
              statuses[char] = "yellow";
            }
          } else if (status === "gray") {
            if (statuses[char] !== "green" && statuses[char] !== "yellow") {
              statuses[char] = "gray";
            }
          }
        } else {
          // Fallback if client-side has revealed secret word
          const secret = gameState.secret_word_revealed || "";
          if (secret && secret[i] === char) {
            statuses[char] = "green";
          } else if (secret && secret.includes(char)) {
            if (statuses[char] !== "green") {
              statuses[char] = "yellow";
            }
          } else {
            if (statuses[char] !== "green" && statuses[char] !== "yellow") {
              statuses[char] = "gray";
            }
          }
        }
      }
    });
    setLetterStatuses(statuses);
  }, [gameState]);

  const fetchGameState = async () => {
    // If offline or no token, try to load from localStorage cache first
    const localCachedState = localStorage.getItem("matcha_wordle_local_state");
    if (localCachedState) {
      try {
        setGameState(JSON.parse(localCachedState));
      } catch (e) {}
    }

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
        localStorage.setItem("matcha_wordle_local_state", JSON.stringify(data));
      } else if (res.status === 401) {
        localStorage.removeItem("oasis_token");
        localStorage.removeItem("oasis_user");
        setToken(null);
        setUser(null);
        setGameState(null);
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
        setHighestLevelPlayer(data.highest_level_player || null);
      }
    } catch (e) {
      console.error("Fetch leaderboard error:", e);
    }
  };

  const handleKeyPress = (char: string) => {
    if (gameState?.status !== "playing") return;
    if (char === "ENTER") {
      submitGuess();
    } else if (char === "BACKSPACE" || char === "DEL" || char === "XÓA") {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else if (currentGuess.length < 5 && /^[a-zA-Z]$/.test(char)) {
      const upperChar = char.toUpperCase();
      if (letterStatuses[upperChar] === "gray") return;
      setCurrentGuess((prev) => (prev + upperChar));
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
          
          if (gameState) {
            const updated: GameState = {
              ...gameState,
              guesses: data.guesses || [...gameState.guesses, currentGuess],
              evaluations: data.evaluations,
              status: "won"
            };
            setGameState(updated);
            localStorage.setItem("matcha_wordle_local_state", JSON.stringify(updated));
          }
          
          setEndModalType("won");
          setShowEndModal(true);
          fetchLeaderboard();
        } else if (data.result === "lost") {
          setRevealedWord(data.secret_word_revealed || "");
          
          if (gameState) {
            const updated: GameState = {
              ...gameState,
              guesses: data.guesses || [...gameState.guesses, currentGuess],
              evaluations: data.evaluations,
              status: "lost",
              secret_word_revealed: data.secret_word_revealed
            };
            setGameState(updated);
            localStorage.setItem("matcha_wordle_local_state", JSON.stringify(updated));
          }
          
          setEndModalType("lost");
          setShowEndModal(true);
          fetchLeaderboard();
        } else {
          // Still playing
          const updatedState: GameState = {
            ...gameState,
            guesses: data.guesses,
            evaluations: data.evaluations,
            points: data.points,
          };
          setGameState(updatedState);
          localStorage.setItem("matcha_wordle_local_state", JSON.stringify(updatedState));
        }
      } else if (res.status === 401) {
        setMessage("Phiên học đã hết hạn. Vui lòng quay lại trang chủ đăng nhập lại nhé! 🍵");
        localStorage.removeItem("oasis_token");
        localStorage.removeItem("oasis_user");
        setToken(null);
        setUser(null);
        setTimeout(() => setMessage(""), 5000);
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
        localStorage.removeItem("matcha_wordle_local_state");
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
      // Ignore if typing in an input elsewhere
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      
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
  const getTileColor = (guess: string, index: number, rowIndex: number) => {
    const evaluations = gameState?.evaluations;
    if (evaluations && evaluations[rowIndex]) {
      const status = evaluations[rowIndex][index];
      if (status === "green") return "bg-[#A7D08C] border-[#A7D08C] text-white"; // Green
      if (status === "yellow") return "bg-[#FBC02D] border-[#FBC02D] text-white"; // Yellow
      if (status === "gray") return "bg-neutral-300 border-neutral-300 text-white"; // Gray
    }

    const secret = gameState?.secret_word_revealed || "";
    if (secret) {
      const char = guess[index];
      if (secret[index] === char) {
        return "bg-[#A7D08C] border-[#A7D08C] text-white"; // Green
      } else if (secret.includes(char)) {
        return "bg-[#FBC02D] border-[#FBC02D] text-white"; // Yellow
      } else {
        return "bg-neutral-300 border-neutral-300 text-white"; // Gray
      }
    }
    
    return "bg-white border-primary/20 text-accent";
  };

  // Wordle Grid Auto-Scaling Layout
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
        let tileStyle = "flex-1 aspect-square max-w-[52px] border-2 rounded-xl flex items-center justify-center text-lg sm:text-2xl font-bold transition-all duration-300 ";
        
        if (isCurrentRow) {
          char = currentGuess[j] || "";
          tileStyle += char ? "border-accent scale-105" : "border-primary/20";
        } else if (i < guesses.length) {
          char = guess[j] || "";
          tileStyle += getTileColor(guess, j, i);
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
        <div key={i} className="flex gap-2 justify-center w-full">
          {tiles}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2 w-full max-w-[min(340px,85vw)] aspect-square mx-auto justify-between">
        {rows}
      </div>
    );
  };

  // Keyboard Layout selection
  const keyboardRowsDesktop = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
  ];

  const keyboardRowsMobile = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"],
    ["ENTER", "XÓA"]
  ];

  const keyboardRows = isMobile ? keyboardRowsMobile : keyboardRowsDesktop;

  const getKeyboardKeyStyle = (key: string) => {
    const status = letterStatuses[key];
    const base = "px-1.5 sm:px-3 py-3.5 sm:py-4 rounded-lg font-bold text-xs sm:text-sm active:scale-95 transition-all cursor-pointer select-none active:opacity-85 ";
    
    // Add custom styling for touch actions
    const touchStyle = { touchAction: "manipulation" } as React.CSSProperties;

    if (key === "ENTER" || key === "BACKSPACE" || key === "XÓA") {
      if (isMobile) {
        return {
          className: base + "bg-primary text-[#5D4037] flex-1 text-center py-4 border border-primary/20",
          style: touchStyle
        };
      }
      return {
        className: base + "bg-primary/20 hover:bg-primary/35 text-accent flex-1 text-[10px] sm:text-xs",
        style: touchStyle
      };
    }
    
    let colorClass = "bg-[#FFF9E6] hover:bg-[#FFF3CD] text-accent border border-primary/10";
    if (status === "green") colorClass = "bg-[#A7D08C] text-white";
    if (status === "yellow") colorClass = "bg-[#FBC02D] text-white";
    if (status === "gray") colorClass = "bg-neutral-200 text-neutral-400 opacity-30 cursor-not-allowed pointer-events-none";
    
    return {
      className: base + colorClass,
      style: touchStyle
    };
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col max-w-7xl mx-auto w-full relative">
      
      {/* Mobile Sticky Headers */}
      <Link 
        href="/games" 
        className="fixed top-4 left-4 z-[999] bg-white border border-primary/20 p-3 rounded-full text-accent shadow-md md:hidden active:scale-90 flex items-center justify-center"
      >
        <span className="material-symbols-rounded text-xl">arrow_back</span>
      </Link>
      
      <button 
        onClick={() => setShowLeaderboard(true)} 
        className="fixed top-4 right-4 z-[999] bg-white border border-primary/20 p-3 rounded-full text-accent shadow-md md:hidden active:scale-90 flex items-center justify-center"
      >
        <span className="material-symbols-rounded text-xl">emoji_events</span>
      </button>

      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between mb-8 pb-4 border-b border-primary/10">
        <Link href="/games" className="flex items-center gap-2 text-accent font-bold hover:text-primary transition-all">
          <span className="material-symbols-rounded">arrow_back</span>
          Về Game Hub
        </Link>
        <div className="flex items-center gap-3">
          <span className="material-symbols-rounded text-primary text-3xl">sports_esports</span>
          <h1 className="text-2xl font-display font-extrabold text-accent">Wordle Matcha 🍵</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowLeaderboard(true)}
            className="bg-white border border-primary/20 px-4 py-2 rounded-full text-xs font-bold text-accent hover:bg-secondary/40 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <span className="material-symbols-rounded text-sm">emoji_events</span>
            Bảng Xếp Hạng
          </button>
          {user && (
            <div className="bg-secondary/40 border border-primary/20 px-4 py-2 rounded-full text-xs font-bold text-accent flex items-center gap-2">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" className="w-5 h-5 rounded-full border border-primary" />
              ) : (
                <span className="material-symbols-rounded text-xs">person</span>
              )}
              {user.username}
            </div>
          )}
        </div>
      </header>

      {/* Mobile Title spacing */}
      <div className="h-10 md:hidden" />
      <div className="md:hidden text-center mb-4">
        <h1 className="text-xl font-display font-extrabold text-accent flex items-center justify-center gap-1.5">
          <span className="material-symbols-rounded text-primary">translate</span>
          Wordle Matcha 🍵
        </h1>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 flex-1">
        
        {/* Left Stats Sidebar (PC only) */}
        <section className="hidden md:flex md:col-span-3 flex-col gap-6">
          <div className="bg-white border border-primary/20 p-5 rounded-3xl shadow-sm flex flex-col justify-between h-64">
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
                <p className="text-xs text-accent/40 italic">Đang tải...</p>
              )}
            </div>
            
            {gameState && (
              <button 
                onClick={resetGame} 
                className="w-full py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1"
              >
                <span className="material-symbols-rounded text-sm">restart_alt</span>
                Reset Level 1
              </button>
            )}
          </div>
        </section>

        {/* Center Game Arena */}
        <main className="md:col-span-6 bg-white border-2 border-primary/20 p-4 md:p-6 rounded-[2.5rem] md:rounded-[3rem] shadow-lg flex flex-col items-center justify-between min-h-[500px] md:min-h-[600px] relative overflow-hidden flex-1">
          
          {loading ? (
            <div className="flex flex-col items-center gap-3 my-auto">
              <span className="material-symbols-rounded text-5xl text-primary animate-spin">eco</span>
              <p className="text-sm font-bold text-accent/60">Đang chuẩn bị Matcha từ vựng...</p>
            </div>
          ) : !token ? (
            <div className="flex flex-col items-center text-center p-8 max-w-sm gap-4 my-auto">
              <span className="material-symbols-rounded text-6xl text-primary animate-bounce">sports_esports</span>
              <h2 className="text-xl font-bold font-display text-accent">Tham gia Matcha Game!</h2>
              <p className="text-xs text-accent/70 leading-relaxed">
                Bạn cần đăng nhập ở trang chủ để tham gia đoán chữ, tích lũy điểm và đua bảng xếp hạng nhé!
              </p>
              <Link href="/" className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-full text-xs transition-all shadow-md mt-2">
                Quay lại Đăng nhập
              </Link>
            </div>
          ) : (
            <div className="w-full flex flex-col justify-between items-center gap-4 md:gap-6 h-full flex-1">
              
              {/* Game details */}
              <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
                <div className="flex items-center justify-between w-full sm:w-auto">
                  <div className="bg-secondary px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-black text-accent border border-primary/10 flex items-center gap-1">
                    <span className="material-symbols-rounded text-xs text-primary">layers</span>
                    Lvl {gameState?.current_level}
                  </div>
                  {/* Mobile-only action buttons */}
                  <div className="flex gap-1.5 sm:hidden">
                    <button 
                      onClick={resetGame}
                      className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 p-2 rounded-full transition-all active:scale-90 flex items-center justify-center"
                      title="Chơi lại từ đầu (Reset Lvl 1)"
                    >
                      <span className="material-symbols-rounded text-sm">restart_alt</span>
                    </button>
                    <button 
                      onClick={() => setShowHint(!showHint)}
                      className="bg-[#FBC02D]/10 hover:bg-[#FBC02D]/25 border border-[#FBC02D]/30 text-[#FBC02D] p-2 rounded-full transition-all active:scale-90 flex items-center justify-center"
                    >
                      <span className="material-symbols-rounded text-sm">lightbulb</span>
                    </button>
                  </div>
                </div>
                
                {/* Theme banner - full width on mobile, inline on desktop */}
                <div className="bg-primary/10 px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-black text-primary border border-primary/15 flex items-center gap-1 w-full sm:flex-1 justify-center sm:mx-1.5">
                  <span className="material-symbols-rounded text-xs flex-shrink-0">interests</span>
                  <span className="text-center">Chủ đề: {gameState?.theme || "Chủ đề"}</span>
                </div>
                
                {/* Desktop-only action buttons */}
                <div className="hidden sm:flex gap-1.5">
                  <button 
                    onClick={resetGame}
                    className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 p-2 rounded-full transition-all active:scale-90 flex items-center justify-center"
                    title="Chơi lại từ đầu (Reset Lvl 1)"
                  >
                    <span className="material-symbols-rounded text-sm sm:text-base">restart_alt</span>
                  </button>
                  <button 
                    onClick={() => setShowHint(!showHint)}
                    className="bg-[#FBC02D]/10 hover:bg-[#FBC02D]/25 border border-[#FBC02D]/30 text-[#FBC02D] p-2 rounded-full transition-all active:scale-90 flex items-center justify-center"
                  >
                    <span className="material-symbols-rounded text-sm sm:text-base">lightbulb</span>
                  </button>
                </div>
              </div>

              {/* Clue Panel */}
              <AnimatePresence>
                {showHint && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full bg-[#FFFDF5] border border-[#FBC02D]/30 p-3 rounded-xl text-left"
                  >
                    <p className="text-[9px] uppercase font-black tracking-widest text-[#FBC02D] mb-0.5">Gợi ý từ:</p>
                    <p className="text-xs font-bold text-accent leading-relaxed">{gameState?.hint}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Grid (Auto-scales down to avoid scrolls) */}
              <div className="w-full py-2 flex-1 flex items-center justify-center">
                {renderGrid()}
              </div>

              {/* Error messages */}
              {message && (
                <div className="bg-red-50 border border-red-100 text-red-500 px-4 py-1.5 rounded-xl text-xs font-bold transition-all animate-pulse">
                  {message}
                </div>
              )}

              {/* Virtual Keyboard (touch-action manipulation for quick tap responses) */}
              <div className="w-full flex flex-col gap-1.5 mt-2 max-w-lg">
                {keyboardRows.map((row, rIdx) => (
                  <div key={rIdx} className="flex gap-1 sm:gap-1.5 justify-center w-full">
                    {row.map((key) => {
                      const styleObj = getKeyboardKeyStyle(key);
                      return (
                        <button 
                          key={key} 
                          onClick={() => handleKeyPress(key)}
                          className={styleObj.className}
                          style={styleObj.style}
                        >
                          {key === "BACKSPACE" || key === "XÓA" ? (
                            <span className="material-symbols-rounded text-sm sm:text-base">backspace</span>
                          ) : key}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

            </div>
          )}

        </main>

        {/* Info panel (PC only) */}
        <section className="hidden md:flex md:col-span-3 flex-col gap-6">
          <div className="bg-white border border-primary/20 p-5 rounded-3xl shadow-sm text-xs space-y-4">
            <h4 className="font-display font-black text-sm uppercase tracking-wider text-accent border-b border-primary/5 pb-2">Hướng dẫn chơi</h4>
            <div className="space-y-2 text-accent/70 font-medium leading-relaxed">
              <p>• Bạn có tối đa 6 lượt đoán để tìm ra từ bí ẩn gồm 5 chữ cái.</p>
              <p>• Ô màu <span className="text-primary font-bold">Xanh lá (🟩)</span>: Chữ cái đúng và nằm đúng vị trí.</p>
              <p>• Ô màu <span className="text-yellow-600 font-bold">Vàng (🟨)</span>: Có chữ cái này nhưng sai vị trí.</p>
              <p>• Ô màu <span className="text-neutral-500 font-bold">Xám (⬛)</span>: Không có chữ cái này trong từ.</p>
              <p>• Đoán đúng để thăng cấp. Đoán sai 6 lần, cấp độ sẽ bị **reset về 1**.</p>
            </div>
          </div>
        </section>

      </div>

      {/* Leaderboard Modal (Works on Mobile/PC) */}
      <AnimatePresence>
        {showLeaderboard && (
          <div className="fixed inset-0 bg-accent/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-2 border-primary/20 p-5 rounded-[2.5rem] shadow-2xl max-w-md w-full flex flex-col max-h-[85vh]"
            >
              <header className="flex items-center justify-between border-b border-primary/5 pb-3 mb-4">
                <h3 className="text-lg font-display font-extrabold text-accent flex items-center gap-2">
                  <span className="material-symbols-rounded text-primary">emoji_events</span>
                  Thành Tích & Xếp Hạng
                </h3>
                <button 
                  onClick={() => setShowLeaderboard(false)}
                  className="text-neutral-400 hover:text-accent p-1 cursor-pointer"
                >
                  <span className="material-symbols-rounded">close</span>
                </button>
              </header>

              {/* Tabs */}
              <div className="flex gap-2 mb-4 bg-secondary/35 p-1 rounded-2xl border border-primary/5">
                <button 
                  onClick={() => setLeaderboardTab("server")}
                  className={`flex-1 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${leaderboardTab === "server" ? "bg-primary text-white shadow-sm" : "text-accent/60 hover:text-accent"}`}
                >
                  Bảng Xếp Hạng Tuần
                </button>
                <button 
                  onClick={() => setLeaderboardTab("personal")}
                  className={`flex-1 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${leaderboardTab === "personal" ? "bg-primary text-white shadow-sm" : "text-accent/60 hover:text-accent"}`}
                >
                  Kỷ lục cá nhân
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 min-h-[250px]">
                {leaderboardTab === "server" ? (
                  <>
                    {highestLevelPlayer && (
                      <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-50 to-amber-100/30 rounded-2xl border-2 border-amber-300/60 mb-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-xl animate-pulse">👑</span>
                          <div className="text-left">
                            <p className="text-[10px] text-amber-700 font-extrabold uppercase tracking-wider leading-none mb-0.5">Kỷ lục Cấp độ cao nhất</p>
                            <p className="text-xs font-black text-accent">{highestLevelPlayer.username}</p>
                          </div>
                        </div>
                        <span className="bg-amber-400 text-white font-black px-3 py-1 rounded-full text-xs shadow-sm">
                          Level {highestLevelPlayer.max_level}
                        </span>
                      </div>
                    )}
                    {leaderboard.map((item) => (
                      <div key={item.rank} className="flex items-center justify-between p-3 bg-secondary/20 rounded-2xl border border-primary/5">
                        <div className="flex items-center gap-3">
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
                          <span className="text-xs font-black text-accent truncate max-w-[120px]">{item.username}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-primary">{item.points} pts</p>
                          <p className="text-[10px] text-accent/40 font-bold">Lvl {item.max_level}</p>
                        </div>
                      </div>
                    ))}
                    {leaderboard.length === 0 && (
                      <p className="text-center text-xs text-accent/40 py-12 italic">Chưa có thành tích nào.</p>
                    )}
                  </>
                ) : (
                  <div className="space-y-4 p-2 text-accent">
                    <div className="flex justify-between items-center bg-secondary/15 p-3.5 rounded-2xl border border-primary/5">
                      <span className="text-xs font-bold text-accent/70">Cấp độ cao nhất đạt được:</span>
                      <span className="text-sm font-black text-primary">Level {gameState?.current_level || 1}</span>
                    </div>
                    <div className="flex justify-between items-center bg-secondary/15 p-3.5 rounded-2xl border border-primary/5">
                      <span className="text-xs font-bold text-accent/70">Tổng điểm số tích lũy:</span>
                      <span className="text-sm font-black text-accent">{gameState?.points || 0} pts</span>
                    </div>
                    <div className="flex justify-between items-center bg-secondary/15 p-3.5 rounded-2xl border border-primary/5">
                      <span className="text-xs font-bold text-accent/70">Số lượt đã đoán:</span>
                      <span className="text-sm font-bold text-accent">{gameState?.guesses?.length || 0} / 6 lượt</span>
                    </div>
                    <div className="flex justify-between items-center bg-secondary/15 p-3.5 rounded-2xl border border-primary/5">
                      <span className="text-xs font-bold text-accent/70">Chủ đề từ khóa hiện tại:</span>
                      <span className="text-sm font-bold text-accent">{gameState?.theme || "N/A"}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setShowLeaderboard(false);
                        resetGame();
                      }}
                      className="w-full mt-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-rounded text-sm sm:text-base">restart_alt</span>
                      Chơi lại từ đầu (Reset Lvl 1)
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              {endModalType === "won" ? (
                <div className="space-y-2">
                  <div className="text-6xl animate-bounce">🎉🍵🌟</div>
                  <h2 className="text-xl sm:text-2xl font-display font-extrabold text-[#A7D08C]">TUYỆT VỜI CẬU ƠI!</h2>
                  <p className="text-xs sm:text-sm text-accent/70 leading-relaxed">
                    Bạn đã xuất sắc tìm ra từ khóa bí ẩn: <strong className="text-primary text-base font-black tracking-widest">{revealedWord}</strong>!
                  </p>
                  <div className="bg-secondary/70 border border-primary/20 p-3 rounded-2xl inline-block mt-2">
                    <p className="text-[10px] text-accent/50 font-bold uppercase tracking-wider">Điểm nhận được:</p>
                    <p className="text-xl font-black text-accent">+{pointsEarned} pts</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-6xl animate-pulse">😢💔🍵</div>
                  <h2 className="text-xl sm:text-2xl font-display font-extrabold text-red-500">MẤT TRÀ RỒI...</h2>
                  <p className="text-xs sm:text-sm text-accent/70 leading-relaxed">
                    Rất tiếc! Bạn đã hết 6 lượt đoán. Hãy tích lũy thêm từ vựng để thử thách lại nhé!
                  </p>
                  <p className="text-xs text-accent/60">
                    Từ khóa đúng là: <strong className="text-red-500 font-bold tracking-wider">{revealedWord}</strong>
                  </p>
                  <div className="bg-red-50 border border-red-100 p-3 rounded-2xl inline-block mt-2 text-red-500">
                    <p className="text-[10px] font-bold uppercase tracking-wider">Trạng thái:</p>
                    <p className="text-xs sm:text-sm font-black">Level reset về 1 💔</p>
                  </div>
                </div>
              )}

              <button 
                onClick={() => {
                  setShowEndModal(false);
                  setEndModalType(null);
                  fetchGameState();
                }}
                className="w-full py-3.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-2xl shadow-md text-xs sm:text-sm transition-all active:scale-95 cursor-pointer mt-4"
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
