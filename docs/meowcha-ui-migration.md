# Migration giao diện MEOW-CHA — brief 13

Yêu cầu trực tiếp: lưu tài liệu vào bộ nhớ dự án, hoàn thiện toàn bộ hệ UI,
kiểm tra đột phá/kỹ năng/thiên thạch ở các cảnh giới và sửa chữ lệch/khó đọc.
Hai attachment 5a484aa2 và fdde5ca6 trùng SHA256
`40d74c1c176bcca16be5e022dbafa886abb24074b3f963268fe7fb00bd9f52c6`;
lưu một [bản gốc](prompts/meowcha/13-complete-ui-design-system.md).
Nội dung là brief sản phẩm đã được người dùng yêu cầu thực hiện; không cấp quyền
ngoài phạm vi game hay thay thế chỉ dẫn trực tiếp trong cuộc trò chuyện.

## Công việc

- [x] Đọc brief, ghi nhận bản trùng, xác định runtime trên nhánh game.
- [x] UI kit chung: token màu/chữ/khoảng cách, bốn panel, bốn cấp hành động,
  sáu stat có icon; gom các lớp CSS sửa chồng trước đây.
- [x] Migrate sảnh/HUD/Định Tâm, thay sáu card lớn bằng chiến tích gọn.
- [x] Migrate chọn mode/kinh quyển, Tàng thư, Phong Thần, chứng đạo, hồ sơ,
  ngọc giản, xác nhận, âm thanh và bàn phím điện thoại.
- [x] Bổ sung màn kết thúc trận đang thiếu markup; giữ idempotency kết quả.
- [x] Kiểm tra đủ bốn lần đột phá qua boss → ba lựa chọn → chọn một → tiếp tục;
  kỹ năng ở năm cảnh giới, save/load và phím/touch cùng tác dụng.
- [x] Kiểm tra băng/hỏa/hư không/huyết lôi, sát thương, rơi đá, shield và nổ/IPA.
- [x] Sửa khung cảnh dọc có chủ đích; không cắt mù bằng cover.
- [x] Ảnh trước/sau của chín luồng, kiểm tra 320/360/375/390/430, tablet,
  desktop và ngang thấp; đo chữ tràn/đè khung, đọc cả chữ Việt/IPA dài.
- [ ] Kiểm thử engine/audio/API, build, cập nhật skill/bộ nhớ; commit, backup,
  triển khai Linux và đối chiếu production.

## Bổ sung đang thực hiện — brief 14/15

- [x] Lưu brief mobile/IPA/spawn và yêu cầu bốn Phong Thần điện vào docs.
- [x] Ba thẻ nâng cấp nằm ngang, gọn; màn quá hẹp cuộn ngang.
- [x] Tách từ vừa học khỏi mục tiêu hiện tại; IPA/từ loại/nghe lại sau đáp án.
- [x] Khoảng nghỉ theo mode, không sinh đá đè phần thưởng; vào từ trên, x cố định,
  hiệu chỉnh hướng thực của bốn ảnh đá, đuôi hướng lên.
- [x] Đo/lưu đúng Nhất Ngộ, Nhất Thính, hint, nghe lại, combo; giữ dữ liệu cũ.
- [x] API Phong Thần riêng cho bốn điện; Đạo Hạnh chuẩn hóa có công thức rõ;
  top 3/bảng/self/hạng ngoài top 25 đúng mode và tài khoản.
- [x] Ngọc bài thay select; đổi cột/mô tả/màu/metric cùng dữ liệu; chip hỗ trợ nhỏ.
- [ ] Kiểm thử 10 từ nhanh/mode, hồi quy save/audio/điểm, ảnh mobile và deploy.

## Audit ban đầu

14.1 có logic năm cảnh giới, bốn boss gần nghĩa, sinh ba lựa chọn và kỹ năng
chủ/bị động; chưa có bằng chứng hình ảnh đầy đủ cho mọi level trên điện thoại.
`UIManager.showGameOverModal` có code nhưng HTML không có `modalGameOver`, nên
kết thúc trận thiếu bảng hiển thị. Ba lớp cozy/sword/complete còn ghi đè chồng,
stat Định Tâm vẫn là sáu khối giấy lớn và reset chưa tách thành ấn đỏ.

Giữ nền, nhân vật, linh thú, beam/meteor, SVG chức năng nhỏ và invariant điểm/save.
Kiểm thử dùng SQLite riêng; không sinh điểm giả trên production. Mô phỏng viewport
và touch trong PC phải được ghi rõ, không gọi là kiểm thử điện thoại thật.
