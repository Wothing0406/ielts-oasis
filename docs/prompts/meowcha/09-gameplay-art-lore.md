# MEOW-CHA TRẢ ĐẠO — GAMEPLAY, ART QUALITY & XIANXIA LORE REFACTOR

Repository: Wothing0406/ielts-oasis
Branch: game/meowcha-cultivation
Snapshot tham chiếu: 0b4b65fd6355d20067beea9bb144a2859c0b18b1

## VAI TRÒ

Bạn là Senior Game Developer, Gameplay Systems Designer, Senior UI Artist, Technical Artist và Narrative Designer chuyên game tu tiên 2D.

Hãy kiểm tra và nâng cấp MEOW-CHA TRẢ ĐẠO thành một game luyện từ vựng tiếng Anh có gameplay đáng tin cậy, mỹ thuật thống nhất, hệ thống tu luyện hợp lý và ngôn ngữ tiên hiệp tự nhiên.

Ưu tiên sửa lỗi thực tế hơn việc thêm nhiều hiệu ứng.

## I. XÁC ĐỊNH ĐÚNG ENGINE

Trang /games/meowcha hiện sử dụng iframe tải /meowcha/index.html.

Phải ưu tiên kiểm tra:
- frontend/public/meowcha/index.html
- frontend/public/meowcha/js/main.js
- frontend/public/meowcha/js/combat/TypingEngine.js
- frontend/public/meowcha/js/combat/BreakthroughFlow.js
- frontend/public/meowcha/js/core/GameState.js
- frontend/public/meowcha/js/core/SaveSystem.js
- frontend/public/meowcha/js/ui/UIManager.js
- frontend/public/meowcha/js/ui/VirtualKeyboard.js
- frontend/public/meowcha/js/ui/XianxiaIcons.js
- frontend/public/meowcha/js/data/RealmsData.js
- frontend/public/meowcha/js/data/TalentsData.js
- frontend/public/meowcha/css/
- backend/meowcha_routes.py

Không chỉ sửa component React không nằm trên đường thực thi của game.

## II. P0 — SỬA LỖI GAMEPLAY

### 1. Bàn phím ảo

Kiểm tra VirtualKeyboard.js và TypingEngine.processKey().

Hiện bàn phím gửi Space và Backspace vào processKey như ký tự thông thường.

Yêu cầu:
- Phân biệt phím chữ với phím chức năng.
- Space phải có chức năng được định nghĩa rõ ràng, không bị tính nhầm thành chữ sai.
- Backspace phải hoạt động theo quy tắc gameplay hoặc được vô hiệu hóa có giải thích nếu game không cho sửa ký tự.
- Không cho một lần chạm tạo hai lần nhập.
- Tab/nghe lại không làm tăng số lần gõ sai.
- Chỉ tính totalKeystrokes cho ký tự nhập thực sự.
- Giữ bàn phím vật lý và bàn phím ảo dùng chung logic.
- Kiểm thử khi không có ma thạch và khi trận đấu bị tạm dừng.

### 2. Thiên phú chưa có hiệu lực

Audit toàn bộ TALENT_POOL.

Đặc biệt xác minh:
- critChance.
- autoKill.
- typoImmune.
- slowFactor.
- scoreMultiplier.
- shieldCharges.

Với mỗi thiên phú:
- Có thực sự được kích hoạt không?
- Có đúng mô tả không?
- Có hoạt động sau khi load save không?
- Có ảnh hưởng hợp lý đến gameplay không?
- Có gây mất cân bằng xếp hạng không?

Không cho phép thiên phú xuất hiện trong lựa chọn nhưng không có hiệu lực.

Các kỹ năng tự nhập chữ hoặc tự hoàn thành từ phải được đánh dấu là hỗ trợ, tránh làm sai số liệu luyện gõ.

### 3. Điểm số và bảng xếp hạng

Kiểm tra backend leaderboard.

Không tin điểm, tên người chơi, cảnh giới và chỉ số do client gửi lên mà không xác minh.

Yêu cầu:
- Liên kết thành tích với danh tính đã xác thực.
- Có runId duy nhất cho mỗi trận.
- Có cơ chế chống gửi trùng.
- Kiểm tra giới hạn và tính hợp lệ của dữ liệu.
- Xác định phương án xác minh kết quả trận đấu từ phía server.
- Không cho người chơi ghi đè thành tích của tài khoản khác bằng cách gửi tên giống nhau.
- Phân biệt bảng xếp hạng giữa các chế độ và điều kiện hỗ trợ.
- Escape dữ liệu người chơi trước khi đưa vào HTML; tránh sử dụng innerHTML trực tiếp với chuỗi không tin cậy.
- Không phá vỡ dữ liệu leaderboard hiện có; chuẩn bị migration nếu cần.

### 4. Đồng bộ hồ sơ và save

Kiểm tra tình trạng cùng một trận được gửi nhiều lần vào /profile/sync.

Áp dụng idempotency để tránh cộng lặp:
- Tổng tu vi.
- Tổng số từ đã luyện.
- Số trận chơi.
- Linh thạch thưởng.

Tách local save tức thời và đồng bộ server theo lịch hợp lý.

Kiểm tra việc chuyển pháp môn, tiếp tục save, đổi slot và trở về sảnh không làm mất hoặc nhân đôi dữ liệu.

## III. P1 — CẢI TIẾN GAMEPLAY HỌC TIẾNG ANH

### 1. Chuẩn hóa ba chế độ

DIRECT:
- Luyện phản xạ và tốc độ gõ.
- Hiển thị rõ từ cần gõ.
- Đo accuracy và WPM chính xác.

CLOZE:
- Luyện nhớ chính tả dựa trên nghĩa.
- Hiển thị gợi ý có kiểm soát.
- Có thể giảm gợi ý khi người chơi tiến bộ.

AUDIO:
- Luyện nghe và chép chính tả.
- Không hiển thị từ gốc trước khi trả lời.
- Có nút nghe lại và xử lý lỗi phát âm trên mobile.
- Có thể bổ sung giọng Anh-Anh và Anh-Mỹ nếu nguồn dữ liệu hỗ trợ.

Cả ba chế độ phải có mục tiêu học tập rõ ràng và hệ thống đánh giá phù hợp.

### 2. Sửa WPM và Accuracy

GameState hiện tính WPM bằng correctKeystrokes / 5 / elapsedMinutes.

Yêu cầu:
- Ghi nhãn TỪ/PHÚT (WPM).
- Không tính thời gian pause vào thời gian gõ.
- Kiểm tra các bộ đếm khi chuyển pháp môn hoặc load save.
- Phân biệt ký tự tự động do kỹ năng tạo ra với ký tự người chơi tự gõ.
- Không sử dụng chỉ số bị sai để ghi lên leaderboard.
- Có test cho gõ sai, gõ đúng, pause, resume và đổi chế độ.

### 3. Hệ thống từ vựng

Không sử dụng độ dài từ làm tiêu chí duy nhất để xác định độ khó.

Ưu tiên dữ liệu:
- CEFR đáng tin cậy.
- Loại từ.
- Nghĩa chính xác.
- IPA.
- Phát âm.
- Ví dụ sử dụng.
- Lịch sử từ sai.
- Mức độ thành thạo thực tế.

Không khẳng định từ thuộc IELTS Band 7.0 hoặc 8.0 chỉ dựa trên danh sách từ vựng.

### 4. SRS

Kiểm tra hệ thống ghi nhận từ yếu.

Nếu gọi SRS, phải có:
- Thời điểm ôn tiếp theo.
- Mức độ thành thạo.
- Lịch sử trả lời.
- Khoảng cách giữa các lần ôn.
- Cơ chế xếp lịch ôn dựa trên kết quả thực tế.

Nếu chưa có hệ thống xếp lịch đầy đủ, đổi nhãn thành ÔN LUYỆN TỪ YẾU, không quảng bá là SRS hoàn chỉnh.

### 5. Boss Tâm Ma

Giữ ý tưởng boss yêu cầu hoàn thành nhiều từ đồng nghĩa.

Tuy nhiên:
- Kiểm tra các cặp từ có thực sự đồng nghĩa trong ngữ cảnh cụ thể.
- Không xem mọi từ gần nghĩa là thay thế được cho nhau.
- Cung cấp nghĩa và ví dụ sau khi người chơi hoàn thành.
- Tăng độ khó theo khả năng thực tế thay vì chỉ tăng độ dài từ.

## IV. P1 — CHUẨN HÓA THUẬT NGỮ TU TIÊN

Rà soát toàn bộ text hiển thị trong HTML, JavaScript, modal, toast, tooltip, thông báo chiến đấu, bảng xếp hạng và chứng thư.

Sửa:
- HỒI MÔN LỆNH thành TRỞ VỀ TIÊN GIỚI hoặc tên phù hợp chức năng.
- TRỌNG TU PHÁP MÔN thành ĐỔI PHÁP MÔN khi chỉ mở màn hình lựa chọn.
- TẨY TỦY TRÙNG TU thành TRÙNG TU TỪ ĐẦU nếu hành động xóa tiến trình.
- VÀO TRẬN ĐỘ KIẾP thành KHAI TRẬN TRẢM MA cho trận chiến thông thường.
- TỰ/PHÚT thành TỪ/PHÚT (WPM).
- KIM CHUNG TRÀO thành KIM CHUNG TRÁO hoặc KIM CHUNG HỘ THỂ.
- CẤP 0 thành nhãn cảnh giới phù hợp.
- Thống nhất Tu Vi, không xen lẫn PTS không cần thiết.
- Ưu tiên TÀNG KINH CÁC cho kho học liệu.
- Dùng THIÊN KIÊU BẢNG hoặc PHONG THẦN BẢNG thống nhất cho xếp hạng.

Giữ các thuật ngữ đang phù hợp như Luyện Khí, Trúc Cơ, Kim Đan, Nguyên Anh, Kiếm Ý, Đạo Quả, Ngọc Giản, Tâm Ma và Vạn Kiếm Quy Tông.

Phân biệt:
- Cảnh giới: cấp tiến triển nhân vật.
- Pháp môn: phương pháp tu luyện.
- Kinh quyển: kho từ/bài học.
- Thiên phú: hiệu ứng được lựa chọn.
- Thiên kiếp: thử thách đột phá quan trọng.
- Tâm ma: rủi ro, hình phạt hoặc boss tinh thần.

Lời thoại phải ngắn, có chất tiên hiệp nhưng tự nhiên với người Việt. Tránh ghép quá nhiều từ Hán Việt không rõ nghĩa.

## V. P2 — NÂNG CẤP ART QUALITY

Từ ảnh hiện tại, ưu tiên:
1. Thanh điều hướng ngọc bội.
2. Bộ icon chức năng.
3. Bệ đứng và trận pháp của nhân vật.
4. Icon của nút hành động.
5. Avatar fallback.
6. Bố cục trung tâm sảnh chờ.

Không vẽ lại nền sơn môn và sprite đang đạt chất lượng tốt.

Không tăng số lượng SVG trang trí nếu asset cũ còn sơ sài.

Các họa tiết quan trọng phải là asset được thiết kế hoàn chỉnh, không phải vài nét line/path được đặt tên mỹ thuật.

Kiểm tra tính tương thích với phong cách pixel-art, responsive, độ nét và độ tương phản.

Không thay thế các asset đẹp bằng hình vẽ code đơn giản hơn.

## VI. CACHE VÀ TRIỂN KHAI

Kiểm tra version asset.

Trang iframe đang dùng v11.8 trong khi một số CSS/JS còn tham số v11.7.

Triển khai cơ chế version/fingerprint thống nhất cho các file tài nguyên, tránh người dùng tải lẫn phiên bản cũ và mới.

Kiểm tra cả trường hợp cache trình duyệt, deploy production và hard reload.

## VII. KIỂM THỬ BẮT BUỘC

Kiểm thử tối thiểu:
- Mở sảnh chơi.
- Chọn pháp môn.
- Tiếp tục game đã lưu.
- Khởi động một trận mới.
- Gõ đúng/sai.
- Space, Backspace, Tab.
- Gõ trên mobile.
- Đột phá cảnh giới.
- Chọn và kích hoạt thiên phú.
- Lưu/khôi phục trận.
- Ghi điểm leaderboard.
- Thoát và quay lại.
- Xem lại từ yếu.
- Xuất chứng thư PNG.
- Responsive desktop và mobile.

Chạy build/lint và các bài test có sẵn. Bổ sung test cho các lỗi logic vừa phát hiện nếu dự án chưa có.

Không kết luận hoàn thành khi chỉ sửa giao diện hoặc khi ứng dụng chỉ chạy được nhưng tính năng chưa được xác minh.

## VIII. CÁCH THỰC HIỆN

Triển khai theo thứ tự:

P0: Gameplay correctness + leaderboard integrity.
P1: Tính điểm, thuật ngữ, save, SRS và thiết kế học tập.
P2: Art assets, UI polish và responsive.

Giữ nguyên dữ liệu quan trọng, ưu tiên thay đổi nhỏ có thể kiểm chứng.

Mỗi giai đoạn cần ghi rõ:
- Lỗi xác nhận được.
- File và hàm đã sửa.
- Thay đổi hành vi.
- Test đã chạy.
- Kết quả screenshot nếu có.
- Vấn đề còn lại.

Không tự ý push hoặc thay đổi các phần ngoài phạm vi khi chưa cần thiết. Hoàn thiện và kiểm tra từng giai đoạn trước khi chuyển sang phần tiếp theo.
