# MASTER GAME DESIGN DOCUMENT (GDD) & KIẾN TRÚC KỸ THUẬT
# MEOW-CHA: VẠN KIẾM QUY TÔNG (萬劍歸宗)

> **Hệ sinh thái:** IELTS Oasis (`ieltsoasis.site`)  
> **Phiên bản Kiến trúc:** v9.0 (Self-Contained Character Sprite Architecture, Multi-Frame SpriteAnimator, 5-Realm Functional Combat & IELTS Mastery Roadmap)  
> **Thể loại:** Vertical Typing Action RPG × Xianxia Roguelike Cultivation × Active Recall / Spaced Repetition (SRS)  
> **Nền tảng:** Web Browser (PC / Laptop & Mobile iOS / Android) — 60 FPS HTML5 Canvas 2D + Web Audio Synthesizer  
> **Nhánh GitHub Backup:** `origin/game/meowcha-cultivation`

---

## MỤC LỤC
1. [GIÁ TRỊ HỌC TIẾNG ANH / IELTS HIỆN TẠI CỦA GAME](#1-giá-trị-học-tiếng-anh--ielts-hiện-tại-của-game)
2. [KIẾN TRÚC THƯ MỤC SPRITE TỰ CHỦ MỚI (`sprites/ v3.0`)](#2-kiến-trúc-thư-mục-sprite-tự-chủ-mới-sprites-v30)
3. [HỆ THỐNG 5 ĐẠI CẢNH GIỚI, THẦN THÔNG BỊ ĐỘNG & BỘ SPRITE ĐỘC BẢN](#3-hệ-thống-5-đại-cảnh-giới-thần-thông-bị-động--bộ-sprite-độc-bản)
4. [KIẾN TRÚC MODULAR ENGINE (`frontend/public/meowcha/js/`)](#4-kiến-trúc-modular-engine-frontendpublicmeowchajs)
5. [ĐỀ XUẤT NÂNG CẤP HỌC THUẬT ("HỌC TIẾNG ANH TU TIÊN" CHUYÊN SÂU)](#5-đề-xuất-nâng-cấp-học-thuật-học-tiếng-anh-tu-tiên-chuyên-sâu)
6. [LỘ TRÌNH SẢN PHẨM ĐẠT 1.000+ NGƯỜI DÙNG (PRODUCT & GROWTH ROADMAP)](#6-lộ-trình-sản-phẩm-đạt-1000-người-dùng-product--growth-roadmap)

---

## 1. GIÁ TRỊ HỌC TIẾNG ANH / IELTS HIỆN TẠI CỦA GAME

Hiện tại, **Meow-Cha: Vạn Kiếm Quy Tông** giúp người học rèn luyện **4 kỹ năng nền tảng** thông qua cơ chế phản xạ gõ phím áp lực thời gian:

1. **Chính tả Phản xạ & Trí nhớ Cơ bắp (Orthographic Muscle Memory):**
   - Trong bài thi IELTS Listening & Writing, người học rất dễ mất điểm đáng tiếc vì viết sai chính tả các từ dài có phụ âm kép (*accommodate, mediterranean, conscientious, resilience*).
   - Việc nhìn từ và gõ chính xác từng ký tự dưới áp lực thiên thạch rơi giúp não bộ ghi nhớ cấu trúc chữ cái tự động vào trí nhớ cơ bắp (Procedural Memory).
2. **Đa Giác Quan: Nhìn Chữ + Gõ Phím + Nghe Phát Âm IPA (`IPAToast.js`):**
   - Ngay khi trảm vỡ một thiên thạch từ vựng, hệ thống lập tức bật thẻ **IPA Toast** hiển thị: **Từ vựng + Phiên âm quốc tế IPA + Loại từ (POS) + Nghĩa tiếng Việt** và tự động đọc phát âm chuẩn bản xứ (`SpeechSynthesisUtterance` `en-US`).
   - Kết nối trực tiếp 3 kênh: **Thị giác (Chữ viết) → Vận động (Gõ phím) → Thính giác (Phát âm IPA)**.
3. **Phân Tầng Từ Vựng Oxford 5000 Theo Cảnh Giới Tu Tiên (`VocabLoader.js`):**
   - Từ vựng được chia theo đúng tiến trình đột phá từ cơ bản đến học thuật chuyên sâu:
     - **Luyện Khí Kỳ (Band 4.0–5.0):** Từ vựng nền tảng CEFR A2–B1.
     - **Trúc Cơ Kỳ (Band 5.5–6.0):** Từ vựng giao tiếp & học thuật B1–B2.
     - **Kim Đan Kỳ (Band 6.5–7.0):** Từ vựng học thuật C1 (Reading / Writing Task 2).
     - **Nguyên Anh & Độ Kiếp Kỳ (Band 7.5–9.0):** Từ vựng C1–C2 nâng cao.
4. **Sổ Tay Linh Từ ("Tàng Kinh Các" / Vocabulary Vault):**
   - Toàn bộ các từ người chơi đã trảm thành công hoặc để lọt mất máu đều được lưu vào **Linh Từ Đã Thu Thập (`collectedWords`)**, cho phép tra cứu lại nghĩa, IPA và nghe lại phát âm bất cứ lúc nào tại Sảnh Chờ.
5. **Bộ Gõ Tiếng Việt Không Lỗi (`IME Safe Interceptor`):**
   - Bắt phím ở tầng vật lý (`event.code`), giúp người học Việt Nam đang bật sẵn Unikey/EVKey vẫn gõ từ tiếng Anh mượt mà mà không bị biến dạng chữ (`w` thành `ư`, `as` thành `á`).

---

## 2. KIẾN TRÚC THƯ MỤC SPRITE TỰ CHỦ MỚI (`sprites/ v3.0`)

Toàn bộ tài nguyên hình ảnh tại `frontend/public/meowcha/sprites/` đã được tái cấu trúc triệt để thành **3 phân khu chuẩn hóa** (`characters/`, `asteroids/`, `maps/`) cùng [`manifest.json`](file:///c:/Users/QuangDev/Downloads/Projects/web/ielts-oasis/frontend/public/meowcha/sprites/manifest.json). Mỗi nhân vật sở hữu thư mục độc lập chứa đầy đủ **Tư thế (`poses/`), Hoạt ảnh đa frame (`sheets/`), Vũ khí & Đạn (`weapon/`), Tia bắn (`beam/`) và Hiệu ứng bắn ra / nổ / chém (`vfx/`)**:

```text
frontend/public/meowcha/sprites/
├── manifest.json                        # Registry trung tâm quản lý toàn bộ 305 đường dẫn sprite
├── characters/
│   ├── realm0_qi_refining/              # Cảnh 0: Luyện Khí Kỳ — Linh Trà Đạo Miêu
│   │   ├── animation.json               # Metadata FPS, số frame & đường dẫn của Cảnh 0
│   │   ├── poses/                       # 5 ảnh tư thế đơn (idle, attack, ultimate, hurt, defeated)
│   │   ├── sheets/                      # 5 sprite sheet đa frame 4-frame (idle_sheet..defeated_sheet)
│   │   ├── weapon/                      # sword.png, sword_sheet.png, projectile.png, projectile_sheet.png
│   │   ├── beam/                        # beam.png, beam_sheet.png (Thanh Trúc Phong Tuyến)
│   │   └── vfx/
│   │       ├── muzzle.png               # Hiệu ứng bắn ra tại đầu kiếm (Thanh Trúc Phát Chiêu)
│   │       ├── muzzle_sheet.png         # Hoạt ảnh bắn ra 4-frame
│   │       ├── hit.png                  # Hiệu ứng nổ khi trúng thiên thạch (Thanh Trúc Linh Bạo)
│   │       ├── hit_sheet.png            # Hoạt ảnh nổ 4-frame
│   │       ├── slash.png                # Vết chém vũ khí (Thanh Trúc Trảm)
│   │       └── slash_sheet.png          # Hoạt ảnh vết chém 4-frame
│   │
│   ├── realm1_foundation/               # Cảnh 1: Trúc Cơ Kỳ — Thanh Vân Ngự Kiếm Miêu
│   │   └── (poses/, sheets/, weapon/, beam/, vfx/{muzzle,hit,slash} + animation.json)
│   ├── realm2_golden_core/              # Cảnh 2: Kim Đan Kỳ — Bát Quái Kim Đan Miêu
│   │   └── (poses/, sheets/, weapon/, beam/, vfx/{muzzle,hit,slash} + animation.json)
│   ├── realm3_nascent_soul/             # Cảnh 3: Nguyên Anh Kỳ — Nguyên Anh Đại Năng
│   │   └── (poses/ + chibi_companion.png, sheets/, weapon/, beam/, vfx/{muzzle,hit,slash} + animation.json)
│   └── realm4_tribulation/              # Cảnh 4: Độ Kiếp Kỳ — Vạn Kiếm Chí Tôn
│       └── (poses/, sheets/, weapon/, beam/, vfx/{muzzle,hit,slash} + animation.json)
│
├── asteroids/                           # Thư mục Thiên Thạch Rơi Xuống
│   ├── ice.png                          # Hàn Băng Thạch (FROST)
│   ├── fire.png                         # Hỏa Diệm Tinh Thạch (FIRE)
│   ├── void.png                         # Hư Không Ám Thạch (VOID)
│   └── thunder.png                      # Thiên Lôi Thạch (THUNDER)
│
└── maps/                                # Thư mục Map, Bối Cảnh & Hiệu Ứng Môi Trường
    ├── bg_study_sanctuary.jpg           # Động phủ tu luyện 16-bit
    ├── mystic_cloud.png                 # Linh vân / chướng khí trôi ngang
    ├── tea_explosion.png                # Vụ nổ linh trà cổ điển
    └── impact_burst_sheet.png           # Hoạt ảnh nổ môi trường 4-frame
```

---

## 3. HỆ THỐNG 5 ĐẠI CẢNH GIỚI, THẦN THÔNG BỊ ĐỘNG & BỘ SPRITE ĐỘC BẢN

Không còn tình trạng các nhân vật cấp cao chỉ dùng chung hiệu ứng màu mè — mỗi cảnh giới hiện có **cơ chế chiến đấu thực chiến riêng biệt** tác động trực tiếp lên thiên thạch, tốc độ rơi và số ký tự cần gõ:

| Cảnh Giới | Đạo Hiệu | Vũ Khí & Đạn (`weapon/`) | Tia Bắn (`beam/`) | Hiệu Ứng Bắn Ra & Nổ (`vfx/`) | Thần Thông Bị Động Thực Chiến |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **0. Luyện Khí Kỳ** | **Linh Trà Đạo Miêu** | Thanh Trúc Linh Kiếm & Kiếm Khí Lá Trúc | **Thanh Trúc Phong Tuyến** (Lục quang dây trúc) | **Thanh Trúc Phát Chiêu** / **Thanh Trúc Linh Bạo** | **Trúc Phong Trì Hoãn:** Mỗi phím gõ đúng làm chậm thiên thạch đang khóa **-22% tốc độ rơi** trong `2.8s`. |
| **1. Trúc Cơ Kỳ** | **Thanh Vân Ngự Kiếm Miêu** | Thanh Ngọc Song Kiếm & Hàn Băng Song Kiếm Khí | **Hàn Băng Song Kiếm Tuyến** (Xoắn kép băng tinh) | **Hàn Băng Phát Chiêu** / **Hàn Băng Tinh Bạo** | **Song Kiếm Hợp Bích:** Mỗi **6 phím đúng** phóng kiếm thứ 2 tự động chém thêm **+1 ký tự** & đẩy lùi thiên thạch `22px`. |
| **2. Kim Đan Kỳ** | **Bát Quái Kim Đan Miêu** | Thái Dương Kim Kiếm & Kim Liên Phượng Hoàng | **Kim Đan Nhật Viêm Trụ** (Đài sen & vòng nhật luân) | **Kim Liên Phát Chiêu** / **Kim Liên Nhật Bạo** | **Kim Liên Bạo Phá:** Mỗi **5 phím đúng** kích nổ Kim Liên tự chém **+1 ký tự**, cộng thêm điểm Tu Vi & đẩy lùi `16px`. |
| **3. Nguyên Anh Kỳ** | **Nguyên Anh Đại Năng** | Tử Điện Thần Kiếm & Tử Điện Lôi Kích | **Cửu Thiên Tử Điện Mạch** (Hồ quang lôi điện tím) | **Tử Điện Phát Chiêu** / **Cửu Thiên Tử Điện Bạo** | **Nguyên Anh Hộ Đạo:** Mỗi **4 phím đúng** giáng thiên lôi **đóng băng thiên thạch `0.75s`**; linh thể Chibi bên vai trái tự động bắn phụ trợ chém thêm **+1 ký tự**. |
| **4. Độ Kiếp Kỳ** | **Vạn Kiếm Chí Tôn** | Chân Long Đế Kiếm & Đầu Rồng Chân Long | **Chân Long Đế Quang Mạch** (Đầu rồng phun kim hỏa) | **Chân Long Phát Chiêu** / **Chân Long Đế Viêm Bạo** | **Chân Long Phệ Thiên:** Mỗi **4 phím đúng** triệu hồi Chân Long **tự động nuốt trọn +2 ký tự**, đẩy lùi thiên thạch `32px` và tăng `+50%` điểm Tu Vi. |

---

## 4. KIẾN TRÚC MODULAR ENGINE (`frontend/public/meowcha/js/`)

Toàn bộ logic vận hành game được phân tách thành các module chuyên biệt:

```text
frontend/public/meowcha/js/
├── data/
│   ├── RealmsData.js           # Chỉ số 5 cảnh giới (máu, tu vi, tỷ lệ rơi, tốc độ)
│   ├── WordDecks.js            # Kho từ vựng Oxford 5000 & 4 Đại Ngọc Giản Tàng Kinh Các
│   ├── TalentsData.js          # Hệ thống thiên phú khi đột phá
│   └── SpeechesData.js         # Khẩu quyết tiên đạo & câu thoại miêu tiên
│
├── core/
│   ├── GameState.js            # Quản lý trạng thái phiên chơi (tu vi, máu, activeDeckId, gameMode)
│   ├── SaveSystem.js           # Hệ thống 3 ngọc giản lưu trữ độc lập
│   ├── AudioManager.js         # Bộ tổng hợp âm thanh Web Audio API cổ phong
│   ├── SpriteAnimator.js       # Engine hoạt ảnh đa frame 60 FPS
│   └── VocabLoader.js          # Nạp từ vựng linh hoạt theo Deck và Cảnh giới
│
├── entities/
│   ├── CatCultivator.js        # Thực thể mèo tiên, vị trí, tư thế, đài sen & thú cưng
│   ├── AsteroidManager.js      # Ma thạch 3D, Active Recall Cloze masking & bảng nghĩa tiếng Việt
│   └── ProjectileSystem.js     # Tia năng lượng, phi kiếm, muzzle firing & đạn bay
│
├── combat/
│   ├── TypingEngine.js         # Bắt phím IME-safe, tính WPM, combo, tính sát thương
│   └── BreakthroughFlow.js     # Xử lý độ kiếp thiên kiếp sấm sét & mở thiên phú
│
├── effects/
│   ├── ParticleEngine.js       # Hạt linh khí, tàn tro, sao băng
│   ├── RealmVFX.js             # Hiệu ứng kiếm trận đặc thù 5 cảnh giới
│   └── FloatingText.js         # Chữ sát thương, bạo kích, tu vi bay lên
│
└── ui/
    ├── XianxiaIcons.js         # Thư viện SVG cổ phong (thay thế triệt để 100% emojis)
    ├── UIManager.js            # Điều khiển HUD, Sảnh Chờ, Tàng Kinh Các & Modals
    ├── IPAToast.js             # Thẻ hiển thị từ vựng, phiên âm IPA & Web Speech API
    ├── VirtualKeyboard.js      # Bàn phím phù thạch khảm ngọc cho Mobile & PC
    └── UnityBridge.js          # Cầu nối đồng bộ WebGL 2D (tùy chọn)
```

---

## 5. HỆ THỐNG PHÁP MÔN TU LUYỆN & TÀNG KINH CÁC ĐÃ HOÀN TẤT (PEDAGOGY UPGRADE)

Hệ thống đã nâng cấp toàn diện cơ chế học thuật từ **Copy-Typing thuần túy** thành **Học Tiếng Anh Chủ Động Đa Phương Thức**:

1. **Pháp Môn 1 — "Ngộ Đạo Thông Linh" (Active Recall Cloze Mode):**
   - Thiên thạch ma thạch chỉ hiển thị ký tự đầu/cuối, toàn bộ ký tự ở giữa bị ẩn bằng dấu phù ấn gạch dưới `_` (`[ R E _ _ _ _ E N T ]`).
   - Phía dưới ma thạch hiển thị bảng gỗ mộc bản viền chu sa chứa **Nghĩa Tiếng Việt chính xác** của từ vựng.
   - Người học buộc phải vận dụng **Active Recall (tái hiện từ vựng từ trí nhớ dài hạn)** dựa trên nghĩa tiếng Việt để gõ từng ký tự. Khi gõ đúng, phù ấn bích ngọc bừng sáng rực rỡ `#34D399`.
2. **Pháp Môn 2 — "Trực Diện Trảm Ma" (Direct Typing Mode):**
   - Chế độ gõ toàn diện toàn bộ ký tự từ vựng dưới áp lực thời gian để rèn luyện tốc độ WPM và phản xạ chính tả cơ bắp (Muscle Memory).
3. **Pháp Môn 3 — "Thính Lôi Biện Âm" (Audio Dictation Mode):**
   - Ma thạch phát âm thanh bản xứ qua Web Speech API kèm bảng phiên âm IPA (`Tiên Âm: /.../`), rèn luyện khả năng nhận diện âm thanh và chính tả chuẩn xác cho IELTS Listening Section 1 & 4.
4. **Tàng Kinh Các (4 Chuyên Đề Từ Vựng IELTS Chuyên Sâu):**
   - **`oxford_5000` (Cửu Chuyển Hỗn Độn Đan):** Toàn tập 5,900+ từ vựng cốt lõi CEFR A1-C1 phân theo 5 cảnh giới tu tiên.
   - **`listening_1200` (Thính Lôi Trực Điểm):** 1,200 từ vựng Listening hay bẫy chính tả (*accommodation, mediterranean, conscientious, entrepreneur*).
   - **`reading_academic` (Thánh Điển Tàng Thư):** Cambridge Reading Academic Band 7.5+ (*biodiversity, archaeological, stratification, photosynthesis*).
   - **`flashcard_srs` (Bản Mệnh Linh Từ):** Sổ tay tự động gom các từ gõ sai để tôi luyện theo phương pháp lặp lại ngắt quãng (SRS).
5. **Chuẩn Mực Giao Diện Cổ Phong — Không Sử Dụng Emoji Đơn Giản:**
   - Triệt tiêu 100% các icon emoji thông thường (`⚔️`, `📜`, `✨`, `🗑️`, `⚡`, `🧧`, `✕`, `★`, `✓`).
   - Thay thế bằng hệ thống vector SVG cổ điển sắc nét từ `XianxiaIcons.js`: Móng Mèo Tiên, Phi Kiếm Thanh Vân, Cuộn Trục Ngọc Giản, Đài Sen Kim Đan, Lôi Ấn Cửu Thiên, Lư Đồng Phong Ấn Hóa Vàng, và Dấu Triện Chu Sa.
6. **Đại Yêu Thú Boss "Tâm Ma Khảo Nghiệm" (IELTS Synonym Boss Fight):**
   - Khi người chơi tích lũy đủ Tu Vi để đột phá cảnh giới, Đại Yêu Thú Boss Tâm Ma sẽ giáng thế mang theo một từ gốc IELTS (ví dụ: `DIFFICULT`, `IMPORTANT`, `DANGEROUS`, `CHANGE`). Người chơi phải trảm vỡ lần lượt **3 lớp hộ thuẫn tương ứng với 3 từ đồng nghĩa Band 7.5+** (ví dụ: `ARDUOUS` -> `FORMIDABLE` -> `DEMANDING`) để phá giáp, tiêu diệt Tâm Ma và chính thức phi thăng cảnh giới mới.
7. **Trình Xuất "Chứng Đạo Đồ" (Shareable Cultivation Certificate PNG Generator):**
   - Tích hợp công cụ Canvas 2D xuất thẻ bài tổng kết **Chứng Đạo Kim Đồ (1200×630px Canvas PNG)** đạt chuẩn tỷ lệ chia sẻ mạng xã hội (Facebook, Twitter/X, Discord) hiển thị chân dung Miêu Tiên theo cảnh giới, Đạo hiệu, Điểm Tu Vi, Kiếm tốc WPM, Số từ IELTS đã trảm, Dấu triện Chu Sa và liên kết tỷ thí. Hỗ trợ tải ảnh PNG trực tiếp và sao chép link thách đấu.
8. **Đồng Bộ Hai Chiều Với Kho Flashcard SRS của IELTS Oasis:**
   - Mọi từ vựng gõ sai liên tiếp hoặc để thiên thạch chạm đáy đan điền đều tự động được ghi nhận vào kho `meowcha_srs_weaknesses` (đồng bộ ngầm lên `/api/vocabulary` với tag `#meowcha_weakness`). Bộ đề **Bản Mệnh Linh Từ (`flashcard_srs`)** trong Tàng Kinh Các sẽ ưu tiên lấy danh sách này để người chơi tôi luyện lặp lại ngắt quãng (Spaced Repetition).

---

## 6. LỘ TRÌNH SẢN PHẨM ĐẠT 1.000+ NGƯỜI DÙNG (PRODUCT & GROWTH ROADMAP)

Để đưa **Meow-Cha: Vạn Kiếm Quy Tông** từ một mini-game thành một **Product giữ chân 1.000+ người dùng hoạt động (MAU/DAU)**, cần triển khai 4 trụ cột Product Growth:

### 6.1. Vòng Lặp Giữ Chân Hàng Ngày (Daily Retention Loop — D1 / D7 / D30)
- **Nhiệm Vụ Tu Luyện Hàng Ngày ("Nhật Thường Tông Môn"):**
  - *Trảm 30 Linh Từ hôm nay*, *Đạt chuỗi Combo 50 không sai*, *Ôn tập 10 Tâm Ma Từ Vựng cũ*. Hoàn thành nhận **Linh Thạch** và giữ chuỗi **Streak Tu Luyện (Đạo Tâm Liên Tiếp)**.
- **Thử Thách "Bí Cảnh Hàng Ngày" (Daily Seed Challenge):**
  - Mỗi ngày toàn server có chung 1 bộ 25 từ IELTS theo chủ đề (*Environment, Technology, Education, Health*). Mọi người chơi thi đấu trên cùng 1 seed để tranh ngôi **Đệ Nhất Kiếm Tôn Trong Ngày**.

### 6.2. Tính Năng Xã Hội & Lan Truyền Tự Nhiên (Viral & Social Mechanics)
- **Thẻ "Chứng Đạo Đồ" Chia Sẻ Mạng Xã Hội (Shareable Cultivation Card):**
  - Khi người chơi Đột Phá Cảnh Giới hoặc lập kỷ lục WPM, xuất ngay 1 tấm ảnh Pixel Art cực đẹp (in hình nhân vật Miêu Tiên của họ, Cảnh giới, Tốc độ gõ WPM, Lượng từ IELTS Band 7.0+ đã trảm, kèm mã QR về `ieltsoasis.site`) để khoe lên Facebook Group IELTS / TikTok / Discord.
- **Tông Môn Đại Chiến & Tỷ Thí Đạo Hữu (1v1 Typing Duel / Sect Leaderboard):**
  - Cho phép tạo phòng thách đấu gõ từ vựng IELTS thời gian thực 1v1 (qua WebSocket) với bạn bè: Ai gõ xong từ nhanh hơn sẽ phóng thiên thạch sang màn hình đối phương.

### 6.3. Mở Rộng Kho Nội Dung & Tùy Biến (Meta-Progression & Monetization/Engagement)
- **Chọn Bộ Đề Theo Mục Tiêu Thi Thật (Custom Deck Selector):**
  - Cho phép người chơi trước khi vào trận chọn đúng bộ từ mình cần: *IELTS Listening 1200 Words often misspelled*, *Cambridge IELTS 18–19 Reading Academic*, *Writing Task 2 Band 8.0 Collocations*, hoặc *Chính bộ Flashcard cá nhân của tôi*.
- **Bảo Khố Pháp Bảo & Linh Thú (Cosmetic Shop bằng Linh Thạch học tập):**
  - Dùng điểm Tu Vi / Linh Thạch kiếm được từ việc học để mở khóa các ngoại trang phi kiếm, hiệu ứng đài trà, hoặc danh hiệu độc quyền trên Bảng Phong Thần.

### 6.4. Hạ Tầng Kỹ Thuật Cho 1.000+ Concurrent Users (Production Engineering)
- **Chống Gian Lận Bảng Phong Thần (Server-Side Anti-Cheat Validation):**
  - Xác thực WPM tối đa hợp lệ, thời gian phiên chơi (`session_duration`), và chữ ký HMAC/Token khi gửi điểm lên `/api/meowcha/leaderboard` để ngăn chặn việc gửi điểm ảo bằng script.
- **Tối Ưu Tải Tài Nguyên (Progressive Asset Preloading & WebP/Caching):**
  - Chỉ tải trước Cảnh giới hiện tại của người chơi (`realmX`) khi vào trận (`< 500KB`), còn các cảnh giới sau tải ngầm (Lazy Preload) trong lúc chơi để thời gian vào game trên 4G Mobile đạt `< 0.8 giây`.
