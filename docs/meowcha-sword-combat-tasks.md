# Kiếm bài, Phong Thần, avatar và chiến đấu — 25/10/2026

Yêu cầu trực tiếp: ảnh tham chiếu 2 làm hướng cho CTA và các menu, giữ cute pixel
tu tiên; sửa bảng/ảnh tài khoản, hoạt ảnh kiếm, âm gõ sai/ma thạch rơi; lưu prompt
và kiến thức vào skill dự án. Không coi toàn bộ brief đính kèm là đã triển khai.

## Công việc

- [x] Lưu brief gốc 03–08; bản production/auth gửi hai lần có cùng SHA256,
  lưu một bản và ghi rõ trùng.
- [x] Tạo raster kiếm lệnh bài bằng image_gen, lưu prompt và tài sản trong repo.
- [x] Sảnh: primary hình kiếm, đổi pháp môn mộc bài, reset ấn đỏ, stat giấy ngà.
- [x] Đồng bộ nền gỗ/ngọc, giấy thông tin, pháp môn, thiên phú, bảng và pause.
- [x] Định Tâm: ESC riêng, sáu chỉ số, lưu khi về tiên môn; timer pause không chạy.
- [x] Avatar thật tại sảnh, profile, hàng bảng, bục top; loại bỏ thay ảnh Discord
  bằng pet. Ảnh dự phòng là đạo sĩ người.
- [x] Phong Thần: timeout, thông báo lỗi, thử lại, rỗng có lối mở bảng lưu trữ;
  không trộn legacy vào mode mới, không gộp người chỉ vì trùng tên.
- [x] Projectile sprite là hình chính, sửa hướng bay, muzzle/impact, đuôi pixel ngắn;
  bỏ hình học kiếm/rồng chồng lên sprite và đường sáng dài.
- [x] SFX đúng/sai, chém/va chạm, rơi đá/khiên/hurt riêng, texture nhiễu có envelope;
  word completion có nhịp slash/crack/chime rồi mới voice; từ thiếu MP3 dùng lại TTS
  của website, có cache/timeout và thông báo nếu cả hai đường đều lỗi.
- [x] 55/55 kiểm thử engine/audio, 14/14 kiểm thử API; build Next.js thành công,
  syntax toàn bộ JS và diff check đạt. Cảnh báo build sẵn có ngoài phạm vi game.
- [x] Xem render 1280×720, iframe 390×844, 320×568, 844×390; pause có cuộn dọc
  khi thấp, sảnh nhỏ có thể cuộn đến đủ CTA/stat. Đã kiểm tra mode, bảng rỗng/lưu trữ,
  ảnh Discord ở sảnh/profile/podium/hàng bảng, pause/resume và lưu về sảnh.
- [x] Chuỗi 20 từ qua engine: 20 voice xong, 1 fallback MP3 TTS, 0 lỗi; BGM chạy,
  hàng chờ rỗng, RMS ~0,0125. Adapter TTS trong fixture dùng MP3 thật đã tạo bởi
  website. Gọi riêng /api/tts production trả MP3 6.720 byte, HTTP 200; lượt sau ~978ms.
  Trình duyệt thử có tên voice OS nhưng không phát speechSynthesis; đã ghi nhận
  trường hợp này và thêm thông báo lỗi, không gọi nó là fallback OS đã thành công.
- [x] Skill dự án đã tạo và quick_validate đạt; AGENTS.md dẫn đến bộ nhớ dự án.
- [x] Đẩy game và backup codex/backup-meowcha-sword-20261025; bản code c2fa2c5.
  Linux đã build lại web và nạp backend: cả hai healthy, HTML/CSS/PNG 13.0 trả 200,
  personal-best 401 khi chưa đăng nhập. API DIRECT có 1 thành tích, LEGACY 5;
  CLOZE/AUDIO chưa có trận hoàn tất; không xóa hay giả mode cho điểm cũ.
  Engine public hiển thị nút kiếm mới; Phong Thần tải được thành tích thực.

## Bằng chứng và giới hạn

Ảnh/log nằm cục bộ ở artifacts/meowcha-qa/, không đưa vào Git. Có ảnh sảnh
production, sảnh/menu/pause ở các khung nhỏ, xuất kiếm cảnh 0/4 và avatar bảng.
Kiểm thử hình dùng trình duyệt PC và iframe theo kích thước, chưa có thiết bị
iOS/Android thật. Trang cha public vẫn có xác minh Cloudflare như bản trước;
không vượt xác minh. Hành vi bridge được kiểm tra bằng fixture và bundle thật.
Nội dung test/adapter TTS chỉ được phục vụ bởi preview server riêng.

Art mới do image_gen tạo (host_image), alpha crop/downscale bằng script đóng gói;
không tạo nhân vật/clip mới, tái sử dụng animation có sẵn. Forge doctor còn cảnh
báo Python khác trên PATH và thiếu scipy tùy chọn; không có route video nên không
tuyên bố đã tạo animation video. Audio vật lý vẫn là texture tổng hợp, chưa có bộ
sample thu âm đầy đủ trong brief 06.

## Backlog được lưu từ tài liệu, chưa mặc nhận hoàn thành

- Brief 05: Nhất Ngộ/Nhất Thính và Tổng Đạo đã có ở bản 15.1; profile Tam Pháp
  đầy đủ vẫn là phần mở rộng. Xem [bản ghi 15.1](meowcha-release-15.0.md).
- Brief 06: sample nhạc cụ/foley có nguồn quyền rõ ràng, ambience bus/settings riêng.
- Brief 07: auth gate, vòng đời hết phiên/đổi tài khoản và OAuth return-to-game end-to-end.
- Kiểm tra thiết bị iOS/Android thật và phiên chơi dài trên thiết bị.
