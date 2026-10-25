# FIX MOBILE GAMEPLAY & VIRTUAL KEYBOARD — MEOW-CHA TRẢ ĐẠO

Repository: Wothing0406/ielts-oasis

Branch: game/meowcha-cultivation

File trọng tâm: frontend/components/meowcha/MeowchaGame.tsx

Bạn là Senior React/Next.js Game Engineer, Mobile UI/UX Engineer và Game Interface Designer.

Hãy kiểm tra và sửa trực tiếp trải nghiệm game MEOW-CHA TRẢ ĐẠO trên điện thoại.

## 1. VẤN ĐỀ ĐÃ XÁC ĐỊNH

Từ ảnh chụp điện thoại, giao diện đang gặp:
- HUD trên cùng bị chồng chéo và thiếu không gian.
- Thông tin nhân vật, HP, tu vi, WPM và nút thao tác không được bố trí phù hợp màn hình nhỏ.
- Bàn phím ảo không hiển thị trong vùng nhìn thấy của người chơi.
- Canvas và HUD đang cạnh tranh diện tích với bàn phím.
- Một số nhãn, tooltip hoặc thông báo che khu vực gameplay.
- Các modal có chữ bị ép hoặc nút bấm chứa quá nhiều nội dung.

Đây là lỗi ảnh hưởng trực tiếp đến khả năng chơi game, không chỉ là vấn đề thẩm mỹ.

## 2. KIỂM TRA HỆ THỐNG BÀN PHÍM ĐANG CÓ

Trong MeowchaGame.tsx hiện đã có:

- KB_ROWS: layout bàn phím QWERTY.
- isMobile: trạng thái xác định mobile.
- processInputChar(inputChar): xử lý ký tự.
- window keydown listener: nhận bàn phím vật lý.
- handleCanvasTouchOrClick: hỗ trợ nhập bằng cách chạm canvas.
- JSX virtual keyboard được render khi isMobile là true.

KHÔNG được tự tạo thêm một hệ thống xử lý ký tự độc lập.

Hãy sử dụng processInputChar làm đường xử lý chung cho bàn phím vật lý và bàn phím ảo.

Kiểm tra:
1. isMobile có được cập nhật chính xác không?
2. Bàn phím có thực sự được mount không?
3. Container cha có chiều cao đúng không?
4. overflow-hidden có cắt bàn phím không?
5. flex-1 có min-height phù hợp không?
6. Canvas có chiếm hết không gian khiến bàn phím bị đẩy khỏi viewport không?
7. Bàn phím có bị lớp khác che bởi z-index hoặc stacking context không?
8. Có khác biệt giữa viewport CSS và visualViewport trên mobile không?

Không được chỉ tăng z-index hoặc dùng position:fixed để che giấu lỗi layout mà chưa xác định nguyên nhân.

## 3. SỬA BÀN PHÍM QWERTY ẢO

Yêu cầu bắt buộc:

- Bàn phím phải hiển thị khi vào trận trên điện thoại.
- Nằm trong vùng nhìn thấy, ưu tiên phía dưới canvas.
- Không bị cắt bởi khung game hoặc viewport.
- Có thể gõ từng chữ QWERTY bằng cảm ứng.
- Mỗi lần chạm chỉ nhập đúng một ký tự.
- Dùng chung processInputChar với bàn phím vật lý.
- Không làm thay đổi logic combo, sát thương, chọn mục tiêu, điểm hoặc độ kiếp.
- Không gây nhập kép do onTouchStart và onClick cùng kích hoạt.
- Không có phím quá nhỏ hoặc quá sát nhau.
- Không làm trình duyệt zoom khi bấm phím liên tục.
- Không trigger native keyboard không cần thiết khi người chơi dùng bàn phím ảo tùy biến.
- Vẫn hoạt động khi xoay ngang màn hình.

Ưu tiên sử dụng một cơ chế kích hoạt thống nhất, ví dụ onPointerDown với guard thích hợp hoặc onClick nếu đáp ứng được yêu cầu latency. Không để một tương tác vật lý tạo hai lần nhập.

### Thiết kế bàn phím

Giữ QWERTY 3 hàng:
QWERTYUIOP
ASDFGHJKL
ZXCVBNM

Màu sắc:
- Nền bàn phím: gỗ trầm tối.
- Phím: nâu sẫm.
- Viền: vàng cổ.
- Chữ: vàng kem.
- Nhấn: đỏ son hoặc ngọc bích có kiểm soát.

Không vẽ quá nhiều SVG trang trí lên từng phím. Bàn phím phải ưu tiên rõ, nhanh và dễ thao tác.

Sử dụng CSS Grid hoặc Flexbox để các phím phân chia chiều ngang hợp lý.

Không hardcode max-width 36px nếu điều đó tạo ra các vùng chạm quá nhỏ trên màn hình thực tế.

Bàn phím có thể hỗ trợ ẩn/hiện khi cần, nhưng trạng thái mặc định trong trận trên mobile phải dễ sử dụng. Nếu ẩn, phải có nút mở lại rõ ràng.

## 4. PHÂN BIỆT CHẾ ĐỘ NHẬP

Game là sản phẩm luyện gõ và học từ vựng tiếng Anh, vì vậy việc nhập ký tự thực tế là cơ chế cốt lõi.

Kiểm tra handleCanvasTouchOrClick hiện tại.

Không để việc chạm canvas tự động hoàn thành từng ký tự trở thành phương thức bắt buộc hoặc thay thế hoàn toàn việc luyện gõ.

Nếu vẫn giữ chế độ chạm hỗ trợ, hãy phân biệt rõ:
- Typing Mode: người chơi tự gõ từng ký tự.
- Assist Mode: chạm hỗ trợ theo luật hiện có.

Mặc định ưu tiên Typing Mode, nhưng phải bảo toàn dữ liệu và các cơ chế đã tồn tại. Không tự thay đổi cách tính điểm hoặc xếp hạng khi chưa kiểm tra ảnh hưởng đến gameplay.

## 5. THIẾT KẾ LẠI BATTLE LAYOUT

Thay cách chia vùng hiện tại bằng bố cục thích ứng chiều cao viewport.

Mobile portrait:

A. Compact HUD
- Tên nhân vật và cấp độ.
- Thanh HP.
- Tu vi và WPM.
- Các nút lưu, âm thanh, tạm dừng.

B. Gameplay viewport
- Canvas.
- Nhân vật, ma thạch, kiếm và hiệu ứng.
- Tooltip có giới hạn kích thước.

C. Virtual keyboard
- QWERTY.
- Có khoảng đệm phù hợp cạnh dưới.
- Không làm che đối tượng gameplay quan trọng.

Không sử dụng chiều cao cố định theo desktop.

Kiểm tra 100dvh, visualViewport và safe-area-inset-bottom khi phù hợp.

Phải có giải pháp hợp lý cho màn hình thấp. Không được thu nhỏ mọi thành phần đến mức không thể đọc hoặc bấm.

## 6. SỬA HUD MOBILE

Phần battle HUD hiện dùng justify-between cho hai nhóm lớn.

Hãy thiết kế phiên bản mobile riêng:
- Nhóm nhân vật và HP được ưu tiên.
- Các chỉ số phụ chuyển sang hàng riêng hoặc nhóm thu gọn.
- Các nút điều khiển có vùng chạm dễ sử dụng.
- Tên người chơi dài được xử lý.
- Không để HUD che canvas.
- Không để các nút vượt khỏi chiều ngang màn hình.

Desktop vẫn giữ bố cục phù hợp màn hình rộng.

Không sửa bằng cách giảm toàn bộ font xuống 8–10px.

## 7. RESPONSIVE CANVAS

Canvas hiện có kích thước nội tại 900 × 650.

Hãy kiểm tra:
- Tỷ lệ tọa độ gameplay với vùng canvas hiển thị.
- Mapping từ touch/pointer sang tọa độ game.
- Scale theo chiều rộng và chiều cao thực tế.
- Canvas resize và devicePixelRatio.
- Việc cắt vùng chơi ở màn hình dọc.
- Pixel-art có bị làm mờ hoặc méo không.

Chỉ thay đổi thuật toán canvas nếu xác nhận được lỗi.

Không thay đổi logic game chỉ để làm vừa giao diện.

## 8. FIX MODAL MOBILE

Kiểm tra tất cả modal gameplay:
- Chọn pháp môn.
- Đột phá cảnh giới.
- Lưu tiến trình.
- Bảng phong thần.
- Kho đan dược.
- Các thông báo và popup liên quan.

Modal phải có:
- max-height theo viewport.
- Khu vực cuộn phù hợp.
- Nút đóng truy cập được.
- Nút hành động không bị che.
- Nội dung không tràn ngang.
- Chữ tiếng Việt xuống dòng đúng.
- Không bị bàn phím che khi modal đang mở.

Nếu modal cần nhập văn bản, xử lý native keyboard và visualViewport riêng.

## 9. KIỂM TRA GAMEPLAY

Test tối thiểu:
- Gõ đúng một ký tự bằng bàn phím ảo.
- Gõ sai ký tự.
- Gõ liên tiếp nhanh.
- Giữ tay trên phím.
- Chạm đồng thời nhiều điểm.
- Mở và đóng modal.
- Tạm dừng và tiếp tục.
- Xoay màn hình.
- Thay đổi kích thước viewport.
- Mở game trên iOS Safari và Android Chrome nếu có môi trường kiểm thử.
- Kiểm tra desktop keyboard không bị ảnh hưởng.

Kiểm tra cả các event listener sau khi component unmount để tránh nhập lặp hoặc memory leak.

## 10. KIỂM TRA KÍCH THƯỚC

Ưu tiên:
- 320 × 568.
- 360 × 640.
- 375 × 667.
- 390 × 844.
- 430 × 932.
- Mobile landscape.
- Tablet.
- Desktop.

Đảm bảo không còn horizontal overflow và các vùng quan trọng không bị cắt.

## 11. THỰC HIỆN VÀ BÁO CÁO

Hãy:
1. Đọc code thực tế của branch game/meowcha-cultivation.
2. Xác định nguyên nhân bàn phím ảo không xuất hiện.
3. Sửa layout và event handling.
4. Hoàn thiện bàn phím theo phong cách game.
5. Sửa HUD và modal mobile.
6. Chạy build, lint và các kiểm tra có sẵn.
7. Kiểm tra kết quả render qua trình duyệt nếu công cụ cho phép.
8. Báo cáo file đã sửa, nguyên nhân, cách sửa và kết quả kiểm thử.

Không tạo lại hệ thống gameplay từ đầu. Không thay đổi dữ liệu người chơi, API hoặc quy tắc tính điểm ngoài phạm vi cần thiết.

Không chỉ trả lời bằng một kế hoạch. Hãy thực hiện thay đổi trong codebase và kiểm tra kết quả.
