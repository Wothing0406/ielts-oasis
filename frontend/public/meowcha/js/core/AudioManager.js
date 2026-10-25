/* Independent BGM/SFX/VOICE channels, serialized pronunciation and interruption recovery. */
(function(root) {
  class AudioManager {
    constructor() {
      this.ctx = null;
      try { this.soundEnabled = localStorage.getItem('meowcha_sound') !== 'off'; } catch (_) { this.soundEnabled = true; }
      this.zenMusicPlaying = false; this.musicRequested = false; this.musicNodes = [];
      this.voiceQueue = []; this.voiceJob = null; this.voiceGeneration = 0; this.motifStep = 0;
      this.completionTimers = new Set(); this.noiseBuffers = {}; this.eventCounts = {}; this.pronunciationCache = new Map();
      this.stats = { voiceCompleted: 0, voiceFallbacks: 0, voiceFailed: 0, sfxPlayed: 0 };
      this.lastError = ''; this.onStatusChange = null;
      this.volumes={master:.85,bgm:.8,sfx:.5,voice:.95,ambience:.15};
      try{
        const owner=JSON.parse(localStorage.getItem('oasis_user')||'null')?.id||'local';
        this.settingsKey='meowcha_audio_settings:'+owner;
        const saved=JSON.parse(localStorage.getItem(this.settingsKey)||'null');
        for(const channel of Object.keys(this.volumes))if(Number.isFinite(saved?.[channel]))this.volumes[channel]=Math.max(0,Math.min(1,saved[channel]));
      }catch(_){}
      this.buffers={};this.sampleSources=new Set();this.sampleFailures=0;this.voiceDucked=false;
      if (root.document && root.document.addEventListener) root.document.addEventListener('visibilitychange', () => {
        if (!root.document.hidden && this.soundEnabled) this.recover();
      });
    }
    init() {
      if (this.ctx && this.ctx.state === 'closed') {
        const requested = this.musicRequested;
        const pending=[...(this.voiceJob?[{word:this.voiceJob.word,url:this.voiceJob.url}]:[]),...this.voiceQueue];
        this.stopVoice();this.voiceQueue=pending;
        this.voiceMediaSource=null;this.voiceMedia=null;
        this.stopZenGuqin(); this.musicRequested = requested; this.ctx = null; this.noiseBuffers = {};
      }
      if (this.ctx) return;
      const Ctx = root.AudioContext || root.webkitAudioContext;
      if (!Ctx) return;
      try {
        this.ctx = new Ctx();
        this.master = this.ctx.createGain(); this.bgm = this.ctx.createGain(); this.sfx = this.ctx.createGain();
        this.voice=this.ctx.createGain();this.ambience=this.ctx.createGain();
        this.master.gain.value=this.soundEnabled?this.volumes.master:0;
        for(const channel of ['bgm','sfx','voice','ambience'])this[channel].gain.value=this.volumes[channel];
        const limiter = this.ctx.createDynamicsCompressor();
        limiter.threshold.value = -14; limiter.ratio.value = 8;
        for(const channel of ['bgm','sfx','voice','ambience'])this[channel].connect(this.master);
        if (this.ctx.createAnalyser) {
          this.analyser = this.ctx.createAnalyser(); this.analyser.fftSize = 512;
          this.master.connect(this.analyser); this.analyser.connect(limiter);
        } else this.master.connect(limiter);
        limiter.connect(this.ctx.destination);
        this.preloadSamples();
        this.ctx.onstatechange = () => {
          this.zenMusicPlaying = this.ctx.state === 'running' && this.musicNodes.length > 0;
          this.notifyStatus();
        };
      } catch (_) { this.ctx = null; this.lastError = 'Không khởi tạo được âm thanh'; this.notifyStatus(); }
    }
    setVolume(channel,value){
      if(!(channel in this.volumes)||!Number.isFinite(Number(value)))return;
      this.volumes[channel]=Math.max(0,Math.min(1,Number(value)));
      try{localStorage.setItem(this.settingsKey,JSON.stringify(this.volumes));}catch(_){}
      this.applyMix();this.notifyStatus();
    }
    setMode(mode){this.mode=mode;this.applyMix();}
    applyMix(){
      if(this.ctx){
        this.master.gain.setTargetAtTime(this.soundEnabled?this.volumes.master:0,this.ctx.currentTime,.03);
        for(const channel of ['bgm','sfx','voice','ambience']){
          const duck=this.voiceDucked?(channel==='bgm'?.32:channel==='sfx'?.4:channel==='ambience'?.25:1):1;
          const mode=channel==='sfx'&&this.mode==='AUDIO'?.65:1;
          this[channel].gain.setTargetAtTime(this.volumes[channel]*duck*mode,this.ctx.currentTime,channel==='bgm'?.25:.04);
        }
      }
      if(this.voiceJob?.audio&&!this.voiceJob.mediaConnected)this.voiceJob.audio.volume=this.soundEnabled?this.volumes.master*this.volumes.voice:0;
      if(this.voiceJob?.utterance)this.voiceJob.utterance.volume=this.soundEnabled?this.volumes.master*this.volumes.voice:0;
    }
    preloadSamples(){
      const catalog=root.Meowcha.AUDIO_ASSETS,context=this.ctx;
      if(!catalog||!root.fetch||!context.decodeAudioData)return;
      this.sampleLoading=Promise.allSettled(Object.entries(catalog).map(async([key,file])=>{
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
        try{
          const response=await root.fetch('./audio/'+file+'.ogg',{signal:controller.signal});
          if(!response.ok)throw new Error('asset');
          const buffer=await context.decodeAudioData(await response.arrayBuffer());
          if(this.ctx!==context)return;
          this.buffers[key]=buffer;
          if(key==='music'&&this.musicRequested&&this.soundEnabled){this._stopMusicNodes();this._startDroneAndMelody();}
        }catch(_){this.sampleFailures++;root.Meowcha.report?.('asset_load_failed');}
        finally{clearTimeout(timer);}
      }));
    }
    _sample(type,delay=0,volume=.45,channel=this.sfx){
      if(!this.buffers[type]||!this.ctx||!this.soundEnabled)return false;
      if(this.sampleSources.size>=12){const oldest=this.sampleSources.values().next().value;try{oldest.stop();}catch(_){}this.sampleSources.delete(oldest);}
      const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=this.buffers[type];gain.gain.value=volume;
      source.connect(gain);gain.connect(channel);this.sampleSources.add(source);
      source.onended=()=>{source.disconnect();gain.disconnect();this.sampleSources.delete(source);};
      source.start(this.ctx.currentTime+delay);return true;
    }
    _stopMusicNodes(){
      clearTimeout(this.zenTimer);clearTimeout(this.ambienceTimer);
      for(const {osc,gain} of this.musicNodes.splice(0)){try{osc.stop();osc.disconnect();gain.disconnect();}catch(_){}}
    }
    _startAmbience(){
      if(!this.ctx.createBuffer||!this.ctx.createBiquadFilter)return;
      const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*30,this.ctx.sampleRate),samples=buffer.getChannelData(0);
      let previous=0;
      for(let i=0;i<samples.length;i++){previous=(previous+(.5-Math.random())*.03)/1.03;samples[i]=previous*(.5+.5*Math.sin(i/this.ctx.sampleRate*.19)**2);}
      const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter();
      source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=700;source.connect(filter);filter.connect(this.ambience);source.start();
      this.musicNodes.push({osc:source,gain:filter});
      const bell=()=>{if(!this.musicRequested||!this.soundEnabled)return;this._sample('breakthrough',0,.10,this.ambience);this.ambienceTimer=setTimeout(bell,28000+Math.random()*23000);};
      this.ambienceTimer=setTimeout(bell,22000);
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
      this.init();this.applyMix();
      this.startZenGuqin(); this.play('chime'); this.notifyStatus(); return true;
    }
    toggleSound() {
      this.soundEnabled = !this.soundEnabled;
      try { localStorage.setItem('meowcha_sound', this.soundEnabled ? 'on' : 'off'); } catch (_) {}
      this.applyMix();
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
      if(this.buffers.music){
        const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=this.buffers.music;source.loop=true;gain.gain.value=.28;
        source.connect(gain);gain.connect(this.bgm);source.start();this.musicNodes.push({osc:source,gain});
        this.zenMusicPlaying=true;this._startAmbience();return;
      }
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
      this._stopMusicNodes();
    }
    silenceAll() { this.stopZenGuqin(); this.stopVoice();for(const source of [...this.sampleSources]){try{source.stop();}catch(_){}} }
    play(type, delay = 0) {
      if (!this.soundEnabled) return;
      this.init(); if (!this.ctx) return; if (this.ctx.state !== 'running') this.recover();
      const aliases = {type:'type_correct',slash:'word_slash',explosion:'meteor_crack',hurt:'player_hurt',shatter:'shield_break'};
      type = aliases[type] || type;
      this.stats.sfxPlayed++;
      this.eventCounts[type] = (this.eventCounts[type] || 0) + 1;
      if(this._sample(type,delay,type==='meteor_impact'?.5:type==='breakthrough'?.3:.35))return;
      const textures = {
        wrong_key:[.08,.11,450], sword_launch:[.1,.06,2300], sword_hit:[.075,.055,1800],
        word_slash:[.15,.14,2100], meteor_crack:[.22,.22,1200], meteor_impact:[.36,.25,350],
        shield_hit:[.12,.12,2800], shield_break:[.23,.16,3600]
      };
      if(textures[type]) this._noise(type, ...textures[type], delay);
      const semantic = {
        type_correct:[1100,.035,.055,'sine',1400],wrong_key:[180,.075,.09,'triangle',95],
        sword_launch:[650,.08,.04,'triangle',220],sword_hit:[900,.055,.045,'sine',650],
        word_slash:[720,.12,.09,'triangle',180],meteor_crack:[160,.18,.09,'triangle',60],
        meteor_impact:[85,.28,.18,'sine',35],shield_hit:[1200,.15,.1,'sine',650],
        shield_break:[1750,.2,.1,'sine',480],player_hurt:[180,.18,.09,'triangle',95],
        word_complete:[1320,.25,.08,'sine',1760],pause:[440,.12,.06,'sine',330],
        resume:[330,.12,.06,'sine',660]
      };
      if (semantic[type]) {
        const [f,d,v,w,e] = semantic[type];this._tone(f,d,v,w,this.sfx,delay,e);return;
      }
      const sounds = { type:[880,.07,.12,'sine',1046], slash:[960,.14,.16,'triangle',320],
        explosion:[440,.22,.20,'triangle',110], lightning:[170,.3,.17,'triangle',55],
        hurt:[260,.12,.15,'triangle',100], shatter:[1150,.18,.14,'sine',350] };
      if (type === 'chime' || type === 'breakthrough') this.playChord(type === 'chime' ? [523,659,784] : [262,330,392,523], type === 'chime' ? .35 : .8);
      else if (type === 'defeat') this.playChord([349,311,262,196], .6);
      else if (sounds[type]) { const [f,d,v,s,e] = sounds[type]; this._tone(f,d,v,s,this.sfx,delay,e); }
    }
    _noise(name, duration, volume, frequency, delay) {
      if (!this.ctx.createBuffer || !this.ctx.createBufferSource || !this.ctx.createBiquadFilter) return;
      let buffer = this.noiseBuffers[name];
      if (!buffer) {
        buffer = this.ctx.createBuffer(1, Math.ceil(this.ctx.sampleRate*duration), this.ctx.sampleRate);
        const samples = buffer.getChannelData(0); let previous = 0;
        for (let i=0;i<samples.length;i++) {
          const noise = Math.random()*2-1;
          previous = (previous + noise*.35)/1.35;
          samples[i] = name === 'wrong_key' ? previous : noise;
        }
        this.noiseBuffers[name] = buffer;
      }
      const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain();
      const at=this.ctx.currentTime+delay;
      source.buffer=buffer;filter.type='lowpass';filter.frequency.value=frequency;
      gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(volume,at+.004);
      gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
      source.connect(filter);filter.connect(gain);gain.connect(this.sfx);
      source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
      source.start(at);source.stop(at+duration+.01);
    }
    playWordCompletion(target) {
      if (!this.soundEnabled) return;
      this.play('word_slash',.035);this.play('meteor_crack',.11);this.play('word_complete',.24);
      const timer=setTimeout(()=>{
        this.completionTimers.delete(timer);
        if(this.soundEnabled) this.playWord(target);
      },340);
      this.completionTimers.add(timer);
    }
    pauseVoice(paused) {
      this.combatPaused = paused;
      const job = this.voiceJob;
      if (job && job.audio) {
        if (paused) job.audio.pause();
        else { const playing = job.audio.play(); if (playing && playing.catch) playing.catch(()=>{}); }
      }
      if (root.speechSynthesis) {
        if (paused && root.speechSynthesis.pause) root.speechSynthesis.pause();
        else if (!paused) root.speechSynthesis.resume();
      }
      if (job) {
        if (paused) { job.pauseTime = Date.now(); clearTimeout(job.timer); }
        else job.timer = setTimeout(()=>{ if(this.voiceJob===job && job.onDeadline) job.onDeadline(); },8000);
      }
      if (!paused) this._drainVoice();
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
      this.voiceDucked=active;this.applyMix();
    }
    async resolvePronunciation(word) {
      if (!root.fetch || !/^[A-Za-z][A-Za-z '-]{0,63}$/.test(word)) return '';
      const key = word.toLowerCase();
      if (this.pronunciationCache.has(key)) return this.pronunciationCache.get(key);
      const controller = new AbortController(), timer = setTimeout(()=>controller.abort(),5000);
      try {
        const response = await root.fetch('/api/tts', {method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({word}),signal:controller.signal});
        if (!response.ok) return '';
        const data = await response.json(), url = data.audio_url;
        if (typeof url !== 'string' || !url) return '';
        this.pronunciationCache.set(key,url);
        if (this.pronunciationCache.size > 256) this.pronunciationCache.delete(this.pronunciationCache.keys().next().value);
        return url;
      } catch (_) { return ''; } finally { clearTimeout(timer); }
    }
    _drainVoice() {
      if (!this.soundEnabled || this.combatPaused || this.voiceJob || !this.voiceQueue.length) return;
      const job = this.voiceQueue.shift(), generation = this.voiceGeneration;
      this.voiceJob = job; this._duckVoice(true);
      const done = ok => {
        if (generation !== this.voiceGeneration || this.voiceJob !== job) return;
        clearTimeout(job.timer);
        if (job.audio) { job.audio.onended = null; job.audio.onerror = null; job.audio.pause(); }
        if (!ok) {
          root.Meowcha.report?.('audio_failed');
          this.lastVoiceFailure = {word:job.word, reason:job.failureReason || 'voice_timeout', speechStarted:!!job.speechStarted, context:this.ctx ? this.ctx.state : 'uninitialized'};
          this.lastError = 'Chưa phát được từ ' + job.word + '. Bấm nghe lại hoặc kiểm tra âm thanh thiết bị.';
          this.notifyStatus();
        }
        this.voiceJob = null; this.stats[ok ? 'voiceCompleted' : 'voiceFailed']++; this._duckVoice(false); this._drainVoice();
      };
      let fellBack = false;
      const fallback = () => {
        if (fellBack || generation !== this.voiceGeneration || this.voiceJob !== job) return;
        fellBack = true;
        // A late MP3 error must not consume the speech fallback's own deadline.
        clearTimeout(job.timer);
        job.onDeadline = () => {
          if (generation !== this.voiceGeneration || this.voiceJob !== job) return;
          job.failureReason = 'speech_timeout';
          if (root.speechSynthesis) root.speechSynthesis.cancel();
          done(false);
        };
        job.timer = setTimeout(job.onDeadline,8000);
        if (job.audio) { job.audio.onerror = null; job.audio.onended = null; job.audio.pause(); }
        this.stats.voiceFallbacks++;
        const synth = root.speechSynthesis;
        if (!synth || !root.SpeechSynthesisUtterance) { done(false); return; }
        try {
          const u = new root.SpeechSynthesisUtterance(job.word); u.onstart = () => { job.speechStarted = true; }; u.lang = 'en-US'; u.rate = .9; u.volume = this.volumes.master*this.volumes.voice;
          const voices = synth.getVoices();
          u.voice = voices.find(v => /^en[-_]US$/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang)) || null;
          u.onend = () => done(true); u.onerror = event => { job.failureReason = event.error || 'speech_error'; done(false); }; job.utterance = u;
          if (synth.paused) synth.resume(); synth.speak(u);
        } catch (_) { done(false); }
      };
      job.onDeadline = fallback;
      job.timer = setTimeout(fallback,8000);
      const playMedia = value => {
        if (generation !== this.voiceGeneration || this.voiceJob !== job || fellBack) return;
        try {
          const url = value && new URL(value, root.location && root.location.href || 'https://localhost/');
          if (!url || !/^https?:$/.test(url.protocol) || !root.Audio) { fallback();return; }
          clearTimeout(job.timer);
          job.onDeadline = fallback;
          if (!this.combatPaused) job.timer = setTimeout(fallback,8000);
          const sameOrigin=!!(this.ctx?.createMediaElementSource&&root.location&&url.origin===root.location.origin);
          const mediaKey=sameOrigin?'voiceMedia':'externalVoiceMedia';
          const audio = this[mediaKey] || (this[mediaKey] = new root.Audio());
          audio.src = url.href; job.audio = audio;audio.volume=this.volumes.master*this.volumes.voice;
          // Same-origin MP3 can use the voice bus. External Oxford audio keeps its
          // native media path unless it supplies CORS, avoiding a silent output.
          if(sameOrigin){
            try{if(!this.voiceMediaSource){this.voiceMediaSource=this.ctx.createMediaElementSource(audio);this.voiceMediaSource.connect(this.voice);}job.mediaConnected=true;audio.volume=1;}catch(_){}
          }
          audio.onended = () => done(true); audio.onerror = fallback;
          if (!this.combatPaused) {
            const playing = audio.play();
            if (playing && playing.catch) playing.catch(fallback);
          }
        } catch (_) { fallback(); }
      };
      if (!job.url && root.fetch) {
        // Reuse the website's existing pronunciation service for words outside Oxford.
        this.stats.voiceFallbacks++;
        this.resolvePronunciation(job.word).then(url => playMedia(url));
      } else playMedia(job.url);
    }

    stopVoice() {
      for (const timer of this.completionTimers) clearTimeout(timer);
      this.completionTimers.clear();
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
        outputRms, volumes:{...this.volumes},sampleMusic:!!this.buffers.music,samplesLoaded:Object.keys(this.buffers).length,sampleFailures:this.sampleFailures,
        lastVoiceFailure:this.lastVoiceFailure || null, events:{...this.eventCounts}, voicePending:this.voiceQueue.length, voiceActive:!!this.voiceJob, lastError:this.lastError, ...this.stats };
    }
  }
  root.Meowcha = root.Meowcha || {}; root.Meowcha.AudioManager = AudioManager;
})(typeof window !== 'undefined' ? window : globalThis);
