# IDEA-OS: MEOW-CHA • VẠN KIẾM QUY TÔNG (萬劍歸宗)
## Tài Liệu Thiết Kế & Kiến Trúc Kỹ Thuật (v5.0 — Upgraded Sprite & Combat Architecture)

---

## 1. TỔNG QUAN HỆ THỐNG & TRIẾT LÝ THIẾT KẾ (CORE PHILOSOPHY)

**Meow-Cha: Vạn Kiếm Quy Tông** là tựa game **IELTS Typing Xianxia Action RPG** kết hợp giữa đồ họa **16-bit/32-bit Pixel Art Tu Tiên** và cơ chế học từ vựng IELTS chuyên sâu (Band 4.0 → 9.0).

### Nguyên tắc Thiết Kế Cốt Lõi:
1. **Mỗi Cảnh Giới Là Một Nhân Vật & Cơ Chế Thực Chiến Độc Bản:** Cả 5 cảnh giới (`Luyện Khí`, `Trúc Cơ`, `Kim Đan`, `Nguyên Anh`, `Độ Kiếp`) đều có bộ Sprite tư thế riêng, hoạt ảnh đa frame riêng, vũ khí riêng, tia bắn riêng, hiệu ứng bắn ra (`muzzle`) & nổ (`hit`) riêng, cùng **Thần Thông Bị Động** can thiệp trực tiếp vào trận chiến.
2. **Kiến Trúc Thư Mục Tự Chủ (`Self-Contained Character Sprite Architecture`):** Không để file ảnh rời rạc ở thư mục gốc; mỗi nhân vật tự đóng gói toàn bộ tài nguyên trong thư mục riêng của mình (`poses/`, `sheets/`, `weapon/`, `beam/`, `vfx/`, `animation.json`).
3. **Ngôn Ngữ Tu Tiên Ngắn Gọn, Súc Tích:** Đạo hiệu, tên chiêu thức và thông báo chiến trường dùng thuật ngữ tu tiên chuẩn xác, ngắn gọn, dễ đọc ngay trong nhịp độ gõ phím cao.

---

## 2. CẤU TRÚC THƯ MỤC SPRITE CHUẨN HÓA (`frontend/public/meowcha/sprites/`)

```text
frontend/public/meowcha/sprites/
├── manifest.json                        # Bản đồ khai báo toàn bộ 305 đường dẫn tài nguyên
├── characters/
│   ├── realm0_qi_refining/              # Cảnh 0: Luyện Khí Kỳ — Linh Trà Đạo Miêu
│   │   ├── animation.json               # Metadata cấu hình frame, FPS & đường dẫn nội bộ
│   │   ├── poses/                       # idle.png, attack.png, ultimate.png, hurt.png, defeated.png
│   │   ├── sheets/                      # idle_sheet.png .. defeated_sheet.png (4-frame 1440x360)
│   │   ├── weapon/                      # sword.png, sword_sheet.png, projectile.png, projectile_sheet.png
│   │   ├── beam/                        # beam.png, beam_sheet.png (Thanh Trúc Phong Tuyến)
│   │   └── vfx/                         # muzzle.png, muzzle_sheet.png, hit.png, hit_sheet.png, slash.png, slash_sheet.png
│   │
│   ├── realm1_foundation/               # Cảnh 1: Trúc Cơ Kỳ — Thanh Vân Ngự Kiếm Miêu
│   ├── realm2_golden_core/              # Cảnh 2: Kim Đan Kỳ — Bát Quái Kim Đan Miêu
│   ├── realm3_nascent_soul/             # Cảnh 3: Nguyên Anh Kỳ — Nguyên Anh Đại Năng (+ poses/chibi_companion.png)
│   └── realm4_tribulation/              # Cảnh 4: Độ Kiếp Kỳ — Vạn Kiếm Chí Tôn
│
├── asteroids/                           # Thiên thạch 4 nguyên tố rơi xuống
│   ├── ice.png                          # Hàn Băng Thạch
│   ├── fire.png                         # Hỏa Diệm Tinh Thạch
│   ├── void.png                         # Hư Không Ám Thạch
│   └── thunder.png                      # Thiên Lôi Thạch
│
└── maps/                                # Bối cảnh Động phủ & hiệu ứng môi trường
    ├── bg_study_sanctuary.jpg           # Động phủ tu luyện
    ├── mystic_cloud.png                 # Linh vân trôi ngang
    ├── tea_explosion.png                # Vụ nổ linh trà
    └── impact_burst_sheet.png           # Hoạt ảnh nổ thiên thạch 4-frame
```

---

## 3. BẢNG THẦN THÔNG & HIỆU ỨNG VŨ KHÍ 5 CẢNH GIỚI

| Cảnh Giới | Đạo Hiệu | Tia Bắn (`beam/`) | Hiệu Ứng Bắn Ra (`vfx/muzzle*`) | Hiệu Ứng Nổ (`vfx/hit*`) | Cơ Chế Chiến Đấu Thực Chiến (`TypingEngine.js`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **0. Luyện Khí** | Linh Trà Đạo Miêu | Thanh Trúc Phong Tuyến | Thanh Trúc Phát Chiêu | Thanh Trúc Linh Bạo | **Trúc Phong Trì Hoãn:** Mỗi phím đúng làm chậm thiên thạch **-22% tốc độ rơi** trong `2.8s`. |
| **1. Trúc Cơ** | Thanh Vân Ngự Kiếm Miêu | Hàn Băng Song Kiếm Tuyến | Hàn Băng Phát Chiêu | Hàn Băng Tinh Bạo | **Song Kiếm Hợp Bích:** Mỗi **6 phím đúng** phóng kiếm thứ 2 tự động chém **+1 ký tự** & đẩy lùi thiên thạch `22px`. |
| **2. Kim Đan** | Bát Quái Kim Đan Miêu | Kim Đan Nhật Viêm Trụ | Kim Đan Bát Quái Phát Chiêu | Kim Liên Nhật Bạo | **Kim Liên Bạo Phá:** Mỗi **5 phím đúng** kích nổ Kim Liên tự chém **+1 ký tự**, cộng thêm điểm Tu Vi & đẩy lùi `16px`. |
| **3. Nguyên Anh** | Nguyên Anh Đại Năng | Cửu Thiên Tử Điện Mạch | Tử Điện Lôi Ấn Phát Chiêu | Cửu Thiên Tử Điện Bạo | **Nguyên Anh Hộ Đạo:** Mỗi **4 phím đúng** giáng lôi điện **đóng băng thiên thạch `0.75s`**; Chibi Nguyên Anh tự động bắn phụ trợ chém **+1 ký tự**. |
| **4. Độ Kiếp** | Vạn Kiếm Chí Tôn | Chân Long Đế Quang Mạch | Chân Long Đế Ấn Phát Chiêu | Chân Long Đế Viêm Bạo | **Chân Long Phệ Thiên:** Mỗi **4 phím đúng** triệu hồi Chân Long **tự động chém +2 ký tự**, đẩy lùi thiên thạch `32px` và tăng `+50%` điểm Tu Vi. |

---

## 4. CƠ CHẾ TẨU HỎA NHẬP MA & CHOÁNG (STUN & RECOIL DYNAMICS)

| Cảnh Giới | Thời Lượng Choáng (Stun Ms) | Gia Tốc Thiên Thạch Khi Gõ Sai | Mây Chướng Khí Khi Gõ Sai | Thiên Kiếp Mây Mù Định Kỳ |
| :--- | :---: | :---: | :---: | :---: |
| **0. Luyện Khí** | **160 ms** | **+2%** | Sương nhẹ 1.6s (Max Alpha 0.35) | Không xuất hiện |
| **1. Trúc Cơ** | **260 ms** | **+4%** | Mây vừa 2.5s (Max Alpha 0.50) | Không xuất hiện |
| **2. Kim Đan** | **380 ms** | **+6%** | Mây cuộn 3.0s (Max Alpha 0.62) | Mỗi 28 giây lướt qua 1 lần |
| **3. Nguyên Anh** | **520 ms** | **+8%** | Chướng khí 3.5s (Max Alpha 0.72) | Mỗi 20 giây lướt qua 1 lần |
| **4. Độ Kiếp** | **680 ms** | **+10%** | U vân dày đặc 4.0s (Max Alpha 0.75) | Mỗi 16 giây lướt qua 1 lần |
