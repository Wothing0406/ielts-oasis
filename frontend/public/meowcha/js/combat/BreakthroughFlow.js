/**
 * BreakthroughFlow.js - Kịch Bản Đột Phá Cảnh Giới & Tâm Ma Khảo Nghiệm (IELTS Synonym Boss Fight)
 * Thay thế màn hình đột phá đơn thuần bằng trận chiến Boss Đại Yêu Thú đòi hỏi trảm 3 từ đồng nghĩa Band 7.5+
 */
(function(root) {
  // 4 Bộ Tâm Ma Khảo Nghiệm tương ứng 4 lần đột phá cảnh giới (Cảnh 0->1, 1->2, 2->3, 3->4)
  const SYNONYM_BOSS_POOLS = [
    {
      targetRealm: 1,
      bossTitle: "TÂM MA KHẢO NGHIỆM • TRÚC CƠ KỲ",
      baseWord: "DIFFICULT",
      baseMeaning: "Gian nan, khó khăn",
      shields: [
        { word: "CHALLENGING", ipa: "/ˈtʃæl.ɪn.dʒɪŋ/", meaning: "Khó, đòi hỏi nỗ lực (một nhiệm vụ)", example: "The task is challenging." },
        { word: "TOUGH", ipa: "/tʌf/", meaning: "Khó thực hiện (thân mật hơn)", example: "It was a tough assignment." },
        { word: "DEMANDING", ipa: "/dɪˈmɑːn.dɪŋ/", meaning: "Đòi hỏi nhiều công sức hoặc kỹ năng", example: "The course is demanding." }
      ]
    },
    {
      targetRealm: 2,
      bossTitle: "TÂM MA KHẢO NGHIỆM • KIM ĐAN KỲ",
      baseWord: "IMPORTANT",
      baseMeaning: "Quan trọng, cốt yếu",
      shields: [
        { word: "CRUCIAL", ipa: "/ˈkruː.ʃəl/", meaning: "Có tính quyết định trong một tình huống", example: "Timing is crucial for success." },
        { word: "ESSENTIAL", ipa: "/ɪˈsen.ʃəl/", meaning: "Thiết yếu, không thể thiếu", example: "Water is essential for life." },
        { word: "VITAL", ipa: "/ˈvaɪ.təl/", meaning: "Cực kỳ quan trọng hoặc cần thiết", example: "Accurate information is vital." }
      ]
    },
    {
      targetRealm: 3,
      bossTitle: "TÂM MA KHẢO NGHIỆM • NGUYÊN ANH KỲ",
      baseWord: "DANGEROUS",
      baseMeaning: "Nguy hiểm, hiểm họa",
      shields: [
        { word: "PERILOUS", ipa: "/ˈper.əl.əs/", meaning: "Rất nguy hiểm (thường dùng với hành trình)", example: "They began a perilous journey." },
        { word: "HAZARDOUS", ipa: "/ˈhæz.ə.dəs/", meaning: "Gây nguy hiểm (vật liệu hoặc điều kiện)", example: "Workers handle hazardous materials." },
        { word: "RISKY", ipa: "/ˈrɪs.ki/", meaning: "Có khả năng gây tổn thất (một hành động)", example: "Driving in fog is risky." }
      ]
    },
    {
      targetRealm: 4,
      bossTitle: "TÂM MA KHẢO NGHIỆM • ĐỘ KIẾP CHÍ TÔN",
      baseWord: "CHANGE",
      baseMeaning: "Biến đổi, chuyển biến",
      shields: [
        { word: "ALTER", ipa: "/ˈɔːl.tər/", meaning: "Thay đổi một phần hoặc đặc điểm", example: "We need to alter the plan." },
        { word: "MODIFY", ipa: "/ˈmɒd.ɪ.faɪ/", meaning: "Điều chỉnh để phù hợp mục đích", example: "Modify the design to reduce costs." },
        { word: "TRANSFORM", ipa: "/trænsˈfɔːm/", meaning: "Biến đổi lớn về dạng hoặc tính chất", example: "The project transformed the town." }
      ]
    }
  ];

  class BreakthroughFlow {
    constructor(gameState, audioManager, unityBridge) {
      this.state = gameState;
      this.audio = audioManager;
      this.unityBridge = unityBridge;

      this.breakthroughTimer = 0;
      this.pendingRealmIdx = null;
      this.onShowTalentModal = null;
      this.onSpawnBoss = null;
      this.isBossEncounterActive = false;
      this._generation = 0;
    }

    checkProgress(asteroidManager = null) {
      if (this.state.pendingBreakthrough || this.isBossEncounterActive) return false;

      const realms = root.Meowcha.CULTIVATION_REALMS || [];
      const currentScore = this.state.score;
      const curWords = this.state.wordsSlain;
      const curIdx = this.state.realmIdx;

      // Đạo hữu chỉ có thể đột phá từng bước lên cảnh giới kế tiếp (curIdx + 1)
      const nextIdx = curIdx + 1;
      if (nextIdx < realms.length) {
        const nextRealm = realms[nextIdx];
        if (currentScore >= nextRealm.minScore && curWords >= (nextRealm.minWords || 0)) {
          if (asteroidManager && typeof this.onSpawnBoss === "function") {
            this.initiateBossEncounter(nextIdx, asteroidManager);
            return true;
          } else {
            this.triggerBreakthrough(nextIdx);
            return true;
          }
        }
      }
      return false;
    }

    initiateBossEncounter(newRealmIdx, asteroidManager) {
      this.isBossEncounterActive = true;
      this.pendingRealmIdx = newRealmIdx;

      // Quét sạch thiên thạch thường để tập trung chiến Boss
      if (asteroidManager) {
        asteroidManager.clear();
      }

      const bossPool = SYNONYM_BOSS_POOLS[Math.min(SYNONYM_BOSS_POOLS.length - 1, newRealmIdx - 1)] || SYNONYM_BOSS_POOLS[0];
      this.audio.play("lightning");
      this.state.setSpeech(`TÂM MA GIÁNG THẾ! TRẢM TỪ ĐỒNG NGHĨA PHÁ GIÁP!`, 3500);

      if (this.onSpawnBoss) {
        this.onSpawnBoss(bossPool, newRealmIdx);
      }
    }

    onBossSlain(newRealmIdx) {
      this.isBossEncounterActive = false;
      this.triggerBreakthrough(newRealmIdx);
    }

    triggerBreakthrough(newRealmIdx) {
      const generation = this._generation;
      const runId = this.state.runId;
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
        if (generation !== this._generation || runId !== this.state.runId || this.state.currentScene !== 'BATTLE' || this.state.isGameOver) return;
        this.state.realmIdx = newRealmIdx;
        this.state.pendingBreakthrough = false;

        // Sinh 3 lựa chọn Cơ Duyên Ngộ Đạo chuẩn hóa theo 4 hướng tu luyện & kỹ năng đột phá
        const selectedTalents = (root.Meowcha && typeof root.Meowcha.generateBreakthroughChoices === "function")
          ? root.Meowcha.generateBreakthroughChoices(this.state, targetRealm)
          : [...(root.Meowcha.TALENT_POOL || [])].sort(() => Math.random() - 0.5).slice(0, 3);

        this.offeredChoices = selectedTalents;
        if (this.onShowTalentModal) {
          this.onShowTalentModal(selectedTalents, targetRealm);
        }
      }, 3500);
    }

    cancel() {
      this._generation++;
      this.offeredChoices = null;
      this.isBossEncounterActive = false;
      this.pendingRealmIdx = null;
      this.state.pendingBreakthrough = false;
    }

    selectTalent(talent) {
      if (!talent || !this.offeredChoices || !this.offeredChoices.includes(talent)) return false;
      this.offeredChoices = null;
      if (typeof talent.apply === "function") {
        talent.apply(this.state);
      }
      if (!talent.isSkill && this.state.selectedTalents) {
        if (!this.state.selectedTalents.includes(talent.id)) {
          this.state.selectedTalents.push(talent.id);
        }
      }
      this.audio.play("chime");
      this.state.setSpeech(`Đã đắc ngộ: [${talent.name}]!`, 2500);
      this.state.setCatState("IDLE");
      return true;
    }
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.BreakthroughFlow = BreakthroughFlow;
  root.Meowcha.SYNONYM_BOSS_POOLS = SYNONYM_BOSS_POOLS;
})(typeof window !== 'undefined' ? window : globalThis);
