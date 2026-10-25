# MEOW-CHA — TAM PHÁP ĐỒNG TU + AUDIO IPA + MULTI-MODE LEADERBOARD

Repository: Wothing0406/ielts-oasis
Branch: game/meowcha-cultivation

Bạn là Senior Game Systems Designer, Educational Game Designer, Backend Engineer và Xianxia UI Designer.

Hãy nâng cấp ba pháp môn DIRECT / CLOZE / AUDIO thành ba con đường tu luyện có mục tiêu học tập, chỉ số và bảng xếp hạng riêng.

Không chỉ đổi tên UI.

---

## I. BA PHÁP MÔN PHẢI THỰC SỰ KHÁC NHAU

### 1. TRỰC DIỆN TRẢM MA — DIRECT

Mục tiêu:
- phản xạ nhìn từ
- chính tả
- typing speed
- accuracy

Trước khi trả lời hiển thị:
- English word
- IPA
- word type nếu phù hợp

Sau khi trảm:
- word
- IPA
- nghĩa
- Tu Vi nhận được

Chỉ số quan trọng:
- WPM
- Accuracy
- Max Combo
- Words Completed
- Perfect Streak

---

### 2. NGỘ ĐẠO THÔNG LINH — CLOZE

Mục tiêu:
- nhớ từ dựa trên nghĩa
- recall spelling
- vocabulary retention

Trước khi trả lời:
- nghĩa tiếng Việt
- word type
- số ký tự
- hint theo luật hiện tại

KHÔNG hiển thị toàn bộ IPA trước khi người chơi trả lời nếu IPA có thể tiết lộ đáp án quá dễ.

Sau khi hoàn thành:
- English word
- IPA đầy đủ
- word type
- nghĩa
- audio pronunciation

Thêm metric:

FIRST_RECALL
= đoán đúng mà không dùng hint đáng kể.

HINT_USED
= số lần cần gợi ý.

RECALL_ACCURACY
= khả năng nhớ từ.

Tên hiển thị theo lore:
- Nhất Ngộ
- Linh Quang
- Ngộ Tính

---

### 3. THÍNH LÔI BIỆN ÂM — AUDIO

Đây là phần cần sửa quan trọng.

Trước khi người chơi trả lời:

KHÔNG hiển thị:
- English word
- IPA đầy đủ

Chỉ hiển thị:
- nút nghe
- số ký tự nếu difficulty cho phép
- loại từ nếu thiết kế difficulty cho phép

Phát audio ngay khi ma thạch xuất hiện.

Có nút:
[ NGHE LẠI ]

Sau khi người chơi gõ đúng và ma thạch vỡ:

BẮT BUỘC hiển thị reward card:

EIGHT
/eɪt/
number
số tám

và nút nghe lại.

Hiện tại phần word burst / cuộn trục sau khi nổ đang thiếu hoặc chưa nhấn mạnh IPA trong AUDIO mode. Sửa để IPA luôn xuất hiện sau khi hoàn thành từ.

Không được hiển thị IPA trước khi trả lời trong AUDIO mode vì sẽ làm giảm giá trị bài luyện nghe.

---

## II. REDESIGN WORD REVEAL AFTER ASTEROID EXPLOSION

Không dùng cuộn trục đen hiện tại.

Sau khi hoàn thành từ:

MA THẠCH
→ nứt
→ vỡ pixel
→ linh khí phát sáng
→ reward card / ngọc giản nhỏ xuất hiện

Reward card gồm:

WORD
IPA
WORD TYPE
VIETNAMESE MEANING

Trong AUDIO:
thêm icon nghe lại.

Trong CLOZE:
có thể đánh dấu:
[ NHẤT NGỘ ]
nếu không cần hint.

Trong DIRECT:
có thể đánh dấu:
[ LIÊN TRẢM ]
nếu combo cao.

Reward card dùng parchment cream / jade / antique gold.

Không quá tối.
Không giống popup dashboard hiện đại.

---

## III. THÍNH ÂM METRICS

Thêm:

audioReplayCount
audioFirstTryCorrect
audioWordsCompleted
audioFirstListenRate

Quy tắc:

Nghe đúng mà không replay:
NHẤT THÍNH

Replay không được tính là lỗi accuracy.

Không spam thưởng bằng việc replay.

Có thể dùng multiplier:

0 replay:
x1.20 hoặc x1.25 Tu Vi

1 replay:
x1.00

2+ replay:
x0.85

Giữ balance hợp lý.

Tên hiển thị:

NHẤT THÍNH
= nghe đúng ngay lần đầu.

THÍNH LỰC
= first-listen accuracy.

Không dùng tên kỹ thuật trong UI.

---

## IV. CLOZE METRICS

Thêm:

clozeFirstRecall
clozeHintsUsed
clozeWordsCompleted
clozeRecallRate

Tên hiển thị:

NGỘ TÍNH
= recall accuracy.

NHẤT NGỘ
= nhớ đúng không cần hint.

---

## V. DIRECT METRICS

Giữ:
- WPM
- Accuracy
- Max Combo

Thêm:
- Perfect Streak
- Words Completed

Tên lore:
- Kiếm Tốc
- Kiếm Chuẩn
- Liên Trảm
- Vô Thương Trảm

---

## VI. PHONG THẦN BẢNG — CHIA THEO 3 MODE

Không dùng một leaderboard duy nhất cho DIRECT, CLOZE và AUDIO.

Thiết kế:

[ TỔNG ĐẠO ]
[ TRỰC DIỆN ]
[ NGỘ ĐẠO ]
[ THÍNH ÂM ]

### TRỰC DIỆN BẢNG

Ranking dựa trên thành tích DIRECT.

Hiển thị:
- rank
- avatar
- player name
- realm
- Tu Vi
- WPM
- Accuracy
- Max Combo

Danh hiệu Top:
KIẾM TỐC CHÂN NHÂN

### NGỘ ĐẠO BẢNG

Hiển thị:
- rank
- avatar
- player name
- realm
- Tu Vi
- Ngộ Tính %
- Nhất Ngộ
- words completed

Danh hiệu:
NGỘ ĐẠO CHÂN NHÂN

### THÍNH ÂM BẢNG

Hiển thị:
- rank
- avatar
- player name
- realm
- Tu Vi
- Thính Lực %
- Nhất Thính
- Replay count hoặc replay efficiency

Danh hiệu:
THIÊN NHĨ CHÂN NHÂN

---

## VII. TỔNG ĐẠO BẢNG

Không cộng raw score của ba mode.

Tạo một normalized rating:

DIRECT_RATING
CLOZE_RATING
AUDIO_RATING

Mỗi rating 0–100.

OVERALL_RATING có thể dùng:

40% weakest-mode performance
+ 60% average of three modes

hoặc một công thức tương tự nhằm thưởng người chơi giỏi đồng đều cả ba pháp môn.

Mục tiêu:
Không cho người chơi farm DIRECT để thống trị Tổng Đạo mà chưa từng chơi AUDIO/CLOZE.

Tên:
ĐẠO HẠNH

Danh hiệu Top Tổng:
VẠN PHÁP ĐẠO TÔN

Nếu user chưa chơi đủ cả ba:
hiển thị:
“Chưa hoàn tất Tam Pháp Đồng Tu”.

Không xếp hạng Tổng Đạo hoàn chỉnh cho đến khi có dữ liệu của cả ba mode.

---

## VIII. PROFILE — TAM PHÁP ĐỒNG TU

Trong hồ sơ hiển thị:

TAM PHÁP ĐỒNG TU

[劍] TRỰC DIỆN
Kiếm Tốc: XX WPM
Kiếm Chuẩn: XX%
Cấp thành thạo: X

[悟] NGỘ ĐẠO
Ngộ Tính: XX%
Nhất Ngộ: XX
Cấp thành thạo: X

[聽] THÍNH ÂM
Thính Lực: XX%
Nhất Thính: XX
Cấp thành thạo: X

ĐẠO HẠNH:
XX / 100

Dùng visual ba ngọc phù / ba huy hiệu pixel-art, không emoji Unicode.

---

## IX. BACKEND DATA MODEL

Leaderboard record phải phân biệt mode.

Không định danh leaderboard chỉ bằng player_name.

Ưu tiên:
user_id + mode

Mode:
DIRECT
CLOZE
AUDIO

Lưu các metric mode-specific cần thiết.

Thiết kế API tương tự:

GET /api/meowcha/leaderboard?mode=DIRECT
GET /api/meowcha/leaderboard?mode=CLOZE
GET /api/meowcha/leaderboard?mode=AUDIO
GET /api/meowcha/leaderboard?mode=OVERALL

POST phải xác định mode rõ ràng.

Không làm mất leaderboard cũ.

Nếu schema DB thay đổi:
- migration an toàn
- dữ liệu cũ có thể gán DIRECT hoặc LEGACY nếu không xác định được
- không giả định dữ liệu legacy thuộc mode nếu không có bằng chứng

---

## X. AVATAR

Trong mọi bảng:
- ưu tiên avatar user thật
- fallback sang default cultivator avatar
- không dùng companion / linh thú làm user avatar

Pet được hiển thị riêng nếu cần.

---

## XI. UI STYLE

Phong Thần Bảng phải theo art direction:

Cute Pixel Xianxia + Stylish Sword UI.

Top 3:
- podium đẹp
- frame pixel-art
- danh hiệu theo pháp môn
- avatar rõ

Tabs:
- giống ngọc bài / lệnh bài
- selected state rõ
- không dùng tab dashboard web thông thường

Màu:
DIRECT = Jade / Sword Green
CLOZE = Gold / Amber
AUDIO = Sky Blue / Lavender
OVERALL = Antique Gold + Jade

Giữ cùng design system, không biến thành bốn theme tách biệt.

---

## XII. TEST

Test:
- AUDIO word spawn phát voice.
- Không hiện IPA trước đáp án.
- Trảm xong hiện IPA.
- Replay hoạt động.
- Replay không làm accuracy sai.
- First-listen metric đúng.
- CLOZE recall metric đúng.
- DIRECT WPM đúng.
- Leaderboard DIRECT chỉ chứa DIRECT.
- CLOZE chỉ chứa CLOZE.
- AUDIO chỉ chứa AUDIO.
- Overall rating tính đúng.
- Avatar đúng.
- Save/load metrics đúng.
- Mobile leaderboard usable.

Không tuyên bố hoàn thành nếu chỉ thay UI mà backend vẫn trộn cả ba mode.
