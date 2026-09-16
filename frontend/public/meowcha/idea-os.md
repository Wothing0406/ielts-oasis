# IDEA-OS: MEOW-CHA • VẠN KIẾM QUY TÔNG (萬劍歸宗)
## Comprehensive Architecture & Game Design Document (v4.0)

---

## 1. TỔNG QUAN HỆ THỐNG & TRIẾT LÝ THIẾT KẾ (CORE PHILOSOPHY)

**Meow-Cha: Vạn Kiếm Quy Tông** là tựa game **IELTS Typing Xianxia Action RPG** kết hợp giữa đồ họa **16-bit Dark Xianxia Pixel Art** và cơ chế học từ vựng IELTS chuyên sâu (Band 4.0 -> 9.0).

### Nguyên tắc Game Feel Cốt Lõi:
1. **Juice & Game Feel Đậm Chất Tiên Hiệp:** Mỗi phím gõ là một đường kiếm khí xé gió; mỗi từ trảm xong là một đòn thiên kiếm nổ tung kèm bọt linh trà và ấn chú Bát Quái.
2. **Khí Huyết Nghịch Lưu Thay Vì Đơ Liệt:** Khi gõ sai (Tẩu Hỏa Nhập Ma), nhân vật chỉ giật lùi (recoil flinch) trong tích tắc, linh thể vẫn bồng bềnh hô hấp, tuyệt đối không bị đơ cứng như khúc gỗ.
3. **Độ Khó Tiến Triển Hài Hòa (Gentle Onboarding):** Cảnh giới đầu tiên (Luyện Khí) cực kỳ khoan dung (choáng 160ms, thiên thạch tăng tốc chỉ +2%), giúp người chơi nhập tâm và làm quen nhịp gõ.
4. **Chuẩn Mực Sprite Pixel Art Độc Bản:** Loại bỏ hoàn toàn hình đa giác phẳng thô ráp của CSS. Toàn bộ thiên thạch, phi kiếm, vết trảm và chướng khí đều dùng hệ thống Sprite Pixel Art 16-bit chuyên biệt.

---

## 2. CƠ CHẾ TẨU HỎA NHẬP MA & CHOÁNG (STUN & RECOIL DYNAMICS)

### Bảng Chỉ Số Tiến Triển Tẩu Hỏa Theo Cảnh Giới:

| Cảnh Giới | Thời Lượng Choáng (Stun Ms) | Gia Tốc Thiên Thạch Khi Gõ Sai | Mây Chướng Khí Khi Gõ Sai | Thiên Kiếp Mây Mù Định Kỳ |
| :--- | :---: | :---: | :---: | :---: |
| **0. Luyện Khí (Bamboo)** | **160 ms** (Flinch tức thì) | **+2%** (Gần như không đổi) | Sương nhẹ 1.6s (Max Alpha 0.35) | Không xuất hiện |
| **1. Trúc Cơ (Jade)** | **260 ms** (Thoái bộ nhẹ) | **+4%** | Mây vừa 2.5s (Max Alpha 0.50) | Không xuất hiện |
| **2. Kim Đan (Golden)** | **380 ms** (Định thần) | **+6%** | Mây cuộn 3.0s (Max Alpha 0.62) | Mỗi 28 giây lướt qua 1 lần |
| **3. Nguyên Anh (Purple)** | **520 ms** (Chấn kinh) | **+8%** | Chướng khí 3.5s (Max Alpha 0.72) | Mỗi 20 giây lướt qua 1 lần |
| **4. Hóa Thần (Sovereign)**| **680 ms** (Tâm Ma khảo nghiệm) | **+10%** | U vân dày đặc 4.0s (Max Alpha 0.75) | Mỗi 16 giây lướt qua 1 lần |

### Động Lực Học Flinch Miêu Tôn:
- **Tự Nhiên Hóa Trọng Tâm:** Nhân vật luôn bồng bềnh lơ lửng nhờ hàm dao động `Math.sin(time * 2.8) * 4`.
- **Flinch Recoil Không Đơ:** Khi `catState === "HURT"`, Miêu Tôn giật lùi nhẹ về sau theo hàm hình sin nội suy `recoilProg * Math.PI`, lùi xuống `recoilWave * 10px`, đuôi vẫn ve vẩy và vòng kiếm khí vẫn thở nhịp nhàng.

---

## 3. HỆ THỐNG ASSET SPRITE PIXEL ART 16-BIT CHÂN THỰC

### Pipeline Sprite Đã Tích Hợp Vào Engine:
1. **Thiên Thạch Ma Thạch (`prop_asteroid.png`):** Khối đá ma thạch viền đen pixel art, lõi quặng bốc cháy kèm vệt đuôi lửa đa tầng và sóng nén khí cánh cung (Bow Shockwave).
2. **Thanh Trúc Phi Kiếm (`prop_bamboo_sword.png`):** Kiếm lóng tre ngọc bích Luyện Khí, góc xoay `-Math.PI / 4` bám sát vector đạn đạo, đuôi kiếm tỏa dải lụa lục quang.
3. **Bích Ngọc Phi Kiếm (`prop_jade_sword.png`):** Kiếm ngọc lam Trúc Cơ, phi hành theo quỹ đạo xoắn ốc song kiếm Âm Dương, phóng ra tia lôi điện hoặc hợp thành Lục Kiếm Luân.
4. **Vết Trảm Kiếm Khí (`prop_sword_slash.png`):** Kiếm khí hình trăng khuyết bung tỏa khi kết liễu từ, chém đan chéo thành hình chữ X trảm sát ma thạch.
5. **Nổ Tung Linh Trà (`prop_tea_explosion.png`):** Vụ nổ hạt linh trà và bụi kiếm khí bung tỏa tại tâm va chạm khi trúng đòn.
6. **Chướng Khí Mây Mù (`prop_mystic_cloud.png`):** Cụm mây tím u ám pixel art xoay chậm và trôi ngang che mờ các từ vựng tạo thử thách ghi nhớ phản xạ.

---

## 4. HỆ THỐNG PHÁP BẢO & BÀN PHÍM PHÙ THẠCH (RUNIC KEYBOARD UX)

- **Bàn Phím Phù Thạch Khảm Ngọc:** 3 hàng phím chữ cái với phông chữ pixel cổ phong, viền hoa văn mạ đồng cổ (`#B45309`), hiệu ứng nén nhún phím 1.5px khi chạm (`pointerdown`).
- **Khóa Ấn Chú Khi Choáng:** Khi bị tẩu hỏa, bàn phím chỉ mờ nhẹ trong 160ms kèm huy hiệu `⚡ KHÍ HUYẾT NGHỊCH LƯU`, không làm gián đoạn trải nghiệm gõ của người dùng.

---

## 5. LỘ TRÌNH PHÁT TRIỂN TIẾP THEO (NEXT MILESTONES)

1. **Âm Thanh Tiên Hiệp 8-Bit Lo-Fi:** Tích hợp tiếng đàn tranh gảy từng nốt tương ứng với độ chính xác của phím gõ.
2. **Boss Độc Quyền Cảnh Giới:** Xuất hiện Ma Thú Cổ Đại có thanh giáp chữ ghép phức tạp (IELTS Collocations).
3. **Mở Rộng Bát Quái Trận:** Tính năng gõ phím đặc biệt để kích hoạt Tuyệt Kỹ Tẩy Tâm Ma (xóa sạch mây mù trong 5 giây).
