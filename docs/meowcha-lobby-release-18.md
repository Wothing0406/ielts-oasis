# MEOW-CHA 18.0 — lobby và lựa chọn bản lưu

## Phạm vi

Thực hiện yêu cầu lobby trực tiếp ngày 26/10. Brief redesign Matcha IELTS đầy đủ
đã lưu nguyên văn làm tham chiếu riêng; các trang ngoài game chưa được redesign
trong đợt này. Giữ auth website, run ID, tính điểm, âm, battle layout và SRS.

## Nghiệm thu

- [x] Gỡ DOM trang trí/panel cũ; stats thật sự nằm ngoài action group.
- [x] Hero, tên/cảnh giới và companion nhìn rõ; sprite căn theo opaque bounds
  của cả năm cảnh, không để canvas PNG quyết định kích thước nhìn thấy.
- [x] Kiếm PC 420px thay 570px (~26% nhỏ hơn), mobile có margin.
- [x] Mộc bài đổi mode riêng, ấn Trùng Tu nhỏ và xác nhận trước reset.
- [x] Navbar jade 48px PC; mobile chia hai hàng, đủ sáu tiện ích/avatar, không
  browser select. Nhãn âm ngắn, aria-label vẫn nói rõ bật/tắt.
- [x] Giảm lớp phủ và bỏ blur lobby, giữ nền và bàn trà.
- [x] Chọn save qua nút Đối chiếu dễ thấy; không còn toast dài ở trên nav.
- [x] So sánh Tu Vi từng mode và thời gian; chọn máy/cloud, giữ bản còn lại;
  revision thay đổi thì yêu cầu đối chiếu lại, storage đầy thì dừng trước khi ghi.
- [x] 93 kiểm thử Node, 22 API, CSS parse và production build đạt.
- [x] Git backup/push, triển khai Linux và đối chiếu production.

## Bản lưu khác nghĩa là gì

Local đang có thay đổi chưa tải lên và revision máy chủ đã khác revision được
biết. Đây không phải lỗi tải engine hoặc lý do tự reset tiến trình. Snapshot trong
ảnh người dùng không đủ để kết luận copy nào mới/đúng hơn. Giữ chặn ghi tự động;
không chọn theo timestamp hoặc theo điểm cao hơn.

Lobby có chip Có hai bản lưu và nút Đối chiếu tới Ngọc Giản. Bảng so sánh hiển
thị ba pháp môn có tiến trình và thời gian lưu; lựa chọn áp dụng toàn bộ slot,
không trộn điểm của các mode hoặc hai lần chơi. Chọn cloud archive local trước;
chọn local archive cloud trước và POST expected_revision đúng bản đã xem.
Máy chủ thay đổi sau lúc so sánh hoặc ngay lúc POST: giữ conflict, không retry
ghi đè. Bản sao an toàn tối đa ba bản mỗi slot/tài khoản theo cơ chế hiện có.

## Kiểm chứng thực tế

Browser fixture riêng SQLite, tài khoản QA 7001: PC 1280, mobile 320/390, ngang
844. Có progress 2317 Tu Vi, HP37/50, 8 WPM; fresh sau Trùng Tu đổi về kiếm
Vào Trận, 50/50, 0 WPM. Đổi Pháp Môn mở setup, hủy reset giữ nguyên progress,
Tiếp Tục vào battle đúng score/HP. Đây là viewport QA, chưa điện thoại vật lý.

Cloud fixture: local2417/cloud2817 → chọn local2417 → phục hồi bản2817 đã lưu;
tạo xung đột tiếp local2917/cloud3317 → chọn cloud3317; chip conflict biến mất.
Không dùng tài khoản hoặc điểm giả trên production. Tests còn bao phủ lỗi 409,
revision thay đổi sau so sánh và local storage đầy.

Ảnh/status ignored ở `artifacts/meowcha-qa/18.0/`: `lobby-desktop-final.png`,
`lobby-320-final.png`, `lobby-390-final.png`, `lobby-landscape-final.png`,
`lobby-fresh-320.png`, `save-compare.png`, `save-compare-mobile.png`,
`save-local-selected.png`. Bản dựng có cảnh báo lint cũ; không đổi Next app code.

## Mức sẵn sàng

Các tiêu chí của đợt lobby được kiểm tra theo danh sách trên. Không kết luận mọi
brief/roadmap đã hoàn tất. Cần QA iOS/Android thật, thử loa/vibration, chơi lâu
đo RAM/audio, OAuth thực với tài khoản chủ và server replay chống gian lận.
Website redesign trong attachment vẫn là hạng mục riêng chưa triển khai.

## Triển khai

Đã push nhánh game: code `f52e425`, chỉnh nhãn mobile `c721ce3`. Linux đã
fast-forward đúng nhánh, build Docker web đạt, thay container web. Backend không
đổi code; web/backend đều running healthy. CSS nhãn mới đã được đối chiếu SHA256
qua HTTP vì public được mount vào web, không cần build lại React.

Backup trước: GitHub/Linux `codex/backup-meowcha-before-18-20261026` tại
`f70e1fc`; Docker web/backend giữ tag `before-meowcha-18-20261026`. Backup hoàn
tất: `codex/backup-meowcha-complete-18-20261026` gồm code và báo cáo.
Log nằm ở `/home/quang/meowcha-backups/18.0-20261026`.

Trước/sau đợt 18 đều: 4.981 vocab, 5 legacy, 12 runs, 3 battle logs, 2 snapshots.
Đã so sánh nguyên file counts trước/sau và năm runtime MP3 với backup, đều khớp.
Đây là baseline mới khi bắt đầu đợt 18, không lấy số đếm cũ của đợt 17.
Trang cha, HTML, Release, SaveSystem, UIManager, CSS trả 200; mọi script/CSS trong
HTML là 18.0; panel DOM cũ không còn trong HTML được phục vụ.

Trang public vẫn dùng cổng đăng nhập website. Phần game sau auth được kiểm tra
trong fixture riêng; không giả nhận đã chơi bằng tài khoản OAuth thật ở production.
