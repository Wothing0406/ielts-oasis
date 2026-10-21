/**
 * VirtualKeyboard.js - Bàn Phím Trận Pháp Cổ Phù Cho Mobile & Tablet
 * Thiết kế chuẩn Đá Thạch Khắc Phù Văn (Ancient Rune Stone Array)
 * Không delay (0ms pointerdown), hỗ trợ rung haptic, nút Phát Âm (Tab), Space và Xóa.
 */
(function(root) {
  const KB_ROWS = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"]
  ];

  class VirtualKeyboard {
    constructor(containerEl, onKeyPress) {
      this.container = containerEl;
      this.onKeyPress = onKeyPress;
      this.isStunned = false;
      this.init();
    }

    init() {
      if (!this.container) return;
      this.container.innerHTML = "";

      const kbWrapper = document.createElement("div");
      kbWrapper.className = "meowcha-virtual-keyboard";

      // Thanh báo hiệu Trận Pháp Phù Phiến
      const headerBar = document.createElement("div");
      headerBar.className = "kb-seal-header";
      headerBar.innerHTML = `
        <span class="kb-seal-title">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style="vertical-align: -1px; margin-right: 4px;"><polygon points="8,1 15,8 8,15 1,8" fill="#78350F" stroke="#F3C644" stroke-width="1.5"/><circle cx="8" cy="8" r="2" fill="#2DE28D"/></svg>
          TRẬN PHÁP PHÙ THẠCH BÀN
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style="vertical-align: -1px; margin-left: 4px;"><polygon points="8,1 15,8 8,15 1,8" fill="#78350F" stroke="#F3C644" stroke-width="1.5"/><circle cx="8" cy="8" r="2" fill="#2DE28D"/></svg>
        </span>
        <span class="kb-stun-badge" id="kbStunBadge">TÂM MA NHIỄU LOẠN</span>
      `;
      kbWrapper.appendChild(headerBar);

      // 3 Hàng phím chữ cái chính
      KB_ROWS.forEach(row => {
        const rowEl = document.createElement("div");
        rowEl.className = "kb-row";

        row.forEach(keyChar => {
          const keyBtn = document.createElement("button");
          keyBtn.className = "kb-key xianxia-key";
          keyBtn.type = "button";
          keyBtn.setAttribute("data-key", keyChar);
          keyBtn.innerHTML = `<span class="key-char">${keyChar}</span>`;

          const triggerKey = (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (this.isStunned) {
              keyBtn.classList.add("stun-reject");
              setTimeout(() => keyBtn.classList.remove("stun-reject"), 150);
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                try { navigator.vibrate(30); } catch (_) {}
              }
              return;
            }

            if (typeof navigator !== "undefined" && navigator.vibrate) {
              try { navigator.vibrate(12); } catch (_) {}
            }

            keyBtn.classList.add("active");
            setTimeout(() => keyBtn.classList.remove("active"), 80);

            if (this.onKeyPress) this.onKeyPress(keyChar);
          };

          keyBtn.addEventListener("pointerdown", triggerKey);
          rowEl.appendChild(keyBtn);
        });

        kbWrapper.appendChild(rowEl);
      });

      // Hàng 4: Hàng tiện ích (Phát Âm / Tab, Phím Cách Space, Phím Xóa Backspace)
      const actionRow = document.createElement("div");
      actionRow.className = "kb-row kb-row-actions";

      // Nút Thính Âm / Replay Audio (Đặc biệt quan trọng cho chế độ Audio Mode)
      const btnAudio = document.createElement("button");
      btnAudio.className = "kb-key xianxia-key kb-action-key kb-audio-key";
      btnAudio.type = "button";
      btnAudio.title = "Nghe lại phát âm (Tab)";
      btnAudio.innerHTML = `
        <svg class="key-action-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F3C644" stroke-width="2.2">
          <path d="M12 3 C8.5 3 7 6 7 11 L5 17 H19 L17 11 C17 6 15.5 3 12 3 Z" fill="rgba(243,198,68,0.2)"/>
          <path d="M10 17 a2 2 0 0 0 4 0"/>
        </svg>
        <span class="key-action-label">THÍNH ÂM</span>
      `;
      btnAudio.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try { navigator.vibrate(15); } catch (_) {}
        }
        btnAudio.classList.add("active");
        setTimeout(() => btnAudio.classList.remove("active"), 80);
        if (window.__meowchaReplayAudio) {
          window.__meowchaReplayAudio();
        } else if (this.onKeyPress) {
          this.onKeyPress("Tab");
        }
      });
      actionRow.appendChild(btnAudio);

      // Phím Cách / Trảm Ma Space
      const btnSpace = document.createElement("button");
      btnSpace.className = "kb-key xianxia-key kb-action-key kb-space-key";
      btnSpace.type = "button";
      btnSpace.title = "Xuất kiếm (Space)";
      btnSpace.innerHTML = `
        <svg class="key-action-svg" width="16" height="14" viewBox="0 0 24 20" fill="none">
          <polygon points="6,8 22,10 6,12" fill="#2DE28D" stroke="#F3C644" stroke-width="1.2"/>
          <rect x="2" y="8.5" width="4" height="3" fill="#D44327" stroke="#F3C644" stroke-width="1"/>
          <line x1="6" y1="5" x2="6" y2="15" stroke="#F3C644" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span class="key-action-label">TRẢM MA</span>
      `;
      btnSpace.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try { navigator.vibrate(12); } catch (_) {}
        }
        btnSpace.classList.add("active");
        setTimeout(() => btnSpace.classList.remove("active"), 80);
        if (this.onKeyPress) this.onKeyPress(" ");
      });
      actionRow.appendChild(btnSpace);

      // Phím Xóa Backspace
      const btnBackspace = document.createElement("button");
      btnBackspace.className = "kb-key xianxia-key kb-action-key kb-del-key";
      btnBackspace.type = "button";
      btnBackspace.title = "Xóa (Backspace)";
      btnBackspace.innerHTML = `
        <svg class="key-action-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FCA5A5" stroke-width="2.2">
          <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" fill="rgba(212,67,39,0.25)"/>
          <line x1="18" y1="9" x2="12" y2="15"/>
          <line x1="12" y1="9" x2="18" y2="15"/>
        </svg>
        <span class="key-action-label">XÓA</span>
      `;
      btnBackspace.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try { navigator.vibrate(15); } catch (_) {}
        }
        btnBackspace.classList.add("active");
        setTimeout(() => btnBackspace.classList.remove("active"), 80);
        if (this.onKeyPress) this.onKeyPress("Backspace");
      });
      actionRow.appendChild(btnBackspace);

      kbWrapper.appendChild(actionRow);
      this.container.appendChild(kbWrapper);
    }

    setStunned(stunned) {
      this.isStunned = !!stunned;
      if (this.container) {
        this.container.classList.toggle("stunned", this.isStunned);
      }
    }

    show() {
      if (this.container) this.container.style.display = "flex";
    }

    hide() {
      if (this.container) this.container.style.display = "none";
    }
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.VirtualKeyboard = VirtualKeyboard;
})(typeof window !== 'undefined' ? window : globalThis);
