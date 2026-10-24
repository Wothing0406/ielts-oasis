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
        { word: "ARDUOUS", ipa: "/ˈɑː.dʒu.əs/", meaning: "Gian nan đầy thử thách khốc liệt" },
        { word: "FORMIDABLE", ipa: "/ˈfɔː.mɪ.də.bəl/", meaning: "Đáng gờm, dữ dội, ghê gớm" },
        { word: "DEMANDING", ipa: "/dɪˈmɑːn.dɪŋ/", meaning: "Đòi hỏi khắt khe, áp lực cao" }
      ]
    },
    {
      targetRealm: 2,
      bossTitle: "TÂM MA KHẢO NGHIỆM • KIM ĐAN KỲ",
      baseWord: "IMPORTANT",
      baseMeaning: "Quan trọng, cốt yếu",
      shields: [
        { word: "CRUCIAL", ipa: "/ˈkruː.ʃəl/", meaning: "Cực kỳ then chốt, quyết định" },
        { word: "PARAMOUNT", ipa: "/ˈpær.ə.maʊnt/", meaning: "Tối quan trọng, tối cao" },
        { word: "IMPERATIVE", ipa: "/ɪmˈper.ə.tɪv/", meaning: "Bắt buộc, cấp thiết, không thể thiếu" }
      ]
    },
    {
      targetRealm: 3,
      bossTitle: "TÂM MA KHẢO NGHIỆM • NGUYÊN ANH KỲ",
      baseWord: "DANGEROUS",
      baseMeaning: "Nguy hiểm, hiểm họa",
      shields: [
        { word: "PERILOUS", ipa: "/ˈper.əl.əs/", meaning: "Hiểm nguy khôn lường, chực chờ tai họa" },
        { word: "HAZARDOUS", ipa: "/ˈhæz.ə.dəs/", meaning: "Hiểm họa, độc hại, rủi ro cao" },
        { word: "TREACHEROUS", ipa: "/ˈtretʃ.ər.əs/", meaning: "Trắc trở hiểm ác, nguy nan" }
      ]
    },
    {
      targetRealm: 4,
      bossTitle: "TÂM MA KHẢO NGHIỆM • ĐỘ KIẾP CHÍ TÔN",
      baseWord: "CHANGE",
      baseMeaning: "Biến đổi, chuyển biến",
      shields: [
        { word: "METAMORPHOSE", ipa: "/ˌmet.əˈmɔː.fəʊz/", meaning: "Lột xác biến hình thăng hoa" },
        { word: "TRANSFIGURE", ipa: "/trænsˈfɪɡ.ər/", meaning: "Hóa thân rực rỡ, đổi mới linh hồn" },
        { word: "REVOLUTIONIZE", ipa: "/ˌrev.əˈluː.ʃən.aɪz/", meaning: "Cách mạng hóa, biến đổi toàn diện" }
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
  root.Meowcha.SYNONYM_BOSS_POOLS = SYNONYM_BOSS_POOLS;
})(typeof window !== 'undefined' ? window : globalThis);
