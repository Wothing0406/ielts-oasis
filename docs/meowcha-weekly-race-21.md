# MEOW-CHA 21.0 — Thiên Bảng tuần, kỷ lục trọn đời và Đạo Áp

## Bảng Phong Thần

- Bảng chính chỉ còn bốn điện: Tổng Đạo, Trực Diện, Ngộ Đạo và Thính Âm. Lưu
  Trữ và khối vinh danh cũ đã rời khỏi luồng chính; lịch sử mùa nằm ở nút phụ.
- `Tuần này` xếp theo Tu Vi tăng thêm của một đoạn/ván đã chốt trong tuần. Mỗi
  run chỉ giữ thành tích tuần cao nhất, không cộng dồn việc farm nhiều lần.
- `Vĩnh viễn` xếp theo kỷ lục Tu Vi cao nhất. Cảnh giới là mức cao nhất đã có
  bằng chứng của tài khoản, không bị ván mới điểm thấp hạ xuống.
- Kỷ lục cũ không rõ pháp môn chỉ vào Tổng Đạo; không đoán thành Trực Diện.
- `CHỐT ĐẠO QUẢ TUẦN` lấy phần tăng kể từ mốc đầu tuần/chốt trước, rồi mở run đo
  mới nhưng giữ nguyên Tu Vi, cảnh giới, HP, kỹ năng, thiên phú, SRS và bản lưu.
- Bốn tab đổi top 3, cột, hàng, mô tả, màu và self-card. Mobile dùng dải ngọc bài
  cuộn ngang. Tùy chọn hỗ trợ và Discord là chip nhỏ.

Tuần tính theo Việt Nam: thứ Hai 00:00 đến trước thứ Hai kế tiếp. Web, lobby và
bot dùng cùng thời điểm server. Worker chốt mùa bằng khóa duy nhất nên nhiều
process không tạo hai mùa.

## Chiếu thư và Discord

- Lần đăng nhập đầu tiên của mỗi tài khoản trong tuần mở một chiếu thư: top 3
  tuần trước, hạng/danh hiệu của chính người chơi hoặc lời mời tích cực. Đóng,
  nhận hoặc xem bảng đều ghi đã xem ở server; marker theo tài khoản trên máy
  ngăn modal lặp trong lúc server đang thử lại.
- Top 10 không hỗ trợ nhận danh hiệu riêng; danh hiệu không tăng chỉ số. Lịch sử
  mùa lưu độc lập với bảng hiện tại.
- Bot thêm `/phongthan`, `/hangcuatoi`, `/duatop`, `/thongbaophongthan`. DM mặc
  định tắt, chỉ có khi Discord đã liên kết và người dùng tự bật. Public channel
  chỉ chạy nếu quản trị cấu hình `MEOWCHA_AWARDS_CHANNEL_ID`.
- Outbox claim trước khi gọi Discord, dùng nonce ổn định và không tự gửi lại
  trạng thái không rõ. Cách này ưu tiên không gửi trùng; crash đúng khoảng giữa
  claim và request có thể làm lỡ một DM, còn lịch sử web vẫn giữ kết quả.

## Đạo Áp và nhịp rơi

Difficulty dùng đường cong bão hòa theo Tu Vi, cộng nền cảnh giới và điều chỉnh
nhẹ theo trung vị WPM người thật. Phím/từ hỗ trợ không làm game nhanh hơn. Điều
chỉnh WPM bị chặn trong ±10%; bonus từ dài tối đa 3,5 giây.

| Pháp môn | Thời gian tối thiểu |
|---|---:|
| Trực Diện | 7 giây |
| Ngộ Đạo | 8,5 giây |
| Thính Âm | 9,5 giây |

Thính Âm giữ ngân sách cho tới khi lần phát âm đầu kết thúc hoặc thất bại có
giới hạn; nghe lại không reset đồng hồ. Sau 50.000 Tu Vi, áp lực tăng thêm bằng
từ khó và hiệu ứng, thay vì nhân tốc độ vô hạn. HUD chỉ hiện Nhẹ / Ổn Định /
Cao / Cực Cao / Chí Cảnh.

Ma trận kiểm thử đi qua 7 mức Tu Vi × 4 WPM × 3 mode = 84 trường hợp và đo tới
đúng mặt phẳng va chạm. Ví dụ ở 40 WPM: Trực Diện khoảng 15,4 giây tại 2.500
Tu Vi và 9,3 giây tại 30.000 Tu Vi; 100.000 vẫn không dưới 7 giây.

## Dữ liệu, kiểm chứng và giới hạn

- Migration chỉ thêm tám bảng; không xóa/đổi save, SRS, profile, run hay điểm cũ.
  Career hợp nhất legacy, run, checkpoint và `highScore` theo nguyên tắc chỉ tăng.
  Personal import chỉ làm kỷ lục mỹ thuật trọn đời, không sinh weekly/credit/tiền.
- Run/checkpoint kiểm tra ownership, thời gian, bộ đếm tăng đơn điệu và giới hạn
  hợp lý. Đây chưa phải server replay từng phím và không dùng cho phần thưởng giá trị.
- 101 kiểm thử Node và 40 kiểm thử API đạt; CSS parse và production build đạt.
  Browser quan sát PC1280, 390×844, 320×568 và landscape844×390.
- Discord unit test dùng transport giả, không nhắn người thật. Command tree và bot
  production được kiểm tra khi deploy; chưa chứng nhận OAuth/điện thoại vật lý.

Prompt gốc: `docs/prompts/meowcha/21-weekly-race-discord-difficulty.md`.
Giới hạn trực tiếp: `docs/prompts/meowcha/21b-smooth-difficulty-overrides.md`.
