<!-- User-provided source brief; task status and validation are tracked separately in README.md. -->
# MEOW-CHA — BREAKTHROUGH CHOICE & CULTIVATION SKILL SYSTEM UPGRADE

Repository: Wothing0406/ielts-oasis
Branch: game/meowcha-cultivation

Bạn là Senior Game Systems Designer, Gameplay Engineer và UI/UX Designer chuyên game roguelite + typing education + Xianxia.

Hãy nâng cấp hệ thống chọn Thiên Phú sau khi đột phá cảnh giới thành một hệ thống **CƠ DUYÊN NGỘ ĐẠO + KỸ NĂNG ĐỘT PHÁ** có chiều sâu.

Không chỉ thêm buff số.

Mục tiêu:
- Mỗi lần đột phá tạo ra một lựa chọn đáng cân nhắc.
- Các lựa chọn hình thành build khác nhau.
- Kỹ năng hỗ trợ gameplay nhưng không phá mục tiêu luyện gõ và học từ.
- Không có thiên phú chỉ tồn tại trên UI nhưng không hoạt động trong engine.

---

## I. HỆ THỐNG CHOICE

Sau mỗi lần đột phá cảnh giới:

Hiển thị 3 lựa chọn ngẫu nhiên.

Người chơi chọn đúng 1.

Mỗi lựa chọn thuộc một trong bốn hướng:

### KIẾM ĐẠO
Tăng khả năng tấn công và combo.

Có thể gồm:
- Tăng Tu Vi nhận được.
- Tăng sức mạnh combo.
- Tỷ lệ bạo kích.
- Thưởng khi hoàn thành từ dài.
- Thưởng khi đạt accuracy cao.
- Kiếm khí phụ sau chuỗi gõ đúng.

### HỘ ĐẠO
Tăng khả năng sinh tồn.

Có thể gồm:
- Tăng HP tối đa.
- Hồi HP.
- Hộ thuẫn.
- Giảm sát thương.
- Miễn hình phạt một lần.
- Hồi phục sau một chuỗi từ đúng.

### LINH VỰC
Thay đổi tốc độ và điều kiện chiến trường.

Có thể gồm:
- Làm chậm ma thạch.
- Đóng băng tạm thời.
- Tăng thời gian xử lý từ.
- Giảm tốc độ hazard.
- Tăng thời gian Thiên Kiếp.

### NGỘ ĐẠO
Hỗ trợ việc học từ.

Có thể gồm:
- Cho gợi ý sau nhiều lần sai.
- Tăng thời gian hiển thị nghĩa.
- Phát lại pronunciation.
- Ưu tiên sinh từ yếu.
- Hiển thị loại từ.
- Tăng khả năng xuất hiện từ cần ôn.

Không được tự điền toàn bộ từ thay cho người chơi.

---

## II. CÁC STAT CÓ THỂ NÂNG

Chuẩn hóa hệ thống stat:

maxHp
shieldCharges
scoreMultiplier
comboMultiplier
critChance
slowFactor
mistakeTolerance
meaningDisplayDuration
audioReplayBonus
weakWordWeight
hazardDurationBonus
breakthroughSkillCooldown
breakthroughSkillPower

Không cần hiển thị tên biến kỹ thuật ra UI.

Tên UI phải theo phong cách tu tiên.

Ví dụ:

maxHp → Căn Cốt
shieldCharges → Hộ Thể
scoreMultiplier → Ngộ Tính
critChance → Kiếm Tâm
slowFactor → Linh Vực
mistakeTolerance → Định Tâm

---

## III. KỸ NĂNG ĐỘT PHÁ

Mỗi cảnh giới mở một kỹ năng đặc trưng.

### LUYỆN KHÍ — KIẾM KHÍ HỘ THỂ

Loại: Passive.

Sau mỗi 5 từ hoàn thành liên tiếp không sai:
- Nhận 1 lớp Hộ Thuẫn.
- Tối đa 2 lớp.

Không tự gõ từ.

### TRÚC CƠ — THANH PHONG KIẾM VỰC

Loại: Active.

Khi kích hoạt:
- Giảm tốc độ ma thạch 40%.
- Thời gian cơ bản 6 giây.
- Cooldown 25 giây.

Có thể nâng:
- Thêm thời gian.
- Tăng slow.
- Giảm cooldown.

### KIM ĐAN — KIM ĐAN HỒI NGUYÊN

Loại: Passive + Active.

Passive:
- Mỗi 4 từ đúng liên tiếp hồi 3 HP.

Active:
- Hồi ngay 8 HP.
- Cooldown 35 giây.

Không vượt maxHp.

### NGUYÊN ANH — NGUYÊN ANH ĐỊNH THÂN

Loại: Active.

Khi kích hoạt:
- Đóng băng ma thạch hiện tại 4 giây.
- Phát lại pronunciation nếu có.
- Không tiết lộ toàn bộ đáp án trong AUDIO/CLOZE mode.

Cooldown 30 giây.

### CẢNH GIỚI CAO — VẠN KIẾM QUY TÔNG

Loại: Ultimate.

Điều kiện:
- Combo >= 10 hoặc tích đủ Kiếm Ý.

Hiệu ứng:
- Phóng nhiều phi kiếm.
- Hóa giải hazard hiện tại.
- Tạo hiệu ứng mạnh.
- Không tự hoàn thành từ đang học.
- Không được dùng để gian lận WPM/accuracy.

---

## IV. NÂNG CẤP KỸ NĂNG

Một skill có thể đạt Level 1 → 3.

Ví dụ:

Thanh Phong Kiếm Vực I
- Slow 40%
- 6 giây

Thanh Phong Kiếm Vực II
- Slow 50%
- 7 giây

Thanh Phong Kiếm Vực III
- Slow 55%
- 8 giây
- Cooldown giảm 20%

Khi người chơi đã sở hữu skill, hệ thống choice có thể đưa ra:
- Nâng skill hiện tại.
- Chọn passive mới.
- Chọn một modifier.

Không đưa lại choice vô nghĩa hoặc đã max level.

---

## V. RARITY CƠ DUYÊN

Có thể chia:

PHÀM PHẨM
Buff cơ bản.

LINH PHẨM
Buff tốt hoặc modifier nhỏ.

HUYỀN PHẨM
Thay đổi gameplay đáng kể.

THIÊN PHẨM
Skill hoặc nâng cấp mạnh.

Không biến rarity thành hệ thống trả tiền hoặc gacha.

Rarity chỉ ảnh hưởng xác suất xuất hiện trong một run.

---

## VI. CHỐNG CHOICE VÔ NGHĨA

Trước khi tạo 3 lựa chọn:
- Không cho trùng cùng một talent.
- Không hiện talent đã max.
- Không hiện skill chưa thể kích hoạt.
- Không hiện buff không có effect implementation.
- Ít nhất 2/3 choice phải khác nhóm gameplay.
- Không đưa cả ba lựa chọn đều là tăng damage/score.

Nếu pool quá nhỏ, fallback sang stat upgrade hợp lệ.

---

## VII. UI — CƠ DUYÊN NGỘ ĐẠO

Đổi modal hiện tại thành:

[CƠ DUYÊN NGỘ ĐẠO]

“Đạo tâm khai mở — hãy chọn một con đường.”

Mỗi card hiển thị:
- Pixel-art icon.
- Rarity.
- Tên.
- Loại: Kiếm Đạo / Hộ Đạo / Linh Vực / Ngộ Đạo.
- Mô tả ngắn.
- Giá trị trước → sau nếu là upgrade.
- Tag ACTIVE / PASSIVE nếu cần.

Ví dụ:

THANH PHONG KIẾM VỰC
[HUYỀN PHẨM] [ACTIVE]

Triển khai kiếm vực trong 6 giây.
Ma thạch giảm 40% tốc độ.

Cooldown: 25s

[ LĨNH NGỘ ]

Không sử dụng emoji Unicode hoặc SVG thô cho icon.

Dùng asset pixel-art phù hợp với giao diện game.

---

## VIII. ACTIVE SKILL UI

Trong battle HUD cần một vùng kỹ năng nhỏ.

Desktop:
- 1–3 slot skill.
- Hotkey 1, 2, 3.

Mobile:
- Nút skill đủ lớn để chạm.
- Cooldown radial/progress rõ ràng.

Hiển thị:
- Icon.
- Cooldown.
- Trạng thái ready.
- Charges nếu có.

Không che bàn phím ảo hoặc từ đang gõ.

---

## IX. TÍNH ĐIỂM

Các kỹ năng hỗ trợ không được làm sai dữ liệu học tập.

WPM:
- Chỉ tính ký tự do người chơi tự nhập.

Accuracy:
- Không tính ký tự được hệ thống tự tạo.

Leaderboard:
- Có thể ghi nhận assist level/build.
- Nếu có skill tự động mạnh trong tương lai, tách leaderboard hoặc trừ hệ số.

Ưu tiên công bằng cho typing.

---

## X. SAVE SYSTEM

Lưu:
- unlockedSkills.
- skillLevels.
- selectedTalents.
- passiveModifiers.
- currentCharges.
- progression cần thiết.

Không nhất thiết lưu cooldown đang chạy nếu game bị đóng.

Phải tương thích save cũ.

Nếu save chưa có dữ liệu mới:
- Khởi tạo default.
- Không crash.

---

## XI. BALANCE

Không để một lựa chọn trở thành luôn luôn tốt nhất.

Ví dụ:
- Tăng score phải đổi lại ít survivability.
- Hồi máu không tăng score.
- Hỗ trợ pronunciation không tăng damage.
- Slow mạnh phải có cooldown dài hơn.

Mục tiêu là tạo ít nhất ba kiểu build:

KIẾM TU
Combo + Tu Vi + bạo kích.

HỘ ĐẠO
HP + khiên + hồi phục.

NGỘ ĐẠO
Từ yếu + pronunciation + hỗ trợ ghi nhớ.

Có thể kết hợp hybrid.

---

## XII. KIỂM TRA

Test:
- Nhận choice sau đột phá.
- Không trùng choice.
- Chọn từng loại talent.
- Active skill kích hoạt.
- Cooldown hoạt động.
- Save/load vẫn giữ skill.
- Level-up skill.
- Max-level skill.
- Mobile skill button.
- Không ảnh hưởng bàn phím.
- Không tính sai WPM.
- Không tính sai accuracy.
- Không phá boss.
- Không phá leaderboard.
- Không phá save cũ.

Chỉ kết luận hoàn thành khi từng talent và skill thực sự hoạt động trong gameplay.
