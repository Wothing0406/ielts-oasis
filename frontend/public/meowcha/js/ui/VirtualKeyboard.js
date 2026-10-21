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
        <span class="kb-seal-title"><span class="seal-glyph-gold">[ 阵 ]</span> TRẬN PHÁP PHÙ THẠCH BÀN <span class="seal-glyph-gold">[ 盘 ]</span></span>
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
      btnAudio.innerHTML = `<span class="key-action-icon">[ 聽 ]</span><span class="key-action-label">THÍNH ÂM</span>`;
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
      btnSpace.innerHTML = `<span class="key-action-label">␣ TRẢM MA</span>`;
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
      btnBackspace.innerHTML = `<span class="key-action-icon">⌫</span><span class="key-action-label">XÓA</span>`;
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
