// components/meowcha/MeowchaGame.tsx - Root Game Controller & State Machine

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Asteroid, Projectile, Particle, FloatingText, VocabItem, 
  Realm, REALMS, Talent, TALENTS_POOL, TALENTS_DEFINITIONS, getTalentByLevel 
} from "@/types/meowcha";
import { useMeowchaAudio } from "@/hooks/useMeowchaAudio";
import { MeowchaArena } from "./MeowchaArena";
import { MeowchaBanner } from "./MeowchaBanner";
import { MeowchaLobby } from "./MeowchaLobby";
import { 
  PauseModal, ExitConfirmModal, BreakthroughModal, GameOverModal 
} from "./MeowchaModals";

export const MeowchaGame: React.FC = () => {
  // Game Mode
  const [gameMode, setGameMode] = useState<"lobby" | "battle">("lobby");

  // Game Stats
  const [hp, setHp] = useState<number>(50);
  const [maxHp, setMaxHp] = useState<number>(50);
  const [score, setScore] = useState<number>(0);
  const [wordsSlain, setWordsSlain] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [wpm, setWpm] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [totalKeystrokes, setTotalKeystrokes] = useState<number>(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState<number>(0);
  const [currentRealmIdx, setCurrentRealmIdx] = useState<number>(0);

  // Entities
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);
  const [catState, setCatState] = useState<"idle" | "attack" | "hurt" | "ultimate" | "defeated">("idle");
  const [activeTalents, setActiveTalents] = useState<Talent[]>([]);

  // Modals & Pauses
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [showBreakthrough, setShowBreakthrough] = useState<boolean>(false);
  const [breakthroughTalents, setBreakthroughTalents] = useState<Talent[]>([]);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // Vocab Bank
  const [vocabBank, setVocabBank] = useState<VocabItem[]>([]);

  // Audio Hook
  const {
    isMuted,
    toggleMute,
    bgmEnabled,
    toggleBgm,
    playKeystroke,
    playSkillAttack,
    playAsteroidExplode,
    playPlayerHurt,
    playBreakthrough
  } = useMeowchaAudio();

  // References for Animation & Loops
  const loopRef = useRef<number | null>(null);
  const lastSpawnTime = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const targetLockRef = useRef<string | null>(null);
  targetLockRef.current = activeTargetId;

  // 1. FETCH VOCAB FROM BACKEND API
  useEffect(() => {
    const fetchVocab = async () => {
      try {
        const res = await fetch("/api/meowcha/vocab?limit=150");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setVocabBank(json.data);
          }
        }
      } catch (e) {
        console.warn("Using fallback local vocab bank.", e);
      }
    };
    fetchVocab();
  }, []);

  // 2. DỌN SẠCH CACHE & RESET HOÀN TOÀN STATE KHI VỀ SẢNH
  const cleanCacheAndReset = useCallback(() => {
    setHp(50);
    setMaxHp(50);
    setScore(0);
    setWordsSlain(0);
    setCombo(0);
    setMaxCombo(0);
    setWpm(0);
    setAccuracy(100);
    setTotalKeystrokes(0);
    setCorrectKeystrokes(0);
    setCurrentRealmIdx(0);
    setAsteroids([]);
    setProjectiles([]);
    setParticles([]);
    setFloatingTexts([]);
    setActiveTargetId(null);
    setActiveTalents([]);
    setCatState("idle");
    setIsPaused(false);
    setShowExitConfirm(false);
    setShowBreakthrough(false);
    setIsGameOver(false);
    setGameMode("lobby");
  }, []);

  // 3. START BATTLE
  const handleStartBattle = useCallback(() => {
    setHp(50);
    setMaxHp(50);
    setScore(0);
    setWordsSlain(0);
    setCombo(0);
    setMaxCombo(0);
    setCurrentRealmIdx(0);
    setActiveTalents([]);
    setAsteroids([]);
    setProjectiles([]);
    setParticles([]);
    setFloatingTexts([]);
    setActiveTargetId(null);
    setCatState("idle");
    setIsPaused(false);
    setIsGameOver(false);
    startTimeRef.current = Date.now();
    setGameMode("battle");
  }, []);

  // 4. TRÙNG SINH (REBIRTH IN PLACE)
  const handleRebirth = useCallback(() => {
    setHp(maxHp);
    setAsteroids([]);
    setProjectiles([]);
    setActiveTargetId(null);
    setCatState("idle");
    setIsGameOver(false);
    setIsPaused(false);
  }, [maxHp]);

  // 5. CULTIVATION REALM PROGRESSION LOGIC
  const checkRealmProgression = useCallback((newScore: number) => {
    let targetIdx = 0;
    for (let i = REALMS.length - 1; i >= 0; i--) {
      if (newScore >= REALMS[i].reqScore) {
        targetIdx = i;
        break;
      }
    }

    if (targetIdx > currentRealmIdx) {
      // Trigger breakthrough after a 2.2-second delay guard
      setTimeout(() => {
        playBreakthrough();
        // Tạo danh sách 3 thẻ nâng cấp dựa trên các kỹ năng hiện có
        const candidateTalents: Talent[] = [];
        Object.keys(TALENTS_DEFINITIONS).forEach(baseId => {
          const current = activeTalents.find(t => t.baseId === baseId);
          if (!current) {
            // Chưa học -> Đề xuất Cấp 1
            candidateTalents.push(getTalentByLevel(baseId, 1));
          } else if (current.level < 3) {
            // Đã học -> Đề xuất Cấp tiếp theo (Cấp 2 hoặc Cấp 3 ĐỈNH PHONG)
            candidateTalents.push(getTalentByLevel(baseId, current.level + 1));
          }
        });

        // Nếu danh sách ít hơn 3, bổ sung từ các kỹ năng chưa đầy đủ
        let pool = [...candidateTalents];
        if (pool.length < 3) {
          const allPossibles = Object.keys(TALENTS_DEFINITIONS).map(baseId => {
            const current = activeTalents.find(t => t.baseId === baseId);
            return getTalentByLevel(baseId, current ? current.level : 1);
          });
          for (const extra of allPossibles) {
            if (!pool.some(p => p.baseId === extra.baseId)) {
              pool.push(extra);
            }
            if (pool.length >= 3) break;
          }
        }
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        setBreakthroughTalents(shuffled.slice(0, 3));
        setCurrentRealmIdx(targetIdx);
        setShowBreakthrough(true);
      }, 2200);
    }
  }, [currentRealmIdx, activeTalents, playBreakthrough]);

  // 6. SPAWN ASTEROID BASED ON CURRENT REALM & QI
  const spawnAsteroid = useCallback((realmIdx: number) => {
    const realm = REALMS[realmIdx] || REALMS[0];
    const pool = vocabBank.length > 0 ? vocabBank : [
      { id: 1, word: "ALERT", ipa: "/əˈlɜːt/", meaning: "Cảnh giác, tỉnh táo", band_level: 0, asteroid_type: "FROST", difficulty_score: 10 },
      { id: 2, word: "ZENITH", ipa: "/ˈzen.ɪθ/", meaning: "Đỉnh cao", band_level: 1, asteroid_type: "INFERNO", difficulty_score: 20 },
      { id: 3, word: "PARADOX", ipa: "/ˈpær.ə.dɒks/", meaning: "Nghịch lý", band_level: 2, asteroid_type: "VOID", difficulty_score: 30 },
      { id: 4, word: "EPHEMERAL", ipa: "/ɪˈfem.ər.əl/", meaning: "Phù du", band_level: 3, asteroid_type: "BLOOD_THUNDER", difficulty_score: 50 }
    ];

    // Filter vocab close to current realm minBand
    const bandMatches = pool.filter(v => v.band_level <= realm.minBand + 1);
    const chosenList = bandMatches.length > 0 ? bandMatches : pool;
    const randomVocab = chosenList[Math.floor(Math.random() * chosenList.length)];

    // Determine Asteroid Type based on realm
    let astType: any = "FROST";
    if (realmIdx === 1) astType = "INFERNO";
    else if (realmIdx === 2) astType = "VOID";
    else if (realmIdx >= 3) astType = "BLOOD_THUNDER";

    // Random X between 120 and 700
    const spawnX = 140 + Math.random() * 520;
    
    // TÍNH TOÁN HIỆU LỰC TALENTS 3 CẤP ĐỘ VỀ TỐC ĐỘ RƠI
    const swiftTalent = activeTalents.find(t => t.baseId === "swift_blade");
    const dragonTalent = activeTalents.find(t => t.baseId === "dragon_wrath");
    let speedMod = 1.0;
    if (swiftTalent) {
      if (swiftTalent.level === 1) speedMod *= 0.85;
      else if (swiftTalent.level === 2) speedMod *= 0.75;
      else if (swiftTalent.level === 3) speedMod *= 0.60;
    }
    if (dragonTalent) {
      if (dragonTalent.level === 1) speedMod *= 0.70;
      else if (dragonTalent.level === 2) speedMod *= 0.50;
      else if (dragonTalent.level === 3) speedMod *= 0.35;
    }

    const speed = (0.55 + realmIdx * 0.22 + Math.random() * 0.15) * speedMod;

    const newAsteroid: Asteroid = {
      id: "ast_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      x: spawnX,
      y: -30,
      vx: (Math.random() - 0.5) * 0.3,
      vy: speed,
      word: randomVocab.word.toUpperCase(),
      typed: "",
      ipa: randomVocab.ipa,
      meaning: randomVocab.meaning,
      type: astType,
      hp: randomVocab.word.length,
      maxHp: randomVocab.word.length,
      radius: 26 + randomVocab.word.length * 1.5,
      speed: speed,
      points: (randomVocab.difficulty_score || 15) * (realmIdx + 1),
      rotation: 0,
      pulse: 0,
      wordId: randomVocab.id
    };

    setAsteroids(prev => [...prev, newAsteroid]);
  }, [vocabBank, activeTalents]);

  // 7. KEYBOARD INPUT LISTENER (NON-STUCK TYPING ENGINE)
  useEffect(() => {
    if (gameMode !== "battle" || isPaused || isGameOver || showBreakthrough) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "p" || e.key === "P") {
        e.preventDefault();
        setIsPaused(prev => !prev);
        return;
      }

      // Filter only letters A-Z
      if (!/^[a-zA-Z]$/.test(e.key)) return;
      const char = e.key.toUpperCase();

      playKeystroke();
      setTotalKeystrokes(prev => prev + 1);

      setAsteroids(prevAsteroids => {
        let currentLock = targetLockRef.current;
        let target = prevAsteroids.find(a => a.id === currentLock);

        // A. If no active lock or current lock asteroid was destroyed: find best candidate
        if (!target) {
          // Find all asteroids whose first character matches
          const candidates = prevAsteroids.filter(a => a.word.startsWith(char) && a.typed.length === 0);
          if (candidates.length > 0) {
            // Sort by highest Y (closest to altar)
            candidates.sort((a, b) => b.y - a.y);
            target = candidates[0];
            currentLock = target.id;
            setActiveTargetId(target.id);
          }
        }

        // B. Process typed character against target
        if (target) {
          const nextExpectedChar = target.word[target.typed.length];
          if (char === nextExpectedChar) {
            // MATCH!
            const newTyped = target.typed + char;
            setCorrectKeystrokes(prev => prev + 1);
            playSkillAttack(currentRealmIdx);
            setCatState("attack");
            setTimeout(() => setCatState("idle"), 180);

            // TÍNH TOÁN TỐC ĐỘ KIẾM KHÍ VỚI TALENT SWIFT BLADE (CẤP 1 - 3)
            const swiftTalent = activeTalents.find(t => t.baseId === "swift_blade");
            let projSpeed = 18;
            if (swiftTalent) {
              if (swiftTalent.level === 1) projSpeed = 22;
              else if (swiftTalent.level === 2) projSpeed = 27;
              else if (swiftTalent.level === 3) projSpeed = 36;
            }

            // Create Homing Projectile
            const realm = REALMS[currentRealmIdx] || REALMS[0];
            const newProj: Projectile = {
              id: "proj_" + Date.now() + "_" + Math.random(),
              type: realm.projectileType,
              startX: 400, // Altar center
              startY: 650,
              targetX: target.x,
              targetY: target.y,
              x: 400,
              y: 650,
              targetAsteroidId: target.id,
              speed: projSpeed,
              progress: 0,
              color: realm.blastColor,
              trail: [],
              damage: 1
            };
            setProjectiles(projs => [...projs, newProj]);

            // Check if word is complete!
            if (newTyped.length >= target.word.length) {
              playAsteroidExplode(target.type);
              setActiveTargetId(null);
              targetLockRef.current = null;

              // Award Score & Combo
              setCombo(c => {
                const nextCombo = c + 1;
                setMaxCombo(m => Math.max(m, nextCombo));
                return nextCombo;
              });

              // ÁP DỤNG TALENTS BẠO KÍCH & THÔNG TUỆ (CẤP 1 - 3)
              let pointsEarned = target.points + (combo > 2 ? combo * 5 : 0);

              const critTalent = activeTalents.find(t => t.baseId === "divine_crit");
              if (critTalent) {
                const chance = critTalent.level === 1 ? 0.35 : critTalent.level === 2 ? 0.55 : 0.75;
                const mult = critTalent.multiplier;
                if (Math.random() < chance) {
                  pointsEarned = Math.round(pointsEarned * mult);
                  const isMax = critTalent.level === 3;
                  const critText: FloatingText = {
                    id: "crit_" + Date.now(),
                    text: isMax ? `⚡ CHÍ TÔN BẠO KÍCH! ${mult}x TU VI ⚡` : `BẠO KÍCH! ${mult}x TU VI`,
                    x: target.x,
                    y: target.y - 35,
                    color: isMax ? "#fbbf24" : "#f59e0b",
                    fontSize: isMax ? 17 : 15,
                    alpha: 1,
                    vy: -1.4,
                    lifetime: 100,
                    type: "score"
                  };
                  setFloatingTexts(ft => [...ft, critText]);
                }
              }

              const wisdomTalent = activeTalents.find(t => t.baseId === "wisdom_aura");
              if (wisdomTalent) {
                if (wisdomTalent.level === 1 && (target.type === "VOID" || target.type === "BLOOD_THUNDER")) {
                  pointsEarned = Math.round(pointsEarned * 1.5);
                } else if (wisdomTalent.level === 2 && (target.type === "VOID" || target.type === "BLOOD_THUNDER")) {
                  pointsEarned = Math.round(pointsEarned * 2.0);
                } else if (wisdomTalent.level === 3) {
                  pointsEarned = Math.round(pointsEarned * 3.0); // +200% on ALL asteroids
                }
              }

              // ÁP DỤNG TALENT HUYẾT LINH HẤP THU (HỒI MÁU CẤP 1 - 3)
              const leechTalent = activeTalents.find(t => t.baseId === "blood_drain");
              if (leechTalent) {
                const interval = leechTalent.level === 1 ? 5 : leechTalent.level === 2 ? 3 : 2;
                const healAmount = leechTalent.level === 3 ? 2 : 1;
                if ((wordsSlain + 1) % interval === 0) {
                  setHp(h => Math.min(maxHp, h + healAmount));
                  const healText: FloatingText = {
                    id: "heal_" + Date.now(),
                    text: leechTalent.level === 3 ? `+${healAmount} HP HUYẾT HẢI ĐỈNH PHONG` : `+${healAmount} HP Huyết Linh`,
                    x: 400,
                    y: 560,
                    color: "#34d399",
                    fontSize: 14,
                    alpha: 1,
                    vy: -0.8,
                    lifetime: 80,
                    type: "heal"
                  };
                  setFloatingTexts(ft => [...ft, healText]);
                }
              }

              setScore(s => {
                const nextScore = s + pointsEarned;
                checkRealmProgression(nextScore);
                return nextScore;
              });
              setWordsSlain(w => w + 1);

              // Floating IPA Card Text
              const floatingCard: FloatingText = {
                id: "ipa_" + Date.now(),
                text: `${target.word} ${target.ipa}`,
                subtext: target.meaning,
                x: target.x,
                y: target.y - 20,
                color: "#ffdf79",
                fontSize: 14,
                alpha: 1,
                vy: -0.8,
                lifetime: 140,
                type: "ipa_card"
              };
              setFloatingTexts(ft => [...ft, floatingCard]);

              // Particle Bursts
              const newParticles: Particle[] = Array.from({ length: 18 }).map(() => ({
                x: target!.x,
                y: target!.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: target!.type === "BLOOD_THUNDER" ? "#f43f5e" : target!.type === "VOID" ? "#a855f7" : target!.type === "INFERNO" ? "#f97316" : "#38bdf8",
                size: 2 + Math.random() * 4,
                alpha: 1,
                decay: 0.02 + Math.random() * 0.02,
                shape: "spark"
              }));
              setParticles(p => [...p, ...newParticles]);

              // Remove asteroid from active list
              return prevAsteroids.filter(a => a.id !== target!.id);
            } else {
              // Advance typed string
              return prevAsteroids.map(a => a.id === target!.id ? { ...a, typed: newTyped } : a);
            }
          } else {
            // Mismatch: reset combo
            setCombo(0);
          }
        }

        return prevAsteroids;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameMode, isPaused, isGameOver, showBreakthrough, currentRealmIdx, combo, playKeystroke, playSkillAttack, playAsteroidExplode, checkRealmProgression]);

  // 8. TICK LOOP: ASTEROIDS MOVEMENT & COLLISION
  useEffect(() => {
    if (gameMode !== "battle" || isPaused || isGameOver || showBreakthrough) return;

    const tick = () => {
      const now = performance.now();

      // A. SPAWN TIMER
      const spawnInterval = Math.max(2200, 3600 - currentRealmIdx * 350);
      if (now - lastSpawnTime.current > spawnInterval) {
        lastSpawnTime.current = now;
        spawnAsteroid(currentRealmIdx);
      }

      // B. MOVE ASTEROIDS
      setAsteroids(prevAsteroids => {
        const nextList: Asteroid[] = [];
        let tookDmg = false;

        prevAsteroids.forEach(ast => {
          const nextY = ast.y + ast.vy;
          const nextX = ast.x + ast.vx;
          const nextRot = ast.rotation + 0.02;

          // Check Altar Impact (Y >= 640)
          if (nextY >= 630) {
            tookDmg = true;
            playPlayerHurt();
            if (ast.id === targetLockRef.current) {
              setActiveTargetId(null);
              targetLockRef.current = null;
            }
          } else {
            nextList.push({ ...ast, x: nextX, y: nextY, rotation: nextRot });
          }
        });

        if (tookDmg) {
          setHp(prevHp => {
            const nextHp = Math.max(0, prevHp - 15);
            if (nextHp <= 0) {
              setCatState("defeated");
              setIsGameOver(true);
            } else {
              setCatState("hurt");
              setTimeout(() => setCatState("idle"), 240);
            }
            return nextHp;
          });
          setCombo(0);
        }

        return nextList;
      });

      // C. UPDATE PROJECTILES
      setProjectiles(prevProjs => {
        return prevProjs
          .map(p => {
            const dx = p.targetX - p.x;
            const dy = p.targetY - p.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 15) return null;

            const nextX = p.x + (dx / dist) * p.speed;
            const nextY = p.y + (dy / dist) * p.speed;
            const trail = [...p.trail, { x: p.x, y: p.y, alpha: 1 }].slice(-5);
            return { ...p, x: nextX, y: nextY, trail };
          })
          .filter(Boolean) as Projectile[];
      });

      // D. UPDATE PARTICLES
      setParticles(prevPts => {
        return prevPts
          .map(pt => ({
            ...pt,
            x: pt.x + pt.vx,
            y: pt.y + pt.vy,
            alpha: pt.alpha - pt.decay
          }))
          .filter(pt => pt.alpha > 0);
      });

      // E. UPDATE FLOATING TEXTS
      setFloatingTexts(prevFts => {
        return prevFts
          .map(ft => ({
            ...ft,
            y: ft.y + ft.vy,
            lifetime: ft.lifetime - 1,
            alpha: ft.lifetime < 30 ? ft.lifetime / 30 : 1
          }))
          .filter(ft => ft.lifetime > 0);
      });

      // F. CALCULATE REALTIME WPM & ACCURACY
      const elapsedMin = Math.max(0.1, (Date.now() - startTimeRef.current) / 60000);
      const calculatedWpm = Math.round((correctKeystrokes / 5) / elapsedMin);
      setWpm(calculatedWpm);

      if (totalKeystrokes > 0) {
        setAccuracy(Math.round((correctKeystrokes / totalKeystrokes) * 100));
      }

      loopRef.current = requestAnimationFrame(tick);
    };

    loopRef.current = requestAnimationFrame(tick);
    return () => {
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
    };
  }, [gameMode, isPaused, isGameOver, showBreakthrough, currentRealmIdx, correctKeystrokes, totalKeystrokes, spawnAsteroid, playPlayerHurt]);

  // 9. SAVE GAME TO SQL DATABASE
  const handleSaveGame = async () => {
    try {
      const payload = {
        slot_name: `Ngọc Giản Luyện Kiếm - ${REALMS[currentRealmIdx].name}`,
        realm: REALMS[currentRealmIdx].name,
        realm_idx: currentRealmIdx,
        title: REALMS[currentRealmIdx].title,
        hp,
        max_hp: maxHp,
        score,
        words_slain: wordsSlain,
        band_idx: currentRealmIdx,
        talents: {}
      };

      const res = await fetch("/api/meowcha/saves/1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Đã lưu tiến trình tu vi vào Ngọc Giản SQL thành công!");
      }
    } catch (e) {
      console.error("Save error", e);
    }
  };

  // Active target asteroid reference for HUD preview
  const activeAsteroid = asteroids.find(a => a.id === activeTargetId) || null;

  return (
    <div className="w-full h-full flex flex-col bg-black text-[#f9f5e8] select-none relative overflow-hidden">
      
      {/* LOBBY VIEW */}
      {gameMode === "lobby" && (
        <MeowchaLobby
          onStartBattle={handleStartBattle}
        />
      )}

      {/* BATTLE VIEW */}
      {gameMode === "battle" && (
        <div className="w-full h-full flex flex-col flex-1 relative overflow-hidden">
          {/* TOP HUD BANNER */}
          <MeowchaBanner
            currentRealmIdx={currentRealmIdx}
            hp={hp}
            maxHp={maxHp}
            score={score}
            wordsSlain={wordsSlain}
            wpm={wpm}
            combo={combo}
            activeAsteroid={activeAsteroid}
            activeTalents={activeTalents}
            isMuted={isMuted}
            bgmEnabled={bgmEnabled}
            onToggleMute={toggleMute}
            onToggleBgm={toggleBgm}
            onPause={() => setIsPaused(true)}
            onSaveGame={handleSaveGame}
            onExitGame={() => setShowExitConfirm(true)}
          />

          {/* MAIN ARENA CANVAS */}
          <div className="flex-1 w-full relative overflow-hidden">
            <MeowchaArena
              asteroids={asteroids}
              projectiles={projectiles}
              particles={particles}
              floatingTexts={floatingTexts}
              currentRealmIdx={currentRealmIdx}
              catState={catState}
              activeTargetId={activeTargetId}
              activeTalents={activeTalents}
            />
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODALS OVERLAYS */}
      {/* =================================================================== */}
      
      {/* Pause Modal */}
      <PauseModal
        isOpen={isPaused && !isGameOver && !showBreakthrough && !showExitConfirm}
        onResume={() => setIsPaused(false)}
        onSave={handleSaveGame}
        onExit={() => {
          setIsPaused(false);
          cleanCacheAndReset();
        }}
      />

      {/* Exit Confirm Modal */}
      <ExitConfirmModal
        isOpen={showExitConfirm}
        onCancel={() => setShowExitConfirm(false)}
        onConfirm={() => {
          setShowExitConfirm(false);
          cleanCacheAndReset();
        }}
      />

      {/* Breakthrough Modal */}
      <BreakthroughModal
        isOpen={showBreakthrough}
        nextRealmIdx={currentRealmIdx}
        options={breakthroughTalents}
        onSelectTalent={(t) => {
          setActiveTalents(prev => {
            const existingIdx = prev.findIndex(item => item.baseId === t.baseId);
            if (existingIdx >= 0) {
              const updated = [...prev];
              updated[existingIdx] = t;
              return updated;
            }
            return [...prev, t];
          });

          // Áp dụng tăng HP cho Hộ Thể Kim Thân / Bất Diệt Kim Thân
          if (t.baseId === "golden_shield") {
            const bonusMax = t.level === 1 ? 30 : t.level === 2 ? 30 : 40;
            const heal = t.level === 1 ? 15 : t.level === 2 ? 25 : 50;
            setMaxHp(m => m + bonusMax);
            setHp(h => Math.min(maxHp + bonusMax, h + heal));
          }

          const isMax = t.level >= 3;
          const ft: FloatingText = {
            id: "tal_" + Date.now(),
            text: isMax ? `⚡ ĐỈNH PHONG TỐI THƯỢNG: ${t.name}! ⚡` : `ĐẮC QUẢ: ${t.name}!`,
            subtext: t.desc,
            x: 400,
            y: 540,
            color: isMax ? "#fbbf24" : "#f59e0b",
            fontSize: isMax ? 18 : 16,
            alpha: 1,
            vy: -1.2,
            lifetime: 140,
            type: "breakthrough"
          };
          setFloatingTexts(prev => [...prev, ft]);
          setShowBreakthrough(false);
        }}
      />

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOver}
        score={score}
        wordsSlain={wordsSlain}
        wpm={wpm}
        accuracy={accuracy}
        realmName={REALMS[currentRealmIdx]?.name || "Luyện Khí Kỳ"}
        onRebirth={handleRebirth}
        onReturnLobby={cleanCacheAndReset}
      />

    </div>
  );
};
