# MEOW-CHA 17 — chiến trường dễ nhìn, nhịp nhập môn và phản hồi

Yêu cầu trực tiếp: PC vẫn có bàn phím ảo; nhân vật quá cao và to sau nâng cấp;
thiếu ranh giới phòng thủ, ít không gian rơi; đầu trận nhanh; âm/rung/choáng/mây
không rõ. Cần sửa cả PC và mobile, không che chữ.

- [x] Khóa bàn phím PC tại CSS và API show/hide; kiểm tra cả force-open cũ.
- [x] Một geometry chung: trời rơi / kết giới / khu nhân vật và điều khiển.
- [x] Nhân vật cùng chiều cao nhìn thấy ở năm cảnh; VFX nằm trong khu riêng.
- [x] PC nhân vật giữa, tiến độ/từ hiện tại bên trái, kỹ năng/ôn từ bên phải.
- [x] Mobile gộp tiến độ/kỹ năng/record với bàn phím thành một cụm; chữ dài cuộn
  trong khung, không đẩy nhân vật lên. Ngang thấp giữ bàn phím bên phải.
- [x] Rào ngọc có trụ/lan can/sen/mây từ ảnh tạo thật, alpha, kích thước game rõ.
- [x] Một ngân sách giây theo từ/mode/cảnh, không nhân tốc độ chồng; đếm giây rõ.
- [x] Âm đúng/sai/nổ/mây/choáng riêng; rung hình có thời gian suy giảm rõ; rung máy tùy hỗ trợ.
- [x] Mây ở sau thẻ chữ, choáng không bịa typo/phím; pause đóng băng mọi thời gian.
- [x] Test logic, browser PC/mobile/landscape/năm cảnh, build, backup/push/deploy.

Không gọi mô phỏng viewport là kiểm thử điện thoại vật lý. PC dùng rung hình,
vibration thiết bị chỉ có khi trình duyệt/phần cứng hỗ trợ.

## Bố cục đã chốt sau phản hồi

PC: nhân vật giữa; trái là từ/tiến độ, phải là chiến tích/kỹ năng/ôn từ. Mobile:
tiến độ một hàng cao 34px, kỹ năng và nút ÔN ở hàng tiện ích bàn phím. Bỏ nghĩa
và bảng thống kê bị lặp trong footer; nghĩa đầy đủ vẫn trên ma thạch và thẻ học.
Mở ÔN phủ vùng phím và tạm dừng ván, không phủ nhân vật hoặc trời rơi; đóng trả
đúng trạng thái pause trước đó. Mobile ngang dùng bàn phím bên phải và nhân vật
ở giữa vùng chiến trường bên trái.

Rào raster được vẽ trước nhân vật trong canvas, chân rào khớp mặt nền nhân vật;
va chạm dùng geometry chung. Rào không còn là một đường kẻ nằm cách nhân vật.
Nguồn là built-in image_gen, PNG RGBA 2172×724, alpha 0–255, sao chép nguyên bản.
Prompt/provenance có trong docs/prompts/meowcha. Không gọi đây là sprite vẽ tay
hoặc artwork có logical pixel grid đã lượng tử hóa.

Thời gian gõ là một ngân sách giây: JADE mới 24s DIRECT, AUDIO thêm 4s, CLOZE
thêm 3s; từ dài thêm tối đa 10s. Mốc cơ sở theo cảnh là 18/17/15/13.5/12s,
bonus nhập môn 6s giảm dần trong 12 từ đầu. Entry 1.8s riêng, không ăn thời gian
gõ. Không cộng chồng multiplier cảnh/điểm/combo; đổi viewport giữ thời gian còn
lại. Thanh giây nằm trên thẻ từ; đóng băng/choáng/pause không làm mất thời gian oan.

Âm thanh: tap gỗ thật, sai có cao độ khác, kiếm/nổ/va chạm/thuẫn, cloud_enter /
cloud_clear, stun / stun_end riêng. Sample ngắn được cân peak có giới hạn 3×,
không ghi đè volume đã lưu. Test âm trong Tiên Nhạc; mute vẫn chặn toàn bộ.
Rung hình giảm trong khoảng 0.2–0.4s, HUD giữ yên; tôn trọng reduced-motion.
Choáng không tự tăng typo hoặc tốc độ. Mây vẽ trước chữ và giấy, không che đáp án.

## Kiểm chứng

89/89 kiểm thử Node và 22/22 API đạt; Next build/typecheck đạt (cảnh báo lint cũ).
Đã đo Web Audio từng cue khi nhạc/ambience/voice được tạm giảm rồi phục hồi:
tap 0.03047 RMS, sai 0.03182, nổ 0.08623, mây 0.02538, choáng 0.02531,
hồi tỉnh 0.01803. 20 event buffer tải, 0 sample lỗi; nhạc sample tiếp tục.
Đây là tín hiệu trình duyệt, không phải đánh giá loa/rung của điện thoại thật.

Browser: PC 1280 qua đủ năm cảnh, force-open vẫn hidden; mobile 320 và 390,
ngang 844. Gõ J bằng nút thật được 1/4, kỹ năng Định Thân chạy và có cooldown
30s; ÔN mở đủ IPA, tạm dừng và đóng khôi phục đúng trạng thái; thu/mở phím được.
Chuỗi ba phím sai → cloud_enter → va chạm → stun/meteor_impact/player_hurt,
sau đó stun_end đã được ghi nhận qua game thật. Không cộng điểm production.

Đã sửa lỗi xoay ngang: rule cũ ép canvas 52vw làm geometry bị thu hai lần.
Canvas nay giữ toàn viewport, chỉ field dùng 52%; rào dùng vòng vẽ có giới hạn
và geometry không âm kể cả viewport tạm bằng 0. Thêm test hồi quy cho trường
hợp header tràn / viewport tạm bằng 0. Các nút ÔN/kỹ năng nằm trên lớp phím
và hàng tiện ích vẫn hiện khi xoay ngang, không chặn hàng chữ cái.

Ảnh/status ignored: `artifacts/meowcha-qa/17.0/`: `pc-final-realm-0.png` đến
`pc-final-realm-4.png`, `mobile-320-final.png`, `mobile-390-final.png`,
`mobile-landscape-final.png`, `mobile-review.png`, `sfx-output.json`,
`combat-events.json`, `mobile-touch-progress.json`, `review-paused.json`.

Doctor art: UTF-8 đã đạt. Cảnh báo môi trường còn: `python.path` —
`other python.exe on PATH: ~/AppData/Local/Microsoft/WindowsApps/python.exe`.
Dùng đường Python311 cụ thể. Các API key tùy chọn/CLI Grok không có; route
host_image vẫn hoạt động và đã tạo ảnh thật. Log ignored ở artifacts/meowcha-qa/17.0.

## Phát hành 17.0 — 26/10/2026

Code `bd11b9c` đã push `game/meowcha-cultivation`; Linux fast-forward đúng nhánh,
Docker web build đạt và thay container thành công. Web và backend running healthy.
Backend ứng dụng không đổi, không sửa schema hay reset dữ liệu. Sau triển khai
vẫn 4.981 vocab, 5 legacy leaderboard, 11 runs, 3 logs, 1 snapshot như trước;
đủ năm runtime MP3 untracked được giữ (thư mục có tổng 95 MP3).

GitHub có `codex/backup-meowcha-before-17-20261026` tại `2e50702`; backup hoàn tất
`codex/backup-meowcha-complete-17-20261026` gồm code và báo cáo này. Docker image
trước thay đổi giữ tag `before-meowcha-17-20261026` cho web/backend. Log build,
HTTP và trạng thái dịch vụ ở `/home/quang/meowcha-backups/17.0-20261026`.

HTTP nội bộ trang cha, engine HTML, CSS, BattleLayout, CombatFeedback, Release và
PNG rào đều 200; SHA256 PNG khớp provenance. Mọi script/CSS của HTML đều version
17.0. Trình duyệt public cũng nhận script 17.0, trang cha và đường engine trực
tiếp giữ cổng đăng nhập như thiết kế. Không vượt Cloudflare, không giả danh người
chơi để tạo score hoặc thử OAuth thật. Ảnh production gate lưu riêng, không gọi
ảnh game trong fixture là ảnh đã đăng nhập production.

Giới hạn còn: cần nghe và thử vibration trên điện thoại iOS/Android vật lý;
kiểm thử viewport và RMS chưa thay thế được phần này. Các giới hạn nghiệm thu
dài hạn của release 16 vẫn áp dụng, gồm chơi dài đo RAM/audio và server replay
chống gian lận hoàn chỉnh. Không kết luận toàn bộ roadmap đạt 100%.
