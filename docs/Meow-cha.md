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

```text
frontend/public/meowcha/js/
├── main.js                     # Bộ điều phối Game Loop, Asset Loader (305 đường dẫn) & Lifecycle
├── core/
│   ├── GameState.js            # Quản lý Tu Vi, Cảnh Giới, Thanh Thần Thông (realmSkillCharge), Pháp Bảo
│   ├── SpriteAnimator.js       # Động cơ diễn hoạt Multi-Frame Sprite Sheet (Poses, Slashes, Hits)
│   ├── VocabLoader.js          # Tải & cache từ vựng Oxford 5000 theo Band từ Backend API
│   ├── SaveSystem.js           # Lưu trữ Ngọc Giản đa slot (LocalStorage + Cloud API Sync)
│   └── AudioManager.js         # Bộ tổng hợp âm thanh Web Audio API (Tiếng kiếm, Cổ tranh, Sấm sét)
├── entities/
│   ├── CatCultivator.js        # Vẽ nhân vật 5 cảnh giới, Chibi Hộ Đạo, Tia bắn & Hiệu ứng bắn ra (Muzzle)
│   ├── ProjectileSystem.js     # Hệ thống đạn phi kiếm, đuôi tia bắn, Muzzle Flash & Hit Explosion
│   └── AsteroidManager.js      # Quản lý ma thạch 4 nguyên tố, hiệu ứng Làm Chậm (Slow), Đóng Băng (Freeze), Đẩy Lùi
├── combat/
│   ├── TypingEngine.js         # Bộ gõ IME-Safe, xử lý Thần Thông thực chiến 5 cảnh giới & tính điểm
│   └── BreakthroughFlow.js     # Luồng Độ Kiếp & chọn Thần Thông Roguelike khi thăng cấp
├── effects/
│   ├── RealmVFX.js             # Pháp trận dưới chân, hào quang cảnh giới & sương mù linh vân
│   ├── ParticleEngine.js       # Hệ thống hạt linh khí, lá trúc, tàn lửa & tia sét
│   └── FloatingText.js         # Chữ nổi thông báo sát thương, Thần Thông & từ vựng vừa trảm
└── ui/
    ├── UIManager.js            # Quản lý Sảnh Chờ, Bảng Phong Thần, Động Phủ Ngọc Giản & HUD
    ├── IPAToast.js             # Thẻ từ vựng IELTS + Phiên âm IPA + Phát âm chuẩn US/UK
    ├── VirtualKeyboard.js      # Bàn phím phù thạch khảm ngọc cho Mobile & PC
    └── UnityBridge.js          # Cầu nối đồng bộ WebGL 2D (tùy chọn)
```

---

## 5. ĐỀ XUẤT NÂNG CẤP HỌC THUẬT ("HỌC TIẾNG ANH TU TIÊN" CHUYÊN SÂU)

Hiện tại người chơi mới đang **nhìn từ tiếng Anh và gõ lại từ tiếng Anh đó (Copy-Typing)**. Để biến game thành công cụ **luyện thi IELTS thực thụ** (giúp tăng thực chất điểm Reading, Listening, Writing), cần nâng cấp thêm **4 chế độ "Tu Luyện Ngữ Nghĩa"** sau:

1. **Chế Độ "Thiên Kiếp Giải Nghĩa" (Active Recall Mode — Nhìn Nghĩa/Câu Khuyết Gõ Từ):**
   - Thay vì luôn hiện sẵn chữ `RESILIENT` trên thiên thạch, với các thiên thạch tinh anh (hoặc từ cảnh giới Trúc Cơ trở lên), thiên thạch chỉ hiện **Nghĩa tiếng Việt + Chữ cái đầu** (`[ R _ _ _ _ _ _ _ _ ] — Kiên cường, bền bỉ`) hoặc một câu IELTS Reading khuyết từ (`She remained [ R _ _ _ _ _ _ _ _ ] despite the crisis`).
   - Người chơi buộc phải **nhớ từ trong não (Active Recall)** để gõ ra — hiệu quả ghi nhớ từ vựng tăng gấp **5 lần** so với chỉ nhìn chữ chép lại!
2. **Chế Độ "Thính Phong Kiếm" (IELTS Listening Dictation Meteors):**
   - Thiên thạch **"Ẩn Hình Linh Thạch"** rơi xuống chỉ phát **âm thanh đọc từ vựng chuẩn UK/US** kèm phiên âm IPA (`/rɪˈzɪl.jənt/`), chữ viết bị sương mù che khuất.
   - Người chơi phải **nghe âm thanh để gõ chính tả** (luyện đúng kỹ năng ăn điểm của IELTS Listening Part 1 & Part 4!).
3. **Đại Yêu Thú "Đồng Nghĩa Tâm Ma" (IELTS Synonym / Collocation Boss Fight):**
   - Cuối mỗi cảnh giới, xuất hiện **Cổ Thú Boss** mang một từ phổ thông (ví dụ: `IMPORTANT`). Để phá giáp Boss, người chơi phải gõ lần lượt 3 từ đồng nghĩa Band 7.0+ hiển thị trên 3 thanh kiếm hộ mệnh (`CRUCIAL`, `SIGNIFICANT`, `PARAMOUNT`).
4. **Liên Kết Trực Tiếp Với Kho Flashcard Cá Nhân & Thuật Toán SRS (FSRS / SM-2):**
   - Những từ người chơi **gõ sai nhiều lần** hoặc **để thiên thạch rơi trúng người** trong game sẽ tự động được gắn nhãn **"Tâm Ma Từ Vựng" (`Hard / Again`)** và đồng bộ thẳng vào bảng `user_vocabulary` (Flashcard Lab) của IELTS Oasis để nhắc ôn tập lại qua Chrome Extension Matcha Pet!

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
