# MEOW-CHA 16.0 — giao diện liền cụm và khép phần thiếu

Đối chiếu tất cả brief 01–15 và tài liệu asset, không chỉ phần UI gần nhất.
[Ma trận kế hoạch](meowcha-plan-audit-16.md) lưu phần đã có, thiếu và giới hạn.
Yêu cầu mới lưu thành [brief 16](prompts/meowcha/16-cohesive-ui-size-audit.md).

## Thay đổi

- Sảnh có một bàn điều khiển chung: HP/WPM, kiếm tiếp tục, đổi mode và ấn trùng tu.
  Navigation là một dải gỗ; mobile ba cột/hai hàng. HUD chung một khung, modal có
  header/hành động chung nhịp, nhãn dài xuống dòng, tiêu đề mobile nằm trong biển.
- Đá thường 78 px mobile/104 px PC; boss 104/128 px. Thẻ chữ rộng theo nội dung,
  reward tối đa 246/292 px; giữ nguyên IPA/từ loại/nghĩa đầy đủ và record nghe lại.
- Hồ sơ Tam Pháp lấy kết quả thật, cấp thành thạo cần cả chất lượng và lượng luyện.
  Vô Thương Trảm mới lưu riêng; lịch sử thiếu số đo vẫn ghi Chưa lưu.
- Tổng Đạo chỉ xếp khi đủ ba mode có số đo. Rating v2 =
  `3 × (0.4 × min(ba mode) + 0.6 × mean(ba mode))`, tối đa 300.
  DIRECT vẫn min(WPM/120,1) × accuracy; Ngộ/Thính vẫn 0.7 accuracy + 0.3 first-rate.
- Auth website chặn cả React parent và đường HTML trực tiếp. Xác nhận server/profile
  trước boot, đồng bộ trước chọn save; hết phiên pause/lưu/silence, đăng nhập lại
  cùng chủ giữ run ID, đổi chủ reload. Return-to-game chỉ chấp nhận đường nội bộ
  `/games/meowcha` cho login thường và Discord; không thêm hệ danh tính khách.
- Cloud dùng revision SHA256 của updated_at + snapshot canonical, so dưới row lock.
  Không phụ thuộc giờ client hoặc độ chính xác giây của MySQL. 409 giữ hai bản và
  dừng retry; Ngọc Giản có đối chiếu/khôi phục. Mỗi slot giữ ba bản sao theo tài khoản;
  hết dung lượng local thì dừng trước thay thế. Client cũ thiếu revision không thể
  ghi đè slot đã tồn tại; cần tải lại 16.0. Không cần migration DB.
- MASTER và bốn bus BGM/SFX/VOICE/AMBIENCE, năm thanh âm lượng lưu theo tài khoản,
  duck theo mức người chơi, giảm SFX ở AUDIO. Track Tozan và SFX Kenney CC0 được
  kèm nguồn, license, SHA256 trong `frontend/public/meowcha/audio/`. Track chính
  là koto/shakuhachi/ensemble, không gọi là bản guqin mới thu âm. Wind/feedback nhỏ
  và fallback decode vẫn procedural. Giới hạn 12 sample một lần, voice tuần tự.
- Diagnostics chỉ dùng tên event cố định, tối đa 30, không tên/token/payload/URL.
  `frontend/meowcha-release.json` là nguồn version; prebuild đồng bộ HTML và Release.js.

## Kiểm chứng

- 81/81 kiểm thử Node game/audio/session/UI flows đạt; 22/22 API/DB tạm đạt.
  Có test bốn boss gate, kỹ năng/cooldown/save, bốn loại đá/năm cảnh, 10 từ nhanh
  mỗi mode không đè reward, run idempotent, tài khoản, bản lưu hai thiết bị.
- Next production build/type check đạt; các cảnh báo lint cũ không thuộc game.
  Skill maintenance được cập nhật và quick_validate đạt.
- Trình duyệt fixture: PC 1280, mobile 390/320, ngang 844; ba thẻ talent ngang,
  chọn một thẻ, về sảnh, IPA AUDIO sau trảm có keyboard. Chuyển ba điện đổi người
  top, cột và self thật; Tổng Đạo có rating/điều kiện mới.
- Âm thanh trình duyệt: 15 event buffer tải, 0 sample lỗi, có sample music và RMS
  khác 0. Stress 20 từ qua TypingEngine có 20 word_slash/crack/complete, tổng 21
  voice hoàn tất (gồm lời phát lúc vào), 0 thất bại; đóng context rồi hồi phục vẫn
  running/BGM/sample music. Stress dùng một MP3 QA cho transport và bỏ spawn lock
  chỉ trong fixture; test 10 từ/mode riêng kiểm tra lock thật, không gọi đây là
  20 bản ghi Oxford khác nhau hoặc chứng nhận nghe trên điện thoại thật.
- Session fixture: hết phiên khóa engine; A đăng nhập lại cùng run ID, B khởi tạo
  riêng; Next parent thực tế cổng 8126 có 0 iframe khi chưa đăng nhập, có 16.0 khi
  server nhận tài khoản QA. Đây không phải lần đăng nhập Discord người thật.
- UI cloud: máy chủ +500, máy cục bộ +100 tạo 409; dùng máy chủ, thấy bản sao;
  khôi phục lại bản +100 thành công. Bản sao máy chủ còn giữ để đổi lại.

Ảnh/status cục bộ (ignored, không commit dữ liệu QA): `artifacts/meowcha-qa/16.0/`:
`lobby-desktop-final.png`, `lobby-390-final.png`, `lobby-landscape-final.png`,
`talents-390.png`, `talents-320.png`, `meteor-320-final.png`,
`audio-after-320-final.png`, `halls-audio-390.png`, `audio-20.json`,
`audio-context-recovered.json`, `cloud-recovery.txt`, `next-locked.png`,
`next-authenticated.png`, `session-expired.json`, `session-recovered.json`.

## Giới hạn nghiệm thu còn lại

Không kết luận toàn bộ plan đạt 100% chỉ từ các kiểm tra trên. Chưa kiểm thử
iOS/Android vật lý, OAuth/Turnstile bằng tài khoản người thật hoặc phiên chơi
dài để đo RAM/audio. Score validation là kiểm tra hợp lý, chưa server replay
chống gian lận hoàn chỉnh. Không vượt Cloudflare hay tạo điểm giả production.

## Triển khai

Đang chuẩn bị push/deploy 16.0. Backup trước đã có tại Linux:
`codex/backup-meowcha-before-16-20261026`, Docker tag
`before-meowcha-16-20261026`, thư mục `/home/quang/meowcha-backups/16.0-20261026`.
Baseline: 4.981 từ, 5 legacy leaderboard, 11 runs, 3 battle logs, 1 snapshot;
giữ năm runtime MP3 untracked. Cập nhật phần này sau kiểm tra bản thật.
