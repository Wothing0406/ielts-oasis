# MEOW-CHA — WEEKLY PANTHEON RACE, WEEKLY TITLES, DISCORD INTEGRATION & REAL DIFFICULTY SCALING

Repository: Wothing0406/ielts-oasis
Branch: game/meowcha-cultivation

Current reference:
f4e02d2e8a9c9d208281154e8f0776ba99935842

## MỤC TIÊU

Nâng Bảng Phong Thần thành một hệ thống ĐUA TOP TUẦN thực sự.

Hệ thống phải:
- realtime đủ dùng
- có season tuần
- có top 10
- có danh hiệu
- có recap tuần trước
- có countdown
- kết nối Discord bot
- dùng đúng kỷ lục Tu Vi và cảnh giới cao nhất
- không trộn current save với lifetime record
- không làm leaderboard thành trang archive/debug

Đồng thời sửa difficulty scaling vì người chơi 30.000+ Tu Vi hiện vẫn không cảm thấy áp lực.

---

# I. REMOVE REDUNDANT WEEKLY ARCHIVE BLOCK

Trong Bảng Phong Thần hiện có block kiểu:

“Vinh danh tuần YYYY-MM-DD • Mới”

và liệt kê:
- Tổng Đạo #...
- Trực Diện #...
- Ngộ Đạo #...
- Thính Âm #...
- Đã xem

XÓA block này khỏi main leaderboard UI.

Nó chiếm diện tích và không thuộc luồng chính.

Di chuyển lịch sử sang:

[ LỊCH SỬ PHONG THẦN ]

một secondary view riêng.

Weekly recap phải xuất hiện ở LOBBY, không nằm giữa leaderboard.

---

# II. WEEKLY SEASON MODEL

Một season:

Monday 00:00:00
→ Sunday 23:59:59

Timezone:
Asia/Ho_Chi_Minh

Backend phải trả:

season_id
season_started_at
season_ends_at
server_now
previous_season_id

Không tính tuần dựa vào clock client.

---

# III. DO NOT RESET PLAYER PROGRESSION

Weekly reset chỉ reset competition standings.

Không reset:
- current cultivation save
- highest Tu Vi
- highest realm
- skills
- talents
- vocabulary progression
- SRS

Phân biệt:

Lifetime Record
Weekly Record
Current Save

---

# IV. CORRECT PLAYER RECORDS

Bảng hiện có nguy cơ hiện score/cảnh giới của một run thay vì kỷ lục thật.

Build canonical player record:

highest_tuvi
highest_realm_idx
highest_realm
highest_wpm

Weekly:

weekly_tuvi
weekly_best_run
weekly_rank
weekly_mode_stats

Current:

current_tuvi
current_realm

Leaderboard phải dùng đúng field theo loại bảng.

Không được để người đã đạt 30k / Nguyên Anh hiện thành 2k / Luyện Khí chỉ vì run gần đây thấp hơn.

---

# V. WEEKLY LEADERBOARDS

Các halls:

OVERALL
DIRECT
CLOZE
AUDIO

Mỗi hall có:
- weekly
- all-time

Main default:
WEEKLY.

Tabs:

TỔNG ĐẠO
TRỰC DIỆN
NGỘ ĐẠO
THÍNH ÂM

Secondary toggle:

TUẦN NÀY
VĨNH VIỄN

Không dùng dropdown chính.

---

# VI. COUNTDOWN

Hiển thị:

THIÊN BẢNG TUẦN 44
Còn 3 ngày 14:22:08

Countdown chạy client-side dựa trên server-provided season_ends_at.

Resync định kỳ.

Không tính season bằng giờ máy người dùng.

---

# VII. TOP 10 TITLES

Weekly rank titles:

#1 Chí Tôn Tiên Miện
#2 Bạch Ngân Đạo Quân
#3 Thanh Đồng Chân Nhân
#4 Tứ Tượng Thiên Kiêu
#5 Ngũ Hành Đạo Tử
#6 Lục Hợp Kiếm Khách
#7 Thất Tinh Linh Sư
#8 Bát Hoang Tu Sĩ
#9 Cửu Tiêu Đạo Hữu
#10 Thập Phương Tân Tú

Danh hiệu được lưu vào weekly award history.

Không nhất thiết cộng stat gameplay.

Đây là cosmetic honor.

Có thể hiển thị cạnh username trong tuần kế tiếp.

---

# VIII. MODE TITLES

Ngoài rank title, thêm specialty title:

DIRECT:
Kiếm Tốc

CLOZE:
Ngộ Đạo

AUDIO:
Thiên Nhĩ

OVERALL:
Vạn Pháp

Ví dụ:

#3 Thanh Đồng Chân Nhân
[ Thiên Nhĩ ]

---

# IX. WEEKLY LOBBY RECAP

Khi user login lần đầu trong một tuần mới:

Kiểm tra:

last_weekly_recap_seen != current_season_id

Nếu đúng:
hiển thị modal:

THIÊN ĐẠO BAN CHIẾU

PHONG THẦN TUẦN TRƯỚC

Top 3 tuần trước.

Nếu user top 10:
hiển thị:
- rank
- title
- weekly score
- highest realm
- specialty

CTA:
NHẬN DANH HIỆU
XEM PHONG THẦN

Nếu không top 10:
hiển thị rank cá nhân một cách tích cực.

Sau khi user đóng:
persist recap_seen.

Chỉ hiện một lần mỗi tuần cho mỗi user.

---

# X. LIVE LOBBY RACE STATUS

Trong lobby thêm một banner nhỏ:

THIÊN BẢNG TRANH PHONG

Bạn: #7
8.320 Tu Vi tuần
Cách #6: 420 Tu Vi
Còn 3 ngày 14:22:08

Không làm popup liên tục.

Nếu user vào Top 10:
one-time toast:

[ 天 ] ĐẠO HỮU ĐÃ TIẾN VÀO THIÊN BẢNG TOP 10!

Nếu rank tụt:
không spam notification.

---

# XI. REALTIME STRATEGY

V1 không cần WebSocket.

Leaderboard modal open:
refresh 20–30 giây.

Lobby compact rank:
refresh 60 giây.

On run completion:
refresh personal rank immediately.

Countdown:
local display based on server time.

Use ETag/cache where reasonable.

Không polling mỗi giây.

---

# XII. DISCORD BOT

Bot hiện có Discord user mapping thông qua discord_id.

Tích hợp MEOW-CHA vào bot hiện tại.

Không tạo bot riêng.

Slash commands:

/phongthan
/phongthan mode
/hangcuatoi
/duatop

Examples:

/phongthan
→ Weekly OVERALL top 10.

/phongthan thinh-am
→ AUDIO top 10.

/hangcuatoi
→ personal weekly ranks.

/duatop
→ current rank, score gap, countdown.

Nếu Discord user chưa liên kết web:
yêu cầu đăng nhập web bằng Discord.

---

# XIII. DISCORD EMBED

Example:

BẢNG PHONG THẦN • TUẦN 44

Còn:
3 ngày 12 giờ 18 phút

🥇 ndwpython — 18.240 Tu Vi
🥈 nhatnguyen — 15.820
🥉 meow... — 13.460

Bạn:
#7 • 8.320 Tu Vi

Cách #6:
420 Tu Vi

Website:
link to leaderboard/game.

---

# XIV. WEEKLY DISCORD AWARDS

At season rollover:

Compute weekly top 10 exactly once.

Persist award snapshot.

For users with linked discord_id and notifications enabled:

Send DM once.

Example:

THIÊN ĐẠO BAN CHIẾU

Đạo hữu đứng Hạng #4
trên Bảng Phong Thần tuần vừa qua.

Danh hiệu:
TỨ TƯỢNG THIÊN KIÊU

Tu Vi tuần:
12.430

Cảnh giới cao nhất:
Nguyên Anh

Thiên bảng tuần mới đã khai mở.

Use idempotency:
season_id + user_id + notification_type

Never DM the same award twice.

---

# XV. OPTIONAL PUBLIC DISCORD ANNOUNCEMENT

Configurable channel.

At weekly rollover:
post only Top 3 or Top 10 once.

Do not hardcode channel id.

Environment/config setting only.

If no configured channel:
skip safely.

---

# XVI. DATABASE

Add explicit weekly season tables if not already available.

Suggested:

MeowchaSeason
- id
- season_key
- starts_at
- ends_at
- status
- finalized_at

MeowchaWeeklyStanding
- season_id
- user_id
- hall
- weekly_score
- rank
- best_run_id
- highest_realm_idx
- highest_realm
- title
- specialty_title

MeowchaWeeklyNotification
- season_id
- user_id
- kind
- delivered_at
- recap_seen_at

Use unique constraints to make rollover idempotent.

---

# XVII. WEEKLY SCORE DESIGN

Do not blindly use lifetime score.

Define weekly competitive contribution clearly.

Possible V1:

weekly_score =
sum of validated run gains during current season

or another server-verified formula.

Avoid allowing repeated replay/reset exploits.

All weekly points must originate from verified completed runs.

Assisted runs:
separate leaderboard or exclude from competitive weekly board.

---

# XVIII. DIFFICULTY PROBLEM

Current AsteroidManager typingSeconds does not meaningfully scale with Tu Vi.

Current rough formula includes:

realm base:
18 / 17 / 15 / 13.5 / 12 sec

+
word length bonus

+
AUDIO/CLOZE bonus

but no meaningful high-score pressure.

Therefore 30,000 Tu Vi can still feel slow.

Fix this.

---

# XIX. DIFFICULTY PRESSURE

Introduce:

scorePressure
realmPressure
personalSkillPressure

Do not stack multipliers uncontrollably.

Use one final target typing-time budget.

Suggested DIRECT target bands:

0–2.5k:
15–18 sec

2.5k–7.5k:
13–15 sec

7.5k–15k:
11–13 sec

15k–30k:
9–11 sec

30k–50k:
7–9 sec

50k+:
5.5–7.5 sec

CLOZE:
+1.5–2 sec.

AUDIO:
+2–3 sec.

Apply word-length compensation but CAP it.

Do not add 0.9 sec indefinitely per character.

Suggested maximum word-length bonus:
3–4 sec.

---

# XX. PERSONAL WPM ADAPTATION

Use rolling human WPM carefully.

Example:

rollingWpm =
median/EMA of recent valid human-typed words.

High-WPM player:
slightly lower time budget.

Low-WPM player:
do not immediately crush them.

Cap adaptive effect around:
±15–20%.

Do not use assisted keystrokes for WPM adaptation.

---

# XXI. PRESSURE FEEDBACK

As difficulty rises:

do not only increase raw falling speed.

Also use:
- stronger meteor trail
- faster ambient pulse
- slightly more urgent music layer
- subtle warning at high pressure

At 30k+:

display:

[ KIẾM ÁP: CỰC CAO ]

But avoid visually noisy effects.

---

# XXII. FAIRNESS

Weekly leaderboard must know difficulty context.

Do not reward farming the easiest configuration infinitely.

Mode/deck/assistance segmentation already exists; preserve it.

Competitive weekly Overall:
only validated, non-assisted runs.

---

# XXIII. UI CLEANUP

Remove from main Pantheon:

large weekly archive recap block.

Keep main visual hierarchy:

1. Season title + countdown
2. Top 3 podium
3. Hall tabs
4. Top 10 ranking
5. Self rank
6. Small History button

No giant explanatory/debug panels.

---

# XXIV. TESTS

Test season boundaries around:
Sunday 23:59:59
Monday 00:00:00
Asia/Ho_Chi_Minh.

Test:
- finalization only once
- recap only once
- Discord DM only once
- top10 title correct
- tied scores deterministic
- user with no Discord
- Discord user with DM closed
- ranking updates after run
- all 4 halls
- lifetime data unaffected

Difficulty tests:
0
2.5k
7.5k
15k
30k
50k
100k Tu Vi

Measure actual time-to-bottom.

Verify:
30k is meaningfully harder than 2k.

Do not allow impossible 1–2 second long-word timers.

---

# ACCEPTANCE CRITERIA

Complete only when:

- weekly race exists server-side
- weekly countdown is authoritative
- Top 10 receive titles
- previous-week recap appears once in lobby
- redundant recap block is removed from Pantheon
- Discord commands work
- Discord award DM is idempotent
- leaderboard displays highest lifetime realm correctly
- weekly/lifetime/current stats are not mixed
- 30k Tu Vi produces clearly higher pressure
- AUDIO/CLOZE remain fair
- user progression is never reset by weekly rollover