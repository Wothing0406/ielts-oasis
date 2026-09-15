// components/meowcha/MeowchaGame.tsx - Root Game Controller & State Machine

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Asteroid, Projectile, Particle, FloatingText, VocabItem, 
  Realm, REALMS, Talent, TALENTS_DEFINITIONS, getTalentByLevel 
} from "@/types/meowcha";
import { CURATED_MEOWCHA_VOCAB } from "@/data/meowchaVocab";
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
  const [isLoadingBattle, setIsLoadingBattle] = useState<boolean>(false);

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
  const [screenShake, setScreenShake] = useState<number>(0);

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

  // Vocab Bank (Initialized immediately with 120+ Curated IELTS Words)
  const [vocabBank, setVocabBank] = useState<VocabItem[]>(CURATED_MEOWCHA_VOCAB);

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

  // References for Animation, Spawning & Mobile Keyboard
  const loopRef = useRef<number | null>(null);
  const lastSpawnTime = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const canSpawnNext = useRef<boolean>(true);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);
  const recentWordsRef = useRef<string[]>([]);

  // 1. FETCH VOCAB FROM BACKEND API & MERGE WITH CURATED BANK
  useEffect(() => {
    const fetchVocab = async () => {
      try {
        const res = await fetch("/api/meowcha/vocab?limit=250");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            // Merge with curated bank, avoiding duplicates by word
            const seen = new Set<string>();
            const merged: VocabItem[] = [];
            [...json.data, ...CURATED_MEOWCHA_VOCAB].forEach(item => {
              const w = item.word.toUpperCase().trim();
              if (!seen.has(w) && w.length >= 3 && w.length <= 13) {
                seen.add(w);
                merged.push({
                  ...item,
                  word: w
                });
              }
            });
            setVocabBank(merged);
          }
        }
      } catch (e) {
        console.warn("Using fallback local curated vocab bank.", e);
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
    setScreenShake(0);
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
    setIsLoadingBattle(false);
    canSpawnNext.current = true;
    recentWordsRef.current = [];
    setGameMode("lobby");
  }, []);

  // 3. START BATTLE WITH SERENE ZEN LOADING TRANSITION SCREEN
  const handleStartBattle = useCallback(() => {
    setIsLoadingBattle(true);

    // Reset combat stats
    setHp(50);
    setMaxHp(50);
    setScore(0);
    setWordsSlain(0);
    setCombo(0);
    setMaxCombo(0);
    setCurrentRealmIdx(0);
    setScreenShake(0);
    setActiveTalents([]);
    setAsteroids([]);
    setProjectiles([]);
    setParticles([]);
    setFloatingTexts([]);
    setActiveTargetId(null);
    setCatState("idle");
    setIsPaused(false);
    setIsGameOver(false);
    canSpawnNext.current = true;
    recentWordsRef.current = [];

    // Serene 1.2s Meditation Loading Transition before entering battle
    setTimeout(() => {
      startTimeRef.current = Date.now();
      lastSpawnTime.current = performance.now();
      setIsLoadingBattle(false);
      setGameMode("battle");

      // Auto-focus mobile soft keyboard input
      setTimeout(() => {
        mobileInputRef.current?.focus();
      }, 100);
    }, 1200);
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
    canSpawnNext.current = true;
    lastSpawnTime.current = performance.now();
  }, [maxHp]);

  // 5. CULTIVATION REALM PROGRESSION LOGIC (RAPID & REWARDING BREAKTHROUGHS)
  const checkRealmProgression = useCallback((newScore: number) => {
    let targetIdx = 0;
    for (let i = REALMS.length - 1; i >= 0; i--) {
      if (newScore >= REALMS[i].reqScore) {
        targetIdx = i;
        break;
      }
    }

    if (targetIdx > currentRealmIdx) {
      // Trigger breakthrough immediately
      setTimeout(() => {
        playBreakthrough();
        // Tạo danh sách 3 thẻ nâng cấp dựa trên các kỹ năng hiện có
        const candidateTalents: Talent[] = [];
        Object.keys(TALENTS_DEFINITIONS).forEach(baseId => {
          const current = activeTalents.find(t => t.baseId === baseId);
          if (!current) {
            candidateTalents.push(getTalentByLevel(baseId, 1));
          } else if (current.level < 3) {
            candidateTalents.push(getTalentByLevel(baseId, current.level + 1));
          }
        });

        // Bổ sung nếu ít hơn 3
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
      }, 700);
    }
  }, [currentRealmIdx, activeTalents, playBreakthrough]);

  // 6. SPAWN SINGLE ASTEROID (DROP ONE BY ONE - "THẢ TỪNG TỪ" WITH NO REPETITION)
  const spawnAsteroid = useCallback((realmIdx: number) => {
    const realm = REALMS[realmIdx] || REALMS[0];
    const pool = vocabBank.length > 0 ? vocabBank : CURATED_MEOWCHA_VOCAB;

    // Filter vocab close to current realm difficulty
    const targetBand = Math.min(3, realmIdx);
    let eligible = pool.filter(v => v.band_level === targetBand || v.band_level === targetBand - 1);
    if (eligible.length === 0) {
      eligible = pool.filter(v => v.band_level <= targetBand);
    }
    if (eligible.length === 0) eligible = pool;

    // Exclude recently used words to prevent repetition
    const unrecent = eligible.filter(v => !recentWordsRef.current.includes(v.word.toUpperCase()));
    const finalCandidates = unrecent.length > 0 ? unrecent : eligible;

    const randomVocab = finalCandidates[Math.floor(Math.random() * finalCandidates.length)];
    const chosenWord = randomVocab.word.toUpperCase().trim();

    // Push into recent words ring buffer (keeps last 25 words)
    recentWordsRef.current.push(chosenWord);
    if (recentWordsRef.current.length > 25) {
      recentWordsRef.current.shift();
    }

    // Determine Asteroid Type based on realm
    let astType: any = "FROST";
    if (realmIdx === 1) astType = "INFERNO";
    else if (realmIdx === 2) astType = "VOID";
    else if (realmIdx >= 3) astType = "BLOOD_THUNDER";

    // Centered spawn range (between 270 and 530)
    const spawnX = 280 + Math.random() * 240;
    
    // TÍNH TOÁN HIỆU LỰC TALENTS VỀ TỐC ĐỘ RƠI
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

    const speed = (0.50 + realmIdx * 0.16 + Math.random() * 0.10) * speedMod;

    const newAsteroid: Asteroid = {
      id: "ast_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      x: spawnX,
      y: -35,
      vx: (Math.random() - 0.5) * 0.12,
      vy: speed,
      word: chosenWord,
      typed: "",
      ipa: randomVocab.ipa || `/${chosenWord.toLowerCase()}/`,
      meaning: randomVocab.meaning || "Từ vựng IELTS",
      type: astType,
      hp: chosenWord.length,
      maxHp: chosenWord.length,
      radius: 26 + chosenWord.length * 1.5,
      speed: speed,
      points: 50 + chosenWord.length * 6,
      rotation: 0,
      pulse: 0,
      wordId: randomVocab.id
    };

    // Replace asteroids array with strictly ONE single asteroid
    setAsteroids([newAsteroid]);
    setActiveTargetId(newAsteroid.id);
  }, [vocabBank, activeTalents]);

  // 7. CENTRAL PROCESS KEYSTROKE ENGINE (NON-STUCK, LOCKED-ON, SINGLE WORD DROP)
  const processKeystroke = useCallback((rawChar: string) => {
    if (gameMode !== "battle" || isPaused || isGameOver || showBreakthrough) return;
    if (!/^[a-zA-Z]$/.test(rawChar)) return;
    const char = rawChar.toUpperCase();

    playKeystroke();
    setTotalKeystrokes(prev => prev + 1);

    setAsteroids(prevAsteroids => {
      if (prevAsteroids.length === 0) return prevAsteroids;

      // Single active asteroid locked-on
      const target = prevAsteroids[0];
      const nextExpectedChar = target.word[target.typed.length];

      if (char === nextExpectedChar) {
        // MATCH!
        const newTyped = target.typed + char;
        setCorrectKeystrokes(prev => prev + 1);
        playSkillAttack(currentRealmIdx);
        setCatState("attack");
        setTimeout(() => setCatState("idle"), 180);

        // Homing projectile from Altar (400, 635)
        const realm = REALMS[currentRealmIdx] || REALMS[0];
        const newProj: Projectile = {
          id: "proj_" + Date.now() + "_" + Math.random(),
          type: realm.projectileType,
          startX: 400,
          startY: 635,
          targetX: target.x,
          targetY: target.y,
          x: 400,
          y: 635,
          targetAsteroidId: target.id,
          speed: 28,
          progress: 0,
          color: realm.blastColor,
          trail: [],
          damage: 1
        };
        setProjectiles(projs => [...projs, newProj]);

        // CHECK IF WORD IS COMPLETELY SLAYED!
        if (newTyped.length >= target.word.length) {
          playAsteroidExplode(target.type);
          setActiveTargetId(null);

          // 1. KÍCH HOẠT VẠN KIẾM QUY TÔNG (ULTIMATE BLAST)
          setCatState("ultimate");
          setTimeout(() => setCatState("idle"), 650);

          // 2. PHÓNG BARRAGE 6 ĐẠO THẦN KIẾM VẠN KIẾM QUY TÔNG
          const swordCount = 6;
          const barrageProjs: Projectile[] = Array.from({ length: swordCount }).map((_, idx) => {
            const spreadX = (idx - (swordCount - 1) / 2) * 28;
            return {
              id: `barrage_${Date.now()}_${idx}_${Math.random()}`,
              type: realm.projectileType,
              startX: 400 + spreadX,
              startY: 630,
              targetX: target.x + (Math.random() - 0.5) * 45,
              targetY: target.y + (Math.random() - 0.5) * 45,
              x: 400 + spreadX,
              y: 630,
              targetAsteroidId: target.id,
              speed: 35,
              progress: 0,
              color: realm.blastColor,
              trail: [],
              damage: 2
            };
          });
          setProjectiles(projs => [...projs, ...barrageProjs]);

          // 3. HIỆU ỨNG VỤ NỔ BỤI TRÀ MATCHA & TRẢM KÍCH KIM QUANG
          const explosionP: Particle = {
            x: target.x,
            y: target.y,
            vx: 0,
            vy: 0,
            color: realm.blastColor,
            size: 95,
            alpha: 1,
            decay: 0.032,
            shape: "tea_explosion"
          };
          const slashP: Particle = {
            x: target.x,
            y: target.y,
            vx: 0,
            vy: 0,
            color: "#ffffff",
            size: 85,
            alpha: 1,
            decay: 0.045,
            shape: "slash"
          };
          setParticles(p => [...p, explosionP, slashP]);

          // Trigger Screen Shake ("HIỆU ỨNG RUNG")
          setScreenShake(16);

          // Award Combo
          let currentCombo = 0;
          setCombo(c => {
            currentCombo = c + 1;
            setMaxCombo(m => Math.max(m, currentCombo));
            return currentCombo;
          });

          // TU VI SCORE CALCULATION: BASE 50 + 6*LEN + COMBO BONUS
          const basePoints = 50 + target.word.length * 6;
          let pointsEarned = basePoints + (currentCombo > 1 ? currentCombo * 10 : 0);

          // ÁP DỤNG TALENTS BẠO KÍCH
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
                y: target.y - 45,
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

          // Hồi máu nếu có talent Huyết Linh
          const leechTalent = activeTalents.find(t => t.baseId === "blood_drain");
          if (leechTalent) {
            const interval = leechTalent.level === 1 ? 4 : leechTalent.level === 2 ? 3 : 2;
            const healAmount = leechTalent.level === 3 ? 3 : 1;
            if ((wordsSlain + 1) % interval === 0) {
              setHp(h => Math.min(maxHp, h + healAmount));
              const healText: FloatingText = {
                id: "heal_" + Date.now(),
                text: `+${healAmount} HP Huyết Linh`,
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

          // Award score & check breakthrough immediately
          setScore(s => {
            const nextScore = s + pointsEarned;
            checkRealmProgression(nextScore);
            return nextScore;
          });
          setWordsSlain(w => w + 1);

          // FLOATING TU VI GAINED POPUP
          const tuViFloating: FloatingText = {
            id: "tuvi_" + Date.now(),
            text: `+${pointsEarned} TU VI`,
            x: target.x,
            y: target.y - 35,
            color: "#6ee7b7",
            fontSize: 16,
            alpha: 1,
            vy: -1.2,
            lifetime: 85,
            type: "score"
          };

          // FLOATING TRIUMPHANT IPA FLASHCARD
          const floatingCard: FloatingText = {
            id: "ipa_" + Date.now(),
            text: `${target.word} ${target.ipa}`,
            subtext: target.meaning,
            x: target.x,
            y: Math.max(75, target.y - 10),
            color: "#ffdf79",
            fontSize: 14,
            alpha: 1,
            vy: -0.65,
            lifetime: 150,
            type: "ipa_card"
          };
          setFloatingTexts(ft => [...ft, tuViFloating, floatingCard]);

          // Sparkle burst particles
          const newParticles: Particle[] = Array.from({ length: 18 }).map(() => ({
            x: target.x,
            y: target.y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: target.type === "BLOOD_THUNDER" ? "#f43f5e" : target.type === "VOID" ? "#a855f7" : target.type === "INFERNO" ? "#f97316" : "#38bdf8",
            size: 2 + Math.random() * 4,
            alpha: 1,
            decay: 0.02 + Math.random() * 0.02,
            shape: "spark"
          }));
          setParticles(p => [...p, ...newParticles]);

          // Allow next single asteroid spawn after 650ms serene interval
          canSpawnNext.current = false;
          setTimeout(() => {
            canSpawnNext.current = true;
          }, 650);

          // Clear asteroid from active state
          return [];
        } else {
          // Advance typed string for current locked-on asteroid
          return [{ ...target, typed: newTyped }];
        }
      } else {
        // Mismatch: reset combo, but DO NOT switch or re-render different words!
        setCombo(0);
        return prevAsteroids;
      }
    });
  }, [gameMode, isPaused, isGameOver, showBreakthrough, currentRealmIdx, wordsSlain, maxHp, activeTalents, playKeystroke, playSkillAttack, playAsteroidExplode, checkRealmProgression]);

  // 8. PHYSICAL HARDWARE KEYBOARD LISTENER
  useEffect(() => {
    if (gameMode !== "battle" || isPaused || isGameOver || showBreakthrough) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsPaused(prev => !prev);
        return;
      }

      if (/^[a-zA-Z]$/.test(e.key)) {
        processKeystroke(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameMode, isPaused, isGameOver, showBreakthrough, processKeystroke]);

  // 9. MOBILE HIDDEN INPUT CHANGE HANDLER
  const handleMobileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val && val.length > 0) {
      const lastChar = val[val.length - 1];
      if (/^[a-zA-Z]$/.test(lastChar)) {
        processKeystroke(lastChar);
      }
    }
    e.target.value = "";
  };

  // 10. TICK LOOP: ASTEROID MOVEMENT, SCREEN SHAKE & PARTICLES
  useEffect(() => {
    if (gameMode !== "battle" || isPaused || isGameOver || showBreakthrough) return;

    const tick = () => {
      const now = performance.now();

      // A. SPAWN NEXT SINGLE ASTEROID ("THẢ TỪNG TỪ")
      if (asteroids.length === 0 && canSpawnNext.current && (now - lastSpawnTime.current > 500)) {
        lastSpawnTime.current = now;
        spawnAsteroid(currentRealmIdx);
      }

      // B. DECAY SCREEN SHAKE
      setScreenShake(s => Math.max(0, s * 0.88 - 0.2));

      // C. MOVE ASTEROID
      setAsteroids(prevAsteroids => {
        if (prevAsteroids.length === 0) return [];
        const ast = prevAsteroids[0];
        const nextY = ast.y + ast.vy;
        const nextX = ast.x + ast.vx;
        const nextRot = ast.rotation + 0.02;

        // Check Altar Impact (Y >= 630)
        if (nextY >= 630) {
          playPlayerHurt();
          setScreenShake(24);
          setActiveTargetId(null);

          // Apply damage
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

          // Allow next spawn after 600ms
          canSpawnNext.current = false;
          setTimeout(() => {
            canSpawnNext.current = true;
          }, 600);

          return [];
        }

        return [{ ...ast, x: nextX, y: nextY, rotation: nextRot }];
      });

      // D. UPDATE PROJECTILES
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

      // E. UPDATE PARTICLES
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

      // F. UPDATE FLOATING TEXTS
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

      // G. CALCULATE REALTIME WPM & ACCURACY
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
  }, [gameMode, isPaused, isGameOver, showBreakthrough, currentRealmIdx, asteroids.length, correctKeystrokes, totalKeystrokes, spawnAsteroid, playPlayerHurt]);

  // 11. SAVE GAME TO SQL DATABASE
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
  const activeAsteroid = asteroids.length > 0 ? asteroids[0] : null;

  return (
    <div className="w-full h-full flex flex-col bg-[#050b07] text-[#f9f5e8] select-none relative overflow-hidden">
      
      {/* HIDDEN INPUT FOR MOBILE SOFT KEYBOARD FOCUS */}
      <input
        ref={mobileInputRef}
        type="text"
        className="absolute opacity-0 pointer-events-none -top-96 left-0 w-1 h-1"
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        onChange={handleMobileInputChange}
      />

      {/* LOBBY VIEW */}
      {gameMode === "lobby" && !isLoadingBattle && (
        <MeowchaLobby
          onStartBattle={handleStartBattle}
        />
      )}

      {/* ZEN MEDITATION LOADING TRANSITION SCREEN */}
      {isLoadingBattle && (
        <div className="absolute inset-0 z-50 bg-[#050b07] flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-300">
          {/* Pulsing Yin-Yang / Lotus Emblem */}
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full border-2 border-[#ca8a04]/50 flex items-center justify-center shadow-[0_0_35px_#10b981] animate-spin [animation-duration:9s]">
              <div className="w-18 h-18 rounded-full border border-[#2dd4bf]/40 flex items-center justify-center bg-[#0a1f13]">
                <span className="text-3xl text-[#ffdf79] select-none">☯</span>
              </div>
            </div>
            <div className="absolute -inset-2 rounded-full border border-[#10b981]/30 animate-ping [animation-duration:3s]" />
          </div>

          {/* Main Title */}
          <h2 className="font-serif font-bold text-lg sm:text-xl text-[#ffdf79] tracking-widest text-center uppercase drop-shadow-md mb-2">
            Đang câu thông thiên địa, ngưng tụ kiếm ý...
          </h2>

          {/* Cultivation Quote */}
          <p className="font-serif italic text-xs sm:text-sm text-[#a7f3d0] text-center max-w-md mb-6 leading-relaxed">
            &ldquo;Tâm như chỉ thủy, kiếm xuất kinh lôi. Nhất niệm thanh tịnh, vạn ma tiêu tan.&rdquo;
          </p>

          {/* Progress Bar */}
          <div className="w-64 sm:w-80 h-2 bg-black/80 rounded-full border border-[#ca8a04]/60 p-0.5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#059669] via-[#10b981] to-[#ca8a04] rounded-full animate-pulse w-full" />
          </div>
          <span className="font-mono text-[11px] text-[#ca8a04] mt-2">
            Chuẩn bị tiến vào trận địa...
          </span>
        </div>
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
              screenShake={screenShake}
              onCanvasClick={() => {
                mobileInputRef.current?.focus();
              }}
            />
          </div>

          {/* MOBILE TACTILE CULTIVATION KEYBOARD (Visible only on mobile screens: sm:hidden) */}
          <div className="sm:hidden w-full bg-[#050b07]/95 border-t border-[#1b432a] px-1 py-1.5 flex flex-col gap-1 z-30 select-none backdrop-blur-md">
            {/* Row 1 */}
            <div className="flex justify-center gap-1">
              {["Q","W","E","R","T","Y","U","I","O","P"].map(letter => (
                <button
                  key={letter}
                  onClick={() => processKeystroke(letter)}
                  className="flex-1 py-2.5 bg-[#0c1e14] active:bg-[#15803d] text-[#ffdf79] border border-[#1b432a] rounded text-xs font-bold font-mono transition-transform active:scale-95 touch-manipulation shadow"
                >
                  {letter}
                </button>
              ))}
            </div>
            {/* Row 2 */}
            <div className="flex justify-center gap-1 px-2">
              {["A","S","D","F","G","H","J","K","L"].map(letter => (
                <button
                  key={letter}
                  onClick={() => processKeystroke(letter)}
                  className="flex-1 py-2.5 bg-[#0c1e14] active:bg-[#15803d] text-[#ffdf79] border border-[#1b432a] rounded text-xs font-bold font-mono transition-transform active:scale-95 touch-manipulation shadow"
                >
                  {letter}
                </button>
              ))}
            </div>
            {/* Row 3 */}
            <div className="flex justify-center gap-1 px-4">
              {["Z","X","C","V","B","N","M"].map(letter => (
                <button
                  key={letter}
                  onClick={() => processKeystroke(letter)}
                  className="flex-1 py-2.5 bg-[#0c1e14] active:bg-[#15803d] text-[#ffdf79] border border-[#1b432a] rounded text-xs font-bold font-mono transition-transform active:scale-95 touch-manipulation shadow"
                >
                  {letter}
                </button>
              ))}
            </div>
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
