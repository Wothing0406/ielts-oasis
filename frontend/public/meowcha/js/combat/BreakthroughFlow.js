/**
 * BreakthroughFlow.js - Kịch Bản Đột Phá Cảnh Giới & Lựa Chọn Thiên Phú
 * Đảm bảo độ trễ 3.5 giây trang nghiêm để người chơi chiêm ngưỡng thăng hoa và đọc phiên âm IPA
 */
(function(root) {
  class BreakthroughFlow {
    constructor(gameState, audioManager, unityBridge) {
      this.state = gameState;
      this.audio = audioManager;
      this.unityBridge = unityBridge;

      this.breakthroughTimer = 0;
      this.pendingRealmIdx = null;
      this.onShowTalentModal = null;
    }

    checkProgress() {
      if (this.state.pendingBreakthrough) return false;

      const realms = root.Meowcha.CULTIVATION_REALMS || [];
      const currentScore = this.state.score;
      const curWords = this.state.wordsSlain;
      const curIdx = this.state.realmIdx;

      // Đạo hữu chỉ có thể đột phá từng bước lên cảnh giới kế tiếp (curIdx + 1)
      const nextIdx = curIdx + 1;
      if (nextIdx < realms.length) {
        const nextRealm = realms[nextIdx];
        if (currentScore >= nextRealm.minScore && curWords >= (nextRealm.minWords || 0)) {
          this.triggerBreakthrough(nextIdx);
          return true;
        }
      }
      return false;
    }

    triggerBreakthrough(newRealmIdx) {
      this.state.pendingBreakthrough = true;
      this.pendingRealmIdx = newRealmIdx;
      this.state.setCatState("BREAKTHROUGH", 3500);

      const realms = root.Meowcha.CULTIVATION_REALMS || [];
      const targetRealm = realms[newRealmIdx] || realms[0];

      this.audio.play("breakthrough");
      this.state.setSpeech(`ĐẠI ĐẠO BỪNG NỞ! ĐỘT PHÁ: ${targetRealm.name}!`, 3500);

      // Thông báo Unity WebGL bridge cập nhật trang phục mô hình
      if (this.unityBridge) {
        this.unityBridge.setRealm(newRealmIdx);
      }

      // ĐỘ TRỄ 3.5 GIÂY (3500ms) THEO ĐÚNG YÊU CẦU NGƯỜI CHƠI
      setTimeout(() => {
        this.state.realmIdx = newRealmIdx;
        this.state.pendingBreakthrough = false;

        // Chọn ngẫu nhiên 3 thiên phú từ TALENT_POOL
        const pool = [...(root.Meowcha.TALENT_POOL || [])];
        const shuffled = pool.sort(() => Math.random() - 0.5);
        const selectedTalents = shuffled.slice(0, 3);

        if (this.onShowTalentModal) {
          this.onShowTalentModal(selectedTalents, targetRealm);
        }
      }, 3500);
    }

    selectTalent(talent) {
      if (!talent) return;
      talent.apply(this.state);
      this.audio.play("chime");
      this.state.setSpeech(`Đã đắc ngộ: [${talent.name}]!`, 2500);
      this.state.setCatState("IDLE");
    }
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.BreakthroughFlow = BreakthroughFlow;
})(typeof window !== 'undefined' ? window : globalThis);
