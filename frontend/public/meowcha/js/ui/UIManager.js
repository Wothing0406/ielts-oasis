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
      const handleRebirthFromGameOver = (e) => {
        if (e) {
          try { e.preventDefault(); e.stopPropagation(); } catch (_) {}
        }
        try {
          const curSlotId = (this.state && this.state.activeSlotId) || (this.saveSystem && this.saveSystem.getActiveSlotId()) || 1;
          const curMode = (this.state && this.state.gameMode) || "DIRECT";
          if (this.saveSystem && typeof this.saveSystem.resetActiveSave === "function") {
            this.saveSystem.resetActiveSave(curSlotId, curMode);
          }
          if (this.state && typeof this.state.resetForNewMode === "function") {
            this.state.resetForNewMode(curMode);
          }
        } catch (err) {
          console.warn("[GameOver Rebirth]", err);
        } finally {
          this.hideGameOverModal();
          if (this.audio) {
            try { this.audio.silenceAll(); this.audio.play("chime"); } catch (_) {}
          }
          if (this.onRestartBattle) {
            this.onRestartBattle();
          } else if (this.onStartBattle) {
            this.onStartBattle();
          }
        }
      };

      if (btnRebirth) {
        btnRebirth.onclick = handleRebirthFromGameOver;
        btnRebirth.addEventListener("pointerup", handleRebirthFromGameOver, { passive: false });
      }

      // Nút Quy Về Tiên Sảnh (Game Over -> Trở về sảnh với trạng thái sạch đã tẩy tủy)
      const btnReturnLobbyGameOver = document.getElementById("btnReturnLobbyGameOver");
      const handleReturnLobbyFromGameOver = (e) => {
        if (e) {
          try { e.preventDefault(); e.stopPropagation(); } catch (_) {}
        }
        try {
          const curSlotId = (this.state && this.state.activeSlotId) || (this.saveSystem && this.saveSystem.getActiveSlotId()) || 1;
          const curMode = (this.state && this.state.gameMode) || "DIRECT";
          if (this.saveSystem && typeof this.saveSystem.resetActiveSave === "function") {
            this.saveSystem.resetActiveSave(curSlotId, curMode);
          }
          if (this.state && typeof this.state.reset === "function") {
            this.state.reset();
          }
        } catch (err) {
          console.warn("[GameOver ReturnLobby]", err);
        } finally {
          this.hideGameOverModal();
          if (this.audio) {
            try { this.audio.silenceAll(); this.audio.play("chime"); } catch (_) {}
          }
          if (this.onReturnLobby) this.onReturnLobby();
        }
      };

      if (btnReturnLobbyGameOver) {
        btnReturnLobbyGameOver.onclick = handleReturnLobbyFromGameOver;
        btnReturnLobbyGameOver.addEventListener("pointerup", handleReturnLobbyFromGameOver, { passive: false });
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
      let selectedMode = (this.state && this.state.gameMode) || "DIRECT";

      const updateSetupUI = () => {
        // Highlight mode cards
        modal.querySelectorAll(".setup-mode-card").forEach(card => {
          card.classList.toggle("active-mode", card.getAttribute("data-mode") === selectedMode);
        });

        // Highlight realm step in unified track
        const userRealmIdx = Math.max(0, Math.min(4, (this.state && this.state.realmIdx) || 0));
        modal.querySelectorAll(".realm-step-card").forEach((card, idx) => {
          card.classList.toggle("active-realm", idx === userRealmIdx);
        });

        // Kiểm tra xem slot hiện tại đã có dữ liệu lưu của pháp môn này chưa
        const modeData = this.saveSystem && this.saveSystem.getSlotModeData && this.saveSystem.getSlotModeData(curSlotId, selectedMode);
        const hasProgress = Boolean(modeData && modeData.isOccupied && modeData.hp > 0 && (modeData.score > 0 || modeData.realmIdx > 0 || modeData.words > 0));

        const detailEl = document.getElementById("setupJourneyDetail");
        const actionsRow = document.getElementById("setupActionsRow");

        const modeLabels = {
          CLOZE: "Ngộ Đạo Khuyết Tự",
          DIRECT: "Trực Diện Trảm Ma",
          AUDIO: "Thính Lôi Biện Âm"
        };
        const mName = modeLabels[selectedMode] || selectedMode;

        // LINH MIÊU THỦY MẶC (Fine Calligraphic Ink Spirit Cat with Auspicious Cloud & Jade Talisman)
        const leftMascotSvg = `
          <div class="setup-mascot-flank left" title="Linh Miêu Cưỡi Mây Ngậm Kim Phù • Hộ Đạo Trợ Uy" aria-hidden="true">
            <img src="./assets/ui/mascot_spirit_cat.png" alt="Linh Miêu Hộ Đạo" class="mascot-img-flank cat-flank-anim" />
          </div>
        `;

        // TRÀ ĐẠO KIẾM ĐỒNG • ĐẢ TỌA (Authentic High-Res Transparent PNG)
        const rightMascotSvg = `
          <div class="setup-mascot-flank right" title="Trà Đạo Kiếm Đồng • Đả Tọa Nhập Định" aria-hidden="true">
            <img src="./assets/ui/mascot_daoist_master.png" alt="Kiếm Đồng Đả Tọa" class="mascot-img-flank master-flank-anim" />
          </div>
        `;

        if (hasProgress) {
          if (detailEl) {
            detailEl.innerHTML = `<span style="color:#2DE28D">Đang Lưu Đạo Quả:</span> Cảnh Giới: <b>${modeData.realm || 'Luyện Khí Kỳ'}</b> • <b>${(modeData.score || 0).toLocaleString()} Tu Vi</b> • Trảm: <b>${modeData.words || 0} Ma Thạch</b>`;
          }
          if (actionsRow) {
            actionsRow.innerHTML = `
              ${leftMascotSvg}
              <div class="setup-dual-btns-wrap">
                <button class="sword-token-btn launch-flame" id="btnSetupStartFresh">
                  <div class="sword-token-glow"></div>
                  <div class="sword-token-hilt"><svg width="26" height="26" viewBox="0 0 512 512" fill="#FEF08A"><path d="M491.313 21.406C331.102 120.193 194.688 226.866 70 350.906c29.11-21.616 63.387-37.86 103.875-49.28 40.95-60.157 100.923-106.7 170.844-130.157-23.522 69.8-70.747 130.135-131.314 171.25-9.76 38.353-26.835 69.38-48 96.374C289.153 314.63 403.748 181.7 491.312 21.406zM132.656 345.5v.344c-30.526 52.844-71.12 87.318-115.437 115.47-4.89 28.29 9.777 39.067 34.75 34.56 30.594-51.69 68.69-88.052 115.436-115.468 0-19.56-12.363-34.906-34.75-34.906z"/></svg></div><div class="sword-token-content"><span class="sword-token-main" style="color: #FEF08A">KHỞI MỞ TRẬN MỚI</span>
                    <span class="sword-token-sub">[ Bắt Đầu Từ Cấp 0 • Khí Huyết 50/50 ]</span>
                  </div>
                  <div class="sword-token-tip">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FEF08A" stroke-width="2.5"><polygon points="4 4 20 12 4 20 7 12" fill="rgba(239,68,68,0.4)"></polygon></svg>
                  </div>
                </button>
                <button class="sword-token-btn continue-green" id="btnSetupContinue">
                  <div class="sword-token-hilt"><svg width="26" height="26" viewBox="0 0 512 512" fill="#34D399"><path d="M256.438 19.375c-47.71 0-95.422 14.41-136.094 43.22 13.022 15.09 26.314 30.127 39.156 44.468 16.038-11.682 32.482-18.857 48.688-22.282l9.875-9.874 6.625-6.625 6.593 6.626 7.72 7.72c78.735 5.644 140.54 95.133 101.406 175.53l118.5 118.5c54.447-90.673 42.59-209.88-35.625-288.094C377.17 42.45 316.806 19.376 256.44 19.376zM66.5 27.063L29.53 64.03c37.95 29.834 80.152 65.906 115 96.845l7.407 6.594-7 7-47.375 47.374L117.25 241.5l34.5-34.5 268.125 268.156 77.344 19.28-21.845-74.78-26.977-26.978.04-.053-117.75-117.75-.032.045L207.25 151.5l37.094-37.094-19.656-19.656-46.47 46.438-6.968 6.937-6.563-7.28C133.5 106.334 96.644 64.837 66.5 27.062zm-1.28 90.062C-1.735 209.41 6.38 339.035 89.593 422.25c52.93 52.93 124.633 75.448 193.562 67.625-131.5.997-246.804-128.563-207.125-263.156l-4.874-4.876 6.594-6.625 3.25-3.25c7.028-18.512 17.076-37.017 30.5-55.22-14.87-12.992-30.55-26.433-46.28-39.625zm120.374 46.03c12.283 0 22.22 9.968 22.22 22.25 0 2.224-.332 4.35-.94 6.376l236.94 236.97-13.19 13.188L194.47 205.813c-2.72 1.185-5.72 1.843-8.876 1.843-12.284 0-22.25-9.964-22.25-22.25 0-12.285 9.966-22.25 22.25-22.25z"/></svg></div><div class="sword-token-content"><span class="sword-token-main" style="color: #6EE7B7">TIẾP TỤC ĐẠO QUẢ</span>
                    <span class="sword-token-sub">${(modeData.score || 0).toLocaleString()} Tu Vi • ${modeData.realm || 'Luyện Khí Kỳ'}</span>
                  </div>
                  <div class="sword-token-tip">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" stroke-width="2.5"><polygon points="4 4 20 12 4 20 7 12" fill="rgba(45,226,141,0.3)"></polygon></svg>
                  </div>
                </button>
              </div>
              ${rightMascotSvg}
            `;

            document.getElementById("btnSetupStartFresh").onclick = () => {
              this.state.gameMode = selectedMode;
              this.saveSystem.resetActiveSave(curSlotId, selectedMode);
              this.state.resetForNewMode(selectedMode);
              this.closeBattleSetupModal();
              this.updateLobbyButtons();
              this.updateHUD();
              this.audio.play("slash");
              this.showStatus(`KHỞI MỞ TRẬN MỚI • Bắt đầu ván mới pháp môn ${mName} từ Cấp 0!`);
              if (this.onStartBattle) this.onStartBattle();
            };

            document.getElementById("btnSetupContinue").onclick = () => {
              this.state.gameMode = selectedMode;
              this.state.loadFromModeData(modeData, selectedMode);
              this.closeBattleSetupModal();
              this.updateLobbyButtons();
              this.updateHUD();
              this.audio.play("chime");
              this.showStatus(`TIẾP TỤC TU LUYỆN • Pháp môn ${mName} • ${(this.state.score || 0).toLocaleString()} Tu Vi!`);
              if (this.onStartBattle) this.onStartBattle();
            };
          }
        } else {
          if (detailEl) {
            detailEl.innerHTML = `<span style="color:#F3C644">Khởi Nguyên Tu Vi:</span> Khởi đầu từ <b>Luyện Khí Kỳ (Cấp 0 - 0 Tu Vi)</b>`;
          }
          if (actionsRow) {
            actionsRow.innerHTML = `
              ${leftMascotSvg}
              <button class="sword-token-btn launch-flame" id="btnSetupStartFresh">
                <div class="sword-token-glow"></div>
                <div class="sword-token-hilt"><svg width="28" height="28" viewBox="0 0 512 512" fill="#FEF08A"><path d="M491.313 21.406C331.102 120.193 194.688 226.866 70 350.906c29.11-21.616 63.387-37.86 103.875-49.28 40.95-60.157 100.923-106.7 170.844-130.157-23.522 69.8-70.747 130.135-131.314 171.25-9.76 38.353-26.835 69.38-48 96.374C289.153 314.63 403.748 181.7 491.312 21.406zM132.656 345.5v.344c-30.526 52.844-71.12 87.318-115.437 115.47-4.89 28.29 9.777 39.067 34.75 34.56 30.594-51.69 68.69-88.052 115.436-115.468 0-19.56-12.363-34.906-34.75-34.906z"/></svg></div>
                <div class="sword-token-content">
                  <div class="sword-token-title-row">
                    <span class="sword-token-main" style="color: #FEF08A">BẮT ĐẦU ĐỘ KIẾP NGAY</span>
                    <span class="sword-token-mode-tag">(${mName.toUpperCase()})</span>
                  </div>
                  <span class="sword-token-sub">[ 剑 ] Lệnh Bài Trảm Ma • Xuất Kiếm Khai Chiến [ 战 ]</span>
                </div>
                <div class="sword-token-tip"><svg width="22" height="22" viewBox="0 0 512 512" fill="#FDE047"><path d="M133.53 10.47c51.747 30.872 96.318 71.166 131.94 119.093C199.33 72.05 115.217 33.942 19.22 21.406c12.584 96.38 50.948 180.807 108.843 247.063-47.45-35.09-87.475-78.907-118.313-129.783v31.219C65.264 272.953 147.488 356.6 249.28 413.812 159.164 375.9 78.843 322.91 10.813 257.375l-.468 38.125C134.828 408.824 300.18 479.697 493.75 494.688c-14.992-193.573-85.27-358.92-198.594-483.407l-41.812.44c64.677 66.753 117.25 145.417 155.28 233.624-57.55-99.84-140.81-180.403-242.937-234.875H133.53zm22.22 149.5c36.29 16.732 71.624 40.59 103.97 68.343l60.717-60.157 34.47 34.438-37.376 23.375c58.01 69.636 105.07 147.97 134.908 230.686-82.466-29.758-160.62-76.55-230.094-134.312l-23.938 36.78-35.062-34.468 60.75-60.72c-27.75-32.335-51.607-67.668-68.344-103.967z"/></svg></div>
              </button>
              ${rightMascotSvg}
            `;

            document.getElementById("btnSetupStartFresh").onclick = () => {
              this.state.gameMode = selectedMode;
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

      // Tốc độ Kiếm Tự
      if (this.hudWpm) {
        this.hudWpm.innerText = `${s.wpm} Tự/Phút`;
      }

      // Cập nhật thông số Sảnh Thiền Định (Tầng 2: Mini Jade HP Bar, Tu Vi, Cổ Ngữ, Kiếm Tốc)
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
      if (this.lobbyWpmText) this.lobbyWpmText.innerText = `${Math.round(s.wpm || 0)} Tự/Phút`;
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
      
      const personalBest = Math.max(
        Number(s.highScore || 0),
        Number(s.score || 0),
        Number(this._safeGet("meowcha_high_score", 0))
      );

      let certRealmIdx = Math.max(0, s.realmIdx || 0);
      for (let i = realms.length - 1; i >= 0; i--) {
        if (personalBest >= realms[i].minScore) {
          certRealmIdx = Math.max(certRealmIdx, i);
          break;
        }
      }
      const realmData = realms[certRealmIdx] || realms[0] || { title: "Tiểu Miêu Kiếm Đồng", name: "Luyện Khí Kỳ", color: "#FFE49A" };
      const rIdx = certRealmIdx;

      const modeNames = {
        CLOZE: 'Ngộ Đạo Thông Linh (Điền Khuyết)',
        DIRECT: 'Trực Diện Trảm Ma (Gõ Phản Xạ)',
        AUDIO: 'Thính Lôi Biện Âm (Nghe Chính Tả)'
      };
      const curMode = s.gameMode || "DIRECT";
      const modeLabel = modeNames[curMode] || curMode;

      // 1. NỀN SƠN MÀI GỖ TỬ ĐÀN & CHU SA HOÀNG HÔN (PREMIUM XIANXIA SILK)
      const grad = ctx.createRadialGradient(600, 315, 60, 600, 315, 680);
      grad.addColorStop(0, "#281711");
      grad.addColorStop(0.55, "#1C0E0A");
      grad.addColorStop(1, "#100D12");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 630);

      // Vân linh khí hoàng kim & ngọc bích lấp lánh có kiểm soát
      for (let i = 0; i < 42; i++) {
        const sx = Math.sin(i * 88) * 560 + 600;
        const sy = Math.cos(i * 66) * 270 + 315;
        const sr = (i % 3) + 1.2;
        ctx.fillStyle = i % 2 === 0 ? "rgba(212, 168, 73, 0.35)" : "rgba(39, 104, 93, 0.3)";
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. VIỀN KÉP HOÀNG KIM & CHU SA CỔ PHONG
      // Khung ngoài nạm chỉ vàng kim cổ
      ctx.strokeStyle = "#D4A849";
      ctx.lineWidth = 4;
      ctx.strokeRect(26, 26, 1148, 578);

      // Khung trong đỏ chu sa sơn mài
      ctx.strokeStyle = "rgba(118, 29, 32, 0.85)";
      ctx.lineWidth = 2;
      ctx.strokeRect(36, 36, 1128, 558);

      // Khung chỉ vàng phụ mảnh mai
      ctx.strokeStyle = "rgba(255, 228, 154, 0.35)";
      ctx.lineWidth = 1;
      ctx.strokeRect(42, 42, 1116, 546);

      // 4 PHÙ TRIỆN BÁT QUÁI TẠI 4 GÓC (KHẮC HOÀNG KIM)
      ctx.fillStyle = "#FFE49A";
      ctx.font = "800 17px 'Cinzel', serif";
      ctx.fillText("[ 乾 ]", 52, 66);
      ctx.fillText("[ 坤 ]", 1112, 66);
      ctx.fillText("[ 坎 ]", 52, 576);
      ctx.fillText("[ 离 ]", 1112, 576);

      // 3. TIÊU ĐỀ CHỨNG ĐẠO KIM ĐỒ
      ctx.textAlign = "center";
      ctx.font = "800 14px 'Cinzel', sans-serif";
      ctx.fillStyle = "#D4A849";
      ctx.letterSpacing = "2px";
      ctx.fillText("✦ MEOW-CHA TRÀ ĐẠO • TIÊN HIỆP IELTS OASIS ✦", 600, 78);

      ctx.font = "900 38px 'Cinzel', serif";
      ctx.fillStyle = "#FFE49A";
      ctx.shadowColor = "rgba(212, 168, 73, 0.6)";
      ctx.shadowBlur = 16;
      ctx.fillText("CHỨNG ĐẠO KIM ĐỒ", 600, 126);
      ctx.shadowBlur = 0;

      // 4. KHỐI BÊN TRÁI: ĐẠO QUẢ MIÊU TIÊN NGỰ KIẾM (REAL CHARACTER SPRITE)
      const cx = 250, cy = 350;
      ctx.save();

      // Vòng Ngũ Sắc Linh Vòng
      ctx.strokeStyle = "rgba(212, 168, 73, 0.75)";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#D4A849";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(cx, cy, 125, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(39, 104, 93, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 136, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Bệ Mây Ngũ Sắc Tọa Thiền
      ctx.fillStyle = "rgba(39, 104, 93, 0.35)";
      ctx.strokeStyle = "#34D399";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 96, 92, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Vẽ sprite nhân vật thực tế
      const catAsset = (this.assets && (this.assets[`char_r${rIdx}_ultimate`]?.img || this.assets[`char_r${rIdx}_idle`]?.img))
        || document.getElementById("lobbyCatImg");

      if (catAsset && (catAsset.complete || catAsset.naturalWidth > 0)) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.shadowColor = "#D4A849";
        ctx.shadowBlur = 16;
        ctx.drawImage(catAsset, cx - 100, cy - 100, 200, 200);
        ctx.restore();
      } else {
        // Fallback ngọc bài tu sĩ silhouette
        ctx.fillStyle = "rgba(212, 168, 73, 0.2)";
        ctx.strokeStyle = "#D4A849";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 70, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.font = "800 28px 'Cinzel', serif";
        ctx.fillStyle = "#FFE49A";
        ctx.textAlign = "center";
        ctx.fillText("仙", cx, cy + 10);
      }

      ctx.restore();

      // 5. KHỐI BÊN PHẢI: BẢNG CHIẾN TÍCH TU CHÂN & VINH DANH TIÊN HỮU
      ctx.textAlign = "left";

      // TÊN TIÊN HỮU / ĐẠO HIỆU
      ctx.font = "900 28px 'Cinzel', serif";
      ctx.fillStyle = "#FFE49A";
      ctx.shadowColor = "rgba(212, 168, 73, 0.7)";
      ctx.shadowBlur = 8;
      ctx.fillText(`TIÊN HỮU: ${userName.toUpperCase()}`, 470, 198);
      ctx.shadowBlur = 0;

      // CẢNH GIỚI & PHÁP MÔN
      ctx.font = "700 16px 'Be Vietnam Pro', sans-serif";
      ctx.fillStyle = "#FEF3C7";
      ctx.fillText(`CẢNH GIỚI: ${realmData.name.toUpperCase()} (CẤP ${rIdx}) • ${realmData.title}`, 470, 230);

      ctx.font = "600 13px 'Be Vietnam Pro', sans-serif";
      ctx.fillStyle = "#D4A849";
      ctx.fillText(`PHÁP MÔN TU LUYỆN: ${modeLabel}`, 470, 254);

      // Lưới thông số (Stats grid: 4 ô) theo bảng màu Tiên Hiệp chuẩn
      const stats = [
        { label: "ĐIỂM KỶ LỤC (CAO NHẤT)", val: `${personalBest.toLocaleString()} PTS`, color: "#FFE49A" },
        { label: "ĐIỂM VÁN HIỆN TẠI", val: `${(s.score || 0).toLocaleString()} PTS`, color: "#34D399" },
        { label: "TỔNG TỪ ĐÃ TRẢM", val: `${Math.max(s.wordsSlain || 0, Math.round(personalBest / 160))} TỪ`, color: "#FEF08A" },
        { label: "TỐC ĐỘ GÕ PHÍM", val: `${Math.round(s.wpm || 0)} Tự/Phút (COMBO x${s.maxCombo || s.combo || 1})`, color: "#F87171" }
      ];

      stats.forEach((st, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const bx = 470 + col * 320;
        const by = 280 + row * 85;

        // Thẻ gỗ tử đàn nẹp viền chỉ vàng
        ctx.fillStyle = "#1E110A";
        ctx.strokeStyle = "rgba(212, 168, 73, 0.45)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, 305, 72, 6);
        else ctx.rect(bx, by, 305, 72);
        ctx.fill();
        ctx.stroke();

        ctx.font = "700 11.5px 'Be Vietnam Pro', sans-serif";
        ctx.fillStyle = "#CBB799";
        ctx.fillText(st.label, bx + 16, by + 27);

        ctx.font = "900 22px 'Cinzel', serif";
        ctx.fillStyle = st.color;
        ctx.fillText(st.val, bx + 16, by + 56);
      });

      // Khẩu quyết tiên gia
      ctx.font = "italic 13.5px 'Be Vietnam Pro', sans-serif";
      ctx.fillStyle = "#E6D5B8";
      ctx.fillText("“Vạn kiếm quy tâm • Bền bỉ dưỡng khí • Mỗi ngày một bước tiến gần Tiên Đạo.”", 470, 484);

      // DẤU TRIỆN CHU SA TIÊN TÔNG (KHÔNG BỊ CHỒNG CHÉO)
      const sealX = 470, sealY = 512, sealW = 280, sealH = 44;
      ctx.fillStyle = "rgba(118, 29, 32, 0.6)";
      ctx.strokeStyle = "#D4A849";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(sealX, sealY, sealW, sealH, 4);
      else ctx.rect(sealX, sealY, sealW, sealH);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.font = "800 13px 'Cinzel', serif";
      ctx.fillStyle = "#FFE49A";
      ctx.fillText("✦ THƯỢNG PHẨM ĐẠO QUẢ • CHỨNG ĐẠO ✦", sealX + sealW / 2, sealY + 27);

      // Link trang web
      ctx.textAlign = "right";
      ctx.font = "600 12px 'Cinzel', sans-serif";
      ctx.fillStyle = "#D4A849";
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
          <div class="vault-empty-state" style="grid-column: 1 / -1; text-align: center; padding: 40px 15px; color: #FEF3C7;">
            <div style="margin-bottom: 10px;">
              <img src="./assets/svg/scroll-unfurled.svg" style="width: 44px; height: 44px; filter: drop-shadow(0 0 10px #D4A849);" alt="" />
            </div>
            <div style="font-family: var(--font-xianxia-title); font-size: 15px; font-weight: 800; color: #FFE49A; letter-spacing: 1px;">Không tìm thấy đan dược phù hợp!</div>
            <div style="font-size: 12.5px; color: #E6D5B8; margin-top: 6px; line-height: 1.5;">Đạo hữu hãy thử tra bằng từ khóa khác hoặc bấm nút bên dưới để mở toàn bộ kho Oxford 5000.</div>
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
      const bestScore = Math.max(
        Number(this.state.highScore || 0),
        Number(this.state.score || 0),
        Number(this._safeGet("meowcha_high_score", 0))
      );
      const submitScore = forcedScore !== null ? Number(forcedScore) : bestScore;
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
        this.pantheonPlayerSelfStats.innerText = `Kỷ Lục Phong Thần: ${bestScore.toLocaleString()} pts • Hiện tại: ${this.state.score.toLocaleString()} pts • ${this.state.wordsSlain} từ • ${realmData.title} • Kiếm Tốc: ${Math.round(this.state.wpm || 0)} Tự/Phút`;
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
          <div style="text-align: center; padding: 36px 15px; color: #FEF3C7;">
            <div class="empty-pantheon-icon" style="margin-bottom: 10px;">
              <img src="./assets/svg/pagoda.svg" style="width: 48px; height: 48px; filter: drop-shadow(0 0 12px #D4A849);" alt="" />
            </div>
            <div style="font-family: var(--font-xianxia-title); font-size: 15px; font-weight: 800; color: #FFE49A; letter-spacing: 1px;">Tiên Giới Thanh Tịnh • Bảng Vàng Đang Đợi Bậc Chí Tôn</div>
            <div style="font-size: 12.5px; color: #E6D5B8; margin-top: 6px; line-height: 1.5;">Chưa có Tiên Hữu nào ghi danh chiến tích.<br/>Đạo hữu hãy xuất kiếm diệt ma thạch — điểm số sẽ tự động vinh danh trên Bảng Phong Thần!</div>
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
              <img src="./assets/svg/dragon-shield.svg" class="badge-mini-svg" alt="" />
              #1
            </span>
          `;
        } else if (idx === 1) {
          rowClass = "silver";
          badgeHtml = `
            <span class="seal-rank-badge rank-silver" title="Bạch Ngân Tiên Quân">
              <img src="./assets/svg/winged-sword.svg" class="badge-mini-svg" alt="" />
              #2
            </span>
          `;
        } else if (idx === 2) {
          rowClass = "bronze";
          badgeHtml = `
            <span class="seal-rank-badge rank-bronze" title="Thanh Đồng Tiên Khách">
              <img src="./assets/svg/cauldron.svg" class="badge-mini-svg" alt="" />
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
      if (wpmEl) wpmEl.innerText = `${this.state.wpm || 0} Tự/Phút`;

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
