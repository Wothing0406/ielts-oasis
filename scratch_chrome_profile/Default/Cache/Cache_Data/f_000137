/**
 * AudioManager.js - Động Cơ Âm Thanh Web Audio Tiên Đạo (Meow-Cha Xianxia Audio Engine)
 * Tạo nhạc nền Cổ Cầm thiền định đa tầng (Drone + Guqin Strings + Wind Chime)
 * và tổng hợp toàn bộ hiệu ứng âm thanh trảm kiếm, sấm sét, đột phá tiên gia
 */
(function(root) {
  class AudioManager {
    constructor() {
      this.ctx = null;
      this.soundEnabled = true;
      this.zenMusicPlaying = false;
      this.zenTimer = null;
      this.chimeTimer = null;
      this.droneGain = null;
      this.droneOsc1 = null;
      this.droneOsc2 = null;
      this.droneOsc3 = null;

      // Thang âm ngũ cung Trung Hoa Cổ Cầm (D, F, G, A, C)
      this.guqinNotes = [146.83, 174.61, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
      this.melodicMotifs = [
        [220.00, 261.63, 293.66],
        [293.66, 329.63, 261.63, 220.00],
        [196.00, 220.00, 261.63],
        [329.63, 293.66, 261.63, 196.00],
        [261.63, 293.66, 392.00, 440.00]
      ];
      this.motifStep = 0;
    }

    init() {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    }

    // Mở khóa AudioContext ngay khi người chơi chạm hoặc bấm phím bất kỳ
    unlockAudioContext() {
      this.init();
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().then(() => {
          if (this.soundEnabled && !this.zenMusicPlaying) {
            this.startZenGuqin();
          }
        }).catch(() => {});
      } else if (this.soundEnabled && !this.zenMusicPlaying) {
        this.startZenGuqin();
      }
    }

    toggleSound() {
      // Nếu audio context chưa chạy hoặc nhạc nền chưa phát: Bấm vào là để BẬT!
      if (!this.ctx || this.ctx.state !== "running" || !this.zenMusicPlaying || !this.soundEnabled) {
        this.soundEnabled = true;
        this.init();
        if (this.ctx && this.ctx.state === "suspended") {
          this.ctx.resume().then(() => {
            this.startZenGuqin();
            this.playChord([220, 261.63, 329.63, 440]);
          }).catch(() => {});
        } else {
          this.startZenGuqin();
          this.playChord([220, 261.63, 329.63, 440]);
        }
        return true;
      }

      // Nếu đang phát bình thường, bấm lần nữa mới là TẮT
      this.soundEnabled = false;
      this.stopZenGuqin();
      return false;
    }

    playChord(freqs, duration = 0.8, type = "sine") {
      if (!this.ctx || !this.soundEnabled) return;
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      const t = this.ctx.currentTime;
      freqs.forEach((freq, idx) => {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, t + idx * 0.05);
          gain.gain.setValueAtTime(0.0001, t + idx * 0.05);
          gain.gain.linearRampToValueAtTime(0.12, t + idx * 0.05 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.05 + duration);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t + idx * 0.05);
          osc.stop(t + idx * 0.05 + duration + 0.05);
        } catch (_) {}
      });
    }

    startZenGuqin() {
      if (!this.soundEnabled) return;
      this.init();
      if (!this.ctx) return;

      // Dừng phiên nhạc trước đó nếu còn
      this.stopZenGuqin(false);

      if (this.ctx.state === "suspended") {
        this.ctx.resume().then(() => {
          this._startDroneAndMelody();
        }).catch(() => {});
        return;
      }

      this._startDroneAndMelody();
    }

    _startDroneAndMelody() {
      if (!this.ctx || !this.soundEnabled) return;
      this.zenMusicPlaying = true;
      const t = this.ctx.currentTime;

      try {
        // 1. ÂM RUNG NỀN THIỀN ĐỊNH (3-Layer Tibetan Singing Bowl & Qi Drone)
        // Giảm âm lượng nhạc nền thiền định êm dịu, nhẹ nhàng, không lấn át âm thanh trận chiến
        this.droneGain = this.ctx.createGain();
        this.droneGain.gain.setValueAtTime(0.0001, t);
        this.droneGain.gain.exponentialRampToValueAtTime(0.016, t + 2.5);

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(420, t);

        // Tầng 1: Khí rung căn bản 110Hz (A2)
        this.droneOsc1 = this.ctx.createOscillator();
        this.droneOsc1.type = "sine";
        this.droneOsc1.frequency.setValueAtTime(110, t);

        // Tầng 2: Quãng năm thanh tịnh 165Hz (E3)
        this.droneOsc2 = this.ctx.createOscillator();
        this.droneOsc2.type = "triangle";
        this.droneOsc2.frequency.setValueAtTime(165, t);

        // Tầng 3: Khí vận bát quái 220Hz (A3)
        this.droneOsc3 = this.ctx.createOscillator();
        this.droneOsc3.type = "sine";
        this.droneOsc3.frequency.setValueAtTime(220, t);

        this.droneOsc1.connect(filter);
        this.droneOsc2.connect(filter);
        this.droneOsc3.connect(filter);
        filter.connect(this.droneGain);
        this.droneGain.connect(this.ctx.destination);

        this.droneOsc1.start(t);
        this.droneOsc2.start(t);
        this.droneOsc3.start(t);
      } catch (err) {
        console.warn("[AudioManager Drone]", err);
      }

      // 2. LẬP LỊCH GẨY ĐÀN CỔ CẦM (GUQIN MELODY LOOP)
      const scheduleNextPluck = () => {
        if (!this.zenMusicPlaying || !this.ctx || !this.soundEnabled) return;

        // Xen kẽ giữa câu nhạc ngũ cung (melodic motif) và gảy đơn nốt thanh tịnh
        if (Math.random() < 0.45) {
          this.playGuqinMotif();
        } else {
          this.playGuqinPluck();
        }

        const nextDelay = 1200 + Math.random() * 1800;
        this.zenTimer = setTimeout(scheduleNextPluck, nextDelay);
      };

      // Gảy nốt khai mở ngay lập tức sau 300ms
      this.zenTimer = setTimeout(scheduleNextPluck, 300);

      // 3. KHÁNH ĐỒNG TIÊN MÔN (WIND CHIME) định kỳ mỗi 8-12 giây
      const scheduleChime = () => {
        if (!this.zenMusicPlaying || !this.ctx || !this.soundEnabled) return;
        this.playTempleChime();
        this.chimeTimer = setTimeout(scheduleChime, 8000 + Math.random() * 5000);
      };
      this.chimeTimer = setTimeout(scheduleChime, 4500);
    }

    playGuqinPluck(customFreq = null) {
      if (!this.soundEnabled || !this.ctx) return;
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      const now = this.ctx.currentTime;
      const freq = customFreq || this.guqinNotes[Math.floor(Math.random() * this.guqinNotes.length)];

      try {
        // Dao động chính (Dây tơ Cổ Cầm - Silk String)
        const osc = this.ctx.createOscillator();
        const harm = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now);
        // Trượt ngón tay nhẹ nhàng đặc trưng Cổ Cầm (Finger slide vibrato)
        osc.frequency.exponentialRampToValueAtTime(freq * 0.992, now + 1.8);

        // Họa âm dây tơ
        harm.type = "sine";
        harm.frequency.setValueAtTime(freq * 2, now);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(freq * 4.2, now);
        filter.frequency.exponentialRampToValueAtTime(freq * 1.1, now + 2.4);

        // Phong bì biên độ (Âm lượng gảy Cổ Cầm êm đềm, ngân dài vừa phải)
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.042, now + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0003, now + 2.6);

        osc.connect(filter);
        harm.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        harm.start(now);
        osc.stop(now + 2.7);
        harm.stop(now + 2.7);
      } catch (err) {
        console.warn("[AudioManager Pluck]", err);
      }
    }

    playGuqinMotif() {
      if (!this.soundEnabled || !this.ctx) return;
      const motif = this.melodicMotifs[this.motifStep % this.melodicMotifs.length];
      this.motifStep++;
      motif.forEach((freq, idx) => {
        setTimeout(() => {
          if (this.zenMusicPlaying && this.soundEnabled) {
            this.playGuqinPluck(freq);
          }
        }, idx * 320);
      });
    }

    playTempleChime() {
      if (!this.soundEnabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const chimeFreq = Math.random() < 0.5 ? 880.00 : 1174.66; // A5 hoặc D6
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(chimeFreq, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.045, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.0);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 4.1);
      } catch (_) {}
    }

    stopZenGuqin(fade = true) {
      this.zenMusicPlaying = false;
      if (this.zenTimer) {
        clearTimeout(this.zenTimer);
        this.zenTimer = null;
      }
      if (this.chimeTimer) {
        clearTimeout(this.chimeTimer);
        this.chimeTimer = null;
      }
      if (this.droneGain && this.ctx) {
        try {
          const t = this.ctx.currentTime;
          if (fade) {
            this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, t);
            this.droneGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
            setTimeout(() => {
              this._cleanDroneNodes();
            }, 850);
          } else {
            this._cleanDroneNodes();
          }
        } catch (e) {
          this._cleanDroneNodes();
        }
      }
    }

    _cleanDroneNodes() {
      if (this.droneOsc1) { try { this.droneOsc1.stop(); this.droneOsc1.disconnect(); } catch (_) {} this.droneOsc1 = null; }
      if (this.droneOsc2) { try { this.droneOsc2.stop(); this.droneOsc2.disconnect(); } catch (_) {} this.droneOsc2 = null; }
      if (this.droneOsc3) { try { this.droneOsc3.stop(); this.droneOsc3.disconnect(); } catch (_) {} this.droneOsc3 = null; }
      if (this.droneGain) { try { this.droneGain.disconnect(); } catch (_) {} this.droneGain = null; }
    }

    play(type) {
      if (!this.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }

      const t = this.ctx.currentTime;

      switch (type) {
        case "type": {
          // Gõ phím đúng: Tiếng khánh ngọc thanh thoát (crisp jade chime ping), nghe cực kỳ rõ và sảng khoái trên loa di động
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc1.type = "sine";
          osc1.frequency.setValueAtTime(880, t); // A5
          osc1.frequency.exponentialRampToValueAtTime(1046.5, t + 0.08);
          osc2.type = "triangle";
          osc2.frequency.setValueAtTime(1760, t); // Họa âm ngọc bích
          gain.gain.setValueAtTime(0.24, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.ctx.destination);
          osc1.start(t); osc2.start(t);
          osc1.stop(t + 0.09); osc2.stop(t + 0.09);
          break;
        }

        case "slash": {
          // Xuất kiếm: Tiếng kiếm khí xé gió vút qua sắc lẹm
          const osc = this.ctx.createOscillator();
          const filter = this.ctx.createBiquadFilter();
          const gain = this.ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(1600, t);
          osc.frequency.exponentialRampToValueAtTime(320, t + 0.14);
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(1200, t);
          filter.Q.setValueAtTime(3.0, t);
          gain.gain.setValueAtTime(0.28, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
          osc.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
          osc.start(t); osc.stop(t + 0.14);
          break;
        }

        case "lightning": {
          // Sấm sét Cửu Thiên (Nguyên Anh Kỳ)
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(160, t);
          osc.frequency.exponentialRampToValueAtTime(30, t + 0.38);
          gain.gain.setValueAtTime(0.38, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
          osc.connect(gain); gain.connect(this.ctx.destination);
          osc.start(t); osc.stop(t + 0.38);
          break;
        }

        case "explosion": {
          // Trảm diệt ma thạch: Vỡ tung giòn giã, có xung lực trung âm nghe rõ trên mọi loa
          const osc = this.ctx.createOscillator();
          const noise = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(360, t);
          osc.frequency.exponentialRampToValueAtTime(60, t + 0.35);
          noise.type = "square";
          noise.frequency.setValueAtTime(820, t);
          noise.frequency.exponentialRampToValueAtTime(120, t + 0.25);
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(950, t);
          gain.gain.setValueAtTime(0.38, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          osc.connect(filter);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t); noise.start(t);
          osc.stop(t + 0.35); noise.stop(t + 0.35);
          break;
        }

        case "chime": {
          // Chuông ngân khánh ngọc thanh khiết
          [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, t + i * 0.05);
            gain.gain.setValueAtTime(0.22, t + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.45);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(t + i * 0.05); osc.stop(t + i * 0.05 + 0.45);
          });
          break;
        }

        case "breakthrough": {
          // Đột phá thăng thiên: Hợp âm ngũ cung đại đạo bừng nở
          const chord = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
          chord.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, t + idx * 0.09);
            gain.gain.setValueAtTime(0.15, t + idx * 0.09);
            gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.09 + 0.9);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(t + idx * 0.09); osc.stop(t + idx * 0.09 + 0.95);
          });
          break;
        }

        case "hurt": {
          // Gõ sai / bị chấn động đan điền: Tiếng mộc đao khựng lại rõ ràng
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(280, t);
          osc.frequency.exponentialRampToValueAtTime(80, t + 0.16);
          gain.gain.setValueAtTime(0.28, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
          osc.connect(gain); gain.connect(this.ctx.destination);
          osc.start(t); osc.stop(t + 0.16);
          break;
        }

        case "shatter": {
          // Hộ thuẫn tan vỡ / mảnh ngọc văng tung tóe
          [920, 1150, 680].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, t + idx * 0.03);
            osc.frequency.exponentialRampToValueAtTime(160, t + idx * 0.03 + 0.18);
            gain.gain.setValueAtTime(0.22, t + idx * 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.03 + 0.18);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(t + idx * 0.03); osc.stop(t + idx * 0.03 + 0.19);
          });
          break;
        }

        case "defeat": {
          // Thất bại: Giai điệu trầm buồn hạ âm
          [349.23, 311.13, 261.63, 196.00].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, t + idx * 0.18);
            gain.gain.setValueAtTime(0.18, t + idx * 0.18);
            gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.18 + 0.6);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(t + idx * 0.18); osc.stop(t + idx * 0.18 + 0.65);
          });
          break;
        }
      }
    }
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.AudioManager = AudioManager;
})(typeof window !== 'undefined' ? window : globalThis);
