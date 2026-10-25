# MEOW-CHA — STYLE UPGRADE TO SWORD-PANEL PIXEL XIANXIA + FIX LEADERBOARD & AVATAR

Repository: Wothing0406/ielts-oasis  
Branch: game/meowcha-cultivation

Bạn là Lead Game UI Designer, Pixel Art Director, Frontend Engineer và Gameplay UI Engineer.

## MỤC TIÊU CHUNG

Nâng toàn bộ giao diện MEOW-CHA từ kiểu web-game panel hiện tại sang phong cách:

**Cute Pixel Xianxia + Stylish Sword UI**

Phong cách tham chiếu:
- CTA và stat panel nên đi theo tinh thần của ảnh mẫu 2:
  - nút chính dạng kiếm / mộc bài / pháp khí
  - stat box dạng vật phẩm nhỏ
  - sáng hơn, ngầu hơn, có cá tính hơn
  - vẫn giữ vibe pixel-art dễ thương và tu tiên

Không copy y nguyên ảnh mẫu.  
Hãy dùng nó như **style anchor** để thiết kế lại hệ thống UI.

---

## I. FIX FUNCTIONAL ISSUES FIRST

### 1. Fix Phong Thần Bảng
Kiểm tra toàn bộ flow leaderboard:

- API fetch leaderboard
- mapping dữ liệu trả về
- auth hoặc user identity mapping
- render top 3 và danh sách còn lại
- trường điểm, tu vi, tốc độ, số trảm
- fallback khi dữ liệu rỗng
- xử lý lỗi mạng

Bảng phong thần phải hoạt động trở lại.

Nếu API hoặc schema đã thay đổi:
- cập nhật frontend để tương thích
- không làm hỏng dữ liệu cũ

### 2. Fix avatar user
Hiện tại avatar user không hiển thị đúng, có dấu hiệu đang fallback sang ảnh linh thú.

Sửa logic:
- nếu user có avatarUrl hợp lệ -> hiển thị avatar user
- nếu không có avatar -> hiển thị default user avatar
- linh thú chỉ xuất hiện ở khu vực pet/companion, không thay cho avatar user
- xử lý rõ ràng cho top 3, hàng leaderboard thường, hồ sơ cá nhân và modal profile

Không được dùng linh thú làm fallback avatar mặc định của người chơi.

---

## II. ART DIRECTION — GLOBAL STYLE

Chuyển hướng toàn game sang:

### Cute Pixel Xianxia + Stylish Sword UI

Tính cách hình ảnh:
- ngầu
- chất
- cổ phong
- kiếm tu
- pixel cute
- ấm áp hơn
- readable hơn
- không tối nặng
- không web-dashboard

### Bảng màu mới
Dùng palette sáng hơn, ít đen hơn:

- Dark jade wood: #21352F
- Warm lacquer brown: #5B2E1E
- Parchment cream: #F3E5BE
- Antique gold: #E7BC68
- Jade green: #69B79A
- Peach red accent: #C95E52
- Sky spirit blue: #90C5D8

Nguyên tắc:
- giảm diện tích nền đen
- dùng giấy ngà cho vùng thông tin chính
- dùng ngọc bích và vàng cổ làm accent
- đỏ son chỉ dùng cho CTA phụ / trạng thái mạnh

---

## III. REDESIGN CORE UI COMPONENTS

### 1. Primary CTA buttons
Các nút quan trọng như:
- Tiếp tục độ kiếp
- Vào trận độ kiếp
- Đổi pháp môn
- Bắt đầu độ kiếp
- Chọn thiên phú

Phải được thiết kế lại theo style “ảnh 2”:
- hình kiếm / mộc bài / pháp khí
- có silhouette riêng
- có cảm giác asset game
- không còn là rounded rectangle web button thông thường

Phân nhóm:
- Primary battle action = sword-banner style
- Secondary navigation = wood/plaque style
- Danger/reset = seal/red plaque style

Không biến tất cả thành cùng một loại nút.

### 2. Stat boxes
Thiết kế lại:
- Khí Huyết
- Tốc Độ (WPM)
- Tu Vi
- Trảm
- Kiếm Ý / Combo nếu có

Mỗi stat box phải giống một vật phẩm pixel-art nhỏ:
- bình linh dược
- cuộn trục
- linh châu
- phi kiếm
- ngọc phù

Không dùng box chữ nhật tối đơn giản với icon vector mờ.

### 3. Panels / modals
Đồng bộ lại các panel:
- Chọn pháp môn
- Cơ duyên ngộ đạo / thiên phú
- Tàng Kinh Các
- Chứng đạo
- Phong thần bảng

Hướng:
- khung gỗ trầm sáng
- nền giấy ngà / lụa sáng
- viền vàng cổ mảnh
- ít glow hơn
- ít đen hơn
- các góc trang trí ít nhưng tinh

---

## IV. REPLACE UGLY EFFECTS

### 1. Word burst / asteroid explosion reward popup
Hiệu ứng hiện tại đang quá tối, hiện đại và không hợp phong cách pixel tu tiên.

Hãy thay bằng flow mới:

1. ma thạch nứt
2. mảnh pixel văng ra
3. hiện thẻ từ hoặc ngọc giản nhỏ
4. chữ tiếng Anh + IPA + nghĩa rõ ràng
5. linh khí / tu vi bay về nhân vật
6. biến mất gọn gàng

Không dùng cuộn trục đen với line art canvas dày đặc.

### 2. Skill / typing altar area
Thiết kế lại khu vực dưới cùng (sword intent / typing area):
- ngầu hơn
- chất hơn
- sáng hơn
- gần style ảnh 2
- nhưng vẫn dễ đọc, đặc biệt trên mobile

Giảm các icon tối khó phân biệt.
Tăng độ rõ của từ đang gõ.
Không làm vùng này thành một khối đen lớn.

---

## V. APPLY STYLE TO ALL FLOWS

Không chỉ sửa một màn hình.
Toàn bộ các luồng sau phải cùng ngôn ngữ thiết kế:

- sảnh chính
- battle
- đột phá cảnh giới
- chọn thiên phú
- chọn pháp môn
- tàng kinh các / kho từ
- chứng đạo
- phong thần bảng
- hồ sơ người chơi
- HUD mobile

Mục tiêu: người chơi cảm nhận đây là cùng một game, cùng một thế giới.

---

## VI. ASSET RULES

### Không được:
- dùng SVG sơ sài kiểu vài path line-art để giả làm icon cao cấp
- lạm dụng nền đen + viền vàng
- dùng icon tối mờ khó đọc
- dùng placeholder fallback sai vai trò
- dùng linh thú thay user avatar

### Được:
- dùng pixel-art assets rõ ràng
- dùng icon đơn giản nhưng có silhouette tốt
- dùng PNG/WebP trong suốt nếu asset phức tạp
- dùng 9-slice cho khung panel
- dùng functional SVG cho icon nhỏ nếu thật sự phù hợp

---

## VII. RESPONSIVE

Áp dụng style mới cho:
- desktop
- mobile portrait
- mobile landscape

Đảm bảo:
- CTA vẫn to, rõ
- stat box không bị bóp méo
- panel không tràn
- battle HUD vẫn readable
- keyboard ảo không bị che

---

## VIII. QA CHECKLIST

Bắt buộc kiểm tra:

1. Phong thần bảng load được.
2. User avatar hiển thị đúng.
3. Không còn linh thú thay avatar user.
4. CTA chính đã có style “ngầu như ảnh 2”.
5. Các luồng khác đồng bộ cùng style.
6. Asteroid burst popup đã thay.
7. Màu tổng thể sáng hơn, less dark.
8. Battle HUD readable.
9. Mobile không vỡ layout.
10. Không làm hỏng gameplay, save, typing, audio.

Nếu một phần chưa có asset tốt, nêu rõ phần đó cần asset mới thay vì giả vờ hoàn thiện bằng SVG line-art.
