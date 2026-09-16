/**
 * SpeechesData.js - Lời Thoại & Khẩu Quyết Tiên Hiệp Cho Mèo Tôn
 * Hỗ trợ tạo linh hồn và chiều sâu cho nhân vật trong từng khoảnh khắc chiến đấu
 */
(function(root) {
  const REALM_SKILL_SPEECHES = [
    // Cảnh giới 0 - Luyện Khí Kỳ: Khí hải sơ khai, trúc kiếm xuất trần
    [
      "Trúc Kiếm Một Đao! Phá!",
      "Băng Tiêu Thạch Vỡ! Xuất!",
      "Luyện Khí Nhất Kiếm! Trảm!",
      "Thanh Trúc Trảm Yêu! Tuyệt!"
    ],
    // Cảnh giới 1 - Trúc Cơ Kỳ: Song kiếm hợp bích, linh quang chớp giật
    [
      "Song Kiếm Phong Vũ! Phá!",
      "Trúc Cơ Thiên Kiếm! Xuất!",
      "Kiếm Khí Như Hồng! Trảm!",
      "Bích Ngọc Hóa Long! Diệt!"
    ],
    // Cảnh giới 2 - Kim Đan Kỳ: Kim liên đài sen, kim đan trấn thế
    [
      "Kim Đan Phá Thiên! Phá!",
      "Linh Lực Toàn Khai! Xuất!",
      "Kim Quang Vạn Đạo! Trảm!",
      "Thái Cực Bát Quái! Diệt!"
    ],
    // Cảnh giới 3 - Nguyên Anh Kỳ: Sấm sét cửu thiên, anh linh đồng xuất
    [
      "Nguyên Anh Hiển Thánh! Phá!",
      "Tử Điện Thiên Phong! Xuất!",
      "Thần Thức Xuyên Thiên! Trảm!",
      "Cửu Thiên Thần Lôi! Giáng!"
    ],
    // Cảnh giới 4 - Thái Thượng Kiếm Tôn: Thiên đạo chí tôn, vạn kiếm quy tông
    [
      "Vạn Kiếm Quy Tông! Phá!",
      "Thiên Đạo Kiếm Tông! Xuất!",
      "Thái Thượng Cửu Trảm! Diệt!",
      "Chân Long Xuất Thế! Nghênh!"
    ]
  ];

  const MYSTIC_QUOTES = [
    "“Ngụm trà đắng lắng ngàn kiếm ý • Chờ gió xuân khai mở độ kiếp đài”",
    "“Cửu U Ma Thạch xé rách khí quyển • Kiếm ý quy tông định càn khôn”",
    "“Tâm tịnh như gương sáng, nhất niệm trảm vạn từ vựng IELTS”",
    "“Luyện khí tụ đan điền, vạn kiếm xuất sơn phá toái hư không”",
    "“Đạo tại tâm, kiếm tại thủ. Vội vã sinh tâm ma, điềm tĩnh định thiên hạ”"
  ];

  const IDLE_WHISPERS = [
    "Hớp một ngụm tiên trà, đan điền ấm áp...",
    "Thiên thạch cổ ngữ sắp giáng lâm rồi ư?",
    "Tai mèo nghe thấy tiếng sấm ngoài ba mươi dặm...",
    "Trúc kiếm còn bén, chỉ đợi đạo hữu định tâm.",
    "Gõ đúng từng chữ, kiếm ý sẽ tự thông thiên!"
  ];

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.REALM_SKILL_SPEECHES = REALM_SKILL_SPEECHES;
  root.Meowcha.MYSTIC_QUOTES = MYSTIC_QUOTES;
  root.Meowcha.IDLE_WHISPERS = IDLE_WHISPERS;
})(typeof window !== 'undefined' ? window : globalThis);
