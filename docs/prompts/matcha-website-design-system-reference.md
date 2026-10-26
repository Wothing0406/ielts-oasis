# MATCHA IELTS — FULL WEBSITE DESIGN SYSTEM REDESIGN

Repository: Wothing0406/ielts-oasis
Branch: game/meowcha-cultivation

## MỤC TIÊU

Redesign TOÀN BỘ Matcha IELTS thành một sản phẩm có design system thống nhất, đẹp, hiện đại và có bản sắc.

MEOW-CHA chỉ là một feature/game bên trong Matcha IELTS.

Không được biến toàn website thành một game tu tiên.

Thay vào đó xây hai tầng phong cách:

### WEBSITE CHÍNH
MATCHA ACADEMIC SANCTUARY

- calm
- premium
- cozy
- academic
- Japanese/Asian tea-house inspiration
- paper
- wood
- matcha green
- warm cream
- subtle ornamental details

### MEOW-CHA
CUTE PIXEL XIANXIA

- cùng palette thương hiệu
- nhưng đậm chất game hơn
- jade
- swords
- talismans
- pixel-art
- cultivation fantasy

Hai phần phải nhìn như cùng một sản phẩm.

---

# I. VẤN ĐỀ WEBSITE HIỆN TẠI

Trang chính hiện đang dùng quá nhiều:

- white cards
- rounded-2xl / rounded-full
- generic shadows
- bento dashboard layout
- pill buttons
- cards giống SaaS/dashboard
- các section không có visual identity riêng

Palette hiện tại khá tốt:
- sage green
- cream
- brown

Nhưng cách sử dụng còn quá generic.

Mục tiêu là GIỮ thương hiệu Matcha nhưng nâng cấp art direction.

---

# II. DESIGN LANGUAGE MỚI

Tên nội bộ:

MATCHA SANCTUARY DESIGN SYSTEM

## Materials

Website dùng 4 vật liệu chính:

1. MATCHA PAPER
- cream / ivory
- dành cho card học tập
- đọc nội dung

2. JADE GLASS
- muted green
- dành cho status / progress / positive actions

3. TEA WOOD
- warm brown
- dành cho navigation / structural elements

4. SOFT INK
- dark green/brown
- typography / borders

Không dùng pure black.

Không dùng pure white ở diện tích lớn nếu không cần.

---

# III. COLOR TOKENS

Thiết lập token trung tâm:

--matcha-50: #F6F8F2
--matcha-100: #E9EFE2
--matcha-200: #D6E1CC
--matcha-300: #B9CDAA
--matcha-400: #98B687
--matcha-500: #769767
--matcha-600: #5F7E52
--matcha-700: #465F3E
--matcha-800: #30432C
--matcha-900: #1F2D1D

--cream-50: #FFFDF7
--cream-100: #F8F1E4
--cream-200: #EADCC4

--wood-500: #78513F
--wood-600: #654333
--wood-700: #4D3328

--gold-soft: #C9A96E
--ink: #2E382B
--muted-ink: #697166

Không hardcode màu ngẫu nhiên trong từng component.

---

# IV. TYPOGRAPHY

Website:

Display:
Lexend / Be Vietnam Pro

Body:
Quicksand hoặc Be Vietnam Pro

Long-form / quotes:
Noto Serif

Game / ceremonial:
Cinzel + Noto Serif

Không dùng font fantasy cho toàn website.

Typography hierarchy:

Display
Page title
Section title
Card title
Body
Caption
Meta

Không uppercase mọi thứ.

---

# V. SHAPE LANGUAGE

Giảm việc dùng rounded-2xl ở mọi nơi.

Không phải card nào cũng cùng bo góc.

Định nghĩa:

Soft card:
14–18px radius

Panel:
10–14px

Input:
12px

Pill:
chỉ dùng tag/status/filter

Primary button:
12–14px

Không biến mọi button thành pill.

---

# VI. WEBSITE NAVIGATION

Redesign navigation thành một thanh sanctuary nhẹ.

Desktop:

[ Matcha IELTS ]

Học tập
Ngữ pháp
Writing
Radio
MEOW-CHA
Cộng đồng

                         [ 🔔 ] [ Avatar ]

Không tạo hàng loạt nút tròn lớn.

Navigation phải:
- nhẹ
- rõ
- sticky nếu phù hợp
- không chiếm quá nhiều chiều cao

MEOW-CHA có thể có badge:

GAME
hoặc
NEW

nhưng vẫn thuộc navigation chính.

---

# VII. HOMEPAGE / DASHBOARD

Không giữ kiểu:

một loạt white rectangular cards đặt trong grid.

Chia trang thành các “learning zones”.

Ví dụ:

WELCOME
↓
TODAY'S JOURNEY
↓
SKILL SANCTUARIES
↓
MEOW-CHA
↓
PROGRESS
↓
COMMUNITY

---

# VIII. HERO AREA

Thay:

“Ready for your daily brew of knowledge?”

bằng một hero section đẹp hơn.

Ví dụ:

Good evening, Quang

“Today, let's brew another cup of progress.”

Hiển thị:
- streak
- today goal
- words learned
- IELTS progress

Có một illustration nhẹ:
- tea cup
- leaf
- paper
- subtle desk scenery

Không cần quá nhiều card nhỏ.

---

# IX. LEARNING MODULES

Mỗi feature không được chỉ là một white card.

Tạo visual identity riêng:

GRAMMAR SANCTUARY
- parchment
- green accent

WRITING SANCTUARY
- paper/document motif
- ink accent

MATCHA RADIO
- audio waveform / tea radio motif

VOCABULARY
- flashcard/book motif

MEOW-CHA
- pixel jade portal / sword motif

Community:
- gathering / tea-house motif

Các module vẫn phải cùng design system.

---

# X. BUTTON SYSTEM

Tạo hierarchy chuẩn.

PRIMARY
matcha green

SECONDARY
cream / wood outline

TERTIARY
text / ghost

DANGER
muted crimson

GAME ENTRY
special illustrated variant

Không dùng:
- rounded-full everywhere
- random gradients
- random shadows

---

# XI. INPUTS & FORMS

Login/register hiện tại có nền đẹp nhưng vẫn hơi generic.

Redesign:
- cream paper fields
- subtle green focus
- wood/ink labels
- fewer thick borders
- cleaner spacing

Discord login vẫn giữ official Discord color.

Không gọi username/password là:

GUEST ACCOUNT

Đổi thành:

MATCHA ACCOUNT

hoặc:

EMAIL / USERNAME ACCOUNT

Nếu không phải guest thật.

---

# XII. LOGIN SCREEN

Current login page:
- large white card
- green background
- many rounded elements

Improve into:

MATCHA ENTRYWAY

Background:
soft matcha gradient + subtle botanical texture

Main panel:
cream paper / light frosted panel

Logo:
cleaner

Tabs:
Login / Register

CTA:
simple and premium

No excessive shadow/glow.

Keep mobile-first behavior.

---

# XIII. DARK MODE

Nếu giữ dark mode:

Không dùng pure black.

Use:
deep matcha
dark tea wood
warm charcoal

Card:
#1E281F

Text:
warm cream

Accent:
muted matcha

Game dark palette có thể đậm hơn nhưng vẫn liên quan.

---

# XIV. MEOW-CHA ENTRY FROM WEBSITE

MEOW-CHA phải có một card/portal đặc biệt trên homepage.

Không chỉ là button:

[ Play Game ]

Thiết kế:

MEOW-CHA TRẢ ĐẠO
Pixel cultivation vocabulary adventure

- current realm
- current Tu Vi
- strongest mode
- continue CTA

Nếu user chưa login:
auth gate của website xử lý trước.

Nếu login:
click → /games/meowcha

Game không có auth system riêng.

---

# XV. CROSS-PRODUCT BRAND CONNECTION

Website và game phải chia sẻ:

- matcha green
- jade
- cream
- warm wood
- soft gold
- typography family
- avatar system
- profile identity
- auth
- notification patterns

Nhưng game được phép dùng:
- pixel assets
- swords
- cultivation motifs
- stronger ornament

Website không được dùng swords/talismans ở mọi nơi.

---

# XVI. AVATAR & PROFILE

Standardize user identity component.

UserAvatar:

- real user avatar
- fallback initials or Matcha profile avatar
- never use pet/companion as fallback

Use same avatar component in:
- header
- profile
- leaderboard
- community
- MEOW-CHA

---

# XVII. MODALS

Website modals:
clean sanctuary panels.

Game modals:
ceremonial/pixel panels.

Shared principles:
- strong hierarchy
- clear close action
- good spacing
- consistent overlay
- responsive
- keyboard accessibility

Do not reuse game modal art for normal website settings.

---

# XVIII. RESPONSIVE

Redesign desktop AND mobile.

Website:
- 320
- 360
- 375
- 390
- 430
- 768
- desktop

Do not just shrink desktop layout.

Mobile navigation:
bottom nav or compact drawer if appropriate.

Critical sections should remain reachable in 1–2 taps.

---

# XIX. ACCESSIBILITY

Production standards:

- contrast WCAG AA where possible
- 44px touch targets
- visible focus
- keyboard navigation
- semantic buttons
- semantic headings
- reduced motion support
- alt text

Do not sacrifice usability for decoration.

---

# XX. REMOVE DESIGN DEBT

Audit:

page.tsx
globals.css
components
feature modules

Find:
- repeated arbitrary hex colors
- repeated rounded-2xl
- random shadows
- duplicated buttons
- duplicated cards
- inline styles
- inconsistent spacing

Replace with centralized tokens/components.

---

# XXI. COMPONENT LIBRARY

Create shared components:

AppShell
TopNavigation
MobileNavigation

SanctuaryPanel
PaperCard
JadeCard
WoodPanel

PrimaryButton
SecondaryButton
DangerButton
IconButton

UserAvatar
StatusBadge
ProgressMeter

SectionHeader
EmptyState
Modal
Toast

FeaturePortal
StatTile

MEOW-CHA has its own extension:

GameSwordCTA
GameWoodPlaque
GameJadeStat
GameCeremonialPanel

Do not duplicate core behavior.

---

# XXII. SPACING SYSTEM

Use one spacing scale:

4
8
12
16
24
32
48
64

Avoid arbitrary:
17px
23px
37px

unless truly necessary.

---

# XXIII. SHADOW SYSTEM

Define:

shadow-sm
shadow-panel
shadow-floating
shadow-modal

Use soft warm shadows.

Do not give every card a heavy shadow.

---

# XXIV. MICRO-INTERACTIONS

Website:
- 120–220ms transitions
- subtle hover lift
- progress animation
- gentle button press

Game:
- stronger feedback allowed

Do not animate everything.

Support prefers-reduced-motion.

---

# XXV. HOMEPAGE MEOW-CHA PORTAL

Design a premium game portal section.

Example:

┌───────────────────────────────┐
│ MEOW-CHA TRẢ ĐẠO             │
│ Tu luyện từ vựng qua kiếm đạo │
│                               │
│ Trúc Cơ Kỳ                    │
│ 2,317 Tu Vi • 8 WPM           │
│                               │
│ [ TIẾP TỤC TU LUYỆN ]         │
└───────────────────────────────┘

Use subtle pixel illustration.

Do not turn whole homepage into pixel art.

---

# XXVI. PRODUCTION POLISH

Check:
- loading states
- skeletons
- empty states
- errors
- offline feedback
- form errors
- auth expiry
- notifications

Every state must look intentional.

No browser-default select/input appearance where custom design is expected.

---

# XXVII. IMPLEMENTATION ORDER

Phase 1:
Tokens + typography + buttons + cards.

Phase 2:
Navigation + layout shell.

Phase 3:
Login/Register.

Phase 4:
Homepage dashboard.

Phase 5:
Feature modules.

Phase 6:
MEOW-CHA integration.

Phase 7:
Mobile polish.

Phase 8:
Accessibility + QA.

Do not redesign random screens independently.

---

# XXVIII. VISUAL QA

Take before/after screenshots for:

- login desktop
- login mobile
- homepage desktop
- homepage mobile
- profile
- notifications
- grammar
- writing
- radio
- community
- MEOW-CHA portal
- MEOW-CHA lobby

Check whether all screens feel like one product.

---

# ACCEPTANCE CRITERIA

The redesign is complete only when:

- website no longer looks like a generic bento dashboard
- Matcha brand remains recognizable
- website feels calm, premium and academic
- MEOW-CHA feels like a richer game extension of the same brand
- buttons/cards/spacing are standardized
- login looks production-ready
- mobile is polished
- avatar/auth identity is consistent
- no major page mixes old/new design language
- accessibility is preserved
- no feature behavior is broken

Do not interpret this task as “add more decoration”.

The goal is:

LESS generic UI,
BETTER hierarchy,
STRONGER identity,
MORE polish,
MORE cohesion.