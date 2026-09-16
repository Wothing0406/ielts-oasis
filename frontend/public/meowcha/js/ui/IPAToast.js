/**
 * IPAToast.js - Thẻ Từ Vựng IELTS & Phát Âm Chuẩn Quốc Tế
 * Hiển thị phiên âm IPA, loại từ, giải nghĩa và phát âm giọng bản xứ US/UK
 */
(function(root) {
  class IPAToast {
    constructor(containerEl) {
      this.container = containerEl;
      this.timer = null;
      this.currentWord = null;
    }

    show(wordItem, durationMs = 4500) {
      if (!this.container || !wordItem) return;
      this.currentWord = wordItem;

      if (this.timer) {
        clearTimeout(this.timer);
      }

      this.container.innerHTML = `
        <div class="ipa-card-wrapper animate-slide-in">
          <div class="ipa-header">
            <span class="ipa-band-tag">IELTS VOCAB</span>
            <span class="ipa-type-badge">${wordItem.type || "từ vựng"}</span>
            <button class="ipa-sound-btn" id="btnPlayIpaAudio" title="Nghe phát âm chuẩn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            </button>
          </div>
          <div class="ipa-body">
            <div class="ipa-word">${wordItem.word}</div>
            <div class="ipa-phonetic">${wordItem.ipa || ""}</div>
            <div class="ipa-meaning">${wordItem.meaning || ""}</div>
          </div>
          <div class="ipa-progress-bar">
            <div class="ipa-progress-fill" style="animation-duration: ${durationMs}ms"></div>
          </div>
        </div>
      `;

      this.container.style.display = "block";

      // Nút nghe phát âm
      const soundBtn = this.container.querySelector("#btnPlayIpaAudio");
      if (soundBtn) {
        soundBtn.onclick = (e) => {
          e.stopPropagation();
          this.speak(wordItem.word);
        };
      }

      // Tự động phát âm 1 lần nhẹ nhàng
      this.speak(wordItem.word);

      this.timer = setTimeout(() => {
        this.hide();
      }, durationMs);
    }

    speak(text) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = "en-US";
          utterance.rate = 0.88;
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);
        } catch (e) {}
      }
    }

    hide() {
      if (this.container) {
        this.container.style.display = "none";
        this.container.innerHTML = "";
      }
      this.timer = null;
    }
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.IPAToast = IPAToast;
})(typeof window !== 'undefined' ? window : globalThis);
