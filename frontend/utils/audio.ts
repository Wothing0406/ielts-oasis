/**
 * IELTS Oasis - Universal Resilient Audio Utility
 * Multi-tier pronunciation playback:
 * Tier 1: Real human Oxford Dictionary MP3 (directAudioUrl)
 * Tier 2: Backend /api/tts (Oxford 5000 / Edge-TTS / Cached)
 * Tier 3: Cloud Google Translate TTS audio stream
 * Tier 4: Browser Web Speech API (window.speechSynthesis - offline & instant)
 */

let currentAudio: HTMLAudioElement | null = null;
let activePlayId = 0;

/**
 * Triệt tiêu hoàn toàn audio đang phát và gỡ bỏ mọi event listener
 * để ngăn chặn lỗi phát đè hoặc lặp lại tiếng của từ trước
 */
export const stopAllAudio = (): void => {
  activePlayId++;
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.oncanplay = null;
      currentAudio.onerror = null;
      currentAudio.onended = null;
      currentAudio.removeAttribute('src');
      currentAudio.load();
    } catch {
      // Ignore teardown errors
    }
    currentAudio = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      if ((window as any).__ieltsActiveUtterance) {
        (window as any).__ieltsActiveUtterance = null;
      }
    } catch {
      // Ignore synthesis cancel errors
    }
  }
};

export const speakWordWebSpeech = (word: string, playId?: number): boolean => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  const cleanWord = (word || '').trim();
  if (!cleanWord) return false;

  try {
    const synth = window.speechSynthesis;
    if (synth.paused) {
      synth.resume();
    }
    synth.cancel();

    // Kiểm tra nếu có lượt click mới hơn thì hủy
    if (playId !== undefined && playId !== activePlayId) {
      return false;
    }

    const utterance = new SpeechSynthesisUtterance(cleanWord);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Giữ tham chiếu trên window để tránh lỗi Chromium Garbage Collector tự hủy utterance
    (window as any).__ieltsActiveUtterance = utterance;

    utterance.onend = () => {
      if ((window as any).__ieltsActiveUtterance === utterance) {
        (window as any).__ieltsActiveUtterance = null;
      }
    };

    utterance.onerror = () => {
      if ((window as any).__ieltsActiveUtterance === utterance) {
        (window as any).__ieltsActiveUtterance = null;
      }
    };

    const voices = synth.getVoices();
    if (voices && voices.length > 0) {
      const enVoice =
        voices.find((v) => v.lang === 'en-US' || v.lang === 'en_US') ||
        voices.find((v) => v.lang && v.lang.startsWith('en'));
      if (enVoice) utterance.voice = enVoice;
    }

    synth.speak(utterance);
    return true;
  } catch (err) {
    console.warn('[audio] SpeechSynthesis error:', err);
    return false;
  }
};

const tryPlayUrl = (url: string, playId: number): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      // Nếu đã có lượt bấm mới hơn, lập tức hủy bỏ
      if (playId !== activePlayId) {
        resolve(false);
        return;
      }

      // Hủy audio cũ trước khi phát URL mới
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.oncanplay = null;
        currentAudio.onerror = null;
        currentAudio.onended = null;
        currentAudio.removeAttribute('src');
        currentAudio.load();
        currentAudio = null;
      }

      const audio = new Audio();
      currentAudio = audio;

      let settled = false;
      const done = (success: boolean) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          // Chỉ xác nhận thành công nếu playId này vẫn là lượt bấm mới nhất
          resolve(success && playId === activePlayId);
        }
      };

      const timer = setTimeout(() => done(false), 3500);

      audio.onended = () => {
        if (currentAudio === audio) {
          currentAudio = null;
        }
      };

      audio.onerror = () => {
        done(false);
      };

      const attemptPlay = () => {
        if (playId !== activePlayId) {
          done(false);
          return;
        }
        const p = audio.play();
        if (p !== undefined) {
          p.then(() => done(true)).catch(() => done(false));
        } else {
          done(true);
        }
      };

      audio.src = url;

      // Nếu trình duyệt đã cache và sẵn sàng phát ngay (readyState >= 2)
      if (audio.readyState >= 2) {
        attemptPlay();
      } else {
        audio.oncanplay = () => {
          attemptPlay();
        };
      }
    } catch {
      resolve(false);
    }
  });
};

export const playWordAudio = async (word: string, directAudioUrl?: string): Promise<boolean> => {
  const cleanWord = (word || '').trim();
  if (!cleanWord && !directAudioUrl) return false;

  // Cấp phát playId mới độc nhất cho mỗi lượt bấm - hủy mọi audio và tác vụ đang chờ
  const playId = ++activePlayId;
  stopAllAudio();
  activePlayId = playId;

  // 1. Tier 1: Direct Oxford Native Human Pronunciation
  if (directAudioUrl && typeof directAudioUrl === 'string' && directAudioUrl.trim()) {
    const ok = await tryPlayUrl(directAudioUrl.trim(), playId);
    if (ok) return true;
    if (playId !== activePlayId) return false;
  }

  // 2. Tier 2: Backend /api/tts endpoint
  if (cleanWord) {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: cleanWord }),
      });
      if (playId !== activePlayId) return false;
      if (res.ok) {
        const data = await res.json();
        if (data.audio_url) {
          const ok = await tryPlayUrl(data.audio_url, playId);
          if (ok) return true;
          if (playId !== activePlayId) return false;
        }
      }
    } catch (e) {
      console.warn('[audio] /api/tts call failed, attempting fallback...', e);
    }
  }

  if (playId !== activePlayId) return false;

  // 3. Tier 3: Google Translate TTS stream
  if (cleanWord) {
    const gUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(cleanWord)}`;
    const ok = await tryPlayUrl(gUrl, playId);
    if (ok) return true;
    if (playId !== activePlayId) return false;
  }

  if (playId !== activePlayId) return false;

  // 4. Tier 4: Browser SpeechSynthesis (Guaranteed to produce sound)
  return speakWordWebSpeech(cleanWord, playId);
};
