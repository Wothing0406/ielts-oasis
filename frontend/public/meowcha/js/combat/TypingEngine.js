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
      this.mistakeStreak = 0;
      this.isMindDemonHazard = false;
      this.demonMistakeCount = 0;
      this.purifiedWordsStreak = 0;
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
          if (this.currentTarget.word[this.currentTarget.typedLen] === upper) {
            target = this.currentTarget;
          } else {
            target = null;
          }
        } else if (this.currentTarget.word[this.currentTarget.typedLen] === upper) {
          target = this.currentTarget;
        }
      }

      // 2. Nếu chưa chọn được từ nào: Chọn từ có ký tự đầu trùng khớp (ưu tiên từ rơi thấp nhất)
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
        this.mistakeStreak = 0;
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
        this.mistakeStreak++;
        this.state.combo = 0;
        this.state.typoCount++;
        this.audio.play("hurt");

        const isMobile = canvas.width <= 768 || (canvas.height > canvas.width);
        const catX = canvas.width / 2;
        const catY = isMobile ? (canvas.height * 0.61 - 40) : (canvas.height - 110);

        this.state.setCatState("HURT", 140);
        this.state.screenShake = 5;

        if (!this.isCloudHazard && !this.isLightningHazard) {
          // GIAI ĐOẠN 1: Gõ sai 3 lần liên tiếp -> KÍCH HOẠT MA VÂN TỤ KHÍ (MÂY MÙ CHE MẮT, CHƯA CÓ SÉT)
          if (this.mistakeStreak >= 3) {
            this.isCloudHazard = true;
            this.cloudMistakeCount = 0;
            this.cloudPurifiedCount = 0;
            this.state.screenShake = 8;
            this.audio.play("hurt");

            const canvasW = (canvas && canvas.width) || (typeof window !== "undefined" ? window.innerWidth : 800);
            this.floatingText.addCelestialEdict(
              canvasW,
              "[ 隐 • MA VÂN MẬT LỆNH ] TÂM MA TỤ KHÍ",
              "Sương mù hắc ám giáng lâm che mắt • Đạo tâm chấn động • Gõ đúng để ma vân tiêu tán",
              "cloud"
            );

            if (this.realmVFX) {
              this.realmVFX.triggerPunishCloud();
            }
          } else {
            this.floatingText.add(catX, catY - 55, `[ 剑 ] LỆCH KIẾM! (${this.mistakeStreak}/3)`, "#EF4444", isMobile ? 14 : 16);
          }
        } else if (this.isCloudHazard && !this.isLightningHazard) {
          // GIAI ĐOẠN 2: ĐÃ CÓ MÂY MÙ, NẾU SAI THÊM 3 LẦN NỮA MỚI KÍCH HOẠT 10S THIÊN KIẾP SẤM SÉT
          this.cloudMistakeCount = (this.cloudMistakeCount || 0) + 1;
          this.cloudPurifiedCount = 0;

          if (this.cloudMistakeCount >= 3) {
            this.triggerLightningHazard(canvas);
          } else {
            this.floatingText.add(catX, catY - 65, `[ 警 ] MA CHƯỚNG NHIỄU TÂM! (${this.cloudMistakeCount}/3)`, "#F97316", isMobile ? 12 : 15);
          }
        } else if (this.isLightningHazard) {
          // ĐANG TRONG 10S THIÊN KIẾP SẤM SÉT MÀ TIẾP TỤC GÕ SAI: Sét giáng chấn động trừ 5 HP
          this.state.triggerLightning(28);
          this.audio.play("lightning");
          this.state.takeDamage(5);
          this.state.screenShake = 14;

          const timeLeft = Math.max(1, Math.ceil(this.hazardTimer || 10));
          this.floatingText.add(catX, catY - 65, `[ 敕 ] THIÊN LÔI PHẠT! (-5 HP) Còn ${timeLeft}s • Cần ${this.hazardReqWords || 2} đan dược mới mua chuộc được!`, "#EF4444", isMobile ? 12 : 15);
        }

        // Rung haptic xúc giác 35ms trên điện thoại
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try { navigator.vibrate(35); } catch (_) { }
        }
      }

      this.state.calculateWPM();
    }

    triggerLightningHazard(canvas) {
      if (this.isLightningHazard) return;
      this.isLightningHazard = true;
      this.hazardTimer = 10.0;
      this.hazardLightningTimer = 0;
      this.purifiedWordsStreak = 0;
      this.hazardReqWords = Math.min(4, 2 + Math.floor(this.state.realmIdx / 2));

      this.state.triggerLightning(28);
      this.audio.play("lightning");
      this.state.screenShake = 14;

      const canvasW = (canvas && canvas.width) || (typeof window !== "undefined" ? window.innerWidth : 800);
      this.floatingText.addCelestialEdict(
        canvasW,
        "[ 敕 • CỬU THIÊN LÔI LỆNH ] 10S THIÊN KIẾP",
        `Tử điện lôi kiếp giáng thế 10s! Mau trảm đúng ${this.hazardReqWords} từ trước khi sét giáng trừ 10 HP!`,
        "lightning"
      );
    }

    updateHazard(dt, canvas) {
      if (!this.isLightningHazard) return;

      this.hazardTimer -= dt;

      // Rung giật màn hình liên tục trong 10s thiên kiếp
      this.state.screenShake = Math.max(this.state.screenShake, 5);

      // Định kỳ mỗi 0.65s chớp sét và âm thanh sấm rền
      this.hazardLightningTimer = (this.hazardLightningTimer || 0) + dt;
      if (this.hazardLightningTimer >= 0.65) {
        this.hazardLightningTimer = 0;
        this.state.triggerLightning(16);
        this.audio.play("lightning");
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try { navigator.vibrate(40); } catch (_) {}
        }
      }

      // HẾT 10S MÀ CHƯA GIẢI ĐỦ SỐ TỪ: ĐÒN SẤM CUỐI CÙNG TRỪ 10 HP!
      if (this.hazardTimer <= 0) {
        this.isLightningHazard = false;
        this.isCloudHazard = false;
        this.hazardTimer = 0;
        this.mistakeStreak = 0;
        this.cloudMistakeCount = 0;
        this.purifiedWordsStreak = 0;

        // Đòn sét lôi đình cuối cùng
        this.state.triggerLightning(38);
        this.state.screenShake = 24;
        this.audio.play("lightning");
        this.audio.play("hurt");
        this.state.takeDamage(10); // Trừ 10 HP đan điền

        const canvasW = (canvas && canvas.width) || (typeof window !== "undefined" ? window.innerWidth : 800);
        this.floatingText.addCelestialEdict(
          canvasW,
          "[ 罚 • THIÊN LÔI PHẠT ĐAN ĐIỀN ] HẾT 10S THIÊN KIẾP",
          "Quá 10s không kịp hóa giải • Tử điện lôi đình giáng phạt tổn thất 10 HP Khí Huyết!",
          "lightning"
        );

        if (this.realmVFX) {
          this.realmVFX.clearClouds();
        }
      }
    }

    handleWordSlain(target, canvas) {
      // 1. PHÁT ÂM TỨC THÌ (ZERO DELAY): Kích hoạt ngay tại khoảnh khắc vừa gõ xong ký tự cuối cùng
      this.playWordAudio(target);

      this.state.wordsSlain++;
      this.state.combo++;
      if (this.state.combo > this.state.maxCombo) {
        this.state.maxCombo = this.state.combo;
      }

      const isMobile = canvas.width <= 768 || (canvas.height > canvas.width);
      const catX = canvas.width / 2;
      const catY = isMobile ? (canvas.height * 0.61 - 40) : (canvas.height - 110);

      // 1. Phóng phi kiếm thần tốc từ Miêu Tôn xé toạc màn hình cắm vào thiên thạch
      this.projectiles.spawn(catX, catY - 20, target.x, target.y, this.state.realmIdx, "#FDE047");

      // 2. Đại chiêu KIẾM KHÍ CHÉM NỔ MA THẠCH (Trảm đúng thì chỉ vung kiếm chém ma thạch, không đánh sét vào người)
      this.state.setCatState("ULTIMATE_BLAST", 350);
      if (this.unityBridge) {
        this.unityBridge.triggerUltimateBlast();
      }

      this.audio.play("explosion");
      this.audio.play("chime");
      this.state.screenShake = 4;

      // 2.1 XỬ LÝ HÓA GIẢI MÂY MÙ (Giai đoạn 1)
      if (this.isCloudHazard && !this.isLightningHazard) {
        this.cloudPurifiedCount = (this.cloudPurifiedCount || 0) + 1;
        if (this.cloudPurifiedCount >= 2) {
          this.isCloudHazard = false;
          this.cloudPurifiedCount = 0;
          this.cloudMistakeCount = 0;
          this.mistakeStreak = 0;
          if (this.realmVFX) {
            this.realmVFX.clearClouds();
          }
          this.floatingText.add(catX, catY - 80, "[ 净 ] MA VÂN TIÊU TÁN", "#38BDF8", isMobile ? 14 : 16);
        }
      }

      // 2.2 XỬ LÝ HÓA GIẢI 10S THIÊN KIẾP SẤM SÉT (Giai đoạn 2)
      if (this.isLightningHazard) {
        this.purifiedWordsStreak++;
        const reqCount = this.hazardReqWords || Math.min(4, 2 + Math.floor(this.state.realmIdx / 2));
        const timeLeft = Math.max(1, Math.ceil(this.hazardTimer || 10));

        if (this.purifiedWordsStreak < reqCount) {
          this.floatingText.add(catX, catY - 80, `[ 净 ] TỊNH HÓA THIÊN KIẾP (${this.purifiedWordsStreak}/${reqCount}) • Còn ${timeLeft}s`, "#38BDF8", isMobile ? 14 : 16);
        } else {
          // ĐÃ ĐÁNH ĐÚNG ĐỦ SỐ TỪ TRONG 10S: HÓA GIẢI THÀNH CÔNG, ĐẠO TRỜI THA THỨ!
          this.isLightningHazard = false;
          this.isCloudHazard = false;
          this.hazardTimer = 0;
          this.mistakeStreak = 0;
          this.cloudMistakeCount = 0;
          this.purifiedWordsStreak = 0;
          if (this.realmVFX) {
            this.realmVFX.clearClouds();
          }
          this.floatingText.addCelestialEdict(
            canvas.width,
            "[ 敕 • THIÊN ÂN XÁ TỘI ]",
            "Hóa giải lôi kiếp thành công • Đạo tâm thanh tịnh (+10 HP Khí Huyết)",
            "purified"
          );
          this.audio.play("chime");
          this.state.hp = Math.min(this.state.maxHp, this.state.hp + 10);
          this.state.notify("hp");
        }
      }

      // 3. Tính điểm Tu Vi chuẩn xác
      const basePoints = target.word.length * 15;
      const gainedScore = this.state.addScore(basePoints);

      // Càng trảm nhiều từ hoặc giữ chuỗi combo cao, tốc độ ma thạch rơi càng dồn dập (nhẹ nhàng, mượt mà)
      const streakBonus = this.state.combo > 3 ? (this.state.combo - 3) * 0.01 : 0;
      const waveBonus = Math.min(0.2, this.state.wordsSlain * 0.003);
      this.state.speedMultiplier = Math.min(1.35, 1.0 + waveBonus + streakBonus);

      // 4. HIỆN VÒNG BÁT QUÁI + TỪ VỰNG + PHIÊN ÂM IPA NGAY TẠI TÂM NỔ (IN-SITU BURST)
      this.floatingText.addInSituBurst(target.x, target.y, target);

      // 5. HẠT TU VI (+EXP) BAY THEO QUỸ ĐẠO HÚT VỀ MIÊU KIẾM TÔN
      this.floatingText.addExpOrb(target.x, target.y, catX, catY, gainedScore);

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

    // Kích hoạt Ma Vân Tụ Khí khi ma thạch chạm đáy mất máu (Giai đoạn 1: Mây Mù)
    triggerDemonHazardFromFall(catX, catY, isMobile, canvasW) {
      if (this.isCloudHazard || this.isLightningHazard) return;
      this.isCloudHazard = true;
      this.cloudPurifiedCount = 0;
      this.cloudMistakeCount = 0;
      this.mistakeStreak = 0;

      const safeCanvasW = canvasW || 800;
      // Chiếu Chỉ Ma Vân rơi từ đỉnh trời xuống
      this.floatingText.addCelestialEdict(
        safeCanvasW,
        "[ 隐 • MA VÂN MẬT LỆNH ] MA THẠCH PHÁ TRẬN",
        "Đạo tâm chấn động • Sương mù hắc ám giáng lâm che mắt • Gõ đúng để ma vân tiêu tán",
        "cloud"
      );

      // Đợi người chơi đọc xong chiếu chỉ (1.2 giây) mới tụ mây
      setTimeout(() => {
        if (this.isCloudHazard && !this.isLightningHazard && this.realmVFX) {
          this.realmVFX.triggerPunishCloud();
        }
      }, 1200);
    }

    playWordAudio(target) {
      if (!target) return;
      const audioUrl = target.audio_url;

      // 1. ƯU TIÊN PHÁT GIỌNG NGƯỜI THẬT TỪ TỪ ĐIỂN OXFORD
      if (audioUrl && typeof audioUrl === "string" && audioUrl.startsWith("http")) {
        try {
          const audio = new Audio(audioUrl);
          audio.volume = 1.0;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // Nếu mạng chặn hoặc lỗi mp3 -> Fallback về Web Speech API
              this.speakWord(target.word);
            });
          }
          return;
        } catch (_) {
          // Fallback
        }
      }

      // 2. Fallback: Phát âm qua Web Speech API
      this.speakWord(target.word);
    }

    speakWord(word) {
      if (typeof window === "undefined" || !("speechSynthesis" in window) || !word) return;
      try {
        const synth = window.speechSynthesis;
        if (synth.paused) {
          synth.resume();
        }
        if (synth.speaking || synth.pending) {
          synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(word.trim());
        utterance.lang = "en-US";
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const findVoice = () => {
          const voices = synth.getVoices();
          if (voices && voices.length > 0) {
            const enVoice = voices.find(v => v.lang === "en-US" || v.lang === "en_US") 
              || voices.find(v => v.lang && v.lang.startsWith("en"));
            if (enVoice) utterance.voice = enVoice;
          }
        };

        findVoice();
        if (!utterance.voice && synth.onvoiceschanged !== undefined) {
          synth.onvoiceschanged = () => findVoice();
        }

        setTimeout(() => {
          try {
            if (synth.paused) synth.resume();
            synth.speak(utterance);
          } catch (_) {}
        }, 30);
      } catch (e) {
        console.warn("[Meowcha Speech Synthesis]", e);
      }
    }
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.TypingEngine = TypingEngine;
})(typeof window !== 'undefined' ? window : globalThis);
