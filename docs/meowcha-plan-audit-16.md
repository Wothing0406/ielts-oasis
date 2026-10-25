# Đối chiếu toàn bộ kế hoạch MEOW-CHA — 26/10/2026

Đã đọc các brief 01–15, tài liệu asset 03 và checklist hardening, art, kiếm bài,
14.1, UI migration, release 15.1. Không dùng trạng thái hoàn tất của một đợt để
kết luận tất cả yêu cầu trong các brief đã xong. Yêu cầu trực tiếp mới: gom giao
diện thành cụm có liên kết, thu nhỏ thiên thạch/thẻ nổ, xử lý phần bỏ sót và deploy.

| Brief | Đã có ở 15.1 | Thiếu cần xử lý hoặc giới hạn |
|---|---|---|
| 01 | Giấy/icon raster, audio phục hồi, keyboard PC ẩn | Tỉ lệ thẻ quá lớn, UI rời |
| 02 | Ba lựa chọn, bốn hướng, kỹ năng I–III, save, hotkey | Hồi quy sau thay bố cục |
| 03 | Pause thật, sáu số đo, về sảnh có lưu | Cụm hành động và chiến tích thiếu liên kết |
| 04 | Kiếm/mộc bài/ấn, bảng và avatar thật | Quá nhiều asset đứng riêng, khoảng cách không thống nhất |
| 05 | Ba điện, metric, Tổng Đạo chuẩn hóa | Hồ sơ Tam Pháp; Tổng Đạo chưa yêu cầu đủ ba mode |
| 06 | Queue/fallback/ducking, SFX riêng, BGM ổn định | Bốn bus, âm lượng riêng, sample vật lý/nhạc có nguồn |
| 07 | Run xác thực/idempotent, cache theo tài khoản, save conflict | Gate/boot, hết phiên/đổi tài khoản, return-to-game, telemetry |
| 08 | Attack/projectile/beam/hit thật theo năm cảnh giới | Sample physical SFX còn tổng hợp |
| 09 | Input/talents/điểm/save/SRS/CEFR/lore đã có kiểm thử | Không coi kiểm tra hợp lý là chống cheat bằng server replay |
| 10 | Keyboard chung engine, nhiều viewport | Chưa có iOS/Android vật lý |
| 11–12 | Raster chính, functional SVG, kit chung | Cần kiểm tra liên kết bố cục thay vì chỉ cùng màu/asset |
| 13 | Các màn đã dùng kit | Nghiệm thu mỹ thuật cần mở lại vì người dùng thấy rời rạc |
| 14 | Ba thẻ ngang, IPA sau AUDIO, spawn lock/rơi thẳng | Tỉ lệ đá/thẻ quá lớn, thiếu khoảng trống chiến trường |
| 15 | Tab thật/top/cột/self/màu theo mode | Hồi quy và hoàn thiện nhóm bảng |

## Việc đợt 16

- [x] Cụm sảnh: một bàn điều khiển chung, stat gắn hành động, thứ cấp/reset gọn.
- [x] Header/body/footer modal cùng nhịp, không mọi nút thành một biển lớn.
- [x] HUD trận gắn thành một thanh; đàn gõ/kỹ năng/record dùng một đế.
- [x] Đá và giấy hiện từ gọn theo viewport; reward nhỏ, giữ đầy đủ IPA và record.
- [x] Hồ sơ Tam Pháp từ kết quả tài khoản; Tổng Đạo đủ ba mode mới xếp hạng.
- [x] Auth chính website trước engine; hồi phục/hết phiên/đổi chủ không lẫn save.
- [x] Return-to-game nội bộ cho hai callback; đã kiểm thử helper và Next gate.
- [x] Bốn bus/âm lượng lưu bền, sample có giấy phép, ambience, không tắt voice.
- [x] Lỗi vận hành an toàn, một nguồn version phát hành.
- [x] Cloud CAS, báo xung đột, đối chiếu/khôi phục có bản sao; chống lệch giờ và
  hai lần lưu cùng một giây MySQL. Không thay schema hay xóa dữ liệu cũ.
- [ ] Kiểm thử logic/API/build, ảnh PC/mobile, backup, deploy, kiểm tra bản thật.

Không thể chứng minh iOS/Android vật lý hoặc OAuth người dùng thật chỉ bằng
fixture. Phân biệt kiểm thử tự động, quan sát trình duyệt và kiểm thử thiết bị.

Kết quả và các giới hạn nghiệm thu cụ thể: [release 16.0](meowcha-release-16.0.md).
