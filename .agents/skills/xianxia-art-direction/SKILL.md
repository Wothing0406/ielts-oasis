---
name: xianxia-art-direction
description: Production-Quality Art Direction & UI Design System for 2D Chinese Xianxia Fantasy Games. Enforces premium commercial game UI standards (lacquer, dark wood, antique gold, jade, scrolls, talismans) and strictly forbids crude SVG, flat modern web cards, or makeshift placeholders.
---

# YÊU CẦU NÂNG CẤP MỸ THUẬT GAME 2D TU TIÊN — PRODUCTION-QUALITY ART DIRECTION & ASSET QUALITY REFACTOR

Đảm nhận đồng thời vai trò **Senior Game UI/UX Designer**, **Senior 2D Game Art Director chuyên game Chinese Xianxia Fantasy**, **Game Asset Artist**, **Technical Artist** và **Senior Frontend Engineer**.

Mục tiêu không phải chỉ chỉnh CSS, đổi màu hoặc thêm vài đường viền, mà là nâng chất lượng mỹ thuật lên mức **giao diện game 2D thương mại được đầu tư nghiêm túc**.

---

## 1. ĐỊNH HƯỚNG MỸ THUẬT (ART DIRECTION)

**Phong cách chủ đạo:** Premium Chinese Xianxia / Wuxia Fantasy Game UI, kết hợp môi trường pixel-art Á Đông với giao diện RPG được thiết kế chuyên nghiệp.

**Ngôn ngữ tạo hình gồm:**
- Sơn mài đỏ son (#761D20), gỗ trầm tối (#281711), vàng kim cổ (#D4A849), ngọc bích (#1A433A / #27685D), giấy điệp hoàng chỉ ngà vàng (#FDF4DC).
- Hoa văn mây cuộn (Tường Vân 祥云), họa tiết cổ phương Đông (Hồi Văn 回纹, Như Ý 如意), phù chú (符咒), trận pháp (阵法), ngọc bội (玉佩) và linh khí.
- Chất liệu có chiều sâu, phân lớp rõ ràng (Multi-layer Depth: Nền mộc/lụa -> Gấm thêu/giấy tuyên -> Chỉ vàng/đồng thau -> Ngọc thạch/phù triện), ánh sáng có chủ đích.
- Cảm giác huyền bí, sang trọng, cổ phong, tinh xảo và có bản sắc.
- Giao diện phải giống **sản phẩm game hoàn thiện**, không giống website thông thường được gắn thêm vài hình trang trí.

---

## 2. PHÂN BIỆT RÕ 3 LOẠI TÀI SẢN (ASSET CLASSIFICATION)

1. **A. Functional icons:**
   - Icon đóng, lưu, âm thanh, quay lại, tạm dừng, trạng thái đơn giản.
   - Sử dụng SVG vector đơn sắc rõ nét, chuẩn độ dày nét, tỉ lệ đồng đều, màu sắc kiểm soát theo design token.

2. **B. Decorative UI assets:**
   - Khung, góc chạm khắc (Như Ý, Hồi Văn), dải phân cách, huy hiệu, đầu trang, phù chú, nút pháp môn, biển hiệu.
   - Phải có thiết kế chuyên dụng, hình dáng rõ ràng, chi tiết hợp lý, hoa văn đối xứng tinh xảo và chất liệu gấm/gỗ/đồng thống nhất.

3. **C. Illustrated game assets:**
   - Kiếm, pháp bảo, bệ đá, đan dược, linh thú, vật phẩm đặc biệt, hiệu ứng môi trường.
   - Ưu tiên sprite pixel-art hoặc hình minh họa raster/vector đa tầng chất lượng cao. Tuyệt đối không dùng SVG hình học đơn giản để giả lập một asset giàu chi tiết.

---

## 3. CẤM CÁC GIẢI PHÁP ĐỒ HỌA SƠ SÀI & PLACEHOLDER (STRICT BAN)

Không sử dụng các giải pháp sau làm thành phẩm cho những thành phần mỹ thuật quan trọng:
- Bốn góc khung chỉ gồm đường gấp khúc chữ L thô sơ (`xianxia-corner` hoặc `meanderCorner()`).
- Polygon và rect ghép lại để giả lập chuôi kiếm (`sword-cta-hilt`, `sword-token-hilt`) và đầu kiếm mũi tên (`sword-cta-tip`, `sword-token-tip`).
- Ellipse và polygon hình học xám/đen xì giả lập bệ đá (`stone-cliff-platform-svg`).
- Khung chỉ gồm một hình chữ nhật và một stroke vàng đơn điệu.
- SVG gồm vài path, line, polygon hoặc circle ngẫu nhiên để giả lập hoa văn phức tạp.
- Gradient mặc định, box-shadow phát sáng quá mức (cyberpunk/neon glow) hoặc border-radius tùy tiện để giả lập giao diện fantasy.
- Emoji Unicode phóng lớn thay cho icon, vật phẩm, phù chú hoặc sprite chuyên nghiệp.
- Icon tài liệu văn phòng (doc, clipboard, slip) xuất hiện trong game tiên hiệp.
- Các họa tiết lặp vô nghĩa, mất cân đối, chồng lên chữ hoặc bị cắt ở mép khung.

> [!IMPORTANT]
> **Không được đánh đồng việc SVG hợp lệ, component render được hoặc CSS không lỗi với việc asset đạt chất lượng mỹ thuật.**

---

## 4. 5 NHÓM ASSET ƯU TIÊN CAO NHẤT CẦN XỬ LÝ (TOP 5 PRIORITIES)

1. **Bốn góc `xianxia-corner` trong `index.html`:**
   - Thay các path chữ L thô sơ bằng hoa văn góc chạm lộng Tiên Hiệp cao cấp: Hồi Văn (回纹) / Vân Lôi Văn / Cát Tường Như Ý nạm vàng chuẩn mực.
2. **`meanderCorner()` trong `XianxiaIcons.js`:**
   - Loại bỏ code sinh SVG chữ L / dích dắc đơn giản, thay bằng vector hoa văn Hồi Văn hoàng kim cổ phong đa tầng.
3. **Chuôi kiếm và đầu kiếm của nút "VÀO TRẬN ĐỘ KIẾP":**
   - Loại bỏ các polygon rect/mũi tên thô sơ, thay bằng chuôi kiếm chạm rồng / hoa sen mạ vàng (`winged-sword.svg` / `broadsword.svg`) và mũi kiếm thần quang xé gió (`fast-arrow.svg` hoặc kiếm khí nhọn sắc).
4. **Bệ đá nhân vật (`stone-cliff-platform-svg`):**
   - Thay thế hoàn toàn bằng **Đài Mây Ngũ Sắc / Bệ Đá Ngọc Bích Thần Khí Phù Không** tương thích 100% với sprite nhân vật pixel-art.
5. **Ba icon pháp môn trong `setup-modes-grid`:**
   - Thay viền tròn stroke đơn sắc bằng **Huy Hiệu Pháp Môn Đa Tầng**: Vòng Âm Dương Thái Cực nạm vàng (Ngộ Đạo Thông Linh), Song Kiếm Trảm Ma bích ngọc kim quang (Trực Diện Trảm Ma), Chuông Khánh Tiên Tông đồng thau cổ (Thính Lôi Biện Âm).

---

## 5. QUY TRÌNH 4 GIAI ĐOẠN BẮT BUỘC (4-PHASE PIPELINE)

- **Giai đoạn 1: Audit:** Liệt kê các SVG và asset trang trí đang dùng, phân loại A/B/C, xác định chính xác asset chưa đạt.
- **Giai đoạn 2: Art Direction:** Đồng bộ bảng màu, phong cách, chất liệu, kiểm tra tỉ lệ và độ nét.
- **Giai đoạn 3: Production:** Tích hợp asset chuyên dụng chất lượng cao, chuẩn hóa CSS token, bảo lưu 100% logic nghiệp vụ.
- **Giai đoạn 4: Validation:** Render và chụp screenshot thực tế qua Chrome CDP trên cả Desktop và Mobile. Đối chiếu trước và sau. Xác minh trực quan trước khi kết luận.
