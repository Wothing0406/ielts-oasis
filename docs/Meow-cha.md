# GAME DESIGN DOCUMENT (GDD) & KẾ HOẠCH PHÁT TRIỂN

# DỰ ÁN: MEOW-CHA INVASION (Vũ Trụ Matcha & Chiến Hạm Mèo Ngoài Hành Tinh)

> **Thể loại:** Typing Action / Space Shooter kết hợp Gamified Vocab Learning  
> **Nền tảng:** Web (Next.js / Canvas / React-Three-Fiber hoặc Pixi.js / HTML5 Audio)  
> **Tích hợp:** Hệ sinh thái IELTS Oasis (Next.js Dashboard + Discord Bot sync)  
> **Visual Concept:** Cute Cyberpunk Pastel Green (Matcha Vibe / Kawaii Sci-Fi)

---

## 1. TỔNG QUAN Ý TƯỞNG & ĐỊNH VỊ (EXECUTIVE SUMMARY)

### 1.1. Bối cảnh & Cốt truyện (Lore & Narrative)

- **Bối cảnh:** Vũ trụ Meow-Galaxy đang bị xâm chiếm bởi **Matcha-Zilla** (Quái thú trà xanh vũ trụ khổng lồ thèm đường). Matcha-Zilla liên tục bắn ra những **Thiên Thạch Trà Xanh (Matcha Meteorites)** mang mã hóa ngôn ngữ cổ đại Trái Đất (IELTS/Oxford 5000).
- **Nhân vật chính:** **Captain Meow-lo** – một chú mèo ngoài hành tinh đội mũ phi hành gia tai mèo, điều khiển chiến hạm Mech Cat bắn tia laser năng lượng để phá vỡ thiên thạch.
- **Mục tiêu người chơi:** Đọc nhanh, gõ phím chuẩn xác các từ vựng IELTS đang lao tới trong thời gian đếm ngược để phá hủy thiên thạch, bảo vệ căn cứ mèo, tích lũy điểm số leo bảng xếp hạng liên hành tinh.

### 1.2. Vibe & Định Hướng Mỹ Thuật (Art Direction)

- **Palette màu:** Matcha Green (#A3C9A8, #7FA99B, #4B6E58), Kem béo Sữa (#F5F7E8), Neon Cat Mint (#66FFB2), Cảnh báo Đỏ Dâu (#FF6B6B).
- **Phong cách đồ họa:** Pixel Art 16-bit retro kết hợp phong cách Chibi Kawaii hiện đại. Hiệu ứng hạt (particle effects) hình lá trà, bọt kem latte, tia laser mint green.

---

## 2. CƠ CHẾ LỐI CHƠI CỐT LÕI (CORE GAMEPLAY MECHANICS)

```text
       [Matcha Monster]
              │
              ▼ (Phun ra thiên thạch chứa từ vựng mỗi 5s)
     [Meteorite: "SUBSTANTIAL"]
              │
              ├──► [Người chơi gõ đúng "substantial" trước 5s]
              │          │
              │          ▼
              │    [+10 Điểm] ──► [Laser nổ tung thiên thạch] ──► [Pop-up Tooltip: Nghĩa & IPA]
              │
              └──► [Hết thời gian (5s) HOẶC gõ sai / va chạm]
                         │
                         ▼
                   [-10 Máu (HP)] (Khởi đầu: 50 HP) ──► [Khi HP <= 0: Game Over & Sync High Score]
```

### 2.1. Chỉ số người chơi (Player Stats)

- **Máu cơ bản (Health Points - HP):** `50 HP`.
- **Hệ thống sát thương:** Mỗi lần để thiên thạch chạm vạch phòng thủ (hết thời gian `5s`) hoặc gõ sai quá số lần cho phép: Trừ `-10 HP` (cho phép chịu tối đa 5 lỗi).
- **Cơ chế hồi máu:** Khi đạt chuỗi Combo 10 từ liên tiếp hoàn hảo (Streak 10x): Hồi `+5 HP` (tối đa không vượt quá 50).

### 2.2. Cơ chế tính điểm & Độ khó thích ứng (Adaptive Difficulty)

- **Điểm cơ bản:** `+10 Điểm` / từ vựng tiêu diệt thành công.
- **Thưởng Combo (Streak Multiplier):**
  - Combo 5–9: `x1.2` điểm (`12 pts/từ`).
  - Combo 10+: `x1.5` điểm (`15 pts/từ`) kèm hiệu ứng Neon Fever Mode.
- **Dynamic Difficulty Adjustment (Càng chơi càng khó):**
  - **Tốc độ rơi / Thời gian phản xạ:** Ban đầu cố định `5.0s`, sau mỗi 500 điểm giảm `0.2s` (giới hạn sàn `2.0s`).
  - **Độ dài từ vựng:**
    - Cấp 1 (0 - 200 điểm): Từ 3 - 5 ký tự (A2 - B1).
    - Cấp 2 (200 - 500 điểm): Từ 6 - 8 ký tự (B2).
    - Cấp 3 (500+ điểm): Từ 9 - 14 ký tự (C1 - C2 / Academic IELTS Collocations).

### 2.3. Cơ chế Khai thác Ngữ nghĩa (Post-Destroy Semantic Feed)

- Ngay khi gõ đúng từ, thiên thạch phát nổ thành bụi matcha.
- Một **HUD Tooltip nổi (Floating Toast)** xuất hiện phía dưới chiến hạm trong `1.5s`:
  - Từ vựng + Phiên âm chuẩn IPA (ví dụ: `implement /ˈɪmplɪmɛnt/`).
  - Nghĩa tiếng Việt cốt lõi vắn tắt (ví dụ: `[v] Triển khai, thực thi`).
  - Lỗi sai phát sinh (nếu có) được đẩy trực tiếp vào hàng đợi `error_log` của hệ sinh thái SRS.

---

## 3. NGUỒN DỮ LIỆU TỪ VỰNG (VOCABULARY POOL ARCHITECTURE)

Hệ thống rút từ vựng theo mô hình phân tầng trọng số (Weighted Probability Pool):

| Nguồn Dữ Liệu                                                 | Trọng Số Xuất Hiện | Mục Đích Sư Phạm                                    |
| :------------------------------------------------------------ | :----------------- | :-------------------------------------------------- |
| **Personal Error Store** (Từ sai ở Speaking/Writing trước đó) | **40%**            | Biến điểm yếu cá nhân thành phản xạ gõ phím thực tế |
| **User Custom Deck** (Bộ từ cá nhân người dùng tự tạo)        | **30%**            | Đáp ứng nhu cầu học đúng target người dùng tự ôn    |
| **Oxford 5000 & IELTS Academic Dataset**                      | **30%**            | Mở rộng vốn từ học thuật chuẩn hóa CEFR A1 - C1     |

---

## 4. BẢNG XẾP HẠNG & LƯU TRỮ TRẠNG THÁI (SAVE STATE & LEADERBOARD)

### 4.1. Cấu trúc Trạng Thái Lưu (Save Game Schema)

Dữ liệu lưu tạm thời tại `Localforage / IndexedDB` (Offline fallback) và đồng bộ qua API Backend (`/api/game/meow-cha/state`):

```json
{
  "user_id": "usr_cat_9988",
  "high_score": 1420,
  "highest_streak": 28,
  "words_destroyed_count": 142,
  "accuracy_wpm": 68.5,
  "favorite_cat_ship_skin": "matcha_latte_cruiser",
  "unlocked_badges": ["FIRST_BLOOD", "SPEED_DEMON", "IELTS_BAND_8_WARRIOR"],
  "last_played_at": "2026-09-11T12:00:00Z"
}
```

### 4.2. Bảng Xếp Hạng Đa Chiều (Multi-Tier Leaderboard)

- **Bảng Vinh Danh Toàn Cầu (All-time Top Gun):** Top 100 điểm cao nhất toàn cầu.
- **Bảng Tuần (Weekly Matcha Arena):** Reset vào Chủ Nhật hàng tuần, top 3 nhận Discord Badge vinh danh trên server học tập.
- **Bảng Xếp Hạng Tốc Độ (Fastest WPM):** Xếp hạng dựa trên tốc độ gõ phím từ vựng chuẩn (Words Per Minute).

---

## 5. THIẾT KẾ KỸ THUẬT & KIẾN TRÚC TRIỂN KHAI (TECH STACK SPECIFICATION)

### 5.1. Tech Stack Khuyến Nghị

- **Frontend / Game Engine:**
  - Giao diện khung: **Next.js (App Router) + Tailwind CSS + Framer Motion**.
  - Render game 2D tốc độ cao: **Pixi.js** hoặc **HTML5 Canvas Context 2D** (Đảm bảo 60 FPS, dung lượng nhẹ, không lag trên trình duyệt mobile/laptop).
  - Hiệu ứng âm thanh: **Howler.js** (Âm thanh gõ phím switch cơ, tiếng laser, nhạc nền lofi chiptune matcha).
- **Backend Services:**
  - RESTful / WebSocket API: **FastAPI** hoặc **Next.js Route Handlers**.
  - Database: **PostgreSQL (Supabase)** lưu Highscore, Leaderboard và Logs từ vựng.
  - Caching & Throttle: **Redis / Upstash** chống spam điểm giả mạo (Anti-cheat integrity check).

### 5.2. Chống Gian Lận Điểm Số (Anti-Cheat & Validation Integrity)

Để mang đi thi KHKT, giám khảo sẽ hỏi: _"Làm sao tránh người chơi hack request gửi điểm ảo 999999 điểm lên server?"_.

- **Cơ chế xác thực:** Client không gửi trực tiếp `score = 1500`. Client gửi một **Payload Log mảng các từ đã gõ kèm Timestamp gõ từng phím** (Keystroke timestamp delta).
- Backend tính toán: `(Thời gian kết thúc - Thời gian xuất hiện) >= Độ dài ký tự * Tốc độ gõ con người tối đa (200 WPM)`. Nếu vi phạm logic vật lý $
ightarrow$ Từ chối lưu High Score.

---

## 6. LỘ TRÌNH PHÁT TRIỂN CHI TIẾT (DEVELOPMENT ROADMAP)

### Giai Đoạn 1: Game Loop & Typing Core (Tuần 1)

- [ ] Thiết lập Canvas 2D engine trên Next.js component.
- [ ] Lập trình Spawner: Cứ `5000ms` sinh 1 thiên thạch mang chữ ngẫu nhiên rơi từ đỉnh xuống.
- [ ] Xử lý sự kiện bàn phím `window.addEventListener('keydown')`:
  - Highlight ký tự gõ đúng (Green).
  - Báo rung rung / hiệu ứng rung khi gõ sai (Red Shake).
- [ ] Logic trừ máu (50 HP) và Game Over modal.

### Giai Đoạn 2: Tích Hợp Dữ Liệu & Từ Điển (Tuần 2)

- [ ] Load dataset `oxford-5000-cefr-dataset.json` vào local client cache.
- [ ] Kết nối API Endpoint lấy 20 từ vựng gần nhất trong `error_log` của người dùng.
- [ ] Tạo Floating Card hiển thị Nghĩa + IPA ngay khi từ vựng bị phá hủy.

### Giai Đoạn 3: Mỹ Thuật, Âm Thanh & Vibe Cute Matcha (Tuần 3)

- [ ] Vẽ / thiết kế Sprite chú mèo ngoài hành tinh (Alien Cat) và quái vật Matcha.
- [ ] Tích hợp SFX: Tiếng laser pop, tiếng gõ phím cơ clicky, nhạc lofi chill ngoài vũ trụ.
- [ ] Chế độ Fever Mode: Khi combo x10, nền trời đổi màu lá trà xanh rực rỡ kèm hiệu ứng tia sáng.

### Giai Đoạn 4: Leaderboard, Sync Discord & Hoàn Thiện Hồ Sơ KHKT (Tuần 4)

- [ ] Triển khai bảng xếp hạng Top 10 Realtime.
- [ ] Tích hợp Discord Bot Webhook: Tự động gửi thông báo: _"Người chơi @User vừa lập kỷ lục 1,500 điểm tại Đấu Trường Matcha!"_.
- [ ] Đóng gói báo cáo kỹ thuật (Scientific Documentation) về hiệu quả gia tăng phản xạ từ vựng qua cơ chế Gamification.
