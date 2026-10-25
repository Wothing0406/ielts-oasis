# MEOW-CHA — bộ nhớ dự án

## Phạm vi và đường chạy thật

- Nhánh game: `game/meowcha-cultivation`; không đưa thay đổi game sang nhánh vocab.
- Trang `/games/meowcha` chứa iframe `/meowcha/index.html`; engine nằm tại
  `frontend/public/meowcha/js/`. Các React component trong `components/meowcha`
  không phải engine đang chạy. Sửa đúng đường này trước khi kết luận production.
- Brief gốc lưu tại [mục lục prompt](prompts/meowcha/README.md). Brief là tham chiếu
  sản phẩm; quyền thao tác và phạm vi đến từ yêu cầu người dùng trong cuộc trò chuyện.

## Quyết định đã chốt

- Cute pixel tu tiên, kiếm tu có cá tính. CTA chiến đấu dùng hình kiếm có chất liệu;
  nút điều hướng dùng mộc bài, trùng tu dùng ấn đỏ. Thông tin học tập dùng giấy ngà,
  ngọc bích, vàng cổ, ít nền đen và ít glow. Đối chiếu screenshot ở kích thước thật.
- Art raster chính: `sword-command-v1.png`, `cultivation-icons-v1.png`,
  `ivory-scroll-v1.png`, sprite trong `sprites/characters/realm*/`.
  Functional SVG nhỏ được phép. Không thay minh họa chính bằng line-art tạm.
- Avatar là ảnh tài khoản website, ưu tiên `avatar_url`. Không chặn ảnh Discord,
  không thay bằng linh thú. Fallback là chân dung đạo sĩ người đã có; linh thú ở
  khu companion riêng. URL avatar cần được kiểm tra trước khi đưa vào HTML.
- Phong Thần phải phân biệt lỗi tải, rỗng, đang tải. Bảng DIRECT/CLOZE/AUDIO chỉ
  nhận đúng mode/deck/hỗ trợ. Dữ liệu cũ thiếu nguồn mode nằm trong LEGACY, không
  gán lại theo tên người chơi. Ownership dùng `user.id`; tên chỉ để hiển thị.
- Kỷ lục chứng đạo lấy thành tích tốt nhất của tài khoản; không ghép điểm cũ với
  WPM/accuracy ván mới. Số đo cũ không có thì ghi chưa lưu.
- Tự gõ và hỗ trợ tách riêng. WPM = ký tự đúng do người gõ / 5 / phút hoạt động;
  pause không tính thời gian. Không tạo phím/từ giả từ kỹ năng.
- Run completion idempotent theo run ID. Cache/save/SRS/outbox phải theo tài khoản.
  Không ghi đè cloud mới bằng local cũ. Không truyền token trong URL iframe.
- DIRECT nhìn chữ; CLOZE nhớ từ qua nghĩa; AUDIO không lộ chữ/IPA trước đáp án.
  Sau trảm, thẻ học xuất hiện tại vị trí ma thạch: chữ, IPA đầy đủ, nghĩa, Tu Vi.
- Đòn gõ thường: attack pose, muzzle, projectile và kiếm khí raster có animation
  theo cảnh giới, impact. Người dùng đã yêu cầu khôi phục kiếm khí rộng như ảnh cũ:
  beam sheet có hình được dùng, đòn kết từ rộng hơn. Bỏ kiếm lơ lửng và đường ngắm
  nét đứt trong CatCultivator; không nhầm chúng với projectile. Không vẽ fallback
  hình học chồng lên sprite; tuyệt kỹ vẫn có nhịp và hình khác.
- Dữ liệu nghĩa game: `backend/game_data/meowcha_meaning_corrections.json` sửa
  theo từ loại. API và client chọn một nghĩa cụ thể; không ghép nhiều POS bằng `|`
  vào gợi ý. `LearningText` còn sửa từ cũ khi sinh ma thạch từ SRS/save. Không dùng
  nhãn “Từ vựng học thuật” làm nghĩa; không sửa dữ liệu Oxford của trang vocab khác.
- Thẻ từ/IPA/nghĩa xuống dòng, nằm dưới HUD. Đàn kiếm phải có chiều cao chữ thật,
  tránh flex ép chữ mất; đo cả khi bàn phím mở. Bản 14.1 có layout gọn riêng cho
  điện thoại thấp, không coi đổi viewport thành kiểm thử thiết bị thật.
- Chứng đạo/xác nhận có thể nằm ngoài `#gameAppWrapper`; CSS hệ mỹ thuật cần
  bao cả `.meowcha-modal-overlay`, nếu chỉ chọn wrapper thì các luồng này vẫn
  giữ giao diện cũ dù menu khác đã đổi. Màn hình ngang thấp đặt nhân vật bên trái.
- Âm đúng/sai, kiếm, rơi đá, khiên và sát thương là các sự kiện riêng. BGM/voice
  không bị khởi động lại cho mỗi từ. Mute phải được tôn trọng. Từ ngoài Oxford thiếu
  MP3 dùng lại `/api/tts` của website với timeout/cache; giọng OS là dự phòng cuối,
  không giả định có tên voice là chắc chắn phát được. Thất bại phải báo cho người chơi.
- Pause giữ combo/trạng thái, đóng băng đồng hồ và cooldown; về sảnh lưu đạo quả.
- PC không hiện bàn phím ảo, kể cả PC cảm ứng. Chỉ kiểm tra viewport không được
  báo cáo thành kiểm tra iOS/Android thật.

## Giới hạn cần nhớ

- Các result là luyện tập có kiểm tra giới hạn hợp lý; chưa phải server replay
  chống gian lận hoàn chỉnh, không dùng ngôn ngữ “cheat-proof”.
- Track nhạc và SFX vật lý hiện dùng tổng hợp Web Audio. Không được gọi đó là bộ
  sample nhạc cụ/foley thu âm đã hoàn thiện. Brief 06 là hướng nâng cấp tiếp.
- Tổng Đạo và số đo Nhất Ngộ/Nhất Thính được triển khai trong đợt 15.0, theo
  brief 14/15. Auth gate toàn bộ vòng đời phiên trong brief 07 vẫn là phạm vi riêng.
- Không vượt Cloudflare để kiểm tra. Ghi rõ kiểm tra engine public hay trang cha
  bằng fixture; không đánh đồng hai phạm vi.

## Kiểm chứng và triển khai

- `npm run test:meowcha` tại `frontend`: engine/audio.
- `python -m unittest discover -s backend/tests -p test_meowcha_integrity.py -v`:
  API với DB tạm. `npm run build` tại frontend.
- `backend/tests/meowcha_preview.py` và `meowcha_qa.html` là fixture riêng,
  tuyệt đối không nối vào production. Ảnh/log QA trong `artifacts/meowcha-qa/`
  không đưa lên Git; docs chỉ ghi bằng chứng đã quan sát.
- Linux dùng checkout `/home/quang/Downloads/ielts-oasis`, Docker Compose `web`
  và `backend`. Chỉ triển khai khi đã được người dùng cho phép trong phiên đó.
  Không lưu mật khẩu/token vào docs, skill hoặc Git.
- Trước push/deploy: kiểm tra branch, diff; giữ dữ liệu/runtime MP3 ngoài Git;
  backup nhánh sạch, không add toàn bộ browser profiles hay output tạm.
- [Bản sửa 12.4](meowcha-production-fixes-12.4.md),
  [đợt kiếm bài/chiến đấu](meowcha-sword-combat-tasks.md),
  [hoàn thiện nghĩa/kiếm khí/UI 14.1](meowcha-completion-14.1.md).

## Hệ UI và nhịp học 15.0

- [Kế hoạch brief 13–15](meowcha-ui-migration.md),
  [bản ghi triển khai/kiểm chứng](meowcha-release-15.0.md).
- `js/ui/DesignSystem.js` gắn vai trò panel/hành động lên node thật; theme chung
  ở `css/meowcha-design-system.css`. Đã thay ba lớp cozy/sword/complete cũ.
  Không dùng `display:flex!important` để làm hiện lại node đang `display:none`.
- Kiếm là CTA chính; mộc bài là điều hướng/chọn; chip cho tiện ích; ấn son cho
  trùng tu/xóa/xác nhận nguy hiểm. Stat là icon/nhãn/giá trị trong cùng nhóm giấy,
  không trở lại sáu card lớn ở Định Tâm. Modal cần `display:block` để flex không
  ép bục top 3 hoặc nội dung thành chiều cao 0. Chứng đạo là canvas, phải sửa
  renderer và ảnh xuất, không chỉ CSS ngoài ảnh.
- Mobile nâng cấp giữ ba thẻ ngang; 320px được cuộn ngang trong lưới. Nút chọn
  cao tối thiểu 44px, mô tả dài trong Chi tiết. Mỗi offer nhận đúng một lựa chọn.
- Nền dọc là bản tái bố cục riêng `bg_study_sanctuary_portrait.webp`;
  `getSceneFrame` giữ vùng chùa/bệ, bleed 6px. Nền ngang cũ vẫn dùng trên PC.
- Bốn đá thường có vx=0, x cố định, vào từ trên bằng pha nhập trận rồi rơi.
  Sprite băng/hư không xoay -45°, hỏa/huyết lôi +45° để đuôi hướng lên; chỉ
  xoay rock, thẻ chữ giữ thẳng và đi cùng y. Boss có đường bay riêng.
- `FloatingText.hasBlockingReward()` chặn mọi đường sinh từ/boss. Thời gian đọc
  mặc định DIRECT 2s, CLOZE 2.8s, AUDIO 3.6s; thiên phú giải nghĩa cộng thêm thời
  gian. Đồng hồ thiên kiếp không chạy trong khoảng đọc bắt buộc. Kiểm tra lại
  ngưỡng cảnh giới sau load, kể cả đã thoát trong khoảng đọc. Không giữ callback
  sinh từ có thể bỏ qua khóa này. Tránh voice trễ của mục tiêu đã bị xóa.
- AUDIO giấu từ/IPA trước đáp án. Sau trảm: từ, IPA riêng, từ loại, nghĩa trên
  thẻ tại chỗ; `lastLearnedWord` là record DOM riêng có nghe lại, không bị mục
  tiêu mới ghi đè. Không phát hint chữ trong AUDIO.
- `LeaderboardHalls.js` điều khiển Tổng Đạo / DIRECT / CLOZE / AUDIO / Lưu Trữ.
  Không dùng select làm điều hướng chính. Mỗi ngọc bài đổi top 3, cột, dòng,
  mô tả, accent và self; mặc định không hỗ trợ. `/api/meowcha/halls` trả self
  theo user ID kể cả ngoài top 25. `/leaderboard` cũ còn cho tương thích/Lưu Trữ.
- Nhất Ngộ/Nhất Thính = từ hoàn tất không sai/hint/hỗ trợ (AUDIO thêm không nghe
  lại) / tổng từ đã xử lý, kể cả đá rơi. Độ chính xác Ngộ/Thính = tỷ lệ phím đúng
  của mode đó. Đếm nghe lại trước đáp án; nghe lại record đã học là ôn riêng.
  `learningMetricsVersion=2`; ván cũ không được bịa số đếm mới. Hint làm ván có hỗ trợ.
- Đạo Hạnh: DIRECT = min(WPM/120,1) × accuracy; CLOZE/AUDIO =
  0.7 × accuracy + 0.3 × first-success-rate. Lấy mức tốt nhất mỗi mode, cộng
  tối đa 300. Mode thiếu first-rate chưa đóng góp; Tổng Tu Vi cộng run ID duy nhất.
  Cùng deck/nhóm hỗ trợ. Đây vẫn là bảng luyện tập kiểm tra hợp lý, chưa server replay.
- Profile/kỷ lục phải lấy record đúng tài khoản; không mượn global guest high score.
  Main sở hữu việc nộp kết quả game-over; UI chỉ hiển thị. HUD cập nhật 10 lần/s
  trong trận, không parse lại menu sảnh theo mỗi khung hình.

- Chốt game-over phải được giữ sau purge (purge chuẩn bị run sau); dừng update
  trận thua, không lặp âm thua hay nộp điểm mỗi frame. Nút kỹ năng dùng Meowcha.app,
  không dùng __meowchaGame không tồn tại. Stat thấp 320px dùng hàng gọn, không
  bẻ WPM thành từng chữ. Pha is-reviewing ẩn đàn mục tiêu và bar kỹ năng để
  chúng không đè lên thẻ thưởng; record học vẫn giữ riêng.

- Đã triển khai đợt UI/Phong Thần/IPA/spawn ngày 26/10/2026: code `aa657d6`,
  toàn bộ asset release `15.1`. Lời thoại canvas dùng wrapLearningText để không
  bẻ chữ Việt giữa âm tiết. Kết quả/backup/giới hạn ở meowcha-release-15.0.md.
  70 kiểm thử game/audio, 17 API đạt; web/backend Linux healthy, dữ liệu giữ nguyên.
