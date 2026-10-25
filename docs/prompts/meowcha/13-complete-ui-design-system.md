# MEOW-CHA — COMPLETE UI DESIGN SYSTEM MIGRATION

Repository: Wothing0406/ielts-oasis
Branch: game/meowcha-cultivation

## VẤN ĐỀ HIỆN TẠI

Đợt nâng cấp gần nhất chỉ thay đổi một số asset/component nổi bật.

Ví dụ hiện tại:
- CTA “TIẾP TỤC ĐỘ KIẾP” đã trở thành thanh kiếm pixel-art đẹp.
- Nhưng “ĐỔI PHÁP MÔN” vẫn là rectangle web UI.
- “TRÙNG TU TIÊN ĐẠO” vẫn là button HTML cũ.
- Stat card vẫn là rectangular dashboard cards.
- Pause menu chỉ nâng cấp nút Resume, còn phần còn lại vẫn thuộc design language cũ.
- Modal frame, section header, statistic layout và secondary actions chưa được migrate.

Kết quả là giao diện đang tồn tại HAI DESIGN LANGUAGE trong cùng một màn hình.

Điều này không được chấp nhận.

Nhiệm vụ lần này KHÔNG phải sửa thêm một vài button.

Phải thực hiện một **full UI design-system migration** cho toàn bộ MEOW-CHA.

---

# I. ART DIRECTION CHÍNH THỨC

Style duy nhất:

CUTE PIXEL XIANXIA + STYLISH SWORD UI

Đặc điểm:
- pixel-art
- tiên hiệp
- cute
- cổ phong
- kiếm tu
- vật thể UI có hình dáng riêng
- parchment / jade / wood / lacquer
- sáng và dễ đọc
- không dashboard/SaaS
- không dark fantasy nặng
- không neon web UI

Thanh kiếm CTA mới hiện tại được xem là một STYLE REFERENCE tốt.

Không có nghĩa mọi button đều phải thành kiếm.

Hãy xây dựng hierarchy.

---

# II. XÂY UI KIT TRƯỚC

Tạo hoặc chuẩn hóa các component/style sau.

## CTA LEVEL 1 — HERO ACTION

Dùng cho:
- Tiếp tục độ kiếp
- Vào trận độ kiếp
- Khai trận quan trọng

Style:
SWORD PLAQUE / CULTIVATION WEAPON.

Nút kiếm hiện tại là reference.

Không dùng nó cho mọi action.

## CTA LEVEL 2 — SECONDARY ACTION

Dùng cho:
- Đổi pháp môn
- Chọn kinh quyển
- Xem Tàng Kinh Các
- Lĩnh ngộ

Style:
WOODEN PLAQUE / JADE TABLET / SCROLL TAB.

Có hình dáng riêng.
Không phải generic rounded rectangle.

## CTA LEVEL 3 — UTILITY

Dùng cho:
- đóng
- quay lại
- xem thêm
- replay audio

Style:
small talisman / jade chip / seal button.

## DANGER / RESET

Dùng cho:
- Trùng tu
- Xóa save
- Reset progression

Style:
RED SEAL / BLOOD TALISMAN.

Không được nhìn ngang cấp với CTA chính.

---

# III. PANEL SYSTEM

Tạo 4 panel archetype.

### WOOD PANEL
Dùng cho structural UI.

### PARCHMENT PANEL
Dùng cho text/stats/word learning.

### JADE PANEL
Dùng cho positive/progression status.

### CEREMONIAL PANEL
Dùng cho:
- breakthrough
- leaderboard
- achievements
- important modals

Mỗi loại có:
- background
- border
- corner treatment
- padding
- heading
- mobile behavior

Không cho mỗi modal tự tạo border/gradient riêng.

---

# IV. STAT COMPONENTS

Thay các rectangle stat card hiện tại.

Tạo:

HealthRelic
SpeedScroll
CultivationOrb
ComboTalisman
AccuracySeal
ListeningCharm

Mỗi stat:
- có pixel icon rõ
- label nhỏ
- value lớn
- background vật thể phù hợp
- không có quá nhiều border

Ví dụ:

Khí Huyết
→ potion/relic

WPM
→ scroll/wind charm

Tu Vi
→ spirit pearl

Accuracy
→ jade seal

Combo
→ sword tally

---

# V. MIGRATE LOBBY COMPLETELY

Current lobby must not keep mixed old/new design.

### KEEP
- Sword CTA for TIẾP TỤC ĐỘ KIẾP.
- Existing good background.
- Character.
- Companion.
- Good pixel assets.

### REDESIGN

ĐỔI PHÁP MÔN:
convert from generic brown rectangle
to secondary wooden/jade plaque.

Show:
ĐỔI PHÁP MÔN
Ngộ Đạo Thông Linh

No excessive text.

TRÙNG TU:
convert into compact red-seal action.

Do not let it compete visually with primary CTA.

HEALTH/WPM:
convert to standardized relic stat components.

Spacing and widths must follow a shared grid.

---

# VI. MIGRATE PAUSE / ĐỊNH TÂM COMPLETELY

Current pause screen is only partially redesigned.

Sword resume button is good.

Everything around it must be migrated.

### Header

Current plain rectangular brown header is too web-like.

Use ceremonial header/plaque.

Title:
ĐỊNH TÂM

Subtitle:
“Thu kiếm dưỡng khí • Tĩnh tâm nhất niệm”

### Resume

Keep sword CTA.

ESC:
render as a small hotkey badge attached/subordinate to button.

### Return

Replace generic rectangular button.

Use wood plaque / gate token.

Text:
QUY TÔNG
or
TRỞ VỀ TIÊN MÔN

### Battle summary

REMOVE six oversized generic cards.

Create compact “CHIẾN TÍCH TRẬN NÀY”.

Use:
icon + label + value

2-column grid on desktop if useful.

Do not make each statistic a large cream rectangle.

Stats:
- Kiếm Chuẩn
- Kiếm Tốc
- Liên Trảm
- Từ Đã Luyện
- Thời Gian
- Hỗ Trợ

Use shared stat components.

---

# VII. MIGRATE EVERY OTHER FLOW

Audit and migrate:

- Lobby
- Battle HUD
- Pause
- Game Over
- Breakthrough
- Talent Choice
- Mode Selection
- Tàng Kinh Các
- Phong Thần Bảng
- Chứng Đạo
- Profile
- Save slots
- Confirmation dialogs
- Audio settings
- Mobile virtual keyboard controls

No major screen may retain the previous generic web design without an explicit reason.

---

# VIII. REMOVE LEGACY STYLE DRIFT

Search CSS/HTML/JS for old patterns:

- generic rounded rectangle buttons
- duplicated brown panels
- black panel + gold border
- repeated custom box-shadow
- repeated custom gradients
- legacy corner SVG
- inline style variants
- duplicated card definitions

Replace them with central tokens/classes/components where practical.

Do NOT leave:

NEW sword UI
next to
OLD dashboard UI

in the same screen.

---

# IX. DESIGN TOKENS

Create centralized tokens.

Example groups:

--game-bg-deep
--game-wood-dark
--game-wood-warm
--game-parchment
--game-parchment-dark
--game-jade
--game-jade-light
--game-gold
--game-gold-highlight
--game-crimson

Also standardize:

--border-thin
--border-major
--panel-radius
--panel-padding
--shadow-soft
--shadow-ceremonial
--font-title
--font-body

Avoid random hard-coded colors in every component.

---

# X. TYPOGRAPHY

Standard hierarchy:

Hero title
Section title
Button label
Stat value
Stat label
Body
Helper text
Hotkey

Do not solve hierarchy using:
- uppercase everywhere
- huge text-shadow
- random bold weights

Vietnamese text must remain readable.

---

# XI. RESPONSIVE SCENE

The narrow viewport screenshot shows the world scene can crop into an unusable thin vertical slice.

Fix battle/lobby background behavior.

Do not simply use cover blindly.

Define focal region:
- character
- main temple
- gameplay lane

On portrait:
recompose/crop intentionally around gameplay focal point.

Never show an accidental narrow crop of architecture.

Test:
320x568
360x640
375x667
390x844
430x932
tablet
desktop

---

# XII. VISUAL CONSISTENCY TEST

For every screen ask:

1. Does this look like the same game as the sword CTA?
2. Does any component look like a normal website dashboard?
3. Does any old black/gold UI remain?
4. Are there generic rectangles where a game-specific component is expected?
5. Are important assets pixel-art and stylistically compatible?

If yes to #2–4, continue migration.

---

# XIII. BEFORE / AFTER VALIDATION

Take screenshots of at least:

- lobby desktop
- lobby mobile
- pause desktop
- pause mobile
- battle
- mode selection
- breakthrough
- talent choice
- leaderboard

Compare them visually.

Do not declare completion after modifying CSS alone.

---

# XIV. IMPORTANT RULE

DO NOT interpret this task as:

“Make every button a sword.”

Correct interpretation:

Build a coherent Xianxia game UI hierarchy.

Primary combat CTA:
sword.

Secondary:
wood/jade plaque.

Navigation:
scroll/tab/talisman.

Danger:
red seal.

Stats:
relic/card.

Modal:
ceremonial panel.

Everything belongs to the same world but has a different visual role.

---

# ACCEPTANCE CRITERIA

This refactor is complete only when:

- no screen visibly mixes old and new design systems
- pause is fully migrated
- lobby is fully migrated
- stat cards match the new art direction
- secondary buttons no longer look generic
- colors and typography are standardized
- mobile scene framing works
- desktop remains functional
- no gameplay behavior is broken

The sword button alone is NOT considered a successful redesign.