# Hoàn thiện nghĩa từ, kiếm khí và giao diện — 25/10/2026

Phạm vi trực tiếp: bỏ nghĩa chung chung “Từ vựng học thuật”, giữ chữ/IPA/nghĩa
đọc được; đồng bộ các menu theo kiếm bài; làm lại đòn đánh theo ảnh kiếm khí cũ.
Tiếp tục bảo vệ âm thanh, điểm và bản lưu. Nhánh `game/meowcha-cultivation`.

## Công việc và bằng chứng

- [x] Sửa 103 nghĩa theo đúng từ loại trong dữ liệu game; trong đó 99 mục trước
  đây là placeholder. Thêm nghĩa cụ thể cho SINGLE, SQUARE và CHAIR. Không sửa
  Oxford dùng chung của các phần IELTS/vocab khác.
- [x] API chọn một nghĩa/từ loại cụ thể, giữ các nghĩa khác trong `senses`.
  Trình tải và lúc sinh ma thạch đều chuẩn hóa để sửa cả từ cũ trong SRS/save.
- [x] Giữ đủ chữ trên ma thạch, xuống dòng nghĩa và IPA; chặn thẻ từ ở dưới HUD.
  Đàn kiếm bỏ dấu cách kép và chiều cao cũ làm chữ bị ép mất.
- [x] Xóa toàn bộ hàm vẽ kiếm lơ lửng/đường ngắm nét đứt. Dùng beam sheet bốn
  khung hình của từng cảnh giới; đòn thường có kiếm khí, đòn kết từ rộng hơn.
  Giữ projectile, attack pose, muzzle, impact và một lần tính điểm cho mỗi từ.
- [x] Tích hợp khung ngọc/gỗ và mộc bài raster vào modal, các nút phụ, thẻ pháp
  môn/cảnh giới, thiên phú, stat, pause, Phong Thần và HUD. CTA chính vẫn là kiếm.
- [x] Đo lại vị trí nhân vật/điểm xuất kiếm theo chiều cao đàn kiếm và bàn phím.
  320×568 có bàn phím gọn, nhân vật nhỏ hơn và ẩn thoại trang trí để không đè từ.
- [x] Ma thạch bắt đầu ở vị trí thấy được dưới HUD, cùng tọa độ với thẻ từ và điểm
  nổ; bản trước thẻ đã hiện nhưng đá/điểm bắn còn ở ngoài màn hình. Tốc rơi được
  tính theo quãng đường còn lại để màn hình có bàn phím không mất thời gian gõ.
- [x] 59 kiểm thử engine/audio và 15 kiểm thử API đạt trên dữ liệu tạm. Bao gồm
  khôi phục nghĩa cũ theo POS, wrap thẻ hẹp, năm beam, một lần tính điểm và sửa
  DB lặp lại không nhân đôi/không đụng tài khoản, trận, bản lưu.
- [x] Rà sảnh, thiết lập (cả chọn bằng Enter), pause, kho, bảng và chứng đạo;
  320/390, ngang 844 và PC 1280. Ngữ cảnh có bàn phím mở và ngang thấp đã được sửa.
  Chứng đạo hiện đúng 12.345 khi ván mới là 0; sao chép link báo thành công.
  Ảnh/log ở `artifacts/meowcha-qa/` (ngoài Git). Modal chứng đạo nằm ngoài wrapper
  cũng nhận hệ khung mới; các hàng bảng không còn bị flex ép mất.
- [x] Chuỗi 20 từ qua TypingEngine trong trình duyệt: 20 voice hoàn tất, 1 fallback
  MP3/TTS, 0 voice lỗi; hàng chờ rỗng, BGM/context vẫn chạy, RMS khoảng 0,00998.
  Sai phím, khiên, khiên vỡ, đá rơi và hurt có sự kiện riêng; sau va chạm HP 500→492.
- [x] Build cuối đạt (các warning cũ ngoài game vẫn còn), 28 script JS qua syntax,
  diff sạch, skill qua quick_validate; cập nhật bộ nhớ và prompt raster nguyên văn.
- [ ] Commit/push nhánh game, tạo nhánh backup, sao lưu và sửa các dòng placeholder
  trên Linux; triển khai, kiểm tra tài sản public, API, số liệu và trạng thái dịch vụ.

## Dữ liệu và khôi phục

Art mới bằng built-in image_gen: [khung ngọc](../frontend/public/meowcha/assets/ui/jade-frame-v1.png)
và [mộc bài](../frontend/public/meowcha/assets/ui/carved-plaque-v1.png). [Prompt nguyên văn](prompts/meowcha/carved-ui-art.txt).
Tái sử dụng beam sheet/animation có sẵn, không tuyên bố đã tạo clip nhân vật mới.

`backend/game_data/meowcha_meaning_corrections.json` là bộ nghĩa đã rà theo POS.
`tools/meowcha/repair_learning_data.py` tạo dữ liệu game và bảng sửa phía client.
`backend/repair_meowcha_meanings.py --backup <file>` chỉ sửa dòng DB có placeholder,
ghi bản gốc trước bằng chế độ tạo độc quyền, chạy lại sẽ không sửa thêm. Lưu bản
backup bền vững trên máy chủ, ngoài thư mục public/Git. Không reset điểm hoặc save.

## Giới hạn được giữ rõ

Kiểm thử browser dùng fixture SQLite riêng và trình duyệt PC mô phỏng kích thước/
cảm ứng, không phải iOS/Android thật. Audio vẫn là Web Audio tổng hợp và MP3/TTS
có sẵn; không gọi đó là bộ sample nhạc cụ thu âm mới. Các phần mở rộng Tam Pháp,
auth vòng đời và sample trong brief 05–07 tiếp tục nằm ở backlog gốc, không gộp
vào lời xác nhận hoàn thành đợt sửa ảnh hiện tại.
