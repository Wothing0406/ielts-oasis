/**
 * main.js - Bộ Điều Phối Tổng Thể Game Meowcha IELTS (Game Loop & Lifecycle)
 * Kết nối toàn bộ các module: Core, Entities, Effects, Combat, UI và UnityBridge
 */
(function(root) {
  const M = root.Meowcha || {};

  class MeowchaApp {
    constructor() {
      root.Meowcha = root.Meowcha || {};
      root.Meowcha.app = this;
      this.canvas = document.getElementById("gameCanvas");
      this.ctx = this.canvas ? this.canvas.getContext("2d") : null;

      // Khởi tạo Asset Loader theo cấu trúc thư mục phân tầng chuẩn (characters/, asteroids/, maps/)
      this.assets = {
        ivory_scroll: { src:'./assets/ui/ivory-scroll-v1.png', img:new Image(), loaded:false },
        cultivation_dais: { src: './assets/ui/cultivation-dais-v1.png', img: new Image(), loaded: false },
        bg: { src: "./sprites/maps/bg_study_sanctuary.jpg", img: new Image(), loaded: false },
        cat_idle: { src: "./sprites/characters/realm0_qi_refining/poses/idle.png", img: new Image(), loaded: false },
        cat_weak_attack: { src: "./sprites/characters/realm0_qi_refining/poses/attack.png", img: new Image(), loaded: false },
        cat_golden_core: { src: "./sprites/characters/realm2_golden_core/poses/idle.png", img: new Image(), loaded: false },
        cat_nascent_soul: { src: "./sprites/characters/realm3_nascent_soul/poses/idle.png", img: new Image(), loaded: false },
        cat_celestial_sovereign: { src: "./sprites/characters/realm4_tribulation/poses/idle.png", img: new Image(), loaded: false },
        cat_hurt: { src: "./sprites/characters/realm0_qi_refining/poses/hurt.png", img: new Image(), loaded: false },
        cat_defeated: { src: "./sprites/characters/realm0_qi_refining/poses/defeated.png", img: new Image(), loaded: false },
        cat_ultimate_blast: { src: "./sprites/characters/realm0_qi_refining/poses/ultimate.png", img: new Image(), loaded: false },
        prop_asteroid: { src: "./sprites/asteroids/ice.png", img: new Image(), loaded: false },
        prop_asteroid_ice: { src: "./sprites/asteroids/ice.png", img: new Image(), loaded: false },
        prop_asteroid_fire: { src: "./sprites/asteroids/fire.png", img: new Image(), loaded: false },
        prop_asteroid_void: { src: "./sprites/asteroids/void.png", img: new Image(), loaded: false },
        prop_asteroid_thunder: { src: "./sprites/asteroids/thunder.png", img: new Image(), loaded: false },
        prop_bamboo_sword: { src: "./sprites/characters/realm0_qi_refining/weapon/sword.png", img: new Image(), loaded: false },
        prop_jade_sword: { src: "./sprites/characters/realm1_foundation/weapon/sword.png", img: new Image(), loaded: false },
        prop_golden_sword: { src: "./sprites/characters/realm2_golden_core/weapon/sword.png", img: new Image(), loaded: false },
        sword_realm3_thunder: { src: "./sprites/characters/realm3_nascent_soul/weapon/sword.png", img: new Image(), loaded: false },
        sword_realm4_dragon: { src: "./sprites/characters/realm4_tribulation/weapon/sword.png", img: new Image(), loaded: false },
        prop_sword_slash: { src: "./sprites/characters/realm0_qi_refining/vfx/slash.png", img: new Image(), loaded: false },
        prop_tea_explosion: { src: "./sprites/maps/tea_explosion.png", img: new Image(), loaded: false },
        prop_mystic_cloud: { src: "./sprites/maps/mystic_cloud.png", img: new Image(), loaded: false },
        vfx_impact_burst_sheet: { src: "./sprites/maps/impact_burst_sheet.png", img: new Image(), loaded: false },
        chibi_companion: { src: "./sprites/characters/realm3_nascent_soul/poses/chibi_companion.png", img: new Image(), loaded: false }
      };

      // Đăng ký động 5 Cảnh Giới Nhân Vật (Poses + Sheets + Weapon + Beam + VFX riêng cho từng nhân vật)
      const realmFolders = [
        "realm0_qi_refining",
        "realm1_foundation",
        "realm2_golden_core",
        "realm3_nascent_soul",
        "realm4_tribulation"
      ];
      const stateKeys = ["idle", "attack", "ultimate", "hurt", "defeated"];
      realmFolders.forEach((folder, rIdx) => {
        stateKeys.forEach((st) => {
          this.assets[`char_r${rIdx}_${st}`] = {
            src: `./sprites/characters/${folder}/poses/${st}.png`,
            img: new Image(),
            loaded: false
          };
          this.assets[`char_r${rIdx}_${st}_sheet`] = {
            src: `./sprites/characters/${folder}/sheets/${st}_sheet.png`,
            img: new Image(),
            loaded: false
          };
        });
        // Vũ khí, đạn phi kiếm, tia bắn & hiệu ứng chém riêng của từng nhân vật
        this.assets[`char_r${rIdx}_sword`] = {
          src: `./sprites/characters/${folder}/weapon/sword.png`,
          img: new Image(),
          loaded: false
        };
        this.assets[`char_r${rIdx}_sword_sheet`] = {
          src: `./sprites/characters/${folder}/weapon/sword_sheet.png`,
          img: new Image(),
          loaded: false
        };
        this.assets[`char_r${rIdx}_projectile`] = {
          src: `./sprites/characters/${folder}/weapon/projectile.png`,
          img: new Image(),
          loaded: false
        };
        this.assets[`char_r${rIdx}_projectile_sheet`] = {
          src: `./sprites/characters/${folder}/weapon/projectile_sheet.png`,
          img: new Image(),
          loaded: false
        };
        this.assets[`char_r${rIdx}_beam`] = {
          src: `./sprites/characters/${folder}/beam/beam.png`,
          img: new Image(),
          loaded: false
        };
        this.assets[`char_r${rIdx}_beam_sheet`] = {
          src: `./sprites/characters/${folder}/beam/beam_sheet.png`,
          img: new Image(),
          loaded: false
        };
        this.assets[`char_r${rIdx}_slash`] = {
          src: `./sprites/characters/${folder}/vfx/slash.png`,
          img: new Image(),
          loaded: false
        };
        this.assets[`vfx_slash_r${rIdx}_sheet`] = {
          src: `./sprites/characters/${folder}/vfx/slash_sheet.png`,
          img: new Image(),
          loaded: false
        };
        this.assets[`char_r${rIdx}_muzzle`] = {
          src: `./sprites/characters/${folder}/vfx/muzzle.png`,
          img: new Image(),
          loaded: false
        };
        this.assets[`char_r${rIdx}_muzzle_sheet`] = {
          src: `./sprites/characters/${folder}/vfx/muzzle_sheet.png`,
          img: new Image(),
          loaded: false
        };
        this.assets[`char_r${rIdx}_hit`] = {
          src: `./sprites/characters/${folder}/vfx/hit.png`,
          img: new Image(),
          loaded: false
        };
        this.assets[`char_r${rIdx}_hit_sheet`] = {
          src: `./sprites/characters/${folder}/vfx/hit_sheet.png`,
          img: new Image(),
          loaded: false
        };
      });

      // Các hệ thống con
      this.gameState = new M.GameState();
      this.audio = new M.AudioManager();
      this.saveSystem = new M.SaveSystem();
      this.animator = M.SpriteAnimator ? new M.SpriteAnimator(this.assets) : null;
      this.particles = new M.ParticleEngine();
      this.realmVFX = new M.RealmVFX(this.assets);
      this.floatingText = new M.FloatingText(this.assets);
      this.cat = new M.CatCultivator(this.assets, this.realmVFX, this.animator);
      this.asteroids = new M.AsteroidManager(this.assets, this.gameState);
      this.projectiles = new M.ProjectileSystem(this.assets, this.animator);
      this.unityBridge = new M.UnityBridge("unityCharFrame", "unityCharacterMount");
      this.breakthrough = new M.BreakthroughFlow(this.gameState, this.audio, this.unityBridge);
      this.typing = new M.TypingEngine(this.gameState, this.asteroids, this.projectiles, this.particles, this.audio, this.floatingText, this.realmVFX, this.unityBridge, this.animator, this.saveSystem);

      this.ipaToast = null;
      this.vKeyboard = null;
      this.ui = null;

      this.lastFrameTime = performance.now();
      this.spawnTimer = 0;
      this.isLoopRunning = false;
      this.gameOverModalShown = false;
    }

    init() {
      if (M.installPixelArt) M.installPixelArt();
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
      if (M.Device && M.Device.info.isDesktop && document.getElementById('btnToggleVirtualKeyboard')) document.getElementById('btnToggleVirtualKeyboard').hidden = true;
      if (typeof ResizeObserver !== 'undefined') {
        this.layoutObserver = new ResizeObserver(() => { if (typeof M.refreshBattleLayout === 'function') if (typeof M.refreshBattleLayout === 'function') M.refreshBattleLayout(this.canvas); });
        [kbContainer, document.querySelector('.sect-scroll-hud'), document.getElementById('swordIntentBox')]
          .filter(Boolean).forEach(el => this.layoutObserver.observe(el));
      }
      const keyboardToggle = document.getElementById('btnToggleVirtualKeyboard');
      if (keyboardToggle) keyboardToggle.onclick = () => {
        M.Device.toggleVirtualKeyboard();
        if (typeof M.refreshBattleLayout === 'function') M.refreshBattleLayout(this.canvas);
      };

      // Nút khôi phục bàn phím ảo khi người dùng di động bấm thu gọn
      const restoreBtn = document.getElementById("floatingKbRestoreBtn");
      if (restoreBtn) {
        restoreBtn.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const D = root.Meowcha && root.Meowcha.Device;
          if (D) D.setUserPrefKeyboard(true);
          else if (this.vKeyboard) this.vKeyboard.show();
          restoreBtn.style.display = "none";
        });
      }

      // Khi người dùng bấm phím cứng thực tế -> Tự động ẩn bàn phím ảo nếu đang vô tình bật trên PC
      if (root.Meowcha && root.Meowcha.Device) {
        root.Meowcha.Device.onPhysicalKeyboardUsed = () => {
          if (root.Meowcha.Device.info.isDesktop && root.Meowcha.Device.userPrefKeyboard !== true && this.vKeyboard) {
            this.vKeyboard.hide();
          }
        };
      }

      this.ui = new M.UIManager(
        this.gameState,
        this.saveSystem,
        this.audio,
        () => this.startBattle(),
        () => this.returnToLobby(),
        () => this.restartBattle(),
        this.assets
      );

      // Kết nối callback khi trảm từ hoàn tất
      this.typing.onWordCompleted = (slainWord) => {
        // Tự động ghi lại tiến trình vào ngọc giản slot hiện tại
        const currentSlot = (this.gameState && this.gameState.activeSlotId) || this.saveSystem.getActiveSlotId() || 1;
        this.saveSystem.saveGame(currentSlot, this.gameState);

        // Hiển thị chữ Ngộ Đạo trực tiếp trên chiến trường (trên đỉnh đầu mèo, rõ ràng và không che khuất góc nhìn)
        if (this.floatingText && slainWord && (slainWord.meaning || slainWord.ipa)) {
          const catTargetY = (this.canvas ? this.canvas.height : 600) * 0.72;
          const meaningText = slainWord.meaning ? `[ 悟 ] ${slainWord.meaning}` : `[ 悟 ] ${slainWord.ipa || ''}`;
          this.floatingText.add(
            (this.canvas ? this.canvas.width : 400) / 2,
            catTargetY - 45,
            meaningText,
            "#34D399",
            20
          );
        }

        // Kiểm tra điều kiện đột phá
        const triggered = this.breakthrough.checkProgress(this.asteroids);
        if (!triggered) {
          // Lên lịch sinh từ tiếp theo
          setTimeout(() => this.spawnWord(), 600);
        }
      };

      // Callback hiển thị bảng thiên phú đột phá
      this.breakthrough.onSpawnBoss = (bossPool, newRealmIdx) => {
        const bossAst = this.asteroids.spawnBoss(bossPool, this.canvas.width);
        bossAst.isAudio = this.gameState.gameMode === 'AUDIO';
        bossAst.isCloze = this.gameState.gameMode === 'CLOZE';
        if (bossAst.isAudio) this.typing.playWordAudio(bossAst);
        this.typing.currentTarget = bossAst;
        this.typing.onBossDefeated = () => {
          this.breakthrough.onBossSlain(newRealmIdx);
        };
      };

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
          const currentSlot = (this.gameState && this.gameState.activeSlotId) || this.saveSystem.getActiveSlotId() || 1;
          this.saveSystem.saveGame(currentSlot, this.gameState);
          this.ui.updateHUD();
          this.gameState.isPaused = false;
          setTimeout(() => this.spawnWord(), 600);
        });
      };

      this.bindWindowEvents();
      window.__meowchaReplayAudio = () => {
        if (this.typing && this.gameState.currentScene === "BATTLE") {
          this.typing.processKey('Tab', this.canvas);
        }
      };

      // Lắng nghe thay đổi HP và Game Over để lập tức xử lý và lưu chuẩn xác
      this.gameState.addListener((changeKey) => {
        if (changeKey === "gameOver" || (changeKey === "hp" && this.gameState.hp <= 0)) {
          this.handleGameOver();
        } else if (changeKey === "hp" && this.gameState.hp > 0 && this.gameState.currentScene === "BATTLE") {
          // Lưu ngay lượng máu còn lại vào slot hiện tại để khi F5 không bị hồi full máu
          const currentSlot = (this.gameState && this.gameState.activeSlotId) || this.saveSystem.getActiveSlotId() || 1;
          this.saveSystem.saveGame(currentSlot, this.gameState);
        }
      });

      // Nạp tự động tiến trình đã lưu nếu có (theo slot đang hoạt động)
      const activeSave = this.saveSystem.hasActiveSave();
      if (activeSave) {
        this.gameState.loadFromSlot(activeSave);
        this.saveSystem.setActiveSlotId(activeSave.slotId || 1);
      }
      this.ui.updateHUD();

      this.saveSystem.syncWithBackend().then(() => {
        this.ui.renderSaveSlotsUI();
        this.ui.updateLobbyButtons();
        this.ui.updateHUD();
        this.saveSystem.flushCloudSaves();
      });
      this.saveSystem.retryPendingRuns();

      // Bắt đầu vòng lặp đồ họa
      this.isLoopRunning = true;
      requestAnimationFrame((t) => this.gameLoop(t));

      // Test hook cho automation & visual verification
      if (typeof window !== "undefined" && window.location) {
        const sp = new URLSearchParams(window.location.search);
        const debugScene = sp.get("debugScene");
        if (debugScene === "breakthrough") {
          setTimeout(() => {
            const realms = root.Meowcha.CULTIVATION_REALMS || [];
            const r = realms[1] || { name: "Trúc Cơ Kỳ", color: "#10B981" };
            const choices = root.Meowcha.generateBreakthroughChoices ? root.Meowcha.generateBreakthroughChoices(this.gameState, r) : [];
            this.ui.showTalentModal(choices, r, () => {});
          }, 350);
        } else if (debugScene === "battle") {
          setTimeout(() => {
            this.startBattle();
          }, 350);
        } else if (debugScene === "setup") {
          setTimeout(() => {
            const m = document.getElementById("modalBattleSetup");
            if (m) m.style.display = "flex";
          }, 350);
        }
      }

      console.log("[Meowcha] Động cơ Meowcha IELTS đã khởi tạo hoàn tất!");
    }

    purgeAllBattleState() {
      if (this.breakthrough) this.breakthrough.cancel();
      this.asteroids.clear();
      this.projectiles.clear();
      this.particles.clear();
      this.floatingText.clear();
      this.recentWordHistory = [];
      this.spawnTimer = 0;
      this.gameOverModalShown = false;
      if (this.typing) {
        this.typing.pendingAutoKill = false;
        this.typing.currentTarget = null;
        this.typing.isLightningHazard = false;
        this.typing.isCloudHazard = false;
        this.typing.hazardTimer = 0;
        this.typing.hazardLightningTimer = 0;
        this.typing.mistakeStreak = 0;
        this.typing.cloudMistakeCount = 0;
        this.typing.cloudPurifiedCount = 0;
        this.typing.purifiedWordsStreak = 0;
        this.typing.updateSwordAltarUI(null);
      }
      if (this.realmVFX) {
        this.realmVFX.clearClouds();
        this.realmVFX.cloudAlpha = 0;
        this.realmVFX.isPunishCloud = false;
        this.realmVFX.cloudTimer = 0;
      }
      if (this.gameState) {
        this.gameState.screenShake = 0;
        this.gameState.screenFlash = 0;
        this.gameState.isStunned = false;
        this.gameState.stunTimer = 0;
      }
    }

    handleGameOver() {
      if (this.gameOverModalShown) return;
      this.gameOverModalShown = true;
      this.gameState.isGameOver = true;
      this.gameState.hp = 0;

      // Khắc bia kỷ lục cao nhất lên Bảng Phong Thần khi tử trận
      const best = Math.max(this.gameState.score || 0, this.gameState.highScore || 0);
      if (best > (this.gameState.highScore || 0)) {
        this.gameState.highScore = best;
        try {
          localStorage.setItem("meowcha_high_score", String(best));
        } catch (e) {}
      }
      if (best > 0 && this.ui) {
        this.ui.autoSubmitScoreToPantheon();
      }

      // ĐẠO TIÊU THÂN VONG: Xóa dứt điểm dữ liệu của slot hiện tại
      const activeSlot = (this.gameState && this.gameState.activeSlotId) || this.saveSystem.getActiveSlotId() || 1;
      const curMode = (this.gameState && this.gameState.gameMode) || "DIRECT";
      this.saveSystem.resetActiveSave(activeSlot, curMode);

      // Dập tắt triệt để toàn bộ âm rung thiền định/drone gây ù tai khi tử trận
      if (this.audio) {
        this.audio.silenceAll();
      }

      this.purgeAllBattleState();
      if (this.unityBridge) {
        this.unityBridge.triggerDefeated();
      }
      if (this.audio) {
        this.audio.play("hurt");
      }
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
      if (M.refreshBattleLayout) if (typeof M.refreshBattleLayout === 'function') M.refreshBattleLayout(this.canvas);
    }

    bindWindowEvents() {
      // Bàn phím phần cứng
      window.addEventListener("keydown", (e) => {
        if (e.ctrlKey || e.altKey || e.metaKey || e.repeat || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target && e.target.tagName) || (e.target && e.target.isContentEditable)) return;
        if (this.gameState.currentScene === "LOBBY") {
          // Không kích hoạt nếu đang mở các modal
          const openModal = document.querySelector(".meowcha-modal-overlay[style*='display: flex']");
          if (!openModal && (e.code === "Space" || e.key === " " || e.key === "Enter")) {
            e.preventDefault();
            this.startBattle();
            return;
          }
        }
        if (this.gameState.currentScene !== "BATTLE") return;
        if (e.key === "Tab" || e.code === "Tab") {
          e.preventDefault();
          if (this.typing) this.typing.processKey('Tab', this.canvas);
          return;
        }
        if (e.code === 'Space' || e.key === ' ' || e.key === 'Backspace') {
          e.preventDefault();
          this.typing.processKey(e.key === 'Backspace' ? 'Backspace' : ' ', this.canvas);
          return;
        }
        if (e.key === "Escape") {
          this.ui.togglePause();
          return;
        }
        if (['1', '2', '3', '4'].includes(e.key)) {
          const openModal = document.querySelector(".meowcha-modal-overlay[style*='display: flex']");
          if (!openModal) {
            e.preventDefault();
            this.typing.processKey(e.key, this.canvas);
            return;
          }
        }
        // Chuẩn hóa gõ phím tiếng Việt (Telex/VNI/Unikey) sang ký tự Latinh thuần túy
        const rawKey = /^Key[A-Z]$/.test(e.code) ? e.code.slice(3) : e.key;
        const normalizedChar = rawKey.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d");
        if (normalizedChar.length === 1 && /[a-zA-Z]/i.test(normalizedChar)) {
          e.preventDefault();
          this.typing.processKey(normalizedChar, this.canvas);
        }
      });

      // Lắng nghe lệnh từ trang Next.js cha
      window.addEventListener("message", (event) => {
        if (!event.origin || event.origin !== window.location.origin) return;
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

      // Tự động mở khóa âm thanh và phát khúc Cổ Cầm thiền định ngay khi tương tác ở sảnh
      const unlockAudioAndStartBGM = () => {
        if (this.audio) {
          this.audio.init();
          this.audio.unlockAudioContext();
          if (this.audio.soundEnabled && !this.audio.zenMusicPlaying) {
            this.audio.startZenGuqin();
          }
        }
      };
      window.addEventListener("pointerdown", unlockAudioAndStartBGM);
      window.addEventListener("keydown", unlockAudioAndStartBGM);
      window.addEventListener("touchstart", unlockAudioAndStartBGM);
      window.addEventListener("click", unlockAudioAndStartBGM);

      // Tự động co giãn canvas và chuyển đổi bàn phím ảo khi thay đổi kích thước màn hình
      window.addEventListener("resize", () => {
        this.initCanvasSize();
        if (this.vKeyboard && this.gameState.currentScene === "BATTLE") {
          const D = root.Meowcha && root.Meowcha.Device;
          if (D && D.shouldShowVirtualKeyboard()) {
            this.vKeyboard.show();
          } else {
            this.vKeyboard.hide();
          }
        }
      });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.gameState.currentScene === 'BATTLE') {
          this.gameState.isPaused = true;
          if (this.ui.modalPause) this.ui.modalPause.style.display = 'flex';
          this.saveSystem.saveGame(this.gameState.activeSlotId, this.gameState);
          this.saveSystem.flushCloudSaves();
        }
      });
      window.addEventListener('online', () => {
        this.saveSystem.flushCloudSaves();
        this.saveSystem.retryPendingRuns();
      });
    }

    startBattle() {
      if (this.gameState.runFinished) this.gameState.resetRunMetrics();
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
      this.saveSystem.startRun(this.gameState);
      
      this.purgeAllBattleState();

      this.ui.showScene("BATTLE");
      this.ui.updateHUD();
      this.audio.init();
      this.audio.startZenGuqin();

      // Tự động hiển thị bàn phím ảo CHỈ KHI LÀ THIẾT BỊ DI ĐỘNG / TOUCH NATIVE
      const D = root.Meowcha && root.Meowcha.Device;
      if (this.vKeyboard && D && D.shouldShowVirtualKeyboard()) {
        this.vKeyboard.show();
      } else if (this.vKeyboard) {
        this.vKeyboard.hide();
      }

      this.gameState.setSpeech(`Sẵn sàng nghênh chiến ma thạch!`, 1600);

      // Sinh từ vựng đầu tiên
      setTimeout(() => this.spawnWord(), 400);
    }

    returnToLobby() {
      try {
        const activeSlot = (this.gameState && this.gameState.activeSlotId) || (this.saveSystem && this.saveSystem.getActiveSlotId()) || 1;
        const curMode = (this.gameState && this.gameState.gameMode) || "DIRECT";
        if (this.gameState && (this.gameState.isGameOver || this.gameState.hp <= 0)) {
          if (this.saveSystem) this.saveSystem.resetActiveSave(activeSlot, curMode);
          if (this.gameState) this.gameState.reset();
        } else if (this.saveSystem && this.gameState) {
          this.saveSystem.saveGame(activeSlot, this.gameState);
        }
        if (this.gameState) {
          this.gameState.currentScene = "LOBBY";
          this.gameState.isPaused = false;
          this.gameState.isGameOver = false;
          this.gameState.isStunned = false;
          this.gameState.setCatState("IDLE");
        }
        if (this.saveSystem && typeof this.saveSystem.flushCloudSaves === "function") {
          this.saveSystem.flushCloudSaves();
        }
        this.purgeAllBattleState();
      } catch (err) {
        console.warn("[Meowcha returnToLobby Safe Caught]", err);
      } finally {
        if (this.ui) {
          try { this.ui.hidePauseModal(); } catch (_) {}
          try { if (typeof this.ui.closeBattleSetupModal === "function") this.ui.closeBattleSetupModal(); } catch (_) {}
          try { if (typeof this.ui.hideGameOverModal === "function") this.ui.hideGameOverModal(); } catch (_) {}
          try { if (typeof this.ui.hidePantheonModal === "function") this.ui.hidePantheonModal(); } catch (_) {}
          try { if (typeof this.ui.hideSavesModal === "function") this.ui.hideSavesModal(); } catch (_) {}
          try { if (typeof this.ui.hideVocabVaultModal === "function") this.ui.hideVocabVaultModal(); } catch (_) {}
          try { this.ui.showScene("LOBBY"); } catch (_) {}
          try { if (typeof this.ui.updateLobbyButtons === "function") this.ui.updateLobbyButtons(); } catch (_) {}
          try { if (typeof this.ui.updateHUD === "function") this.ui.updateHUD(); } catch (_) {}
        }
        if (this.audio && this.audio.soundEnabled && !this.audio.zenMusicPlaying) {
          try { this.audio.startZenGuqin(); } catch (_) {}
        }
        if (this.vKeyboard) {
          try { this.vKeyboard.hide(); } catch (_) {}
        }
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
        this.ui.autoSubmitScoreToPantheon();
      }

      const activeSlot = (this.gameState && this.gameState.activeSlotId) || this.saveSystem.getActiveSlotId() || 1;
      const curMode = (this.gameState && this.gameState.gameMode) || "DIRECT";
      this.saveSystem.resetActiveSave(activeSlot, curMode);

      this.gameState.reset();
      this.gameState.gameMode = curMode;
      this.gameState.currentScene = "BATTLE";
      this.gameState.isPaused = false;
      this.gameState.revive();
      this.gameState.startTime = Date.now();
      this.saveSystem.startRun(this.gameState);

      this.purgeAllBattleState();

      this.ui.showScene("BATTLE");
      this.ui.updateHUD();
      this.audio.play("breakthrough");
      this.audio.startZenGuqin();

      const DRestart = root.Meowcha && root.Meowcha.Device;
      if (this.vKeyboard && DRestart && DRestart.shouldShowVirtualKeyboard()) {
        this.vKeyboard.show();
      } else if (this.vKeyboard) {
        this.vKeyboard.hide();
      }

      this.gameState.setSpeech("Trọng Sinh Quy Lai! Trùng Tu Kiếm Đạo!", 3500);
      this.floatingText.add(this.canvas.width / 2, this.canvas.height / 2 - 50, "[ 丹 ] TRỌNG SINH TRẬN MỚI!", "#38BDF8", 30);

      setTimeout(() => this.spawnWord(), 500);
    }

    spawnWord() {
      if (this.gameState.currentScene !== "BATTLE" || this.gameState.isGameOver || this.gameState.isPaused || this.gameState.catState === "BREAKTHROUGH") return;
      if (this.breakthrough && this.breakthrough.isBossEncounterActive) return;
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

      // Lấy từ vựng phù hợp từ kho (Hỗ trợ 4 Bộ Pháp Điển Tàng Kinh Các chuyên sâu)
      let sourceList = realmDecks[targetDeckIdx] || realmDecks[rIdx] || realmDecks[0] || [];
      const curDeckId = this.gameState.activeDeckId || "oxford_5000";
      if (curDeckId !== "oxford_5000" && M.TANG_KINH_DECKS) {
        const specializedDeck = M.TANG_KINH_DECKS.find(d => d.id === curDeckId);
        if (specializedDeck && specializedDeck.words && specializedDeck.words.length > 0) {
          sourceList = specializedDeck.words;
        }
      }
      if (curDeckId === 'flashcard_srs') {
        const due = this.saveSystem.getDueReviewWords();
        sourceList = due.length ? due : this.saveSystem.getWeaknessWords();
        if (!sourceList.length) {
          this.returnToLobby();
          this.ui.showStatus('Chưa có từ yếu. Hãy luyện một kinh quyển khác để ghi nhận từ cần ôn.');
          return;
        }
      }
      if (rIdx >= 4 && curDeckId === 'oxford_5000') {
        // Cảnh 4: Thần Cảnh Vô Cực - Ngẫu nhiên toàn bộ kho từ điển Oxford 5000
        const combined = [];
        Object.keys(realmDecks).forEach(k => {
          if (Array.isArray(realmDecks[k])) combined.push(...realmDecks[k]);
        });
        if (combined.length > 0) sourceList = combined;
      } else if (curDeckId === 'oxford_5000' && (rIdx === 3 || chosenType === "thunder")) {
        const combinedHigh = [];
        [2, 3].forEach(k => {
          if (Array.isArray(realmDecks[k])) combinedHigh.push(...realmDecks[k]);
        });
        if (combinedHigh.length > 0) sourceList = combinedHigh;
      }

      // Lọc danh sách theo chuẩn độ dài
      // CEFR/source deck selects difficulty; length only enforces playable alphabetic words.
      let matchedList = sourceList.filter(w => w && /^[a-z]{3,32}$/i.test(w.word));
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

      const weak = new Set(this.saveSystem.getWeaknessWords().map(w => String(w.word).toUpperCase()));
      const weight = Math.max(1, (this.gameState.passiveModifiers && this.gameState.passiveModifiers.weakWordWeight) || 1);
      const totalWeight = candidatePool.reduce((sum, w) => sum + (weak.has(String(w.word).toUpperCase()) ? weight : 1), 0);
      let cursor = Math.random() * totalWeight;
      let wordItem = candidatePool.find(w => (cursor -= weak.has(String(w.word).toUpperCase()) ? weight : 1) < 0);
      if (!wordItem) {
        // Fallback kiên cố nếu danh sách tạm thời rỗng để game không bao giờ bị dừng
        const fallbackWords = [
          { word: "PEACE", ipa: "/piːs/", meaning: "Hòa bình, thanh tịnh", type: "noun" },
          { word: "WISDOM", ipa: "/ˈwɪzdəm/", meaning: "Trí tuệ, thông thái", type: "noun" },
          { word: "COURAGE", ipa: "/ˈkʌrɪdʒ/", meaning: "Lòng dũng cảm", type: "noun" },
          { word: "CLARITY", ipa: "/ˈklærəti/", meaning: "Sự sáng suốt, rõ ràng", type: "noun" },
          { word: "SERENITY", ipa: "/səˈrenəti/", meaning: "Sự tĩnh lặng, thanh bình", type: "noun" }
        ];
        wordItem = fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
      }

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

      if (ast && this.typing.pendingAutoKill) {
        this.typing.pendingAutoKill = false;
        this.typing.handleWordSlain(ast, this.canvas, true);
        return;
      }

      // Trong chế độ Thính Lôi Biện Âm (AUDIO): Phát âm từ vựng ngay khi ma thạch xuất hiện!
      if (ast && ast.isAudio && this.typing) {
        setTimeout(() => {
          if (this.typing) this.typing.playWordAudio(ast);
        }, 150);
      }
    }

    gameLoop(now) {
      const elapsed = Math.max(0, (now - this.lastFrameTime) / 1000);
      const dt = Math.min(0.1, elapsed);
      this.lastFrameTime = now;
      // Physics may cap a long frame; human typing time must still count real active time.
      this.gameState.advanceClock(elapsed);

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
      this.gameState.calculateWPM();
      const DPlatform = root.Meowcha && root.Meowcha.Device;
      const isMobile = DPlatform ? DPlatform.info.isMobile : (this.canvas.width <= 768);
      const catTargetY = (typeof M.getBattleLayout === 'function') ? M.getBattleLayout(this.canvas).catY : (this.canvas ? this.canvas.height * 0.72 : 450);

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
      if (this.animator) this.animator.update(dt, this.gameState);
      this.cat.update(dt, this.gameState);
      if (this.gameState.updateSkills) this.gameState.updateSkills(dt);

      // Cập nhật ma thạch & kiểm tra chạm đáy (Trên mobile chạm ngay trên bệ đài của Miêu Tôn)
      const bottomThreshold = (typeof M.getBattleLayout === 'function') ? M.getBattleLayout(this.canvas).bottomThreshold : (this.canvas ? this.canvas.height * 0.70 : 420);
      const isLightningHazardNow = !!(this.typing && this.typing.isLightningHazard);
      const domainSlow = (this.gameState.activeSkillEffects && this.gameState.activeSkillEffects.windSwordTimer > 0)
        ? (this.gameState.activeSkillEffects.windSwordSlow || 0.4) : 0;
      this.asteroids.update(dt, bottomThreshold, (missedAst) => {
        if (!missedAst || missedAst.isBoss) return;
        if (this.saveSystem && !missedAst.isBoss) {
          this.saveSystem.recordWeaknessWord(missedAst);
        }
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

          const hurtQuotes = (root.Meowcha && root.Meowcha.HURT_SPEECHES) || [];
          if (hurtQuotes.length > 0) {
            const hq = hurtQuotes[Math.floor(Math.random() * hurtQuotes.length)];
            this.gameState.setSpeech(hq, 2200);
          }

          // Rung chấn màn hình êm dịu, không giật mạnh gây xé hình hay hoa mắt
          this.gameState.screenShake = Math.min(5.0, 2.5 + damage * 0.12);

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
      }, this.canvas.width, isLightningHazardNow, domainSlow);

      // Cập nhật phi kiếm
      this.projectiles.update(dt, (hitProj) => {
        this.particles.createHitSparks(hitProj.targetX, hitProj.targetY, hitProj.color, 6);
      });

      // Rung màn hình suy giảm cực nhanh (Screen Shake decay nhanh 45x dt)
      if (this.gameState.screenShake > 0) {
        this.gameState.screenShake = Math.max(0, this.gameState.screenShake - dt * 45);
      }

      // Cập nhật thanh HUD
      this.ui.updateHUD();

      // HUD luôn sắc nét, vững chãi, hai dock trái phải không che khuất ma thạch rơi chính giữa trời
      const hudEl = document.querySelector(".sect-scroll-hud");
      if (hudEl && hudEl.classList.contains("hud-dimmed")) {
        hudEl.classList.remove("hud-dimmed");
      }
    }

    draw() {
      if (!this.ctx) return;
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      // 1. Reset ma trận transform và xóa sạch toàn bộ khung hình canvas (Triệt tiêu 100% xé hình & bóng ma mép màn hình)
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);

      ctx.save();

      // Hiệu ứng rung màn hình êm dịu (tối đa 4.5px, làm tròn pixel)
      if (this.gameState.screenShake > 0) {
        const shakeMag = Math.min(4.5, this.gameState.screenShake);
        const sx = Math.round((Math.random() - 0.5) * shakeMag);
        const sy = Math.round((Math.random() - 0.5) * shakeMag);
        ctx.translate(sx, sy);
      }

      // 2. Nền trà viện thiền tịnh (Aspect-cover tràn viền vô cực kèm overscan 80px chống hở mép khi rung chấn)
      const overscan = 80;
      if (this.assets.bg.loaded) {
        const img = this.assets.bg.img;
        const targetW = w + overscan * 2;
        const targetH = h + overscan * 2;
        const imgRatio = img.width / img.height;
        const canvasRatio = targetW / targetH;
        let renderW, renderH, offsetX, offsetY;
        if (canvasRatio > imgRatio) {
          renderW = targetW;
          renderH = targetW / imgRatio;
          offsetX = -overscan;
          offsetY = -overscan + (targetH - renderH) / 2;
        } else {
          renderH = targetH;
          renderW = targetH * imgRatio;
          offsetX = -overscan + (targetW - renderW) / 2;
          offsetY = -overscan;
        }
        ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
      } else {
        ctx.fillStyle = "#1E120A";
        ctx.fillRect(-overscan, -overscan, w + overscan * 2, h + overscan * 2);
      }

      // Lớp phủ bóng mờ viền màn hình (Vignette)
      const grad = ctx.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, Math.max(w, h) / 1.4);
      grad.addColorStop(0, "rgba(0, 0, 0, 0.0)");
      grad.addColorStop(1, "rgba(10, 5, 2, 0.72)");
      ctx.fillStyle = grad;
      ctx.fillRect(-overscan, -overscan, w + overscan * 2, h + overscan * 2);

      // Viền phù văn góc cổ phong Trung Hoa
      this.realmVFX.drawRetroPixelVignette(ctx, w, h);

      if (this.gameState.currentScene === "BATTLE") {
        // 3. Vẽ Phi Kiếm
        this.projectiles.draw(ctx);

        // 4. Vẽ Ma Thạch & Cổ Phù Từ Vựng
        this.asteroids.draw(ctx, this.gameState.screenFlash);

        // 4.1 MÂY QUẤY RỐI TẦM NHÌN (Chỉ kích hoạt khi bị phạt Ma Vân Tụ Khí)
        if (this.realmVFX && this.realmVFX.isPunishCloud) {
          this.realmVFX.drawMysticClouds(ctx, w, h, true);
        }

        // 5. Vẽ Hạt hiệu ứng & VFX Clips
        this.particles.draw(ctx);
        if (this.animator) this.animator.drawVFXClips(ctx);

        // 6. Vẽ Nhân vật Mèo Tôn kèm Phi Kiếm & Sợi Tơ Kiếm Ý Khóa Mục Tiêu
        this.cat.draw(ctx, this.canvas, this.gameState, this.typing.currentTarget);

        // 7. Vẽ Chữ nổi Tu Vi & Sát thương
        this.floatingText.draw(ctx);

        // 8. TIA SÉT THIÊN KIẾP & CHỚP SÁNG MÀN HÌNH
        this.realmVFX.drawLightning(ctx, w, h, this.gameState.screenFlash);

        // 9. Bong bóng thoại Mèo Tôn (Neo sát trên đầu Mèo Tôn, tự động ẩn khi thiên thạch rơi gần để không che khuất)
        if (this.gameState.speechText && performance.now() < this.gameState.speechTimer) {
          const isMob = w <= 768 || (h > w);
          const catY = (this.cat && typeof this.cat.y === "number") ? this.cat.y : (isMob ? (h - 252) : (h - 200));
          const hasAsteroidNearCat = this.asteroids && this.asteroids.asteroids.some(a => a && Math.abs(a.y - catY) < 180);
          if (!hasAsteroidNearCat) {
            const speechY = Math.round(catY - 68);
            this.floatingText.drawSideSpeechBubble(ctx, w / 2, speechY, this.gameState.speechText);
          }
        }
      }

      ctx.restore();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  // Khởi động khi DOM sẵn sàng
  window.addEventListener("DOMContentLoaded", () => {
    window.MeowchaGameInstance = new MeowchaApp();
    root.Meowcha.app = window.MeowchaGameInstance;
    window.MeowchaGameInstance.init();
  });

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.App = MeowchaApp;
})(typeof window !== 'undefined' ? window : globalThis);
