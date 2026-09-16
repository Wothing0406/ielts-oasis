/**
 * RealmsData.js - 5 Cảnh Giới Tu Chân & Thông Số Cốt Lõi
 * Quản lý danh hiệu, chỉ số thăng hoa, màu sắc chủ đạo và pháp bảo
 */
(function(root) {
  const CULTIVATION_REALMS = [
    {
      id: 0,
      name: "Luyện Khí Kỳ",
      title: "Tiểu Miêu Kiếm Đồng",
      band: "4.0 - 5.0",
      minScore: 0,
      minWords: 0,
      color: "#10B981",
      glowColor: "rgba(16, 185, 129, 0.6)",
      swordName: "Thanh Trúc Kiếm",
      swordColor: "#22C55E",
      asteroidType: "FROST",
      elementName: "Băng Phách Ma Thạch",
      desc: "Nón lá mộc mạc, Bích Ngọc Trúc Kiếm, khí hải sơ khai",
      auraColor: "#34D399",
      speedMult: 1.15
    },
    {
      id: 1,
      name: "Trúc Cơ Kỳ",
      title: "Miêu Tiên Trúc Cơ",
      band: "6.0 - 6.5",
      minScore: 2000,
      minWords: 15,
      color: "#06B6D4",
      glowColor: "rgba(6, 182, 212, 0.7)",
      swordName: "Song Kiếm Bích Ngọc",
      swordColor: "#38BDF8",
      asteroidType: "INFERNO",
      elementName: "Hỏa Diễm Ma Thạch",
      desc: "Đạo bào bích ngọc, song kiếm đan chéo, linh khí lượn lờ",
      auraColor: "#67E8F9",
      speedMult: 1.45
    },
    {
      id: 2,
      name: "Kim Đan Kỳ",
      title: "Kim Đan Chân Nhân",
      band: "7.0 - 7.5",
      minScore: 6000,
      minWords: 40,
      color: "#F59E0B",
      glowColor: "rgba(245, 158, 11, 0.8)",
      swordName: "Hoàng Kim Trảm Tiên",
      swordColor: "#FBBF24",
      asteroidType: "VOID",
      elementName: "Hư Không Ma Thạch",
      desc: "Đạo quan hoàng kim, Kim Liên 8 cánh, Kim Đan lơ lửng tỏa nắng",
      auraColor: "#FDE047",
      speedMult: 1.85
    },
    {
      id: 3,
      name: "Nguyên Anh Kỳ",
      title: "Nguyên Anh Tiên Tôn",
      band: "8.0+",
      minScore: 14000,
      minWords: 85,
      color: "#A855F7",
      glowColor: "rgba(168, 85, 247, 0.85)",
      swordName: "Cửu Thiên Thần Lôi",
      swordColor: "#C084FC",
      asteroidType: "BLOOD_THUNDER",
      elementName: "Huyết Lôi Ma Thạch",
      desc: "Tử kim tiên bào, sương mây tím bồng bềnh, Chibi Anh Linh hộ đạo",
      auraColor: "#E879F9",
      speedMult: 2.30
    },
    {
      id: 4,
      name: "Độ Kiếp Kỳ",
      title: "Thái Thượng Kiếm Tôn",
      band: "Master C2",
      minScore: 30000,
      minWords: 150,
      color: "#F43F5E",
      glowColor: "rgba(244, 63, 94, 0.9)",
      swordName: "Thái Sơ Vô Cực Kiếm",
      swordColor: "#FDE047",
      asteroidType: "PRIMORDIAL",
      elementName: "Thái Sơ Hỗn Độn Thạch",
      desc: "Hoàng Kim Đế Tọa, Lục Kiếm Trận 3D xoay quanh, Chân Long xuất thế",
      auraColor: "#FCD34D",
      speedMult: 2.85
    }
  ];

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.CULTIVATION_REALMS = CULTIVATION_REALMS;
})(typeof window !== 'undefined' ? window : globalThis);
