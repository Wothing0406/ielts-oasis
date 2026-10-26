# MEOW-CHA 19.0 — chuyển động nhân vật

## Nguyên nhân và thay đổi

Sảnh dùng một ảnh idle tĩnh; đồng hồ Cat/SpriteAnimator chỉ được cập nhật trong
vật lý trận. Các sheet cũ phần lớn là biến thể dịch chuyển rất nhỏ. Gõ liên tục
còn kéo dài deadline xuất kiếm trước khi biên độ cũ bắt đầu đổi, tạo cảm giác
nhân vật không đánh. Cấu hình idle/ultimate có số frame không khớp ảnh thật.

- Đồng hồ trình bày chạy cả sảnh và trận, một lần mỗi frame. Pause khóa nhân vật
  trận; thua phát DEFEATED một lần rồi giữ khung cuối.
- ActorMotion dùng hình gốc, tách đầu bằng clip canvas để nghiêng/thở/chớp mắt;
  không cắt ngang hào quang hoặc kiếm bay. Giữ opaque bounds, vị trí bàn chân và
  chiều cao nhìn thấy của năm cảnh giới. Realm 0 vốn nhắm mắt nên không vẽ chớp.
- Sảnh có canvas trong stage hiện có; ảnh poster chỉ ẩn sau khi vẽ thành công.
  Companion dùng hình gốc với nhịp bồng bềnh/nhẹ nghiêng. Không thay avatar user.
- Xuất kiếm dùng thời gian clip riêng, không dùng deadline bị mỗi phím kéo dài.
  Một yêu cầu lặp được gộp, không tích lũy hàng đợi vô hạn. HURT/ULTIMATE có thể
  bắt đầu lại ngay. Số frame lấy theo sheet đã tải; metadata năm cảnh khớp ảnh.
- Idle giảm chuyển động theo cài đặt hệ thống. Không đổi kích thước chiến trường,
  scoring, learning metrics, cloud save, auth hoặc âm thanh trong đợt này.

## Nguồn chuyển động

Đây là hoạt ảnh cutout bằng mã trên artwork sẵn có, kết hợp sheet hành động cũ;
không phải clip AI/video mới hoặc bộ tư thế tay chân vẽ mới. Không sửa các PNG.
Đã đọc video2dsprite và kiểm tra khả năng tạo video: resolver trả `no-route`
(thiếu API/CLI video). Doctor chạy UTF-8: 0 FAIL, 1 WARN, 6 MISSING; WARN nguyên
văn là `python.path — other python.exe on PATH: ~/AppData/Local/Microsoft/WindowsApps/python.exe`.
Các MISSING là khả năng tùy chọn chưa cài/cấu hình, không phải kiểm thử game lỗi.
Log ở `artifacts/meowcha-qa/19.0/doctor-utf8.json`. Không nhận là đã tạo video.

## Kiểm chứng

- [x] 96/96 Node engine/audio/UI/session, gồm đồng hồ lobby/pause/resume, năm
  cảnh giới, frame thực tế và gõ nhanh không ghim frame; 22/22 API đạt.
- [x] Production build/typecheck local đạt; có cảnh báo lint cũ.
- [x] Browser fixture SQLite riêng, user QA7001: cả năm cảnh giới đổi frame và
  thời gian; mỗi lượt gõ thật qua TypingEngine đủ 19 phím, hoàn thành một từ.
- [x] Pause giữ time 447.7495, frame1; sau resume time448.1177, frame4, paused=false.
- [x] PC1280 và cảm ứng mô phỏng 320×568: nhân vật/companion đúng vùng, không
  đổi bố cục hoặc che bàn phím. Kim Đan giữ hào quang/kiếm bay sau tách head.
- [x] GIF bản cuối gồm 32 ảnh chụp browser, 31/31 cặp khác nhau, dài 8.144s.
- [x] Push/backup và kiểm chứng triển khai Linux.

Minh chứng ignored ở `artifacts/meowcha-qa/19.0/`: `lobby-motion.gif`,
`lobby-live-final.png`, `lobby-mobile-final.png`, `battle-mobile-final.png`,
`five-realm-battle-final.json`, `pause-resume-final.json`. Các capture thử trước
`five-realm-battle.json` bị các lượt fixture async chồng nhau, không dùng làm kết
luận; bản `final` đợi xong từng lượt. Không đưa QA controls lên public runtime.

Đợt này sửa nhân vật đứng cứng. Chưa chứng nhận điện thoại vật lý, hiệu năng chơi
lâu, OAuth production sau đăng nhập hoặc hoàn tất toàn bộ roadmap trước đó.
Động tác độc lập của tay/áo/tóc cần bộ animation nguồn mới; không báo đã làm.

## Triển khai

Code `99946cb` đã push lên `game/meowcha-cultivation`, Linux fast-forward đúng
nhánh, Docker build web đạt và thay container web. Web/backend running healthy;
backend không đổi runtime. Baseline trước sửa `5cff8c8`; GitHub/Linux giữ
`codex/backup-meowcha-before-19-20261026`, Docker web/backend giữ tag
`before-meowcha-19-20261026`. Backup hoàn tất gồm code và báo cáo nằm tại
`codex/backup-meowcha-complete-19-20261026`.

HTTP nội bộ: trang cha, HTML, ActorMotion, SpriteAnimator, CatCultivator, Release,
main và CSS đều 200; SHA256 bảy static file khớp checkout. Mọi asset URL trong
HTML là19.0. Browser public xác nhận script ActorMotion19.0 và lobbyActorCanvas;
trang cha/engine vẫn hiển thị cổng đăng nhập. Không giả đã chơi OAuth production.

Đã so nguyên file counts trước/sau: vocab4981, legacy5, runs12, battle logs3,
snapshots2 đều giữ nguyên. Năm runtime MP3 cũng khớp SHA256 với backup. Log build,
counts và MP3 an toàn ở `/home/quang/meowcha-backups/19.0-20261026`.
