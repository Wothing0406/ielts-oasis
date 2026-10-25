# Hai phạm trù nâng cấp MEOW-CHA

Ngày đối chiếu: 25/10/2026. Nhánh: `game/meowcha-cultivation`.

Hai tệp dưới đây lưu nguyên văn brief do người dùng cung cấp. Chúng là yêu cầu
sản phẩm để đối chiếu; các vai trò hoặc chỉ dẫn bên trong không thay thế yêu cầu
trực tiếp của người dùng và không cấp quyền thao tác ngoài game.

## 01 — Cozy Pixel Xianxia: mỹ thuật và âm thanh

Nguồn: [01-cozy-pixel-art-audio.md](01-cozy-pixel-art-audio.md).

- [x] Giữ nền đêm, nhân vật, linh thú và bốn sprite ma thạch đã có.
- [x] Tạo giấy tiên ngà và atlas tám icon pixel, tích hợp vào phần thưởng từ,
  ma thạch, bàn học, navigation, pháp môn và cơ duyên/kỹ năng.
- [x] Bỏ cuộn nổ đen vàng và vòng tròn tám nét; dùng mảnh vỡ pixel, giấy tiên,
  chữ/IPA/nghĩa/Tu Vi và hạt khí bay về nhân vật.
- [x] Thu gọn HUD, bớt lời thoại lặp, dùng bảng màu ngà/ngọc/đào/vàng cổ.
- [x] PC luôn ẩn bàn phím ảo, kể cả cờ mở thủ công từ bản cũ.
- [x] Tách BGM/SFX/VOICE; giảm hiệu ứng khi đang đọc, tuần tự voice,
  hỗ trợ URL tương đối, MP3 lỗi chuyển sang giọng hệ thống, phục hồi context.
- [x] Mute được lưu và áp dụng cho cả ba kênh; callback cũ không bật tiếng lại.
- [x] Kiểm thử tự động chuỗi 20 voice, fallback, mute, context gián đoạn.
- [x] Trình duyệt thực tế: trảm 20 từ qua TypingEngine; 20 voice hoàn tất,
  1 lần fallback, 0 voice lỗi, BGM còn chạy, hàng chờ rỗng.
- [x] Kiểm tra bố cục 320×568, 390×844, 844×390, 768×1024 và desktop
  1280×720; HUD/kỹ năng không chồng bàn phím, không tràn ngang. Kiểm tra
  pause/resume, bật/tắt tiếng, nghe lại cảm ứng và về sảnh.
- [x] Đẩy nhánh game và backup `codex/backup-meowcha-cozy-20261025`;
  cập nhật Linux, build lại web và nạp lại backend. Kiểm tra HTTP 200 cho
  trang game, HTML engine, CSS/audio script, hai PNG và leaderboard.

SVG chức năng và một số họa tiết khung cũ vẫn còn. Không tuyên bố đã thay toàn bộ
SVG, hay toàn bộ game đã trở thành một bộ mỹ thuật pixel mới.

## 02 — Cơ duyên và kỹ năng đột phá

Nguồn: [02-breakthrough-cultivation-skills.md](02-breakthrough-cultivation-skills.md).

- [x] Ba lựa chọn khác nhau, tối thiểu hai hướng gameplay, xác suất theo phẩm
  giai và Fisher–Yates; không đưa lại nâng cấp đã chạm giới hạn.
- [x] Dùng đúng `realm.id`, tránh mở nhầm kỹ năng vì đọc `index` không tồn tại.
- [x] Nâng kỹ năng I–III với thông số thật; fallback tăng stat còn tác dụng.
- [x] Kiếm Khí Hộ Thể: chuỗi năm từ sạch lỗi, tối đa hai khiên.
- [x] Thanh Phong: chậm 40/50/55%, 6/7/8 giây, hồi 25/25/20 giây.
- [x] Kim Đan: hồi theo chuỗi bốn từ và hồi chủ động có giới hạn HP.
- [x] Nguyên Anh: định thân mục tiêu, phát âm; không tiết lộ đáp án AUDIO/CLOZE.
- [x] Vạn Kiếm: giải hazard và phát kiếm, không hoàn thành từ hoặc thêm phím giả.
- [x] Nội tại cảnh giới cho thời gian/đẩy lùi, không tự điền chữ.
- [x] Bạo kích mới thưởng Tu Vi; thiên phú tự trảm từ cũ chỉ giữ tương thích save,
  được ghi nhận hỗ trợ và không được đưa vào pool mới.
- [x] Combo, giảm sát thương, gợi ý, thời gian nghĩa, trọng số từ yếu và thanh
  tẩy ma chướng có điểm thực thi trong engine.
- [x] Lưu kỹ năng, cấp, thiên phú, modifier, khiên; xóa cooldown/hiệu ứng tạm
  khi nạp save; tương thích dữ liệu cũ.
- [x] Trình duyệt hiển thị ba lựa chọn; chọn Kim Đan, tải lại vẫn giữ cấp I;
  nút hồi 8 HP, khóa và hiện progress/hồi chiêu 35 giây.
- [x] HUD giữ tối đa ba kỹ năng theo tiến trình, dùng chung thứ tự trang bị
  với phím 1–2–3; kỹ năng mới thay slot của kỹ năng cũ nhất khi đủ ba slot.

## Kiểm chứng và giới hạn

Kết quả cuối: 37/37 kiểm thử engine/audio, 10/10 kiểm thử API, build thành công.
Web và backend trên Linux báo healthy sau cập nhật. Có backup commit trước
deploy và Docker image trước deploy để khôi phục nếu cần.

- `npm run test:meowcha`: kiểm thử engine và audio mock; không thay thế nghe thực tế.
- `python -m unittest discover -s backend/tests -p test_meowcha_integrity.py -v`:
  mười kiểm thử API với cơ sở dữ liệu tạm.
- `backend/tests/meowcha_qa.html`: fixture chỉ được phục vụ bởi test server,
  có điều khiển trảm 20 từ, đột phá, mô phỏng cảm ứng và trạng thái âm thanh.
  Không được nối fixture này vào ứng dụng production.
- Bằng chứng cục bộ nằm trong `artifacts/meowcha-qa/`, không đưa vào Git.
- Không có máy iOS/Android thật trong phiên này; mô phỏng kích thước/cảm ứng
  không được báo cáo là kiểm thử thiết bị thật.
