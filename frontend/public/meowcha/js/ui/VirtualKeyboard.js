/**
 * VirtualKeyboard.js - Bàn Phím Trận Pháp Cổ Phù Cho Mobile & Tablet
 * Thiết kế chuẩn Đá Thạch Khắc Phù Văn (Ancient Rune Stone Array)
 * Không delay (0ms pointerdown), hỗ trợ rung haptic và trạng thái Choáng
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
        <span class="kb-seal-title">◆ TRẬN PHÁP PHÙ THẠCH BÀN ◆</span>
        <span class="kb-stun-badge" id="kbStunBadge">TÂM MA NHIỄU LOẠN</span>
      `;
      kbWrapper.appendChild(headerBar);

      KB_ROWS.forEach(row => {
        const rowEl = document.createElement("div");
        rowEl.className = "kb-row";

        row.forEach(keyChar => {
          const keyBtn = document.createElement("button");
          keyBtn.className = "kb-key xianxia-key";
          keyBtn.type = "button";
          keyBtn.setAttribute("data-key", keyChar);

          keyBtn.innerHTML = `
            <span class="key-char">${keyChar}</span>
            <span class="key-rune-corner">᛭</span>
          `;

          const triggerKey = (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Nếu đang bị Choáng: Chặn xuất chiêu, rung cảnh báo
            if (this.isStunned) {
              keyBtn.classList.add("stun-reject");
              setTimeout(() => keyBtn.classList.remove("stun-reject"), 150);
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                try { navigator.vibrate(30); } catch (_) {}
              }
              return;
            }

            // Rung phản hồi haptic xúc giác 15ms
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              try { navigator.vibrate(15); } catch (_) {}
            }

            keyBtn.classList.add("active");
            setTimeout(() => keyBtn.classList.remove("active"), 90);

            if (this.onKeyPress) this.onKeyPress(keyChar);
          };

          // Pointerdown triệt tiêu hoàn toàn 300ms click delay trên mobile
          keyBtn.addEventListener("pointerdown", triggerKey);

          rowEl.appendChild(keyBtn);
        });

        kbWrapper.appendChild(rowEl);
      });

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
