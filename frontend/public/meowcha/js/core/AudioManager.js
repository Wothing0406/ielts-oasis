/* Independent BGM/SFX/VOICE channels, serialized pronunciation and interruption recovery. */
(function(root) {
  class AudioManager {
    constructor() {
      this.ctx = null;
      try { this.soundEnabled = localStorage.getItem('meowcha_sound') !== 'off'; } catch (_) { this.soundEnabled = true; }
      this.zenMusicPlaying = false; this.musicRequested = false; this.musicNodes = [];
      this.voiceQueue = []; this.voiceJob = null; this.voiceGeneration = 0; this.motifStep = 0;
      this.stats = { voiceCompleted: 0, voiceFallbacks: 0, voiceFailed: 0, sfxPlayed: 0 };
      this.lastError = ''; this.onStatusChange = null;
      if (root.document && root.document.addEventListener) root.document.addEventListener('visibilitychange', () => {
        if (!root.document.hidden && this.soundEnabled) this.recover();
      });
    }
    init() {
      if (this.ctx && this.ctx.state === 'closed') {
        const requested = this.musicRequested;
        this.stopZenGuqin(); this.musicRequested = requested; this.ctx = null;
      }
      if (this.ctx) return;
      const Ctx = root.AudioContext || root.webkitAudioContext;
      if (!Ctx) return;
      try {
        this.ctx = new Ctx();
        this.master = this.ctx.createGain(); this.bgm = this.ctx.createGain(); this.sfx = this.ctx.createGain();
        this.master.gain.value = this.soundEnabled ? 0.85 : 0; this.bgm.gain.value = 0.8; this.sfx.gain.value = 0.5;
        const limiter = this.ctx.createDynamicsCompressor();
        limiter.threshold.value = -14; limiter.ratio.value = 8;
        this.bgm.connect(this.master); this.sfx.connect(this.master);
        if (this.ctx.createAnalyser) {
          this.analyser = this.ctx.createAnalyser(); this.analyser.fftSize = 512;
          this.master.connect(this.analyser); this.analyser.connect(limiter);
        } else this.master.connect(limiter);
        limiter.connect(this.ctx.destination);
        this.ctx.onstatechange = () => {
          this.zenMusicPlaying = this.ctx.state === 'running' && this.musicNodes.length > 0;
          this.notifyStatus();
        };
      } catch (_) { this.ctx = null; this.lastError = 'Không khởi tạo được âm thanh'; this.notifyStatus(); }
    }
    recover() {
      if (!this.soundEnabled) return;
      this.init();
      const resume = this.ctx && this.ctx.state !== 'running' ? this.ctx.resume() : Promise.resolve();
      Promise.resolve(resume).then(() => {
        if (!this.soundEnabled) return;
        if (this.musicRequested && !this.musicNodes.length) this._startDroneAndMelody();
        this.zenMusicPlaying = !!(this.ctx && this.ctx.state === 'running' && this.musicNodes.length);
        if (root.speechSynthesis && root.speechSynthesis.paused) root.speechSynthesis.resume();
        this.lastError = '';
        this._drainVoice(); this.notifyStatus();
      }).catch(() => { this.lastError = 'Trình duyệt đang tạm chặn âm thanh. Chạm Bật âm thanh để khôi phục.'; this.notifyStatus(); });
    }
    unlockAudioContext() { if (this.soundEnabled) { this.musicRequested = true; this.recover(); } }
    notifyStatus() { if (this.onStatusChange) this.onStatusChange(this.getStatus()); }
    enableSound() {
      this.soundEnabled = true;
      try { localStorage.setItem('meowcha_sound', 'on'); } catch (_) {}
      this.init(); if (this.master) this.master.gain.value = 0.85;
      this.startZenGuqin(); this.play('chime'); this.notifyStatus(); return true;
    }
    toggleSound() {
      this.soundEnabled = !this.soundEnabled;
      try { localStorage.setItem('meowcha_sound', this.soundEnabled ? 'on' : 'off'); } catch (_) {}
      if (this.master) this.master.gain.value = this.soundEnabled ? 0.85 : 0;
      if (this.soundEnabled) this.startZenGuqin(); else { this.stopZenGuqin(); this.stopVoice(); }
      this.notifyStatus(); return this.soundEnabled;
    }
    _tone(freq, duration, volume, type = 'sine', channel = this.sfx, delay = 0, endFreq = freq) {
      if (!this.ctx || !this.soundEnabled || !channel) return;
      const start = this.ctx.currentTime + delay, osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
      osc.type = type; osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + duration);
      gain.gain.setValueAtTime(0.0001, start); gain.gain.linearRampToValueAtTime(volume, start + 0.014);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain); gain.connect(channel);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      osc.start(start); osc.stop(start + duration + 0.02);
    }
    startZenGuqin() { if (this.soundEnabled) { this.musicRequested = true; this.recover(); } }
    _startDroneAndMelody() {
      if (!this.ctx || !this.soundEnabled || this.musicNodes.length || this.ctx.state !== 'running') return;
      for (const freq of [110, 165]) {
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.frequency.value = freq; gain.gain.value = 0.02;
        osc.connect(gain); gain.connect(this.bgm); osc.start(); this.musicNodes.push({osc, gain});
      }
      this.zenMusicPlaying = true;
      const pluck = () => {
        if (!this.musicRequested || !this.soundEnabled) return;
        this.playGuqinPluck(); this.zenTimer = setTimeout(pluck, 1800 + Math.random() * 1000);
      };
      this.zenTimer = setTimeout(pluck, 150);
    }
    playGuqinPluck(freq) { const notes = [220, 261.63, 293.66, 329.63, 392]; this._tone(freq || notes[(this.motifStep++) % 5], 2.2, 0.09, 'triangle', this.bgm); }
    playGuqinMotif() { this.playGuqinPluck(); }
    playTempleChime() { this._tone(880, 2, 0.035, 'sine', this.bgm); }
    playChord(freqs, duration = 0.8, type = 'sine') { freqs.forEach((f, i) => this._tone(f, duration, 0.08, type, this.sfx, i * 0.06)); }
    stopZenGuqin() {
      this.musicRequested = false; this.zenMusicPlaying = false; clearTimeout(this.zenTimer);
      // Capture and dispose old nodes now; delayed cleanup must never kill a new session.
      for (const {osc, gain} of this.musicNodes.splice(0)) { try { osc.stop(); osc.disconnect(); gain.disconnect(); } catch (_) {} }
    }
    silenceAll() { this.stopZenGuqin(); this.stopVoice(); }
    play(type) {
      if (!this.soundEnabled) return;
      this.init(); if (!this.ctx) return; if (this.ctx.state !== 'running') this.recover();
      this.stats.sfxPlayed++;
      const sounds = { type:[880,.07,.12,'sine',1046], slash:[960,.14,.16,'triangle',320],
        explosion:[440,.22,.20,'triangle',110], lightning:[170,.3,.17,'triangle',55],
        hurt:[260,.12,.15,'triangle',100], shatter:[1150,.18,.14,'sine',350] };
      if (type === 'chime' || type === 'breakthrough') this.playChord(type === 'chime' ? [523,659,784] : [262,330,392,523], type === 'chime' ? .35 : .8);
      else if (type === 'defeat') this.playChord([349,311,262,196], .6);
      else if (sounds[type]) { const [f,d,v,s,e] = sounds[type]; this._tone(f,d,v,s,this.sfx,0,e); }
    }
    playWord(target) {
      if (!this.soundEnabled || !target || !target.word) return false;
      const word = String(target.word).trim();
      if (this.voiceJob && this.voiceJob.word === word && !this.voiceQueue.length) return true;
      this.voiceQueue.push({ word, url: target.audio_url || '' });
      if (this.voiceQueue.length > 24) this.voiceQueue.splice(0, this.voiceQueue.length - 24);
      this._drainVoice(); return true;
    }
    _duckVoice(active) {
      if (!this.ctx) return;
      this.bgm.gain.setTargetAtTime(active ? .25 : .8, this.ctx.currentTime, .08);
      this.sfx.gain.setTargetAtTime(active ? .20 : .5, this.ctx.currentTime, .04);
    }
    _drainVoice() {
      if (!this.soundEnabled || this.voiceJob || !this.voiceQueue.length) return;
      const job = this.voiceQueue.shift(), generation = this.voiceGeneration;
      this.voiceJob = job; this._duckVoice(true);
      const done = ok => {
        if (generation !== this.voiceGeneration || this.voiceJob !== job) return;
        clearTimeout(job.timer);
        if (job.audio) { job.audio.onended = null; job.audio.onerror = null; job.audio.pause(); }
        this.voiceJob = null; this.stats[ok ? 'voiceCompleted' : 'voiceFailed']++; this._duckVoice(false); this._drainVoice();
      };
      let fellBack = false;
      const fallback = () => {
        if (fellBack || generation !== this.voiceGeneration || this.voiceJob !== job) return;
        fellBack = true;
        if (job.audio) { job.audio.onerror = null; job.audio.onended = null; job.audio.pause(); }
        this.stats.voiceFallbacks++;
        const synth = root.speechSynthesis;
        if (!synth || !root.SpeechSynthesisUtterance) { done(false); return; }
        try {
          const u = new root.SpeechSynthesisUtterance(job.word); u.lang = 'en-US'; u.rate = .9; u.volume = .95;
          const voices = synth.getVoices();
          u.voice = voices.find(v => /^en[-_]US$/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang)) || null;
          u.onend = () => done(true); u.onerror = () => done(false); job.utterance = u;
          if (synth.paused) synth.resume(); synth.speak(u);
        } catch (_) { done(false); }
      };
      job.timer = setTimeout(() => {
        if (this.voiceJob !== job || generation !== this.voiceGeneration) return;
        if (!fellBack) { clearTimeout(job.timer); job.timer = setTimeout(() => done(false), 8000); fallback(); }
        else { if (root.speechSynthesis) root.speechSynthesis.cancel(); done(false); }
      }, 8000);
      try {
        const url = job.url && new URL(job.url, root.location && root.location.href || 'https://localhost/');
        if (url && /^https?:$/.test(url.protocol) && root.Audio) {
          const audio = this.voiceMedia || (this.voiceMedia = new root.Audio());
          audio.src = url.href; job.audio = audio; audio.volume = .95;
          audio.onended = () => done(true); audio.onerror = fallback;
          const promise = audio.play(); if (promise && promise.catch) promise.catch(fallback);
        } else fallback();
      } catch (_) { fallback(); }
    }
    stopVoice() {
      this.voiceGeneration++; this.voiceQueue = [];
      if (this.voiceJob) {
        clearTimeout(this.voiceJob.timer);
        if (this.voiceJob.audio) { this.voiceJob.audio.onended = null; this.voiceJob.audio.onerror = null; this.voiceJob.audio.pause(); }
      }
      this.voiceJob = null; if (root.speechSynthesis) root.speechSynthesis.cancel(); this._duckVoice(false);
    }
    getStatus() {
      let outputRms = null;
      if (this.analyser) {
        const samples = new Float32Array(this.analyser.fftSize);
        this.analyser.getFloatTimeDomainData(samples);
        outputRms = Math.sqrt(samples.reduce((sum, n) => sum + n*n, 0) / samples.length);
      }
      return { enabled:this.soundEnabled, context:this.ctx ? this.ctx.state : 'uninitialized', bgm:this.zenMusicPlaying,
        outputRms, voicePending:this.voiceQueue.length, voiceActive:!!this.voiceJob, lastError:this.lastError, ...this.stats };
    }
  }
  root.Meowcha = root.Meowcha || {}; root.Meowcha.AudioManager = AudioManager;
})(typeof window !== 'undefined' ? window : globalThis);
