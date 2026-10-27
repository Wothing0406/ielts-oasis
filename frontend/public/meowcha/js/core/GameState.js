/**
 * GameState.js - Quản Lý Trạng Thái Tập Trung Của Trò Chơi
 * Cung cấp luồng dữ liệu đơn hướng (Single Source of Truth) cho toàn bộ engine
 */
(function(root) {
  class GameState {
    constructor() {
      this.highScore = 0;
      try {
        this.highScore = parseInt(localStorage.getItem("meowcha_high_score") || "0", 10) || 0;
      } catch (e) {}
      this.reset();
      this.listeners = [];
    }

    reset() {
      const prevHighScore = Math.max(this.highScore || 0, this.score || 0);
      if (prevHighScore > (this.highScore || 0)) {
        this.highScore = prevHighScore;
        try {
          localStorage.setItem("meowcha_high_score", String(this.highScore));
        } catch (e) {}
      }
      this.currentScene = "LOBBY"; // LOBBY | BATTLE
      this.isPaused = false;
      this.pauseStartedAt = null;
      this.isGameOver = false;
      this.showBreakthrough = false;

      // Chỉ số sinh mệnh & tu vi
      this.hp = 50;
      this.maxHp = 50;
      this.shieldCharges = 0;
      this.score = 0;
      this.highScore = prevHighScore; // Kỷ lục cao nhất Bảng Phong Thần được bảo lưu vĩnh viễn
      this.wordsSlain = 0;
      this.realmIdx = 0;

      // Chỉ số kỹ năng gõ phím
      this.combo = 0;
      this.maxCombo = 0;
      this.correctKeystrokes = 0;
      this.totalKeystrokes = 0;
      this.startTime = 0;
      this.wpm = 0;
      this.accuracy = 100;
      this.resetRunMetrics();

      // Trạng thái nhân vật & hoạt ảnh
      this.catState = "IDLE"; // IDLE | WEAK_ATTACK | ULTIMATE_BLAST | HURT | DEFEATED | BREAKTHROUGH
      this.catStateTimer = 0;
      this.catRecoveryPulse = 0; // 0 -> 1 -> 0 sau khi bị đánh để hồi phục tự nhiên
      this.screenShake = 0;
      this.screenFlash = 0; // 0 -> 1 khi sét đánh / thiên kiếp giáng lâm
      this.speechText = "";
      this.speechTimer = 0;

      // Cơ chế Choáng & Tăng Tốc Độ Rơi Khi Gõ Sai (Stun & Escalation)
      this.isStunned = false;
      this.stunTimer = 0;
      this.speedMultiplier = 1.0;
      this.typoCount = 0;

      // Thiên phú Roguelike
      this.talents = {
        hpBonus: 0,
        slowFactor: 1.0,
        critChance: 0.0,
        scoreMultiplier: 1.0,
        shieldCharges: 0,
        autoKill: false,
        typoImmune: false
      };
      this.unlockedSkills = ['QI_SHIELD_PASSIVE'];
      this.skillLevels = { QI_SHIELD_PASSIVE: 1 };
      this.skillCooldowns = {};
      this.activeSkillEffects = {};
      this.selectedTalents = [];
      this.passiveModifiers = {
        damageReduction: 0,
        comboBonus: 0.08,
        meaningDisplayDuration: 3200,
        weakWordWeight: 1.0,
        hazardDurationBonus: 1.0,
        mindHint: false
      };

      this.selectedBandIdx = 0;
      this.activeSlotId = this.activeSlotId || 1;
      this.pendingBreakthrough = false;

      // Tụ Khí Tuyệt Kỹ Theo Cảnh Giới (Realm Passive Skill Gauge)
      this.realmPassiveCharge = 0;
      this.realmPassiveMax = 5;
      this.chibiAttackFlash = 0;

      // Pháp Môn & Ngọc Giản Tu Luyện (IELTS Deck & Game Mode)
      this.activeDeckId = this.activeDeckId || "oxford_5000"; // oxford_5000 | listening_1200 | reading_academic | flashcard_srs
      this.gameMode = this.gameMode || "DIRECT"; // DIRECT (Chính Tả Phản Xạ) | CLOZE (Ngộ Đạo Thông Linh) | AUDIO (Thính Lôi Biện Âm)
    }

    getRealmPassiveConfig() {
      const configs = [
        { max: 5, name: "TRÚC PHONG TRÌ HOÃN", color: "#34D399" },
        { max: 6, name: "SONG KIẾM HỢP BÍCH", color: "#38BDF8" },
        { max: 5, name: "KIM LIÊN BẠO PHÁ", color: "#FBBF24" },
        { max: 5, name: "NGUYÊN ANH LÔI KÍCH", color: "#C084FC" },
        { max: 4, name: "CHÂN LONG PHỆ THIÊN", color: "#F59E0B" }
      ];
      return configs[Math.min(4, Math.max(0, this.realmIdx || 0))];
    }

    resetRunMetrics() {
      this.runMetricsVersion=2;
      this.learningMetricsVersion=2;this.learningAttempts=0;this.firstSuccesses=0;this.hintsUsed=0;this.replayCount=0;
      this.runId = (root.crypto && root.crypto.randomUUID) ? root.crypto.randomUUID() :
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.floor(Math.random() * 16);
          return (c === 'x' ? r : (r & 3) | 8).toString(16);
        });
      this.activeElapsedMs = 0;
      this.correctKeystrokes = 0;
      this.totalKeystrokes = 0;
      this.assistedKeystrokes = 0;
      this.assistedWords = 0;
      this.humanWords = 0;
      this.humanWordCombo = 0;
      this.maxPerfectStreak=0;this.perfectMetricsKnown=true;
      this.assisted = false;
      this.runFinished = false;
      this.baselineScore = 0;
      this.baselineWords = 0;
      this.wpm = 0;
      this.accuracy = 100;
      this.recentHumanWpm=[];
      this.difficultyVersion=2;this.minimumTargetSeconds=0;
    }

    recordHumanWord(target) {
      if(!target||target.assistedKeystrokes||!Number.isFinite(target.humanStartedMs))return;
      const elapsed=Math.max(800,this.activeElapsedMs-target.humanStartedMs);
      const wpm=Math.max(5,Math.min(180,target.word.length*12000/elapsed));
      this.recentHumanWpm=[...(this.recentHumanWpm||[]),wpm].slice(-9);
    }

    getRollingHumanWpm() {
      const values=(this.recentHumanWpm||[]).slice().sort((a,b)=>a-b);
      return values.length<3?40:values[Math.floor(values.length/2)];
    }

    setPaused(paused) {
      if (paused === this.isPaused) return;
      const now = performance.now();
      if (paused) this.pauseStartedAt = now;
      else if (this.pauseStartedAt !== null) {
        const elapsed = now - this.pauseStartedAt;
        for (const key of ['catStateTimer','stunTimer','speechTimer']) {
          if (this[key] > 0) this[key] += elapsed;
        }
        this.pauseStartedAt = null;
      }
      this.isPaused = paused;
    }

    advanceClock(dt) {
      if (this.currentScene === 'BATTLE' && !this.isPaused && !this.isGameOver &&
          this.catState !== 'BREAKTHROUGH') {
        this.activeElapsedMs += Math.max(0, dt * 1000);
      }
    }

    getRunMetrics() {
      const fields = ['runId', 'activeElapsedMs', 'correctKeystrokes', 'totalKeystrokes',
        'assistedKeystrokes', 'assistedWords', 'humanWords', 'humanWordCombo', 'assisted',
        'runFinished', 'baselineScore', 'baselineWords', 'maxCombo', 'typoCount', 'activeDeckId',
        'unlockedSkills', 'skillLevels', 'selectedTalents', 'passiveModifiers',
        'runMetricsVersion','learningMetricsVersion','learningAttempts','firstSuccesses','hintsUsed','replayCount',
        'maxPerfectStreak','perfectMetricsKnown','difficultyVersion','minimumTargetSeconds'];
      return Object.fromEntries(fields.map(k => [k, this[k]]));
    }

    restoreRunMetrics(data) {
      this.resetRunMetrics();
      const score=Number(data?.score)||0,words=Number(data?.words)||0,baselineWords=Number(data?.baselineWords)||0;
      const runWords=Math.max(0,words-baselineWords);
      const coherent=!!(data&&data.runMetricsVersion===2&&data.runId&&!data.runFinished&&
        Number.isFinite(data.activeElapsedMs)&&data.activeElapsedMs>=0&&
        Number.isFinite(data.correctKeystrokes)&&Number.isFinite(data.totalKeystrokes)&&
        data.correctKeystrokes>=0&&data.totalKeystrokes>=data.correctKeystrokes&&
        Number.isFinite(data.assistedKeystrokes)&&data.assistedKeystrokes>=0&&
        Number.isFinite(data.assistedWords)&&data.assistedWords>=0&&data.assistedWords<=runWords&&
        runWords<=data.correctKeystrokes+data.assistedKeystrokes&&
        (data.learningMetricsVersion!==2||(
          Number.isFinite(data.learningAttempts)&&data.learningAttempts>=runWords&&
          Number.isFinite(data.firstSuccesses)&&data.firstSuccesses>=0&&
          data.firstSuccesses<=data.learningAttempts&&data.firstSuccesses<=runWords&&
          Number.isFinite(data.maxCombo)&&data.maxCombo>=0&&data.maxCombo<=runWords)));
      if (coherent) {
        this.difficultyVersion=data.difficultyVersion||1;
        this.perfectMetricsKnown=!!data.perfectMetricsKnown;
        this.learningMetricsVersion=data.learningMetricsVersion===2?2:1;
        for (const key of Object.keys(this.getRunMetrics())) {
          if (data[key] !== undefined) this[key] = data[key];
        }
      } else if (data && (score || words)) {
        // v20 and older saves contain lifetime progress but not a coherent v21
        // run. Start a clean measured segment instead of posting stale counters.
        this.baselineScore = score;
        this.baselineWords = words;
        this.migratedRunCounters = true;
      }
      this.calculateWPM();
    }

    markAssistance(target, count = 1) {
      this.assisted = true;
      this.assistedKeystrokes += count;
      if (target) target.assistedKeystrokes = (target.assistedKeystrokes || 0) + count;
    }

    recordLearningOutcome(target,completed) {
      this.learningAttempts++;
      if(completed&&!target.hadTypo&&!target.hintsUsed&&!target.replayCount&&!target.assistedKeystrokes)this.firstSuccesses++;
    }

    triggerStun(durationMs = 160) {
      if (this.talents.typoImmune) return false;
      this.isStunned = true;
      this.stunTimer = performance.now() + durationMs;
      this.screenShake = 3 + this.realmIdx * 2;
      this.screenFlash = 0.12; // Chớp lóe nhẹ cảnh báo tâm ma
        // Stun is a combat state, not a fabricated typo or hidden speed penalty.
        root.Meowcha.combatFeedback?.(this,'stun');
      this.setCatState("HURT", durationMs);
      this.notify("stun");
      return true;
    }

    triggerLightning(shakeAmt = 16) {
      this.screenFlash = 1.0;
      this.screenShake = shakeAmt;
      this.notify("lightning");
    }

    updateStun(dt = 0.016) {
      // Phục hồi choáng
      if (this.isStunned && performance.now() >= this.stunTimer) {
        this.isStunned = false;
        this.stunTimer = 0;
        if (this.catState === "HURT") {
          this.setCatState("IDLE");
        }
        this.notify("stunEnd");
      }
      // Giảm độ chói sấm sét & hào quang Nguyên Anh Hộ Đạo
      if (this.screenFlash > 0) {
        this.screenFlash = Math.max(0, this.screenFlash - dt * 4.0);
      }
      if (this.chibiAttackFlash > 0) {
        this.chibiAttackFlash = Math.max(0, this.chibiAttackFlash - dt * 2.5);
      }
    }

    revive() {
      this.hp = this.maxHp;
      this.isGameOver = false;
      this.isStunned = false;
      this.stunTimer = 0;
      this.speedMultiplier = 1.0;
      this.screenShake = 0;
      this.screenFlash = 0;
      this.combo = 0;
      this.catRecoveryPulse = 0;
      this.setCatState("IDLE");
      this.notify("revive");
    }

    addListener(fn) {
      this.listeners.push(fn);
    }

    notify(changeKey) {
      for (const fn of this.listeners) {
        fn(changeKey, this);
      }
    }

    setCatState(state, durationMs = 0) {
      this.catAnimationId=(this.catAnimationId||0)+1;
      this.catState = state;
      this.catStateTimer = durationMs > 0 ? performance.now() + durationMs : 0;
      if (state === "HURT") {
        this.catRecoveryPulse = 1.0;
      }
      this.notify("catState");
    }

    setSpeech(text, durationMs = 2500) {
      this.speechText = text;
      this.speechTimer = performance.now() + durationMs;
      this.notify("speech");
    }

    addScore(points) {
      const comboRate = (this.passiveModifiers && this.passiveModifiers.comboBonus) ? this.passiveModifiers.comboBonus : 0.08;
      const bonus = Math.round(points * (1 + this.combo * comboRate) * (this.talents.scoreMultiplier || 1.0));
      this.score += bonus;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        try {
          localStorage.setItem("meowcha_high_score", String(this.highScore));
        } catch (e) {}
        this.notify("highScore");
      }
      this.notify("score");
      return bonus;
    }

    takeDamage(amount) {
      if (this.shieldCharges > 0) {
        this.shieldCharges--;
        this.talents.shieldCharges = this.shieldCharges;
        this.screenShake = 6;
        this.setCatState("HURT", 350);
        this.notify("shield");
        return { absorbed: true, remainingShields: this.shieldCharges };
      }

      const reduction = (this.passiveModifiers && this.passiveModifiers.damageReduction) ? this.passiveModifiers.damageReduction : 0;
      const effectiveAmount = Math.max(1, Math.round(amount * (1 - reduction)));

      this.hp = Math.max(0, this.hp - effectiveAmount);
      this.combo = 0;
      this.humanWordCombo = 0;
      this.screenShake = 14;
      this.setCatState("HURT", 450);
      this.notify("hp");

      if (this.hp <= 0) {
        this.hp = 0;
        this.isGameOver = true;
        this.setCatState("DEFEATED");
        this.notify("gameOver");
      }
      return { absorbed: false, currentHp: this.hp, damageTaken: effectiveAmount };
    }

    getActiveSkillSlots() {
      const defs = root.Meowcha.BREAKTHROUGH_SKILLS || {};
      return ['WIND_SWORD_DOMAIN', 'GOLDEN_CORE_REGEN', 'NASCENT_SOUL_FREEZE', 'TEN_THOUSAND_SWORDS']
        .filter(id => this.isSkillUnlocked(id) && defs[id] && this.realmIdx >= defs[id].minRealm).slice(-3);
    }

    getSkillLevel(skillId) {
      return (this.skillLevels && this.skillLevels[skillId]) || 0;
    }

    isSkillUnlocked(skillId) {
      return (this.unlockedSkills && this.unlockedSkills.includes(skillId)) || (this.getSkillLevel(skillId) > 0);
    }

    getSkillCooldown(skillId) {
      return Math.max(0, (this.skillCooldowns && this.skillCooldowns[skillId]) || 0);
    }

    canActivateSkill(skillId) {
      if (this.currentScene !== "BATTLE" || this.isPaused || this.isGameOver || this.catState === "BREAKTHROUGH") return false;
      if (!this.isSkillUnlocked(skillId)) return false;
      const def = root.Meowcha.BREAKTHROUGH_SKILLS && root.Meowcha.BREAKTHROUGH_SKILLS[skillId];
      if (!def || def.kind === 'PASSIVE' || this.realmIdx < def.minRealm) return false;
      if (skillId === 'GOLDEN_CORE_REGEN' && this.hp >= this.maxHp) return false;
      if (this.getSkillCooldown(skillId) > 0) return false;
      if (skillId === "TEN_THOUSAND_SWORDS") {
        return this.combo >= 10;
      }
      return true;
    }

    activateSkill(skillId, engine, audioManager) {
      if (!this.canActivateSkill(skillId)) return false;
      if (skillId === 'NASCENT_SOUL_FREEZE' && (!engine || !engine.asteroids || !engine.asteroids.asteroids.length)) return false;
      const M = root.Meowcha || {};
      const skillDef = M.BREAKTHROUGH_SKILLS && M.BREAKTHROUGH_SKILLS[skillId];
      if (!skillDef) return false;

      const curLevel = this.getSkillLevel(skillId) || 1;
      const lvData = (skillDef.levels && skillDef.levels[curLevel - 1]) || (skillDef.levels && skillDef.levels[0]) || {};

      this.skillCooldowns = this.skillCooldowns || {};
      this.activeSkillEffects = this.activeSkillEffects || {};

      if (skillId === "WIND_SWORD_DOMAIN") {
        const cd = lvData.cd || 25;
        const dur = lvData.duration || 6;
        const slow = lvData.slowPct || 0.4;
        this.skillCooldowns[skillId] = cd;
        this.activeSkillEffects.windSwordTimer = dur;
        this.activeSkillEffects.windSwordSlow = slow;
        if (audioManager) audioManager.play("type");
        this.setSpeech(`[ KIẾM VỰC ] Thanh Phong Kiếm Vực (${Math.round(slow * 100)}% Chậm)!`, 2200);
        this.notify("skillActivated");
        return true;
      }

      if (skillId === "GOLDEN_CORE_REGEN") {
        const cd = lvData.cd || 35;
        const heal = lvData.activeHeal || 8;
        this.skillCooldowns[skillId] = cd;
        this.hp = Math.min(this.maxHp, this.hp + heal);
        if (audioManager) audioManager.play("chime");
        this.setSpeech(`[ KIM ĐAN ] Đan Điền hồi phục +${heal} Khí Huyết!`, 2200);
        this.notify("hp");
        this.notify("skillActivated");
        return true;
      }

      if (skillId === "NASCENT_SOUL_FREEZE") {
        const cd = lvData.cd || 30;
        const freeze = lvData.freezeDuration || 4;
        this.skillCooldowns[skillId] = cd;
        if (engine && engine.asteroids && engine.asteroids.asteroids.length > 0) {
          const target = engine.currentTarget || engine.asteroids.asteroids[0];
          if (target) {
            target.freezeTimer = Math.max(target.freezeTimer || 0, freeze);
            if (engine.replayCurrentAudio) engine.replayCurrentAudio();
            else if (engine.playWordAudio) engine.playWordAudio(target);
          }
        }
        if (audioManager) audioManager.play("lightning");
        this.setSpeech(`[ ĐỊNH THÂN ] Nguyên Anh xuất khiếu, định thân ${freeze}s!`, 2200);
        this.notify("skillActivated");
        return true;
      }

      if (skillId === "TEN_THOUSAND_SWORDS") {
        if (this.combo < 10) return false;
        this.skillCooldowns[skillId] = 40;
        if (engine) {
          engine.isCloudHazard = false;
          engine.isLightningHazard = false;
          engine.hazardTimer = 0;
          engine.mistakeStreak = 0;
          if (engine.realmVFX) engine.realmVFX.clearClouds();

          // Clear danger without completing the word or adding typing statistics.
          const targets = engine.asteroids && engine.asteroids.asteroids || [];
          for (const target of targets) {
            target.freezeTimer = Math.max(target.freezeTimer || 0, 1.5);
            if (engine.projectiles && engine.projectiles.spawnSkyStrike) engine.projectiles.spawnSkyStrike(target.x, target.y, 4);
          }
          this.combo = 0;
        }
        this.screenShake = 16;
        this.screenFlash = 0.8;
        if (audioManager) {
          audioManager.play("explosion");
          audioManager.play("chime");
        }
        this.setSpeech(`[ VẠN KIẾM ] VẠN KIẾM QUY TÔNG • TIÊU DIỆT TÂM MA!`, 3000);
        this.notify("skillActivated");
        return true;
      }

      return false;
    }

    updateSkills(dt = 0.016) {
      if (this.currentScene !== 'BATTLE' || this.isPaused || this.isGameOver || this.catState === 'BREAKTHROUGH') return;
      let changed = false;
      if (this.skillCooldowns) {
        for (const sKey of Object.keys(this.skillCooldowns)) {
          if (this.skillCooldowns[sKey] > 0) {
            this.skillCooldowns[sKey] = Math.max(0, this.skillCooldowns[sKey] - dt);
            changed = true;
          }
        }
      }
      if (this.activeSkillEffects) {
        if (this.activeSkillEffects.windSwordTimer > 0) {
          this.activeSkillEffects.windSwordTimer = Math.max(0, this.activeSkillEffects.windSwordTimer - dt);
          changed = true;
        }
      }
      if (changed) {
        this.notify("skillCooldown");
      }
    }

    calculateWPM() {
      const elapsedMin = Math.max(1000, this.activeElapsedMs || 0) / 60000;
      const wpm = Math.round((this.correctKeystrokes / 5) / elapsedMin);
      this.wpm = Math.max(0, wpm);

      const total = Math.max(1, this.totalKeystrokes);
      this.accuracy = this.totalKeystrokes ? Math.round((this.correctKeystrokes / total) * 100) : 100;
      return this.wpm;
    }

    loadFromSlot(slot) {
      if (!slot) return;
      this.restoreRunMetrics(slot);
      this.gameMode = slot.activeMode || slot.mode || this.gameMode;
      this.maxHp = slot.maxHp || 50;
      if (typeof slot.hp === 'number' && slot.hp > 0) {
        this.hp = Math.min(this.maxHp, slot.hp);
      } else {
        this.hp = this.maxHp;
      }
      this.score = slot.score || 0;
      if (slot.highScore && slot.highScore > this.highScore) {
        this.highScore = slot.highScore;
        try {
          localStorage.setItem("meowcha_high_score", String(this.highScore));
        } catch (e) {}
      }
      this.wordsSlain = slot.words || 0;
      this.realmIdx = slot.realmIdx || 0;
      this.selectedBandIdx = slot.bandIdx || 0;
      this.activeSlotId = slot.slotId || 1;
      this.isGameOver = false;
      this.isPaused = false;
      this.isStunned = false;
      this.stunTimer = 0;
      this.setCatState("IDLE");
      this.talents = Object.assign({
        hpBonus: 0,
        slowFactor: 1.0,
        critChance: 0.0,
        scoreMultiplier: 1.0,
        shieldCharges: 0,
        autoKill: false,
        typoImmune: false
      }, slot.talents || {});
      this.shieldCharges = slot.shieldCharges !== undefined ? slot.shieldCharges : (this.talents.shieldCharges || 0);
      this.unlockedSkills = Array.isArray(slot.unlockedSkills) ? [...slot.unlockedSkills] : ['QI_SHIELD_PASSIVE'];
      this.skillLevels = (slot.skillLevels && typeof slot.skillLevels === 'object') ? { ...slot.skillLevels } : {};
      this.selectedTalents = Array.isArray(slot.selectedTalents) ? [...slot.selectedTalents] : [];
      this.passiveModifiers = Object.assign({
        damageReduction: 0,
        comboBonus: 0.08,
        meaningDisplayDuration: 3200,
        weakWordWeight: 1.0,
        hazardDurationBonus: 1.0,
        mindHint: false
      }, slot.passiveModifiers || {});
      this.notify("hp");
      this.notify("score");
      this.notify("highScore");
      this.notify("realm");
      this.skillCooldowns = {};
      this.activeSkillEffects = {};
      this.notify("load");
    }

    loadFromModeData(modeData, modeName = null) {
      if (!modeData) return;
      this.restoreRunMetrics(modeData);
      if (modeName) this.gameMode = modeName;
      this.maxHp = modeData.maxHp || 50;
      this.hp = (typeof modeData.hp === "number" && modeData.hp > 0) ? Math.min(this.maxHp, modeData.hp) : this.maxHp;
      this.score = modeData.score || 0;
      if (modeData.highScore && modeData.highScore > this.highScore) {
        this.highScore = modeData.highScore;
        try {
          localStorage.setItem("meowcha_high_score", String(this.highScore));
        } catch (e) {}
      }
      this.wordsSlain = modeData.words || 0;
      this.realmIdx = modeData.realmIdx || 0;
      this.selectedBandIdx = Math.min(3, this.realmIdx);
      this.talents = Object.assign({
        hpBonus: 0,
        slowFactor: 1.0,
        critChance: 0.0,
        scoreMultiplier: 1.0,
        shieldCharges: 0,
        autoKill: false,
        typoImmune: false
      }, modeData.talents || {});
      this.shieldCharges = modeData.shieldCharges !== undefined ? modeData.shieldCharges : (this.talents.shieldCharges || 0);
      this.unlockedSkills = Array.isArray(modeData.unlockedSkills) ? [...modeData.unlockedSkills] : ['QI_SHIELD_PASSIVE'];
      this.skillLevels = (modeData.skillLevels && typeof modeData.skillLevels === 'object') ? { ...modeData.skillLevels } : {};
      this.selectedTalents = Array.isArray(modeData.selectedTalents) ? [...modeData.selectedTalents] : [];
      this.passiveModifiers = Object.assign({
        damageReduction: 0,
        comboBonus: 0.08,
        meaningDisplayDuration: 3200,
        weakWordWeight: 1.0,
        hazardDurationBonus: 1.0,
        mindHint: false
      }, modeData.passiveModifiers || {});
      this.isGameOver = false;
      this.isPaused = false;
      this.isStunned = false;
      this.stunTimer = 0;
      this.combo = 0;
      this.setCatState("IDLE");
      this.notify("hp");
      this.notify("score");
      this.notify("highScore");
      this.notify("realm");
      this.skillCooldowns = {};
      this.activeSkillEffects = {};
      this.notify("load");
    }

    resetForNewMode(modeName) {
      this.resetRunMetrics();
      if (modeName) this.gameMode = modeName;
      this.maxHp = 50;
      this.hp = 50;
      this.score = 0;
      this.wordsSlain = 0;
      this.realmIdx = 0;
      this.selectedBandIdx = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.talents = {
        hpBonus: 0,
        slowFactor: 1.0,
        critChance: 0.0,
        scoreMultiplier: 1.0,
        shieldCharges: 0,
        autoKill: false,
        typoImmune: false
      };
      this.unlockedSkills = ['QI_SHIELD_PASSIVE'];
      this.skillLevels = { QI_SHIELD_PASSIVE: 1 };
      this.skillCooldowns = {};
      this.activeSkillEffects = {};
      this.selectedTalents = [];
      this.passiveModifiers = {
        damageReduction: 0,
        comboBonus: 0.08,
        meaningDisplayDuration: 3200,
        weakWordWeight: 1.0,
        hazardDurationBonus: 1.0,
        mindHint: false
      };
      this.shieldCharges = 0;
      this.isGameOver = false;
      this.isPaused = false;
      this.isStunned = false;
      this.stunTimer = 0;
      this.setCatState("IDLE");
      this.notify("hp");
      this.notify("score");
      this.notify("realm");
      this.skillCooldowns = {};
      this.activeSkillEffects = {};
      this.notify("load");
    }
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.GameState = GameState;
})(typeof window !== 'undefined' ? window : globalThis);
