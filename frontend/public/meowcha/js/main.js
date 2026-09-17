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
        prop_asteroid_thunder: { src: "./sprites/prop_asteroid_thunder.png", img: new Image(), loaded: false },
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
      this.typing = new M.TypingEngine(this.gameState, this.asteroids, this.projectiles, this.particles, this.audio, this.floatingText, this.realmVFX, this.unityBridge);

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

      if (M.VocabLoader && M.VocabLoader.preloadAllBands) {
        M.VocabLoader.preloadAllBands();
      }

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
        // ĐÓNG BĂNG TRẬN CHIẾN & QUÉT SẠCH MA THẠCH ĐANG RƠI ĐỂ NGƯỜI CHƠI KHÔNG BỊ MẤT MÁU OAN
        this.gameState.isPaused = true;
        this.asteroids.clear();
        this.typing.currentTarget = null;
        if (this.floatingText) {
          this.floatingText.add(this.canvas.width / 2, this.canvas.height / 2 - 40, "[ 灵 ] TIÊN KHÍ BÙNG NỔ • QUÉT SẠCH MA THẠCH!", "#34D399", 22);
        }

        this.ui.showTalentModal(talents, targetRealm, (chosenTalent) => {
          this.breakthrough.selectTalent(chosenTalent);
          this.saveSystem.saveGame(1, this.gameState);
          this.ui.updateHUD();
          this.gameState.isPaused = false;
          setTimeout(() => this.spawnWord(), 600);
        });
      };

      this.bindWindowEvents();

      // Lắng nghe thay đổi HP và Game Over để lập tức xử lý và lưu chuẩn xác
      this.gameState.addListener((changeKey) => {
        if (changeKey === "gameOver" || (changeKey === "hp" && this.gameState.hp <= 0)) {
          this.handleGameOver();
        } else if (changeKey === "hp" && this.gameState.hp > 0 && this.gameState.currentScene === "BATTLE") {
          // Lưu ngay lượng máu còn lại vào slot 1 để khi F5 không bị hồi full máu
          this.saveSystem.saveGame(1, this.gameState);
        }
      });

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

    handleGameOver() {
      if (this.gameOverModalShown) return;
      this.gameOverModalShown = true;
      this.gameState.isGameOver = true;
      this.gameState.hp = 0;

      // ĐẠO TIÊU THÂN VONG: Xóa ngay lập tức save slot 1 trên LocalStorage & Backend SQL
      this.saveSystem.resetActiveSave();

      this.asteroids.clear();
      this.typing.currentTarget = null;
      if (this.typing) {
        this.typing.isLightningHazard = false;
        this.typing.isCloudHazard = false;
        this.typing.hazardTimer = 0;
      }
      if (this.realmVFX) {
        this.realmVFX.clearClouds();
      }
      if (this.unityBridge) {
        this.unityBridge.triggerDefeated();
      }
      this.audio.play("hurt");
      this.ui.updateHUD();
      this.ui.showGameOverModal();
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
        } else if (event.data.type === "MEOWCHA_SPAWN_WORD") {
          const w = event.data.word;
          if (w) {
            if (this.gameState.currentScene !== "BATTLE") {
              this.startBattle();
            }
            this.asteroids.spawn({ word: w, ipa: "/.../", meaning: "Chỉ định trảm ma", type: "cổ ngữ" }, this.canvas.width, this.gameState.realmIdx);
          }
        } else if (event.data.type === "MEOWCHA_RELOAD") {
          window.location.reload();
        }
      });

      // Tự động mở khóa âm thanh khi người dùng tương tác lần đầu
      const unlockAudio = () => {
        if (this.audio) {
          this.audio.unlockAudioContext();
        }
      };
      window.addEventListener("pointerdown", unlockAudio, { once: true });
      window.addEventListener("keydown", unlockAudio, { once: true });
      window.addEventListener("touchstart", unlockAudio, { once: true });

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
      this.gameState.isGameOver = false;
      this.gameState.isStunned = false;
      this.gameState.stunTimer = 0;
      this.gameState.speedMultiplier = 1.0;
      this.gameState.screenShake = 0;
      this.gameState.screenFlash = 0;
      this.gameState.combo = 0;
      this.gameState.setCatState("IDLE");

      // NẾU LÀ TRẬN ĐẤU MỚI HOẶC CHƯA CÓ HP, MỚI CẤP FULL HP. NẾU ĐANG TIẾP TỤC SAVE GAME, GIỮ NGUYÊN LƯỢNG MÁU ĐÃ LƯU!
      if (typeof this.gameState.hp !== "number" || this.gameState.hp <= 0) {
        this.gameState.hp = this.gameState.maxHp || 50;
      }
      this.gameState.startTime = Date.now();
      this.gameOverModalShown = false;
      this.typing.currentTarget = null;
      if (this.typing) {
        this.typing.isLightningHazard = false;
        this.typing.isCloudHazard = false;
        this.typing.hazardTimer = 0;
      }

      this.asteroids.clear();
      this.projectiles.clear();
      this.particles.clear();
      this.floatingText.clear();

      this.ui.showScene("BATTLE");
      this.ui.updateHUD();
      this.audio.init();
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
      if (this.gameState.isGameOver || this.gameState.hp <= 0) {
        // Đạo tiêu thân vong: Tuyệt đối không lưu lại trạng thái đã chết!
        this.saveSystem.resetActiveSave();
        this.gameState.reset();
      } else {
        // Chỉ lưu khi người chơi còn sống chủ động dừng trận
        this.saveSystem.saveGame(1, this.gameState);
      }
      this.gameState.currentScene = "LOBBY";
      this.gameState.isPaused = false;
      this.gameState.isGameOver = false;
      this.gameState.isStunned = false;
      this.gameState.setCatState("IDLE");
      this.gameOverModalShown = false;
      this.typing.currentTarget = null;
      if (this.typing) {
        this.typing.isLightningHazard = false;
        this.typing.isCloudHazard = false;
        this.typing.hazardTimer = 0;
      }

      this.asteroids.clear();
      this.projectiles.clear();
      this.particles.clear();
      this.floatingText.clear();
      this.ui.showScene("LOBBY");
      this.ui.updateHUD();
      this.audio.stopZenGuqin();

      if (this.vKeyboard) {
        this.vKeyboard.hide();
      }
    }

    restartBattle() {
      // Tẩy Tủy: Khắc bia kỷ lục cao nhất lên Bảng Phong Thần trước khi trùng tu
      const best = Math.max(this.gameState.score || 0, this.gameState.highScore || 0);
      if (best > (this.gameState.highScore || 0)) {
        this.gameState.highScore = best;
        try {
          localStorage.setItem("meowcha_high_score", String(best));
        } catch (e) {}
      }
      if (best > 0 && this.ui) {
        this.ui.autoSubmitScoreToPantheon(best);
      }

      this.saveSystem.resetActiveSave();
      this.gameState.reset();
      this.gameState.currentScene = "BATTLE";
      this.gameState.isPaused = false;
      this.gameState.revive();
      this.gameState.startTime = Date.now();
      this.gameOverModalShown = false;
      this.typing.currentTarget = null;
      if (this.typing) {
        this.typing.isLightningHazard = false;
        this.typing.isCloudHazard = false;
        this.typing.hazardTimer = 0;
      }

      this.asteroids.clear();
      this.projectiles.clear();
      this.particles.clear();
      this.floatingText.clear();

      this.ui.showScene("BATTLE");
      this.ui.updateHUD();
      this.audio.play("breakthrough");
      this.audio.startZenGuqin();

      if (this.vKeyboard && (window.innerWidth <= 768 || 'ontouchstart' in window)) {
        this.vKeyboard.show();
      }

      this.gameState.setSpeech("Tẩy Tủy Hoàn Tất! Trùng Tu Kiếm Đạo!", 3500);
      this.floatingText.add(this.canvas.width / 2, this.canvas.height / 2 - 50, "[ 丹 ] TẨY TỦY TRỌNG SINH!", "#38BDF8", 30);

      setTimeout(() => this.spawnWord(), 500);
    }

    spawnWord() {
      if (this.gameState.currentScene !== "BATTLE" || this.gameState.isGameOver) return;
      // QUY CHUẨN ĐỘ KIẾP: TUYỆT ĐỐI CHỈ RƠI 1 QUẢ DUY NHẤT TẠI MỘT THỜI ĐIỂM!
      // Không bao giờ rơi chồng chéo 2-3 quả. Trảm xong quả này thì quả mới mới xuất hiện!
      if (this.asteroids.count >= 1) return;

      const rIdx = Math.max(0, this.gameState.realmIdx || 0);
      const realmDecks = M.REALM_DECKS || {};

      let effectiveSpeedMult = 1.0;

      // TĂNG DẦN TỐC ĐỘ RƠI & ĐỘ KHÓ ỔN ĐỊNH THEO CẢNH GIỚI VÀ TIẾN TRÌNH TU VI ĐẾN SIÊU KHÓ
      const scoreSpeedBonus = Math.min(0.55, (this.gameState.score / 4000) * 0.08);
      const slainBonus = Math.min(0.25, this.gameState.wordsSlain * 0.003);
      // Bậc tốc độ tăng dần ổn định từ sơ cơ đến siêu khó ở các cảnh giới cao
      const realmSpeedMultipliers = [1.0, 1.15, 1.35, 1.65, 2.05];
      const realmBaseMult = realmSpeedMultipliers[Math.min(4, rIdx)] || 1.0;
      effectiveSpeedMult = realmBaseMult * (1.0 + scoreSpeedBonus + slainBonus);

      // KHI BỊ SẤM ĐÁNH (THIÊN KIẾP SẤM SÉT): Tăng tốc độ sinh ma thạch (+25%) và rơi cực nhanh để tăng độ khó
      if (this.typing && this.typing.isLightningHazard) {
        effectiveSpeedMult *= 1.25;
      }

      // =========================================================================
      // TIẾN TRÌNH MA THẠCH THEO CẢNH GIỚI (PROGRESSION POOL):
      // Cấp 0 (Luyện Khí Kỳ): 100% Băng (ice)
      // Cấp 1 (Trúc Cơ Kỳ):   65% Băng (ice), 35% Hỏa (fire)
      // Cấp 2 (Kim Đan Kỳ):   25% Băng (ice), 45% Hỏa (fire), 30% Hư Không (void)
      // Cấp 3 (Nguyên Anh Kỳ): 10% Băng (ice), 25% Hỏa (fire), 40% Hư Không (void), 25% Huyết Lôi (thunder)
      // Cấp 4+ (Thần Cấp/Độ Kiếp): 5% Băng (ice), 20% Hỏa (fire), 35% Hư Không (void), 40% Huyết Lôi (thunder)
      // =========================================================================
      let chosenType = "ice";
      const rand = Math.random();
      if (rIdx === 0) {
        chosenType = "ice";
      } else if (rIdx === 1) {
        chosenType = rand < 0.65 ? "ice" : "fire";
      } else if (rIdx === 2) {
        if (rand < 0.25) chosenType = "ice";
        else if (rand < 0.70) chosenType = "fire";
        else chosenType = "void";
      } else if (rIdx === 3) {
        if (rand < 0.10) chosenType = "ice";
        else if (rand < 0.35) chosenType = "fire";
        else if (rand < 0.75) chosenType = "void";
        else chosenType = "thunder";
      } else {
        if (rand < 0.05) chosenType = "ice";
        else if (rand < 0.25) chosenType = "fire";
        else if (rand < 0.60) chosenType = "void";
        else chosenType = "thunder";
      }

      // ice (Băng): 3 - 6 ký tự (bao gồm các từ căn bản A1-A2)
      // fire (Hỏa): 6 - 8 ký tự
      // void (Hư Không): 8 - 11 ký tự
      // thunder (Huyết Lôi): 10 - 16 ký tự
      let targetMinLen = 3, targetMaxLen = 6;
      let targetDeckIdx = 0;
      if (chosenType === "fire") {
        targetMinLen = 6; targetMaxLen = 8; targetDeckIdx = 1;
      } else if (chosenType === "void") {
        targetMinLen = 8; targetMaxLen = 11; targetDeckIdx = 2;
      } else if (chosenType === "thunder") {
        targetMinLen = 10; targetMaxLen = 16; targetDeckIdx = 3;
      }

      // Lấy từ vựng phù hợp từ kho
      let sourceList = realmDecks[targetDeckIdx] || realmDecks[rIdx] || realmDecks[0] || [];
      if (rIdx >= 4) {
        // Cảnh 4: Thần Cảnh Vô Cực - Ngẫu nhiên toàn bộ kho từ điển Oxford 5000
        const combined = [];
        Object.keys(realmDecks).forEach(k => {
          if (Array.isArray(realmDecks[k])) combined.push(...realmDecks[k]);
        });
        if (combined.length > 0) sourceList = combined;
      } else if (rIdx === 3 || chosenType === "thunder") {
        const combinedHigh = [];
        [2, 3].forEach(k => {
          if (Array.isArray(realmDecks[k])) combinedHigh.push(...realmDecks[k]);
        });
        if (combinedHigh.length > 0) sourceList = combinedHigh;
      }

      // Lọc danh sách theo chuẩn độ dài
      let matchedList = sourceList.filter(w => w && w.word && w.word.length >= targetMinLen && w.word.length <= targetMaxLen);
      if (matchedList.length === 0) {
        matchedList = sourceList.filter(w => w && w.word && w.word.length >= Math.max(3, targetMinLen - 2));
      }
      if (matchedList.length === 0) {
        matchedList = sourceList;
      }

      // THUẬT TOÁN CHỐNG LẶP TỪ THÔNG MINH (ANTI-REPETITION RING BUFFER):
      // 1. Loại bỏ các từ hiện đang rơi trên chiến trường
      const activeWords = new Set(this.asteroids.asteroids.map(a => a.word));

      // 2. Loại bỏ các từ đã xuất hiện gần đây trong bộ nhớ tạm (60 từ gần nhất)
      if (!this.recentWordHistory) this.recentWordHistory = [];
      const recentSet = new Set(this.recentWordHistory);

      let candidatePool = matchedList.filter(w => !activeWords.has(w.word) && !recentSet.has(w.word));
      if (candidatePool.length === 0) {
        // Nếu đã quay hết kho từ thỏa mãn độ dài, reset bớt lịch sử và chỉ lọc các từ đang bay trên màn hình
        candidatePool = matchedList.filter(w => !activeWords.has(w.word));
      }
      if (candidatePool.length === 0) {
        candidatePool = matchedList;
      }

      const wordItem = candidatePool[Math.floor(Math.random() * candidatePool.length)];
      if (!wordItem) return;

      // Đưa vào hàng đợi lịch sử để không lặp lại trong ít nhất 60 từ tiếp theo
      this.recentWordHistory.push(wordItem.word);
      if (this.recentWordHistory.length > 60) {
        this.recentWordHistory.shift();
      }

      const ast = this.asteroids.spawn(
        wordItem,
        this.canvas.width,
        rIdx,
        (this.gameState.talents.slowFactor || 1.0) * (this.gameState.speedMultiplier || 1.0) * effectiveSpeedMult,
        targetDeckIdx,
        chosenType
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

      // 2. Nhịp Sinh Ma Thạch: Trong 10s thiên kiếp hồi từ mới cực nhanh (0.04s), bình thường theo điểm số
      this.spawnTimer = (this.spawnTimer || 0) + dt;
      if (this.asteroids.count === 0) {
        const isHazard = this.typing && this.typing.isLightningHazard;
        const minSpawnDelay = isHazard ? 0.04 : Math.max(0.12, 0.38 - Math.min(0.22, (this.gameState.score / 2500) * 0.15));
        if (this.spawnTimer >= minSpawnDelay) {
          this.spawnTimer = 0;
          this.spawnWord();
        }
      } else {
        this.spawnTimer = 0; // Đang có ma thạch thì tuyệt đối không đếm timer spawn thêm
      }

      // Cập nhật 10s thiên kiếp sấm sét liên tục
      if (this.typing) {
        this.typing.updateHazard(dt, this.canvas);
      }

      // NẾU HẾT MÁU DO SÉT ĐÁNH / THIÊN KIẾP / THIÊN THẠCH: LẬP TỨC TRIGGER GAME OVER & XÓA SAVE
      if (this.gameState.isGameOver || this.gameState.hp <= 0) {
        this.handleGameOver();
        return;
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
      const isLightningHazardNow = !!(this.typing && this.typing.isLightningHazard);
      this.asteroids.update(dt, bottomThreshold, (missedAst) => {
        // Ma thạch đập vào đan điền: Sát thương phân cấp theo loại ma thạch
        const baseDmg = missedAst.damage || (missedAst.asteroidType === 'thunder' ? 22 : missedAst.asteroidType === 'void' ? 16 : missedAst.asteroidType === 'fire' ? 12 : 8);
        const damage = Math.max(5, baseDmg);

        const res = this.gameState.takeDamage(damage);
        if (res.absorbed) {
          this.audio.play("shatter");
          this.particles.createShieldShards(missedAst.x, bottomThreshold, "#EAB308", 18);
          this.floatingText.add(missedAst.x, bottomThreshold - 30, "[ 盾 ] LINH THUẪN CHẶN ĐÒN!", "#EAB308", 18);
        } else {
          this.audio.play("hurt");
          if (this.unityBridge) {
            this.unityBridge.triggerHurt();
          }
          this.particles.createExplosion(missedAst.x, bottomThreshold, missedAst.coreColor || "#EF4444", 24);
          this.floatingText.add(missedAst.x, bottomThreshold - 30, `-${damage} HP ĐAN ĐIỀN`, "#EF4444", 22);

          // Rung chấn màn hình theo độ lớn của sát thương
          this.gameState.screenShake = Math.min(26, 10 + damage * 0.6);

          // Bị ma thạch chạm đáy tổn thất đan điền: Kích hoạt cảnh báo Ma Vân Tụ Khí
          if (this.typing && !this.gameState.isGameOver) {
            this.typing.triggerDemonHazardFromFall(this.canvas.width / 2, catTargetY, isMobile, this.canvas.width);
          }
        }

        if (this.gameState.isGameOver || this.gameState.hp <= 0) {
          this.handleGameOver();
        } else {
          // Sinh từ mới tiếp tục (nhanh hơn theo điểm số)
          const respawnDelay = Math.max(350, 750 - Math.min(350, (this.gameState.score / 1500) * 150));
          setTimeout(() => this.spawnWord(), respawnDelay);
        }
      }, this.canvas.width, isLightningHazardNow);

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

      // Tự động làm trong suốt thanh HUD nếu có thiên thạch đang rơi vào khu vực này để không che khuất chữ
      const hudEl = document.querySelector(".sect-scroll-hud");
      if (hudEl) {
        const isMob = this.canvas.width <= 768;
        const hudW = isMob ? this.canvas.width : 520;
        const hudH = 115;
        const hasAsteroidNearHUD = this.asteroids.asteroids.some(a => a && a.y < hudH + 20 && a.x < hudW + 30);
        if (hasAsteroidNearHUD) {
          hudEl.classList.add("hud-dimmed");
        } else {
          hudEl.classList.remove("hud-dimmed");
        }
      }
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
        // 2. Mây mù cổ phong ở tầng nền xa (Không bao giờ che khuất ma thạch và từ vựng)
        this.realmVFX.drawMysticClouds(ctx, w, h);

        // 3. Vẽ Phi Kiếm
        this.projectiles.draw(ctx);

        // 4. Vẽ Ma Thạch & Cổ Phù Từ Vựng
        this.asteroids.draw(ctx, this.gameState.screenFlash);

        // 4.1 MÂY QUẤY RỐI TẦM NHÌN (Khi bị phạt Ma Vân Tụ Khí, dải sương mù lượn lờ trôi ngang quấy nhiễu tầm nhìn)
        if (this.realmVFX && this.realmVFX.isPunishCloud) {
          this.realmVFX.drawMysticClouds(ctx, w, h, true);
        }

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
