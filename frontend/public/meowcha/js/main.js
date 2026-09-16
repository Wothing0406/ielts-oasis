/**
 * main.js - Bộ Điều Phối Tổng Thể Game Meowcha IELTS (Game Loop & Lifecycle)
 * Kết nối toàn bộ các module: Core, Entities, Effects, Combat, UI và UnityBridge
 */
(function(root) {
  const M = root.Meowcha || {};

  class MeowchaApp {
    constructor() {
      this.canvas = document.getElementById("gameCanvas");
      this.ctx = this.canvas ? this.canvas.getContext("2d") : null;

      // Khởi tạo Asset Loader
      this.assets = {
        bg: { src: "./bg_study_sanctuary.jpg", img: new Image(), loaded: false },
        cat_idle: { src: "./sprites/cat_idle.png", img: new Image(), loaded: false },
        cat_weak_attack: { src: "./sprites/cat_weak_attack.png", img: new Image(), loaded: false },
        cat_golden_core: { src: "./sprites/cat_golden_core.png", img: new Image(), loaded: false },
        cat_nascent_soul: { src: "./sprites/cat_nascent_soul.png", img: new Image(), loaded: false },
        cat_celestial_sovereign: { src: "./sprites/cat_celestial_sovereign.png", img: new Image(), loaded: false },
        cat_hurt: { src: "./sprites/cat_hurt.png", img: new Image(), loaded: false },
        cat_defeated: { src: "./sprites/cat_defeated.png", img: new Image(), loaded: false },
        cat_ultimate_blast: { src: "./sprites/cat_ultimate_blast.png", img: new Image(), loaded: false },
        prop_asteroid: { src: "./sprites/prop_asteroid.png", img: new Image(), loaded: false },
        prop_asteroid_ice: { src: "./sprites/prop_asteroid_ice.png", img: new Image(), loaded: false },
        prop_asteroid_fire: { src: "./sprites/prop_asteroid_fire.png", img: new Image(), loaded: false },
        prop_asteroid_void: { src: "./sprites/prop_asteroid_void.png", img: new Image(), loaded: false },
        prop_bamboo_sword: { src: "./sprites/prop_bamboo_sword.png", img: new Image(), loaded: false },
        prop_jade_sword: { src: "./sprites/prop_jade_sword.png", img: new Image(), loaded: false },
        sword_realm3_thunder: { src: "./sprites/sword_realm3_thunder.png", img: new Image(), loaded: false },
        sword_realm4_dragon: { src: "./sprites/sword_realm4_dragon.png", img: new Image(), loaded: false },
        prop_sword_slash: { src: "./sprites/prop_sword_slash.png", img: new Image(), loaded: false },
        prop_tea_explosion: { src: "./sprites/prop_tea_explosion.png", img: new Image(), loaded: false },
        prop_mystic_cloud: { src: "./sprites/prop_mystic_cloud.png", img: new Image(), loaded: false }
      };

      // Các hệ thống con
      this.gameState = new M.GameState();
      this.audio = new M.AudioManager();
      this.saveSystem = new M.SaveSystem();
      this.particles = new M.ParticleEngine();
      this.realmVFX = new M.RealmVFX(this.assets);
      this.floatingText = new M.FloatingText();
      this.cat = new M.CatCultivator(this.assets, this.realmVFX);
      this.asteroids = new M.AsteroidManager(this.assets);
      this.projectiles = new M.ProjectileSystem(this.assets);
      this.unityBridge = new M.UnityBridge("unityCharFrame", "unityCharacterMount");
      this.breakthrough = new M.BreakthroughFlow(this.gameState, this.audio, this.unityBridge);
      this.typing = new M.TypingEngine(this.gameState, this.asteroids, this.projectiles, this.particles, this.audio, this.floatingText, this.realmVFX);

      this.ipaToast = null;
      this.vKeyboard = null;
      this.ui = null;

      this.lastFrameTime = performance.now();
      this.spawnTimer = 0;
      this.isLoopRunning = false;
      this.gameOverModalShown = false;
    }

    init() {
      this.loadAllAssets();
      this.initCanvasSize();
      this.unityBridge.init();

      const ipaContainer = document.getElementById("ipaToastContainer");
      if (ipaContainer) {
        this.ipaToast = new M.IPAToast(ipaContainer);
      }

      const kbContainer = document.getElementById("virtualKeyboardContainer");
      if (kbContainer) {
        this.vKeyboard = new M.VirtualKeyboard(kbContainer, (key) => {
          this.typing.processKey(key, this.canvas);
        });
      }

      this.ui = new M.UIManager(
        this.gameState,
        this.saveSystem,
        this.audio,
        () => this.startBattle(),
        () => this.returnToLobby(),
        () => this.restartBattle()
      );

      // Kết nối callback khi trảm từ hoàn tất
      this.typing.onWordCompleted = (slainWord) => {
        // Tự động ghi lại tiến trình vào ngọc giản slot 1
        this.saveSystem.saveGame(1, this.gameState);

        // Kiểm tra điều kiện đột phá
        const triggered = this.breakthrough.checkProgress();
        if (!triggered) {
          // Lên lịch sinh từ tiếp theo
          setTimeout(() => this.spawnWord(), 600);
        }
      };

      // Callback hiển thị bảng thiên phú đột phá
      this.breakthrough.onShowTalentModal = (talents, targetRealm) => {
        this.ui.showTalentModal(talents, targetRealm, (chosenTalent) => {
          this.breakthrough.selectTalent(chosenTalent);
          this.saveSystem.saveGame(1, this.gameState);
          this.ui.updateHUD();
          setTimeout(() => this.spawnWord(), 600);
        });
      };

      this.bindWindowEvents();

      // Nạp tự động tiến trình đã lưu nếu có
      if (this.saveSystem.hasActiveSave()) {
        const slot1 = this.saveSystem.getSlot(1);
        this.gameState.loadFromSlot(slot1);
      }
      this.ui.updateHUD();

      this.saveSystem.syncWithBackend().then(() => {
        this.ui.renderSaveSlotsUI();
        this.ui.updateHUD();
      });

      // Bắt đầu vòng lặp đồ họa
      this.isLoopRunning = true;
      requestAnimationFrame((t) => this.gameLoop(t));

      console.log("[Meowcha] Động cơ Meowcha IELTS đã khởi tạo hoàn tất!");
    }

    loadAllAssets() {
      Object.keys(this.assets).forEach(key => {
        const item = this.assets[key];
        item.img.onload = () => { item.loaded = true; };
        item.img.onerror = () => { console.warn(`[AssetLoader] Không thể tải: ${item.src}`); };
        item.img.src = item.src;
      });
    }

    initCanvasSize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    bindWindowEvents() {
      // Bàn phím phần cứng
      window.addEventListener("keydown", (e) => {
        if (this.gameState.currentScene !== "BATTLE") return;
        if (e.key === "Escape") {
          this.ui.togglePause();
          return;
        }
        if (e.key.length === 1 && /[a-zA-Z]/i.test(e.key)) {
          this.typing.processKey(e.key, this.canvas);
        }
      });

      // Lắng nghe lệnh từ trang Next.js cha
      window.addEventListener("message", (event) => {
        if (!event.data) return;
        if (event.data.type === "MEOWCHA_LOAD_SLOT") {
          const slot = event.data.data;
          if (slot) {
            this.gameState.loadFromSlot(slot);
            this.startBattle();
          }
        } else if (event.data.type === "MEOWCHA_RELOAD") {
          window.location.reload();
        }
      });
      // Tự động co giãn canvas và chuyển đổi bàn phím ảo khi thay đổi kích thước màn hình
      window.addEventListener("resize", () => {
        this.initCanvasSize();
        if (this.vKeyboard && this.gameState.currentScene === "BATTLE") {
          if (window.innerWidth <= 768 || 'ontouchstart' in window) {
            this.vKeyboard.show();
          } else {
            this.vKeyboard.hide();
          }
        }
      });
    }

    startBattle() {
      this.gameState.currentScene = "BATTLE";
      this.gameState.isPaused = false;
      this.gameState.revive(); // Phục hồi sinh lực và trạng thái sống sót
      this.gameState.startTime = Date.now();
      this.gameOverModalShown = false;
      this.typing.currentTarget = null;

      this.asteroids.clear();
      this.projectiles.clear();
      this.particles.clear();
      this.floatingText.clear();

      this.ui.showScene("BATTLE");
      this.audio.startZenGuqin();

      // Tự động hiển thị bàn phím ảo trên thiết bị di động / cảm ứng
      if (this.vKeyboard && (window.innerWidth <= 768 || 'ontouchstart' in window)) {
        this.vKeyboard.show();
      }

      this.gameState.setSpeech(`Sẵn sàng nghênh chiến ma thạch!`, 3000);

      // Sinh từ vựng đầu tiên
      setTimeout(() => this.spawnWord(), 400);
    }

    returnToLobby() {
      this.saveSystem.saveGame(1, this.gameState);
      this.gameState.currentScene = "LOBBY";
      this.gameState.revive(); // Phục hồi đan điền khi quay về sảnh thiền
      this.gameOverModalShown = false;
      this.typing.currentTarget = null;

      this.asteroids.clear();
      this.projectiles.clear();
      this.ui.showScene("LOBBY");
      this.audio.stopZenGuqin();

      if (this.vKeyboard) {
        this.vKeyboard.hide();
      }
    }

    restartBattle() {
      // Tẩy Tủy: Khởi tạo lại trận đấu về trạng thái ban đầu
      this.gameState.reset();
      this.gameState.currentScene = "BATTLE";
      this.gameState.isPaused = false;
      this.gameState.revive();
      this.gameState.startTime = Date.now();
      this.gameOverModalShown = false;
      this.typing.currentTarget = null;

      this.asteroids.clear();
      this.projectiles.clear();
      this.particles.clear();
      this.floatingText.clear();

      this.saveSystem.resetActiveSave();
      this.saveSystem.saveGame(1, this.gameState);

      this.ui.showScene("BATTLE");
      this.ui.updateHUD();
      this.audio.play("breakthrough");
      this.audio.startZenGuqin();

      if (this.vKeyboard && (window.innerWidth <= 768 || 'ontouchstart' in window)) {
        this.vKeyboard.show();
      }

      this.gameState.setSpeech("Tẩy Tủy Hoàn Tất! Trùng Tu Kiếm Đạo!", 3500);
      this.floatingText.add(this.canvas.width / 2, this.canvas.height / 2 - 50, "🔄 TẨY TỦY TRỌNG SINH!", "#38BDF8", 30);

      setTimeout(() => this.spawnWord(), 500);
    }

    spawnWord() {
      if (this.gameState.currentScene !== "BATTLE" || this.gameState.isGameOver) return;
      const maxAsteroids = this.gameState.realmIdx >= 3 ? 4 : (this.gameState.realmIdx >= 1 ? 3 : 2);
      if (this.asteroids.count >= maxAsteroids) return; // Cho phép nhiều ma thạch cùng xuất hiện ở cảnh giới cao

      const bandIdx = (this.gameState.selectedBandIdx !== undefined && this.gameState.selectedBandIdx !== null) ? this.gameState.selectedBandIdx : this.gameState.realmIdx;
      const realmDecks = M.REALM_DECKS || {};
      const deck = realmDecks[bandIdx] || realmDecks[this.gameState.realmIdx] || realmDecks[0];
      const wordItem = deck[Math.floor(Math.random() * deck.length)];

      const ast = this.asteroids.spawn(
        wordItem,
        this.canvas.width,
        this.gameState.realmIdx,
        (this.gameState.talents.slowFactor || 1.0) * (this.gameState.speedMultiplier || 1.0),
        bandIdx
      );
    }

    gameLoop(now) {
      const dt = Math.min(0.1, (now - this.lastFrameTime) / 1000);
      this.lastFrameTime = now;

      // Bụi linh khí (Qi Motes) lơ lửng ngẫu nhiên trong cả sảnh chờ và trận chiến
      if (Math.random() < 0.22) {
        this.particles.spawnQiMote(this.canvas.width, this.canvas.height);
      }

      try {
        if (this.gameState.currentScene === "BATTLE" && !this.gameState.isPaused) {
          this.update(dt);
        } else {
          this.particles.update();
        }

        this.draw();
      } catch (loopErr) {
        console.error("[Meowcha GameLoop Exception Prevented Freeze]", loopErr);
      }

      if (this.isLoopRunning) {
        requestAnimationFrame((t) => this.gameLoop(t));
      }
    }

    update(dt) {
      const isMobile = this.canvas.width <= 768 || (this.canvas.height > this.canvas.width);
      const catTargetY = isMobile ? (this.canvas.height * 0.61 - 40) : (this.canvas.height - 110);

      // 1. Cập nhật Choáng, Sấm Sét và Đồng bộ Bàn Phím Ảo
      this.gameState.updateStun(dt);
      if (this.vKeyboard) {
        this.vKeyboard.setStunned(this.gameState.isStunned);
      }

      // 2. Thiên Kiếp Ngẫu Nhiên (Hiểm cảnh Lôi Đình giáng thế làm rung và chớp màn hình, làm mờ cổ ngữ)
      if (this.gameState.realmIdx >= 1) {
        const lightningChance = 0.0012 + this.gameState.realmIdx * 0.0018;
        if (Math.random() < lightningChance) {
          const shakeAmt = 15 + this.gameState.realmIdx * 4;
          this.gameState.triggerLightning(shakeAmt);
          this.audio.play("lightning");
          if (Math.random() < 0.4) {
            this.floatingText.add(this.canvas.width / 2, 110, "⚡ THIÊN KIẾP LÔI ĐÌNH!", "#FDE047", 22);
          }
        }
      }

      // 3. Nhịp Sinh Ma Thạch Liên Hoàn (Tạo áp lực dồn dập, tăng dần theo cảnh giới)
      this.spawnTimer = (this.spawnTimer || 0) + dt;
      const spawnInterval = Math.max(2.0, 5.2 - this.gameState.realmIdx * 0.80);
      if (this.spawnTimer >= spawnInterval) {
        this.spawnTimer = 0;
        this.spawnWord();
      }

      this.realmVFX.update(dt, this.gameState);
      this.particles.update();
      this.floatingText.update(dt, (orb) => {
        // Hạt Tu Vi bay hút về Miêu Kiếm Tôn: bừng sáng hào quang vàng kim
        this.particles.createHitSparks(this.canvas.width / 2, catTargetY, "#FDE047", 10);
        this.audio.play("type");
      });
      this.cat.update(dt, this.gameState);

      // Cập nhật ma thạch & kiểm tra chạm đáy (Trên mobile chạm ngay trên đỉnh bàn phím ảo)
      const bottomThreshold = isMobile ? (this.canvas.height * 0.61 - 15) : (this.canvas.height - 120);
      this.asteroids.update(dt, bottomThreshold, (missedAst) => {
        // Ma thạch đập vào đan điền
        const res = this.gameState.takeDamage(15);
        if (res.absorbed) {
          this.audio.play("shatter");
          this.particles.createShieldShards(missedAst.x, bottomThreshold, "#EAB308", 18);
          this.floatingText.add(missedAst.x, bottomThreshold - 30, "🛡️ LINH THUẪN CHẶN ĐÒN!", "#EAB308", 18);
        } else {
          this.audio.play("hurt");
          this.particles.createExplosion(missedAst.x, bottomThreshold, "#EF4444", 20);
          this.floatingText.add(missedAst.x, bottomThreshold - 30, "-15 HP ĐAN ĐIỀN", "#EF4444", 20);
        }

        if (this.gameState.isGameOver) {
          if (!this.gameOverModalShown) {
            this.gameOverModalShown = true;
            this.ui.showGameOverModal();
          }
        } else {
          // Sinh từ mới tiếp tục
          setTimeout(() => this.spawnWord(), 800);
        }
      }, this.canvas.width);

      // Cập nhật phi kiếm
      this.projectiles.update(dt, (hitProj) => {
        this.particles.createHitSparks(hitProj.targetX, hitProj.targetY, hitProj.color, 6);
      });

      // Rung màn hình (Screen Shake decay)
      if (this.gameState.screenShake > 0) {
        this.gameState.screenShake = Math.max(0, this.gameState.screenShake - dt * 25);
      }

      // Cập nhật thanh HUD
      this.ui.updateHUD();
    }

    draw() {
      if (!this.ctx) return;
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      ctx.save();

      // Hiệu ứng rung màn hình
      if (this.gameState.screenShake > 0) {
        const sx = (Math.random() - 0.5) * this.gameState.screenShake;
        const sy = (Math.random() - 0.5) * this.gameState.screenShake;
        ctx.translate(sx, sy);
      }

      // 1. Nền trà viện thiền tịnh (Aspect-cover tràn viền vô cực)
      if (this.assets.bg.loaded) {
        const img = this.assets.bg.img;
        const imgRatio = img.width / img.height;
        const canvasRatio = w / h;
        let renderW, renderH, offsetX, offsetY;
        if (canvasRatio > imgRatio) {
          renderW = w;
          renderH = w / imgRatio;
          offsetX = 0;
          offsetY = (h - renderH) / 2;
        } else {
          renderH = h;
          renderW = h * imgRatio;
          offsetX = (w - renderW) / 2;
          offsetY = 0;
        }
        ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
      } else {
        ctx.fillStyle = "#1E120A";
        ctx.fillRect(0, 0, w, h);
      }

      // Lớp phủ bóng mờ viền màn hình (Vignette)
      const grad = ctx.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, Math.max(w, h) / 1.4);
      grad.addColorStop(0, "rgba(0, 0, 0, 0.0)");
      grad.addColorStop(1, "rgba(10, 5, 2, 0.72)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Viền phù văn góc cổ phong Trung Hoa
      this.realmVFX.drawRetroPixelVignette(ctx, w, h);

      if (this.gameState.currentScene === "BATTLE") {
        // 2. Vẽ Phi Kiếm
        this.projectiles.draw(ctx);

        // 3. Vẽ Ma Thạch (kèm biến dạng điện giật khi Lôi Kiếp bùng nổ)
        this.asteroids.draw(ctx, this.gameState.screenFlash);

        // 4. MÂY MÙ CỔ PHONG TRÔI NGANG (CHƯỚNG KHÍ CHE KHUẤT TỪ VỰNG & PHÁ VỤ)
        this.realmVFX.drawMysticClouds(ctx, w, h, this.asteroids.asteroids);

        // 5. Vẽ Hạt hiệu ứng
        this.particles.draw(ctx);

        // 6. Vẽ Nhân vật Mèo Tôn kèm Phi Kiếm & Sợi Tơ Kiếm Ý Khóa Mục Tiêu
        this.cat.draw(ctx, this.canvas, this.gameState, this.typing.currentTarget);

        // 7. Vẽ Chữ nổi Tu Vi & Sát thương
        this.floatingText.draw(ctx);

        // 8. TIA SÉT THIÊN KIẾP & CHỚP SÁNG MÀN HÌNH
        this.realmVFX.drawLightning(ctx, w, h, this.gameState.screenFlash);

        // 9. Bong bóng thoại Mèo Tôn
        if (this.gameState.speechText && performance.now() < this.gameState.speechTimer) {
          this.floatingText.drawSideSpeechBubble(ctx, w / 2, h - 180, this.gameState.speechText);
        }
      }

      ctx.restore();
    }
  }

  // Khởi động khi DOM sẵn sàng
  window.addEventListener("DOMContentLoaded", () => {
    window.MeowchaGameInstance = new MeowchaApp();
    window.MeowchaGameInstance.init();
  });

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.App = MeowchaApp;
})(typeof window !== 'undefined' ? window : globalThis);
