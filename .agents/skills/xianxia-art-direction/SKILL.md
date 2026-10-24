---
name: xianxia-art-direction
description: Production-Quality Art Direction & UI Design System for 2D Chinese Xianxia Fantasy Games. Enforces premium commercial game UI standards (lacquer, dark wood, antique gold, jade, scrolls, talismans) and strictly forbids crude SVG, flat modern web cards, or makeshift placeholders.
---

# YÊU CẦU NÂNG CẤP MỸ THUẬT GAME 2D TU TIÊN — PRODUCTION-QUALITY ART DIRECTION

Đảm nhận đồng thời vai trò **Senior Game UI Artist**, **Art Director chuyên game Chinese Xianxia Fantasy** và **Senior Frontend Engineer**.

Mục tiêu không phải chỉ chỉnh CSS, đổi màu hoặc thêm vài đường viền, mà là nâng chất lượng mỹ thuật lên mức **giao diện game 2D thương mại được đầu tư nghiêm túc**.

---

## 1. Định hướng mỹ thuật

**Phong cách chủ đạo:** Premium Chinese Xianxia / Wuxia Fantasy Game UI.

**Ngôn ngữ tạo hình gồm:**
- Sơn mài đỏ son, gỗ trầm tối, vàng kim cổ, ngọc bích.
- Hoa văn mây cuộn (Tường Vân 祥云), họa tiết cổ phương Đông (Hồi Văn 回纹, Như Ý 如意), phù chú (符咒), trận pháp (阵法), ngọc bội (玉佩) và linh khí.
- Chất liệu có chiều sâu, phân lớp rõ ràng (Multi-layer Depth: Nền mộc/lụa -> Gấm thêu/giấy tuyên -> Chỉ vàng/đồng thau -> Ngọc thạch/phù triện), ánh sáng có chủ đích.
- Cảm giác huyền bí, sang trọng, cổ phong, tinh xảo và có bản sắc.
- Giao diện phải giống **sản phẩm game hoàn thiện**, không giống website thông thường được gắn thêm vài hình trang trí.

---

## 2. Cấm các giải pháp đồ họa sơ sài

Không sử dụng các giải pháp sau làm thành phẩm cho những thành phần mỹ thuật quan trọng:
- Khung chỉ gồm một hình chữ nhật và một stroke vàng.
- SVG gồm vài path, line, polygon hoặc circle ngẫu nhiên để giả lập hoa văn phức tạp.
- Các đường gạch chéo, nét nối, góc nhọn và đường cong không có chủ đích mỹ thuật (như quai rồng méo, kiếm ghép hình học bẹt).
- Gradient mặc định, box-shadow phát sáng quá mức (cyberpunk/neon glow) hoặc border-radius tùy tiện để giả lập giao diện fantasy.
- Emoji Unicode phóng lớn thay cho icon, vật phẩm, phù chú hoặc sprite chuyên nghiệp.
- Các họa tiết lặp vô nghĩa, mất cân đối, chồng lên chữ hoặc bị cắt ở mép khung.
- SVG có hình khối méo, đường viền không đều, chi tiết rời rạc hoặc nhìn giống bản phác thảo chưa hoàn thiện.

> [!IMPORTANT]
> **Không được đánh đồng việc SVG hợp lệ, component render được hoặc CSS không lỗi với việc asset đạt chất lượng mỹ thuật.**

---

## 3. Quy chuẩn cho SVG và asset đồ họa

Trước khi tự viết SVG, phải xác định thành phần đó có thực sự phù hợp với đồ họa vector hay không.

**SVG phù hợp với:**
- Icon có hình dáng rõ ràng (game-icons chuẩn, silhouette rành mạch).
- Họa tiết hình học và hoa văn lặp cổ phong (Hồi văn, hoa thị, nan lồng).
- Đường viền, góc mây cát tường, biểu tượng trạng thái và các hiệu ứng vector phù hợp.
- Các thành phần cần co giãn và hiển thị sắc nét đa độ phân giải.

**Đối với khung trang trí phức tạp, họa tiết chạm khắc, phù chú, linh thạch, pháp bảo, texture gỗ hoặc kim loại, hiệu ứng linh khí và hình ảnh giàu chi tiết:**
- Ưu tiên asset đồ họa được thiết kế chuyên dụng, ảnh raster chất lượng cao hoặc SVG thực sự được trau chuốt tỉ mỉ.

**Khi tạo asset mới, phải:**
- Thiết kế silhouette rõ ràng và có bản sắc.
- Xây dựng nhiều lớp có phân cấp: nền, chất liệu, viền, hoa văn, điểm sáng và bóng đổ.
- Có điểm nhấn ở góc và các vị trí quan trọng; giữ vùng nội dung đủ thoáng.
- Đảm bảo tính đối xứng khi cần nhưng không lặp họa tiết một cách máy móc.
- Kiểm tra chất lượng ở kích thước sử dụng thật (100% scale).
- Không sử dụng asset sơ sài chỉ để đáp ứng yêu cầu có hình ảnh.

Nếu môi trường không có công cụ tạo hình hoặc nguồn asset phù hợp, hãy nói rõ giới hạn, đề xuất asset cần tạo và tích hợp placeholder có chủ đích. Không được ngụy trang placeholder thành đồ họa hoàn chỉnh.

---

## 4. Hệ thống component giao diện

Thiết kế lại có hệ thống các thành phần sau nếu chúng xuất hiện trong dự án:
- **Panel, khung nội dung và thanh tiêu đề:** Cuộn giấy tuyên chỉ (Parchment Scroll), Khung mộc chạm chỉ vàng có hoa văn góc Như Ý / Tường Vân, Thanh tiêu đề biển hiệu sơn mài.
- **Nút chính, nút phụ, nút nguy hiểm và nút bị khóa:** Lệnh bài chu sa khắc kim (Main CTA), Thẻ ngọc bích bọc đồng (Secondary CTA), Ấn triệt thoái gỗ mun (Cancel).
- **Tab, thanh điều hướng, thanh tiến trình tu vi và thanh tài nguyên:** Thẻ tre trúc thư (Bamboo slips), đai ngọc lưu ly, thanh linh khí phát quang êm dịu có bọc ngọc đầu mút.
- **Khung cảnh giới, đột phá, bí cảnh, nhiệm vụ và phần thưởng:** Bát Quái trận đồ, Vòng Thái Cực kim ấn, bia đá cổ phong khắc chân kinh.
- **Icon vật phẩm, linh thạch, đan dược, pháp bảo và phù chú:** Vector hoặc raster game-quality có bóng đổ, ánh kim, phản quang ngọc thạch.
- **Tooltip, popup, modal, thông báo và trạng thái tải:** Khung thư tịch cổ, triện son đóng ấn, khói sương mờ thiền định.
- **Các họa tiết góc, đường phân cách và chi tiết trang trí nền:** Mây hồi văn, hoa sen ngộ đạo, kiếm khí, đỉnh đồng.

Mỗi nhóm phải có quy chuẩn riêng nhưng dùng chung một ngôn ngữ mỹ thuật. Không tạo từng component theo cảm hứng riêng biệt.

Các khung phức tạp phải có cấu trúc lớp rõ ràng. Sử dụng kỹ thuật Nine-slice hoặc Multi-layer CSS / SVG Corner Decor để co giãn không làm méo hoa văn góc.

---

## 5. Typography và màu sắc

**Bảng màu cơ sở chuẩn Tiên Hiệp Hoàng Gia:**
- **Nền tối (Void Dark):** `#100D12`
- **Nền gỗ trầm (Dark Sandalwood):** `#281711`
- **Đỏ son (Imperial Cinnabar):** `#761D20`
- **Vàng kim cổ (Antique Gold):** `#D4A849`
- **Vàng sáng điểm nhấn (Bright Gold Highlight):** `#FFE49A`
- **Ngọc bích (Spirit Jade):** `#27685D`
- **Chữ sáng:** Màu kem ngà / giấy điệp (`#FFFBEB`, `#FEF3C7`) có độ tương phản xuất sắc.

**Quy tắc:**
- Không dùng vàng sáng cho mọi đường viền; kết hợp viền kép vàng đồng + đệm gỗ sẫm.
- Không lạm dụng glow, text-shadow và gradient rực rỡ neon; ánh sáng phải có độ êm dịu huyền bí như ngọc và đèn lồng cổ.
- Phân cấp rõ giữa tiêu đề, nội dung, chỉ số và trạng thái.
- Dùng font hỗ trợ tiếng Việt đầy đủ (`Be Vietnam Pro`, `Playfair Display`, `Cinzel`).
- Bảo đảm chữ dễ đọc ở kích thước màn hình nhỏ di động (11px - 14px cho body/sub, 16px - 22px cho title).
- Không để hoa văn cạnh tranh thị giác với nội dung văn bản.

---

## 6. Quy trình thực hiện bắt buộc

1. **Bước 1:** Kiểm tra cấu trúc dự án, framework, hệ thống component và các asset đang được sử dụng.
2. **Bước 2:** Xác định những thành phần đang có chất lượng thấp: khung quá đơn giản, icon sơ sài, đường nét thô, texture giả, màu sắc thiếu nhất quán hoặc bố cục thiếu chiều sâu.
3. **Bước 3:** Xây dựng Art Direction và Design System thống nhất trước khi sửa hàng loạt.
4. **Bước 4:** Lập danh sách asset cần thay thế hoặc tạo mới. Phân biệt rõ asset có thể dùng SVG/CSS và asset cần hình ảnh được thiết kế chuyên dụng.
5. **Bước 5:** Triển khai thực tế trong codebase hiện tại. Tái sử dụng component hợp lý, giữ nguyên logic nghiệp vụ và không tự ý phá vỡ các tính năng đang hoạt động.
6. **Bước 6:** Kiểm tra trực quan trên giao diện đã render (Headless Chrome CDP / Screenshot). Không chỉ đọc code và tự kết luận rằng giao diện đã đẹp.
7. **Bước 7:** Kiểm tra responsive, trạng thái hover/pressed/disabled, độ tương phản, lỗi SVG, đường viền bị cắt, hình ảnh méo, tràn chữ và các chi tiết không nhất quán.
8. **Bước 8:** Tiếp tục chỉnh sửa cho đến khi đạt chất lượng đồng bộ; nếu chưa đạt, nêu rõ phần còn yếu thay vì tuyên bố đã hoàn thiện.

---

## 7. Tiêu chuẩn nghiệm thu

Một thành phần chỉ được coi là hoàn thành khi:
- Có hình dáng và bản sắc mỹ thuật rõ ràng (Xianxia Art Identity).
- Chất liệu, ánh sáng, viền và hoa văn được xử lý nhất quán.
- Không có nét gạch, đường nối hoặc hình khối thừa.
- Không trông như wireframe, prototype hoặc bản phác thảo.
- Hài hòa với các thành phần còn lại trong tổng thể game.
- Vẫn đọc được nội dung và thao tác mượt mà trên cả PC và Mobile.
- Hoạt động đúng với logic hiện có.
