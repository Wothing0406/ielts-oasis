/**
 * TalentsData.js - Hệ Thống Cơ Duyên Ngộ Đạo & Kỹ Năng Đột Phá Roguelike
 * Chuẩn hóa 4 hướng tu luyện: Kiếm Đạo, Hộ Đạo, Linh Vực, Ngộ Đạo
 * Kỹ năng chủ động theo Cảnh Giới: Thanh Phong Kiếm Vực, Kim Đan Hồi Nguyên, Nguyên Anh Định Thân, Vạn Kiếm Quy Tông
 */
(function(root) {
  // 1. BỐN HƯỚNG TU LUYỆN (CULTIVATION PATHS)
  const CULTIVATION_PATHS = {
    KIEM_DAO: {
      id: "KIEM_DAO",
      name: "Kiếm Đạo",
      title: "Tấn Công & Combo",
      color: "#F59E0B",
      icon: "斩",
      desc: "Tăng Tu Vi, bạo kích ma thạch và ngưng tụ kiếm khí liên hoàn"
    },
    HO_DAO: {
      id: "HO_DAO",
      name: "Hộ Đạo",
      title: "Sinh Tồn & Phòng Ngự",
      color: "#10B981",
      icon: "盾",
      desc: "Gia tăng Căn Cốt, ngưng tụ Hộ Thể Kim Chung và hồi phục khí huyết"
    },
    LINH_VUC: {
      id: "LINH_VUC",
      name: "Linh Vực",
      title: "Khống Chế & Tiết Tấu",
      color: "#06B6D4",
      icon: "定",
      desc: "Làm chậm ma thạch, đóng băng thời gian và hóa giải ma chướng"
    },
    NGO_DAO: {
      id: "NGO_DAO",
      name: "Ngộ Đạo",
      title: "Học Tập & Oxford",
      color: "#8B5CF6",
      icon: "悟",
      desc: "Hỗ trợ ghi nhớ, gợi ý ký tự, kéo dài nghĩa từ và ưu tiên từ yếu"
    }
  };

  // 2. PHẨM GIAI CƠ DUYÊN (RARITY)
  const RARITY_INFO = {
    PHAM_PHAM: { id: "PHAM_PHAM", name: "PHÀM PHẨM", color: "#10B981", border: "rgba(16, 185, 129, 0.4)", bg: "rgba(6, 78, 59, 0.3)" },
    LINH_PHAM: { id: "LINH_PHAM", name: "LINH PHẨM", color: "#38BDF8", border: "rgba(56, 189, 248, 0.5)", bg: "rgba(12, 74, 110, 0.35)" },
    HUYEN_PHAM: { id: "HUYEN_PHAM", name: "HUYỀN PHẨM", color: "#C084FC", border: "rgba(192, 132, 252, 0.6)", bg: "rgba(88, 28, 135, 0.4)" },
    THIEN_PHAM: { id: "THIEN_PHAM", name: "THIÊN PHẨM", color: "#F59E0B", border: "rgba(245, 158, 11, 0.7)", bg: "rgba(120, 53, 15, 0.45)" }
  };

  // 3. KỸ NĂNG ĐỘT PHÁ THEO CẢNH GIỚI (BREAKTHROUGH SKILLS)
  const BREAKTHROUGH_SKILLS = {
    // Cảnh giới 0: Luyện Khí Kỳ - Kiếm Khí Hộ Thể (Passive)
    QI_SHIELD_PASSIVE: {
      id: "QI_SHIELD_PASSIVE",
      name: "Kiếm Khí Hộ Thể",
      category: "HO_DAO",
      kind: "PASSIVE",
      minRealm: 0,
      maxLevel: 1,
      rarity: "PHAM_PHAM",
      icon: "盾",
      iconSvg: "shield",
      desc: "Sau mỗi 5 từ hoàn thành liên tiếp không sai: Ngưng tụ 1 lớp Hộ Thuẫn (tối đa 2 lớp). Không tự gõ từ.",
      levels: [
        {
          level: 1,
          streakReq: 5,
          maxShield: 2,
          desc: "Sau mỗi 5 từ hoàn thành liên tiếp không sai: Ngưng tụ 1 lớp Hộ Thuẫn (tối đa 2 lớp)."
        }
      ],
      apply: (state) => {
        state.unlockedSkills = state.unlockedSkills || [];
        if (!state.unlockedSkills.includes("QI_SHIELD_PASSIVE")) {
          state.unlockedSkills.push("QI_SHIELD_PASSIVE");
        }
        state.skillLevels = state.skillLevels || {};
        state.skillLevels["QI_SHIELD_PASSIVE"] = 1;
        state.shieldCharges = Math.min(2, (state.shieldCharges || 0) + 1);
        state.talents.shieldCharges = state.shieldCharges;
      }
    },

    // Cảnh giới 1: Trúc Cơ Kỳ - Thanh Phong Kiếm Vực (Active - Hotkey 1)
    WIND_SWORD_DOMAIN: {
      id: "WIND_SWORD_DOMAIN",
      name: "Thanh Phong Kiếm Vực",
      category: "LINH_VUC",
      kind: "ACTIVE",
      slot: 1,
      minRealm: 1,
      maxLevel: 3,
      rarity: "HUYEN_PHAM",
      icon: "风",
      iconSvg: "winged-sword",
      levels: [
        {
          level: 1,
          slowPct: 0.40,
          duration: 6,
          cd: 25,
          desc: "Triển khai kiếm vực trong 6 giây. Ma thạch giảm 40% tốc độ.",
          summary: "Slow 40% • 6 giây • Cooldown 25s"
        },
        {
          level: 2,
          slowPct: 0.50,
          duration: 7,
          cd: 25,
          desc: "Triển khai kiếm vực trong 7 giây. Ma thạch giảm 50% tốc độ.",
          summary: "Slow 50% • 7 giây • Cooldown 25s"
        },
        {
          level: 3,
          slowPct: 0.55,
          duration: 8,
          cd: 20,
          desc: "Triển khai kiếm vực trong 8 giây. Ma thạch giảm 55% tốc độ, Cooldown giảm 20%.",
          summary: "Slow 55% • 8 giây • Cooldown 20s"
        }
      ],
      apply: (state, targetLevel = 1) => {
        state.unlockedSkills = state.unlockedSkills || [];
        if (!state.unlockedSkills.includes("WIND_SWORD_DOMAIN")) {
          state.unlockedSkills.push("WIND_SWORD_DOMAIN");
        }
        state.skillLevels = state.skillLevels || {};
        state.skillLevels["WIND_SWORD_DOMAIN"] = targetLevel;
      }
    },

    // Cảnh giới 2: Kim Đan Kỳ - Kim Đan Hồi Nguyên (Passive + Active - Hotkey 2)
    GOLDEN_CORE_REGEN: {
      id: "GOLDEN_CORE_REGEN",
      name: "Kim Đan Hồi Nguyên",
      category: "HO_DAO",
      kind: "PASSIVE_ACTIVE",
      slot: 2,
      minRealm: 2,
      maxLevel: 3,
      rarity: "HUYEN_PHAM",
      icon: "丹",
      iconSvg: "cauldron",
      levels: [
        {
          level: 1,
          passiveStreak: 4,
          passiveHeal: 3,
          activeHeal: 8,
          cd: 35,
          desc: "Bị động: Mỗi 4 từ đúng liên tiếp hồi 3 HP. Chủ động: Hồi ngay 8 HP. Cooldown: 35s.",
          summary: "Bị động hồi 3 HP/4 từ • Chủ động hồi 8 HP • CD 35s"
        },
        {
          level: 2,
          passiveStreak: 4,
          passiveHeal: 3,
          activeHeal: 12,
          cd: 30,
          desc: "Bị động: Mỗi 4 từ đúng hồi 3 HP. Chủ động: Hồi ngay 12 HP. Cooldown: 30s.",
          summary: "Bị động hồi 3 HP/4 từ • Chủ động hồi 12 HP • CD 30s"
        },
        {
          level: 3,
          passiveStreak: 4,
          passiveHeal: 4,
          activeHeal: 16,
          cd: 25,
          desc: "Bị động: Mỗi 4 từ đúng hồi 4 HP. Chủ động: Hồi ngay 16 HP. Cooldown: 25s.",
          summary: "Bị động hồi 4 HP/4 từ • Chủ động hồi 16 HP • CD 25s"
        }
      ],
      apply: (state, targetLevel = 1) => {
        state.unlockedSkills = state.unlockedSkills || [];
        if (!state.unlockedSkills.includes("GOLDEN_CORE_REGEN")) {
          state.unlockedSkills.push("GOLDEN_CORE_REGEN");
        }
        state.skillLevels = state.skillLevels || {};
        state.skillLevels["GOLDEN_CORE_REGEN"] = targetLevel;
      }
    },

    // Cảnh giới 3: Nguyên Anh Kỳ - Nguyên Anh Định Thân (Active - Hotkey 3)
    NASCENT_SOUL_FREEZE: {
      id: "NASCENT_SOUL_FREEZE",
      name: "Nguyên Anh Định Thân",
      category: "LINH_VUC",
      kind: "ACTIVE",
      slot: 3,
      minRealm: 3,
      maxLevel: 3,
      rarity: "THIEN_PHAM",
      icon: "婴",
      iconSvg: "yin-yang",
      levels: [
        {
          level: 1,
          freezeDuration: 4.0,
          cd: 30,
          desc: "Kích hoạt: Đóng băng ma thạch hiện tại 4 giây, phát lại phát âm từ vựng. Cooldown: 30s.",
          summary: "Đóng băng 4s • Phát âm • Cooldown 30s"
        },
        {
          level: 2,
          freezeDuration: 5.0,
          cd: 26,
          desc: "Kích hoạt: Đóng băng ma thạch hiện tại 5 giây, phát lại phát âm từ vựng. Cooldown: 26s.",
          summary: "Đóng băng 5s • Phát âm • Cooldown 26s"
        },
        {
          level: 3,
          freezeDuration: 6.0,
          cd: 22,
          desc: "Kích hoạt: Đóng băng ma thạch hiện tại 6 giây, phát lại phát âm từ vựng. Cooldown: 22s.",
          summary: "Đóng băng 6s • Phát âm • Cooldown 22s"
        }
      ],
      apply: (state, targetLevel = 1) => {
        state.unlockedSkills = state.unlockedSkills || [];
        if (!state.unlockedSkills.includes("NASCENT_SOUL_FREEZE")) {
          state.unlockedSkills.push("NASCENT_SOUL_FREEZE");
        }
        state.skillLevels = state.skillLevels || {};
        state.skillLevels["NASCENT_SOUL_FREEZE"] = targetLevel;
      }
    },

    // Cảnh giới 4: Độ Kiếp Kỳ - Vạn Kiếm Quy Tông (Ultimate - Hotkey 4)
    TEN_THOUSAND_SWORDS: {
      id: "TEN_THOUSAND_SWORDS",
      name: "Vạn Kiếm Quy Tông",
      category: "KIEM_DAO",
      kind: "ULTIMATE",
      slot: 4,
      minRealm: 4,
      maxLevel: 1,
      rarity: "THIEN_PHAM",
      icon: "诛",
      iconSvg: "broadsword",
      levels: [
        {
          level: 1,
          reqCombo: 10,
          desc: "Điều kiện: Chuỗi Combo >= 10. Phóng vạn đạo phi kiếm hóa giải ngay ma chướng và lôi kiếp, đồng thời trảm 1 ma thạch nguy hiểm nhất.",
          summary: "Điều kiện Combo >= 10 • Hóa giải Hazard • Trảm ma thạch"
        }
      ],
      apply: (state) => {
        state.unlockedSkills = state.unlockedSkills || [];
        if (!state.unlockedSkills.includes("TEN_THOUSAND_SWORDS")) {
          state.unlockedSkills.push("TEN_THOUSAND_SWORDS");
        }
        state.skillLevels = state.skillLevels || {};
        state.skillLevels["TEN_THOUSAND_SWORDS"] = 1;
      }
    }
  };

  // 4. DANH SÁCH THIÊN PHÚ TOÀN DIỆN (CANONICAL TALENT POOL)
  // Bảo lưu đầy đủ 6 thiên phú nguyên bản để giữ nguyên vẹn 100% tính tương thích ngược cho save & test cũ.
  const TALENT_POOL = [
    {
      id: "MAX_HP",
      icon: "丹",
      iconSvg: "cauldron",
      name: "Cố Bản Bồi Nguyên",
      category: "HO_DAO",
      kind: "PASSIVE",
      rarity: "HIẾM",
      rarityKey: "LINH_PHAM",
      rarityColor: "#10B981",
      type: "Tâm Pháp Thể Chất",
      statName: "Căn Cốt",
      desc: "Gia tăng +25 Đan Điền Khí Huyết (Max HP) và hồi phục 100% sinh lực ngay lập tức!",
      apply: (state) => {
        state.maxHp += 25;
        state.hp = state.maxHp;
        state.talents.hpBonus = (state.talents.hpBonus || 0) + 25;
      }
    },
    {
      id: "SLOW_TIME",
      icon: "定",
      iconSvg: "yin-yang",
      name: "Định Thần Thanh Tâm",
      category: "LINH_VUC",
      kind: "PASSIVE",
      rarity: "CỰC PHẨM",
      rarityKey: "HUYEN_PHAM",
      rarityColor: "#06B6D4",
      type: "Tâm Pháp Tinh Thần",
      statName: "Linh Vực",
      desc: "Tốc độ rơi nhân 0,75, cộng dồn đến mức giảm tối đa 70%. Có hiệu lực sau khi lưu và tiếp tục.",
      apply: (state) => {
        state.talents.slowFactor = Math.max(0.3, (state.talents.slowFactor || 1.0) * 0.75);
      }
    },
    {
      id: "CRIT_STRIKE",
      icon: "斩",
      iconSvg: "winged-sword",
      name: "Nhất Kiếm Phân Thần",
      category: "KIEM_DAO",
      kind: "PASSIVE",
      rarity: "TIÊN PHẨM",
      rarityKey: "THIEN_PHAM",
      rarityColor: "#F59E0B",
      type: "Kiếm Đạo Chí Mạng",
      statName: "Kiếm Tâm",
      desc: "35% Tỷ lệ xuất hiện Đòn Đánh Chí Mạng! Khi trảm 1 từ lập tức phá nát thêm 1 ma thạch khác!",
      apply: (state) => {
        state.talents.critChance = Math.min(1, (state.talents.critChance || 0) + 0.35);
      }
    },
    {
      id: "SCORE_FOCUS",
      icon: "悟",
      iconSvg: "dragon-shield",
      name: "Thần Niệm Tỏa Định",
      category: "HO_DAO",
      kind: "PASSIVE",
      rarity: "HIẾM",
      rarityKey: "LINH_PHAM",
      rarityColor: "#8B5CF6",
      type: "Tâm Đạo Ngộ Đạo",
      statName: "Định Tâm",
      desc: "Gõ sai vẫn được ghi vào thống kê nhưng không gây hình phạt. Tu Vi thêm hệ số 0,5, tối đa nhân 3.",
      apply: (state) => {
        state.talents.scoreMultiplier = Math.min(3, (state.talents.scoreMultiplier || 1.0) + 0.5);
        state.talents.typoImmune = true;
      }
    },
    {
      id: "GOLDEN_SHIELD",
      icon: "盾",
      iconSvg: "shield",
      name: "Kim Chung Hộ Thể",
      category: "HO_DAO",
      kind: "PASSIVE",
      rarity: "CỰC PHẨM",
      rarityKey: "HUYEN_PHAM",
      rarityColor: "#EAB308",
      type: "Hộ Thân Thần Chú",
      statName: "Hộ Thể",
      desc: "Ngưng tụ 2 tầng linh thuẫn, hấp thụ 2 lần sát thương. Lưu đúng số khiên còn lại.",
      apply: (state) => {
        state.shieldCharges = (state.shieldCharges || 0) + 2;
        state.talents.shieldCharges = state.shieldCharges;
      }
    },
    {
      id: "AUTO_SWORD",
      icon: "诛",
      iconSvg: "broadsword",
      name: "Vạn Kiếm Tự Động Trận",
      category: "KIEM_DAO",
      kind: "PASSIVE",
      rarity: "TIÊN PHẨM",
      rarityKey: "THIEN_PHAM",
      rarityColor: "#EC4899",
      type: "Kiếm Trận Thần Thông",
      statName: "Kiếm Thế",
      desc: "Mỗi khi đạt chuỗi 3 từ liên tiếp (Combo x3), tự động phóng phi kiếm diệt ngay ma thạch kế tiếp!",
      apply: (state) => {
        state.talents.autoKill = true;
      }
    }
  ];

  // --- CÁC THIÊN PHÚ MỞ RỘNG BẢO ĐẢM CHIỀU SÂU BUILD ---
  const EXTENDED_TALENTS = [
    {
      id: "SWORD_MASTERY",
      icon: "剑",
      iconSvg: "winged-sword",
      name: "Vô Cực Kiếm Ý",
      category: "KIEM_DAO",
      kind: "PASSIVE",
      rarity: "LINH PHẨM",
      rarityKey: "LINH_PHAM",
      rarityColor: "#38BDF8",
      type: "Kiếm Đạo Tu Vi",
      statName: "Ngộ Tính",
      desc: "Gia tăng uy lực kiếm khí, tăng thêm +0.3 hệ số Tu Vi khi trảm ma thạch (tối đa nhân 3).",
      apply: (state) => {
        state.talents.scoreMultiplier = Math.min(3.0, (state.talents.scoreMultiplier || 1.0) + 0.3);
      }
    },
    {
      id: "COMBO_POTENCY",
      icon: "势",
      iconSvg: "fast-arrow",
      name: "Kiếm Thế Liên Hoàn",
      category: "KIEM_DAO",
      kind: "PASSIVE",
      rarity: "LINH PHẨM",
      rarityKey: "LINH_PHAM",
      rarityColor: "#38BDF8",
      type: "Kiếm Đạo Liên Kích",
      statName: "Kiếm Thế",
      desc: "Mỗi nấc Combo gia tăng thêm 35% điểm thưởng Tu Vi, giúp bứt phá kỷ lục Bảng Phong Thần.",
      apply: (state) => {
        state.passiveModifiers = state.passiveModifiers || {};
        state.passiveModifiers.comboBonus = (state.passiveModifiers.comboBonus || 0.08) + 0.03;
      }
    },
    {
      id: "DAMAGE_REDUCTION",
      icon: "甲",
      iconSvg: "dragon-shield",
      name: "Bất Hoại Kim Thân",
      category: "HO_DAO",
      kind: "PASSIVE",
      rarity: "HUYỀN PHẨM",
      rarityKey: "HUYEN_PHAM",
      rarityColor: "#C084FC",
      type: "Hộ Đạo Hộ Thể",
      statName: "Căn Cốt",
      desc: "Rèn luyện gân cốt như huyền thiết, giảm 25% sát thương nhận vào khi ma thạch chạm đất.",
      apply: (state) => {
        state.passiveModifiers = state.passiveModifiers || {};
        state.passiveModifiers.damageReduction = Math.min(0.5, (state.passiveModifiers.damageReduction || 0) + 0.25);
      }
    },
    {
      id: "HAZARD_DAMPENER",
      icon: "净",
      iconSvg: "pagoda",
      name: "Tịnh Hóa Ma Chướng",
      category: "LINH_VUC",
      kind: "PASSIVE",
      rarity: "LINH PHẨM",
      rarityKey: "LINH_PHAM",
      rarityColor: "#38BDF8",
      type: "Linh Vực Trừ Tà",
      statName: "Tẩy Uế",
      desc: "Linh quang bảo hộ, giảm 40% thời gian ma vân che mắt và giảm số từ cần thiết để giải Thiên Kiếp.",
      apply: (state) => {
        state.passiveModifiers = state.passiveModifiers || {};
        state.passiveModifiers.hazardDurationBonus = (state.passiveModifiers.hazardDurationBonus || 1.0) * 0.6;
      }
    },
    {
      id: "MIND_HINT",
      icon: "慧",
      iconSvg: "asian-lantern",
      name: "Tuệ Nhãn Khai Minh",
      category: "NGO_DAO",
      kind: "PASSIVE",
      rarity: "HUYỀN PHẨM",
      rarityKey: "HUYEN_PHAM",
      rarityColor: "#C084FC",
      type: "Ngộ Đạo Ôn Cố",
      statName: "Tuệ Nhãn",
      desc: "Sau 2 lần gõ sai liên tiếp trên cùng một từ, ngọc giản tự động phát quang ký tự tiếp theo.",
      apply: (state) => {
        state.passiveModifiers = state.passiveModifiers || {};
        state.passiveModifiers.mindHint = true;
      }
    },
    {
      id: "MEANING_PERSISTENCE",
      icon: "解",
      iconSvg: "scroll-unfurled",
      name: "Động Triệt Huyền Nghĩa",
      category: "NGO_DAO",
      kind: "PASSIVE",
      rarity: "PHÀM PHẨM",
      rarityKey: "PHAM_PHAM",
      rarityColor: "#10B981",
      type: "Ngộ Đạo Nghĩa Cổ",
      statName: "Huyền Nghĩa",
      desc: "Kéo dài thời gian hiển thị giải nghĩa tiếng Việt và phiên âm IPA trên đàn tế kiếm thêm 3 giây.",
      apply: (state) => {
        state.passiveModifiers = state.passiveModifiers || {};
        state.passiveModifiers.meaningDisplayDuration = 6000;
      }
    },
    {
      id: "WEAK_WORD_AFFINITY",
      icon: "温",
      iconSvg: "cauldron",
      name: "Ôn Cố Tri Tân",
      category: "NGO_DAO",
      kind: "PASSIVE",
      rarity: "LINH PHẨM",
      rarityKey: "LINH_PHAM",
      rarityColor: "#38BDF8",
      type: "Ngộ Đạo SRS",
      statName: "Ôn Cố",
      desc: "Tăng gấp đôi xác suất xuất hiện các từ vựng trong danh sách ôn tập cá nhân (SRS Flashcards).",
      apply: (state) => {
        state.passiveModifiers = state.passiveModifiers || {};
        state.passiveModifiers.weakWordWeight = 2.0;
      }
    }
  ];

  const ALL_TALENTS = [...TALENT_POOL, ...EXTENDED_TALENTS];

  // 5. THUẬT TOÁN SINH LỰA CHỌN CƠ DUYÊN NGỘ ĐẠO (ANTI-COLLISION & PATH DIVERSITY)
  function generateBreakthroughChoices(state, targetRealm) {
    const choices = [];
    const targetRealmIdx = (targetRealm && typeof targetRealm.index === "number") ? targetRealm.index : (state.realmIdx || 1);
    const unlocked = state.unlockedSkills || [];
    const levels = state.skillLevels || {};

    // 1. Kiểm tra kỹ năng đặc trưng của cảnh giới mới (nếu chưa mở)
    const realmSkillKeyMap = {
      0: "QI_SHIELD_PASSIVE",
      1: "WIND_SWORD_DOMAIN",
      2: "GOLDEN_CORE_REGEN",
      3: "NASCENT_SOUL_FREEZE",
      4: "TEN_THOUSAND_SWORDS"
    };

    const signatureKey = realmSkillKeyMap[targetRealmIdx];
    if (signatureKey && BREAKTHROUGH_SKILLS[signatureKey]) {
      const skillDef = BREAKTHROUGH_SKILLS[signatureKey];
      const curLv = levels[signatureKey] || 0;
      if (curLv === 0) {
        // Đưa kỹ năng đặc trưng của cảnh giới vào danh sách lựa chọn
        const lv1 = skillDef.levels[0];
        choices.push({
          id: skillDef.id,
          isSkill: true,
          skillId: skillDef.id,
          targetLevel: 1,
          name: skillDef.name,
          category: skillDef.category,
          kind: skillDef.kind,
          rarityKey: skillDef.rarity,
          rarityColor: (RARITY_INFO[skillDef.rarity] || RARITY_INFO.HUYEN_PHAM).color,
          rarityName: (RARITY_INFO[skillDef.rarity] || RARITY_INFO.HUYEN_PHAM).name,
          icon: skillDef.icon,
          iconSvg: skillDef.iconSvg,
          desc: lv1.desc,
          summary: lv1.summary || lv1.desc,
          statChange: `Khai mở Thần Thông [ Cấp I ]`,
          apply: (st) => skillDef.apply(st, 1)
        });
      }
    }

    // 2. Kiểm tra nâng cấp cho các kỹ năng đã mở khóa (Level Up 1 -> 2 hoặc 2 -> 3)
    for (const sKey of unlocked) {
      if (choices.length >= 2) break;
      const sDef = BREAKTHROUGH_SKILLS[sKey];
      if (!sDef || !sDef.levels) continue;
      const curLv = levels[sKey] || 1;
      if (curLv < sDef.maxLevel) {
        const nextLv = curLv + 1;
        const curData = sDef.levels[curLv - 1];
        const nextData = sDef.levels[nextLv - 1];
        choices.push({
          id: `${sDef.id}_LV${nextLv}`,
          isSkill: true,
          skillId: sDef.id,
          targetLevel: nextLv,
          name: `${sDef.name} ${nextLv === 2 ? "II" : "III"}`,
          category: sDef.category,
          kind: sDef.kind,
          rarityKey: nextLv === 3 ? "THIEN_PHAM" : "HUYEN_PHAM",
          rarityColor: (RARITY_INFO[nextLv === 3 ? "THIEN_PHAM" : "HUYEN_PHAM"]).color,
          rarityName: (RARITY_INFO[nextLv === 3 ? "THIEN_PHAM" : "HUYEN_PHAM"]).name,
          icon: sDef.icon,
          iconSvg: sDef.iconSvg,
          desc: nextData.desc,
          summary: nextData.summary || nextData.desc,
          statChange: `Cấp ${curLv} ➔ Cấp ${nextLv}`,
          apply: (st) => sDef.apply(st, nextLv)
        });
      }
    }

    // 3. Bổ sung từ ALL_TALENTS hợp lệ (Anti-maxed & Diversity check)
    const candidateTalents = ALL_TALENTS.filter(t => {
      // Loại trừ các talent đã đạt giới hạn cứng
      if (t.id === "SLOW_TIME" && state.talents && state.talents.slowFactor <= 0.3) return false;
      if (t.id === "CRIT_STRIKE" && state.talents && state.talents.critChance >= 1.0) return false;
      if (t.id === "SCORE_FOCUS" && state.talents && state.talents.scoreMultiplier >= 3.0 && state.talents.typoImmune) return false;
      if (t.id === "AUTO_SWORD" && state.talents && state.talents.autoKill) return false;
      if (t.id === "MIND_HINT" && state.passiveModifiers && state.passiveModifiers.mindHint) return false;
      if (t.id === "MEANING_PERSISTENCE" && state.passiveModifiers && state.passiveModifiers.meaningDisplayDuration >= 6000) return false;
      if (t.id === "WEAK_WORD_AFFINITY" && state.passiveModifiers && state.passiveModifiers.weakWordWeight >= 2.0) return false;
      // Tránh trùng lặp với các lựa chọn đã có
      if (choices.some(c => c.id === t.id)) return false;
      return true;
    });

    // Shuffle ngẫu nhiên danh sách ứng viên
    const shuffledTalents = candidateTalents.sort(() => Math.random() - 0.5);

    // Lọc lấy các lựa chọn sao cho ít nhất 2/3 lựa chọn khác nhóm gameplay (category)
    for (const tal of shuffledTalents) {
      if (choices.length >= 3) break;

      // Kiểm tra đa dạng nhóm: Tránh đưa cả 3 lựa chọn cùng 1 nhóm nếu còn ứng viên nhóm khác
      const existingCategories = choices.map(c => c.category);

      // Nếu đã có 2 lựa chọn cùng nhóm này, ưu tiên chọn nhóm khác
      const categoryCount = existingCategories.filter(cat => cat === tal.category).length;
      if (categoryCount >= 2 && shuffledTalents.some(t => !existingCategories.includes(t.category) && !choices.some(c => c.id === t.id))) {
        continue;
      }

      const rInfo = RARITY_INFO[tal.rarityKey] || RARITY_INFO.LINH_PHAM;
      choices.push({
        id: tal.id,
        isSkill: false,
        name: tal.name,
        category: tal.category || "HO_DAO",
        kind: tal.kind || "PASSIVE",
        rarityKey: tal.rarityKey || "LINH_PHAM",
        rarityColor: tal.rarityColor || rInfo.color,
        rarityName: rInfo.name,
        icon: tal.icon,
        iconSvg: tal.iconSvg || "cauldron",
        type: tal.type,
        statName: tal.statName,
        desc: tal.desc,
        summary: tal.desc,
        statChange: `Đắc ngộ Thần Thông`,
        apply: (st) => tal.apply(st)
      });
    }

    // Fallback an toàn nếu pool bị hạn chế: Lấy ngẫu nhiên từ TALENT_POOL
    if (choices.length < 3) {
      for (const t of TALENT_POOL) {
        if (choices.length >= 3) break;
        if (!choices.some(c => c.id === t.id)) {
          choices.push({
            id: t.id,
            isSkill: false,
            name: t.name,
            category: t.category || "HO_DAO",
            kind: "PASSIVE",
            rarityKey: t.rarityKey || "PHAM_PHAM",
            rarityColor: t.rarityColor || "#10B981",
            rarityName: "PHÀM PHẨM",
            icon: t.icon,
            iconSvg: t.iconSvg || "cauldron",
            desc: t.desc,
            summary: t.desc,
            statChange: "Lĩnh ngộ",
            apply: (st) => t.apply(st)
          });
        }
      }
    }

    return choices.slice(0, 3);
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.CULTIVATION_PATHS = CULTIVATION_PATHS;
  root.Meowcha.RARITY_INFO = RARITY_INFO;
  root.Meowcha.BREAKTHROUGH_SKILLS = BREAKTHROUGH_SKILLS;
  root.Meowcha.TALENT_POOL = TALENT_POOL;
  root.Meowcha.generateBreakthroughChoices = generateBreakthroughChoices;
})(typeof window !== 'undefined' ? window : globalThis);
