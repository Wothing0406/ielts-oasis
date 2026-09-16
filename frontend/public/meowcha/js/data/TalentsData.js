/**
 * TalentsData.js - Hệ Thống Thiên Phú Roguelike Đột Phá
 * Người chơi chọn 1 trong 3 Ngọc Giản thiên phú khi vượt qua cảnh giới
 */
(function(root) {
  const TALENT_POOL = [
    {
      id: "MAX_HP",
      icon: "丹",
      name: "Cố Bản Bồi Nguyên",
      rarity: "HIẾM",
      rarityColor: "#10B981",
      type: "Tâm Pháp Thể Chất",
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
      name: "Định Thần Thanh Tâm",
      rarity: "CỰC PHẨM",
      rarityColor: "#06B6D4",
      type: "Tâm Pháp Tinh Thần",
      desc: "Tập trung kiếm ý cực hạn, làm chậm vĩnh viễn -25% Tốc độ rơi của toàn bộ Cổ Ngữ!",
      apply: (state) => {
        state.slowFactor = (state.slowFactor || 1.0) * 0.75;
        state.talents.slowFactor = state.slowFactor;
      }
    },
    {
      id: "CRIT_STRIKE",
      icon: "斩",
      name: "Nhất Kiếm Phân Thần",
      rarity: "TIÊN PHẨM",
      rarityColor: "#F59E0B",
      type: "Kiếm Đạo Chí Mạng",
      desc: "35% Tỷ lệ xuất hiện Đòn Đánh Chí Mạng! Khi trảm 1 từ lập tức phá nát thêm 1 ma thạch khác!",
      apply: (state) => {
        state.critChance = (state.critChance || 0) + 0.35;
        state.talents.critChance = state.critChance;
      }
    },
    {
      id: "SCORE_FOCUS",
      icon: "悟",
      name: "Thần Niệm Tỏa Định",
      rarity: "HIẾM",
      rarityColor: "#8B5CF6",
      type: "Tâm Đạo Ngộ Đạo",
      desc: "Miễn nhiễm chấn thương khi gõ sai, đồng thời gia tăng vĩnh viễn +50% Điểm Tu Vi mỗi từ!",
      apply: (state) => {
        state.scoreMultiplier = (state.scoreMultiplier || 1.0) + 0.5;
        state.talents.scoreMultiplier = state.scoreMultiplier;
        state.talents.typoImmune = true;
      }
    },
    {
      id: "GOLDEN_SHIELD",
      icon: "盾",
      name: "Kim Chung Trào Hộ Thể",
      rarity: "CỰC PHẨM",
      rarityColor: "#EAB308",
      type: "Hộ Thân Thần Chú",
      desc: "Ngưng tụ 2 tầng Linh Thuẫn Kim Chung Trào, miễn nhiễm 2 lần ma thạch đập vào đan điền!",
      apply: (state) => {
        state.shieldCharges = (state.shieldCharges || 0) + 2;
        state.talents.shieldCharges = state.shieldCharges;
      }
    },
    {
      id: "AUTO_SWORD",
      icon: "诛",
      name: "Vạn Kiếm Tự Động Trận",
      rarity: "TIÊN PHẨM",
      rarityColor: "#EC4899",
      type: "Kiếm Trận Thần Thông",
      desc: "Mỗi khi đạt chuỗi 3 từ liên tiếp (Combo x3), tự động phóng phi kiếm diệt ngay ma thạch kế tiếp!",
      apply: (state) => {
        state.autoKill = true;
        state.talents.autoKill = true;
      }
    }
  ];

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.TALENT_POOL = TALENT_POOL;
})(typeof window !== 'undefined' ? window : globalThis);
