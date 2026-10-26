/**
 * UIManager.js - Quản Lý Toàn Bộ Giao Diện & Hộp Thoại (HUD & Modals)
 * Điều khiển thanh HP đan điền, tu vi, đếm combo, modal Ngọc Giản, đột phá thiên phú và Phong Thần Bảng
 */
(function(root) {
  const escapeHTML = value => String(value == null ? '' : value).replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DEFAULT_AVATAR = './assets/ui/mascot_daoist_master.png';
  const safeAvatar = value => {
    const url = String(value || '').trim();
    return /^https:\/\/[^\s<>"']+$/i.test(url) || /^\/(?!\/)[^\s<>"']+$/.test(url) ? url : '';
  };
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
      this.refreshAccountAvatar();
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
      const homeLink = document.getElementById('btnBackToGames');
      if (homeLink) homeLink.onclick = (event) => {
        event.preventDefault();
        this.showStatus('Đang trở về sảnh trò chơi…');
        if (this.state.currentScene === 'BATTLE') this.saveSystem.saveGame(this.state.activeSlotId || 1, this.state);
        if (root.parent && root.parent !== root) root.parent.postMessage({ type:'MEOWCHA_NAVIGATE', path:'/games' }, root.location.origin);
        else root.location.assign('/games');
      };
      const allWords = document.getElementById('btnVaultAllWords');
      if (allWords) allWords.onclick = () => {
        this.setVaultBand(null);
        this.showStatus('Đã mở toàn bộ từ điển Oxford. Bạn có thể tìm kiếm hoặc tải thêm từ.');
      };
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
            const band = btn.getAttribute("data-band") === 'all' ? null : parseInt(btn.getAttribute("data-band"), 10);
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

      const resolveSave=document.getElementById('btnResolveSaveConflict');
      if(resolveSave)resolveSave.onclick=()=>this.showSavesModal();

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
          this.showConfirm(`TRÙNG TU TỪ ĐẦU [${modeName.toUpperCase()}]?`, `Đạo hữu sẽ bắt đầu lại pháp môn ${modeName} từ Luyện Khí Kỳ 0 điểm. Kỷ lục tu vi vẫn được bảo lưu vinh danh Bảng Phong Thần.`, () => {
            const curSlotId = (this.state && this.state.activeSlotId) || (this.saveSystem && this.saveSystem.getActiveSlotId()) || 1;
            this.finishSavedMode(curSlotId, curMode);
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
          this.showConfirm("TRÙNG TU TỪ ĐẦU?", "Chiến tích cao nhất sẽ được khắc bia Bảng Phong Thần. Tiến trình tu luyện hiện tại sẽ bắt đầu lại từ đầu. Đạo hữu có chắc chắn?", () => {
            this.performPurificationRebirth(() => {
              this.hidePauseModal();
              this.audio.play("chime");
              this.showStatus("[ 丹 ] [TRÙNG TU TỪ ĐẦU] Kỷ lục đã vinh danh Bảng Phong Thần! Đã khởi tạo lại đạo quả!");
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
      const profileDismiss=document.getElementById('btnProfileDismiss');
      if(profileDismiss)profileDismiss.onclick=()=>this.hideProfileModal();
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

      // Nút Rút lui về Lobby (Thu Thuyền Về Sảnh)
      const btnExitLobby = document.getElementById("btnQuitToLobby") || document.getElementById("btnExitToLobby");
      if (btnExitLobby) {
        const handleQuitAction = (e) => {
          if (e) {
            try { e.preventDefault(); e.stopPropagation(); } catch (_) {}
          }
          this.saveSystem.saveGame(this.state.activeSlotId || 1, this.state);
          try { this.hidePauseModal(); } catch (_) {}
          if (this.onReturnLobby) {
            try {
              this.onReturnLobby();
            } catch (err) {
              console.error("[Meowcha UI] onReturnLobby error:", err);
              this.showScene("LOBBY");
            }
          } else {
            this.showScene("LOBBY");
          }
        };
        btnExitLobby.onclick = handleQuitAction;

      }

      // Nút Trọng Sinh Trận Mới (Game Over -> Chơi lại ngay lập tức sạch sẽ từ Luyện Khí sơ kỳ)
      const btnRebirth=document.getElementById('btnRebirth');
      const btnReturnLobbyGameOver=document.getElementById('btnReturnLobbyGameOver');
      if(btnRebirth)btnRebirth.onclick=event=>{event.preventDefault();this.finishGameOver(true);};
      if(btnReturnLobbyGameOver)btnReturnLobbyGameOver.onclick=event=>{event.preventDefault();this.finishGameOver(false);};
      const audioOpen=document.getElementById('btnAudioSettings'),audioClose=document.getElementById('btnCloseAudioSettings');
      if(audioOpen)audioOpen.onclick=()=>this.showAudioSettings();
      document.querySelectorAll('[data-audio-volume]').forEach(input=>{
        input.oninput=()=>{this.audio.setVolume(input.dataset.audioVolume,Number(input.value)/100);this.updateAudioSettings();};
      });
      if(audioClose)audioClose.onclick=()=>{document.getElementById('modalAudioSettings').style.display='none';};
      const soundSwitch=document.getElementById('audioMasterEnabled'),recover=document.getElementById('btnAudioRecover');
      if(soundSwitch)soundSwitch.onchange=()=>{if(soundSwitch.checked)this.audio.enableSound();else if(this.audio.soundEnabled)this.audio.toggleSound();this.updateAudioSettings();};
      if(recover)recover.onclick=()=>{this.audio.enableSound();this.updateAudioSettings();this.showStatus('Đã khôi phục nhạc và hiệu ứng. Phát âm tiếp tục khi vào trận.');};
      const testAudio=document.getElementById('btnAudioTest');
      if(testAudio)testAudio.onclick=()=>{
        this.audio.enableSound();
        if(this.audio.volumes.master===0||this.audio.volumes.sfx===0){this.showStatus('Âm thanh tổng hoặc Hiệu ứng đang ở 0%. Hãy tăng thanh âm lượng để nghe thử.');return;}
        const sequence=this._audioTest=(this._audioTest||0)+1;
        [['Gõ đúng','type_correct'],['Gõ sai','wrong_key'],['Ma thạch nổ','meteor_crack'],['Ma vân tụ khí','cloud_enter'],['Choáng','stun'],['Định thần','stun_end']].forEach(([label,event],i)=>setTimeout(()=>{
          if(sequence!==this._audioTest||document.getElementById('modalAudioSettings').style.display==='none'||!this.audio.soundEnabled)return;
          this.audio.play(event);this.showStatus('Nghe thử: '+label,700);
        },i*750));
      };

      const btnToggleSound = document.getElementById('btnToggleSound');
      const btnToggleSoundLobby = document.getElementById('btnToggleSoundLobby');
      const updateSoundUI = () => {
        const active = this.audio.soundEnabled && this.audio.ctx && this.audio.ctx.state === 'running' && this.audio.zenMusicPlaying;
        for (const button of [btnToggleSound, btnToggleSoundLobby].filter(Boolean)) {
          button.classList.toggle('muted', !active);
          button.setAttribute('aria-pressed', String(!!active));
          button.setAttribute('aria-label', active ? 'Tắt âm thanh' : 'Bật âm thanh');
          button.title = active ? 'Âm thanh đang bật • Bấm để tắt' : 'Âm thanh đang tắt hoặc bị ngắt • Bấm để bật';
        }
        const label = btnToggleSoundLobby && btnToggleSoundLobby.querySelector('.medallion-label');
        if (label) label.textContent = active ? 'Âm bật' : 'Âm tắt';
      };
      const toggle = () => {
        const active = this.audio.soundEnabled && this.audio.ctx && this.audio.ctx.state === 'running' && this.audio.zenMusicPlaying;
        if (active) this.audio.toggleSound(); else this.audio.enableSound();
        updateSoundUI();
        this.showStatus(active ? 'Đã tắt nhạc, hiệu ứng và phát âm.' : 'Đang bật nhạc, hiệu ứng và phát âm…');
      };
      if (btnToggleSoundLobby) btnToggleSoundLobby.onclick = toggle;
      if (btnToggleSound) btnToggleSound.onclick = toggle;
      this.audio.onStatusChange = () => {
        updateSoundUI();
        this.updateAudioSettings();
        if (this.audio.lastError) this.showStatus(this.audio.lastError, 6000);
      };
      updateSoundUI();

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
        reading_academic: 'Từ vựng học thuật',
        flashcard_srs: 'Tái Hiện SRS Sổ Tay Tôi Luyện'
      };
      if (this.audio) this.audio.play('chime');
      this.showStatus(`[ TÀNG KINH CÁC ] Đã chọn ${deckNames[deckId] || deckId}`);
    }

    finishSavedMode(slotId, mode) {
      const saved = this.saveSystem.getSlotModeData(slotId, mode);
      if (!saved || !saved.runId || !saved.words) return;
      const captured = Object.assign(new root.Meowcha.GameState(), saved, {
        gameMode: mode, wordsSlain: saved.words, activeElapsedMs: saved.activeElapsedMs || 0
      });
      this.saveSystem.submitRun(captured);
    }

    openBattleSetupModal() {
      const modal = document.getElementById("modalBattleSetup");
      if (!modal) return;
      if (this.state.currentScene === 'BATTLE') {
        this.saveSystem.saveGame(this.state.activeSlotId, this.state);
        this.state.isPaused = true;
      }

      const curSlotId = (this.state && this.state.activeSlotId) || (this.saveSystem && this.saveSystem.getActiveSlotId()) || 1;
      let selectedMode = (this.state && this.state.gameMode) || "DIRECT";

      const updateSetupUI = () => {
        // Highlight mode cards
        modal.querySelectorAll(".setup-mode-card").forEach(card => {
          card.classList.toggle("active-mode", card.getAttribute("data-mode") === selectedMode);
          card.setAttribute('aria-pressed', String(card.getAttribute('data-mode') === selectedMode));
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
                <button class="sword-token-btn launch-flame" id="btnSetupStartFresh" data-sword-primary="${hasProgress ? 'false' : 'true'}">
                  <div class="sword-token-glow"></div>
                  <div class="sword-token-hilt"><svg width="26" height="26" viewBox="0 0 512 512" fill="#FEF08A"><path d="M491.313 21.406C331.102 120.193 194.688 226.866 70 350.906c29.11-21.616 63.387-37.86 103.875-49.28 40.95-60.157 100.923-106.7 170.844-130.157-23.522 69.8-70.747 130.135-131.314 171.25-9.76 38.353-26.835 69.38-48 96.374C289.153 314.63 403.748 181.7 491.312 21.406zM132.656 345.5v.344c-30.526 52.844-71.12 87.318-115.437 115.47-4.89 28.29 9.777 39.067 34.75 34.56 30.594-51.69 68.69-88.052 115.436-115.468 0-19.56-12.363-34.906-34.75-34.906z"/></svg></div><div class="sword-token-content"><span class="sword-token-main" style="color: #FEF08A">KHỞI MỞ TRẬN MỚI</span>
                    <span class="sword-token-sub">[ Bắt Đầu Từ Luyện Khí sơ kỳ • Khí Huyết 50/50 ]</span>
                  </div>
                  <div class="sword-token-tip">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FEF08A" stroke-width="2.5"><polygon points="4 4 20 12 4 20 7 12" fill="rgba(239,68,68,0.4)"></polygon></svg>
                  </div>
                </button>
                <button class="sword-token-btn continue-green" id="btnSetupContinue" data-sword-primary="true">
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
              this.finishSavedMode(curSlotId, selectedMode);
              this.state.gameMode = selectedMode;
              this.saveSystem.resetActiveSave(curSlotId, selectedMode);
              this.state.resetForNewMode(selectedMode);
              this.closeBattleSetupModal();
              this.updateLobbyButtons();
              this.updateHUD();
              this.audio.play("slash");
              this.showStatus(`KHỞI MỞ TRẬN MỚI • Bắt đầu ván mới pháp môn ${mName} từ Luyện Khí sơ kỳ!`);
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
            detailEl.innerHTML = `<span style="color:#F3C644">Khởi Nguyên Tu Vi:</span> Khởi đầu từ <b>Luyện Khí Kỳ (Luyện Khí sơ kỳ - 0 Tu Vi)</b>`;
          }
          if (actionsRow) {
            actionsRow.innerHTML = `
              ${leftMascotSvg}
              <button class="sword-token-btn launch-flame" id="btnSetupStartFresh" data-sword-primary="${hasProgress ? 'false' : 'true'}">
                <div class="sword-token-glow"></div>
                <div class="sword-token-hilt"><svg width="28" height="28" viewBox="0 0 512 512" fill="#FEF08A"><path d="M491.313 21.406C331.102 120.193 194.688 226.866 70 350.906c29.11-21.616 63.387-37.86 103.875-49.28 40.95-60.157 100.923-106.7 170.844-130.157-23.522 69.8-70.747 130.135-131.314 171.25-9.76 38.353-26.835 69.38-48 96.374C289.153 314.63 403.748 181.7 491.312 21.406zM132.656 345.5v.344c-30.526 52.844-71.12 87.318-115.437 115.47-4.89 28.29 9.777 39.067 34.75 34.56 30.594-51.69 68.69-88.052 115.436-115.468 0-19.56-12.363-34.906-34.75-34.906z"/></svg></div>
                <div class="sword-token-content">
                  <div class="sword-token-title-row">
                    <span class="sword-token-main" style="color: #FEF08A">KHAI TRẬN TRẢM MA</span>
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
              this.showStatus(`KHAI TRẬN TRẢM MA • Pháp môn ${mName}!`);
              if (this.onStartBattle) this.onStartBattle();
            };
          }
        }
      };

      // Gắn sự kiện chọn Pháp Môn
      modal.querySelectorAll(".setup-mode-card").forEach(card => {
        card.setAttribute('role', 'button');
        card.tabIndex = 0;
        card.onkeydown = event => { if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); card.click(); } };
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
      if (this.state.currentScene === 'BATTLE') this.state.isPaused = false;
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

    showStatus(msg, durationMs = 4200) {
      if (!this.statusBar) return;
      // Escape modal stacking contexts; feedback must remain visible above every dialog.
      if (this.statusBar.parentElement !== document.body) document.body.appendChild(this.statusBar);
      this.statusBar.setAttribute('role', 'status');
      this.statusBar.setAttribute('aria-live', 'polite');
      this.statusBar.setAttribute('aria-atomic', 'true');
      this.statusBar.textContent = msg;
      this.statusBar.classList.add('show');
      clearTimeout(this.statusTimer);
      this.statusTimer = setTimeout(() => this.statusBar.classList.remove('show'), durationMs);
    }

    updateHUD() {
      this.updateActiveSkillsHUD();
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
      const progress=document.getElementById('battleProgressSummary');
      if(progress)progress.textContent=(s.humanWords||0)+' từ • Chính xác '+s.accuracy+'%';

      // Danh hiệu Cảnh Giới & Cấp Độ
      if (this.hudLevelBadge) {
        this.hudLevelBadge.innerText = realmData.name;
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
        this.hudWpm.innerText = `${s.wpm} WPM`;
        this.hudWpm.title = 'Tốc độ tự gõ: ký tự đúng / 5 / phút luyện tập';
      }

      // Cập nhật thông số Sảnh Thiền Định (Tầng 2: Mini Jade HP Bar, Tu Vi, Cổ Ngữ, Kiếm Tốc)
      if (this.lobbyScoreText) this.lobbyScoreText.innerText = s.score.toLocaleString();
      const lobbyHighScoreEl = document.getElementById("lobbyHighScoreText");
      if (lobbyHighScoreEl) {
        const best = Math.max(s.highScore || 0, s.score || 0);
        lobbyHighScoreEl.innerText = `Kỷ Lục: ${best.toLocaleString()} Tu Vi`;
      }
      if (this.lobbyWordsText) this.lobbyWordsText.innerText = `${s.wordsSlain} Từ`;
      if (this.lobbyHpText) this.lobbyHpText.innerText = `${s.hp} / ${s.maxHp}`;
      if (this.lobbyHpBar) {
        const hpPct = Math.max(0, Math.min(100, (s.hp / (s.maxHp || 50)) * 100));
        this.lobbyHpBar.style.width = `${hpPct}%`;
      }
      if (this.lobbyWpmText) this.lobbyWpmText.innerText = `${Math.round(s.wpm || 0)} WPM`;
      if (this.lobbyCatTitle) this.lobbyCatTitle.innerText = realmData.title;
      if (this.lobbyLevelTag) this.lobbyLevelTag.innerText = realmData.name;

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
        const bounds=[[64,154,296,325],[25,47,335,327],[73,110,288,330],[48,110,313,330],[83,113,278,330]][rIdx];
        const stage=lobbyCatImg.closest('.lobby-stage');
        if(stage){const height=bounds[3]-bounds[1];stage.style.setProperty('--lobby-sprite-ratio',360/height);stage.style.setProperty('--lobby-sprite-center',(bounds[0]+bounds[2])/2/height);stage.style.setProperty('--lobby-sprite-gap',(360-bounds[3])/height);}
        lobbyCatImg.alt=realmData.title;
        lobbyCatImg.referrerPolicy = "no-referrer";
        lobbyCatImg.onerror = () => {
          lobbyCatImg.onerror = null;
          lobbyCatImg.src = "./sprites/characters/realm0_qi_refining/poses/idle.png";
        };
        if (lobbyCatImg.getAttribute("src") !== targetSrc) {
          lobbyCatImg.src = targetSrc;
        }
      }

      const user = this.getLoggedInUser();
      const topAvatarEl = document.getElementById("lobbyUserAvatar");
      const topNameLabel = document.getElementById("lobbyUserNameLabel");
      this.setUserAvatar(topAvatarEl, user.avatar);
      if (topNameLabel && user.isLoggedIn && user.name) {
        topNameLabel.innerText = user.name.length > 9 ? user.name.slice(0, 8) + "…" : user.name;
      }

      if(this.state.currentScene==='LOBBY'){
        this.updateMonolithLocks();
        this.updateLobbyButtons();
      }
    }

    updateLobbyButtons() {
      this.updateSaveSyncNotice();
      const btnStart = document.getElementById("btnStartBattle");
      const btnContinue = document.getElementById("btnContinueBattle");
      const btnRestart = document.getElementById("btnRestartGame");
      const continueSub = document.getElementById("continueBattleSub");
      const startBtnText = btnStart ? (btnStart.querySelector(".sword-cta-main") || btnStart.querySelector(".btn-xianxia-text") || btnStart.querySelector(".cta-title") || btnStart) : null;

      const curMode = (this.state && this.state.gameMode) || "DIRECT";
      const curSlotId = (this.state && this.state.activeSlotId) || (this.saveSystem && this.saveSystem.getActiveSlotId()) || 1;
      const modeData = this.saveSystem && this.saveSystem.getSlotModeData && this.saveSystem.getSlotModeData(curSlotId, curMode);

      const hasModeProgress = Boolean(modeData && modeData.isOccupied && modeData.hp > 0 && (modeData.score > 0 || modeData.realmIdx > 0 || modeData.words > 0));
      if (btnStart) {btnStart.classList.toggle("change-mode", hasModeProgress);btnStart.dataset.uiAction=hasModeProgress?'secondary':'hero';}

      const modeLabels = {
        DIRECT: "Trực Diện Trảm Ma",
        CLOZE:  "Ngộ Đạo Thông Linh",
        AUDIO:  "Thính Lôi Biện Âm"
      };
      const modeName = modeLabels[curMode] || curMode;

      const startBtnSub = document.getElementById("startBattleSub") || (btnStart ? btnStart.querySelector(".sword-cta-sub") : null);

      if (hasModeProgress) {
        if (btnContinue) {
          btnContinue.hidden = false;
          btnContinue.disabled = false;
          btnContinue.style.display = "flex";
          if (continueSub) {
            continueSub.innerText = `${(modeData.score || 0).toLocaleString()} Tu Vi`;
          }
        }
        if (btnRestart) {
          btnRestart.style.display = "inline-flex";
        }
        if (btnStart) {
          btnStart.style.display = "flex";
          if (startBtnText && startBtnText !== btnStart) {
            startBtnText.innerText = "ĐỔI PHÁP MÔN";
          }
          if (startBtnSub) {
            startBtnSub.innerText = modeName;
          }
        }
      } else {
        if (btnContinue) { btnContinue.hidden = true; btnContinue.disabled = true; btnContinue.style.display = "none"; }
        if (btnRestart) btnRestart.style.display = "none";
        if (btnStart) {
          btnStart.style.display = "flex";
          if (startBtnText && startBtnText !== btnStart) {
            startBtnText.innerText = "VÀO TRẬN ĐỘ KIẾP";
          }
          if (startBtnSub) {
            startBtnSub.innerText = modeName;
          }
        }
      }
    }

    updateSaveSyncNotice(){
      const notice=document.getElementById('lobbySyncNotice');if(!notice)return;
      const ids=[1,2,3].filter(id=>this.saveSystem.getSlot(id).cloudConflict);
      notice.hidden=!ids.length;
      const detail=document.getElementById('lobbySyncDetail');
      const text='Ngọc Giản '+ids.join(', ')+' • Bản trên máy vẫn được giữ.';
      if(detail&&detail.textContent!==text)detail.textContent=text;
    }

    showScene(scene) {
      this.state.currentScene = scene;
      document.documentElement.classList.toggle('scene-battle', scene === 'BATTLE');
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

        if(slot.cloudConflict){
          const notice=document.createElement('p');notice.className='slot-conflict-note';
          notice.textContent='Có bản máy chủ khác • Bản trên máy này vẫn được giữ.';card.appendChild(notice);
          if(!inBattle){
            const compare=document.createElement('button');compare.type='button';compare.className='mc-utility';compare.textContent='Đối chiếu hai bản';
            const comparison=document.createElement('div');comparison.className='slot-comparison';comparison.hidden=true;
            compare.onclick=async()=>{
              comparison.hidden=false;comparison.textContent='Đang tải bản máy chủ…';compare.disabled=true;
              try{
                const remote=await this.saveSystem.readCloudSlot(i);
                comparison.textContent='';
                for(const [label,snapshot] of [['Máy này',this.saveSystem.getSlot(i)],['Máy chủ',remote.snapshot]]){
                  const p=document.createElement('p');p.textContent=label+': '+this.describeSaveSnapshot(snapshot);comparison.appendChild(p);
                }
                for(const [label,cloud] of [['Chọn bản máy này',false],['Chọn bản máy chủ',true]]){
                  const choose=document.createElement('button');choose.type='button';choose.className='mc-utility';choose.textContent=label;
                  choose.onclick=()=>this.showConfirm(label+'?',
                    'Bản còn lại được giữ trong Bản sao an toàn. Cả ba pháp môn thuộc ngọc giản này sẽ chuyển theo bản được chọn.',async()=>{
                      try{
                        if(cloud)await this.saveSystem.useCloudSnapshot(i,remote.revision);
                        else await this.saveSystem.useLocalSnapshot(i,remote.revision);
                        this.applyReconciledSlot(i);this.showStatus('Đã chọn bản lưu và giữ bản còn lại trong Bản sao an toàn.');
                      }catch(error){this.showStatus(error.message||'Chưa chọn được. Hai bản vẫn được giữ.');compare.disabled=false;}
                    },'ĐỂ SAU','CHỌN BẢN NÀY');
                  comparison.appendChild(choose);
                }
              }catch(error){comparison.textContent=error.message||'Chưa tải được. Hãy thử lại.';}
              finally{compare.disabled=false;}
            };
            card.appendChild(compare);card.appendChild(comparison);
          }
        }
        if(!inBattle&&!slot.cloudConflict&&this.saveSystem.getRecovery?.(i)){
          const cloud=document.createElement('button');cloud.type='button';cloud.className='mc-utility';cloud.textContent='Đối chiếu • Dùng bản máy chủ';
          cloud.onclick=()=>this.showConfirm('Dùng đạo quả máy chủ?',
            'Bản trên máy này sẽ được giữ trong Bản sao an toàn trước khi chuyển sang bản máy chủ.',async()=>{
              try{await this.saveSystem.useCloudSnapshot(i);this.applyReconciledSlot(i);this.showStatus('Đã dùng bản máy chủ. Bản máy cũ còn trong Bản sao an toàn.');}
              catch(error){this.showStatus(error.message||'Chưa đối chiếu được. Hai bản vẫn được giữ.');}
            },'GIỮ BẢN MÁY','DÙNG MÁY CHỦ');
          card.appendChild(cloud);
          if(this.saveSystem.getRecovery(i)){
            const restore=document.createElement('button');restore.type='button';restore.className='mc-utility';restore.textContent='Bản sao an toàn • Khôi phục';
            restore.onclick=()=>this.showConfirm('Khôi phục bản sao an toàn?',
              'Bản đang dùng sẽ được sao lại. Bản sao được chọn sẽ thành tiến trình đang chơi và đồng bộ khi phiên bản máy chủ còn khớp.',()=>{
                try{this.saveSystem.restoreRecovery(i);this.applyReconciledSlot(i);this.showStatus('Đã khôi phục bản sao an toàn.');}
                catch(_){this.showStatus('Chưa khôi phục được; các bản sao vẫn được giữ.');}
              },'GIỮ HIỆN TẠI','KHÔI PHỤC');
            card.appendChild(restore);
          }
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

    applyReconciledSlot(slotId){
      this.state.loadFromSlot(this.saveSystem.getSlot(slotId));this.state.activeSlotId=slotId;
      this.saveSystem.setActiveSlotId(slotId);this.renderSaveSlotsUI();this.updateHUD();this.updateLobbyButtons();
    }

    describeSaveSnapshot(snapshot){
      const labels={DIRECT:'Trực Diện',CLOZE:'Ngộ Đạo',AUDIO:'Thính Âm'};
      const modes=snapshot.modes||{[snapshot.activeMode||'DIRECT']:snapshot};
      const progress=Object.entries(labels).filter(([mode])=>modes[mode]?.isOccupied||modes[mode]?.score>0)
        .map(([mode,label])=>label+' '+Math.max(0,Number(modes[mode].score)||0).toLocaleString('vi-VN')+' Tu Vi');
      const date=Number(snapshot.updatedAt)>0?new Date(snapshot.updatedAt).toLocaleString('vi-VN'):'';
      return (progress.join(' • ')||'Chưa có tiến trình')+(date?' • '+date:'');
    }

    showTalentModal(talents, targetRealm, onSelect) {
      if (!this.modalBreakthrough) return;
      let choiceMade=false;
      const selectChoice=talent=>{
        if(choiceMade)return;
        choiceMade=true;
        this.hideTalentModal();
        if(onSelect)onSelect(talent);
      };
      const cardsContainer = document.getElementById("breakthroughTalentsList");
      const titleEl = document.getElementById("breakthroughRealmTitle");

      if (titleEl) {
        titleEl.innerText = targetRealm ? `Cơ duyên ngộ đạo • ${targetRealm.name || ''}` : 'Cơ duyên ngộ đạo';
      }

      if (cardsContainer) {
        cardsContainer.innerHTML = "";
        const oldReview = this.modalBreakthrough.querySelector('.boss-review-note');
        if (oldReview) oldReview.remove();
        if (this.state.lastBossReview) {
          const review = document.createElement('details'); review.className = 'practice-summary boss-review-note';
          const caption=document.createElement('summary');caption.textContent='Ôn lại ba từ gần nghĩa';review.appendChild(caption);
          const note = document.createElement('p'); note.textContent = 'Từ gần nghĩa theo ngữ cảnh; không phải lúc nào cũng thay thế được cho nhau.';
          review.appendChild(note);
          for (const item of this.state.lastBossReview) {
            const line = document.createElement('p'); line.textContent = `${item.word}: ${item.meaning}. ${item.example}`;
            review.appendChild(line);
          }
          cardsContainer.parentNode.insertBefore(review, cardsContainer);
        }
        talents.forEach((talent, idx) => {
          const card = document.createElement("div");
          card.className = "perk-card talent-card animate-card-pop";
          card.style.animationDelay = `${idx * 150}ms`;

          const pathMap = {
            KIEM_DAO: "Kiếm Đạo",
            HO_DAO: "Hộ Đạo",
            LINH_VUC: "Linh Vực",
            NGO_DAO: "Ngộ Đạo"
          };
          const pathName = pathMap[talent.category] || talent.type || "Cơ Duyên";
          const kindName = talent.kind === "ACTIVE" ? "CHỦ ĐỘNG" : talent.kind === "ULTIMATE" ? "THẦN THÔNG TỐI CAO" : talent.kind === "PASSIVE_ACTIVE" ? "CHỦ / BỊ ĐỘNG" : "BỊ ĐỘNG";
          const rarityBadge = talent.rarityName || talent.rarity || "LINH PHẨM";
          const rarityCol = talent.rarityColor || "#38BDF8";

          const iconHtml = root.Meowcha.pixelIcon(talent.iconSvg, 'perk-icon-art');

          card.innerHTML = `
            <div class="perk-card-top-badges">
              <span class="perk-rarity-pill" style="border-color: ${rarityCol}; color: ${rarityCol};">${rarityBadge}</span>
              <span class="perk-path-pill">[ ${pathName} ]</span>
              <span class="perk-kind-pill">${kindName}</span>
            </div>
            <div class="perk-icon-wrapper">
              ${iconHtml}
            </div>
            <div class="perk-name" style="color: ${rarityCol};">${talent.name}</div>
            ${talent.statChange ? `<div class="perk-stat-change">${talent.statChange}</div>` : ""}
            <div class="perk-desc">${talent.desc}</div>
            <details class="perk-mobile-details"><summary>Chi tiết</summary><p>${escapeHTML(talent.desc)}</p></details>
            <button class="btn-linh-ngo" type="button" aria-label="Lĩnh ngộ ${escapeHTML(talent.name)}">
              Lĩnh ngộ <span class="hotkey-badge">${idx + 1}</span>
            </button>
          `;

          card.onclick = () => selectChoice(talent);

          cardsContainer.appendChild(card);
        });
      }

      this.modalBreakthrough.style.display = "flex";
      if(root.Meowcha.applyDesignSystem)root.Meowcha.applyDesignSystem(this.modalBreakthrough);

      // Hỗ trợ phím tắt 1, 2, 3
      if (this._talentKeyHandler) window.removeEventListener('keydown', this._talentKeyHandler);
      const keyHandler = (e) => {
        if(e.ctrlKey||e.altKey||e.metaKey||e.repeat||e.isComposing)return;
        const keyNum = parseInt(e.key, 10);
        if (keyNum >= 1 && keyNum <= talents.length) {
          window.removeEventListener("keydown", keyHandler);
          selectChoice(talents[keyNum - 1]);
        }
      };
      this._talentKeyHandler = keyHandler;
      window.addEventListener("keydown", keyHandler);
    }

    hideTalentModal() {
      if (this._talentKeyHandler) window.removeEventListener('keydown', this._talentKeyHandler);
      this._talentKeyHandler = null;
      if (this.modalBreakthrough) this.modalBreakthrough.style.display = "none";
          this.updateActiveSkillsHUD();
    }

    updateActiveSkillsHUD() {
      const container = document.getElementById("battleActiveSkillsBar");
      if (!container) return;
      if (this.state.currentScene !== "BATTLE" || this.state.isGameOver) {
        container.style.display = "none";
        return;
      }
      container.style.display = "flex";

      const M = root.Meowcha || {};
      const skillsDef = M.BREAKTHROUGH_SKILLS || {};
      const unlocked = this.state.unlockedSkills || [];
      const levels = this.state.skillLevels || {};

      const slotList = [
        { slot: 1, id: "WIND_SWORD_DOMAIN", defaultName: "Thanh Phong", icon: "winged-sword" },
        { slot: 2, id: "GOLDEN_CORE_REGEN", defaultName: "Kim Đan", icon: "cauldron" },
        { slot: 3, id: "NASCENT_SOUL_FREEZE", defaultName: "Định Thân", icon: "yin-yang" },
        { slot: 4, id: "TEN_THOUSAND_SWORDS", defaultName: "Vạn Kiếm", icon: "broadsword" }
      ];

      const equipped = this.state.getActiveSkillSlots();
      const command=document.getElementById('battleCommandDock');
      if(command)command.classList.toggle('has-active-skills',equipped.length>0);
      const activeSlots = equipped.map((id, i) => ({ ...slotList.find(s => s.id === id), slot: i + 1 }));

      if (activeSlots.length === 0) {
        container.innerHTML = "";
        container.style.display='none';
        return;
      }

      let html = "";
      for (const item of activeSlots) {
        const sDef = skillsDef[item.id] || {};
        const cd = Math.max(0, (this.state.skillCooldowns && this.state.skillCooldowns[item.id]) || 0);
        const isReady = this.state.canActivateSkill(item.id);
        const lv = (levels[item.id]) || 1;
        const isUltimate = item.slot === 4;

        html += `
          <button class="active-skill-btn ${isReady ? 'ready-glow' : 'on-cooldown'} ${isUltimate ? 'ultimate-skill' : ''}"
            data-slot="${item.slot}" data-skill="${item.id}" type="button" ${isReady ? '' : 'disabled'}
            aria-label="${sDef.name || item.defaultName} • Phím ${item.slot} • ${cd > 0 ? 'Còn ' + Math.ceil(cd) + ' giây' : isReady ? 'Sẵn sàng' : item.id === 'GOLDEN_CORE_REGEN' ? 'Đầy Khí Huyết' : 'Cần combo 10'}"
            title="${sDef.name || item.defaultName} [ Phím ${item.slot} ]">
            <div class="skill-hotkey-badge">[ ${item.slot} ]</div>
            <div class="skill-level-badge">Lv.${lv}</div>
            <div class="skill-icon-wrap">
              ${root.Meowcha.pixelIcon(item.icon, 'skill-pixel-icon')}
            </div>
            <div class="skill-name-label">${sDef.name ? sDef.name.split(' ')[0] : item.defaultName}</div>
            <progress class="skill-cooldown-progress" max="100" value="${Math.floor(100 * Math.max(0, 1 - cd / (((sDef.levels || [])[lv - 1] || {}).cd || 40)))}" aria-label="Tiến độ hồi kỹ năng"></progress>
            ${!isReady && cd > 0 ? `<div class="skill-cooldown-overlay"><span class="cd-num">${Math.ceil(cd)}s</span></div>` : ''}
            ${!isReady && cd <= 0 && isUltimate ? `<div class="skill-cooldown-overlay req-combo"><span class="cd-num">x10</span></div>` : ''}
          </button>
        `;
      }

      if (container.dataset.renderedHtml !== html) {
        container.innerHTML = html;
        container.dataset.renderedHtml = html;

        container.querySelectorAll(".active-skill-btn").forEach(btn => {
          btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const slot = parseInt(btn.dataset.slot, 10);
            const app=root.Meowcha.app;
            if (app&&app.typing&&app.gameState===this.state) {
              app.typing.activateSkillBySlot(slot,app.canvas);
            } else if (this.state && this.state.activateSkill) {
              const skillId = btn.dataset.skill;
              this.state.activateSkill(skillId, null, this.audio);
            }
          };
        });
      }
    }

    togglePause() {
      const record=document.getElementById('lastLearnedWord');
      if(record?.open){record.open=false;return;}
      this.setPause(!this.state.isPaused);
    }

    setPause(paused) {
      if (this.state.setPaused) this.state.setPaused(paused);
      else this.state.isPaused = paused;
      if (this.audio.pauseVoice) this.audio.pauseVoice(paused);
      this.audio.play(paused ? 'pause' : 'resume');
      if (!this.modalPause) return;
      this.modalPause.style.display = paused ? 'flex' : 'none';
      if (!paused) return;
      const s = this.state;
      s.calculateWPM();
      const summary = document.getElementById('typingPracticeStats');
      if (!summary) return;
      const seconds = Math.floor(s.activeElapsedMs / 1000);
      const stats = [
        ['Kiếm Chuẩn', s.accuracy + '%'], ['Kiếm Tốc', s.wpm + ' WPM'],
        ['Liên Trảm', s.maxCombo || 0], ['Từ Đã Luyện', s.humanWords || 0],
        ['Thời Gian', Math.floor(seconds/60) + 'p ' + seconds%60 + 's'],
        ['Hỗ Trợ', (s.assistedWords || 0) + ' từ · ' + (s.assistedKeystrokes || 0) + ' phím']
      ];
      const kinds=['accuracy','speed','combo','words','time','assistance'];
      summary.innerHTML = '<h3 class="pause-summary-title">Chiến tích trận này</h3><div class="mc-stat-list">' +
        stats.map(([label,value],i)=>root.Meowcha.ui.stat(kinds[i],label,value)).join('') +
        '</div><p class="pause-assistance-note">Tiến trình được giữ khi tạm nghỉ. Trở về tiên môn sẽ lưu đạo quả vào ngọc giản hiện tại.</p>';
    }

    getPracticeSummary() {
      const s = this.state;
      s.calculateWPM();
      return `Tự gõ: ${s.correctKeystrokes}/${s.totalKeystrokes} phím đúng • Chính xác ${s.accuracy}% • ${s.wpm} TỪ/PHÚT (WPM) • Thời gian luyện ${Math.round(s.activeElapsedMs / 1000)}s. ` +
        `Tự hoàn thành ${s.humanWords} từ; hỗ trợ ${s.assistedWords} từ / ${s.assistedKeystrokes} ký tự. ` +
        `Từ đến hạn ôn: ${this.saveSystem.getDueReviewWords().length}. ${s.assisted ? 'Trận có hỗ trợ — bảng luyện tập hỗ trợ.' : 'Trận tự gõ — bảng luyện tập tự gõ.'}`;
    }

    hidePauseModal() {
      if (this.state.setPaused) this.state.setPaused(false);
      else this.state.isPaused = false;
      if (this.audio.pauseVoice) this.audio.pauseVoice(false);
      if (this.modalPause) this.modalPause.style.display = "none";
    }

    
    async showCertificateModal() {
      if (!this.modalCertificate) return;
      this.modalCertificate.style.display = 'flex';
      const actions = [this.btnDownloadCertificate, this.btnCopyCertificateImg, this.btnCopyShareLink].filter(Boolean);
      actions.forEach(button => { button.disabled = true; });
      this.showStatus('Đang lấy kỷ lục tu vi đã lưu…');
      try { await this.saveSystem.syncPersonalBest(); }
      catch (_) { this.showStatus('Đang dùng kỷ lục đã lưu trên thiết bị này.'); }
      try {
        const record = this.saveSystem.getCertificateRecord(this.state);
        this.state.highScore = Math.max(this.state.highScore || 0, record.score);
        const dataUrl = this.generateCertificateCanvas();
        if (this.certificateImgPreview && dataUrl) this.certificateImgPreview.src = dataUrl;
        this.showStatus('Chứng đạo hiển thị kỷ lục ' + record.score.toLocaleString('vi-VN') + ' Tu Vi.');
      } catch (_) { this.showStatus('Không tạo được chứng đạo. Bạn hãy mở lại để thử lần nữa.'); }
      finally { actions.forEach(button => { button.disabled = false; }); }
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
        a.download = `Chung_Dao_Ky_Luc_${this.saveSystem.getCertificateRecord(this.state).score}.png`;
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

    async copyShareLink() {
      const record = this.saveSystem.getCertificateRecord(this.state);
      const shareUrl = `${root.location.origin}/games/meowcha?score=${record.score}`;
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(shareUrl);
        this.showStatus('Đã sao chép liên kết chứng đạo vào khay nhớ tạm.', 5000);
      } catch (_) {
        let field = document.getElementById('certificateShareFallback');
        if (!field) {
          field = document.createElement('input'); field.id = 'certificateShareFallback'; field.readOnly = true;
          field.setAttribute('aria-label', 'Liên kết chứng đạo — chọn và sao chép thủ công');
          ((this.modalCertificate && this.modalCertificate.querySelector('.modal-content-box')) || this.modalCertificate || document.body).appendChild(field);
        }
        field.value = shareUrl; field.focus(); field.select();
        this.showStatus('Trình duyệt chưa cho sao chép tự động. Liên kết đã được chọn; nhấn Ctrl+C hoặc chạm giữ để sao chép.', 6500);
      }
    }

    generateCertificateCanvas() {
      const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=630;
      const ctx=canvas.getContext('2d');if(!ctx)return '';
      const record=this.saveSystem.getCertificateRecord(this.state),known=!!record.metricsKnown;
      const realm=(root.Meowcha.CULTIVATION_REALMS||[])[Math.min(4,Math.max(0,record.realmIdx||0))]||{name:'Luyện Khí Kỳ'};
      const user=this.getLoggedInUser(),name=user&&user.name?user.name.trim():'Tiểu Miêu Kiếm Sĩ';
      const colors={paper:'#F5E8C8',ink:'#244B3D',muted:'#634D37',jade:'#315C4B',gold:'#B7914F',light:'#FFF1CE'};
      const asset=key=>this.assets&&this.assets[key]&&this.assets[key].loaded?this.assets[key].img:null;
      ctx.fillStyle=colors.paper;ctx.fillRect(0,0,1200,630);
      const frame=asset('ui_frame');
      if(frame){
        // Nine-slice preserves the carved corners at the certificate's wide aspect.
        const sx=[0,frame.width*.32,frame.width*.68,frame.width],sy=[0,frame.height*.32,frame.height*.68,frame.height];
        const dx=[0,34,1166,1200],dy=[0,34,596,630];
        for(let row=0;row<3;row++)for(let col=0;col<3;col++){
          if(row===1&&col===1)continue;
          ctx.drawImage(frame,sx[col],sy[row],sx[col+1]-sx[col],sy[row+1]-sy[row],dx[col],dy[row],dx[col+1]-dx[col],dy[row+1]-dy[row]);
        }
      }
      ctx.strokeStyle=colors.gold;ctx.lineWidth=1;ctx.strokeRect(49,49,1102,532);
      const plaque=asset('ui_plaque');if(plaque)ctx.drawImage(plaque,280,35,640,110);
      ctx.textAlign='center';ctx.fillStyle=plaque?colors.light:colors.ink;ctx.font='800 30px "Be Vietnam Pro", Arial';
      ctx.fillText('Chứng Đạo Kim Đồ',600,98);
      ctx.fillStyle=colors.muted;ctx.font='500 13px "Be Vietnam Pro", Arial';ctx.fillText('MEOW-CHA Trà Đạo • Tiên Hiệp IELTS Oasis',600,156);
      const portrait=asset('char_r'+Math.min(4,Math.max(0,record.realmIdx||0))+'_idle');
      const dais=asset('cultivation_dais');ctx.imageSmoothingEnabled=false;
      if(dais)ctx.drawImage(dais,100,400,280,125);
      if(portrait)ctx.drawImage(portrait,120,220,240,240);
      ctx.imageSmoothingEnabled=true;ctx.fillStyle=colors.ink;ctx.font='800 20px "Be Vietnam Pro", Arial';
      ctx.fillText(realm.name,240,553,300);
      ctx.textAlign='left';let nameSize=25;
      while(nameSize>16){ctx.font='800 '+nameSize+'px "Be Vietnam Pro", Arial';if(ctx.measureText('Tiên hữu: '+name).width<=640)break;nameSize--;}
      ctx.fillText('Tiên hữu: '+name,445,211,640);
      ctx.font='500 14px "Be Vietnam Pro", Arial';ctx.fillStyle=colors.muted;
      const mode={DIRECT:'Trực Diện Trảm Ma',CLOZE:'Ngộ Đạo Thông Linh',AUDIO:'Thính Lôi Biện Âm'}[record.gameMode]||'Ván lưu trữ';
      ctx.fillText(known?'Pháp môn: '+mode:'Kỷ lục cũ • Chưa lưu số đo ván đấu',445,240,640);
      const stats=[
        ['Kỷ lục Tu Vi',Number(record.score||0).toLocaleString('vi-VN'),5],
        ['Độ chính xác tự gõ',known&&record.accuracy!=null?record.accuracy+'%':'Chưa lưu',1],
        ['Từ tự gõ / hỗ trợ',known&&record.humanWords!=null?record.humanWords+' / '+(record.assistedWords||0):'Chưa lưu',6],
        ['Tốc độ tự gõ',known&&record.wpm!=null?Math.round(record.wpm)+' WPM':'Chưa lưu',2]
      ];
      const icons=asset('ui_icons');
      stats.forEach(([label,value,index],i)=>{
        const x=445+(i%2)*330,y=280+Math.floor(i/2)*100;
        if(icons){const iw=icons.width/4,ih=icons.height/2;ctx.drawImage(icons,(index%4)*iw,Math.floor(index/4)*ih,iw,ih,x,y+6,44,44);}
        ctx.font='500 13px "Be Vietnam Pro", Arial';ctx.fillStyle=colors.muted;ctx.fillText(label,x+54,y+22);
        ctx.font='800 24px "Be Vietnam Pro", Arial';ctx.fillStyle=colors.ink;ctx.fillText(value,x+54,y+56,265);
      });
      ctx.fillStyle=colors.jade;ctx.font='500 13px "Be Vietnam Pro", Arial';
      ctx.fillText('Bền bỉ dưỡng khí • Mỗi ngày một bước tiến gần Tiên Đạo.',445,502,640);
      ctx.fillStyle=colors.muted;ctx.font='500 12px "Be Vietnam Pro", Arial';ctx.fillText('ieltsoasis.site/games/meowcha',445,553);
      try{return canvas.toDataURL('image/png');}catch(error){console.warn('[Certificate] export failed',error);return '';}
    }

    finishGameOver(restart) {
      if(!this.modalGameOver||this.modalGameOver.style.display==='none')return false;
      this.hideGameOverModal();
      if(this.audio)this.audio.play('chime');
      const callback=restart?(this.onRestartBattle||this.onStartBattle):this.onReturnLobby;
      if(callback)callback();
      return true;
    }

    showAudioSettings() {
      const modal=document.getElementById('modalAudioSettings');
      if(!modal)return;
      modal.style.display='flex';
      this.updateAudioSettings();
    }

    updateAudioSettings() {
      const modal=document.getElementById('modalAudioSettings');
      if(!modal||modal.style.display==='none')return;
      const enabled=document.getElementById('audioMasterEnabled');
      if(enabled)enabled.checked=this.audio.soundEnabled;
      modal.querySelectorAll('[data-audio-volume]').forEach(input=>{
        const value=Math.round((this.audio.volumes?.[input.dataset.audioVolume]??1)*100);
        input.value=String(value);
        const output=modal.querySelector('[data-audio-output="'+input.dataset.audioVolume+'"]');
        if(output)output.textContent=value+'%';
      });
      const status=this.audio.getStatus();
      const message=document.getElementById('audioSettingsStatus');
      if(message)message.textContent=!status.enabled?'Đang tắt nhạc, hiệu ứng và phát âm.':
        status.lastError||'Âm thanh đang bật. Giọng đọc tạm nghỉ khi Định Tâm và tiếp tục cùng trận đấu.';
    }

    showGameOverModal() {
      if (!this.modalGameOver) return;
      const results=document.getElementById('gameOverStats');
      if(results&&root.Meowcha.ui)results.innerHTML=[
        ['cultivation','Tu vi ván này',this.state.score.toLocaleString(),'gameOverFinalScore'],
        ['cultivation','Kỷ lục',Math.max(this.state.highScore||0,this.state.score||0).toLocaleString(),'gameOverHighScore'],
        ['words','Từ đã trảm',this.state.wordsSlain,'gameOverFinalWords'],
        ['speed','Kiếm tốc',Math.round(this.state.wpm||0)+' WPM','gameOverFinalWpm']
      ].map(args=>root.Meowcha.ui.stat(...args)).join('');
      const finalScoreEl = document.getElementById("gameOverFinalScore");
      const finalHighScoreEl = document.getElementById("gameOverHighScore");
      const finalWordsEl = document.getElementById("gameOverFinalWords");
      const finalRealmEl = document.getElementById("gameOverFinalRealm");
      const finalWpmEl   = document.getElementById("gameOverFinalWpm");

      const realms = (root && root.Meowcha && root.Meowcha.CULTIVATION_REALMS) || [];
      const realmData = realms[this.state.realmIdx] || realms[0];

      const bestScore = this.saveSystem.getCertificateRecord(this.state).score;
      if (finalScoreEl) finalScoreEl.innerText = this.state.score.toLocaleString();
      if (finalHighScoreEl) finalHighScoreEl.innerText = bestScore.toLocaleString();
      if (finalWordsEl) finalWordsEl.innerText = this.state.wordsSlain;
      if (finalRealmEl) finalRealmEl.innerText = realmData ? realmData.title : "Luyện Khí Kỳ";
      if (finalWpmEl)   finalWpmEl.innerText   = Math.round(this.state.wpm || 0);
      if (finalWpmEl) finalWpmEl.innerText += ' WPM';

      this.modalGameOver.style.display = "flex";
      let summary = this.modalGameOver.querySelector('.practice-summary');
      if (!summary) {
        summary = document.createElement('p'); summary.className = 'practice-summary';
        this.modalGameOver.querySelector('.modal-content-box').appendChild(summary);
      }
      summary.textContent = this.getPracticeSummary();

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
          const b = btn.getAttribute('data-band') === 'all' ? null : parseInt(btn.getAttribute('data-band'), 10);
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

        const searchMethod = this.currentVaultBand === null ? loader.searchAllOxford : loader.searchVocab;
        const res = await searchMethod({
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
            <span class="vocab-word-title ${currentClass}">${escapeHTML(item.word)}</span>
            <span class="vocab-type-badge">${escapeHTML(item.type || 'vocab')}</span>
          </div>
          <div class="vocab-card-body">
            <span class="vocab-ipa-text">${escapeHTML(item.ipa || '/.../')}</span>
            <button class="btn-pronounce-speaker" data-word="${escapeHTML(item.word)}" data-audio="${escapeHTML(item.audio_url || '')}" title="Nghe phát âm chuẩn Oxford">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            </button>
          </div>
          <div class="vocab-meaning-text" title="${escapeHTML(item.meaning || '')}">
            ${escapeHTML(item.meaning || 'Chưa có nghĩa trong bộ từ này')}
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
      if (this.audio && this.audio.playWord) this.audio.playWord({ word, audio_url: audioUrl });
    }

    _synthSpeak(word) {
      this.speakWord(word);
    }

    /* =========================================================================
       BẢNG PHONG THẦN TIÊN GIỚI (PANTHEON LEADERBOARD LOGIC & AUTO SYNC)
       ========================================================================= */
    getLoggedInUser() {
      let rawUser = null;
      let token = "";
      let localName = this._safeGet("meowcha_player_name", "Tiểu Miêu Kiếm Sĩ");

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
          let avatar = u.avatar_url || u.avatarUrl || u.image || u.avatar || u.discord_avatar || "";
          if (avatar && !avatar.startsWith("http") && !avatar.startsWith("./") && !avatar.startsWith("/")) {
            if (u.discord_id) {
              avatar = `https://cdn.discordapp.com/avatars/${u.discord_id}/${avatar}.png`;
            }
          }
          return {
            id: u.id || u.user_id || null,
            name: name || localName,
            avatar: safeAvatar(avatar) || DEFAULT_AVATAR,
            token: token || "",
            isLoggedIn: true
          };
        } catch (_) {}
      }

      return {
        name: localName,
        avatar: DEFAULT_AVATAR,
        token: token,
        isLoggedIn: false
      };
    }

    async refreshAccountAvatar() {
      const user = this.getLoggedInUser();
      if (!user.id || !user.token || typeof fetch === 'undefined') return;
      try {
        const response = await fetch('/api/auth/me', {headers:{Authorization:'Bearer '+user.token}});
        if (!response.ok) return;
        const fresh = await response.json();
        const current = this.getLoggedInUser();
        if (String(fresh.id) !== String(user.id) || String(current.id) !== String(user.id)) return;
        this._safeSet('oasis_user', JSON.stringify(fresh));
        this.updateHUD();
      } catch (_) { /* Retain the current account image during a connection interruption. */ }
    }

    setUserAvatar(element, value) {
      if (!element) return;
      const source = safeAvatar(value) || DEFAULT_AVATAR;
      element.referrerPolicy = 'no-referrer';
      element.onerror = () => { element.onerror = null; element.src = DEFAULT_AVATAR; };
      if (element.getAttribute('src') !== source) element.src = source;
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
      this.saveSystem.resetActiveSave(activeSlot, this.state.gameMode);
      this.state.resetRunMetrics();
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

    async autoSubmitScoreToPantheon() {
      // Capture the current run before callers reset/change mode. Never submit all-time best
      // with the current run's counters, and only mark success after a server acknowledgement.
      const captured = Object.assign(Object.create(Object.getPrototypeOf(this.state)), this.state);
      return this.saveSystem.submitRun(captured);
    }

    // Phong Thần halls are implemented in ui/LeaderboardHalls.js.

    async submitScoreToPantheon() {
      this.showStatus('Thành tích được ghi một lần khi kết thúc trận hoặc trùng tu từ đầu.');
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
      this.setUserAvatar(avatarEl, user.avatar);

      const scoreEl = document.getElementById("profileModalScore");
      if (scoreEl) scoreEl.innerText = `${this.state.score.toLocaleString()} Tu Vi`;

      const highScoreEl = document.getElementById("profileModalHighScore");
      if (highScoreEl) {
        const bestScore = this.saveSystem.getCertificateRecord(this.state).score;
        highScoreEl.innerText = `${bestScore.toLocaleString()} Tu Vi`;
      }

      const wordsEl = document.getElementById("profileModalWords");
      if (wordsEl) wordsEl.innerText = `${this.state.wordsSlain} từ`;

      const accEl = document.getElementById("profileModalAccuracy");
      if (accEl) accEl.innerText = `${this.state.accuracy ?? 100}%`;

      const wpmEl = document.getElementById("profileModalWpm");
      if (wpmEl) wpmEl.innerText = `${this.state.wpm || 0} WPM`;

      const hpEl = document.getElementById("profileModalHp");
      if (hpEl) hpEl.innerText = `${this.state.hp} / ${this.state.maxHp} HP`;

      const talentsEl = document.getElementById("profileModalTalentsList");
      if (talentsEl) {
        const activeT = [];
        for(const [id,level] of Object.entries(this.state.skillLevels||{})){
          const skill=(root.Meowcha.BREAKTHROUGH_SKILLS||{})[id];
          if(skill&&level>0)activeT.push(`${skill.name} • Cấp ${level}`);
        }
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
