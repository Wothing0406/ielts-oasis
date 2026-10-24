/**
 * IPAToast.js - Thẻ Từ Vựng IELTS (Đã gỡ bỏ để tránh gây rối mắt và tránh trùng/vọng 2 giọng nói)
 * Giữ lại lớp định nghĩa rỗng an toàn để các tham chiếu cũ không sinh ngoại lệ runtime
 */
(function(root) {
  class IPAToast {
    constructor(containerEl) {
      this.container = containerEl;
      this.timer = null;
      this.currentWord = null;
      if (this.container) {
        this.container.style.display = "none";
        this.container.innerHTML = "";
      }
    }

    show(wordItem, durationMs = 4500) {
      // Đã vô hiệu hóa: Nghĩa từ vựng đã hiển thị trực tiếp trên dòng chữ Ngộ Đạo và cuộn Kiếm Ý
      // Tránh hoàn toàn việc đọc thêm gây hiện tượng vọng 2 giọng
      return;
    }

    speak(text) {
      // Đã vô hiệu hóa triệt để để tránh trùng lặp âm thanh với TypingEngine
      return;
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

