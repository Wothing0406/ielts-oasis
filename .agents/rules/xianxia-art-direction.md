# RÀNG BUỘC MỸ THUẬT BẮT BUỘC: XIANXIA ART DIRECTION & SVG QUALITY REFACTOR

Áp dụng cho toàn bộ codebase Meow-Cha (`frontend/public/meowcha/` và `frontend/app/games/meowcha/`).

1. **Phân loại 3 nhóm Asset rõ ràng:**
   - **Functional Icons:** SVG vector đơn sắc chuẩn tỉ lệ, độ dày nét nhất quán, màu theo design token.
   - **Decorative UI Assets:** Khung, góc chạm khắc (Như Ý, Hồi Văn), huy hiệu, lệnh bài phải có hoa văn cổ phong đối xứng, đa tầng chất liệu (gỗ tử đàn, gấm thêu, chỉ vàng, chu sa).
   - **Illustrated Game Assets:** Kiếm, đan dược, pháp bảo, bệ đứng, nhân vật phải dùng sprite pixel-art hoặc illustration/vector cao cấp.

2. **Cấm tuyệt đối các giải pháp đồ họa sơ sài:**
   - CẤM 4 góc chữ L gấp khúc thô sơ (`xianxia-corner`, `meanderCorner()`).
   - CẤM ghép polygon và rect giả lập chuôi kiếm (`sword-cta-hilt`, `sword-token-hilt`) và đầu kiếm (`sword-cta-tip`, `sword-token-tip`).
   - CẤM bệ đá polygon đen/xám thô sơ đè lên nhân vật (`stone-cliff-platform-svg`).
   - CẤM icon tài liệu văn phòng (doc, clipboard) trong thế giới Tiên Hiệp.
   - CẤM màu neon cyan `#38BDF8` / tím cyberpunk `#C084FC` trên thẻ từ vựng và khung game.
   - CẤM emoji Unicode phóng lớn thay cho asset game.

3. **Bảng màu Tiên Hiệp cốt lõi:**
   - Nền tối: `#100D12`
   - Nền gỗ trầm tử đàn: `#281711`
   - Đỏ son chu sa: `#761D20`
   - Vàng kim cổ: `#D4A849`
   - Vàng sáng điểm nhấn: `#FFE49A` / `#FEF08A`
   - Ngọc bích: `#1A433A` / `#27685D`
   - Chữ sáng: Kem ngà thư pháp `#FDF4DC` / `#FEF3C7`

4. **Nghiệm thu bắt buộc qua Render Thực Tế (Chrome CDP):**
   - Mọi thay đổi mỹ thuật phải được kiểm tra trực quan qua ảnh chụp screenshot thực tế trên cả Desktop (1280x800) và Mobile (390x844). Không kết luận hoàn thành chỉ dựa trên đọc code.
