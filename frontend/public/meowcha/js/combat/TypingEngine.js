/**
 * TypingEngine.js - Bộ Máy Xử Lý Gõ Phím & Chiến Đấu Đỉnh Cao (Focus UX)
 * Khi trảm xong từ: Phóng kiếm xé toạc màn hình, nổ tung tại chỗ kèm vòng Bát Quái + IPA + Hút EXP
 */
(function(root) {
  class TypingEngine {
    constructor(gameState, asteroidManager, projectileSystem, particleEngine, audioManager, floatingText, realmVFX, unityBridge = null, animator = null, saveSystem = null) {
      this.saveSystem = saveSystem;
      this.onBossDefeated = null;
      this.state = gameState;
      this.asteroids = asteroidManager;
      this.projectiles = projectileSystem;
      this.particles = particleEngine;
      this.audio = audioManager;
      this.floatingText = floatingText;
      this.realmVFX = realmVFX;
      this.unityBridge = unityBridge;
      this.animator = animator;
      this.chibiAutoTimer = 0;

      this.currentTarget = null;
      this.onWordCompleted = null;
      this.mistakeStreak = 0;
      this.isMindDemonHazard = false;
      this.demonMistakeCount = 0;
      this.purifiedWordsStreak = 0;
    }

    processKey(char, canvas) {
      if (this.state.isGameOver || this.state.isPaused || this.state.catState === "BREAKTHROUGH") return;

      const upper = (char || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").replace(/Đ/g, "D").toUpperCase();
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
        const catY = isMobile ? (canvas.height - 232) : (canvas.height - 128);

        // Phóng phi kiếm hướng tới ma thạch
        const realms = root.Meowcha.CULTIVATION_REALMS || [];
        const realmData = realms[this.state.realmIdx] || realms[0] || { swordColor: "#67E8F9" };
        this.projectiles.spawn(catX, catY - 20, target.x, target.y, this.state.realmIdx, realmData.swordColor);

        // Hiệu ứng tia lửa & nội tại hàn băng Trúc Cơ
        this.particles.createHitSparks(target.x, target.y, realmData.swordColor, 8);
        this.audio.play("type");
        if (this.state.realmIdx === 1) {
          target.slowTimer = Math.max(target.slowTimer || 0, 1.2);
          target.slowMult = 0.85;
        }

        // TÍCH TỤ KIẾM Ý & KÍCH HOẠT TUYỆT KỸ CẢNH GIỚI
        const pCfg = this.state.getRealmPassiveConfig
          ? this.state.getRealmPassiveConfig()
          : { max: 5, name: "KIẾM Ý", color: "#34D399" };
        this.state.realmPassiveMax = pCfg.max;
        this.state.realmPassiveCharge = (this.state.realmPassiveCharge || 0) + 1;
        if (this.state.realmPassiveCharge >= pCfg.max) {
          this.state.realmPassiveCharge = 0;
          this.triggerRealmPassiveSkill(target, canvas, catX, catY, isMobile);
        }

        // KIỂM TRA ĐÃ TRẢM HOÀN TẤT TỪ HAY CHƯA
        if (target.typedLen >= target.word.length) {
          this.handleWordSlain(target, canvas);
          this.updateSwordAltarUI(null);
        } else {
          this.updateSwordAltarUI(target);
        }
      } else {
        // GÕ NHẦM (KHÔNG CÓ TỪ NÀO TRÊN MÀN HÌNH KHỚP PHÍM)
        this.mistakeStreak++;
        if (this.mistakeStreak >= 2 && this.currentTarget && this.saveSystem && !this.currentTarget.isBoss) {
          this.saveSystem.recordWeaknessWord(this.currentTarget);
        }
        this.state.combo = 0;
        this.state.typoCount++;
        this.audio.play("hurt");

        const isMobile = canvas.width <= 768 || (canvas.height > canvas.width);
        const catX = canvas.width / 2;
        const catY = isMobile ? (canvas.height - 232) : (canvas.height - 128);

        this.state.setCatState("HURT", 140);
        this.state.screenShake = 2.5; // Rung nhẹ nhàng 2.5px, không gây giật lag

        if (!this.isCloudHazard && !this.isLightningHazard) {
          // GIAI ĐOẠN 1: Gõ sai 3 lần liên tiếp -> KÍCH HOẠT MA VÂN TỤ KHÍ (MÂY MÙ CHE MẮT, CHƯA CÓ SÉT)
          if (this.mistakeStreak >= 3) {
            this.isCloudHazard = true;
            this.cloudMistakeCount = 0;
            this.cloudPurifiedCount = 0;
            this.state.screenShake = 3.5;
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
          // ĐANG TRONG THIÊN KIẾP SẤM SÉT MÀ TIẾP TỤC GÕ SAI: Trừ nhẹ 2 HP nhắc nhở
          this.state.triggerLightning(10);
          this.audio.play("lightning");
          this.state.takeDamage(2);
          this.state.screenShake = 3.5;

          const timeLeft = Math.max(1, Math.ceil(this.hazardTimer || 14));
          this.floatingText.add(catX, catY - 65, `[ 敕 ] THIÊN LÔI NHẮC NHỞ! (-2 HP) Còn ${timeLeft}s • Cần ${this.hazardReqWords || 2} từ để phá kiếp!`, "#FDE047", isMobile ? 12 : 15);
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
      this.hazardTimer = 14.0;
      this.hazardLightningTimer = 0;
      this.purifiedWordsStreak = 0;
      this.hazardReqWords = 2; // Chỉ cần trảm 2 từ thong thả là phá giải thiên kiếp thành công

      this.state.triggerLightning(12);
      this.audio.play("lightning");
      this.state.screenShake = 4.0;

      const canvasW = (canvas && canvas.width) || (typeof window !== "undefined" ? window.innerWidth : 800);
      this.floatingText.addCelestialEdict(
        canvasW,
        "[ 敕 • CỬU THIÊN LÔI LỆNH ] 14S THIÊN KIẾP",
        `Tử điện lôi kiếp giáng thế 14s! Trảm đúng 2 từ để hóa giải thiên kiếp!`,
        "lightning"
      );
    }

    triggerRealmPassiveSkill(target, canvas, catX, catY, isMobile) {
      if (!target) return;
      const rIdx = Math.min(4, Math.max(0, this.state.realmIdx || 0));

      if (rIdx === 0) {
        // Cảnh 0 (Luyện Khí): Trúc Phong Trì Hoãn - Làm chậm ma thạch 22% trong 2.8s
        target.slowTimer = 2.8;
        target.slowMult = 0.78;
        if (this.animator) {
          this.animator.spawnVFXClip("vfx_slash_r0_sheet", target.x, target.y, { size: 110, fps: 22, color: "#34D399" });
        }
        this.particles.createBambooLeaves(target.x, target.y, 6);
        this.floatingText.add(target.x, target.y - 38, "[ 竹 ] TRÚC PHONG TRÌ HOÃN", "#34D399", isMobile ? 13 : 15);
      } else if (rIdx === 1) {
        // Cảnh 1 (Trúc Cơ): Song Kiếm Hợp Bích - Tự động khắc +1 cổ tự (ở chế độ thường) & đẩy lùi ma thạch 26px
        if (this.state.gameMode !== "CLOZE" && target.typedLen < target.word.length) {
          target.typedLen++;
        }
        target.y = Math.max(-target.radius, target.y - 26);
        this.projectiles.spawnSkyStrike(target.x, target.y, 1);
        if (this.animator) {
          this.animator.spawnVFXClip("vfx_slash_r1_sheet", target.x, target.y, { size: 124, fps: 22, color: "#38BDF8" });
        }
        const tag1 = this.state.gameMode === "CLOZE" ? "[ 雙 ] SONG KIẾM ĐẨY LÙI" : "[ 雙 ] SONG KIẾM TRẢM (+1 Tự)";
        this.floatingText.add(target.x, target.y - 40, tag1, "#38BDF8", isMobile ? 13 : 15);
      } else if (rIdx === 2) {
        // Cảnh 2 (Kim Đan): Kim Liên Bạo Phá - Tự động khắc +1 cổ tự (ở chế độ thường), đẩy lùi 22px & +30 Tu Vi
        if (this.state.gameMode !== "CLOZE" && target.typedLen < target.word.length) {
          target.typedLen++;
        }
        target.y = Math.max(-target.radius, target.y - 22);
        this.state.addScore(30);
        this.projectiles.spawnSkyStrike(target.x, target.y, 2);
        if (this.animator) {
          this.animator.spawnVFXClip("vfx_slash_r2_sheet", target.x, target.y, { size: 128, fps: 22, color: "#FBBF24" });
        }
        const tag2 = this.state.gameMode === "CLOZE" ? "[ 丹 ] KIM LIÊN BẠO (+30 Tu Vi)" : "[ 丹 ] KIM LIÊN BẠO (+1 Tự • +30 Tu Vi)";
        this.floatingText.add(target.x, target.y - 42, tag2, "#FBBF24", isMobile ? 13 : 15);
      } else if (rIdx === 3) {
        // Cảnh 3 (Nguyên Anh): Nguyên Anh Lôi Kích - Định thân ma thạch 0.9s & tự động khắc +1 cổ tự (ở chế độ thường)
        if (this.state.gameMode !== "CLOZE" && target.typedLen < target.word.length) {
          target.typedLen++;
        }
        target.freezeTimer = 0.9;
        this.state.chibiAttackFlash = 1.0;
        this.projectiles.spawnSkyStrike(target.x, target.y, 3);
        if (this.animator) {
          this.animator.spawnVFXClip("vfx_slash_r3_sheet", target.x, target.y, { size: 132, fps: 22, color: "#C084FC" });
        }
        const tag3 = this.state.gameMode === "CLOZE" ? "[ 雷 ] NGUYÊN ANH ĐỊNH THÂN" : "[ 雷 ] NGUYÊN ANH LÔI KÍCH (+1 Tự • Định Thân)";
        this.floatingText.add(target.x, target.y - 42, tag3, "#C084FC", isMobile ? 13 : 15);
      } else if (rIdx >= 4) {
        // Cảnh 4 (Độ Kiếp): Chân Long Phệ Thiên - Tự động khắc tới +2 cổ tự (ở chế độ thường), đẩy lùi 34px & +50 Tu Vi
        if (this.state.gameMode !== "CLOZE") {
          const carve = Math.min(2, Math.max(0, target.word.length - target.typedLen));
          target.typedLen += carve;
        }
        target.y = Math.max(-target.radius, target.y - 34);
        this.state.addScore(50);
        this.projectiles.spawnSkyStrike(target.x, target.y, 4);
        if (this.animator) {
          this.animator.spawnVFXClip("vfx_slash_r4_sheet", target.x, target.y, { size: 142, fps: 24, color: "#F59E0B" });
        }
        const tag4 = this.state.gameMode === "CLOZE" ? "[ 龍 ] CHÂN LONG PHỆ THIÊN (+50 Tu Vi)" : `[ 龍 ] CHÂN LONG TRẢM (+Tự)`;
        this.floatingText.add(target.x, target.y - 45, tag4, "#F59E0B", isMobile ? 14 : 16);
      }
    }

    updateHazard(dt, canvas) {
      // NGUYÊN ANH HỘ ĐẠO (Cảnh 3): Chibi Nguyên Anh tự động phóng Tử Điện Lôi Kích mỗi 3.2s
      if (this.state.realmIdx === 3 && this.asteroids.asteroids.length > 0 && !this.state.isPaused && !this.state.isGameOver) {
        this.chibiAutoTimer = (this.chibiAutoTimer || 0) + dt;
        if (this.chibiAutoTimer >= 3.2) {
          this.chibiAutoTimer = 0;
          const ast = this.currentTarget && this.asteroids.asteroids.includes(this.currentTarget)
            ? this.currentTarget
            : this.asteroids.asteroids[0];
          if (ast) {
            const isMobile = canvas && (canvas.width <= 768 || canvas.height > canvas.width);
            const catX = canvas ? canvas.width / 2 : 400;
            const catY = canvas ? (isMobile ? canvas.height - 232 : canvas.height - 128) : 500;
            this.state.chibiAttackFlash = 1.0;
            this.projectiles.spawn(catX - 70, catY - 60, ast.x, ast.y, 3, "#C084FC");
            this.projectiles.spawnSkyStrike(ast.x, ast.y, 3);
            if (this.animator) {
              this.animator.spawnVFXClip("vfx_slash_r3_sheet", ast.x, ast.y, { size: 120, fps: 22, color: "#C084FC" });
            }
            ast.freezeTimer = Math.max(ast.freezeTimer || 0, 0.6);
            if (this.state.gameMode !== "CLOZE" && ast.typedLen < ast.word.length - 1) {
              ast.typedLen++;
              this.floatingText.add(ast.x, ast.y - 36, "[ 嬰 ] HỘ ĐẠO LÔI KÍCH (+1 Tự)", "#C084FC", isMobile ? 12 : 14);
            } else {
              this.floatingText.add(ast.x, ast.y - 36, "[ 嬰 ] HỘ ĐẠO ĐỊNH THÂN", "#C084FC", isMobile ? 12 : 14);
            }
          }
        }
      }

      if (!this.isLightningHazard) return;

      this.hazardTimer -= dt;

      // Không ép rung liên tục mỗi frame để triệt tiêu hiện tượng xé hình và đơ giật

      // Định kỳ mỗi 1.8s chớp sét lãng đãng nhẹ nhàng
      this.hazardLightningTimer = (this.hazardLightningTimer || 0) + dt;
      if (this.hazardLightningTimer >= 1.8) {
        this.hazardLightningTimer = 0;
        this.state.triggerLightning(8);
        this.audio.play("lightning");
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try { navigator.vibrate(20); } catch (_) {}
        }
      }

      // HẾT 14S MÀ CHƯA GIẢI ĐỦ SỐ TỪ: ĐÒN SẤM KẾT THÚC CHỈ TRỪ 5 HP
      if (this.hazardTimer <= 0) {
        this.isLightningHazard = false;
        this.isCloudHazard = false;
        this.hazardTimer = 0;
        this.mistakeStreak = 0;
        this.cloudMistakeCount = 0;
        this.purifiedWordsStreak = 0;

        // Đòn sét nhẹ nhàng kết thúc thiên kiếp
        this.state.triggerLightning(10);
        this.state.screenShake = 4.0;
        this.audio.play("lightning");
        this.audio.play("hurt");
        this.state.takeDamage(5); // Chỉ trừ 5 HP nhẹ nhàng

        const canvasW = (canvas && canvas.width) || (typeof window !== "undefined" ? window.innerWidth : 800);
        this.floatingText.addCelestialEdict(
          canvasW,
          "[ 罚 • THIÊN LÔI TIÊU TÁN ]",
          "Hết thời gian thiên kiếp • Tử điện tiêu tán, đạo hữu tổn thất 5 HP Khí Huyết!",
          "lightning"
        );

        if (this.realmVFX) {
          this.realmVFX.clearClouds();
        }
      }
    }

    handleWordSlain(target, canvas) {
      if (target.isBoss) {
        this.playWordAudio(target);
        this.state.wordsSlain++;
        this.state.combo++;
        target.currentShieldIdx++;
        const isMob = canvas.width <= 768 || (canvas.height > canvas.width);

        if (target.currentShieldIdx < target.totalShields) {
          // Phá vỡ hộ thuẫn hiện tại, chuyển sang từ đồng nghĩa tiếp theo!
          const nextShield = target.shields[target.currentShieldIdx];
          target.word = nextShield.word.toUpperCase();
          target.ipa = nextShield.ipa;
          target.meaning = nextShield.meaning;
          target.typedLen = 0;
          this.currentTarget = null;

          this.audio.play("shatter");
          this.audio.play("chime");
          this.state.screenShake = 16;
          this.particles.createExplosion(target.x, target.y, "#F59E0B", 36);
          this.particles.createPixelShards(target.x, target.y, ["#F59E0B", "#EF4444", "#FEF08A"], 24);
          this.floatingText.add(target.x, target.y - 70, `[ 破 ] PHÁ HỘ THUẪN ${target.currentShieldIdx}/${target.totalShields}!`, "#FDE047", isMob ? 15 : 18);
          if (this.animator) {
            this.animator.spawnVFXClip("vfx_slash_r4_sheet", target.x, target.y, { size: 160, fps: 24, color: "#EF4444" });
          }
          return;
        } else {
          // ĐÃ PHÁ HẾT CẢ 3 HỘ THUẪN: BOSS TÂM MA BỊ TIÊU DIỆT HOÀN TOÀN!
          this.audio.play("explosion");
          this.audio.play("chime");
          this.state.screenShake = 24;
          this.particles.createExplosion(target.x, target.y, "#FDE047", 64);
          this.particles.createPixelShards(target.x, target.y, ["#FDE047", "#EF4444", "#38BDF8", "#34D399"], 60);
          this.floatingText.addCelestialEdict(
            canvas.width,
            "[ 悟 • ĐẠI ĐẠO QUẢ ]",
            `Trảm diệt Tâm Ma thành công! Đột phá cảnh giới!`,
            "purified"
          );

          const bIdx = this.asteroids.asteroids.indexOf(target);
          if (bIdx !== -1) this.asteroids.asteroids.splice(bIdx, 1);
          this.currentTarget = null;

          if (this.onBossDefeated) {
            this.onBossDefeated(target);
          }
          return;
        }
      }
      // 1. PHÁT ÂM TỨC THÌ (ZERO DELAY): Kích hoạt ngay tại khoảnh khắc vừa gõ xong ký tự cuối cùng
      this.playWordAudio(target);

      this.state.wordsSlain++;
      this.state.combo++;
      if (this.state.combo > this.state.maxCombo) {
        this.state.maxCombo = this.state.combo;
      }

      const isMobile = canvas.width <= 768 || (canvas.height > canvas.width);
      const catX = canvas.width / 2;
      const catY = isMobile ? (canvas.height - 232) : (canvas.height - 128);

      // 1. Phóng phi kiếm thần tốc + Thiên Kiếm Giáng Thế + Slash VFX đa khung hình theo Cảnh Giới
      this.projectiles.spawn(catX, catY - 20, target.x, target.y, this.state.realmIdx, "#FDE047");
      this.projectiles.spawnSkyStrike(target.x, target.y, this.state.realmIdx);
      if (this.animator) {
        const rIdx = Math.min(4, Math.max(0, this.state.realmIdx || 0));
        this.animator.spawnVFXClip(`vfx_slash_r${rIdx}_sheet`, target.x, target.y, {
          size: 136,
          fps: 22
        });
      }

      // Nội tại Hồi Huyết Kim Đan (Cảnh 2: mỗi 4 từ hồi +3 HP) & Hộ Thuẫn Độ Kiếp (Cảnh 4: mỗi 5 từ +1 Khiên)
      if (this.state.realmIdx === 2 && this.state.wordsSlain % 4 === 0 && this.state.hp < this.state.maxHp) {
        this.state.hp = Math.min(this.state.maxHp, this.state.hp + 3);
        this.state.notify("hp");
        this.floatingText.add(catX, catY - 75, "[ 丹 ] KIM ĐAN HỒI HUYẾT (+3 HP)", "#34D399", isMobile ? 13 : 15);
      } else if (this.state.realmIdx >= 4 && this.state.wordsSlain % 5 === 0 && (this.state.shieldCharges || 0) < 3) {
        this.state.shieldCharges = (this.state.shieldCharges || 0) + 1;
        this.state.notify("shield");
        this.floatingText.add(catX, catY - 75, "[ 盾 ] CHÂN LONG HỘ THUẪN (+1)", "#FDE047", isMobile ? 13 : 15);
      }

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

      // 7. Vụ nổ tiên đạo: Sóng Bát Quái + cánh sen + tàn kiếm khí + mảnh vỡ pixel
      if (this.particles.createXianxiaWordBurst) {
        this.particles.createXianxiaWordBurst(target.x, target.y, this.state.realmIdx || 0);
      }
      this.particles.createPixelShards(target.x, target.y, [target.coreColor, "#FEF08A", "#EF4444", "#38BDF8", "#170D08"], 36);
      this.particles.createExplosion(target.x, target.y, target.color, 24);
      if (this.state.realmIdx <= 1) {
        this.particles.createBambooLeaves(target.x, target.y, 8);
      }

      // 8. Khẩu quyết tiên hiệp & Thoại cute meow
      const comboSpeeches = (root.Meowcha && root.Meowcha.COMBO_SPEECHES) || {};
      if (comboSpeeches[this.state.combo]) {
        this.state.setSpeech(comboSpeeches[this.state.combo], 2500);
      } else {
        const speechesData = root.Meowcha.REALM_SKILL_SPEECHES || [];
        const realmSpeeches = speechesData[Math.min(4, this.state.realmIdx)] || speechesData[0];
        if (realmSpeeches && realmSpeeches.length > 0) {
          const chant = realmSpeeches[Math.floor(Math.random() * realmSpeeches.length)];
          this.state.setSpeech(chant, 2200);
        }
      }

      // Xóa ma thạch khỏi danh sách
      const idx = this.asteroids.asteroids.indexOf(target);
      if (idx !== -1) {
        this.asteroids.asteroids.splice(idx, 1);
      }

      // Cập nhật thông tin từ vừa trảm xong lên đàn tế kiếm để người chơi kịp đọc giải nghĩa & phiên âm IPA
      const meaningEl = document.getElementById("swordTargetMeaning");
      if (meaningEl) {
        const modePrefix = this.state.gameMode === "CLOZE" ? "[ 悟 • ĐÃ NGỘ ĐẠO ]" : "[ 斩 • ĐÃ TRẢM ]";
        meaningEl.innerHTML = `<span style="color: #10B981; font-weight: 800;">${modePrefix} ${target.word}: ${target.meaning || target.definition || ""} (${target.ipa || ""})</span>`;
        if (this.lastSlainDisplayTimer) clearTimeout(this.lastSlainDisplayTimer);
        this.lastSlainDisplayTimer = setTimeout(() => {
          this.lastSlainDisplayTimer = null;
          if (!this.currentTarget) {
            const mEl = document.getElementById("swordTargetMeaning");
            if (mEl) mEl.innerText = "";
          }
        }, 3200);
      }

      this.currentTarget = null;
      this.updateSwordAltarUI(null);

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

      // 0. TRIỆT TIÊU TOÀN BỘ ÂM THANH TRƯỚC ĐÓ ĐỂ ĐẢM BẢO KHÔNG BAO GIỜ BỊ VỌNG HOẶC CHỒNG 2 GIỌNG
      if (this.currentAudioInstance) {
        try {
          this.currentAudioInstance.pause();
          this.currentAudioInstance.currentTime = 0;
        } catch (_) {}
        this.currentAudioInstance = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (_) {}
      }

      const audioUrl = target.audio_url;

      // 1. ƯU TIÊN PHÁT DUY NHẤT 1 LẦN GIỌNG BẢN XỨ OXFORD CHUẨN XÁC
      if (audioUrl && typeof audioUrl === "string" && audioUrl.startsWith("http")) {
        try {
          const audio = new Audio(audioUrl);
          this.currentAudioInstance = audio;
          audio.volume = 1.0;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // Nếu mạng chặn hoặc lỗi mp3 -> Mới Fallback về Web Speech API
              this.speakWord(target.word);
            });
          }
          return;
        } catch (_) {
          // Fallback
        }
      }

      // 2. Fallback: Phát âm qua Web Speech API duy nhất 1 lần nếu không có URL mp3
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
    replayCurrentAudio() {
      const activeList = (this.asteroids && this.asteroids.asteroids) || [];
      const target = this.currentTarget || (activeList.length > 0 ? activeList[0] : null);
      if (target) {
        this.playWordAudio(target);
        if (this.audio) this.audio.play("type");
        const altarSub = document.getElementById("swordTargetMeaning");
        if (altarSub && this.state && this.state.gameMode === "AUDIO") {
          altarSub.innerHTML = `<span style="color: #A78BFA; animation: pulse 0.8s infinite;">[ 聽 ] Đang phát lại tiên âm: ${target.ipa || '/.../'}</span>`;
        }
        return true;
      }
      return false;
    }

    updateSwordAltarUI(target) {
      const intentEl = document.getElementById("swordIntentText");
      const meaningEl = document.getElementById("swordTargetMeaning");
      const gaugeEl = document.getElementById("swordTargetGauge");
      const counterEl = document.getElementById("swordTargetCounter");
      const plaqueEl = document.getElementById("swordAltarModeLabel");
      const curMode = (this.state && this.state.gameMode) || "DIRECT";

      const plaqueTitles = {
        DIRECT: "TRỰC DIỆN TRẢM MA • THẦN TỐC XUẤT KIẾM",
        CLOZE:  "NGỘ ĐẠO ĐÀI • TÂM PHÁP ĐOÁN TỰ",
        AUDIO:  "THÍNH TIÊN ĐÀI • LẮNG NGHE CHÂN NGÔN"
      };

      if (!target || !target.word) {
        if (plaqueEl) plaqueEl.innerText = `[ 剑 ] KIẾM QUYẾT ĐÀI • ${plaqueTitles[curMode] || plaqueTitles.DIRECT} [ 诀 ]`;
        if (intentEl) {
          const isMobile = (typeof window !== "undefined" && window.innerWidth <= 768);
          const idleMsgs = {
            DIRECT: isMobile ? "[ 斩 ] TRỰC DIỆN TRẢM MA" : "[ 斩 ] TRỰC DIỆN TRẢM MA • GÕ CỔ TỰ TỐC ĐỘ ĐỂ XUẤT KIẾM [ 诀 ]",
            CLOZE:  isMobile ? "[ 悟 ] NGỘ ĐẠO THÔNG LINH" : "[ 悟 ] NGỘ ĐẠO THÔNG LINH • NHÌN NGHĨA TIẾNG VIỆT ĐOÁN TỰ PHÁ PHÙ [ 诀 ]",
            AUDIO:  isMobile ? "[ 听 ] THÍNH TIÊN BIỆN ÂM" : "[ 听 ] THÍNH TIÊN BIỆN ÂM • LẮNG NGHE CHÂN NGÔN (PHÍM TAB NGHE LẠI) [ 诀 ]"
          };
          intentEl.innerHTML = `<span class="altar-idle-msg">${idleMsgs[curMode] || idleMsgs.DIRECT}</span>`;
        }
        if (meaningEl && !this.lastSlainDisplayTimer) {
          meaningEl.innerText = "";
        }
        if (gaugeEl) gaugeEl.style.width = "0%";
        if (counterEl) counterEl.innerText = "0/0";
        return;
      }

      if (this.lastSlainDisplayTimer) {
        clearTimeout(this.lastSlainDisplayTimer);
        this.lastSlainDisplayTimer = null;
      }

      if (plaqueEl) plaqueEl.innerText = `[ 剑 ] ĐANG XUẤT CHIÊU • ${plaqueTitles[curMode] || plaqueTitles.DIRECT} [ 诀 ]`;

      const word = target.word;
      const typed = Math.min(target.typedLen, word.length);
      const pct = Math.round((typed / word.length) * 100);

      // XỬ LÝ HIỂN THỊ CHỮ GÕ & CHỮ CHƯA GÕ TRÊN CUỘN THƯ BÍ KÍP (MỰC TÀU CỔ PHONG ĐẬM NÉT):
      let wordDisplayHtml = "";

      if (curMode === "CLOZE") {
        // CHẾ ĐỘ NGỘ ĐẠO THÔNG LINH (ĐOÁN TỰ):
        // 1. Chữ đã gõ: Mực ngọc lục bảo đậm #065F46
        // 2. Ký tự đầu tiên: Nếu chưa gõ thì hiện làm gợi ý mở đầu bằng mực chu sa #991B1B
        // 3. Ký tự cuối cùng: Luôn hiện làm gợi ý chốt đuôi nếu từ >= 3 chữ bằng mực chu sa #991B1B
        // 4. Ký tự ở giữa: Giấu kín tuyệt đối bằng ký hiệu gạch chân "_ "
        for (let i = 0; i < word.length; i++) {
          if (i < typed) {
            wordDisplayHtml += `<span class="altar-typed-txt">${word[i]}</span> `;
          } else if (i === 0 && typed === 0) {
            wordDisplayHtml += `<span class="altar-hint-char">${word[0]}</span> `;
          } else if (i === word.length - 1 && word.length >= 3) {
            wordDisplayHtml += `<span class="altar-hint-char">${word[i]}</span> `;
          } else {
            wordDisplayHtml += `<span class="altar-untyped-txt">_ </span>`;
          }
        }
      } else if (curMode === "AUDIO") {
        // CHẾ ĐỘ THÍNH TIÊN BIỆN ÂM:
        for (let i = 0; i < word.length; i++) {
          if (i < typed) {
            wordDisplayHtml += `<span class="altar-typed-txt">${word[i]}</span> `;
          } else {
            wordDisplayHtml += `<span class="altar-untyped-txt">_ </span>`;
          }
        }
      } else {
        // CHẾ ĐỘ TRỰC DIỆN TRẢM MA:
        const typedPart = word.substring(0, typed);
        const untypedPart = word.substring(typed);
        wordDisplayHtml = `<span class="altar-typed-txt">${typedPart}</span><span class="altar-untyped-txt">${untypedPart}</span>`;
      }

      if (intentEl) {
        intentEl.innerHTML = wordDisplayHtml.trim();
      }

      if (meaningEl) {
        if (curMode === "AUDIO") {
          meaningEl.innerHTML = `
            <span style="color: #581C87; font-weight: 800; font-size: 13px; text-shadow: 0 1px 0 rgba(255,255,255,0.8); cursor: pointer;" onclick="window.__meowchaReplayAudio && window.__meowchaReplayAudio()" title="Bấm hoặc gõ phím TAB để nghe lại">
              [ 听 ] TIÊN ÂM: ${target.ipa || '/.../'} • Bấm TAB nghe lại
            </span>
          `;
        } else if (curMode === "CLOZE") {
          if (typed >= word.length) {
            meaningEl.innerHTML = `<span style="color: #064E3B; font-weight: 800; font-size: 13.5px; text-shadow: 0 1px 0 rgba(255,255,255,0.8);">[ 悟 • ĐÃ TRẢM ] ${target.word}: ${target.meaning || target.definition || ""} (${target.ipa || ""})</span>`;
          } else {
            meaningEl.innerHTML = `<span style="color: #451A03; font-weight: 800; font-size: 13.5px; text-shadow: 0 1px 0 rgba(255,255,255,0.8);">[ 悟 ] Nghĩa: ${target.meaning || target.definition || "Đoán từ tiếng Anh"} • [${word.length} chữ]</span>`;
          }
        } else {
          // DIRECT TYPING: Trong lúc gõ CHỈ hiện từ tiếng Anh, gõ xong mới hiện đầy đủ IPA và nghĩa
          if (typed >= word.length) {
            meaningEl.innerHTML = `<span style="color: #064E3B; font-weight: 800; font-size: 13.5px; text-shadow: 0 1px 0 rgba(255,255,255,0.8);">[ 斩 • HOÀN THÀNH ] ${target.word}: ${target.meaning || target.definition || ""} (${target.ipa || ""})</span>`;
          } else {
            meaningEl.innerHTML = `<span style="color: #1C1917; font-weight: 800; font-size: 13.5px; text-shadow: 0 1px 0 rgba(255,255,255,0.8);">[ 斩 ] Tiến độ xuất kiếm • [${typed}/${word.length}]</span>`;
          }
        }
      }

      if (gaugeEl) {
        gaugeEl.style.width = `${pct}%`;
      }
      if (counterEl) {
        counterEl.innerText = `${typed}/${word.length}`;
      }
    }

  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.TypingEngine = TypingEngine;
})(typeof window !== 'undefined' ? window : globalThis);
