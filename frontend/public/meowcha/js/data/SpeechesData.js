/**
 * SpeechesData.js - Lời Thoại & Khẩu Quyết Tiên Hiệp Cho Mèo Tôn (Meow-cha Cultivator)
 * Vibe Tu Tiên kết hợp Chibi Mèo Cute, tạo linh hồn và chiều sâu cho từng chiêu thức!
 */
(function(root) {
  const REALM_SKILL_SPEECHES = [
    // Cảnh giới 0 - Luyện Khí Kỳ: Khí hải sơ khai, nón lá trúc kiếm
    [
      "Meowww! Trúc Kiếm Xuất Vỏ • Trảm Phá Ma Thạch!",
      "Meo meo! Băng Tiêu Thạch Vỡ • Nhất Niệm Định Tâm!",
      "Luyện Khí Nhất Trảm • Phi Kiếm Xuyên Vân Meow!",
      "Ngoạoo! Thanh Trúc Kiếm Khí • Chém Rách Cổ Tự!",
      "Meo~ Móng vuốt sắc bén • Trảm diệt ma thạch!",
      "Trúc Diệp Phiêu Dao • Nhất Kiếm Đoạt Mệnh Meow!"
    ],
    // Cảnh giới 1 - Trúc Cơ Kỳ: Ngọc quan, song kiếm ngọc bích
    [
      "Song Kiếm Hợp Bích • Phong Vũ Tề Phi Meowww!",
      "Trúc Cơ Bừng Nở • Hàn Băng Kiếm Khí Phá!",
      "Ngoạooo! Kiếm Khí Như Hồng • Trảm Yêu Trừ Ma!",
      "Bích Ngọc Hóa Long • Cào Nát Hư Không Meo!",
      "Thanh Ngọc Phi Kiếm • Nhị Kiếm Xuất Sơn Meow!",
      "Meow! Đạo tâm kiên định • Trúc Cơ vô song!"
    ],
    // Cảnh giới 2 - Kim Đan Kỳ: Đan điền kim quang, Bát Quái trận đồ
    [
      "Kim Đan Bát Quái • Phá Toái Hư Không Meowww!",
      "Linh Lực Toàn Khai • Búng Vuốt Trảm Cổ Tự!",
      "Ngoạoo! Kim Quang Vạn Đạo • Thái Cực Trấn Yêu!",
      "Meo meo! Đan điền tụ khí • Chân hỏa luyện ma!",
      "Kim Liên Nở Rộ • Miêu Tiên Hạ Phàm Meow!",
      "Bát Quái Kiếm Trận • Cửu Chuyển Kim Đan Trảm!"
    ],
    // Cảnh giới 3 - Nguyên Anh Kỳ: Râu bạc tiên ông, sấm sét cửu thiên
    [
      "Nguyên Anh Hiển Thánh • Tiểu Miêu Tiên Tử Xuất Khiếu!",
      "Ngoạooo! Cửu Thiên Tử Điện • Phóng Sấm Sét Trảm Ma!",
      "Thần Thức Xuyên Thiên • Tứ Đại Linh Kiếm Đồng Khởi!",
      "Meowww! Lôi Động Cửu Tiêu • Tuyệt Sát Thiên Kiếp!",
      "Tiểu Miêu Phân Thân • Hộ Đạo Trảm Yêu Meo!",
      "Tử Lôi Giáng Thế • Nhất Niệm Vạn Từ Diệt!"
    ],
    // Cảnh giới 4 - Thái Thượng Kiếm Tôn: Hoàng bào chân long, chí tôn vạn kiếm
    [
      "Vạn Kiếm Quy Tông • Đại Đạo Đắc Thành Meowww!",
      "Chân Long Hộ Giá • Nhất Niệm Định Càn Khôn Ngoạoo!",
      "Thái Thượng Chí Tôn • Hoàng Bào Miêu Đế Xuất Thế!",
      "Meo meo! Vạn Đạo Long Ngâm • Thiên Địa Đồng Bi!",
      "Thiên Kiếp Đã Diệt • Ngự Long Phi Thăng Meowww!",
      "Bát Đại Hoàng Kim Kiếm • Tuyệt Đỉnh Phong Thần!"
    ]
  ];

  const HURT_SPEECHES = [
    "Meowww! Đau đan điền quá (> <)!",
    "Ngoạoo! Ma thạch dám đụng trúng đuôi mèo!",
    "Meo! Khí huyết chấn động, phải tập trung gõ nhanh hơn!",
    "Úi chao! Tản mác linh khí rồi meowww!",
    "Ngoạooo! Định tâm dưỡng khí, không để ma thạch chạm đất!"
  ];

  const COMBO_SPEECHES = {
    5: "Meow! Kiếm ý bắt đầu cuồn cuộn! Combo x5!",
    10: "Ngoạoo! Song trảo xuất thần! Combo x10 bừng nở!",
    15: "Meowww! Linh khí quán đính! Kiếm pháp như thần x15!",
    20: "Tuyệt đỉnh! Tiên Miêu Thông Tuệ! Combo x20 vô địch thiên hạ!"
  };

  const MYSTIC_QUOTES = [
    "“Ngụm trà đắng lắng ngàn kiếm ý • Chờ gió xuân khai mở độ kiếp đài”",
    "“Cửu U Ma Thạch xé rách khí quyển • Kiếm ý quy tông định càn khôn”",
    "“Tâm tịnh như gương sáng, nhất niệm trảm vạn từ vựng IELTS”",
    "“Luyện khí tụ đan điền, vạn kiếm xuất sơn phá toái hư không”",
    "“Đạo tại tâm, kiếm tại thủ. Vội vã sinh tâm ma, điềm tĩnh định thiên hạ”",
    "“Một vuốt định giang sơn, chữ chữ khắc kim chứng đạo Bảng Vàng meowww”"
  ];

  const IDLE_WHISPERS = [
    "Meo~ Hớp một ngụm tiên trà, đan điền ấm áp...",
    "Tai mèo nghe thấy tiếng sấm ngoài ba mươi dặm...",
    "Trúc kiếm còn bén, chỉ đợi đạo hữu định tâm xuất chiêu.",
    "Gõ đúng từng chữ, kiếm ý sẽ tự thông thiên meowww!",
    "Đạo hữu vững tay phím, ta xuất phi kiếm hộ thể!",
    "Meow~ Vuốt râu thiền định, linh khí dâng trào trong chén trà..."
  ];

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.REALM_SKILL_SPEECHES = REALM_SKILL_SPEECHES;
  root.Meowcha.HURT_SPEECHES = HURT_SPEECHES;
  root.Meowcha.COMBO_SPEECHES = COMBO_SPEECHES;
  root.Meowcha.MYSTIC_QUOTES = MYSTIC_QUOTES;
  root.Meowcha.IDLE_WHISPERS = IDLE_WHISPERS;
})(typeof window !== 'undefined' ? window : globalThis);
