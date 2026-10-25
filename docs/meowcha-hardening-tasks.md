# Meow-Cha: gameplay, learning and UI hardening

Target branch: `game/meowcha-cultivation`. Runtime: `/games/meowcha` →
`/meowcha/index.html` → `js/main.js` (the React legacy game is not this runtime).

## Work breakdown

- [x] 0. Preserve the current checkout; recover the latest game source on the game branch; exclude browser profiles and scratch output from commits.
- [x] 1. Unify physical/virtual input; define Space, Backspace and Tab; implement and test every talent; separate human typing from assistance.
- [x] 2. Introduce authenticated run identities, bounded server validation, idempotent leaderboard/profile updates and a backward-compatible migration. Preserve independent save modes, remaining shields and typing clocks; avoid repeated network writes.
- [x] 3. Normalize cultivation terminology, the five realms and the WPM label across runtime screens and exports.
- [x] 4. Schedule local word reviews with due dates/history/mastery; retain source CEFR metadata; give synonym bosses a specific sense and example; report human typing statistics.
- [x] 5. Audit and reuse existing art for navigation, functional icons, cultivation platform, formation and buttons. Verify readability and touch layout at small portrait/landscape sizes and desktop.
- [x] 6. Add meaningful gameplay/API regression tests; run build/lint; inspect real browser renders, asset failures and certificate export.
- [x] 7. Record results and remaining limitations; commit and push the game branch plus a clean backup branch.

## Art direction

Keep the existing pixel environment and character sprites. Use the established dark
wood, cinnabar, antique gold and jade palette. Functional silhouettes may remain
vector; central decorative art must reuse suitable authored assets. Inspect a
representative lobby/setup screen before extending the treatment to other screens.
Do not claim custom illustration work or mobile-device coverage without evidence.

## Recovery notes

The pre-repair source is retained locally at
`codex/backup-before-meowcha-repair-20261024` (`a3072e8`). The mixed snapshot
`9cbf586` includes 8,691 scratch/profile files. Those local files must remain on disk,
but must not be ancestors of the recovered game commits or uploaded backup.
The last vocabulary-only commit before the recent game edits is `b5aa5ce`;
the earlier response's `e96608e` reference was incorrect.

## Đợt hoàn thiện hai prompt — 25/10/2026

Theo dõi riêng trong [docs/prompts/meowcha/README.md](prompts/meowcha/README.md).
Bản trước đã dùng lại một số asset và bổ sung SVG; nhận định cũ “100% vector
placeholders replaced” không chính xác và được thay bằng phạm vi thực tế dưới đây.

- 35/35 ca kiểm thử engine/audio đạt. Bao gồm context gián đoạn, mute, hàng đợi
  20 voice, cơ duyên hết cấp, kỹ năng thật, bạo kích Tu Vi và thống kê tự gõ.
- 10/10 ca kiểm thử API dữ liệu đạt với cơ sở dữ liệu thử nghiệm.
- Next.js build thành công, có cảnh báo sẵn có ngoài phạm vi thay đổi.
- Trình duyệt thật: 20 từ trảm qua TypingEngine, 20 voice hoàn tất, 1 lần dùng
  giọng dự phòng, không voice thất bại, BGM còn chạy.
- Đã thấy ba thẻ cơ duyên dùng icon pixel; chọn Kim Đan, tải lại vẫn giữ cấp I,
  kích hoạt hồi 8 HP và hiển thị hồi chiêu/progress từ 35 giây.
- Tạo mới giấy tiên và atlas tám icon pixel; giữ bốn sprite nguyên tố có chất
  lượng tốt. SVG chức năng và một phần trang trí khung vẫn được giữ.
- PC ẩn bàn phím, kể cả máy Windows cảm ứng; sửa khung trận bị cuộn lệch.
- Kiểm tra cảm ứng bằng fixture và nhiều kích thước; chưa kiểm tra máy iOS hoặc
  Android thật. Trạng thái âm thanh không chứng minh chất lượng loa của thiết bị.

Git/deploy của đợt này được cập nhật trong tài liệu prompt sau khi xác minh xong.
