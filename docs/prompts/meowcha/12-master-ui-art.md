# MASTER UI/UX + ART DIRECTION REFACTOR — MEOW-CHA TRẢ ĐẠO

## VAI TRÒ

Bạn là Senior Game UI/UX Designer, Art Director chuyên game 2D Chinese Xianxia Fantasy, Game Asset Artist và Senior Frontend Engineer.

Bạn phải kiểm tra, sửa và hoàn thiện giao diện trực tiếp trong codebase hiện tại. Đây không phải nhiệm vụ chỉ đổi màu CSS hoặc thêm hiệu ứng trang trí.

Mục tiêu: đưa MEOW-CHA TRẢ ĐẠO từ giao diện có nhiều component web được trang trí theo phong cách tiên hiệp thành một sản phẩm game có hệ thống mỹ thuật thống nhất, asset chỉn chu và chất lượng hoàn thiện cao.

Ảnh chụp màn hình tôi cung cấp là hiện trạng cần cải thiện, KHÔNG phải chuẩn chất lượng cuối cùng.

## I. ART DIRECTION — ĐỊNH HƯỚNG MỸ THUẬT

Phong cách chính:

Premium Chinese Xianxia Fantasy, kết hợp môi trường pixel-art Á Đông với giao diện RPG được thiết kế chuyên nghiệp.

Giữ lại những điểm đang có giá trị:
- Bối cảnh sơn môn, núi bay, tầng mây, đèn lồng, cây hoa và bầu trời đêm.
- Nhân vật tu tiên nhỏ, kiếm bay, linh thú và các chi tiết nhận diện của MEOW-CHA.
- Bảng màu đỏ son, vàng kim cổ, nền tối và ngọc bích.
- Không khí tu luyện, pháp môn, độ kiếp, bảng phong thần và hệ thống thành tích.

Không được thay đổi toàn bộ phong cách thành sci-fi, cyberpunk, dashboard SaaS hoặc một giao diện web hiện đại không còn bản sắc tiên hiệp.

### Quyết định quan trọng về phong cách

Nền hiện tại có đặc trưng pixel-art. Hãy kiểm tra sprite thực tế trước khi lựa chọn cách xử lý.

Ưu tiên một trong hai hướng:
A. Giữ pixel-art làm ngôn ngữ tạo hình chính, kết hợp UI fantasy được trau chuốt nhưng vẫn tương thích với sprite.
B. Nếu dự án đã chủ ý sử dụng sprite HD, cho phép kết hợp pixel-art với UI HD nhưng phải có quy tắc rõ ràng về độ nét, tỷ lệ chi tiết, ánh sáng và chất liệu.

Không tự ý upscale sprite pixel-art bằng blur hoặc filter khiến chúng nhòe. Không dùng hiệu ứng glow để che khuyết điểm của asset.

## II. P0 — KIỂM TOÁN VÀ LOẠI BỎ PLACEHOLDER

Kiểm tra tất cả ảnh và icon đang được dùng trong:
- Màn hình chính.
- HUD nhân vật và tài nguyên.
- Màn hình chọn pháp môn.
- Kho đan dược.
- Bảng phong thần.
- Thẻ chứng đạo, thành tích và ảnh xuất PNG.
- Popup, tooltip, modal và các màn hình phụ.

Đặc biệt kiểm tra:
1. Avatar rỗng hoặc vòng tròn không có hình ảnh.
2. Avatar hiển thị hình ảnh không đúng loại, chẳng hạn ảnh tài liệu hoặc ảnh chụp giao diện.
3. Icon Unicode hoặc emoji đang được dùng thay cho asset quan trọng.
4. Sprite có viền trắng, halo, nền thừa, bị méo hoặc bị cắt.
5. Icon có phong cách khác nhau trong cùng một nhóm.
6. Các SVG có đường nét sơ sài, hình học vô nghĩa, path lỗi hoặc trông như bản phác thảo.
7. Asset tải lỗi hoặc đường dẫn không tồn tại.
8. Các chi tiết trang trí bị lặp lại máy móc, không có ý nghĩa mỹ thuật.

Không chỉ tạo danh sách lỗi rồi dừng lại. Hãy sửa và thay thế các thành phần có thể xử lý an toàn trong phạm vi dự án.

### Quy tắc fallback

Nếu người chơi chưa có avatar, hiển thị một avatar mặc định được thiết kế có chủ đích theo phong cách game, ví dụ huy hiệu tu sĩ, ngọc bội hoặc chân dung silhouette.

Nếu chưa có asset tương ứng, dùng fallback đẹp, nhất quán và dễ nhận biết. Không dùng vòng tròn rỗng, ảnh ngẫu nhiên hoặc hình tài liệu để lấp chỗ trống.

Không được tự tạo ảnh người chơi giả rồi hiển thị như ảnh thật.

## III. CHẤT LƯỢNG SVG, SPRITE VÀ DECOR

Đây là yêu cầu trọng tâm.

Tuyệt đối không coi một SVG đơn giản là asset mỹ thuật hoàn chỉnh chỉ vì nó render được.

Không dùng các hình chữ nhật, đường chéo, path ngẫu nhiên, polygon hoặc vài đường vàng để giả lập một khung tiên hiệp cao cấp.

### SVG phải đạt các tiêu chuẩn

- Silhouette rõ ràng, có chủ đích và nhận diện được.
- Đường cong mượt, sạch, không có điểm gãy bất thường.
- Độ dày nét nhất quán theo từng nhóm thành phần.
- Hoa văn đối xứng hợp lý, không lặp máy móc.
- Có phân cấp giữa viền chính, viền phụ và họa tiết.
- Các đầu nối, góc khung và chi tiết trang trí được xử lý hoàn chỉnh.
- Không có path thừa, nét chồng chéo, đường hở ngoài ý muốn hoặc các chi tiết bị cắt.
- Tương phản và độ dày nét phù hợp với kích thước sử dụng thật.

Với panel phức tạp, ưu tiên asset được thiết kế chuyên dụng, SVG có độ chi tiết thực sự hoặc hình ảnh raster chất lượng cao.

Với icon chức năng, ưu tiên bộ icon nhất quán. Với linh thú, nhân vật, pháp bảo, đan dược và vật phẩm, ưu tiên sprite hoặc illustration có thiết kế riêng.

Không bắt buộc mọi tài sản phải là SVG. Hãy chọn định dạng phù hợp với bản chất của hình ảnh.

### Không được làm

- Vẽ một đường vàng bao quanh rồi tuyên bố đã nâng cấp khung.
- Thêm hàng loạt box-shadow và glow mà không cải thiện chất lượng asset.
- Dùng emoji Unicode phóng lớn cho các vật phẩm quan trọng.
- Dùng một icon chung cho kiếm, pháp môn, đan dược và thành tích.
- Tạo họa tiết không liên quan đến nội dung chỉ để lấp khoảng trống.
- Tạo SVG quá phức tạp nhưng khó đọc khi thu nhỏ.

## IV. DESIGN SYSTEM DÙNG CHUNG CHO TOÀN GAME

Tạo hoặc chuẩn hóa các design token và component dùng chung, phù hợp với kiến trúc hiện tại.

### Bảng màu cơ sở

- Background: #100D12.
- Dark panel: #281711.
- Crimson: #761D20.
- Antique gold: #D4A849.
- Highlight gold: #FFE49A.
- Jade green: #27685D.
- Primary text: màu kem ngà có độ tương phản tốt.
- Secondary text: màu trung tính sáng hơn nền nhưng không cạnh tranh với tiêu đề.

Có thể điều chỉnh màu dựa trên asset thực tế. Không bắt buộc mọi màn hình đều phải dùng tất cả màu.

Quy tắc:
- Vàng sáng chỉ dùng cho điểm nhấn.
- Màu đỏ dùng có chủ đích cho hành động quan trọng hoặc nguy hiểm.
- Màu xanh ngọc dành cho trạng thái tích cực, tu luyện hoặc hành động chính phù hợp.
- Không để mọi thành phần cùng phát sáng.
- Không sử dụng quá nhiều màu accent trong cùng một khu vực.

### Panel và modal

Thiết lập một cấu trúc panel thống nhất:
1. Nền có màu và chất liệu phù hợp.
2. Viền chính.
3. Chi tiết góc có thiết kế hoàn chỉnh.
4. Hoa văn phụ có mật độ vừa phải.
5. Vùng nội dung đủ thoáng.
6. Bóng đổ hoặc ánh sáng chỉ khi cần phân lớp.

Không sử dụng nhiều lớp viền giống nhau chỉ để tạo cảm giác cầu kỳ.

Dùng cùng một quy tắc cho bán kính góc, khoảng cách nội dung, độ dày viền, tiêu đề, nút đóng và trạng thái tương tác.

Với khung trang trí phức tạp có kích thước thay đổi, cân nhắc nine-slice hoặc kỹ thuật tương đương để không làm méo hoa văn góc.

### Nút bấm

Thiết kế thành các nhóm rõ ràng:
- Primary action.
- Secondary action.
- Destructive action.
- Disabled action.
- Selected state.

Mỗi nút phải có trạng thái mặc định, hover, pressed, focus nếu phù hợp và disabled.

Không sử dụng cùng một kiểu nút cho mọi chức năng rồi chỉ đổi màu.

### Typography

- Sử dụng font có hỗ trợ tiếng Việt đầy đủ.
- Tiêu đề, tên nhân vật, nội dung, chỉ số và trạng thái phải có cấp bậc rõ ràng.
- Giảm chữ in hoa khi không cần thiết.
- Hạn chế text-shadow, stroke và glow quanh chữ.
- Không dùng quá nhiều font trong cùng một màn hình.
- Căn chỉnh chỉ số và số liệu theo cột.
- Không để ký hiệu trang trí chen vào nội dung hoặc gây nhầm lẫn với chữ thật.

## V. FIX THEO TỪNG MÀN HÌNH

### A. Màn hình chính

Giữ bối cảnh sơn môn và nhân vật nếu asset hiện tại đạt chất lượng.

Sửa:
- HUD góc trên trái và phải để chúng thuộc về cùng thế giới mỹ thuật với nền.
- Vòng trận pháp và bệ đứng của nhân vật.
- Thanh trạng thái, thông tin nhân vật và tài nguyên.
- Các nút chính và phụ.
- Vị trí, kích thước và độ nổi của các vật trang trí.

Không để HUD che nhân vật hoặc các điểm quan trọng của cảnh.

Nền có thể được giảm độ sáng hoặc làm mờ có kiểm soát khi cần ưu tiên nội dung, nhưng không được blur toàn bộ cảnh một cách máy móc.

### B. Màn hình chọn pháp môn

- Đồng bộ icon pháp môn về độ chi tiết, tỷ lệ và phong cách.
- Làm rõ pháp môn được chọn bằng một hệ thống trạng thái nhất quán.
- Cải thiện khoảng cách giữa tiêu đề, thẻ pháp môn, cấp độ tu luyện, thông tin trận đấu và nút bắt đầu.
- Giảm các phù chú trang trí lặp lại hoặc không có ý nghĩa.
- Không để glow che nội dung hoặc làm mờ đường nét.

### C. Kho đan dược
-thêm nút chuyển qua trang khác để xem đầy đủ kho oxford

- Giữ bố cục tra cứu thuận tiện.
- Giảm đường viền lồng nhau.
- Chuẩn hóa card, tên từ, phiên âm, nghĩa và nút phát âm.
- Phân biệt trạng thái được chọn mà không cần viền sáng quá mức.
- Giữ khả năng cuộn và tương tác hiện tại.

Không để mỹ thuật làm giảm mật độ thông tin hữu ích hoặc khả năng tra cứu.

### D. Bảng phong thần

- Thiết kế avatar fallback có chủ đích.
- Tạo huy hiệu hạng nhất, nhì, ba và các hạng còn lại thành một bộ nhất quán.
- Căn chỉnh điểm, cảnh giới, số trảm và tốc độ tu luyện theo cột.
- Xử lý tên dài bằng truncate có ellipsis và tooltip khi phù hợp.
- Cải thiện phân cấp thị giác giữa top 3 và các hàng khác.
- Sửa khu vực hồ sơ người chơi phía dưới để không bị rời rạc.

Không dùng hình ảnh ngẫu nhiên hoặc ảnh tài liệu làm avatar.

### E. Thẻ chứng đạo và thành tích

Thiết kế như một sản phẩm đồ họa hoàn chỉnh.

Phân vùng:
- Khung chứng thư.
- Danh tính người chơi.
- Cảnh giới.
- Chỉ số thành tích chính.
- Nhân vật hoặc biểu tượng đại diện.
- Họa tiết góc và chi tiết nhận diện game.

Giảm các thành phần trang trí cạnh tranh nhau. Không để chữ quá nhỏ hoặc nhiều màu làm mất điểm tập trung.

Kiểm tra riêng kết quả xuất PNG, đảm bảo font, sprite, hiệu ứng, màu sắc và bố cục được giữ nguyên.

## VI. NGUYÊN TẮC THIẾT KẾ

Không làm giao diện đẹp bằng cách tăng số lượng chi tiết.

Ưu tiên:
- Chất lượng asset hơn số lượng asset.
- Silhouette rõ hơn họa tiết ngẫu nhiên.
- Phân cấp thị giác hơn glow.
- Khoảng trống hợp lý hơn việc lấp đầy mọi góc.
- Tính nhất quán hơn hiệu ứng riêng lẻ.
- Khả năng đọc hơn trang trí.
- Chất liệu được xử lý tốt hơn gradient mặc định.

Mỗi chi tiết trang trí phải trả lời được ít nhất một câu hỏi:
1. Nó có giúp nhận diện thế giới tiên hiệp không?
2. Nó có hỗ trợ phân cấp nội dung không?
3. Nó có làm tăng chất lượng mỹ thuật mà không gây nhiễu không?

Nếu không, hãy cân nhắc loại bỏ.

## VII. QUY TRÌNH THỰC HIỆN

Bước 1: Kiểm tra framework, cấu trúc dự án, hệ thống component, các thư viện, asset và logic đang có.

Bước 2: Xác định chính xác component và file cần sửa. Không viết lại dự án từ đầu.

Bước 3: Lập danh sách asset hiện có, asset cần thay thế và asset cần tạo mới.

Bước 4: Xây dựng một bộ design token và component mẫu trước. Thử nghiệm trên một màn hình đại diện, sau đó mới áp dụng rộng hơn.

Bước 5: Sửa trực tiếp codebase, giữ nguyên logic nghiệp vụ, dữ liệu, API, lưu trữ và tương tác đang hoạt động.

Bước 6: Chạy ứng dụng và kiểm tra kết quả render thực tế. Nếu có công cụ browser hoặc screenshot, hãy sử dụng để đối chiếu trước và sau.

Bước 7: Kiểm tra console, asset lỗi, trạng thái tải, responsive, cuộn, cắt chữ, đường viền, độ nét sprite và khả năng xuất PNG.

Bước 8: Tiếp tục chỉnh sửa những phần còn lỗi. Không kết thúc chỉ vì code đã biên dịch thành công.

Nếu không có công cụ tạo asset đồ họa chuyên dụng, hãy tận dụng asset phù hợp đã có hoặc tạo fallback có chủ đích. Nêu rõ những asset nào cần được thiết kế riêng thay vì giả vờ rằng SVG sơ sài đã đạt chuẩn.

## VIII. TIÊU CHUẨN NGHIỆM THU

Chỉ coi nhiệm vụ hoàn thành khi:

- Các màn hình có cùng ngôn ngữ mỹ thuật.
- Không còn avatar rỗng hoặc placeholder gây hiểu nhầm trong các trạng thái bình thường.
- Icon quan trọng không còn trộn lẫn emoji, SVG sơ sài và sprite khác phong cách.
- Không có đường nét thừa, khung méo hoặc hoa văn chưa hoàn thiện.
- Typography rõ ràng và dễ đọc.
- Các nút và modal có trạng thái nhất quán.
- Giao diện vẫn đúng chức năng.
- Ảnh xuất ra đạt chất lượng.
- Các lỗi được xác minh bằng kết quả render, không chỉ bằng việc đọc code.

Trước khi kết thúc, hãy báo cáo:
1. Những màn hình đã được sửa.
2. Những asset đã thay thế hoặc tạo mới.
3. Những lỗi đã xác minh và xử lý.
4. Những asset còn thiếu cần được thiết kế riêng.
5. Các kiểm tra đã chạy và kết quả.
6. Những giới hạn còn tồn tại.

Bắt đầu bằng việc kiểm tra codebase và asset thực tế, sau đó triển khai từng nhóm theo thứ tự ưu tiên. Không chỉ đưa ra kế hoạch rồi dừng lại.
