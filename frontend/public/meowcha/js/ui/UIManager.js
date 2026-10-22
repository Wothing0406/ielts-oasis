/**
 * UIManager.js - Quản Lý Toàn Bộ Giao Diện & Hộp Thoại (HUD & Modals)
 * Điều khiển thanh HP đan điền, tu vi, đếm combo, modal Ngọc Giản, đột phá thiên phú và Phong Thần Bảng
 */
(function(root) {
  class UIManager {
    constructor(gameState, saveSystem, audioManager, onStartBattle, onReturnLobby, onRestartBattle, assets = null) {
      this.state = gameState;
      this.saveSystem = saveSystem;
      this.audio = audioManager;
      this.onStartBattle = onStartBattle;
      this.onReturnLobby = onReturnLobby;
      this.onRestartBattle = onRestartBattle;
      this.assets = assets;

      this.initDOMElements();
      this.bindEvents();
    }

    _safeGet(key, defVal = "") {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          const v = window.localStorage.getItem(key);
          return v !== null ? v : defVal;
        }
      } catch (_) {}
      return defVal;
    }

    _safeSet(key, val) {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(key, String(val));
        }
      } catch (_) {}
    }

    initDOMElements() {
      // Views
      this.lobbyView = document.getElementById("lobbyView");
      this.battleView = document.getElementById("battleView");

      // Lobby Elements
      this.lobbyScoreText = document.getElementById("lobbyScoreText");
      this.lobbyWordsText = document.getElementById("lobbyWordsText");
      this.lobbyHpText = document.getElementById("lobbyHpText");
      this.lobbyHpBar = document.getElementById("lobbyHpBar");
      this.lobbyWpmText = document.getElementById("lobbyWpmText");
      this.lobbyCatTitle = document.getElementById("lobbyCatTitle");
      this.lobbyLevelTag = document.getElementById("lobbyLevelTag");

      // HUD Elements
      this.hudLevelBadge = document.getElementById("hudLevelBadge");
      this.hudHpBar = document.getElementById("hudHpBar");
      this.hudHpText = document.getElementById("hudHpText");
      this.hudScore = document.getElementById("hudScore");
      this.hudWords = document.getElementById("hudWords");
      this.hudRealm = document.getElementById("hudRealm");
      this.hudCombo = document.getElementById("hudCombo");
      this.hudWpm = document.getElementById("hudWpm");
      this.statusBar = document.getElementById("meowchaStatusBar");
      this.swordIntentText = document.getElementById("swordIntentText");

      // Quick Talisman Buttons on Battle HUD
      this.btnQuickSaveHUD = document.getElementById("btnQuickSaveHUD");
      this.btnQuickRestartHUD = document.getElementById("btnQuickRestartHUD");

      // Modals
      this.modalSaves = document.getElementById("modalSaveSlots");
      this.modalBreakthrough = document.getElementById("modalBreakthrough");
      this.modalCertificate = document.getElementById("modalCertificate");
      this.certificateImgPreview = document.getElementById("certificateImgPreview");
      this.btnDownloadCertificate = document.getElementById("btnDownloadCertificate");
      this.btnCopyCertificateImg = document.getElementById("btnCopyCertificateImg");
      this.btnCopyShareLink = document.getElementById("btnCopyShareLink");
      this.btnCloseCertificate = document.getElementById("btnCloseCertificate");
      this.btnExportCertGameOver = document.getElementById("btnExportCertGameOver");
      this.btnOpenCertLobby = document.getElementById("btnOpenCertLobby");
      this.modalPause = document.getElementById("modalPause");
      this.modalGameOver = document.getElementById("modalGameOver");
      this.modalPantheon = document.getElementById("modalPantheon");
      this.modalProfile = document.getElementById("modalCultivatorProfile");
      this.modalVocabVault = document.getElementById("modalVocabVault");

      // Vocab Vault Modal Elements
      this.btnOpenVocabVault = document.getElementById("btnOpenVocabVault");
      this.btnCloseVocabVault = document.getElementById("btnCloseVocabVault");
      this.vaultSearchInput = document.getElementById("vaultSearchInput");
      this.btnVaultClearSearch = document.getElementById("btnVaultClearSearch");
      this.vaultTabsRow = document.getElementById("vaultTabsRow");
      this.vaultWordsGrid = document.getElementById("vaultWordsGrid");
      this.vaultStatsCounter = document.getElementById("vaultStatsCounter");
      this.btnVaultLoadMoreModal = document.getElementById("btnVaultLoadMoreModal");

      // Leaderboard Elements
      this.btnSubmitScorePantheon = document.getElementById("btnSubmitScorePantheon");
      this.modeSelectorRow = document.getElementById("modeSelectorRow");
      this.deckSelectorGrid = document.getElementById("deckSelectorGrid");
      this.pantheonPlayerSelfStats = document.getElementById("pantheonPlayerSelfStats");

      // State variables for Vocab Vault Modal
      this.currentVaultBand = 0;
      this.currentVaultPage = 1;
      this.currentVaultSearch = "";
      this.currentVaultWords = [];
      this.searchDebounceTimer = null;
    }

    bindEvents() {
      // Nút mở / đóng Kho Đan Dược
      if (this.btnExportCertGameOver) {
        this.btnExportCertGameOver.onclick = () => this.showCertificateModal();
      }
      if (this.btnOpenCertLobby) {
        this.btnOpenCertLobby.onclick = () => this.showCertificateModal();
      }
      if (this.btnCloseCertificate) {
        this.btnCloseCertificate.onclick = () => this.hideCertificateModal();
      }
      if (this.btnDownloadCertificate) {
        this.btnDownloadCertificate.onclick = () => this.downloadCertificatePNG();
      }
      if (this.btnCopyCertificateImg) {
        this.btnCopyCertificateImg.onclick = () => this.copyCertificatePNGToClipboard();
      }
      if (this.btnCopyShareLink) {
        this.btnCopyShareLink.onclick = () => this.copyShareLink();
      }

      if (this.btnOpenVocabVault) {
        this.btnOpenVocabVault.onclick = () => this.showVocabVaultModal();
      }
      if (this.btnCloseVocabVault) {
        this.btnCloseVocabVault.onclick = () => this.hideVocabVaultModal();
      }

      // Các tab cảnh giới trong Kho Đan Dược
      if (this.vaultTabsRow) {
        this.vaultTabsRow.querySelectorAll(".vault-tab-btn").forEach(btn => {
          btn.onclick = () => {
            const band = parseInt(btn.getAttribute("data-band"), 10);
            this.setVaultBand(band);
          };
        });
      }

      // Tìm kiếm từ vựng trong Kho Đan Dược với Debounce
      if (this.vaultSearchInput) {
        this.vaultSearchInput.oninput = () => {
          const val = this.vaultSearchInput.value;
          if (this.btnVaultClearSearch) {
            this.btnVaultClearSearch.style.display = val ? "block" : "none";
          }
          if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
          this.searchDebounceTimer = setTimeout(() => {
            this.currentVaultSearch = val;
            this.currentVaultPage = 1;
            this.loadVocabVaultData(true);
          }, 280);
        };
      }

      if (this.btnVaultClearSearch) {
        this.btnVaultClearSearch.onclick = () => {
          if (this.vaultSearchInput) this.vaultSearchInput.value = "";
          this.btnVaultClearSearch.style.display = "none";
          this.currentVaultSearch = "";
          this.currentVaultPage = 1;
          this.loadVocabVaultData(true);
        };
      }

      // Nút tải thêm từ vựng
      if (this.btnVaultLoadMoreModal) {
        this.btnVaultLoadMoreModal.onclick = () => {
          this.currentVaultPage++;
          this.loadVocabVaultData(false);
        };
      }

      // Nút Ghi Danh Chiến Tích vào Bảng Phong Thần
      if (this.btnSubmitScorePantheon) {
        this.btnSubmitScorePantheon.onclick = () => {
          this.submitScoreToPantheon();
        };
      }
      // Nút bắt đầu độ kiếp ở Lobby -> Mở Bảng Thiết Lập Chiến Trường
      const btnStart = document.getElementById("btnStartBattle");
      if (btnStart) {
        btnStart.onclick = () => {
          this.audio.play("chime");
          this.openBattleSetupModal();
        };
      }

      // Nút Chơi Tiếp (Continue theo đúng Pháp Môn đang chọn)
      const btnContinue = document.getElementById("btnContinueBattle");
      if (btnContinue) {
        btnContinue.onclick = () => {
          const curMode = (this.state && this.state.gameMode) || "DIRECT";
          const curSlotId = (this.state && this.state.activeSlotId) || (this.saveSystem && this.saveSystem.getActiveSlotId()) || 1;
          const modeData = this.saveSystem.getSlotModeData(curSlotId, curMode);
          if (modeData && modeData.isOccupied) {
            this.state.loadFromModeData(modeData, curMode);
          }
          this.audio.play("chime");
          this.updateHUD();
          this.showStatus(`[ 仙 ] [TIẾP TỤC TU LUYỆN] Đang nạp pháp môn ${curMode} (${(this.state.score || 0).toLocaleString()} Tu Vi)!`);
          if (this.onStartBattle) {
            this.onStartBattle();
          }
        };
      }

      // Nút Chơi Lại Từ Đầu ở Lobby (Tẩy Tủy riêng cho Pháp Môn đang chọn)
      const btnRestart = document.getElementById("btnRestartGame");
      if (btnRestart) {
        btnRestart.onclick = () => {
          const curMode = (this.state && this.state.gameMode) || "DIRECT";
          const modeLabels = {
            DIRECT: "Trực Diện Trảm Ma",
            CLOZE:  "Ngộ Đạo Thông Linh",
            AUDIO:  "Thính Lôi Biện Âm"
          };
          const modeName = modeLabels[curMode] || curMode;
          this.showConfirm(`TẨY TỦY PHÁP MÔN [${modeName.toUpperCase()}]?`, `Đạo hữu sẽ bắt đầu lại pháp môn ${modeName} từ Luyện Khí Kỳ 0 điểm. Kỷ lục tu vi vẫn được bảo lưu vinh danh Bảng Phong Thần.`, () => {
            const curSlotId = (this.state && this.state.activeSlotId) || (this.saveSystem && this.saveSystem.getActiveSlotId()) || 1;
            this.saveSystem.resetActiveSave(curSlotId, curMode);
            this.state.resetForNewMode(curMode);
            this.updateLobbyButtons();
            this.updateHUD();
            this.audio.play("chime");
            this.showStatus(`[ 丹 ] Đã tẩy tủy hoàn tất pháp môn ${modeName}! Khởi đầu từ Luyện Khí Kỳ.`);
          });
        };
      }

      // NÚT LƯU TIÊN CƠ NHANH TRÊN HUD [ 符 ]
      if (this.btnQuickSaveHUD) {
        this.btnQuickSaveHUD.onclick = () => {
          const activeSlot = (this.state && this.state.activeSlotId) || this.saveSystem.getActiveSlotId() || 1;
          this.saveSystem.saveGame(activeSlot, this.state);
          this.audio.play("chime");
          this.showStatus(`[ 符 ] [LƯU TIÊN CƠ] Đã lưu đạo quả tu vi vào Ngọc Giản ${activeSlot}!`);
        };
      }

      // NÚT TẨY TỦY / ĐỔI PHÁP MÔN NHANH TRÊN HUD [ 丹 ]
      if (this.btnQuickRestartHUD) {
        this.btnQuickRestartHUD.onclick = () => {
          this.audio.play("chime");
          this.openBattleSetupModal();
        };
      }

      // Nút Lưu Game trong hộp thoại Pause
      const btnSavePause = document.getElementById("btnSaveGameInPause");
      if (btnSavePause) {
        btnSavePause.onclick = () => {
          const activeSlot = (this.state && this.state.activeSlotId) || this.saveSystem.getActiveSlotId() || 1;
          this.saveSystem.saveGame(activeSlot, this.state);
          this.audio.play("chime");
          this.showStatus(`[ 符 ] [LƯU TIÊN CƠ] Đã khắc ghi đạo quả tu vi vào Ngọc Giản ${activeSlot}!`);
        };
      }

      // Nút Chơi Lại Từ Đầu trong hộp thoại Pause
      const btnRestartPause = document.getElementById("btnRestartInPause");
      if (btnRestartPause) {
        btnRestartPause.onclick = () => {
          this.showConfirm("TẨY TỦY TRỌNG SINH?", "Chiến tích cao nhất sẽ được khắc bia Bảng Phong Thần. Tiến trình tu luyện hiện tại sẽ bắt đầu lại từ đầu. Đạo hữu có chắc chắn?", () => {
            this.performPurificationRebirth(() => {
              this.hidePauseModal();
              this.audio.play("chime");
              this.showStatus("[ 丹 ] [TẨY TỦY TRỌNG SINH] Kỷ lục đã vinh danh Bảng Phong Thần! Đã khởi tạo lại đạo quả!");
              if (this.onReturnLobby) this.onReturnLobby();
            });
          });
        };
      }

      // Nút tiếp tục trong Modal Hồ Sơ Tu Chân Giả
      const btnProfileContinue = document.getElementById("btnProfileContinueBattle");
      if (btnProfileContinue) {
        btnProfileContinue.onclick = () => {
          this.hideProfileModal();
          if (this.onStartBattle) this.onStartBattle();
        };
      }

      // Nút đóng Modal Hồ Sơ Tu Chân Giả
      const btnProfileClose = document.getElementById("btnProfileCloseModal");
      if (btnProfileClose) {
        btnProfileClose.onclick = () => {
          this.hideProfileModal();
        };
      }

      // Nút mở Ngọc Giản ở Lobby
      const btnOpenSaves = document.getElementById("btnOpenSavesLobby");
      if (btnOpenSaves) {
        btnOpenSaves.onclick = () => this.showSavesModal();
      }

      // Nút đóng Ngọc Giản
      const btnCloseSaves = document.getElementById("btnCloseSaves");
      if (btnCloseSaves) {
        btnCloseSaves.onclick = () => this.hideSavesModal();
      }

      // Nút Phong Thần Bảng
      const btnOpenPantheon = document.getElementById("btnOpenPantheon");
      if (btnOpenPantheon) {
        btnOpenPantheon.onclick = () => this.showPantheonModal();
      }
      const btnClosePantheon = document.getElementById("btnClosePantheon");
      if (btnClosePantheon) {
        btnClosePantheon.onclick = () => this.hidePantheonModal();
      }

      // Nút Mở Tiên Đạo Ngọc Giản (Profile) từ Sảnh
      const btnOpenProfileLobby = document.getElementById("btnOpenProfileLobby");
      if (btnOpenProfileLobby) {
        btnOpenProfileLobby.onclick = () => {
          this.audio.play("chime");
          this.showProfileModal();
        };
      }

      // Nút Tạm Dừng trận chiến
      const btnPause = document.getElementById("btnPauseGame");
      if (btnPause) {
        btnPause.onclick = () => this.togglePause();
      }
      const btnResume = document.getElementById("btnResumeGame");
      if (btnResume) {
        btnResume.onclick = () => this.togglePause();
      }

      // Nút Rút lui về Lobby
      const btnExitLobby = document.getElementById("btnExitToLobby");
      if (btnExitLobby) {
        btnExitLobby.onclick = () => {
          this.hidePauseModal();
          if (this.onReturnLobby) this.onReturnLobby();
        };
      }

      // Nút Trọng Sinh Trận Mới (Game Over -> Chơi lại ngay lập tức sạch sẽ từ Cấp 0)
      const btnRebirth = document.getElementById("btnRebirth");
      if (btnRebirth) {
        btnRebirth.onclick = () => {
          const curSlotId = (this.state && this.state.activeSlotId) || (this.saveSystem && this.saveSystem.getActiveSlotId()) || 1;
          const curMode = (this.state && this.state.gameMode) || "DIRECT";
          this.saveSystem.resetActiveSave(curSlotId, curMode);
          this.state.resetForNewMode(curMode);
          this.hideGameOverModal();
          this.audio.play("chime");
          if (this.onRestartBattle) {
            this.onRestartBattle();
          } else if (this.onStartBattle) {
            this.onStartBattle();
          }
        };
      }

      // Nút Quy Về Tiên Sảnh (Game Over -> Trở về sảnh với trạng thái sạch đã tẩy tủy)
      const btnReturnLobbyGameOver = document.getElementById("btnReturnLobbyGameOver");
      if (btnReturnLobbyGameOver) {
        btnReturnLobbyGameOver.onclick = () => {
          const curSlotId = (this.state && this.state.activeSlotId) || (this.saveSystem && this.saveSystem.getActiveSlotId()) || 1;
          const curMode = (this.state && this.state.gameMode) || "DIRECT";
          this.saveSystem.resetActiveSave(curSlotId, curMode);
          this.state.reset();
          this.hideGameOverModal();
          this.audio.play("chime");
          if (this.onReturnLobby) this.onReturnLobby();
        };
      }

      // Nút Bật/Tắt Âm Thanh ở Sảnh & Trong Trận
      const btnToggleSound = document.getElementById("btnToggleSound");
      const btnToggleSoundLobby = document.getElementById("btnToggleSoundLobby");
      const soundStatusTextLobby = document.getElementById("soundStatusTextLobby");

      const updateSoundUI = (isOn) => {
        if (btnToggleSound) btnToggleSound.classList.toggle("muted", !isOn);
        if (btnToggleSoundLobby) btnToggleSoundLobby.classList.toggle("muted", !isOn);
        if (soundStatusTextLobby) soundStatusTextLobby.innerText = isOn ? "TIÊN NHẠC: BẬT" : "TIÊN NHẠC: TẮT";
      };

      if (btnToggleSoundLobby) {
        btnToggleSoundLobby.onclick = () => {
          if (this.audio) {
            this.audio.init();
            const isSoundOn = this.audio.toggleSound();
            updateSoundUI(isSoundOn);
            this.showStatus(isSoundOn ? "[ TIÊN NHẠC ] Đã khai mở khúc Cổ Cầm thiền định" : "[ TIÊN NHẠC ] Đã tĩnh âm");
          }
        };
      }
      if (btnToggleSound) {
        btnToggleSound.onclick = () => {
          if (this.audio) {
            this.audio.init();
            const isSoundOn = this.audio.toggleSound();
            updateSoundUI(isSoundOn);
            this.showStatus(isSoundOn ? "[ TIÊN NHẠC ] Đã khai mở khúc Cổ Cầm thiền định" : "[ TIÊN NHẠC ] Đã tĩnh âm");
          }
        };
      }

      // Chọn Chế Độ Tu Luyện (CLOZE, DIRECT, AUDIO)
      if (this.modeSelectorRow) {
        this.modeSelectorRow.querySelectorAll(".mode-pill-btn").forEach(btn => {
          btn.onclick = () => {
            const mode = btn.getAttribute("data-mode");
            this.selectGameMode(mode);
          };
        });
      }

      // Chọn Bộ Pháp Điển Tàng Kinh Các (oxford_5000, listening_1200, reading_academic, flashcard_srs)
      if (this.deckSelectorGrid) {
        this.deckSelectorGrid.querySelectorAll(".deck-card").forEach(card => {
          card.onclick = () => {
            const deckId = card.getAttribute("data-deck");
            this.selectDeck(deckId);
          };
        });
      }

      // Chọn Pháp Trận IELTS Band (0, 1, 2, 3)
      for (let i = 0; i < 4; i++) {
        const card = document.getElementById(`cardBand${i + 1}`);
        if (card) {
          card.onclick = () => this.selectBand(i);
        }
      }

      // Đồng bộ hiển thị Bộ Pháp Điển và Chế Độ Tu Luyện
      const s = this.state || {};
      if (this.modeSelectorRow) {
        const curMode = s.gameMode || "CLOZE";
        this.modeSelectorRow.querySelectorAll(".mode-pill-btn").forEach(btn => {
          btn.classList.toggle("active-mode", btn.getAttribute("data-mode") === curMode);
        });
      }
      if (this.deckSelectorGrid) {
        const curDeck = s.activeDeckId || "oxford_5000";
        this.deckSelectorGrid.querySelectorAll(".deck-card").forEach(card => {
          card.classList.toggle("active-deck", card.getAttribute("data-deck") === curDeck);
        });
      }

      this.updateMonolithLocks();
    }

    updateMonolithLocks() {
      const highestRealm = Math.max(this.state.realmIdx || 0, this.state.unlockedRealmIdx || 0);
      const realms = root.Meowcha.CULTIVATION_REALMS || [];

      for (let i = 1; i < 4; i++) {
        const realmData = realms[i] || { minScore: 1200 * i, title: "Cảnh Giới" };
        const card = document.getElementById(`cardBand${i + 1}`);
        const overlay = document.getElementById(`lockOverlayBand${i + 1}`);
        const isUnlocked = highestRealm >= i || this.state.score >= realmData.minScore;

        if (card) {
          card.classList.toggle("locked-monolith", !isUnlocked);
        }
        if (overlay) {
          overlay.style.display = isUnlocked ? "none" : "flex";
          const reqEl = overlay.querySelector(".lock-seal-req");
          if (reqEl) {
            reqEl.innerText = `Cần Đột Phá ${realmData.title} (${realmData.minScore.toLocaleString()} Tu Vi)`;
          }
        }
      }
    }

    selectGameMode(mode) {
      if (!mode) return;
      this.state.gameMode = mode;
      if (this.modeSelectorRow) {
        this.modeSelectorRow.querySelectorAll('.mode-pill-btn').forEach(btn => {
          btn.classList.toggle('active-mode', btn.getAttribute('data-mode') === mode);
        });
      }

      // NẠP TIẾN TRÌNH ĐỘC LẬP THEO PHÁP MÔN ĐANG CHỌN (TÁCH BIỆT TIẾN TRÌNH DIRECT / CLOZE / AUDIO)
      const currentSlotId = (this.state && this.state.activeSlotId) || (this.saveSystem && this.saveSystem.getActiveSlotId()) || 1;
      const modeData = this.saveSystem.getSlotModeData(currentSlotId, mode);

      if (modeData && modeData.isOccupied && modeData.hp > 0 && (modeData.score > 0 || modeData.realmIdx > 0 || modeData.words > 0)) {
        // Có ván dở dang của chế độ này -> Nạp đúng tiến trình của chế độ này
        this.state.loadFromModeData(modeData, mode);
      } else {
        // Chế độ này chưa chơi hoặc đã chết -> Bắt đầu mới từ Luyện Khí Kỳ 0 điểm
        this.state.resetForNewMode(mode);
      }

      this.updateLobbyButtons();
      this.updateHUD();

      const modeNames = {
        CLOZE: 'Ngộ Đạo Thông Linh (Active Recall)',
        DIRECT: 'Trực Diện Trảm Ma (Direct Typing)',
        AUDIO: 'Thính Lôi Biện Âm (Audio Dictation)'
      };
      if (this.audio) this.audio.play('chime');
      this.showStatus(`[ PHÁP MÔN ] Đã chuyển sang ${modeNames[mode] || mode}`);
    }

    updateLobbyStats() {
      this.updateHUD();
    }

    selectDeck(deckId) {
      if (!deckId) return;
      this.state.activeDeckId = deckId;
      if (this.deckSelectorGrid) {
        this.deckSelectorGrid.querySelectorAll('.deck-card').forEach(card => {
          card.classList.toggle('active-deck', card.getAttribute('data-deck') === deckId);
        });
      }
      const deckNames = {
        oxford_5000: 'Oxford 5000 Cốt Lõi',
        listening_1200: '1200 Thính Âm Listening',
        reading_academic: 'Cambridge Academic 7.5+',
        flashcard_srs: 'Tái Hiện SRS Sổ Tay Tôi Luyện'
      };
      if (this.audio) this.audio.play('chime');
      this.showStatus(`[ TÀNG KINH CÁC ] Đã chọn ${deckNames[deckId] || deckId}`);
    }

    openBattleSetupModal() {
      const modal = document.getElementById("modalBattleSetup");
      if (!modal) return;

      const curSlotId = (this.state && this.state.activeSlotId) || (this.saveSystem && this.saveSystem.getActiveSlotId()) || 1;
      let selectedMode = (this.state && this.state.gameMode) || "CLOZE";
      let selectedDeck = (this.state && this.state.activeDeckId) || "oxford_5000";

      const updateSetupUI = () => {
        // Highlight mode cards
        modal.querySelectorAll(".setup-mode-card").forEach(card => {
          card.classList.toggle("active-mode", card.getAttribute("data-mode") === selectedMode);
        });

        // Highlight deck cards
        modal.querySelectorAll(".setup-deck-card").forEach(card => {
          card.classList.toggle("active-deck", card.getAttribute("data-deck") === selectedDeck);
        });

        // Kiểm tra xem slot hiện tại đã có dữ liệu lưu của pháp môn này chưa
        const modeData = this.saveSystem && this.saveSystem.getSlotModeData && this.saveSystem.getSlotModeData(curSlotId, selectedMode);
        const hasProgress = Boolean(modeData && modeData.isOccupied && modeData.hp > 0 && (modeData.score > 0 || modeData.realmIdx > 0 || modeData.words > 0));

        const detailEl = document.getElementById("setupJourneyDetail");
        const actionsRow = document.getElementById("setupActionsRow");

        const modeLabels = {
          CLOZE: "Ngộ Đạo Thông Linh",
          DIRECT: "Trực Diện Trảm Ma",
          AUDIO: "Thính Lôi Biện Âm"
        };
        const mName = modeLabels[selectedMode] || selectedMode;

        const leftMascotSvg = `
          <div class="setup-mascot-flank left" title="Linh Miêu Phù Lục • Hộ Pháp Trận Đồ" aria-hidden="true">
            <svg width="46" height="44" viewBox="0 0 48 46" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Gối mây nhỏ dưới chân -->
              <ellipse cx="22" cy="40" rx="16" ry="4.5" fill="#140F0B" stroke="#F3C644" stroke-width="1.2"/>
              <!-- Thân mèo Matcha ngồi cầm bùa -->
              <ellipse cx="21" cy="29" rx="11" ry="10" fill="#2DE28D" stroke="#065F46" stroke-width="1.5"/>
              <polygon points="12,21 15,12 19,19" fill="#2DE28D" stroke="#065F46" stroke-width="1.3"/>
              <polygon points="23,19 27,12 30,21" fill="#2DE28D" stroke="#065F46" stroke-width="1.3"/>
              <!-- Nón lá / khăn đạo sĩ nhỏ -->
              <path d="M13 18 Q21 13 29 18" stroke="#F3C644" stroke-width="2" stroke-linecap="round"/>
              <!-- Mắt long lanh & má hồng -->
              <circle cx="17.5" cy="25" r="1.6" fill="#064E3B"/>
              <circle cx="24.5" cy="25" r="1.6" fill="#064E3B"/>
              <circle cx="14.5" cy="27.5" r="1.6" fill="#F472B6" opacity="0.75"/>
              <circle cx="27.5" cy="27.5" r="1.6" fill="#F472B6" opacity="0.75"/>
              <!-- Лаpa giơ lá bùa Hoàng Chỉ Chu Sa -->
              <rect x="31" y="14" width="11" height="18" rx="1.5" transform="rotate(8 31 14)" fill="#F3C644" stroke="#D44327" stroke-width="1.4"/>
              <line x1="36" y1="18" x2="35" y2="28" stroke="#D44327" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </div>
        `;

        const rightMascotSvg = `
          <div class="setup-mascot-flank right" title="Trà Đạo Trưởng Lão • Chưởng Môn Hộ Đạo" aria-hidden="true">
            <svg width="46" height="44" viewBox="0 0 48 46" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Gối bồ đoàn dưới chân -->
              <ellipse cx="26" cy="40" rx="16" ry="4.5" fill="#231912" stroke="#F3C644" stroke-width="1.2"/>
              <!-- Áo choàng đạo bào lục bảo -->
              <path d="M14 39 C14 26 38 26 38 39 Z" fill="#168553" stroke="#F3C644" stroke-width="1.4"/>
              <!-- Đầu mèo trắng râu dài đội nón trúc -->
              <ellipse cx="26" cy="24" rx="10" ry="8.5" fill="#FEF3C7" stroke="#78350F" stroke-width="1.4"/>
              <!-- Nón đấu lạp trúc -->
              <polygon points="10,19 26,9 42,19" fill="#A16207" stroke="#F3C644" stroke-width="1.4"/>
              <!-- Mắt hiền từ & râu bạc -->
              <path d="M21 23 Q23 21.5 24.5 23" stroke="#140F0B" stroke-width="1.4" stroke-linecap="round"/>
              <path d="M27.5 23 Q29 21.5 31 23" stroke="#140F0B" stroke-width="1.4" stroke-linecap="round"/>
              <path d="M22 27 Q26 32 30 27" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none"/>
              <!-- Chén trà nóng bốc khói trên tay -->
              <rect x="7" y="27" width="8" height="6" rx="1.5" fill="#2DE28D" stroke="#F3C644" stroke-width="1.2"/>
              <path d="M11 25 C9 22 13 20 11 17" stroke="#6EE7B7" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
          </div>
        `;

        if (hasProgress) {
          if (detailEl) {
            detailEl.innerHTML = `<span style="color:#2DE28D">Đang Lưu Đạo Quả:</span> Cảnh Giới: <b>${modeData.realm || 'Luyện Khí Kỳ'}</b> • <b>${(modeData.score || 0).toLocaleString()} Tu Vi</b> • Trảm: <b>${modeData.words || 0}</b>`;
          }
          if (actionsRow) {
            actionsRow.innerHTML = `
              ${leftMascotSvg}
              <div class="setup-dual-btns-wrap">
                <button class="sword-token-btn continue-green" id="btnSetupContinue">
                  <div class="sword-token-hilt">
                    <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                      <polygon points="2,14 6,10 10,14 6,18" fill="#168553" stroke="#F3C644" stroke-width="1.3"/>
                      <rect x="10" y="12" width="8" height="4" fill="#064E3B" stroke="#F3C644" stroke-width="1.2"/>
                      <path d="M18 5 L24 14 L18 23 L16 18 L18 14 L16 10 Z" fill="#2DE28D" stroke="#F3C644" stroke-width="1.3"/>
                    </svg>
                  </div>
                  <div class="sword-token-content">
                    <span class="sword-token-main" style="color: #6EE7B7">TIẾP TỤC TU LUYỆN</span>
                    <span class="sword-token-sub">${(modeData.score || 0).toLocaleString()} Tu Vi • ${modeData.realm || 'Luyện Khí Kỳ'}</span>
                  </div>
                  <div class="sword-token-tip">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" stroke-width="2.5"><polygon points="4 4 20 12 4 20 7 12" fill="rgba(45,226,141,0.3)"></polygon></svg>
                  </div>
                </button>
                <button class="sword-token-btn restart-crimson" id="btnSetupRestart">
                  <div class="sword-token-hilt">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F3C644" stroke-width="2.2"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                  </div>
                  <div class="sword-token-content">
                    <span class="sword-token-main" style="color: #FCA5A5">TẨY TỦY TRÙNG TU</span>
                    <span class="sword-token-sub">Chơi lại từ Cấp 0</span>
                  </div>
                </button>
              </div>
              ${rightMascotSvg}
            `;

            document.getElementById("btnSetupContinue").onclick = () => {
              this.state.gameMode = selectedMode;
              this.state.activeDeckId = selectedDeck;
              this.state.loadFromModeData(modeData, selectedMode);
              this.closeBattleSetupModal();
              this.updateLobbyButtons();
              this.updateHUD();
              this.audio.play("chime");
              this.showStatus(`TIẾP TỤC TU LUYỆN • Pháp môn ${mName} • ${(this.state.score || 0).toLocaleString()} Tu Vi!`);
              if (this.onStartBattle) this.onStartBattle();
            };

            document.getElementById("btnSetupRestart").onclick = () => {
              this.showConfirm(`TẨY TỦY PHÁP MÔN [${mName.toUpperCase()}]?`, `Đạo hữu sẽ khởi đầu lại pháp môn ${mName} từ Luyện Khí Kỳ 0 điểm. Kỷ lục tu vi cũ vẫn được lưu danh Bảng Phong Thần.`, () => {
                this.state.gameMode = selectedMode;
                this.state.activeDeckId = selectedDeck;
                this.saveSystem.resetActiveSave(curSlotId, selectedMode);
                this.state.resetForNewMode(selectedMode);
                this.closeBattleSetupModal();
                this.updateLobbyButtons();
                this.updateHUD();
                this.audio.play("slash");
                this.showStatus(`TẨY TỦY TRỌNG SINH • Bắt đầu ván mới pháp môn ${mName} từ Cấp 0!`);
                if (this.onStartBattle) this.onStartBattle();
              });
            };
          }
        } else {
          if (detailEl) {
            detailEl.innerHTML = `<span style="color:#F3C644">Khởi Nguyên Tu Vi:</span> Chưa có dữ liệu • Khởi đầu từ <b>Luyện Khí Kỳ (Cấp 0 - 0 Điểm)</b>`;
          }
          if (actionsRow) {
            actionsRow.innerHTML = `
              ${leftMascotSvg}
              <button class="sword-token-btn launch-flame" id="btnSetupStartFresh">
                <div class="sword-token-glow"></div>
                <div class="sword-token-hilt">
                  <svg class="sword-pommel-svg" width="30" height="30" viewBox="0 0 36 36" fill="none">
                    <path d="M5 18 C2 23 3 29 6 33" stroke="#D44327" stroke-width="2" stroke-linecap="round"/>
                    <polygon points="2,18 6,13 10,18 6,23" fill="#D44327" stroke="#F3C644" stroke-width="1.4"/>
                    <rect x="10" y="15" width="10" height="6" rx="1" fill="#231912" stroke="#F3C644" stroke-width="1.3"/>
                    <path d="M20 5 L28 18 L20 31 L17 25 L21 18 L17 11 Z" fill="#F3C644" stroke="#78350F" stroke-width="1.4"/>
                    <circle cx="23" cy="18" r="2.2" fill="#2DE28D"/>
                  </svg>
                </div>
                <div class="sword-token-content">
                  <div class="sword-token-title-row">
                    <span class="sword-token-main">BẮT ĐẦU ĐỘ KIẾP NGAY</span>
                    <span class="sword-token-mode-tag">(${mName.toUpperCase()})</span>
                  </div>
                  <span class="sword-token-sub">[ 剑 ] Lệnh Bài Trảm Ma • Xuất Kiếm Khai Chiến [ 战 ]</span>
                </div>
                <div class="sword-token-tip">
                  <svg class="molten-fire-svg animated-pulse" width="26" height="26" viewBox="0 0 28 28" fill="none">
                    <polygon points="2,6 26,14 2,22 7,14" fill="#F3C644" stroke="#FEF08A" stroke-width="1.5"/>
                    <line x1="6" y1="14" x2="22" y2="14" stroke="#D44327" stroke-width="2"/>
                  </svg>
                </div>
              </button>
              ${rightMascotSvg}
            `;

            document.getElementById("btnSetupStartFresh").onclick = () => {
              this.state.gameMode = selectedMode;
              this.state.activeDeckId = selectedDeck;
              this.state.resetForNewMode(selectedMode);
              this.closeBattleSetupModal();
              this.updateLobbyButtons();
              this.updateHUD();
              this.audio.play("slash");
              this.showStatus(`KHỞI NGUYÊN ĐỘ KIẾP • Pháp môn ${mName}!`);
              if (this.onStartBattle) this.onStartBattle();
            };
          }
        }
      };

      // Gắn sự kiện chọn Pháp Môn
      modal.querySelectorAll(".setup-mode-card").forEach(card => {
        card.onclick = () => {
          selectedMode = card.getAttribute("data-mode");
          this.audio.play("chime");
          updateSetupUI();
        };
      });

      // Gắn sự kiện chọn Tàng Kinh Các
      modal.querySelectorAll(".setup-deck-card").forEach(card => {
        card.onclick = () => {
          selectedDeck = card.getAttribute("data-deck");
          this.audio.play("chime");
          updateSetupUI();
        };
      });

      // Gắn sự kiện đóng modal
      const btnClose = document.getElementById("btnCloseBattleSetup");
      if (btnClose) {
        btnClose.onclick = () => this.closeBattleSetupModal();
      }

      updateSetupUI();
      modal.style.display = "flex";
      this.audio.play("chime");
    }

    closeBattleSetupModal() {
      const modal = document.getElementById("modalBattleSetup");
      if (modal) modal.style.display = "none";
    }

    selectBand(bandIdx) {
      const highestRealm = Math.max(this.state.realmIdx || 0, this.state.unlockedRealmIdx || 0);
      const realms = root.Meowcha.CULTIVATION_REALMS || [];
      const realmData = realms[bandIdx] || { minScore: 0, title: "Luyện Khí" };

      const isUnlocked = bandIdx === 0 || highestRealm >= bandIdx || this.state.score >= realmData.minScore;

      if (!isUnlocked) {
        const card = document.getElementById(`cardBand${bandIdx + 1}`);
        if (card) {
          card.classList.remove("shake-locked");
          void card.offsetWidth; // Trigger DOM reflow
          card.classList.add("shake-locked");
          setTimeout(() => card.classList.remove("shake-locked"), 500);
        }
        this.audio.play("hurt");
        this.showStatus(`[ 封 ] [PHONG ẤN THẦN XÍCH] Đạo hữu chưa độ kiếp cảnh giới này! Hãy tu luyện từ Luyện Khí Kỳ để rèn căn cơ.`);
        return;
      }

      this.state.selectedBandIdx = bandIdx;
      for (let i = 0; i < 4; i++) {
        const card = document.getElementById(`cardBand${i + 1}`);
        if (card) {
          card.classList.toggle("active-monolith", i === bandIdx);
        }
      }
      this.audio.play("chime");
      this.showStatus(`[ PHÁP TRẬN ] Đã chọn ${realmData.title}`);
    }

    showStatus(msg, durationMs = 2800) {
      if (!this.statusBar) return;
      this.statusBar.innerText = msg;
      this.statusBar.classList.remove("show");
      void this.statusBar.offsetWidth; // Reflow
      this.statusBar.classList.add("show");

      if (this.statusTimer) clearTimeout(this.statusTimer);
      this.statusTimer = setTimeout(() => {
        if (this.statusBar) this.statusBar.classList.remove("show");
      }, durationMs);
    }

    updateHUD() {
      const s = this.state;
      const realms = root.Meowcha.CULTIVATION_REALMS || [];
      const realmData = realms[s.realmIdx] || realms[0];

      // Máu Đan Điền
      if (this.hudHpBar) {
        const pct = Math.max(0, Math.min(100, (s.hp / s.maxHp) * 100));
        this.hudHpBar.style.width = `${pct}%`;
      }
      if (this.hudHpText) {
        this.hudHpText.innerText = `${s.hp} / ${s.maxHp} HP`;
      }

      // Điểm Tu Vi & Từ đã trảm
      if (this.hudScore) this.hudScore.innerText = s.score.toLocaleString();
      if (this.hudWords) this.hudWords.innerText = s.wordsSlain;

      // Danh hiệu Cảnh Giới & Cấp Độ
      if (this.hudLevelBadge) {
        this.hudLevelBadge.innerText = `CẤP ${s.realmIdx}`;
      }
      if (this.hudRealm) {
        this.hudRealm.innerText = realmData.title;
        this.hudRealm.style.color = realmData.color;
      }

      // Combo chuỗi
      if (this.hudCombo) {
        this.hudCombo.innerText = s.combo > 1 ? `Combo x${s.combo}` : "";
      }

      // Tốc độ WPM
      if (this.hudWpm) {
        this.hudWpm.innerText = `${s.wpm} WPM`;
      }

      // Cập nhật thông số Sảnh Thiền Định (Tầng 2: Mini Jade HP Bar, Tu Vi, Cổ Ngữ, WPM)
      if (this.lobbyScoreText) this.lobbyScoreText.innerText = s.score.toLocaleString();
      const lobbyHighScoreEl = document.getElementById("lobbyHighScoreText");
      if (lobbyHighScoreEl) {
        const best = Math.max(s.highScore || 0, s.score || 0);
        lobbyHighScoreEl.innerText = `Kỷ Lục: ${best.toLocaleString()} pts`;
      }
      if (this.lobbyWordsText) this.lobbyWordsText.innerText = `${s.wordsSlain} Từ`;
      if (this.lobbyHpText) this.lobbyHpText.innerText = `${s.hp} / ${s.maxHp}`;
      if (this.lobbyHpBar) {
        const hpPct = Math.max(0, Math.min(100, (s.hp / (s.maxHp || 50)) * 100));
        this.lobbyHpBar.style.width = `${hpPct}%`;
      }
      if (this.lobbyWpmText) this.lobbyWpmText.innerText = `${Math.round(s.wpm || 0)} WPM`;
      if (this.lobbyCatTitle) this.lobbyCatTitle.innerText = realmData.title;
      if (this.lobbyLevelTag) this.lobbyLevelTag.innerText = `CẤP ${s.realmIdx}`;

      const lobbyCatImg = document.getElementById("lobbyCatImg");
      if (lobbyCatImg) {
        const avatars = [
          "./sprites/characters/realm0_qi_refining/poses/idle.png",
          "./sprites/characters/realm1_foundation/poses/idle.png",
          "./sprites/characters/realm2_golden_core/poses/idle.png",
          "./sprites/characters/realm3_nascent_soul/poses/idle.png",
          "./sprites/characters/realm4_tribulation/poses/idle.png"
        ];
        const rIdx = Math.max(0, Math.min(4, parseInt(s.realmIdx, 10) || 0));
        const targetSrc = avatars[rIdx] || avatars[0];
        lobbyCatImg.referrerPolicy = "no-referrer";
        lobbyCatImg.onerror = () => {
          lobbyCatImg.onerror = null;
          lobbyCatImg.src = "./sprites/characters/realm0_qi_refining/poses/idle.png";
        };
        if (lobbyCatImg.getAttribute("src") !== targetSrc) {
          lobbyCatImg.src = targetSrc;
        }
      }

      // Cập nhật huy hiệu Tu Chân Giả trên dải Tiên Đạo sảnh chính
      const user = this.getLoggedInUser();
      const topAvatarEl = document.getElementById("lobbyUserAvatar");
      const topNameLabel = document.getElementById("lobbyUserNameLabel");
      if (topAvatarEl) {
        topAvatarEl.referrerPolicy = "no-referrer";
        topAvatarEl.onerror = () => {
          topAvatarEl.onerror = null;
          topAvatarEl.src = "./sprites/characters/realm0_qi_refining/poses/idle.png";
        };
        topAvatarEl.src = user.avatar || "./sprites/characters/realm0_qi_refining/poses/idle.png";
      }
      if (topNameLabel && user.isLoggedIn && user.name) {
        topNameLabel.innerText = user.name.slice(0, 8);
      }

      this.updateMonolithLocks();
      this.updateLobbyButtons();
    }

    updateLobbyButtons() {
      const btnStart = document.getElementById("btnStartBattle");
      const btnContinue = document.getElementById("btnContinueBattle");
      const btnRestart = document.getElementById("btnRestartGame");
      const continueSub = document.getElementById("continueBattleSub");
      const startBtnText = btnStart ? (btnStart.querySelector(".sword-cta-main") || btnStart.querySelector(".btn-xianxia-text") || btnStart.querySelector(".cta-title") || btnStart) : null;

      const curMode = (this.state && this.state.gameMode) || "DIRECT";
      const curSlotId = (this.state && this.state.activeSlotId) || (this.saveSystem && this.saveSystem.getActiveSlotId()) || 1;
      const modeData = this.saveSystem && this.saveSystem.getSlotModeData && this.saveSystem.getSlotModeData(curSlotId, curMode);

      const hasModeProgress = Boolean(modeData && modeData.isOccupied && modeData.hp > 0 && (modeData.score > 0 || modeData.realmIdx > 0 || modeData.words > 0));

      const modeLabels = {
        DIRECT: "Trực Diện Trảm Ma",
        CLOZE:  "Ngộ Đạo Thông Linh",
        AUDIO:  "Thính Lôi Biện Âm"
      };
      const modeName = modeLabels[curMode] || curMode;

      const startBtnSub = document.getElementById("startBattleSub") || (btnStart ? btnStart.querySelector(".sword-cta-sub") : null);

      if (hasModeProgress) {
        if (btnContinue) {
          btnContinue.style.display = "flex";
          if (continueSub) {
            continueSub.innerText = `[ ${modeName}: ${(modeData.score || 0).toLocaleString()} Tu Vi • ${modeData.realm || 'Luyện Khí Kỳ'} ]`;
          }
        }
        if (btnRestart) {
          btnRestart.style.display = "inline-flex";
        }
        if (btnStart) {
          btnStart.style.display = "flex";
          if (startBtnText && startBtnText !== btnStart) {
            startBtnText.innerText = "TRỌNG TU PHÁP MÔN";
          }
          if (startBtnSub) {
            startBtnSub.innerText = `[ Đổi Pháp Môn / Tàng Kinh Các (${modeName}) ]`;
          }
        }
      } else {
        if (btnContinue) btnContinue.style.display = "none";
        if (btnRestart) btnRestart.style.display = "none";
        if (btnStart) {
          btnStart.style.display = "flex";
          if (startBtnText && startBtnText !== btnStart) {
            startBtnText.innerText = "VÀO TRẬN ĐỘ KIẾP";
          }
          if (startBtnSub) {
            startBtnSub.innerText = `[ Pháp Môn: ${modeName} • Chạm để khai mở trận đồ ]`;
          }
        }
      }
    }

    showScene(scene) {
      this.state.currentScene = scene;
      if (this.lobbyView && this.battleView) {
        if (scene === "LOBBY") {
          this.lobbyView.style.display = "flex";
          this.battleView.style.display = "none";
        } else {
          this.lobbyView.style.display = "none";
          this.battleView.style.display = "block";
        }
      }
      this.updateHUD();
    }

    showSavesModal() {
      if (!this.modalSaves) return;
      this.renderSaveSlotsUI();
      this.modalSaves.style.display = "flex";
    }

    hideSavesModal() {
      if (this.modalSaves) this.modalSaves.style.display = "none";
    }

    renderSaveSlotsUI() {
      const container = document.getElementById("saveSlotsList");
      if (!container) return;

      const slots = this.saveSystem.getAllSlots();
      const currentActiveSlot = (this.state && this.state.activeSlotId) || this.saveSystem.getActiveSlotId() || 1;
      const inBattle = this.state.currentScene === "BATTLE";
      container.innerHTML = "";

      for (let i = 1; i <= 3; i++) {
        const slot = slots[i];
        const isActive = (i === currentActiveSlot);
        const card = document.createElement("div");
        card.className = `save-slot-card ${slot.isOccupied ? "occupied" : "empty"} ${isActive ? "active-slot-selected" : ""}`;

        if (slot.isOccupied) {
          const realmLabel = slot.title || slot.realm || slot.realmTitle || 'Luyện Khí Kỳ';
          const wordsLabel = slot.words !== undefined ? slot.words : (slot.wordsSlain || 0);
          const badgeHtml = isActive
            ? `<span class="slot-badge slot-badge-active"><svg width="11" height="11" viewBox="0 0 24 24" fill="#FDE047" stroke="#FDE047" stroke-width="1" style="vertical-align: middle; margin-right: 2px;"><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/></svg> ĐANG CHỌN</span>`
            : `<span class="slot-badge slot-badge-idle">ĐÃ LƯU</span>`;

          let actionButtons = "";
          if (isActive) {
            if (inBattle) {
              actionButtons = `
                <button class="btn-slot-save" data-slot="${i}" title="Lưu lại tiến trình hiện tại vào cuộn trục này">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                  LƯU TIẾN TRÌNH
                </button>
                <button class="btn-slot-del" data-slot="${i}" title="Giải trừ cuộn trục"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" fill="#F87171" fill-opacity="0.12"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
              `;
            } else {
              actionButtons = `
                <button class="btn-slot-load" data-slot="${i}" title="Tiếp tục tu luyện với cuộn trục này">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  TIẾP TỤC
                </button>
                <button class="btn-slot-del" data-slot="${i}" title="Giải trừ cuộn trục"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" fill="#F87171" fill-opacity="0.12"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
              `;
            }
          } else {
            actionButtons = `
              <button class="btn-slot-load" data-slot="${i}" title="Chuyển sang cuộn trục này để tu luyện">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                CHỌN & NẠP LẠI
              </button>
              <button class="btn-slot-del" data-slot="${i}" title="Giải trừ cuộn trục"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" fill="#F87171" fill-opacity="0.12"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
            `;
          }

          card.innerHTML = `
            <div class="slot-header">
              <span class="slot-title">${slot.slotName} ${badgeHtml}</span>
              <span class="slot-date">${slot.dateStr}</span>
            </div>
            <div class="slot-body">
              <div class="slot-realm">Cảnh giới: <strong>${realmLabel}</strong></div>
              <div class="slot-stats">Tu vi: <b>${(slot.score || 0).toLocaleString()}</b> • Trảm: <b>${wordsLabel}</b> từ</div>
            </div>
            <div class="slot-actions">
              ${actionButtons}
            </div>
          `;
        } else {
          // Slot trống
          const badgeHtml = isActive
            ? `<span class="slot-badge slot-badge-selected"><svg width="11" height="11" viewBox="0 0 24 24" fill="#FDE047" stroke="#FDE047" stroke-width="1" style="vertical-align: middle; margin-right: 2px;"><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/></svg> ĐANG CHỌN</span>`
            : `<span class="slot-badge slot-badge-empty">TRỐNG</span>`;

          let actionButtons = "";
          if (inBattle) {
            actionButtons = `<span class="slot-empty-notice" style="font-size: 11px; color: #94A3B8;">(Đang trong trận đấu của cuộn trục khác)</span>`;
          } else {
            actionButtons = `
              <button class="btn-slot-new" data-slot="${i}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="margin-right: 4px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                KHỞI ĐẦU MỚI TẠI ĐÂY
              </button>
            `;
          }

          card.innerHTML = `
            <div class="slot-header">
              <span class="slot-title">${slot.slotName} ${badgeHtml}</span>
              <span class="slot-date">Chưa ghi chép</span>
            </div>
            <div class="slot-body">
              <div class="slot-empty-desc">Cuộn trục trống trải, sẵn sàng khai tông lập phái độc lập</div>
            </div>
            <div class="slot-actions">
              ${actionButtons}
            </div>
          `;
        }

        container.appendChild(card);
      }

      // Bind events for save slots
      container.querySelectorAll(".btn-slot-save").forEach(btn => {
        btn.onclick = (e) => {
          const slotId = parseInt(btn.getAttribute("data-slot"), 10);
          this.state.activeSlotId = slotId;
          this.saveSystem.setActiveSlotId(slotId);
          this.saveSystem.saveGame(slotId, this.state);
          this.renderSaveSlotsUI();
          this.updateHUD();
          this.updateLobbyButtons();
          this.audio.play("chime");
          this.showStatus(`[ NGỌC GIẢN ] Đã khắc ghi thành công vào Cuộn Trục ${slotId}`);
          this.showProfileModal(`ĐÃ LƯU ĐẠO QUẢ VÀO NGỌC GIẢN ${slotId}`);
        };
      });

      container.querySelectorAll(".btn-slot-load").forEach(btn => {
        btn.onclick = (e) => {
          const slotId = parseInt(btn.getAttribute("data-slot"), 10);
          const slot = this.saveSystem.getSlot(slotId);
          if (slot && slot.isOccupied) {
            // Nếu đang trong trận đấu khác mà còn sống, lưu lại slot cũ trước
            if (this.state.currentScene === "BATTLE" && this.state.hp > 0 && !this.state.isGameOver) {
              const prevActive = (this.state && this.state.activeSlotId) || this.saveSystem.getActiveSlotId() || 1;
              this.saveSystem.saveGame(prevActive, this.state);
            }
            this.state.loadFromSlot(slot);
            this.state.activeSlotId = slotId;
            this.saveSystem.setActiveSlotId(slotId);
            this.hideSavesModal();
            this.updateHUD();
            this.updateLobbyButtons();
            this.audio.play("chime");
            this.showStatus(`[ NGỌC GIẢN ] Đã phục hồi Đạo QuẢ từ Cuộn Trục ${slotId}`);
            this.showProfileModal(`ĐẠO QUẢ NGỌC GIẢN ${slotId}`);
          }
        };
      });

      container.querySelectorAll(".btn-slot-new").forEach(btn => {
        btn.onclick = (e) => {
          const slotId = parseInt(btn.getAttribute("data-slot"), 10);
          this.state.reset();
          this.state.activeSlotId = slotId;
          this.saveSystem.setActiveSlotId(slotId);
          this.saveSystem.saveGame(slotId, this.state);
          this.renderSaveSlotsUI();
          this.updateHUD();
          this.updateLobbyButtons();
          this.audio.play("chime");
          this.showStatus(`[ NGỌC GIẢN ] Đã khởi tạo hành trình mới độc lập tại Ngọc Giản ${slotId}!`);
        };
      });

      container.querySelectorAll(".btn-slot-del").forEach(btn => {
        btn.onclick = (e) => {
          const slotId = parseInt(btn.getAttribute("data-slot"), 10);
          this.showConfirm(
            "GIẢI TRỪ TIÊN CƠ?",
            `Đạo hữu có chắc chắn muốn giải trừ dữ liệu lưu trữ tại Ngọc Giản ${slotId}?`,
            () => {
              this.saveSystem.deleteSlot(slotId);
              const currentActive = (this.state && this.state.activeSlotId) || this.saveSystem.getActiveSlotId() || 1;
              if (currentActive === slotId) {
                this.state.reset();
                const nextActive = this.saveSystem.hasActiveSave();
                if (nextActive) {
                  this.saveSystem.setActiveSlotId(nextActive.slotId);
                  this.state.loadFromSlot(nextActive);
                } else {
                  this.saveSystem.setActiveSlotId(1);
                  this.state.activeSlotId = 1;
                }
              }
              this.renderSaveSlotsUI();
              this.updateHUD();
              this.updateLobbyButtons();
              this.showStatus(`[ GIẢI TRỪ ] Đã xóa dữ liệu Ngọc Giản ${slotId}`);
            },
            "GIỮ LẠI",
            "GIẢI TRỪ"
          );
        };
      });
    }

    showTalentModal(talents, targetRealm, onSelect) {
      if (!this.modalBreakthrough) return;
      const cardsContainer = document.getElementById("breakthroughTalentsList");
      const titleEl = document.getElementById("breakthroughRealmTitle");

      if (titleEl) {
        titleEl.innerText = `ĐỘT PHÁ THÀNH CÔNG: ${targetRealm.name}!`;
        titleEl.style.color = targetRealm.color;
      }

      if (cardsContainer) {
        cardsContainer.innerHTML = "";
        talents.forEach((talent, idx) => {
          const card = document.createElement("div");
          card.className = "perk-card talent-card animate-card-pop";
          card.style.animationDelay = `${idx * 150}ms`;

          card.innerHTML = `
            <div class="perk-icon-wrapper">
              <div class="perk-icon-seal">${talent.icon}</div>
            </div>
            <div class="perk-name">${talent.name}</div>
            <div class="perk-type">[ ${talent.type} ]</div>
            <div class="perk-desc">${talent.desc}</div>
            <button class="btn-linh-ngo" type="button">
              LĨNH NGỘ [ Phím ${idx + 1} ]
            </button>
          `;

          card.onclick = () => {
            this.hideTalentModal();
            if (onSelect) onSelect(talent);
          };

          cardsContainer.appendChild(card);
        });
      }

      this.modalBreakthrough.style.display = "flex";

      // Hỗ trợ phím tắt 1, 2, 3
      const keyHandler = (e) => {
        const keyNum = parseInt(e.key, 10);
        if (keyNum >= 1 && keyNum <= talents.length) {
          window.removeEventListener("keydown", keyHandler);
          this.hideTalentModal();
          if (onSelect) onSelect(talents[keyNum - 1]);
        }
      };
      window.addEventListener("keydown", keyHandler, { once: true });
    }

    hideTalentModal() {
      if (this.modalBreakthrough) this.modalBreakthrough.style.display = "none";
    }

    togglePause() {
      this.state.isPaused = !this.state.isPaused;
      if (this.modalPause) {
        this.modalPause.style.display = this.state.isPaused ? "flex" : "none";
      }
    }

    hidePauseModal() {
      this.state.isPaused = false;
      if (this.modalPause) this.modalPause.style.display = "none";
    }

    
    showCertificateModal() {
      if (!this.modalCertificate) return;
      this.modalCertificate.style.display = "flex";
      if (this.audio) this.audio.play("chime");

      try {
        const dataUrl = this.generateCertificateCanvas();
        if (this.certificateImgPreview && dataUrl) {
          this.certificateImgPreview.src = dataUrl;
        }
      } catch (err) {
        console.warn("[UIManager] Lỗi render preview Chứng Đạo Kim Đồ:", err);
      }
    }

    hideCertificateModal() {
      if (this.modalCertificate) this.modalCertificate.style.display = "none";
    }

    downloadCertificatePNG() {
      const dataUrl = this.generateCertificateCanvas();
      if (!dataUrl) return;

      let downloaded = false;
      try {
        const parts = dataUrl.split(',');
        const mime = parts[0].match(/:(.*?);/)[1];
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `Chung_Dao_Kim_Do_Cap${(this.state && this.state.realmIdx) || 0}.png`;
        document.body.appendChild(a);
        a.click();
        downloaded = true;
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        }, 1200);
      } catch (err) {
        console.warn("[UIManager] Direct download prevented by browser sandbox:", err);
      }

      // Nếu bị sandbox chặn download thẻ a, mở sang tab mới để user nhấp chuột phải / nhấn giữ lưu ảnh
      if (!downloaded) {
        try {
          const win = window.open();
          if (win) {
            win.document.write(`<title>Chứng Đạo Kim Đồ</title><body style="margin:0;background:#05040a;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;"><img src="${dataUrl}" style="max-width:96vw;max-height:90vh;border-radius:12px;box-shadow:0 0 35px rgba(245,158,11,0.6);" /><p style="color:#FEF08A;font-family:sans-serif;font-size:14px;background:rgba(0,0,0,0.8);padding:8px 18px;border-radius:20px;margin-top:12px;">Nhấp chuột phải hoặc nhấn giữ ảnh để Lưu Ảnh Về Máy (Save Image)</p></body>`);
          }
        } catch (_) {}
      }

      this.showStatus("[ 符 ] Đã xuất Chứng Đạo Kim Đồ! Đạo hữu có thể Lưu hoặc Sao Chép Ảnh.");
    }

    async copyCertificatePNGToClipboard() {
      const dataUrl = this.generateCertificateCanvas();
      if (!dataUrl) return;
      try {
        const parts = dataUrl.split(',');
        const mime = parts[0].match(/:(.*?);/)[1];
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: 'image/png' });
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          this.showStatus("[ 符 ] ĐÃ SAO CHÉP ẢNH VÀO CLIPBOARD! Hãy dán (Ctrl+V) vào Zalo / Facebook / Discord!");
        } else {
          this.showStatus("[ 符 ] Trình duyệt chưa hỗ trợ sao chép ảnh, hãy nhấn Tải Ảnh hoặc nhấn giữ ảnh để lưu.");
        }
      } catch (err) {
        console.warn("[Certificate] Copy error:", err);
        this.showStatus("[ 符 ] Đạo hữu hãy nhấp chuột phải / nhấn giữ vào ảnh trên để Sao Chép hoặc Lưu Ảnh.");
      }
    }

    copyShareLink() {
      const shareUrl = `${window.location.origin}/games/meowcha?score=${this.state.score}&realm=${this.state.realmIdx}&wpm=${Math.round(this.state.wpm || 0)}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          this.showStatus("[ 符 ] Đã sao chép liên kết tỷ thí vào khay nhớ tạm!");
        }).catch(() => {
          this.showStatus(`Liên kết tỷ thí: ${shareUrl}`);
        });
      } else {
        this.showStatus(`Liên kết tỷ thí: ${shareUrl}`);
      }
    }

    generateCertificateCanvas() {
      const c = document.createElement("canvas");
      c.width = 1200;
      c.height = 630;
      const ctx = c.getContext("2d");
      if (!ctx) return "";

      const s = this.state || {};
      const realms = (root && root.Meowcha && root.Meowcha.CULTIVATION_REALMS) || [];

      const user = this.getLoggedInUser();
      const userName = (user && user.name && user.name.trim()) ? user.name.trim() : "Tiểu Miêu Kiếm Sĩ";
      
      // Lấy điểm kỷ lục cao nhất (High Score) làm thước đo Chứng Đạo
      const personalBest = Math.max(
        Number(s.highScore || 0),
        Number(s.score || 0),
        Number(this._safeGet("meowcha_high_score", 0))
      );

      // Phân định cảnh giới theo điểm kỷ lục cao nhất
      let certRealmIdx = Math.max(0, s.realmIdx || 0);
      for (let i = realms.length - 1; i >= 0; i--) {
        if (personalBest >= realms[i].minScore) {
          certRealmIdx = Math.max(certRealmIdx, i);
          break;
        }
      }
      const realmData = realms[certRealmIdx] || realms[0] || { title: "Tiểu Miêu Kiếm Đồng", name: "Luyện Khí Kỳ", color: "#FDE047" };
      const rIdx = certRealmIdx;

      const modeNames = {
        CLOZE: 'Điền khuyết (Active Recall)',
        DIRECT: 'Gõ trực tiếp (Direct Typing)',
        AUDIO: 'Nghe chính tả (Audio Dictation)'
      };
      const curMode = s.gameMode || "DIRECT";
      const modeLabel = modeNames[curMode] || curMode;

      // 1. Nền lụa tiên đạo thâm thúy
      const grad = ctx.createRadialGradient(600, 315, 80, 600, 315, 680);
      grad.addColorStop(0, "#0F172A");
      grad.addColorStop(0.7, "#090D16");
      grad.addColorStop(1, "#020408");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 630);

      // Hạt linh khí vàng kim lấp lánh
      for (let i = 0; i < 48; i++) {
        const sx = Math.sin(i * 99) * 580 + 600;
        const sy = Math.cos(i * 77) * 290 + 315;
        const sr = (i % 3) + 1.2;
        ctx.fillStyle = i % 2 === 0 ? "rgba(253, 224, 71, 0.45)" : "rgba(56, 189, 248, 0.35)";
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Viền đôi Hoàng Kim & Chu Sa cổ phong
      ctx.strokeStyle = "rgba(212, 175, 55, 0.85)";
      ctx.lineWidth = 4;
      ctx.strokeRect(28, 28, 1144, 574);
      ctx.strokeStyle = "rgba(239, 68, 68, 0.55)";
      ctx.lineWidth = 1.8;
      ctx.strokeRect(38, 38, 1124, 554);

      // 4 Phù Ấn Tứ Chính tại 4 góc
      ctx.fillStyle = "#FDE047";
      ctx.font = "700 16px 'Cinzel', serif";
      ctx.fillText("[ 乾 ]", 48, 62);
      ctx.fillText("[ 坤 ]", 1115, 62);
      ctx.fillText("[ 坎 ]", 48, 578);
      ctx.fillText("[ 离 ]", 1115, 578);

      // 3. Tiêu đề Chứng Đạo Kim Đồ
      ctx.textAlign = "center";
      ctx.font = "900 15px 'Cinzel', sans-serif";
      ctx.fillStyle = "#94A3B8";
      ctx.fillText("MEOW-CHA • LUYỆN TỪ VỰNG IELTS", 600, 76);

      ctx.font = "900 36px 'Cinzel', serif";
      ctx.fillStyle = "#FDE047";
      ctx.shadowColor = "rgba(245, 158, 11, 0.75)";
      ctx.shadowBlur = 18;
      ctx.fillText("CHỨNG ĐẠO KIM ĐỒ", 600, 122);
      ctx.shadowBlur = 0;

      // 4. KHỐI BÊN TRÁI: ĐẠO QUẢ MIÊU TIÊN THẦN THÚ PIXEL ART THỰC TẾ (REAL CHARACTER ASSET)
      const cx = 250, cy = 345;
      ctx.save();

      // Vòng Bát Quái Tiên Luân phát sáng
      ctx.strokeStyle = "rgba(253, 224, 71, 0.65)";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = realmData.color || "#F59E0B";
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(cx, cy, 130, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 142, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Đài sen thần tiên
      ctx.fillStyle = "rgba(16, 185, 129, 0.35)";
      ctx.strokeStyle = "#34D399";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 95, 95, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // VẼ ASSET NHÂN VẬT THỰC TẾ (REAL CHARACTER SPRITE ASSET)
      const catAsset = (this.assets && (this.assets[`char_r${rIdx}_ultimate`]?.img || this.assets[`char_r${rIdx}_idle`]?.img))
        || document.getElementById("lobbyCatImg");
      const swordAsset = this.assets && this.assets[`char_r${rIdx}_sword`]?.img;

      if (catAsset && (catAsset.complete || catAsset.naturalWidth > 0)) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.shadowColor = realmData.color || "#FDE047";
        ctx.shadowBlur = 22;
        ctx.drawImage(catAsset, cx - 105, cy - 105, 210, 210);
        ctx.restore();
      } else {
        // Fallback chibi nếu ảnh chưa kịp nạp
        ctx.fillStyle = "#F8FAFC";
        ctx.beginPath();
        ctx.arc(cx, cy, 70, 0, Math.PI * 2);
        ctx.fill();
      }

      // Vẽ phi kiếm đồng hành bên cạnh miêu tiên
      if (swordAsset && (swordAsset.complete || swordAsset.naturalWidth > 0)) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.shadowColor = "#FDE047";
        ctx.shadowBlur = 16;
        ctx.drawImage(swordAsset, cx + 80, cy - 85, 45, 75);
        ctx.restore();
      }

      ctx.restore();

      // 5. KHỐI BÊN PHẢI: BẢNG CHIẾN TÍCH TU CHÂN & VINH DANH TIÊN HỮU
      ctx.textAlign = "left";

      // TÊN TIÊN HỮU / ĐẠO HIỆU
      ctx.font = "900 28px 'Cinzel', serif";
      ctx.fillStyle = "#FDE047";
      ctx.shadowColor = "rgba(245, 158, 11, 0.8)";
      ctx.shadowBlur = 10;
      ctx.fillText(`TIÊN HỮU: ${userName.toUpperCase()}`, 470, 195);
      ctx.shadowBlur = 0;

      // CẢNH GIỚI & PHÁP MÔN
      ctx.font = "700 16px 'Be Vietnam Pro', sans-serif";
      ctx.fillStyle = "#38BDF8";
      ctx.fillText(`CẢNH GIỚI: ${realmData.name.toUpperCase()} (CẤP ${rIdx}) • ${realmData.title}`, 470, 228);

      ctx.font = "600 13px 'Be Vietnam Pro', sans-serif";
      ctx.fillStyle = "#A78BFA";
      ctx.fillText(`CHẾ ĐỘ: ${modeLabel}`, 470, 252);

      // Lưới thông số (Stats grid: 4 ô) - Rõ ràng, khiêm tốn, đúng công năng
      const stats = [
        { label: "ĐIỂM KỶ LỤC (CAO NHẤT)", val: `${personalBest.toLocaleString()} PTS`, color: "#FDE047" },
        { label: "ĐIỂM VÁN HIỆN TẠI", val: `${(s.score || 0).toLocaleString()} PTS`, color: "#34D399" },
        { label: "TỔNG TỪ ĐÃ HOÀN THÀNH", val: `${Math.max(s.wordsSlain || 0, Math.round(personalBest / 160))} TỪ`, color: "#38BDF8" },
        { label: "TỐC ĐỘ GÕ PHÍM", val: `${Math.round(s.wpm || 0)} WPM (COMBO x${s.maxCombo || s.combo || 1})`, color: "#F472B6" }
      ];

      stats.forEach((st, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const bx = 470 + col * 320;
        const by = 278 + row * 85;

        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, 305, 72, 8);
        else ctx.rect(bx, by, 305, 72);
        ctx.fill();
        ctx.stroke();

        ctx.font = "700 11.5px 'Be Vietnam Pro', sans-serif";
        ctx.fillStyle = "#94A3B8";
        ctx.fillText(st.label, bx + 16, by + 27);

        ctx.font = "900 22px 'Cinzel', serif";
        ctx.fillStyle = st.color;
        ctx.fillText(st.val, bx + 16, by + 56);
      });

      // Lời nhắn nhủ mộc mạc
      ctx.font = "italic 13.5px 'Be Vietnam Pro', sans-serif";
      ctx.fillStyle = "#E2E8F0";
      ctx.fillText("“Mỗi ngày tích lũy từ vựng, rèn luyện phản xạ ngôn ngữ vững chắc.”", 470, 482);

      // Dấu Triện Chu Sa [ CHỨNG NHẬN ĐẠO QUẢ ]
      ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
      ctx.strokeStyle = "#EF4444";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(470, 510, 240, 44, 5);
      else ctx.rect(470, 510, 240, 44);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.font = "900 13.5px 'Cinzel', serif";
      ctx.fillStyle = "#F87171";
      ctx.fillText("[ CHỨNG NHẬN ĐẠO QUẢ ]", 590, 537);
      ctx.fillStyle = "#EF4444";
      ctx.fillText("[ 极 品 ] TIÊN ĐẠO CHỨNG ĐẠO", 590, 537);

      // Link trang web
      ctx.textAlign = "right";
      ctx.font = "600 12px 'Cinzel', sans-serif";
      ctx.fillStyle = "#64748B";
      ctx.fillText("ieltsoasis.site/games/meowcha", 1115, 540);

      try {
        return c.toDataURL("image/png");
      } catch (exportErr) {
        console.warn("[Certificate] toDataURL error:", exportErr);
        return "";
      }
    }

    showGameOverModal() {
      if (!this.modalGameOver) return;
      const finalScoreEl = document.getElementById("gameOverFinalScore");
      const finalHighScoreEl = document.getElementById("gameOverHighScore");
      const finalWordsEl = document.getElementById("gameOverFinalWords");
      const finalRealmEl = document.getElementById("gameOverFinalRealm");
      const finalWpmEl   = document.getElementById("gameOverFinalWpm");

      const realms = (root && root.Meowcha && root.Meowcha.CULTIVATION_REALMS) || [];
      const realmData = realms[this.state.realmIdx] || realms[0];

      const bestScore = Math.max(this.state.highScore || 0, this.state.score || 0);
      if (finalScoreEl) finalScoreEl.innerText = this.state.score.toLocaleString();
      if (finalHighScoreEl) finalHighScoreEl.innerText = bestScore.toLocaleString();
      if (finalWordsEl) finalWordsEl.innerText = this.state.wordsSlain;
      if (finalRealmEl) finalRealmEl.innerText = realmData ? realmData.title : "Luyện Khí Kỳ";
      if (finalWpmEl)   finalWpmEl.innerText   = Math.round(this.state.wpm || 0);

      this.modalGameOver.style.display = "flex";

      // Tự động truyền chiến tích của user login lên Bảng Phong Thần
      this.autoSubmitScoreToPantheon();

      // Trigger entrance animation
      const box = this.modalGameOver.querySelector(".modal-content-box");
      if (box) {
        box.style.animation = "none";
        box.offsetHeight; // reflow
        box.style.animation = "";
      }
      this.audio.play("defeat");
    }

    hideGameOverModal() {
      if (this.modalGameOver) this.modalGameOver.style.display = "none";
    }

    showConfirm(title, message, onConfirm, cancelText = "TĨNH TÂM TIẾP TỤC", acceptText = "CHẤP THUẬN QUYẾT ĐỊNH") {
      const modal = document.getElementById("exitConfirmModal");
      if (!modal) {
        if (typeof onConfirm === "function") onConfirm();
        return;
      }

      const titleEl = document.getElementById("confirmModalTitle");
      const msgEl = document.getElementById("confirmModalMsg");
      const btnAccept = document.getElementById("btnConfirmAccept");
      const btnCancel = document.getElementById("btnConfirmCancel");
      const acceptTextEl = document.getElementById("confirmAcceptText");
      const cancelTextEl = document.getElementById("confirmCancelText");

      if (titleEl) titleEl.innerText = title;
      if (msgEl) msgEl.innerText = message;
      if (acceptTextEl) acceptTextEl.innerText = acceptText;
      if (cancelTextEl) cancelTextEl.innerText = cancelText;

      modal.style.display = "flex";

      const cleanup = () => {
        modal.style.display = "none";
        if (btnCancel) btnCancel.onclick = null;
        if (btnAccept) btnAccept.onclick = null;
      };

      if (btnCancel) {
        btnCancel.onclick = (e) => {
          e.stopPropagation();
          cleanup();
        };
      }

      if (btnAccept) {
        btnAccept.onclick = (e) => {
          e.stopPropagation();
          cleanup();
          if (typeof onConfirm === "function") onConfirm();
        };
      }
    }

    /* =========================================================================
       KHO ĐAN DƯỢC TỪ VỰNG OXFORD 5000 (VOCAB VAULT MODAL LOGIC)
       ========================================================================= */
    showVocabVaultModal() {
      if (!this.modalVocabVault) return;
      this.modalVocabVault.style.display = "flex";
      this.currentVaultPage = 1;
      this.loadVocabVaultData(true);
    }

    hideVocabVaultModal() {
      if (this.modalVocabVault) this.modalVocabVault.style.display = "none";
    }

    setVaultBand(bandIdx) {
      this.currentVaultBand = bandIdx;
      this.currentVaultPage = 1;
      if (this.vaultTabsRow) {
        this.vaultTabsRow.querySelectorAll(".vault-tab-btn").forEach(btn => {
          const b = parseInt(btn.getAttribute("data-band"), 10);
          btn.classList.toggle("active", b === bandIdx);
        });
      }
      this.loadVocabVaultData(true);
    }

    async loadVocabVaultData(reset = false) {
      if (!this.vaultWordsGrid) return;
      if (reset) {
        this.currentVaultWords = [];
        this.vaultWordsGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #FDE68A;">
            <div style="margin-bottom: 8px;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FDE047" stroke-width="2" style="animation: baguaSpin 3s linear infinite;">
                <circle cx="12" cy="12" r="10" stroke-dasharray="4 2"></circle>
                <path d="M12 2v20M2 12h20"></path>
              </svg>
            </div>
            <div style="font-family: var(--font-xianxia-title); font-size: 13px;">Đang triệu hồi đan dược từ kho Oxford 5000...</div>
          </div>
        `;
      }

      try {
        const loader = root.Meowcha && root.Meowcha.VocabLoader;
        if (!loader) throw new Error("VocabLoader chưa sẵn sàng");

        const res = await loader.searchVocab({
          band: this.currentVaultBand,
          search: this.currentVaultSearch,
          page: this.currentVaultPage,
          pageSize: 20
        });

        if (reset) {
          this.currentVaultWords = res.words || [];
        } else {
          this.currentVaultWords = this.currentVaultWords.concat(res.words || []);
        }

        this.renderVocabCards(this.currentVaultWords);

        if (this.vaultStatsCounter) {
          const totalStr = res.total ? Number(res.total).toLocaleString("vi-VN") : this.currentVaultWords.length;
          this.vaultStatsCounter.innerText = `Đang hiển thị ${this.currentVaultWords.length} / ${totalStr} Đan Dược`;
        }

        if (this.btnVaultLoadMoreModal) {
          this.btnVaultLoadMoreModal.style.display = res.hasMore ? "inline-flex" : "none";
        }
      } catch (err) {
        console.warn("[UIManager] Lỗi load Vocab Vault:", err);
        if (reset) {
          this.vaultWordsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: #FCA5A5;">
              <div>[ 警 ] Không thể tải từ vựng từ tiên giới. Đang kích hoạt đan dược dự phòng.</div>
            </div>
          `;
        }
      }
    }

    renderVocabCards(words) {
      if (!this.vaultWordsGrid) return;
      if (!words || words.length === 0) {
        this.vaultWordsGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #FDE68A; opacity: 0.8;">
            <div style="margin-bottom: 6px;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FDE047" stroke-width="1.8">
                <path d="M19 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"></path>
                <path d="M9 7h6M9 11h6M9 15h4"></path>
              </svg>
            </div>
            <div>Không tìm thấy đan dược nào phù hợp với từ khóa!</div>
          </div>
        `;
        return;
      }

      const bandClasses = ["frost", "fire", "void", "thunder"];
      const currentClass = bandClasses[this.currentVaultBand] || "frost";

      this.vaultWordsGrid.innerHTML = words.map(item => `
        <div class="vocab-card">
          <div class="vocab-card-header">
            <span class="vocab-word-title ${currentClass}">${item.word}</span>
            <span class="vocab-type-badge">${item.type || 'vocab'}</span>
          </div>
          <div class="vocab-card-body">
            <span class="vocab-ipa-text">${item.ipa || '/.../'}</span>
            <button class="btn-pronounce-speaker" data-word="${item.word}" data-audio="${item.audio_url || ''}" title="Nghe phát âm chuẩn Oxford">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            </button>
          </div>
          <div class="vocab-meaning-text" title="${item.meaning || ''}">
            ${item.meaning || 'Ý nghĩa đang ngưng tụ'}
          </div>
        </div>
      `).join("");

      // Bind click phát âm loa
      this.vaultWordsGrid.querySelectorAll(".btn-pronounce-speaker").forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const word = btn.getAttribute("data-word");
          const audioUrl = btn.getAttribute("data-audio");
          this.speakWord(word, audioUrl);
        };
      });
    }

    speakWord(word, audioUrl) {
      if (audioUrl && audioUrl.trim()) {
        try {
          const snd = new Audio(audioUrl.trim());
          snd.volume = 0.9;
          const p = snd.play();
          if (p !== undefined) {
            p.catch(() => this._synthSpeak(word));
            return;
          }
        } catch (_) {}
      }
      this._synthSpeak(word);
    }

    _synthSpeak(word) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(word);
          utterance.lang = "en-US";
          utterance.rate = 0.88;
          window.speechSynthesis.speak(utterance);
        } catch (_) {}
      }
    }

    /* =========================================================================
       BẢNG PHONG THẦN TIÊN GIỚI (PANTHEON LEADERBOARD LOGIC & AUTO SYNC)
       ========================================================================= */
    getLoggedInUser() {
      let rawUser = null;
      let token = "";
      let localName = this._safeGet("meowcha_player_name", "Tiểu Miêu Kiếm Sĩ");

      // 1. Đọc từ URL Search Params (truyền qua iframe an toàn nhất)
      if (typeof window !== "undefined" && window.location && window.location.search) {
        try {
          const sp = new URLSearchParams(window.location.search);
          const urlToken = sp.get("token");
          const urlUser = sp.get("user");
          if (urlToken) token = urlToken;
          if (urlUser) {
            try {
              let decoded = urlUser;
              if (decoded.startsWith("%7B") || decoded.includes("%22")) {
                decoded = decodeURIComponent(decoded);
              }
              rawUser = decoded;
            } catch (_) {
              rawUser = urlUser;
            }
          }
        } catch (_) {}
      }

      // 2. Đọc từ LocalStorage nếu chưa có
      if (!rawUser || !token) {
        try {
          rawUser = rawUser || this._safeGet("oasis_user", null);
          token = token || this._safeGet("oasis_token", "");
        } catch (_) {}
      }

      // 3. Đọc từ parent window nếu iframe cho phép
      if (!rawUser && typeof window !== "undefined" && window.parent && window.parent !== window) {
        try {
          rawUser = window.parent.localStorage.getItem("oasis_user");
          token = token || window.parent.localStorage.getItem("oasis_token") || "";
        } catch (crossErr) {}
      }

      if (rawUser) {
        try {
          const u = (typeof rawUser === "string") ? JSON.parse(rawUser) : rawUser;
          const name = u.full_name || u.name || u.username || (u.email ? u.email.split("@")[0] : "");
          let avatar = u.discord_avatar || u.avatar_url || u.avatar || u.image || "";
          if (avatar && !avatar.startsWith("http") && !avatar.startsWith("./") && !avatar.startsWith("/")) {
            if (u.discord_id) {
              avatar = `https://cdn.discordapp.com/avatars/${u.discord_id}/${avatar}.png`;
            }
          }
          return {
            name: name || localName,
            avatar: avatar || "./sprites/characters/realm0_qi_refining/poses/idle.png",
            token: token || "",
            isLoggedIn: true
          };
        } catch (_) {}
      }

      return {
        name: localName,
        avatar: "./sprites/characters/realm0_qi_refining/poses/idle.png",
        token: token,
        isLoggedIn: false
      };
    }

    /**
     * Tẩy Tủy Trọng Sinh: Bảo lưu điểm cao nhất & tự động vinh danh Bảng Phong Thần
     * trước khi xóa bỏ tiến trình trận đấu cũ để bắt đầu kiếp tu luyện mới.
     */
    performPurificationRebirth(onComplete) {
      const currentRunScore = Number(this.state.score || 0);
      const currentHighScore = Number(this.state.highScore || 0);
      const bestScore = Math.max(currentRunScore, currentHighScore);

      if (bestScore > currentHighScore) {
        this.state.highScore = bestScore;
        try {
          this._safeSet("meowcha_high_score", String(bestScore));
        } catch (e) {}
      }

      // Khắc bia lên Bảng Phong Thần ngay lập tức
      if (bestScore > 0) {
        this.autoSubmitScoreToPantheon(bestScore);
      }

      // Đặt lại các chỉ số ván đấu về Luyện Khí Kỳ, giữ vĩnh viễn High Score
      const activeSlot = (this.state && this.state.activeSlotId) || this.saveSystem.getActiveSlotId() || 1;
      this.saveSystem.resetActiveSave(activeSlot);
      this.state.revive();
      this.state.score = 0;
      this.state.wordsSlain = 0;
      this.state.realmIdx = 0;
      this.state.combo = 0;
      this.state.maxCombo = 0;
      this.state.talents = { hpBonus: 0, slowFactor: 1.0, critChance: 0.0, scoreMultiplier: 1.0, shieldCharges: 0, autoKill: false, typoImmune: false };
      this.state.highScore = bestScore;
      this.state.activeSlotId = activeSlot;
      try {
        this._safeSet("meowcha_high_score", String(bestScore));
      } catch (e) {}

      this.saveSystem.saveGame(activeSlot, this.state);
      this.updateHUD();
      if (typeof this.updateLobbyStats === "function") this.updateLobbyStats(); else this.updateHUD();
      this.updatePantheonSelfStats();

      if (typeof onComplete === "function") {
        onComplete();
      }
    }

    async autoSubmitScoreToPantheon(forcedScore = null) {
      const bestScore = Math.max(this.state.highScore || 0, this.state.score || 0);
      const submitScore = forcedScore !== null ? Number(forcedScore) : (this.state.score > 0 ? this.state.score : bestScore);
      if (!submitScore || submitScore <= 0) return;

      // Tránh gửi trùng lặp điểm số cùng một phiên kết thúc
      const sessionKey = `${submitScore}_${this.state.wordsSlain}_${this.state.realmIdx}`;
      if (this.lastSubmittedSessionKey === sessionKey) {
        return;
      }
      this.lastSubmittedSessionKey = sessionKey;

      const user = this.getLoggedInUser();
      const realms = (root && root.Meowcha && root.Meowcha.CULTIVATION_REALMS) || [];
      const realmData = realms[this.state.realmIdx] || realms[0];

      try {
        const isCustomAvatar = user.avatar && !user.avatar.includes("sprites/characters") && !user.avatar.includes("idle.png");
        const payload = {
          player_name: user.name.slice(0, 40),
          avatar_url: isCustomAvatar ? user.avatar : "",
          score: submitScore,
          words_slain: Math.max(1, this.state.wordsSlain),
          realm: realmData.title || "Luyện Khí Kỳ",
          accuracy: Math.round(this.state.accuracy || 100),
          wpm: Math.round(this.state.wpm || 0)
        };

        const headers = { "Content-Type": "application/json" };
        if (user.token) {
          headers["Authorization"] = `Bearer ${user.token}`;
        }

        // 1. Đồng bộ vào Hồ Sơ Tu Chân Giả & Lịch Sử Trận Đấu
        fetch("/api/meowcha/profile/sync", {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            score_earned: submitScore,
            words_slain: Math.max(1, this.state.wordsSlain),
            realm: realmData.title || "Luyện Khí Kỳ",
            realm_idx: this.state.realmIdx || 0,
            wpm: Math.round(this.state.wpm || 0),
            accuracy: Math.round(this.state.accuracy || 100),
            is_victory: (this.state.hp > 0)
          })
        }).catch(() => {});

        // 2. Ghi danh Bảng Phong Thần
        const resp = await fetch("/api/meowcha/leaderboard", {
          method: "POST",
          headers: headers,
          body: JSON.stringify(payload)
        });

        if (resp.ok) {
          // Ghi nhận thành công âm thầm, không in log console tránh hiểu lầm buff điểm
        }
        if (submitScore > (this.state.highScore || 0)) {
          this.state.highScore = submitScore;
          try {
            this._safeSet("meowcha_high_score", String(this.state.highScore));
          } catch (err) {}
          if (typeof this.updateLobbyStats === "function") this.updateLobbyStats(); else this.updateHUD();
        }
      } catch (e) {
        console.warn("[Meowcha] Lỗi tự động ghi danh Bảng Phong Thần:", e);
      }
    }

    showPantheonModal() {
      if (!this.modalPantheon) return;
      this.modalPantheon.style.display = "flex";
      this.updatePantheonSelfStats();
      this.loadLeaderboardFromAPI();
    }

    hidePantheonModal() {
      if (this.modalPantheon) this.modalPantheon.style.display = "none";
    }

    updatePantheonSelfStats() {
      const user = this.getLoggedInUser();
      const selfAvatarEl = document.getElementById("pantheonSelfAvatar");
      const selfNameEl = document.getElementById("pantheonSelfName");
      if (selfAvatarEl) {
        selfAvatarEl.referrerPolicy = "no-referrer";
        selfAvatarEl.onerror = () => {
          selfAvatarEl.onerror = null;
          selfAvatarEl.src = "./sprites/characters/realm0_qi_refining/poses/idle.png";
        };
        selfAvatarEl.src = user.avatar || "./sprites/characters/realm0_qi_refining/poses/idle.png";
      }
      if (selfNameEl) selfNameEl.innerText = user.name;

      if (this.pantheonPlayerSelfStats) {
        const realms = (root && root.Meowcha && root.Meowcha.CULTIVATION_REALMS) || [];
        const realmData = realms[this.state.realmIdx] || realms[0];
        const bestScore = Math.max(this.state.highScore || 0, this.state.score || 0);
        this.pantheonPlayerSelfStats.innerText = `Kỷ Lục Phong Thần: ${bestScore.toLocaleString()} pts • Hiện tại: ${this.state.score.toLocaleString()} pts • ${this.state.wordsSlain} từ • ${realmData.title} • WPM: ${Math.round(this.state.wpm || 0)}`;
      }
    }

    loadLeaderboardFromAPI() {
      const listContainer = document.getElementById("pantheonRankList");
      if (!listContainer) return;

      listContainer.innerHTML = `
        <div style="text-align: center; padding: 25px; color: #FDE68A;">
          <div>Đang thỉnh bảng từ Tiên Giới...</div>
        </div>
      `;

      if (typeof fetch !== "undefined") {
        fetch("/api/meowcha/leaderboard?limit=25")
          .then(r => r.json())
          .then(res => {
            if (res.success && Array.isArray(res.data)) {
              this.renderPantheonLeaderboard(res.data);
            } else {
              this.renderPantheonLeaderboard([]);
            }
          })
          .catch(() => {
            this.renderPantheonLeaderboard([]);
          });
      }
    }

    renderPantheonLeaderboard(data) {
      const listContainer = document.getElementById("pantheonRankList");
      if (!listContainer) return;

      // Mỗi user chỉ có mặt trên 1 Top duy nhất (lấy điểm cao nhất)
      const seenNames = new Set();
      const uniqueData = [];
      for (const item of (data || [])) {
        const key = String(item.player_name || "").trim().toLowerCase();
        if (key && !seenNames.has(key)) {
          seenNames.add(key);
          uniqueData.push(item);
        }
      }
      data = uniqueData;

      // Tự động đồng bộ High Score 2 CHIỀU giữa Bảng Phong Thần và GameState
      const user = this.getLoggedInUser();
      const userNameLower = (user.name || "").trim().toLowerCase();
      const myBestScore = Math.max(this.state.highScore || 0, this.state.score || 0);

      if (userNameLower) {
        const myRankEntry = data.find(item => {
          const pName = (item.player_name || "").trim().toLowerCase();
          return pName && pName === userNameLower;
        });

        if (myRankEntry && typeof myRankEntry.score === 'number') {
          if (myRankEntry.score > (this.state.highScore || 0)) {
            // Kỷ lục trên Tiên Giới cao hơn thiết bị hiện tại -> Cập nhật vào máy
            this.state.highScore = myRankEntry.score;
            try {
              this._safeSet("meowcha_high_score", String(this.state.highScore));
            } catch (e) {}
            this.updatePantheonSelfStats();
            if (typeof this.updateLobbyStats === "function") this.updateLobbyStats(); else this.updateHUD();
          }
        }

        // Tái sắp xếp Bảng Phong Thần theo điểm số giảm dần
        data.sort((a, b) => (b.score || 0) - (a.score || 0));
        this.updatePantheonSelfStats();
      }

      const getAvatarByRealm = (realmName, score) => {
        const avatars = [
          "./sprites/characters/realm0_qi_refining/poses/idle.png",
          "./sprites/characters/realm1_foundation/poses/idle.png",
          "./sprites/characters/realm2_golden_core/poses/idle.png",
          "./sprites/characters/realm3_nascent_soul/poses/idle.png",
          "./sprites/characters/realm4_tribulation/poses/idle.png"
        ];
        if (!realmName) return avatars[0];
        const rLower = String(realmName).toLowerCase();
        if (rLower.includes("thái thượng") || rLower.includes("độ kiếp") || score >= 5000) return avatars[4];
        if (rLower.includes("nguyên anh") || score >= 3000) return avatars[3];
        if (rLower.includes("kim đan") || score >= 1800) return avatars[2];
        if (rLower.includes("trúc cơ") || score >= 800) return avatars[1];
        return avatars[0];
      };

      // Cập nhật từng vị trí bục vinh danh Podium (Top 1, 2, 3)
      const updatePodiumSlot = (rankIdx, itemData, defaultTitle) => {
        const nameEl = document.getElementById(`podiumName${rankIdx}`);
        const scoreEl = document.getElementById(`podiumScore${rankIdx}`);
        const realmEl = document.getElementById(`podiumRealm${rankIdx}`);
        const avatarEl = document.getElementById(`podiumAvatar${rankIdx}`);
        const placeholderEl = document.getElementById(`podiumPlaceholder${rankIdx}`);

        if (itemData) {
          if (nameEl) nameEl.innerText = itemData.player_name || defaultTitle;
          if (scoreEl) scoreEl.innerText = `${(itemData.score || 0).toLocaleString()} Tu Vi`;
          if (realmEl) realmEl.innerText = itemData.realm || "Luyện Khí Kỳ";
          if (avatarEl) {
            const fallbackRealmAvatar = getAvatarByRealm(itemData.realm, itemData.score || 0);
            avatarEl.referrerPolicy = "no-referrer";
            avatarEl.onerror = () => {
              avatarEl.onerror = null;
              avatarEl.src = fallbackRealmAvatar;
            };
            // Ưu tiên hiển thị Avatar thực tế của User (Discord / Web Avatar)
            if (itemData.avatar_url && itemData.avatar_url.trim()) {
              avatarEl.src = itemData.avatar_url.trim();
            } else {
              avatarEl.src = fallbackRealmAvatar;
            }
            avatarEl.style.display = "block";
          }
          if (placeholderEl) placeholderEl.style.display = "none";
        } else {
          if (nameEl) nameEl.innerText = defaultTitle;
          if (scoreEl) scoreEl.innerText = "--- Tu Vi";
          if (realmEl) realmEl.innerText = "Luyện Khí Kỳ";
          if (avatarEl) avatarEl.style.display = "none";
          if (placeholderEl) placeholderEl.style.display = "block";
        }
      };

      // Render Top 1, Top 2, Top 3
      updatePodiumSlot(1, data[0], "Chưa có Chí Tôn");
      updatePodiumSlot(2, data[1], "Đang chờ vị thứ");
      updatePodiumSlot(3, data[2], "Đang chờ vị thứ");

      if (data.length === 0) {
        listContainer.innerHTML = `
          <div style="text-align: center; padding: 30px 15px; color: #FEF08A; opacity: 0.9;">
            <div class="empty-pantheon-icon" style="margin-bottom: 8px;">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#FDE047" stroke-width="1.8">
                <path d="M19 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"></path>
                <path d="M9 7h6M9 11h6M9 15h4"></path>
              </svg>
            </div>
            <div style="font-family: var(--font-xianxia-title); font-size: 14px; font-weight: 700; color: #FDE047;">Tiên Giới thanh tịnh • Bảng Vàng đang đợi bậc Chí Tôn</div>
            <div style="font-size: 11.5px; color: #D1D5DB; margin-top: 6px; line-height: 1.5;">Chưa có Tiên Hữu nào ghi danh chiến tích.<br/>Đạo hữu hãy xuất kiếm diệt ma thạch — điểm số sẽ tự động vinh danh trên Bảng Phong Thần!</div>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = data.map((item, idx) => {
        let rowClass = "";
        let badgeHtml = `<span class="seal-rank-badge rank-other">[ #${idx + 1} ]</span>`;
        if (idx === 0) {
          rowClass = "gold";
          badgeHtml = `
            <span class="seal-rank-badge rank-gold" title="Chí Tôn Kim Giáp">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#FDE047"><path d="M2 4l3 12h14l3-12-5 6-7-8-7 8-1-6z"/></svg>
              #1
            </span>
          `;
        } else if (idx === 1) {
          rowClass = "silver";
          badgeHtml = `
            <span class="seal-rank-badge rank-silver" title="Bạch Ngân Tiên Quân">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#E2E8F0"><path d="M2 4l3 12h14l3-12-5 6-7-8-7 8-1-6z"/></svg>
              #2
            </span>
          `;
        } else if (idx === 2) {
          rowClass = "bronze";
          badgeHtml = `
            <span class="seal-rank-badge rank-bronze" title="Thanh Đồng Tiên Khách">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#F97316"><path d="M2 4l3 12h14l3-12-5 6-7-8-7 8-1-6z"/></svg>
              #3
            </span>
          `;
        }

        const avatarSrc = (item.avatar_url && item.avatar_url.trim()) 
          ? item.avatar_url 
          : getAvatarByRealm(item.realm, item.score || 0);

        return `
          <div class="pantheon-row ${rowClass}">
            <span class="rank-col">${badgeHtml}</span>
            <span class="name-col" title="${item.player_name}">
              <img src="${avatarSrc}" class="user-row-avatar" alt="Avatar" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='${getAvatarByRealm(item.realm, item.score || 0)}';" />
              <span class="name-text">${item.player_name || 'Vô Danh Tiên Khách'}</span>
            </span>
            <span class="realm-col">${item.realm || 'Luyện Khí Kỳ'}</span>
            <span class="score-col">${(item.score || 0).toLocaleString()} pts</span>
            <span class="words-col">${item.words_slain || 0} từ</span>
            <span class="wpm-col">${item.wpm || 0}</span>
          </div>
        `;
      }).join("");
    }

    async submitScoreToPantheon() {
      // Tự động chuyển hướng về autoSubmitScoreToPantheon
      await this.autoSubmitScoreToPantheon();
      this.loadLeaderboardFromAPI();
    }

    showProfileModal(bannerText = "TIÊN ĐẠO NGỌC GIẢN") {
      if (!this.modalProfile) return;
      const user = this.getLoggedInUser();
      const realms = (typeof window !== "undefined" && window.Meowcha && window.Meowcha.CULTIVATION_REALMS) || [];
      const realmData = realms[this.state.realmIdx] || realms[0];

      const bannerTag = document.getElementById("profileModalBannerTag");
      if (bannerTag) bannerTag.innerText = bannerText;

      const titleEl = document.getElementById("profileModalTitle");
      if (titleEl) {
        titleEl.innerText = user.isLoggedIn ? `${user.name} • ${realmData.title}` : (realmData.title || "Tiểu Miêu Kiếm Đồng");
      }

      const subEl = document.getElementById("profileModalSub");
      if (subEl) subEl.innerText = `${realmData.name} • Band ${realmData.band}`;

      const avatarEl = document.getElementById("profileModalAvatar");
      if (avatarEl) {
        const avatars = [
          "./sprites/characters/realm0_qi_refining/poses/idle.png",
          "./sprites/characters/realm1_foundation/poses/idle.png",
          "./sprites/characters/realm2_golden_core/poses/idle.png",
          "./sprites/characters/realm3_nascent_soul/poses/idle.png",
          "./sprites/characters/realm4_tribulation/poses/idle.png"
        ];
        const realmFallback = avatars[Math.min(4, this.state.realmIdx)] || avatars[0];
        avatarEl.referrerPolicy = "no-referrer";
        avatarEl.onerror = () => {
          avatarEl.onerror = null;
          avatarEl.src = realmFallback;
        };
        if (user.avatar && !user.avatar.includes("idle.png")) {
          avatarEl.src = user.avatar;
        } else {
          avatarEl.src = realmFallback;
        }
      }

      const scoreEl = document.getElementById("profileModalScore");
      if (scoreEl) scoreEl.innerText = `${this.state.score.toLocaleString()} pts`;

      const highScoreEl = document.getElementById("profileModalHighScore");
      if (highScoreEl) {
        const bestScore = Math.max(this.state.highScore || 0, this.state.score || 0);
        highScoreEl.innerText = `${bestScore.toLocaleString()} pts`;
      }

      const wordsEl = document.getElementById("profileModalWords");
      if (wordsEl) wordsEl.innerText = `${this.state.wordsSlain} từ`;

      const accEl = document.getElementById("profileModalAccuracy");
      if (accEl) accEl.innerText = `${this.state.accuracy || 100}%`;

      const wpmEl = document.getElementById("profileModalWpm");
      if (wpmEl) wpmEl.innerText = `${this.state.wpm || 0} WPM`;

      const hpEl = document.getElementById("profileModalHp");
      if (hpEl) hpEl.innerText = `${this.state.hp} / ${this.state.maxHp} HP`;

      const talentsEl = document.getElementById("profileModalTalentsList");
      if (talentsEl) {
        const activeT = [];
        if (this.state.talents.hpBonus > 0) activeT.push(`Khí Huyết +${this.state.talents.hpBonus}`);
        if (this.state.talents.slowFactor < 1.0) activeT.push(`Linh Vực Giảm Tốc`);
        if (this.state.talents.critChance > 0) activeT.push(`Bạo Kích +${Math.round(this.state.talents.critChance * 100)}%`);
        if (this.state.talents.scoreMultiplier > 1.0) activeT.push(`Tu Vi x${this.state.talents.scoreMultiplier.toFixed(1)}`);
        if (this.state.talents.shieldCharges > 0) activeT.push(`Hộ Thể Kim Chung (${this.state.talents.shieldCharges})`);
        if (this.state.talents.autoKill) activeT.push(`Nhất Kiếm Đoạt Mệnh`);
        if (this.state.talents.typoImmune) activeT.push(`Kim Cang Bất Hoại`);

        if (activeT.length === 0) {
          talentsEl.innerHTML = `<span class="talent-tag-badge">Chưa ngưng tụ thần thông</span>`;
        } else {
          talentsEl.innerHTML = activeT.map(t => `<span class="talent-tag-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="1.8" style="vertical-align: middle; margin-right: 3px;"><path d="M12 4 C10 8 10 14 12 18 C14 14 14 8 12 4 Z" fill="#F59E0B" fill-opacity="0.4"/><circle cx="12" cy="18.5" r="1.5" fill="#F59E0B"/></svg>${t}</span>`).join("");
        }
      }

      this.modalProfile.style.display = "flex";
    }

    hideProfileModal() {
      if (this.modalProfile) this.modalProfile.style.display = "none";
    }
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.UIManager = UIManager;
})(typeof window !== 'undefined' ? window : globalThis);
