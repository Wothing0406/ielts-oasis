<!-- User-provided source brief; task status and validation are tracked separately in README.md. -->
# MEOW-CHA — COMPLETE PIXEL XIANXIA ART & AUDIO REPAIR

Repository: Wothing0406/ielts-oasis
Branch: game/meowcha-cultivation

Bạn là Lead Pixel Artist, Game Art Director, Game UI Engineer và Web Audio Engineer.

Hãy nâng cấp trực tiếp bản game MEOW-CHA hiện tại theo hướng **Cozy Pixel Xianxia — Tiên hiệp 2D pixel-art dễ thương, giàu chất liệu, mềm mại, ấm áp và có độ hoàn thiện thương mại**.

## 1. QUY TẮC BẮT BUỘC

Không được tiếp tục nâng cấp mỹ thuật bằng cách đơn thuần thêm vài SVG path, gradient, đường viền vàng hoặc shadowBlur.

Phân biệt rõ:
- Functional SVG: biểu tượng chức năng đơn giản.
- UI ornamental assets: khung, hoa văn, cuộn trục, phù chú.
- Game sprites: nhân vật, pháp bảo, kiếm, ma thạch, linh thú.
- Animated VFX: kiếm khí, linh khí, vỡ ngọc và hiệu ứng lĩnh ngộ.

Các asset phức tạp phải dùng hình ảnh được thiết kế có chủ đích. Ưu tiên asset pixel-art PNG/WebP có nền trong suốt, spritesheet và 9-slice khi thích hợp.

Nếu không có công cụ tạo asset chất lượng cao, phải báo rõ phần cần tạo riêng. Không dùng hình phác thảo bằng SVG để giả lập thành phẩm.

## 2. THAY ĐỔI ART DIRECTION

Chuyển từ Dark Black-Gold Neon Fantasy sang Cozy Pixel Xianxia.

Palette:
- Gỗ trầm ngọc: #20332D
- Giấy tiên ngà: #F5E7C7
- Ngọc bích: #70B998
- Kim cổ: #E5BE72
- Đào hồng: #D88781
- Lam linh: #9CB7D4

Không làm sáng toàn bộ nền ban đêm. Tăng độ sáng và tính dễ đọc chủ yếu ở các phần giao diện, vật phẩm và thông tin tương tác.

Giữ nguyên những sprite có chất lượng tốt như nền sơn môn, mèo tu tiên, phi kiếm, linh thú, đèn lồng và mây.

Ưu tiên tính thống nhất với pixel-art. Không làm mờ sprite bằng filter hoặc scale sai tỷ lệ.

## 3. THAY THẾ TOÀN BỘ CUỘN TRỤC NỔ TỪ

Kiểm tra:
frontend/public/meowcha/js/effects/FloatingText.js

Đặc biệt là addInSituBurst() và phần render this.bursts.

Cuộn trục hiện tại đang dùng màu gần đen, hình học Canvas, viền vàng và nhiều đường sáng.

Hãy thay bằng hiệu ứng nhận từ vựng được thiết kế lại:

Giai đoạn A — Ma thạch nứt:
- Sprite ma thạch có vết nứt.
- Tia linh khí xuất hiện.
- Âm thanh ngọc vỡ hoặc kiếm chạm đá.

Giai đoạn B — Ma thạch vỡ:
- Mảnh pixel bắn ra có quỹ đạo hợp lý.
- Không lạm dụng screen shake.
- Không dùng vòng tròn và tám nét gạch giả làm Bát Quái.

Giai đoạn C — Lĩnh ngộ từ vựng:
- Một tấm giấy tiên sáng màu kem xuất hiện.
- Có thể dùng cuộn giấy pixel-art hoặc thẻ ngọc cách điệu.
- Chữ tiếng Anh lớn, rõ.
- IPA dễ đọc.
- Nghĩa tiếng Việt rõ ràng.
- Có điểm Tu Vi nhận được.
- Tất cả nằm trong một bố cục có phân cấp thị giác.

Giai đoạn D — Kết thúc:
- Linh khí hoặc điểm tu vi bay về nhân vật.
- Thẻ từ biến mất nhẹ nhàng.
- Không che từ tiếp theo hoặc HUD.

Không tạo cảm giác một popup HTML hiện đại bay trên canvas.

Không bắt người chơi phải đọc quá nhiều chữ trong thời gian ngắn.

Có thể lưu thông tin từ vừa trảm vào một vùng học tập riêng để xem lại.

## 4. THIẾT KẾ LẠI MA THẠCH VÀ PHÙ VĂN

Kiểm tra AsteroidManager.js.

Hiện ma thạch được phủ lên bởi nhiều lớp bảng chữ, vòng sáng và khung trang trí.

Yêu cầu:
- Chất liệu ma thạch và phù ấn phải thống nhất.
- Từ tiếng Anh là trung tâm thị giác.
- Chữ không bị chìm vào nền.
- Không có quá nhiều dòng thông tin trên cùng một vật thể.
- Không dùng bảng đen chữ vàng như một cửa sổ UI thông thường.
- Dùng các asset pixel-art có thiết kế riêng cho băng, hỏa, hư không và lôi.
- Giữ kích thước dễ đọc trên mobile.

## 5. THIẾT KẾ LẠI KIẾM QUYẾT ĐÀI

Kiểm tra #swordIntentBox, .sword-altar-hud, .altar-parchment-scroll và các CSS liên quan.

Vấn đề:
- Nền khung đen quá lớn.
- Icon hai bên quá tối.
- Viền vàng quá dày.
- Chữ và ký hiệu trang trí chen chúc.

Yêu cầu:
- Sử dụng gỗ trầm ngọc, giấy ngà, vàng cổ.
- Tạo cảm giác một chiếc bàn học cổ phong và cuộn bí kíp thực sự.
- Giảm diện tích của những vùng trang trí trống.
- Tăng diện tích hiển thị từ vựng.
- Thống nhất icon Kiếm Ý, kiếm khí, tiến độ.
- Các icon phải sắc nét, đúng chức năng và không hiển thị giống hình lỗi.
- Kiểm tra riêng mobile portrait và landscape.

## 6. FIX AUDIO — ƯU TIÊN CAO

Kiểm tra:
- js/core/AudioManager.js
- js/combat/TypingEngine.js
- js/ui/UIManager.js
- js/main.js

Hiện người chơi phản ánh rằng sau khi trảm ma thạch và xảy ra hiệu ứng nổ, nhạc nền hoặc voice phát âm bị mất.

Phải tái hiện và xác định nguyên nhân thật sự.

Kiểm tra:
1. AudioContext có bị suspended, interrupted hoặc closed không?
2. Hàm playWordAudio() có hủy voice ngoài ý muốn không?
3. Audio HTML5 và speechSynthesis có xung đột không?
4. Âm thanh có bị dừng do promise rejection hoặc media error không?
5. Nhạc nền có bị tiếng nổ át hoàn toàn không?
6. Có tạo trùng hoặc hủy sai oscillator/audio node không?
7. Trạng thái zenMusicPlaying có phản ánh đúng trạng thái âm thanh thật không?
8. Có lỗi đặc biệt trên iOS Safari hoặc Android Chrome không?

Thiết kế ba kênh logic riêng:
- BGM: nhạc nền.
- SFX: hiệu ứng chiến đấu.
- VOICE: phát âm từ vựng.

Yêu cầu:
- Tiếng nổ không dừng BGM.
- Voice hoạt động sau mỗi lần trảm.
- Voice không bị cắt ngoài ý muốn.
- Có fallback phát âm khi file MP3 thất bại.
- Có khả năng phục hồi audio sau khi trình duyệt tạm ngắt.
- Không tự bật tiếng khi người dùng đã chọn tắt âm thanh.
- Hạn chế đỉnh âm lượng SFX và ưu tiên độ rõ của Voice.
- Không tạo âm thanh trùng hoặc vọng.

Thêm logging tạm thời phục vụ debug; loại bỏ logging không cần thiết trước khi hoàn thành.

## 7. KIỂM THỬ

Phải kiểm tra ít nhất:
- Trảm 1 từ.
- Trảm liên tục 10–20 từ.
- Nghe lại phát âm.
- Tắt và bật tiếng.
- Pause/resume.
- Vào lại sảnh.
- Trở lại trận.
- Chuyển tab trình duyệt.
- Mobile touch.
- Màn hình nhỏ.
- Màn hình desktop.

Đo và ghi nhận âm thanh còn hoạt động sau chuỗi trảm từ.

Kiểm tra asset và hiệu ứng render thực tế, không chỉ đọc code.

## 8. TIÊU CHUẨN HOÀN THÀNH

Không được kết luận đã sửa xong chỉ vì:
- SVG có nhiều path hơn.
- CSS có nhiều hiệu ứng hơn.
- Hình cuộn đổi từ đen sang màu khác.
- Code build thành công.
- Âm thanh chỉ phát được một lần đầu tiên.

Kết quả phải đạt:
- Asset hòa hợp với nền pixel-art.
- Cuộn từ vựng sáng, đẹp và dễ đọc.
- Ma thạch có hình dáng, chất liệu và hiệu ứng vỡ hợp lý.
- HUD thống nhất, không rối.
- Phong cách tiên hiệp cute được thể hiện rõ.
- Nhạc nền hoạt động ổn định.
- Voice hoạt động xuyên suốt gameplay.
- Không làm hỏng tính điểm, lưu game, bàn phím, kỹ năng và boss.

Bắt đầu bằng việc xác định lỗi âm thanh và kiểm toán các asset quan trọng, sau đó sửa, render, kiểm thử và báo cáo kết quả thực tế. Không dừng ở kế hoạch hoặc lời giải thích.
