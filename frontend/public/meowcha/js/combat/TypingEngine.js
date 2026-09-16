/**
 * TypingEngine.js - Bộ Máy Xử Lý Gõ Phím & Chiến Đấu Đỉnh Cao (Focus UX)
 * Khi trảm xong từ: Phóng kiếm xé toạc màn hình, nổ tung tại chỗ kèm vòng Bát Quái + IPA + Hút EXP
 */
(function(root) {
  class TypingEngine {
    constructor(gameState, asteroidManager, projectileSystem, particleEngine, audioManager, floatingText, realmVFX, unityBridge = null) {
      this.state = gameState;
      this.asteroids = asteroidManager;
      this.projectiles = projectileSystem;
      this.particles = particleEngine;
      this.audio = audioManager;
      this.floatingText = floatingText;
      this.realmVFX = realmVFX;
      this.unityBridge = unityBridge;

      this.currentTarget = null;
      this.onWordCompleted = null;
    }

    processKey(char, canvas) {
      if (this.state.isGameOver || this.state.isPaused || this.state.catState === "BREAKTHROUGH") return;

      const upper = char.toUpperCase();
      this.state.totalKeystrokes++;

      const activeList = this.asteroids.asteroids;
      if (activeList.length === 0) return;

      // 1. Kiểm tra thiên thạch đang gõ dở
      let target = null;
      if (this.currentTarget && activeList.includes(this.currentTarget)) {
        if (this.currentTarget.typedLen > 0 && this.currentTarget.typedLen < this.currentTarget.word.length) {
          // Người chơi đang gõ dở từ này: ÉP BUỘC gõ tiếp từ này cho tới khi xong hoặc từ bị rơi mất!
          if (this.currentTarget.word[this.currentTarget.typedLen] === upper) {
            target = this.currentTarget;
          } else {
            // Gõ sai ký tự tiếp theo của từ đang gõ dở -> Tính gõ nhầm trên chính từ này (không nhảy tự do sang từ khác)
            target = null;
          }
        } else if (this.currentTarget.word[this.currentTarget.typedLen] === upper) {
          target = this.currentTarget;
        }
      }

      // 2. Nếu chưa chọn được từ nào đang gõ dở: Chọn từ có ký tự đầu trùng với phím gõ (ưu tiên từ rơi thấp nhất)
      if (!target && (!this.currentTarget || !activeList.includes(this.currentTarget) || this.currentTarget.typedLen === 0)) {
        let lowestY = -9999;
        for (const ast of activeList) {
          if (ast.typedLen === 0 && ast.word[0] === upper) {
            if (ast.y > lowestY) {
              lowestY = ast.y;
              target = ast;
            }
          }
        }
      }

      if (target) {
        // GÕ ĐÚNG (HIT!)
        this.currentTarget = target;
        target.typedLen++;
        target.hitReaction = 1.0;
        this.state.correctKeystrokes++;
        this.state.catRecoveryPulse = 1.0;
        this.state.setCatState("WEAK_ATTACK", 160);
        if (this.unityBridge) {
          this.unityBridge.triggerWeakAttack(target.x, target.y);
        }

        const isMobile = canvas.width <= 768 || (canvas.height > canvas.width);
        const catX = canvas.width / 2;
        const catY = isMobile ? (canvas.height * 0.61 - 40) : (canvas.height - 110);

        // Phóng phi kiếm hướng tới ma thạch
        const realms = root.Meowcha.CULTIVATION_REALMS || [];
        const realmData = realms[this.state.realmIdx] || realms[0];
        this.projectiles.spawn(catX, catY - 20, target.x, target.y, this.state.realmIdx, realmData.swordColor);

        // Hiệu ứng tia lửa
        this.particles.createHitSparks(target.x, target.y, realmData.swordColor, 8);
        this.audio.play("type");
        if (this.state.realmIdx === 3) this.audio.play("lightning");

        // KIỂM TRA ĐÃ TRẢM HOÀN TẤT TỪ HAY CHƯA
        if (target.typedLen >= target.word.length) {
          this.handleWordSlain(target, canvas);
        } else {
          const intentEl = document.getElementById("swordIntentText");
          if (intentEl) {
            intentEl.innerText = `[ Trảm ] ${target.word} (${target.typedLen}/${target.word.length})`;
          }
        }
      } else {
        // GÕ NHẦM (KHÔNG CÓ TỪ NÀO TRÊN MÀN HÌNH KHỚP PHÍM)
        // Tuyệt đối KHÔNG khóa cứng bàn phím (không đóng băng người chơi), cho phép gõ tiếp từ khác tức thì
        this.state.combo = 0;
        this.state.typoCount++;
        this.audio.play("hurt");

        const isMobile = canvas.width <= 768 || (canvas.height > canvas.width);
        const catX = canvas.width / 2;
        const catY = isMobile ? (canvas.height * 0.61 - 40) : (canvas.height - 110);

        this.state.setCatState("HURT", 140);
        this.state.screenShake = 3;

        // Khi gõ nhầm: Kích hoạt mây mù chướng khí cuộn tới nhẹ
        if (this.realmVFX) {
          this.realmVFX.triggerCloudHazard(this.state.realmIdx === 0 ? 1.4 : 2.5);
        }

        // Thông báo chữ nổi cảnh báo
        this.floatingText.add(catX, catY - 55, "⚡ LỆCH KIẾM!", "#EF4444", isMobile ? 14 : 16);

        // Rung haptic xúc giác 25ms
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try { navigator.vibrate(25); } catch (_) {}
        }
      }

      this.state.calculateWPM();
    }

    handleWordSlain(target, canvas) {
      this.state.wordsSlain++;
      this.state.combo++;
      if (this.state.combo > this.state.maxCombo) {
        this.state.maxCombo = this.state.combo;
      }

      const isMobile = canvas.width <= 768 || (canvas.height > canvas.width);
      const catX = canvas.width / 2;
      const catY = isMobile ? (canvas.height * 0.61 - 40) : (canvas.height - 110);

      // 1. Phóng kiếm thần tốc từ Miêu Tôn xé toạc màn hình cắm vào thiên thạch
      this.projectiles.spawn(catX, catY - 20, target.x, target.y, this.state.realmIdx, "#FDE047");

      // 1.1 Kích hoạt đòn sấm sét / kiếm rồng từ đỉnh trời giáng xuống (Sky Strike)
      this.projectiles.spawnSkyStrike(target.x, target.y, this.state.realmIdx);

      // 2. Đại chiêu ULTIMATE_BLAST & Rung nhẹ màn hình (Screen Shake)
      this.state.setCatState("ULTIMATE_BLAST", 600);
      if (this.unityBridge) {
        this.unityBridge.triggerUltimateBlast();
      }
      this.state.screenShake = this.state.realmIdx >= 3 ? 9 : 6;
      this.audio.play("explosion");
      this.audio.play("chime");
      if (this.state.realmIdx === 3) {
        this.audio.play("lightning");
      }

      // 3. Tính điểm Tu Vi chuẩn xác (cân bằng để đạt cảnh giới theo nỗ lực rèn luyện thực thụ)
      const basePoints = target.word.length * 15;
      const gainedScore = this.state.addScore(basePoints);

      // Càng trảm nhiều từ hoặc giữ chuỗi combo cao, tốc độ ma thạch rơi càng dồn dập
      const streakBonus = this.state.combo > 3 ? (this.state.combo - 3) * 0.025 : 0;
      const waveBonus = Math.min(1.2, this.state.wordsSlain * 0.015);
      this.state.speedMultiplier = Math.min(2.8, 1.0 + waveBonus + streakBonus);

      // 4. HIỆN VÒNG BÁT QUÁI + TỪ VỰNG + PHIÊN ÂM IPA NGAY TẠI TÂM NỔ (IN-SITU BURST)
      this.floatingText.addInSituBurst(target.x, target.y, target);

      // 5. HẠT TU VI (+EXP) BAY THEO QUỸ ĐẠO HÚT VỀ MIÊU KIẾM TÔN
      this.floatingText.addExpOrb(target.x, target.y, catX, catY, gainedScore);

      // 6. Phát âm chuẩn từ vựng qua AI Speech Synthesis
      this.speakWord(target.word);

      // 7. Thiên thạch vỡ vụn thành các mảnh vỡ pixel retro văng ra
      this.particles.createPixelShards(target.x, target.y, [target.coreColor, "#FEF08A", "#EF4444", "#38BDF8", "#170D08"], 42);
      this.particles.createExplosion(target.x, target.y, target.color, 24);
      if (this.state.realmIdx <= 1) {
        this.particles.createBambooLeaves(target.x, target.y, 8);
      }

      // 8. Khẩu quyết tiên hiệp
      const speechesData = root.Meowcha.REALM_SKILL_SPEECHES || [];
      const realmSpeeches = speechesData[Math.min(4, this.state.realmIdx)] || speechesData[0];
      if (realmSpeeches && realmSpeeches.length > 0) {
        const chant = realmSpeeches[Math.floor(Math.random() * realmSpeeches.length)];
        this.state.setSpeech(chant, 2200);
      }

      // Xóa ma thạch khỏi danh sách
      const idx = this.asteroids.asteroids.indexOf(target);
      if (idx !== -1) {
        this.asteroids.asteroids.splice(idx, 1);
      }
      this.currentTarget = null;

      // Kích hoạt callback nếu có (để kiểm tra đột phá)
      if (this.onWordCompleted) {
        this.onWordCompleted(target);
      }
    }

    speakWord(word) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(word);
          utterance.lang = "en-US";
          utterance.rate = 0.86;
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);
        } catch (e) {}
      }
    }
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.TypingEngine = TypingEngine;
})(typeof window !== 'undefined' ? window : globalThis);
