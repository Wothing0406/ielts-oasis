/**
 * AudioManager.js - Động Cơ Âm Thanh Web Audio Tiên Đạo
 * Tạo nhạc nền Cổ Cầm thiền định và tổng hợp toàn bộ hiệu ứng âm thanh trảm kiếm, sấm sét
 */
(function(root) {
  class AudioManager {
    constructor() {
      this.ctx = null;
      this.soundEnabled = true;
      this.zenMusicPlaying = false;
      this.zenTimer = null;
      this.droneGain = null;
      this.droneOsc1 = null;
      this.droneOsc2 = null;

      // Thang âm ngũ cung Trung Hoa (D, F, G, A, C)
      this.guqinNotes = [146.83, 174.61, 196.00, 220.00, 261.63, 293.66, 329.63, 349.23, 440.00];
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
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().then(() => {
          if (this.zenMusicPlaying && !this.zenTimer) {
            this.startZenGuqin();
          }
        }).catch(() => {});
      }
    }

    toggleSound() {
      this.soundEnabled = !this.soundEnabled;
      if (!this.soundEnabled) {
        this.stopZenGuqin();
      } else {
        this.startZenGuqin();
      }
      return this.soundEnabled;
    }

    startZenGuqin() {
      if (!this.soundEnabled) return;
      this.init();
      if (!this.ctx) return;

      // Đảm bảo dừng phiên nhạc trước đó nếu còn
      this.stopZenGuqin(false);

      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }

      this.zenMusicPlaying = true;
      const t = this.ctx.currentTime;

      try {
        // Âm rung nền (Drone) ngân vang thanh tịnh
        this.droneGain = this.ctx.createGain();
        this.droneGain.gain.setValueAtTime(0.0001, t);
        this.droneGain.gain.exponentialRampToValueAtTime(0.055, t + 2.0);

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(320, t);

        this.droneOsc1 = this.ctx.createOscillator();
        this.droneOsc1.type = "sine";
        this.droneOsc1.frequency.setValueAtTime(110, t); // Khí rung chuông thiền

        this.droneOsc2 = this.ctx.createOscillator();
        this.droneOsc2.type = "triangle";
        this.droneOsc2.frequency.setValueAtTime(165, t); // Quãng năm thanh tịnh

        this.droneOsc1.connect(filter);
        this.droneOsc2.connect(filter);
        filter.connect(this.droneGain);
        this.droneGain.connect(this.ctx.destination);

        this.droneOsc1.start(t);
        this.droneOsc2.start(t);
      } catch (err) {
        console.warn("[AudioManager Drone]", err);
      }

      const scheduleNextPluck = () => {
        if (!this.zenMusicPlaying || !this.ctx || !this.soundEnabled) return;
        this.playGuqinPluck();
        const nextDelay = 1400 + Math.random() * 2600;
        this.zenTimer = setTimeout(scheduleNextPluck, nextDelay);
      };

      this.zenTimer = setTimeout(scheduleNextPluck, 600);
    }

    playGuqinPluck() {
      if (!this.soundEnabled || !this.ctx) return;
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      const now = this.ctx.currentTime;
      const freq = this.guqinNotes[Math.floor(Math.random() * this.guqinNotes.length)];

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(freq * 3.5, now);
        filter.frequency.exponentialRampToValueAtTime(freq * 0.9, now + 2.6);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.035);
        gain.gain.exponentialRampToValueAtTime(0.0002, now + 2.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 2.8);
      } catch (err) {
        console.warn("[AudioManager Pluck]", err);
      }
    }

    stopZenGuqin(fade = true) {
      this.zenMusicPlaying = false;
      if (this.zenTimer) {
        clearTimeout(this.zenTimer);
        this.zenTimer = null;
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
          // Gõ phím đúng: Tiếng mõ gỗ thanh tao
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(480, t);
          osc.frequency.exponentialRampToValueAtTime(180, t + 0.035);
          gain.gain.setValueAtTime(0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
          osc.connect(gain); gain.connect(this.ctx.destination);
          osc.start(); osc.stop(t + 0.035);
          break;
        }

        case "slash": {
          // Xuất kiếm: Tiếng xé gió sắc lẹm
          const osc = this.ctx.createOscillator();
          const filter = this.ctx.createBiquadFilter();
          const gain = this.ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(1050, t);
          osc.frequency.exponentialRampToValueAtTime(240, t + 0.12);
          filter.type = "highpass";
          filter.frequency.setValueAtTime(550, t);
          gain.gain.setValueAtTime(0.22, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          osc.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
          osc.start(); osc.stop(t + 0.12);
          break;
        }

        case "lightning": {
          // Sấm sét Cửu Thiên (Nguyên Anh Kỳ)
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(140, t);
          osc.frequency.exponentialRampToValueAtTime(35, t + 0.35);
          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          osc.connect(gain); gain.connect(this.ctx.destination);
          osc.start(); osc.stop(t + 0.35);
          break;
        }

        case "explosion": {
          // Phá vỡ thiên thạch: Tiếng nổ trầm vang
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(160, t);
          osc.frequency.exponentialRampToValueAtTime(25, t + 0.4);
          gain.gain.setValueAtTime(0.35, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          osc.connect(gain); gain.connect(this.ctx.destination);
          osc.start(); osc.stop(t + 0.4);
          break;
        }

        case "chime": {
          // Chuông ngân khánh ngọc
          [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, t + i * 0.05);
            gain.gain.setValueAtTime(0.12, t + i * 0.05);
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
          // Gõ sai / bị thương: Tiếng khiên chặn đòn
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(130, t);
          osc.frequency.linearRampToValueAtTime(45, t + 0.2);
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.linearRampToValueAtTime(0.01, t + 0.2);
          osc.connect(gain); gain.connect(this.ctx.destination);
          osc.start(); osc.stop(t + 0.2);
          break;
        }

        case "shatter": {
          // Khiên vỡ: Thủy tinh tan vỡ
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(750, t);
          osc.frequency.exponentialRampToValueAtTime(80, t + 0.28);
          gain.gain.setValueAtTime(0.25, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
          osc.connect(gain); gain.connect(this.ctx.destination);
          osc.start(); osc.stop(t + 0.28);
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
