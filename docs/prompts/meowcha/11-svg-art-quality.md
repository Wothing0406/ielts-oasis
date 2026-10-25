# MEOW-CHA — SVG & GAME ART ASSET QUALITY REFACTOR

Bạn là Senior 2D Game Art Director, Game UI Artist, Technical Artist và Frontend Engineer.

Repository: Wothing0406/ielts-oasis

Branch: game/meowcha-cultivation

## NHIỆM VỤ

Kiểm toán và thay thế toàn bộ những SVG và đồ họa trang trí chất lượng thấp của game MEOW-CHA TRẢ ĐẠO.

Đây là nhiệm vụ nâng cấp ART ASSET, không phải nhiệm vụ chỉ chỉnh CSS.

Phong cách mục tiêu: Premium Xianxia Fantasy Game UI, phù hợp với môi trường pixel-art và sprite nhân vật hiện có.

## 1. ĐÚNG ENTRY POINT CỦA GAME

Trước tiên, đọc:
- frontend/app/games/meowcha/page.tsx
- frontend/public/meowcha/index.html
- frontend/public/meowcha/css/meowcha-ui.css
- frontend/public/meowcha/js/ui/XianxiaIcons.js
- frontend/public/meowcha/js/ui/UIManager.js
- frontend/public/meowcha/assets/svg/
- frontend/public/meowcha/assets/ui/

Trang game hiện sử dụng bản HTML được tải trong iframe. Vì vậy, không được chỉ sửa các component React không được sử dụng trong màn hình thực tế.

Xác nhận đường dẫn thực thi và asset đang được dùng trước khi thay đổi.

## 2. VẤN ĐỀ SVG ĐÃ XÁC ĐỊNH

Các SVG trong assets/svg chủ yếu là silhouette đơn sắc, sử dụng một path và currentColor.

Cách này phù hợp với icon cơ bản, nhưng không đủ chất lượng cho vật phẩm, pháp bảo, huy hiệu và đồ trang trí trọng tâm.

Nhiều SVG inline trong index.html cũng đang dùng các hình học đơn giản như:
- Path hình chữ L tạo góc khung.
- Polygon và rect giả lập chuôi kiếm.
- Polygon dạng mũi tên giả lập đầu kiếm.
- Ellipse và polygon giả lập bệ đá.
- Vòng tròn bao quanh icon đơn sắc.
- Hoa văn trang trí thiếu chiều sâu và ngôn ngữ tạo hình nhất quán.

Không tiếp tục dùng các SVG đó làm thành phẩm mỹ thuật cao cấp.

## 3. TIÊU CHUẨN MỚI

Phân biệt rõ ba loại tài sản:

A. Functional icons:
Icon đóng, lưu, âm thanh, quay lại, trạng thái đơn giản.

Có thể sử dụng SVG đơn sắc. Phải thống nhất độ dày nét, tỷ lệ, màu và cách hiển thị.

B. Decorative UI assets:
Khung, góc chạm khắc, phân cách, huy hiệu, đầu trang, phù chú, nút pháp môn.

Phải có thiết kế chuyên dụng, hình dáng rõ ràng, chi tiết hợp lý và chất liệu thống nhất.

C. Illustrated game assets:
Kiếm, pháp bảo, bệ đá, đan dược, linh thú, vật phẩm đặc biệt, hiệu ứng môi trường.

Ưu tiên sprite hoặc hình minh họa chất lượng cao. Không dùng SVG hình học đơn giản để giả lập một asset giàu chi tiết.

## 4. THAY THẾ CỤ THỂ

Ưu tiên xử lý:

1. Bốn góc xianxia-corner trong index.html.
2. meanderCorner() trong XianxiaIcons.js.
3. SVG chuôi kiếm và đầu kiếm của nút VÀO TRẬN ĐỘ KIẾP.
4. stone-cliff-platform-svg dưới nhân vật.
5. Ba icon pháp môn trong setup-modes-grid.
6. Các góc modal-brass-corner.
7. Các SVG trang trí lặp trong UIManager.js.
8. Những icon kỹ năng và vật phẩm chưa tương thích với phong cách sprite.

Không nhất thiết phải xóa mọi SVG. Giữ những icon chức năng đã đạt yêu cầu.

## 5. QUY TẮC ART PRODUCTION

Trước khi tạo một asset, phải xác định:
- Vai trò của asset.
- Kích thước hiển thị thực tế.
- Silhouette.
- Chất liệu.
- Phối cảnh.
- Nguồn ánh sáng.
- Màu chủ đạo.
- Mức độ chi tiết cần thiết.
- Cách asset hòa vào UI hiện tại.

Đối với game pixel-art, cần đảm bảo tài sản mới tương thích về độ sắc nét và ngôn ngữ tạo hình.

Không dùng một loạt hình học sơ sài cộng glow để giả lập chi tiết.

Không tự tuyên bố asset là AAA, premium hoặc production-ready nếu chưa kiểm tra trực quan.

Không thay sprite đẹp bằng hình do code tự vẽ có chất lượng thấp hơn.

Nếu không có công cụ tạo asset đạt chất lượng, phải liệt kê rõ những tài sản cần thiết kế riêng, thay vì chế tạo một placeholder rồi gọi đó là thành phẩm.

## 6. REFACTOR CSS LIÊN QUAN

Kiểm tra các lớp CSS đang áp dụng lên SVG và decor.

Loại bỏ có chọn lọc:
- Glow quá mức.
- Viền chồng nhiều lớp.
- Gradient không có chủ đích.
- Drop-shadow không phù hợp.
- Các override !important trùng lặp.
- Những hiệu ứng khiến hình mất nét.

Không xóa bừa các quy tắc CSS vì có thể ảnh hưởng đến gameplay và responsive.

Thiết lập token và class dùng chung cho các nhóm art asset.

## 7. TẠO BỘ ASSET CHUẨN

Xây dựng một bộ asset có thể tái sử dụng:

- Frame corner ornaments.
- Modal frame / nine-slice assets.
- Primary and secondary button decorations.
- Sword hilt and sword tip.
- Three cultivation mode medallions.
- Jade and bronze ornaments.
- Talisman decorations.
- Character platform.
- Fantasy inventory icons.

Tận dụng các asset PNG chất lượng tốt đang có trong assets/ui/.

Không tải asset không rõ giấy phép. Tuân thủ giấy phép và yêu cầu ghi công của nguồn bên ngoài.

## 8. MOBILE

Mọi asset phải được kiểm tra ở kích thước mobile thực tế.

- Hoa văn không được chiếm diện tích chữ.
- Icon phải rõ ở kích thước nhỏ.
- Không có đường nét bị dính vào nhau.
- Không có glow làm mờ hình.
- Không có SVG vượt khỏi nút hoặc modal.
- Không làm giảm vùng chạm của thao tác quan trọng.

Nếu asset có nhiều chi tiết, tạo phiên bản compact dành riêng cho mobile.

## 9. QUY TRÌNH BẮT BUỘC

Giai đoạn 1: Audit
- Liệt kê các SVG và asset trang trí đang được dùng.
- Xác định vị trí sử dụng.
- Chỉ ra asset nào đạt, asset nào chưa đạt.
- Tìm phần trùng lặp giữa file SVG và SVG inline.

Giai đoạn 2: Art direction
- Chốt bảng màu, phong cách, chất liệu.
- Chọn bộ asset mẫu.
- Không sửa toàn bộ dự án khi chưa có mẫu đạt yêu cầu.

Giai đoạn 3: Production
- Tạo hoặc tích hợp asset chất lượng cao.
- Thay SVG chất lượng thấp.
- Chuẩn hóa component và CSS liên quan.

Giai đoạn 4: Validation
- Render và chụp screenshot thực tế.
- Kiểm tra trước/sau ở desktop và mobile.
- Kiểm tra asset lỗi, méo, nhòe, cắt góc và chồng chữ.
- Kiểm tra giao diện đang chạy trong iframe thực tế.

## 10. ĐIỀU KIỆN HOÀN THÀNH

Không coi công việc hoàn thành nếu:
- Chỉ thay màu SVG.
- Chỉ tăng thêm gradient hoặc box-shadow.
- Chỉ thêm vài path lên icon cũ.
- Chỉ thay tên class hoặc comment.
- Chỉ hoàn thành code mà chưa kiểm tra render.
- Asset mới vẫn trông giống placeholder.
- Giao diện đẹp hơn ở desktop nhưng hỏng trên mobile.

Kết quả mong muốn là một bộ asset có chất lượng mỹ thuật đồng bộ với sprite và môi trường của MEOW-CHA, không phải một bộ SVG được lập trình phức tạp hơn.

Hãy bắt đầu với 5 nhóm asset ưu tiên cao nhất, triển khai, kiểm tra ảnh thực tế rồi mới mở rộng toàn bộ giao diện.
Nạp thêm vào skills và rằng buộc và sửa
