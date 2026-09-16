/**
 * GameState.js - Quản Lý Trạng Thái Tập Trung Của Trò Chơi
 * Cung cấp luồng dữ liệu đơn hướng (Single Source of Truth) cho toàn bộ engine
 */
(function(root) {
  class GameState {
    constructor() {
      this.reset();
      this.listeners = [];
    }

    reset() {
      this.currentScene = "LOBBY"; // LOBBY | BATTLE
      this.isPaused = false;
      this.isGameOver = false;
      this.showBreakthrough = false;

      // Chỉ số sinh mệnh & tu vi
      this.hp = 50;
      this.maxHp = 50;
      this.shieldCharges = 0;
      this.score = 0;
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

      this.selectedBandIdx = 0;
      this.activeSlotId = 1;
      this.pendingBreakthrough = false;
    }

    triggerStun(durationMs = 160) {
      if (this.talents.typoImmune) return false;
      this.isStunned = true;
      this.stunTimer = performance.now() + durationMs;
      this.screenShake = 3 + this.realmIdx * 2;
      this.screenFlash = 0.12; // Chớp lóe nhẹ cảnh báo tâm ma
      this.typoCount++;
      // Thiên thạch rơi nhanh nhẹ nhàng theo cảnh giới (+2% ở Luyện Khí, tối đa +10%)
      const speedInc = 0.02 * (this.realmIdx + 1);
      this.speedMultiplier = Math.min(1.7, this.speedMultiplier + speedInc);
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
      // Giảm độ chói sấm sét
      if (this.screenFlash > 0) {
        this.screenFlash = Math.max(0, this.screenFlash - dt * 4.0);
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
      const bonus = Math.round(points * (1 + this.combo * 0.08) * (this.talents.scoreMultiplier || 1.0));
      this.score += bonus;
      this.notify("score");
      return bonus;
    }

    takeDamage(amount) {
      if (this.shieldCharges > 0) {
        this.shieldCharges--;
        this.screenShake = 6;
        this.setCatState("HURT", 350);
        this.notify("shield");
        return { absorbed: true, remainingShields: this.shieldCharges };
      }

      this.hp = Math.max(0, this.hp - amount);
      this.combo = 0;
      this.screenShake = 14;
      this.setCatState("HURT", 450);
      this.notify("hp");

      if (this.hp <= 0) {
        this.isGameOver = true;
        this.setCatState("DEFEATED");
        this.notify("gameOver");
      }
      return { absorbed: false, currentHp: this.hp };
    }

    calculateWPM() {
      if (!this.startTime) return 0;
      const elapsedMin = Math.max(0.1, (Date.now() - this.startTime) / 60000);
      const wpm = Math.round((this.correctKeystrokes / 5) / elapsedMin);
      this.wpm = Math.min(180, Math.max(0, wpm));

      const total = Math.max(1, this.totalKeystrokes);
      this.accuracy = Math.round((this.correctKeystrokes / total) * 100);
      return this.wpm;
    }

    loadFromSlot(slot) {
      if (!slot) return;
      this.hp = slot.hp || 50;
      this.maxHp = slot.maxHp || 50;
      this.score = slot.score || 0;
      this.wordsSlain = slot.words || 0;
      this.realmIdx = slot.realmIdx || 0;
      this.selectedBandIdx = slot.bandIdx || 0;
      this.activeSlotId = slot.slotId || 1;
      this.talents = Object.assign({
        hpBonus: 0,
        slowFactor: 1.0,
        critChance: 0.0,
        scoreMultiplier: 1.0,
        shieldCharges: 0,
        autoKill: false,
        typoImmune: false
      }, slot.talents || {});
      this.shieldCharges = this.talents.shieldCharges || 0;
      this.isGameOver = false;
      this.isPaused = false;
      this.notify("load");
    }
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.GameState = GameState;
})(typeof window !== 'undefined' ? window : globalThis);
