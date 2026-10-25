# MEOW-CHA 15.0 / 15.1 — hệ UI, Phong Thần điện và nhịp học

Phạm vi: yêu cầu trực tiếp tiếp tục kế hoạch cũ, triển khai brief 13/14 và yêu cầu
bốn điện ở brief 15. Tài liệu gốc trong `docs/prompts/meowcha/`; hai attachment
brief 13 trùng nội dung nên chỉ lưu một bản.

## Thay đổi

- UI kit chung thay ba lớp CSS chồng; kiếm / mộc bài / chip / ấn son có vai trò
  khác nhau. Giấy ngà, ngọc và chữ Việt dùng token chung. Stat Định Tâm thu gọn.
- Bổ sung bảng kết trận trước đây thiếu markup; không nộp hai lần từ main và UI.
  Giữ chốt kết trận sau purge để không lặp âm thua/tắt nhạc mỗi frame.
  Chứng Đạo xuất giấy ngà cùng asset và số đo đúng ván kỷ lục.
- Mobile giữ ba thẻ nâng cấp ngang, mô tả đầy đủ trong Chi tiết; chọn một lần.
  Nền dọc được tạo riêng, giữ chùa và bệ thay vì phóng/cắt nền ngang.
- Bỏ dropdown Pháp môn ở Phong Thần. Mỗi điện có top/cột/metric/self/màu riêng;
  self ngoài top 25 vẫn có hạng. Dữ liệu cũ thiếu nguồn nằm ở Lưu Trữ.
- Đo/lưu combo, số từ xử lý/đạt lần đầu, hint, nghe lại trước đáp án. Ván cũ
  hiển thị thiếu số đo thật. Công thức Đạo Hạnh và định nghĩa trong bộ nhớ dự án.
- Thẻ thưởng chặn sinh từ/boss cho đủ nhịp đọc 2 / 2.8 / 3.6s. IPA, loại từ,
  nghĩa hiện sau đáp án AUDIO; record từ vừa học và nút nghe lại giữ độc lập.
- Đá vào từ trên, vx=0, cố định x, rock xoay theo hướng asset, thẻ chữ giữ thẳng.
  Giữ thời gian gõ trên điện thoại thấp và không mất cổng đột phá khi tải lại save.
- Sửa profile chật chữ, canh tiêu đề/nút, giữ avatar tài khoản, bảo toàn accuracy 0.
  Nút kỹ năng gọi App thật, Định Thân hoạt động khi chạm. Mode mới trống không
  che một hành trình còn lưu; số đo/kỹ năng/HP phục hồi qua reload.
  HUD cập nhật 10Hz; ngừng cập nhật menu sảnh theo mỗi frame trong trận.

## Kiểm chứng đã chạy

- Node: 70 kiểm thử engine/audio/flow qua. Có 10 từ nhanh × 3 mode qua App,
  TypingEngine và FloatingText thật; không sinh đá trong reward; IPA/type giữ đủ.
- Bốn cổng realm: boss ba lớp → ba offer → nhận đúng một → save/load; bốn loại
  ma thạch × năm cảnh giới: di chuyển, freeze, sát thương, va chạm một lần.
- API: 17 kiểm thử SQLite riêng qua, có xếp hạng mode khác nhau, self #29 ngoài
  top 3, chia deck/hỗ trợ, số đo mới/thiếu số đo và idempotency.
- `npm run build` thành công; còn warning có sẵn ở trang/component khác.
- Browser fixture: top DIRECT Ngọc Kiếm QA, CLOZE Hổ Phách QA, AUDIO Lam Âm QA;
  self QA đổi đủ cột/số đo/hạng. Đây là dữ liệu thử SQLite, không sinh điểm production.
- Browser đi đủ boss Trúc Cơ, Kim Đan, Nguyên Anh, Độ Kiếp; ba lựa chọn ngang và
  nút 44px được đo ở 320/360/375/390/430; tablet 768 và PC 1280 có ba cột.
  320 có cuộn ngang 23px trong lưới; không tràn cả trang.

- Browser phát 20/20 giọng, 0 lỗi, BGM chạy và RMS khác 0; tắt/bật công tắc
  settings đã thử thật. Fixture MP3 dùng mẫu QA để kiểm tra vận chuyển/điều phối,
  không chứng minh 20 file khác nhau là giọng Oxford đúng nội dung.
- 320×568: IPA/loại từ/nghĩa và nghe lại sau AUDIO, keyboard mở; pause dùng
  hàng stat gọn để không bẻ WPM thành từng chữ. 844×390: canvas trái/keyboard phải.

## Bằng chứng cục bộ

`artifacts/meowcha-qa/15.0/` chứa before/after và dữ liệu đo viewport.
Before dùng JS/CSS/index thật từ `0bfdb09118c613adc1e494167d013c133e613101`,
qua fixture có overlay asset không đổi; không giả lập ảnh trước bằng CSS.
Ảnh/log/profile QA bị ignore, không commit.

## Art

- Ấn son: `assets/ui/crimson-seal-v1.png`, 900×361, alpha, 298KB.
- Nền dọc: `sprites/maps/bg_study_sanctuary_portrait.webp`, 862×1824, 310KB.
- Route `host_image`: built-in image_gen, có tham chiếu nền gốc cho bản dọc.
  Prompt nguyên văn: `crimson-seal-art.txt`, `portrait-scene-art.txt`.
  Tái dùng kiếm/mộc bài/khung/ngọc/nhân vật/beam cũ; không tạo clip nhân vật mới.

## Triển khai

- [x] Commit/push nhánh game và backup trước/sau.
- [x] Linux backup image, cập nhật web/backend; giữ runtime MP3, đối chiếu số DB.
- [x] Kiểm tra tài sản/API production và ảnh trình duyệt.

Ngày 26/10/2026: code chính `9aed09d`; bản chốt `aa657d6` sửa lời thoại canvas
ngắt theo từ và đồng bộ toàn bộ HTML/CSS/JS/iframe/JSON lên `15.1`. Chạy lại
70/70 kiểm thử sau bản chốt; build web Linux thành công. Web/backend healthy.

Git backup trước: `codex/backup-meowcha-before-15-20261026` tại `0bfdb09`.
Git backup hoàn tất: `codex/backup-meowcha-complete-15-20261026`.
Linux giữ hai Docker image tag `before-meowcha-15-20261026` và log build tại
`/home/quang/meowcha-backups/15.0-20261026/`. Không thay schema hay xóa dữ liệu.

Đối chiếu trước/sau: vocabulary 4.981, legacy leaderboard 5, runs 10, battle logs 3,
save snapshots 1. Giữ đủ bốn runtime MP3 untracked trên máy chủ; không đưa vào Git.
HTML, CSS, JS và hai asset mới trả 200; bundle trang cha chứa iframe `15.1`.
Trình duyệt mở `/games/meowcha` public bình thường, tải đúng iframe 15.1 và sảnh;
ảnh `production-parent-lobby.png` ghi giao diện trong website chính.

API nội bộ trả 200: Tổng Đạo 1 người, DIRECT 1, CLOZE/AUDIO 0 và Lưu Trữ 5.
Trình duyệt public xác nhận đúng số này, chuyển tab đổi cột/bục/mô tả; không có
console error khi mở và chuyển bảng. Client CLI bị Cloudflare 403, nên chỉ dùng
trình duyệt bình thường để kiểm chứng public, không vượt xác minh.

Ảnh production: `production-overall.png`, `production-direct.png`,
`production-cloze.png`, `production-audio.png`, `production-legacy.png` trong
thư mục bằng chứng trên. `game-over-once.json` ghi đúng một defeat/hurt sau khi
để vòng lặp chạy tiếp. Định Thân chạm thật gọi engine và bắt đầu hồi chiêu,
không sinh thêm phím đúng giả.

Kiểm thử điện thoại là viewport/cảm ứng mô phỏng trong trình duyệt PC, chưa thiết
bị iOS/Android thật. Audio vẫn dùng Web Audio/MP3/TTS/OS dự phòng có sẵn; chưa
phải bộ sample nhạc cụ thu âm mới. Auth gate toàn vòng đời của brief 07 còn riêng.
