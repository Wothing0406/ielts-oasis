# MEOW-CHA 20.0 — kết giới và vùng nhân vật

## Thay đổi

- [x] Gỡ outline/box-shadow/border-image kế thừa ở swordIntentBox; không chỉ gỡ
  border. Container giữa không bắt pointer; panel hai bên vẫn tương tác.
- [x] Grid PC dành 272px cho hero, thay khoảng 180px; panel không lấn vào vùng
  nhân vật khi thêm kỹ năng hoặc record học. Mobile giữ progress34px nối phím.
- [x] Rào cao56px PC/44px compact, thanh ngang38% asset đặt đúng defenseY. Toàn
  rào nằm trên hero; không kéo base xuống chân như 17. Hero gap40px, cùng mặt
  phẳng và khoảng gõ ổn định qua resize. Không sinh asset mới.
- [x] Ngưỡng tâm đá = defenseY−40 PC/−27 compact, theo mép dưới sprite đang vẽ.
  Va chạm thật qua main.update trừ HP một lần. Linh Thuẫn tiêu hao trước HP;
  rào cảnh không phải miễn sát thương.
- [x] takeDamage trả damageTaken sau giảm sát thương; floating text và cue dùng
  số thực. Cue mây không được xóa thông báo mất HP của cùng đòn. HUD cập nhật
  ngay khi va chạm; có thuẫn ghi rõ số còn lại, cue mặc định nói đá chạm mất HP.
- [x] Tên và icon pháp bảo riêng hiện gọn trong panel phải PC, lấy asset thật
  theo realm. Mobile không thêm panel này. Artwork nhân vật, projectile, beam,
  muzzle và impact riêng từng cảnh vẫn giữ. Không thêm lại kiếm/đường ngắm cũ.

Pháp bảo là nhận diện lối đánh và bộ hiệu ứng theo cảnh, chưa phải hệ thống đổi
trang bị/inventory hay chỉ số trang bị mới: Thanh Trúc Kiếm, Song Kiếm Bích Ngọc,
Hoàng Kim Trảm Tiên, Cửu Thiên Thần Lôi, Thái Sơ Vô Cực Kiếm.

## Kiểm chứng

- [x] 97/97 Node game/audio/UI/session; 22/22 API SQLite riêng; CSS parse đạt.
- [x] Test mới đi qua main.update/AsteroidManager/GameState thật: có thuẫn giữ
  HP50, thuẫn1→0; hỏa12 giảm50% mất6, thông báo−6; không giảm mất12; không lặp
  sát thương ở update sau. Test geometry kiểm tra rào không cắt idle hero.
- [x] Browser PC1280 và touch mô phỏng320×568. Kim Đan băng: HP200→188; có một
  thuẫn: HP200 giữ nguyên, cue còn0. Không dùng tài khoản production giả.
- [x] Cả năm cảnh đổi tên/icon đúng file; icon tải thật. DOM outline0px,
  shadow none, border-image none; panel trái kết thúc490, phải bắt đầu790,
  hero ở640. Ảnh game cuối cho thấy rào và panel không che nhân vật.
- [ ] Production build, push/backup và đối chiếu Linux/public.

Minh chứng ignored ở `artifacts/meowcha-qa/20.0/`: `battle-desktop-final.png`,
`battle-mobile-final.png`, `hero-clear.png`, `impact-status.json`,
`shield-status.json`, `five-weapons.json`, `dock-dom.json`. Đây là viewport QA,
chưa chứng nhận thiết bị iOS/Android vật lý hoặc hoàn tất toàn bộ roadmap.

## Triển khai

Baseline83bda42. Linux đã giữ backup Git/Docker trước20 và năm runtime MP3 tại
`/home/quang/meowcha-backups/20.0-20261026`. Counts trước: vocab4981, legacy5,
runs12, battle logs3, snapshots2. Cập nhật kết quả sau triển khai ở đây.
