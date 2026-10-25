# MEOW-CHA 12.4 — nút bấm, chứng đạo, âm thanh và nổ IPA

Nhánh: `game/meowcha-cultivation`. Ngày: 25/10/2026.

## Các lỗi đã đối chiếu

| Phản ánh | Nguyên nhân trong code | Sửa |
| --- | --- | --- |
| Hồi Môn không ra được sảnh | Link `_top` bị chính sách iframe chặn | Child gửi yêu cầu; trang cha kiểm tra origin, nguồn iframe và đường dẫn `/games` trước khi điều hướng |
| Mở toàn bộ Oxford không hoạt động | Link trỏ ra `/#vocab-lab`, không có vùng đích đó và cũng bị chặn `_top` | Mở tab tất cả ngay trong kho; dùng trọn bộ JSON Oxford, gồm từ ngắn và từ ghép |
| Icon đen trong hộp thoại | SVG ảnh ngoài không kế thừa màu, một số được sinh sau lần thay icon đầu | Dùng atlas PNG có sẵn; đổi cả ảnh được thêm vào DOM sau đó, giữ SVG chức năng inline |
| Không thấy thông báo sao chép | Thanh trạng thái nằm dưới lớp hộp thoại | Đặt thông báo ở body, lớp cao hơn mọi modal, có role status và aria-live |
| Chứng đạo về 0 khi chơi ván mới | Canvas lấy `state.score` | Lưu snapshot ván kỷ lục; đối chiếu API riêng của tài khoản và save; không dùng thống kê ván mới cho kỷ lục cũ |
| Âm thanh báo bật nhưng khó khôi phục | Lần chạm mở AudioContext đồng thời có thể bị nút toggle tắt lại; UI ban đầu không mô tả trạng thái, gain thấp | Nút bật/khôi phục rõ ràng, loại nút khỏi auto-unlock, tăng mức BGM/SFX có kiểm soát, giữ mute, tái sử dụng một phần tử phát voice |
| Từ nổ ở góc, IPA bị cắt | Renderer dời reward xuống góc và dùng hàm rút gọn | Giữ tọa độ ma thạch; chỉ dời khi sát mép/HUD; xuống dòng toàn bộ IPA, không chèn dấu rút gọn |

## Hành vi sau sửa

- Chứng đạo và link chia sẻ dùng kỷ lục. API `GET /api/meowcha/personal-best`
  bắt buộc đăng nhập, chỉ lấy run/leaderboard của đúng user id.
- Kỷ lục cũ chỉ có điểm được hiển thị trung thực: thống kê chưa lưu không bị
  thay bằng accuracy/WPM của ván hiện tại. API chỉ đọc, không cộng điểm.
- Toàn bộ Oxford hiển thị số mục thực tế; bản dữ liệu hiện có 5.946 mục, gồm
  các từ có nhiều loại từ. Phân trang 20 mục, tìm kiếm và tải thêm trong game.
- Sao chép bị trình duyệt từ chối sẽ hiện liên kết có thể chọn/sao chép thủ công.
  Iframe cho phép tải ảnh và clipboard-write, không mở quyền điều hướng top tùy ý.
- Trảm thường dùng kiếm/hiệu ứng tại ma thạch; không gọi mưa kiếm lớn ở nhân vật
  hoặc sét từ trời sau mỗi từ. Kỹ năng chủ động vẫn giữ hiệu ứng riêng.
- Dữ liệu Oxford bổ sung IPA/audio thiếu ở bản API khi có dữ liệu nguồn tương ứng.

## Kiểm chứng

- 45/45 kiểm thử engine/audio; 12/12 kiểm thử API; Next.js production build đạt.
- Trình duyệt: nút tất cả mở 20/5.946; tải thêm thành 40/5.946; không còn ảnh SVG
  ngoài chưa được đổi trong modal kho.
- Chứng đạo thử: kỷ lục 12.345, accuracy 75%, 30 WPM được giữ khi ván hiện tại 0.
  Sao chép link và ảnh đều hiện thông báo phía trên modal.
- Iframe thử: Hồi Môn chuyển trang cha đến `/games`.
- Chuỗi 20 từ qua TypingEngine: 20 voice xong, một fallback, không voice lỗi;
  BGM vẫn chạy, hàng chờ rỗng; đo được RMS đầu ra khoảng 0,0165.
- Ảnh và số đo cục bộ trong `artifacts/meowcha-qa/` (không đưa lên Git).
  `backend/tests/meowcha_qa.html` chỉ dành cho test server, không nối vào production.

## Giới hạn xác minh

Tên miền public được kiểm tra trực tiếp ở đường dẫn engine. Trang Next.js public
có bước xác minh Cloudflare; không vô hiệu hóa hoặc vượt qua bước xác minh đó.
Điều hướng cha/con được kiểm tra bằng fixture cùng chính sách iframe và build
trang cha thật. Chưa kiểm tra máy iOS/Android vật lý hay âm lượng loa của thiết bị.
