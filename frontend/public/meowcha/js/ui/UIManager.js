/**
 * UIManager.js - Quản Lý Toàn Bộ Giao Diện & Hộp Thoại (HUD & Modals)
 * Điều khiển thanh HP đan điền, tu vi, đếm combo, modal Ngọc Giản, đột phá thiên phú và Phong Thần Bảng
 */
(function(root) {
  class UIManager {
    constructor(gameState, saveSystem, audioManager, onStartBattle, onReturnLobby, onRestartBattle) {
      this.state = gameState;
      this.saveSystem = saveSystem;
      this.audio = audioManager;
      this.onStartBattle = onStartBattle;
      this.onReturnLobby = onReturnLobby;
      this.onRestartBattle = onRestartBattle;

      this.initDOMElements();
      this.bindEvents();
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
      // Nút bắt đầu độ kiếp ở Lobby
      const btnStart = document.getElementById("btnStartBattle");
      if (btnStart) {
        btnStart.onclick = () => {
          this.audio.play("slash");
          if (this.onStartBattle) this.onStartBattle();
        };
      }

      // Nút Chơi Tiếp (Continue)
      const btnContinue = document.getElementById("btnContinueBattle");
      if (btnContinue) {
        btnContinue.onclick = () => {
          const activeSave = this.saveSystem.hasActiveSave();
          if (!activeSave) {
            this.showStatus("[ 仙 ] Chưa có đạo quả nào được lưu trữ!");
            return;
          }
          const targetSlot = activeSave.slotId || 1;
          const slotData = this.saveSystem.getSlot(targetSlot);
          this.state.loadFromSlot(slotData);
          this.state.activeSlotId = targetSlot;
          this.saveSystem.setActiveSlotId(targetSlot);
          this.audio.play("chime");
          this.updateHUD();
          this.showStatus(`[ 仙 ] [TIẾP TỤC TU LUYỆN] Đã nạp Cuộn Trục ${targetSlot}: ${slotData.title || slotData.realm} (${(slotData.score || 0).toLocaleString()} Tu Vi)!`);
          if (this.onStartBattle) {
            this.onStartBattle();
          } else {
            this.showProfileModal(`TIẾN TRÌNH TU LUYỆN • NGỌC GIẢN ${targetSlot}`);
          }
        };
      }

      // Nút Chơi Lại Từ Đầu ở Lobby (Tẩy Tủy Trọng Sinh)
      const btnRestart = document.getElementById("btnRestartGame");
      if (btnRestart) {
        btnRestart.onclick = () => {
          this.showConfirm("ĐẠO HỮU TẨY TỦY TRỌNG SINH?", "Chiến tích cao nhất sẽ được khắc bia Bảng Phong Thần. Mọi điểm Tu Vi và cảnh giới sẽ bắt đầu lại từ Luyện Khí Kỳ.", () => {
            this.performPurificationRebirth(() => {
              this.audio.play("chime");
              this.showStatus("[ 丹 ] [TẨY TỦY TRỌNG SINH] Kỷ lục đã được bảo lưu & vinh danh Bảng Phong Thần! Khởi đầu lại từ Luyện Khí Kỳ.");
            });
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

      // NÚT TẨY TỦY CHƠI LẠI NHANH TRÊN HUD [ 丹 ]
      if (this.btnQuickRestartHUD) {
        this.btnQuickRestartHUD.onclick = () => {
          this.showConfirm("TẨY TỦY TRỌNG SINH?", "Chiến tích cao nhất sẽ được khắc bia Bảng Phong Thần. Toàn bộ ma thạch sẽ tan biến và bắt đầu lại từ Luyện Khí Kỳ. Đạo hữu chắc chắn?", () => {
            this.performPurificationRebirth(() => {
              this.audio.play("chime");
              this.showStatus("[ 丹 ] [TẨY TỦY TRỌNG SINH] Kỷ lục đã vinh danh Bảng Phong Thần! Khởi tạo lại trận đấu thành công!");
              if (this.onRestartBattle) this.onRestartBattle();
            });
          });
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

      // Nút Trọng Sinh (Game Over)
      const btnRebirth = document.getElementById("btnRebirth");
      if (btnRebirth) {
        btnRebirth.onclick = () => {
          this.saveSystem.resetActiveSave();
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
      const modeNames = {
        CLOZE: 'Ngộ Đạo Thông Linh (Active Recall)',
        DIRECT: 'Trực Diện Trảm Ma (Direct Typing)',
        AUDIO: 'Thính Lôi Biện Âm (Audio Dictation)'
      };
      if (this.audio) this.audio.play('chime');
      this.showStatus(`[ PHÁP MÔN ] Đã chọn ${modeNames[mode] || mode}`);
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
        lobbyCatImg.onerror = () => {
          lobbyCatImg.onerror = null;
          lobbyCatImg.src = "./sprites/characters/realm0_qi_refining/poses/idle.png";
        };
        lobbyCatImg.src = avatars[rIdx] || avatars[0];
      }

      this.updateMonolithLocks();
      this.updateLobbyButtons();
    }

    updateLobbyButtons() {
      const btnStart = document.getElementById("btnStartBattle");
      const btnContinue = document.getElementById("btnContinueBattle");
      const btnRestart = document.getElementById("btnRestartGame");
      const continueSub = document.getElementById("continueBattleSub");

      const activeSave = this.saveSystem && this.saveSystem.hasActiveSave && this.saveSystem.hasActiveSave();
      if (activeSave) {
        const slotData = this.saveSystem.getSlot(activeSave.slotId || 1);
        if (btnContinue) {
          btnContinue.style.display = "flex";
          if (continueSub) {
            continueSub.innerText = `[ Cuộn ${activeSave.slotId}: ${slotData.title || slotData.realm || 'Luyện Khí Kỳ'} • ${(slotData.score || 0).toLocaleString()} Tu Vi ]`;
          }
        }
        if (btnRestart) btnRestart.style.display = "inline-flex";
        if (btnStart) btnStart.style.display = "flex";
      } else {
        if (btnContinue) btnContinue.style.display = "none";
        if (btnRestart) btnRestart.style.display = "none";
        if (btnStart) btnStart.style.display = "flex";
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
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        }, 1200);
      } catch (err) {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `Chung_Dao_Kim_Do_Cap${(this.state && this.state.realmIdx) || 0}.png`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 500);
      }
      this.showStatus("[ 符 ] Đã xuất Chứng Đạo Kim Đồ thành công!");
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
      const realms = root.Meowcha?.CULTIVATION_REALMS || [];
      const realmData = realms[s.realmIdx] || realms[0] || { title: "Tiểu Miêu Kiếm Đồng", name: "Luyện Khí Kỳ" };

      // 1. Nền lụa tiên đạo thâm thúy
      const grad = ctx.createRadialGradient(600, 315, 80, 600, 315, 680);
      grad.addColorStop(0, "#0F172A");
      grad.addColorStop(0.7, "#090D16");
      grad.addColorStop(1, "#020408");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 630);

      // Hạt linh khí vàng kim lấp lánh
      for (let i = 0; i < 40; i++) {
        const sx = Math.sin(i * 99) * 580 + 600;
        const sy = Math.cos(i * 77) * 290 + 315;
        const sr = (i % 3) + 1;
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
      ctx.fillText("MEOW-CHA: VẠN KIẾM QUY TÔNG • TIÊN HIỆP TRÀ VIỆN", 600, 78);

      ctx.font = "900 36px 'Cinzel', serif";
      ctx.fillStyle = "#FDE047";
      ctx.shadowColor = "rgba(245, 158, 11, 0.75)";
      ctx.shadowBlur = 18;
      ctx.fillText("CHỨNG ĐẠO KIM ĐỒ", 600, 126);
      ctx.shadowBlur = 0;

      // 4. KHỐI BÊN TRÁI: ĐẠO QUẢ MIÊU TIÊN THẦN THÚ VECTƠ CHÂN THỰC (100% Vector Canvas)
      const cx = 250, cy = 345;
      ctx.save();

      // Vòng Bát Quái Tiên Luân phát sáng
      ctx.strokeStyle = "rgba(253, 224, 71, 0.65)";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#F59E0B";
      ctx.shadowBlur = 20;
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
      ctx.ellipse(cx, cy + 90, 85, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Thanh ngọc phi kiếm bên trái & bên phải
      [-110, 110].forEach((ox, sIdx) => {
        ctx.save();
        ctx.translate(cx + ox, cy - 10);
        ctx.fillStyle = sIdx === 0 ? "#67E8F9" : "#FDE047";
        ctx.shadowColor = sIdx === 0 ? "#0284C7" : "#F59E0B";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(0, -55);
        ctx.lineTo(8, -40);
        ctx.lineTo(6, 45);
        ctx.lineTo(-6, 45);
        ctx.lineTo(-8, -40);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#D4AF37";
        ctx.fillRect(-12, 45, 24, 5);
        ctx.fillRect(-3, 50, 6, 20);
        ctx.restore();
      });

      // Hai tai mèo
      ctx.fillStyle = "#F8FAFC";
      ctx.strokeStyle = "rgba(212, 175, 55, 0.7)";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(cx - 50, cy - 35);
      ctx.lineTo(cx - 72, cy - 105);
      ctx.lineTo(cx - 15, cy - 65);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + 50, cy - 35);
      ctx.lineTo(cx + 72, cy - 105);
      ctx.lineTo(cx + 15, cy - 65);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Lòng tai hồng
      ctx.fillStyle = "#F472B6";
      ctx.beginPath();
      ctx.moveTo(cx - 45, cy - 40);
      ctx.lineTo(cx - 64, cy - 95);
      ctx.lineTo(cx - 20, cy - 65);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx + 45, cy - 40);
      ctx.lineTo(cx + 64, cy - 95);
      ctx.lineTo(cx + 20, cy - 65);
      ctx.closePath();
      ctx.fill();

      // Khuôn mặt mèo tròn bầu bĩnh
      ctx.fillStyle = "#F8FAFC";
      ctx.beginPath();
      ctx.arc(cx, cy, 72, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Ngọc Quan / Trâm Cài Tiên Đạo
      ctx.fillStyle = "#FDE047";
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy - 70);
      ctx.lineTo(cx, cy - 88);
      ctx.lineTo(cx + 18, cy - 70);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#38BDF8";
      ctx.beginPath();
      ctx.arc(cx, cy - 73, 5, 0, Math.PI * 2);
      ctx.fill();

      // Ấn phù trán (Daoist Forehead Mark)
      ctx.fillStyle = "#EF4444";
      ctx.beginPath();
      ctx.ellipse(cx, cy - 25, 4.5, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Đôi mắt cười tiên miêu (^ ‿ ^)
      ctx.strokeStyle = "#1E1B4B";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(cx - 26, cy, 14, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx + 26, cy, 14, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // Mũi tam giác hồng
      ctx.fillStyle = "#FB7185";
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy + 12);
      ctx.lineTo(cx + 5, cy + 12);
      ctx.lineTo(cx, cy + 18);
      ctx.closePath();
      ctx.fill();

      // Miệng cười
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(cx - 7, cy + 20, 7, 0, Math.PI * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 7, cy + 20, 7, Math.PI * 0.1, Math.PI);
      ctx.stroke();

      // Má hồng đào
      ctx.fillStyle = "rgba(251, 113, 133, 0.45)";
      ctx.beginPath();
      ctx.arc(cx - 42, cy + 15, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 42, cy + 15, 11, 0, Math.PI * 2);
      ctx.fill();

      // Râu mèo 2 bên
      ctx.strokeStyle = "#94A3B8";
      ctx.lineWidth = 1.5;
      [-1, 1].forEach(side => {
        const bx = cx + side * 48;
        ctx.beginPath(); ctx.moveTo(bx, cy + 8); ctx.lineTo(bx + side * 30, cy + 3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx, cy + 16); ctx.lineTo(bx + side * 32, cy + 17); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx, cy + 24); ctx.lineTo(bx + side * 28, cy + 30); ctx.stroke();
      });

      ctx.restore();

      // 5. KHỐI BÊN PHẢI: BẢNG CHIẾN TÍCH TU CHÂN (CULTIVATION STATS)
      ctx.textAlign = "left";
      ctx.font = "900 24px 'Cinzel', serif";
      ctx.fillStyle = "#FEF3C7";
      ctx.fillText(`ĐẠO HIỆU: ${(realmData.title || '').toUpperCase()}`, 470, 215);

      ctx.font = "700 16px 'Be Vietnam Pro', sans-serif";
      ctx.fillStyle = "#67E8F9";
      ctx.fillText(`CẢNH GIỚI: ${realmData.name || 'Luyện Khí'} (CẤP ${s.realmIdx || 0})`, 470, 248);

      // Lưới thông số (Stats grid)
      const stats = [
        { label: "TU VI ĐẠO HẠNH", val: `${(s.score || 0).toLocaleString()} PTS`, color: "#FDE047" },
        { label: "CỔ NGỮ TRẢM DIỆT", val: `${s.wordsSlain || 0} TỪ VỰNG IELTS`, color: "#38BDF8" },
        { label: "KIẾM TỐC TRUY CẦU", val: `${Math.round(s.wpm || 0)} WPM`, color: "#34D399" },
        { label: "MAX COMBO CHUỖI", val: `x${s.maxCombo || s.combo || 1}`, color: "#C084FC" }
      ];

      stats.forEach((st, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const bx = 470 + col * 310;
        const by = 280 + row * 82;

        ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
        ctx.strokeStyle = "rgba(212, 175, 55, 0.35)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, 290, 68, 6);
        else ctx.rect(bx, by, 290, 68);
        ctx.fill();
        ctx.stroke();

        ctx.font = "600 11px 'Cinzel', sans-serif";
        ctx.fillStyle = "#94A3B8";
        ctx.fillText(st.label, bx + 14, by + 26);

        ctx.font = "900 20px 'Cinzel', serif";
        ctx.fillStyle = st.color;
        ctx.fillText(st.val, bx + 14, by + 53);
      });

      // Đạo Tâm Châm Ngôn & Dấu Triện Chu Sa
      ctx.font = "italic 13.5px 'Cinzel', serif";
      ctx.fillStyle = "#E2E8F0";
      ctx.fillText("“Ngụm trà đắng lắng ngàn kiếm ý • Chữ chữ khắc kim chứng đạo Bảng Vàng”", 470, 480);

      // Dấu Triện Chu Sa [ TIÊN ĐẠO CHỨNG NHẬN ]
      ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
      ctx.strokeStyle = "#EF4444";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(470, 508, 220, 42, 4);
      else ctx.rect(470, 508, 220, 42);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.font = "900 13px 'Cinzel', serif";
      ctx.fillStyle = "#EF4444";
      ctx.fillText("[ 极 品 ] TIÊN ĐẠO CHỨNG ĐẠO", 580, 534);

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
            <button class="btn-pronounce-speaker" data-word="${item.word}" title="Nghe phát âm chuẩn">
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
          this.speakWord(word);
        };
      });
    }

    speakWord(word) {
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
      try {
        let rawUser = localStorage.getItem("oasis_user");
        let token = localStorage.getItem("oasis_token");
        if (!rawUser && typeof window !== "undefined" && window.parent && window.parent !== window) {
          try {
            rawUser = window.parent.localStorage.getItem("oasis_user");
            token = window.parent.localStorage.getItem("oasis_token");
          } catch (crossErr) {}
        }
        if (rawUser) {
          const u = JSON.parse(rawUser);
          const name = u.full_name || u.name || u.username || (u.email ? u.email.split("@")[0] : "");
          let avatar = u.discord_avatar || u.avatar_url || u.avatar || u.image || "";
          return {
            name: name || "Tiểu Miêu Kiếm Sĩ",
            avatar: avatar || "./sprites/characters/realm0_qi_refining/poses/idle.png",
            token: token || "",
            isLoggedIn: true
          };
        }
      } catch (e) {}

      const localName = localStorage.getItem("meowcha_player_name") || "Tiểu Miêu Kiếm Sĩ";
      let fallbackToken = localStorage.getItem("oasis_token") || "";
      return {
        name: localName,
        avatar: "./sprites/characters/realm0_qi_refining/poses/idle.png",
        token: fallbackToken,
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
          localStorage.setItem("meowcha_high_score", String(bestScore));
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
        localStorage.setItem("meowcha_high_score", String(bestScore));
      } catch (e) {}

      this.saveSystem.saveGame(activeSlot, this.state);
      this.updateHUD();
      this.updateLobbyStats();
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
        const payload = {
          player_name: user.name.slice(0, 40),
          avatar_url: user.avatar && !user.avatar.includes("cat_idle.png") ? user.avatar : "",
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
            localStorage.setItem("meowcha_high_score", String(this.state.highScore));
          } catch (err) {}
          this.updateLobbyStats();
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
      if (selfAvatarEl) selfAvatarEl.src = user.avatar || "./sprites/characters/realm0_qi_refining/poses/idle.png";
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
              localStorage.setItem("meowcha_high_score", String(this.state.highScore));
            } catch (e) {}
            this.updatePantheonSelfStats();
            this.updateLobbyStats();
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
            // Ưu tiên hiển thị Avatar thực tế của User (Discord / Web Avatar)
            if (itemData.avatar_url && itemData.avatar_url.trim()) {
              avatarEl.src = itemData.avatar_url;
            } else {
              avatarEl.src = getAvatarByRealm(itemData.realm, itemData.score || 0);
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
              <img src="${avatarSrc}" class="user-row-avatar" alt="Avatar" onerror="this.src='./sprites/characters/realm0_qi_refining/poses/idle.png'" />
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
      const realms = (typeof window !== "undefined" && window.Meowcha && window.Meowcha.CULTIVATION_REALMS) || [];
      const realmData = realms[this.state.realmIdx] || realms[0];

      const bannerTag = document.getElementById("profileModalBannerTag");
      if (bannerTag) bannerTag.innerText = bannerText;

      const titleEl = document.getElementById("profileModalTitle");
      if (titleEl) titleEl.innerText = realmData.title || "Tiểu Miêu Kiếm Đồng";

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
        avatarEl.src = avatars[Math.min(4, this.state.realmIdx)] || avatars[0];
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
