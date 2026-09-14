// hooks/useMeowchaAudio.ts - Procedural Xianxia Web Audio Synthesizer & Zen Soundscape

import { useEffect, useRef, useState, useCallback } from "react";
import { AsteroidType } from "@/types/meowcha";

export function useMeowchaAudio() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgmTimerRef = useRef<any>(null);
  const droneOscRef = useRef<OscillatorNode | null>(null);
  const droneGainRef = useRef<GainNode | null>(null);

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(true);

  // Initialize or resume AudioContext
  const getAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  // Sync mute setting with localStorage & auto-resume audio context on first user gesture
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMute = localStorage.getItem("meowcha_muted");
      if (savedMute !== null) {
        setIsMuted(savedMute === "true");
      }
      const savedBgm = localStorage.getItem("meowcha_bgm");
      if (savedBgm !== null) {
        setBgmEnabled(savedBgm === "true");
      }

      const handleFirstInteraction = () => {
        const ctx = getAudioContext();
        if (ctx && ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }
      };

      window.addEventListener("pointerdown", handleFirstInteraction, { once: true });
      window.addEventListener("keydown", handleFirstInteraction, { once: true });

      return () => {
        window.removeEventListener("pointerdown", handleFirstInteraction);
        window.removeEventListener("keydown", handleFirstInteraction);
      };
    }
  }, [getAudioContext]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("meowcha_muted", String(next));
      }
      return next;
    });
  }, []);

  const toggleBgm = useCallback(() => {
    setBgmEnabled(prev => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("meowcha_bgm", String(next));
      }
      return next;
    });
  }, []);

  // 1. GÕ PHÍM - KEYSTROKE CLACK
  const playKeystroke = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.03);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.035);
  }, [isMuted, getAudioContext]);

  // 2. CHIÊU THỨC TỪNG DẠNG THẦN (UNIQUE CHARACTER SKILLS)
  const playSkillAttack = useCallback((realmIdx: number) => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    if (realmIdx === 0) {
      // Luyện Khí: Thanh Trúc Kiếm Khí (Bamboo Blade Whistle)
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(820, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.1);

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1200, t);
      filter.Q.setValueAtTime(3, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    } else if (realmIdx === 1) {
      // Trúc Cơ: Bích Hải Lưu Quang (Dual Jade Resonant Bell Ring)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "triangle";
      osc1.frequency.setValueAtTime(660, t);
      osc1.frequency.exponentialRampToValueAtTime(440, t + 0.14);
      osc2.frequency.setValueAtTime(880, t);
      osc2.frequency.exponentialRampToValueAtTime(580, t + 0.14);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.15);
      osc2.stop(t + 0.15);
    } else if (realmIdx === 2) {
      // Kim Đan: Thái Ất Chân Hỏa Kiếm (Solar Piercing Golden Chime)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.18);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.19);
    } else if (realmIdx === 3) {
      // Nguyên Anh: Cửu Thiên Lôi Đình Kiếm (Thunderbolts & Lightning Crackle)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(950, t);
      osc.frequency.setValueAtTime(140, t + 0.05);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.22);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.23);
    } else {
      // Độ Kiếp / Hóa Thần: Vạn Kiếp Long Ngâm Quy Tông (Celestial Dragon Roar)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sawtooth";
      osc2.type = "triangle";
      osc1.frequency.setValueAtTime(320, t);
      osc1.frequency.linearRampToValueAtTime(80, t + 0.35);
      osc2.frequency.setValueAtTime(160, t);
      osc2.frequency.linearRampToValueAtTime(45, t + 0.35);

      gain.gain.setValueAtTime(0.38, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.4);
      osc2.stop(t + 0.4);
    }
  }, [isMuted, getAudioContext]);

  // 3. THIÊN THẠCH VỠ (ASTEROID EXPLOSION)
  const playAsteroidExplode = useCallback((type?: AsteroidType) => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type === "BLOOD_THUNDER" ? "sawtooth" : "triangle";
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.3);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.32);
  }, [isMuted, getAudioContext]);

  // 4. BỊ THƯƠNG (PLAYER HURT)
  const playPlayerHurt = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(90, t + 0.18);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }, [isMuted, getAudioContext]);

  // 5. ĐỘT PHÁ CẢNH GIỚI (BREAKTHROUGH ENLIGHTENMENT CHIME)
  const playBreakthrough = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Pentatonic chord arpeggio: C5 -> E5 -> G5 -> C6
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((freq, idx) => {
      const noteStart = t + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.2, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteStart);
      osc.stop(noteStart + 0.55);
    });
  }, [isMuted, getAudioContext]);

  // 6. NHẠC NỀN THIỀN ĐỊNH TU TẬP (PROCEDURAL ZEN XIANXIA SOUNDSCAPE)
  useEffect(() => {
    if (isMuted || !bgmEnabled) {
      if (bgmTimerRef.current) {
        clearInterval(bgmTimerRef.current);
        bgmTimerRef.current = null;
      }
      if (droneOscRef.current && droneGainRef.current) {
        try {
          droneGainRef.current.gain.linearRampToValueAtTime(0.0001, (audioCtxRef.current?.currentTime || 0) + 0.5);
          setTimeout(() => {
            droneOscRef.current?.stop();
            droneOscRef.current?.disconnect();
            droneOscRef.current = null;
          }, 600);
        } catch (_) {}
      }
      return;
    }

    const ctx = getAudioContext();
    if (!ctx) return;

    // A. Start deep meditative Zen drone (108Hz Om frequency)
    if (!droneOscRef.current) {
      const droneOsc = ctx.createOscillator();
      const droneGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      droneOsc.type = "sine";
      droneOsc.frequency.setValueAtTime(108, ctx.currentTime);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(250, ctx.currentTime);

      droneGain.gain.setValueAtTime(0.001, ctx.currentTime);
      droneGain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 3);

      droneOsc.connect(filter);
      filter.connect(droneGain);
      droneGain.connect(ctx.destination);

      droneOsc.start();
      droneOscRef.current = droneOsc;
      droneGainRef.current = droneGain;
    }

    // B. Periodic gentle Guzheng pentatonic notes (D major / Chinese Yu/Gong mode)
    const notes = [293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25]; // D4, E4, G4, A4, C5, D5, E5

    const playZenPluck = () => {
      if (isMuted || !bgmEnabled) return;
      const currentCtx = getAudioContext();
      if (!currentCtx || currentCtx.state !== "running") return;
      const t = currentCtx.currentTime;

      const randomFreq = notes[Math.floor(Math.random() * notes.length)];
      const osc = currentCtx.createOscillator();
      const gain = currentCtx.createGain();
      const filter = currentCtx.createBiquadFilter();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(randomFreq, t);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1400, t);
      filter.frequency.exponentialRampToValueAtTime(400, t + 1.2);

      gain.gain.setValueAtTime(0.045, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(currentCtx.destination);

      osc.start(t);
      osc.stop(t + 1.7);
    };

    // Trigger initial pluck then gentle random intervals
    bgmTimerRef.current = setInterval(() => {
      if (Math.random() > 0.25) {
        playZenPluck();
      }
    }, 2800);

    return () => {
      if (bgmTimerRef.current) {
        clearInterval(bgmTimerRef.current);
        bgmTimerRef.current = null;
      }
    };
  }, [isMuted, bgmEnabled, getAudioContext]);

  return {
    isMuted,
    toggleMute,
    bgmEnabled,
    toggleBgm,
    playKeystroke,
    playSkillAttack,
    playAsteroidExplode,
    playPlayerHurt,
    playBreakthrough
  };
}
