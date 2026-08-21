# IELTS Oasis Extension: Technical Plan & Feature Specification

> **Hệ sinh thái:** IELTS Oasis (`ieltsoasis.site`)  
> **Sản phẩm:** Tiện ích mở rộng trình duyệt (Chrome/Edge Extension - Manifest V3)  
> **Định vị:** Trợ lý học thuật cá nhân hóa, nhắc nhở từ vựng định kỳ qua Mascot Matcha Pixel 2D 1x1 và đồng bộ đa kênh (Web, OCR, Discord).

---

## PHẦN 1: TỔNG QUAN DỰ ÁN & MỤC TIÊU CHIẾN LƯỢC

### 1.1. Bối cảnh & Vấn đề giải quyết
* **Khoảng cách ghi nhớ (Retention Gap):** Người học thường quên ôn từ vựng định kỳ sau giờ học, thiếu môi trường gợi mở tự nhiên trong quá trình duyệt web, giải trí hoặc làm việc.
* **Đứt gãy luồng học tập (Context Switching Friction):** Khi gặp từ vựng mới trên tài liệu, PDF hoặc Discord, việc phải mở web IELTS Oasis để nhập liệu thủ công gây cản trở và lười lưu trữ.
* **Chi phí phân phối 0đ:** Không phụ thuộc vào phí kích hoạt tài khoản Google Developer Store, tối ưu hóa việc phân phối trực tiếp từ website `ieltsoasis.site` thông qua file `.zip` (Developer Mode).

### 1.2. Mục tiêu cốt lõi
1. Cung cấp một Mascot 2D Pixel xanh Matcha (phong cách Bongo Cat, nền trong suốt) trực quan, tạo cảm giác thân thiện, không gây phiền toái.
2. Tự động bật nhắc nhở từ vựng kèm phiên âm IPA chuẩn sau mỗi 30 phút.
3. Tích hợp công cụ chụp màn hình trích xuất chữ (OCR) và đồng bộ bot Discord về kho Flashcard trung tâm.
4. Tích hợp AI Chatbot học thuật với hệ thống phím tắt và Slash Commands hỗ trợ giải thích, viết lại câu theo tiêu chuẩn IELTS đồng bộ với ở discord đọc user và cấu trúc web hiện tại(model gemini hiện tại web đang dùng).
5. Tích hợp database của người dùng sau khi có lịch học nhắc nhở ngay trong khi ở trình duyệt
6. khi người dùng đang sử dụng tại trang web https://ieltsoasis.site/ thì ngưng nhắc tự động thay vào đó sẽ là một pet động viên có các hiệu ứng rõ ràng.
7. ở giao diện web hiện nút tải pet matcha về trình duyệt hiện ra thông báo và hướng dẫn người dùng
8. từ kho flash card hiện có tích hợp thêm tạo quizz như web bằng cách sau tạo quizz thì sẽ lấy từ kho flashcard ở web và tạo quizz cấu trúc quiz giống với web hiện tại ở file C:\Users\QuangNe\Downloads\Projects\web\ielts-oasis\frontend\components\VocabularyQuiz.tsx. hoặc sau tầm một 2-3 tiếng pet matcha sẽ hỏi bạn {user} bạn có muốn làm thử bài kiếm tra từ vựng hôm nay không? . Và quizz sẽ ở dạng poup từ con pet  hiện ra câu hỏi và trả lời poup ở ngay con pet đó. Nếu làm đúng thì pet sẽ reo vui còn làm sai thì pet sẽ có vẻ buồn và cho phép xem đáp án .
9. vibe con pet phải đúng với hiện tài một chú mèo nhỏ 2d cute vibe matcha nếu như bỏ rơi nó nó sẽ khóc và làm phiền bạn không cho bạn hoạt động các website khác ngoài web của nó ra. và 1 số hiệu ứng đặc biệt CÓ hiệu ứng và chuyển động rõ ràng
---

## PHẦN 2: KIẾN TRÚC KỸ THUẬT (TECHNICAL ARCHITECTURE)

### 2.1. Cấu trúc thư mục tiện ích (Manifest V3)
```text
matcha-oasis-extension/
├── manifest.json              # Cấu hình quyền, background worker, sidepanel, content scripts
├── background/
│   └── service_worker.js      # Bộ đếm Alarm 30p, Context Menus, Xử lý Sync API & Discord Webhook
├── content_scripts/
│   ├── pet_overlay.js         # Inject Mascot Matcha Pixel 2D và bong bóng từ vựng vào DOM
│   ├── pet_overlay.css        # Hiệu ứng hoạt ảnh pixel 1x1, floating widget, nền trong suốt
│   ├── ocr_selector.js        # Canvas overlay chọn vùng màn hình chụp & cắt ảnh
│   └── text_highlighter.js    # Bắt sự kiện bôi đen từ vựng & Quick Action tooltip
├── popup/
│   ├── popup.html             # Giao diện khi bấm vào biểu tượng extension trên thanh toolbar
│   ├── popup.js               # Logic điều khiển nhanh và trạng thái đăng nhập
│   └── popup.css              # Giao diện Matcha Palette (#6B8E23, #8FBC8F, #E8F5E9)
├── sidepanel/
│   ├── assistant.html         # Trợ lý học thuật toàn diện (Lịch học, Chatbot, Quản lý Flashcard)
│   ├── assistant.js           # Xử lý Slash Commands, kết nối WebSocket/REST API
│   └── assistant.css          # Giao diện chuẩn UI/UX của IELTS Oasis
├── assets/
│   ├── icons/                 # Logo extension 16x16, 48x48, 128x128
│   ├── mascot/                # Sprite sheet Mascot Pixel mèo Matcha (idle, reading, alert animations)
│   └── audio/                 # Âm thanh click nhẹ, phát âm IPA offline (tuỳ chọn)
└── lib/
    └── tesseract.min.js       # Thư viện OCR client-side (hoặc gửi ảnh về backend Vision API)