# MASTER GAME DESIGN DOCUMENT (GDD) & KỸ THUẬT TRIỂN KHAI DỰ ÁN

# MEOW-CHA: VẠN KIẾM QUY TÔNG (MIÊU TRÀ KIẾM TÔNG)
### (Đấu Trường Gõ Phím Tu Tiên 16-Bit Pixel Art: Sảnh Chờ Cổ Phong, Lĩnh Ngộ Thần Thông Roguelike & Tiến Hóa Cảnh Giới)

> **Nhóm phát triển:** IELTS Oasis Core Team  
> **Phiên bản:** 8.0.0 (Xianxia Lobby, Breakthrough Talents, Realm Evolution, Clean Props & Authentic Cổ Trang UI)  
> **Thể loại:** Vertical Typing Shooter x Xianxia Roguelike Cultivation x Spaced Repetition (SRS)  
> **Góc nhìn & Tọa độ:** **Trực giao trục dọc (Bottom-Up Vertical Perspective)**: Miêu Kiếm Tôn ở đáy màn hình bắn phi kiếm hướng **thẳng lên trời**; Ma thạch cổ ngữ mang từ vựng IELTS rơi từ **đỉnh màn hình xuống vành đai bảo vệ đan điền**.  
> **Bối cảnh & Visual:** **16-Bit Retro Pixel Art - Trà Đạo Thư Viện Tiên Cảnh (Celestial Tea Study Sanctuary)**: Phù hợp 100% với tôn chỉ học tập tĩnh tâm của IELTS Oasis, giao diện cổ trang mộc bản, sơn son thiếp vàng, không dùng AI card phẳng.  
> **Tài nguyên Sprite:** Đã tách nền trong suốt bằng thuật toán **Sealed-Mask Flood Fill** (chuẩn hóa đồng nhất 360x360, sạch 100% các số dư thừa `1)`, `2)`, `3)`, `4)`, `5)`).  
> **Nền tảng mục tiêu:** Web Browser (PC / Laptop & Điện thoại smartphone iOS / Android)  
> **Đặc tính kỹ thuật:** **Siêu nhẹ (Zero-Host-Load)**, 0 Token AI máy chủ, 0 file MP3 (Web Audio API Synthesizer đa tầng), 60 FPS Canvas 2D.

---

## MỤC LỤC
1. [HỆ THỐNG ASSETS PIXEL ART ĐÃ CHUẨN HÓA & LÀM SẠCH](#1-hệ-thống-assets-pixel-art-đã-chuẩn-hóa--làm-sạch)
2. [SẢNH CHỜ TU TIÊN & MÔ THỨC CHƠI (LOBBY & GAME SCENES)](#2-sảnh-chờ-tu-tiên--mô-thức-chơi-lobby--game-scenes)
3. [BẢNG LĨNH NGỘ THẦN THÔNG ĐỘT PHÁ (ROGUELIKE BREAKTHROUGH TALENTS)](#3-bảng-lĩnh-ngộ-thần-thông-đột-phá-roguelike-breakthrough-talents)
4. [TIẾN HÓA NHÂN VẬT & CHIÊU THỨC THEO CẢNH GIỚI](#4-tiến-hóa-nhân-vật--chiêu-thức-theo-cảnh-giới)
5. [HỆ QUY CHIẾU TỌA ĐỘ & KHÔNG GÂY CHÈN CHỮ](#5-hệ-quy-chiếu-tọa-độ--không-gây-chèn-chữ)
6. [HỆ THỐNG ÂM THANH TIÊN KHÍ THỰC THỜI (WEB AUDIO SYNTHESIZER)](#6-hệ-thống-âm-thanh-tiên-khí-thực-thời-web-audio-synthesizer)
7. [BỘ GÕ TIẾNG VIỆT KHÔNG LỖI (IME SAFE INTERCEPTOR)](#7-bộ-gõ-tiếng-việt-không-lỗi-ime-safe-interceptor)
8. [CƠ SỞ DỮ LIỆU & API SCHEMAS](#8-cơ-sở-dữ-liệu--api-schemas)
9. [LỘ TRÌNH THỰC THI CHI TIẾT (AGILE WBS ROADMAP)](#9-lộ-trình-thực-thi-chi-tiết-agile-wbs-roadmap)

---

## 1. HỆ THỐNG ASSETS PIXEL ART ĐÃ CHUẨN HÓA & LÀM SẠCH

Toàn bộ tài nguyên tại `frontend/public/meowcha/` đã được làm sạch 100% các số thừa `1)`, `2)`, `3)`, `4)`, `5)` và chuẩn hóa kích thước 360x360:

```text
frontend/public/meowcha/
├── bg_study_sanctuary.jpg          # Nền Trà Viện Tiên Cảnh 16-bit
├── pixel_pantheon.jpg              # Cuộn trục Bảng Phong Thần (Đã tẩy sạch 100% chữ in chìm cũ)
└── sprites/
    ├── cat_idle.png                # Cảnh giới 1 & 2: Miêu Kiếm Đồng (Nón lá mộc mạc) (360x360)
    ├── cat_weak_attack.png         # Kiếm đồng vung trảm kiếm khí (360x360)
    ├── cat_ultimate_blast.png      # Vạn kiếm quy tông xuất kích (360x360)
    ├── cat_hurt.png                # Choáng ngợp chấn thương (360x360, cùng tỷ lệ cơ thể)
    ├── cat_defeated.png            # Gục ngã trên đài trà (360x360)
    ├── cat_golden_core.png         # Cảnh giới 3: Kim Đan Kỳ (Đạo quan hoàng kim, áo lam) (360x360)
    ├── cat_nascent_soul.png        # Cảnh giới 4: Nguyên Anh Kỳ (Lão tiên miêu râu bạc, tử kim bào) (360x360)
    ├── cat_celestial_sovereign.png # Cảnh giới 5: Thái Thượng Kiếm Tôn (Long bào hoàng kim) (360x360)
    ├── prop_jade_sword.png         # Bích Ngọc Trúc Kiếm (Đã xóa số 2) (190x280)
    ├── prop_bamboo_sword.png       # Thanh Trúc Kiếm (Đã xóa số 1) (185x280)
    ├── prop_asteroid.png           # Ma thạch cổ ngữ (Đã xóa số 3) (168x230)
    ├── prop_sword_slash.png        # Vệt kiếm khí chém (Đã xóa số 4) (173x192)
    └── prop_tea_explosion.png      # Vụ nổ bụi trà matcha (Đã xóa số 5) (205x186)
```

---

## 2. HỆ QUY CHIẾU TỌA ĐỘ & LOGIC NEO ĐÁY (BOTTOM-ANCHORED SPRITE FSM)

### 2.1. Logic Neo Đáy (Bottom-Center Anchoring) Tránh Rung Lắc
Để ngăn việc chú mèo bị nhảy giật vị trí khi đổi trạng thái (do các sprite có chiều cao khác nhau từ 217px đến 611px), hệ thống sử dụng công thức **Bottom-Center Anchoring**:

```javascript
// Tọa độ cố định của Đan Điền Đài (Trọng tâm thanh kiếm dưới đáy màn hình)
const BASE_X = canvas.width / 2;
const BASE_Y = canvas.height - 70; // Neo chắc chắn trên sàn đá ngọc

function drawCatSprite(ctx, spriteImage, targetWidth) {
  // Tính toán tỉ lệ co giãn đồng bộ
  const scale = targetWidth / spriteImage.width;
  const renderWidth = targetWidth;
  const renderHeight = spriteImage.height * scale;
  
  // Neo tại đáy (Bottom Center): Chân thanh kiếm luôn ở đúng toạ độ BASE_Y!
  const drawX = BASE_X - renderWidth / 2;
  const drawY = BASE_Y - renderHeight;
  
  ctx.drawImage(spriteImage, drawX, drawY, renderWidth, renderHeight);
}
```
Nhờ logic này, thanh kiếm của chú mèo **luôn nằm bất biến** trên sàn trà đạo, không bao giờ bị lệch hay giật nảy!

### 2.2. State Machine Tương Tác 5 Trạng Thái (FSM)
1. **IDLE (`cat_idle.png`):** Mèo ngồi bồng bềnh trên phi kiếm ngọc tại vị trí đáy màn hình, mắt nhìn lên trời theo dõi các ma thạch.
2. **WEAK ATTACK (`cat_weak_attack.png`):** Khi người chơi gõ đúng **1 ký tự**, mèo chuyển sang thế vung kiếm chém lên trời trong `250ms`, đồng thời sinh một đường đạn `prop_sword_slash.png` bay vút từ kiếm lên ma thạch mục tiêu.
3. **ULTIMATE BLAST (`cat_ultimate_blast.png`):** Khi hoàn thành gõ trọn vẹn từ vựng, kích hoạt trạng thái Vạn Kiếm Quy Tông trong `600ms`, mèo kết ấn phóng chùm phi kiếm `prop_jade_sword.png` bay lên nổ tung ma thạch thành `prop_tea_explosion.png`.
4. **HURT (`cat_hurt.png`):** Khi để ma thạch rơi qua vạch đan điền hoặc gõ sai quá 3 lần: Mèo ôm đầu hoa mắt trong `400ms`, nhấp nháy đỏ, trừ `-10 Linh Lực`.
5. **DEFEATED (`cat_defeated.png`):** Khi Linh Lực = 0: Mèo ngã bẹp xuống đài trà, nón rơi, hoa mắt chóng mặt và hiện bảng kết thúc màn chơi.

---

## 3. LOGIC VÒNG LẶP TRÒ CHƠI & DỮ LIỆU ĐẠO CỤ (GAMEPLAY & PROJECTILE LOGIC)

```text
 (0, 0) ─────────────────────────────────────────────────────────── (Canvas Width, 0)
 │                             ĐỈNH BẦU TRỜI SAO                           │
 │                                                                         │
 │       [Ma Thạch: "RESILIENT"] (Rơi từ y=0 xuống: vy = +1.5 -> +2.5)     │
 │                 │                                                       │
 │                 ▼                                                       │
 │                                                                         │
 │                 ▲                                                       │
 │                 │                                                       │
 │     [Tia Kiếm Khí / Phi Kiếm] (Bắn từ dưới bay vút lên: vy = -14)       │
 │                                                                         │
 │ ─────────────────── VẠCH ĐAN ĐIỀN PHÒNG TUYẾN ───────────────────────── │
 │                                                                         │
 │                     [MIÊU KIẾM TÔN] (Neo đáy: BASE_X, BASE_Y)           │
 │                       (Ngồi ngự kiếm trên Sân Trà Đạo)                  │
 └─────────────────────────────────────────────────────────────────────────┘
 (0, Canvas Height)                                        (Canvas Width, Canvas Height)
```

1. **Ma Thạch Cổ Ngữ (Incoming Asteroid):**
   - Sinh ngẫu nhiên từ đỉnh màn hình (`y = 0`) với từ vựng Oxford 5000 CEFR.
   - Hiển thị từ vựng với các ký tự đã gõ được tô màu xanh ngọc bích sáng rực (`#66FFB2`), ký tự chưa gõ màu trắng kem (`#FFFDF5`).
2. **Đạn Kiếm Khí & Phi Kiếm (Flying Projectiles):**
   - Sinh ra tại tọa độ mũi kiếm: `(BASE_X, BASE_Y - 80)`.
   - Vận tốc: `vy = -14` px/frame bay thẳng lên trời.
   - Khi va chạm ma thạch: Tạo vụ nổ hạt matcha `prop_tea_explosion.png`, phát âm thanh kiếm va chạm giòn tan và hiện Floating Semantic HUD (IPA + Nghĩa).

---

## 2. SẢNH CHỜ TU TIÊN & MÔ THỨC CHƠI (LOBBY & GAME SCENES)

Hệ thống phân tách thành 3 phân cảnh (Scenes) rõ rệt:
1. **`LOBBY` (Sảnh Chờ Tiên Viện):**
   - Biển hiệu mộc bản sơn son thiếp vàng: *"MEOW-CHA: VẠN KIẾM QUY TÔNG"*.
   - Miêu Kiếm Tôn tọa thiền ở trung tâm đài trà trong làn sương mù tĩnh tại.
   - Thẻ hiển thị hồ sơ: Đạo hiệu, Tông môn, Cảnh giới, Khí huyết đan điền, Tu vi hiện có.
   - Nút bấm thư pháp cổ phong: `[ ⚔️ BẮT ĐẦU ĐỘ KIẾP ]`, `[ 📜 BẢNG PHONG THẦN ]`, `[ 🧰 BẢO KHỐ ]`.
2. **`BATTLE` (Trận Địa Trảm Ma):**
   - Chế độ chiến đấu trực diện: Ma thạch cổ ngữ rơi từ đỉnh trời, phi kiếm bắn thẳng từ dưới lên.
   - Vành đai bảo vệ đan điền tại `canvas.height - 180`, ngăn ma thạch không bao giờ rơi đè lên mặt nhân vật.
   - Hiển thị tiến trình gõ phím của người chơi tại góc dưới: `Kiếm Ý: [ R ][ E ]...`.
3. **`BREAKTHROUGH` (Bảng Lĩnh Ngộ Thần Thông Đột Phá):**
   - Kích hoạt khi tích lũy đủ điểm Tu Vi đột phá cảnh giới.
   - Tạm dừng trận chiến, xuất hiện 3 thẻ bài mộc bản cổ trang ngẫu nhiên từ kho 6 đại công pháp để người chơi lựa chọn bồi dưỡng thuộc tính (Roguelike Build).

---

## 3. BẢNG LĨNH NGỘ THẦN THÔNG ĐỘT PHÁ (ROGUELIKE BREAKTHROUGH TALENTS)

Khi thăng cấp cảnh giới, người chơi chọn 1 trong 6 đại công pháp cổ:
1. **🌿 Cố Bản Bồi Nguyên (Tâm Pháp Thể Chất):** Gia tăng `+25 HP tối đa` và hồi phục ngay lập tức 100% đan điền khí huyết.
2. **⏳ Định Thần Thanh Tâm (Tâm Pháp Tinh Thần):** Giảm vĩnh viễn `-25% tốc độ rơi` của toàn bộ ma thạch cổ ngữ, giúp dễ dàng phản xạ từ dài.
3. **⚡ Nhất Kiếm Phân Thần (Kiếm Đạo Chí Mạng):** Đạt `35% tỷ lệ Bạo Kích Chí Mạng` - khi chém nát 1 từ vựng, kiếm khí tự động phá nát thêm 1 ma thạch khác (trảm kép 2 câu cùng lúc).
4. **🎯 Thần Niệm Tỏa Định (Tâm Đạo Ngộ Đạo):** Miễn nhiễm hoàn toàn chấn thương khi gõ sai, đồng thời gia tăng vĩnh viễn `+50% điểm Tu Vi` mỗi từ.
5. **🛡️ Kim Chung Trào Hộ Thể (Hộ Thân Thần Chú):** Tạo `2 tầng Linh Thuẫn Kim Chung Trào` chặn đứng hoàn toàn 2 lần ma thạch rơi trúng đan điền.
6. **🌪️ Vạn Kiếm Tự Động Trận (Kiếm Trận Thần Thông):** Cứ mỗi khi đạt chuỗi 3 từ liên tiếp (Combo x3), tự động triệu hoán phi kiếm quét sạch ma thạch đang rơi thấp nhất.

---

## 4. TIẾN HÓA NHÂN VẬT & CHIÊU THỨC THEO CẢNH GIỚI

Nhân vật và hiệu ứng đòn đánh tự động lột xác qua từng cấp bậc Tu Vi:

| Cảnh Giới | Điểm Tu Vi | Ngoại Hình Miêu Tiên | Chiêu Thức Kiếm Khí & Phi Kiếm | Hiệu Ứng Procedural Hào Quang |
| :--- | :--- | :--- | :--- | :--- |
| **🥋 Luyện Khí Kỳ** | 0 - 299 | Nón lá mộc mạc, áo xanh trà viện | **Thanh Phong Kiếm Khí:** Vệt chém xanh ngọc `#66FFB2`, nổ bụi matcha | Hạt linh khí trà lượn lờ |
| **🌿 Trúc Cơ Kỳ** | 300 - 699 | Áo đạo bào xanh ngọc có hoa văn mây | **Bích Ngọc Trúc Kiếm:** Chùm 5 phi kiếm xanh ngọc bay vút lên | Sương trà bao phủ quanh chân |
| **⭐ Kim Đan Kỳ** | 700 - 1399 | **Đạo Quan Hoàng Kim**, áo lam mây vàng | **Thái Dương Kiếm Quang:** Luồng kiếm vàng chói `#FFD700`, 2 phi kiếm bắn chụm | **Vòng Bát Quái Kim Quang** xoay tròn 8 tia sau lưng mèo |
| **🔮 Nguyên Anh Kỳ** | 1400 - 2299 | **Lão Tiên Miêu** râu bạc, Tử Kim Bào | **Cửu Thiên Lôi Kiếm:** Tia sét zig-zag giật thẳng `#00FFFF` / `#E066FF`, nổ plasma | **Lôi điện hộ thể:** 3 luồng sét cyan crackle quanh thân |
| **👑 Thái Thượng Kiếm Tôn** | 2300+ | **Tiên Đế Miêu** Long Bào hoàng kim thêu rồng đỏ | **Chân Long Kiếm Khí:** Luồng kiếm rồng lửa `#FF3366` & `#FFD700`, Vạn Kiếm Quy Tông | **Vạn Kiếm Trận:** 6 phi kiếm thần xoay tròn quỹ đạo 3D quanh thân |

## 6. TỐI ƯU SIÊU NHẸ MÁY CHỦ & CHƠI TRÊN ĐIỆN THOẠI

- **Không ngốn máy chủ (Zero-Host-Load):**
  - Dùng kho từ vựng Oxford 5000 in-memory có sẵn trên Python RAM (`oxford_dataset_service.py`), thời gian phản hồi $< 0.1ms$, **0 Token AI**.
  - **0 Byte MP3 download:** Toàn bộ âm thanh được sinh thời gian thực bằng Web Audio API trên trình duyệt.
- **Tương thích Mobile hoàn hảo:**
  - Tích hợp **Mobile Soft-Keyboard Hook**: Chạm vào màn hình điện thoại tự động mở bàn phím native của máy để gõ chữ tốc độ cao.
  - Tự động co giãn Canvas theo kích thước màn hình điện thoại, giữ ổn định **60 FPS**.

---

## 7. HỆ THỐNG ÂM THANH TIÊN KHÍ THỰC THỜI (WEB AUDIO SYNTHESIZER)

- **Weak Attack (Gõ từng phím):** Dao động xung sóng sin 450Hz suy giảm trong 30ms (tiếng phím thock).
- **Sword Slash (Kiếm chém):** Sóng răng cưa 800Hz $\rightarrow$ 150Hz kết hợp High-pass filter tạo tiếng kiếm va chạm giòn tan.
- **Ultimate Explosion (Nổ ma thạch):** White noise burst kết hợp Low-pass sweep tạo tiếng nổ vang dội.
- **Guzheng Melody (Tiếng Cổ Tranh):** Sinh các nốt ngũ âm Cung - Thương - Giốc - Chủy - Vũ tạo không gian thiền định.

---

## 8. BỘ GÕ TIẾNG VIỆT KHÔNG LỖI (IME SAFE INTERCEPTOR)

- Bắt sự kiện bàn phím mức phần cứng `event.code` (e.g. `KeyA`, `KeyW`, `KeyS`).
- Triệt tiêu hoàn toàn hiện tượng Unikey/EVKey nuốt ký tự (`action` biến thành `actioon` hay `as` thành `á`).

---

## 9. CƠ SỞ DỮ LIỆU & API SCHEMAS

- `MeowChaSession`: Lưu trữ token phiên chơi, điểm tu vi, số kiếp luân hồi, số từ đã trảm, độ chính xác.
- `MeowChaImmortalLeaderboard`: Bảng Phong Thần lưu danh hiệu, số kiếp luân hồi, peak WPM và ngày phi thăng.
- Endpoints:
  - `POST /api/meow-cha/session/start`
  - `POST /api/meow-cha/session/finish`
  - `GET /api/meow-cha/pantheon`

---

## 10. LỘ TRÌNH THỰC THI CHI TIẾT (AGILE WBS ROADMAP)

- [x] **Giai đoạn 1: Chuẩn hóa Assets & Xóa Lỗi Nền:**
  - Đã xuất 10 sprite PNG trong suốt sạch sẽ bằng thuật toán Sealed-Mask (không thủng mặt, không mất chi tiết).
  - Đã nạp nền Trà Viện Tiên Cảnh học tập `bg_study_sanctuary.jpg` và Bảng Phong Thần `pixel_pantheon.jpg`.
- [ ] **Giai đoạn 2: Lập trình Component Game Canvas 2D tại `frontend/app/games/meow-cha/page.tsx`:**
  - Tải trước AssetManager các sprite trong suốt.
  - Áp dụng Bottom-Center Anchoring để mèo không bị giật nảy vị trí.
  - Game Loop 60 FPS: Mèo ở đáy bắn lên, ma thạch từ đỉnh rơi xuống.
  - Bộ gõ IME-Safe + Mobile Soft Keyboard Hook.
  - Web Audio Synthesizer phát âm thanh thời gian thực.
  - 6 Cảnh Giới + Vòng Lặp Luân Hồi N+1 + Modal Bảng Phong Thần.
- [ ] **Giai đoạn 3: Backend FastAPI & Database:**
  - Tạo models SQLAlchemy và endpoints lưu điểm, lấy bảng xếp hạng.
- [ ] **Giai đoạn 4: Tích hợp Arcade Hub & Kiểm thử trên Mobile & PC.**
