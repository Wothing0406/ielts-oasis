# MEOW-CHA TRÀ ĐẠO — gameplay và kiến trúc hiện tại

Phiên bản tài nguyên: `2026.10.24.2`. Nhánh làm việc: `game/meowcha-cultivation`.

## Engine thực thi

`frontend/app/games/meowcha/page.tsx` mở iframe cùng origin tới
`/meowcha/index.html`. Engine Canvas nằm trong `frontend/public/meowcha/js/`;
các component React Meowcha cũ và Unity bridge là phần tương thích, không phải
đường thực thi chính được sửa trong đợt này.

- `main.js`: vòng lặp, vòng đời trận, input vật lý, sinh từ và kết nối các module.
- `core/GameState.js`: trạng thái chuẩn, mã trận, bộ đếm tự gõ/hỗ trợ và đồng hồ.
- `core/SaveSystem.js`: save từng slot/pháp môn, lịch ôn và hàng đợi đồng bộ.
- `core/BattleLayout.js`: đo HUD/bàn phím, vị trí nhân vật và đường va chạm chung.
- `combat/TypingEngine.js`: chọn mục tiêu, nhập ký tự, thiên phú và phản hồi từ.
- `combat/BreakthroughFlow.js`: boss ba từ theo ngữ cảnh, đột phá và chọn thiên phú.
- `ui/UIManager.js`: sảnh, modal, bảng luyện tập, thống kê, chứng đạo PNG.
- `backend/meowcha_routes.py` và `backend/meowcha_integrity.py`: API vocab/save/run.

## Quy tắc input và chỉ số

| Input | Hành vi |
| --- | --- |
| A–Z | Chung một đường xử lý cho bàn phím vật lý và ảo; không ghi lượt gõ khi không có mục tiêu, khi pause hoặc đang đột phá |
| Space | Chọn mục tiêu kế tiếp; không tự nhập chữ, không tính lỗi |
| Backspace | Giải thích rằng chữ đúng đã xuất kiếm; chữ sai không được thêm vào từ nên không cần xóa |
| Tab / Thính Âm | Nghe lại từ hiện tại, không tính lượt gõ |
| Escape | Tạm dừng/tiếp tục qua giao diện |
| Phím hệ thống, tổ hợp Ctrl/Alt/Meta, key-repeat | Bỏ qua trong bộ đếm gõ |

WPM = số phím **người chơi tự gõ đúng** / 5 / số phút hoạt động.
Đồng hồ không tính pause, sảnh, thời gian chọn thiên phú hoặc lúc đang đột phá.
Thời gian thực của một frame chậm vẫn được tính, dù bước vật lý bị giới hạn.
Accuracy = phím đúng / tổng phím thực nhập; giá trị 0% được giữ nguyên.

`humanWords`, `assistedWords`, `assistedKeystrokes` và `assisted` tách phần
trợ giúp của nội tại/thiên phú. Các chữ tự động không làm tăng WPM/accuracy.
Modal nghỉ và kết thúc trận có thống kê; chứng đạo dùng đúng số liệu ván hiện tại,
không suy ra số từ hoặc cảnh giới từ kỷ lục điểm.

## Thiên phú

| Thiên phú | Hiệu lực |
| --- | --- |
| Cố Bản Bồi Nguyên | +25 HP tối đa và hồi đầy |
| Định Thần Thanh Tâm | Hệ số rơi ×0,75, cộng dồn có sàn 0,3 |
| Nhất Kiếm Phân Thần | +35% cơ hội trảm thêm một ma thạch thường, tối đa 100%; nếu chỉ có một ma thạch thì giữ một lượt cho quả tiếp theo |
| Thần Niệm Tỏa Định | +0,5 hệ số Tu Vi, tối đa ×3; gõ sai vẫn bị ghi nhận để học nhưng không gây hình phạt tâm ma |
| Kim Chung Hộ Thể | +2 lần hấp thụ sát thương; lưu chính xác số khiên còn lại |
| Vạn Kiếm Tự Động Trận | Mỗi ba từ người chơi tự hoàn thành có một lượt trảm hỗ trợ; không tạo chuỗi tự kích hoạt, không bỏ qua hộ thuẫn boss |

Các hiệu ứng dùng `state.talents` làm nguồn chuẩn và còn hiệu lực sau load save.

## Pháp môn và cảnh giới

DIRECT luyện phản xạ, CLOZE luyện nhớ chính tả dựa trên nghĩa, AUDIO luyện nghe
chép chính tả. AUDIO che từ chưa gõ, dùng lại cùng bộ xử lý và nút nghe lại.
Boss có ba lớp từ gần nghĩa, mỗi từ có nghĩa theo ngữ cảnh và câu ví dụ; không
khẳng định các từ thay thế được cho nhau trong mọi câu. Nội dung ôn boss xuất hiện
khi chọn thiên phú.

| Cảnh giới | Tu Vi tối thiểu | Từ tối thiểu | Nguồn từ mở thêm |
| --- | ---: | ---: | --- |
| Luyện Khí Kỳ | 0 | 0 | Oxford A1–A2 |
| Trúc Cơ Kỳ | 2.000 | 15 | Oxford B1 |
| Kim Đan Kỳ | 6.000 | 40 | Oxford B2 |
| Nguyên Anh Kỳ | 14.000 | 85 | Oxford B2–C1 |
| Độ Kiếp Kỳ | 30.000 | 150 | Ôn tổng hợp A1–C1 |

Cần vượt boss để đột phá. Các ngưỡng trên cũng giới hạn cảnh giới API có thể nhận.
Nhãn CEFR được giữ từ dữ liệu nguồn; bản ghi SQL cũ không có nhãn thì trả `null`.
Không suy CEFR hay điểm IELTS từ độ dài của từ.

`oxford_5000` dùng dữ liệu Oxford có sẵn và fallback JSON trên thiết bị.
ID cũ `listening_1200` được giữ để tương thích save nhưng bộ tuyển chọn thực tế có
**54 từ**; `reading_academic` có **43 từ**. Chúng không phải chứng nhận điểm IELTS.
Độ dài chỉ là giới hạn ký tự chơi được; CEFR/kinh quyển chọn nguồn từ. Kinh quyển
chuyên biệt không bị kho Oxford thay thế ở các cảnh giới cao.

## Ôn tập từ yếu

`flashcard_srs` dùng lịch ôn cục bộ: `nextReviewAt`, `intervalDays`, `mastery`,
`lastReviewed` và 20 kết quả gần nhất. Đúng không hỗ trợ: 1 ngày, 2 ngày, 4 ngày…
tối đa 90 ngày. Sai: đặt lại mức thành thạo và ôn sau một phút. Từ đến hạn được ưu
tiên; có thể ôn sớm các từ yếu nếu chưa có từ đến hạn. Không thêm từ mẫu giả vào
danh sách cá nhân. Không POST trùng bản ghi vào kho Vocabulary sau mỗi lỗi.

Lịch ôn này nằm trên thiết bị, chưa đồng bộ hai chiều với hệ thống SRS toàn trang.
Không mô tả nó như một hệ thống SRS toàn nền tảng đã hoàn thiện.

## Save và dữ liệu người chơi

Mỗi slot chứa riêng DIRECT/CLOZE/AUDIO, HP, khiên, thiên phú, kinh quyển, runId,
đồng hồ và bộ đếm. Xóa/trùng tu một pháp môn giữ hai pháp môn còn lại. Bản xóa có
timestamp được giữ để save cũ không sống lại. Save v3 cũ vẫn được nhập; save không
có đồng hồ/mã trận được xem là luyện tập hỗ trợ.

LocalStorage được phân vùng theo người dùng. Save tức thời cục bộ; gom các lần
upload trong khoảng 5 giây, lưu cờ bẩn để thử lại sau reload, gửi lại khi online.
Cloud snapshot không ghi đè phiên bản có timestamp mới hơn: trả 409 và giữ bản
cục bộ. Chỉ tài khoản xác thực được dùng cloud save; khách vẫn chơi/lưu trên máy.

API mới:
- `POST /api/meowcha/runs`: đăng ký UUID của trận với tài khoản, pháp môn, kinh quyển.
- `POST /api/meowcha/runs/complete`: kết thúc trận và cộng hồ sơ trong cùng giao dịch.
- `POST /api/meowcha/profile/sync` và `POST /leaderboard`: alias dùng cùng hợp đồng kết thúc trận.
- `GET /api/meowcha/leaderboard`: lọc `game_mode`, `deck_id`, `assisted`; mỗi user một vị trí.
- `GET /api/meowcha/leaderboard?game_mode=LEGACY`: dữ liệu bảng cũ, được đánh dấu chưa xác minh.
- `GET /api/meowcha/save-snapshots`, `POST /save-snapshots/{slot}`: snapshot đầy đủ ba pháp môn.

Kết thúc trận kiểm tra quyền sở hữu, giới hạn bộ đếm, thời gian server, tốc độ gõ,
điểm và ngưỡng cảnh giới. Server tự tính WPM/accuracy; tên/avatar lấy từ tài khoản,
không tìm người chơi bằng tên do client gửi. UUID và ghi có điều kiện trong DB
chặn cộng lặp Tu Vi, số từ, số trận, linh thạch và battle log. Kết quả chưa gửi
được nằm trong hàng đợi bền vững theo tài khoản, thử lại cùng UUID.

**Giới hạn:** đây là bảng luyện tập được kiểm tra tính hợp lý, không phải chống
gian lận tuyệt đối. Client vẫn mô phỏng trận; để xếp hạng có giải thưởng cần server
cấp chuỗi từ/seed, xác minh từng sự kiện và phát lại kết quả phía server.
Trận offline nhập lại hoặc không có phiên server gốc được phân loại hỗ trợ.

## Mỹ thuật và responsive

Xem [kiểm toán asset](meowcha-art-audit.md). Giữ nền/sprite pixel, tái sử dụng
ngọc bội có sẵn, thêm bệ đá có pháp trận do công cụ tạo ảnh sinh ra. Không blur
sprite để giả HD. Giảm decor cạnh tranh, thống nhất trạng thái focus/pressed,
tôn trọng reduced-motion. Bàn phím mặc định bật trên thiết bị cảm ứng và có nút
bật thủ công trên PC. Màn ngang thấp tách bàn phím sang bên phải; canvas/nhân vật/
đường va chạm dùng cùng kích thước đo được.

## Kiểm tra và triển khai

- Engine: `cd frontend; npm run test:meowcha`.
- API riêng biệt: `python -m unittest discover -s backend/tests -p test_meowcha_integrity.py -v`.
- Build/lint: `cd frontend; npm run build`, `npm run lint`.
- Preview dùng SQLite trong RAM: `python -m uvicorn meowcha_preview:app --app-dir backend/tests --host 127.0.0.1 --port 8124`, mở `/preview/meowcha`.
- Kết quả cụ thể và giới hạn xác minh: [task và nghiệm thu](meowcha-hardening-tasks.md).

Migration cộng thêm hai bảng `meowcha_runs`, `meowcha_save_snapshots`, không
sửa/xóa bảng cũ: `python backend/migrations/meowcha_runs_v1.py`. Startup API cũng
tạo hai bảng nếu thiếu. Triển khai backend/migration trước frontend; client cũ
thiếu runId sẽ nhận 422 khi gửi điểm, nhưng các save và leaderboard cũ vẫn được giữ.
Đợt công việc này không chạy migration hay triển khai trên dữ liệu production.

Cache: cùng release `2026.10.24.2` cho iframe và tất cả CSS/JS trong HTML; test
kiểm tra các phiên bản thống nhất. Iframe đọc login cùng origin, không đặt bearer
token hay hồ sơ người dùng vào URL.
