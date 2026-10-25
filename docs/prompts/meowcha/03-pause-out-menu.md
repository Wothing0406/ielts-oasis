# MEOW-CHA — PAUSE / OUT GAME MENU REDESIGN

Hãy thiết kế lại menu tạm nghỉ hiện tại theo phong cách:

Cute Pixel Xianxia + Stylish Game UI

Không giữ kiểu modal web tối với block text lớn.

## Mục tiêu

Menu phải tạo cảm giác:
- nhân vật đang “thu kiếm định tâm”
- tạm nghỉ giữa trận
- vẫn thuộc cùng thế giới pixel tu tiên
- dễ đọc, dễ thao tác
- không quá tối

## Nội dung

Tiêu đề:
ĐỊNH TÂM

Subtitle:
“Thu kiếm dưỡng khí • Tĩnh tâm nhất niệm”

Primary action:
TIẾP TỤC ĐỘ KIẾP

ESC hiển thị dưới dạng hotkey badge nhỏ, không nhét vào text chính.

Secondary action:
QUY TÔNG
hoặc
TRỞ VỀ TIÊN MÔN

Không dùng “THU THUYỀN VỀ SẢNH” nếu game không có motif thuyền.

## Battle Summary

Không hiển thị toàn bộ thống kê thành một đoạn văn dài.

Tạo vùng:

TRẬN NÀY

Các stat card nhỏ:
- Kiếm Chuẩn: accuracy
- Kiếm Tốc: WPM
- Liên Trảm: max combo
- Từ Đã Luyện: words completed
- Thời Gian: battle duration
- Hỗ Trợ: assist/hint count nếu có

Dùng grid 2 cột desktop.
Mobile dùng 1 hoặc 2 cột tùy chiều rộng.

## Visual

Palette:
- dark jade wood
- warm lacquer brown
- parchment cream
- antique gold
- jade green

Giảm black background.
Giảm glow.
Không dùng icon SVG line-art thô.

Dùng pixel-art asset:
- thanh kiếm đặt ngang
- chén trà nhỏ
- linh khí
- ngọc phù hoặc mộc bài

Panel có cảm giác vật thể trong game, không phải card SaaS.

## Buttons

Primary:
- hình mộc bài/kiếm bài
- jade green
- pixel border
- strong silhouette

Secondary:
- warm brown/red lacquer
- visually quieter than primary

Không dùng rounded rectangle generic nếu có thể thay bằng asset game.

## UX

Pause phải thực sự dừng:
- asteroid movement
- timers
- hazards
- WPM timer
- skill cooldown nếu design yêu cầu pause toàn phần

Resume phải:
- tiếp tục đúng trạng thái
- không spawn thêm từ
- không reset combo
- không restart music hoặc voice sai cách

Return to lobby:
- hỏi xác nhận nếu có nguy cơ mất run/progress
- lưu đúng trạng thái nếu game design cho phép

## Mobile

- nút đủ lớn
- không overflow
- stat không chen chữ
- modal không cao hơn viewport
- có safe-area
- không che virtual keyboard state bất thường

Hoàn thành bằng cách kiểm tra render thực tế trên desktop và mobile.
