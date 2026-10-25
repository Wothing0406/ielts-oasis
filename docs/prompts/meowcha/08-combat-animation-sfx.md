# MEOW-CHA — RESTORE COMBAT ANIMATION, PROJECTILE VFX & GAMEPLAY SFX

Repository: Wothing0406/ielts-oasis
Branch: game/meowcha-cultivation

Current reference commit:
150a9f6988f4bcfae994c3419abab6b51409733d

## PROBLEM

The combat feedback has regressed.

When typing correct characters, sword attacks often visually look like straight glowing sticks/lines pointing from the player to the asteroid.

The game previously felt more animated and alive.

Also investigate reports that:
- wrong-key SFX is effectively missing
- asteroid bottom-impact SFX is effectively missing
- typing/sword feedback feels weak

Do not solve this by adding more generic Canvas lines or glow.

Target art direction:

Cute Pixel Xianxia + Stylish Sword Combat.

---

# I. PROJECTILE VISUAL AUDIT

Inspect:

frontend/public/meowcha/js/entities/ProjectileSystem.js
frontend/public/meowcha/js/combat/TypingEngine.js
frontend/public/meowcha/js/core/SpriteAnimator.js
frontend/public/meowcha/js/effects/ParticleEngine.js
frontend/public/meowcha/js/main.js

The project already contains per-realm:

projectile.png
projectile_sheet.png
beam.png
beam_sheet.png
slash.png
slash_sheet.png
hit.png
hit_sheet.png
muzzle assets

Use these assets as the PRIMARY attack visual.

Canvas line art must only be subtle fallback/support.

---

# II. REMOVE THE “STRAIGHT STICK” LOOK

ProjectileSystem currently stores trail positions and renders multiple:

moveTo()
lineTo()
stroke()

segments with large glow.

Reduce or remove this visual as the main projectile trail.

Do NOT render a long solid luminous line connecting the player and asteroid.

Replace it with:

- short fading pixel particles
- qi motes
- bamboo leaves
- tiny sparks
- sprite beam fragments

Trail length should visually occupy only part of the projectile path.

Example:

sword ====> ✦ · ·

NOT:

player ================= asteroid

---

# III. CORRECT-KEY ATTACK SEQUENCE

For every human-entered correct character:

1. Set character state to WEAK_ATTACK.
2. Play the appropriate attack animation frames.
3. Spawn muzzle VFX from the actual weapon position.
4. Spawn per-realm projectile sprite.
5. Add short particle trail.
6. On contact:
   - hit sprite animation
   - asteroid hit reaction
   - small particle burst
7. Return character to idle.

Timing should feel fast and responsive.

Target total visual feedback:
roughly 150–350 ms.

Do not delay typing input while animation runs.

---

# IV. PER-REALM ATTACK IDENTITY

Realm 0 — Luyện Khí

THANH TRÚC KIẾM KHÍ

- small bamboo/jade sword
- green qi trail
- 2–5 bamboo leaf pixels
- soft jade hit

Realm 1 — Trúc Cơ

SONG KIẾM ÂM DƯƠNG

- two jade sword sprites
- subtle spiral/orbit
- cyan/jade trail
- X-slash impact

Realm 2 — Kim Đan

KIM KIẾM PHÁ KHÔNG

- golden sword projectile
- warm gold qi
- small lotus/petal particles
- stronger impact

Realm 3 — Nguyên Anh

CỬU THIÊN LÔI KIẾM

- purple/blue sword
- short electric arcs
- animated electric hit

Do not draw long procedural lightning lines for every normal key.

Realm 4 — Hóa Thần

VẠN KIẾM / LONG KIẾM

- richer projectile
- small sword-array accents
- dragon motif only for major attacks/ultimate

Do not make normal typing attacks visually as strong as an ultimate.

---

# V. DIFFERENTIATE NORMAL KEY VS WORD COMPLETION

NORMAL CORRECT CHARACTER:

Visual:
- attack animation
- projectile
- small impact
- few particles

Audio:
- jade typing tick
- subtle sword whoosh

NO large explosion.

WORD COMPLETION:

Visual:
- stronger slash
- asteroid crack
- impact sprite
- pixel shards
- Xianxia word reward
- EXP/Tu Vi orb

Audio sequence:
- final-key sound
- sword slash
- asteroid crack/shatter
- small cultivation chime
- pronunciation after a short delay

Do not trigger all sounds at exactly the same timestamp.

---

# VI. WRONG-KEY FEEDBACK

Currently wrong input ultimately calls generic "hurt".

Create a dedicated:

wrong_key

SFX.

Style:
- muted wooden tap
- short guqin string rejection
- tiny jade crack

Duration:
very short.

Avoid loud electronic buzz/beep.

Visual:
- current rune/letter briefly shakes
- small crimson flash
- tiny broken-qi particles

Do not use a huge explosion.

If gameplay damage occurs from typo:
character may briefly react.

But distinguish INPUT ERROR from PHYSICAL METEOR IMPACT.

---

# VII. ASTEROID BOTTOM IMPACT

When an asteroid reaches bottomThreshold:

Currently logic already calls:
hurt
or
shatter if shield exists.

Replace generic feedback with distinct events.

NO SHIELD:

SFX sequence:
meteor_impact
+
stone_crack
+
low hurt resonance

Visual:
- asteroid impact burst
- dust pixels
- stone shards
- small camera shake
- character HURT animation
- HP loss indicator

WITH SHIELD:

SFX:
shield_hit / jade_shatter

Visual:
- shield flash
- jade shards
- no generic hurt sound unless HP is actually lost

---

# VIII. AUDIO EVENT NAMES

Extend AudioManager with semantic events:

type_correct
wrong_key
sword_launch
sword_hit
word_slash
meteor_crack
meteor_impact
shield_hit
shield_break
player_hurt
word_complete
breakthrough

Keep backwards aliases if needed for compatibility.

Do not use one "hurt" sound for all negative events.

---

# IX. AUDIO ASSET QUALITY

Oscillator sounds may remain as fallback.

For production, prioritize real licensed/generated SFX assets for:

- sword whoosh
- sword impact
- stone crack
- meteor impact
- jade shield shatter
- UI parchment
- breakthrough

Web Audio oscillator is acceptable for:
- small jade ping
- subtle magical tick

but must not be the final sound for complex physical events.

---

# X. SOUND MIXING

Use existing BGM/SFX/VOICE architecture.

Correct key sound:
quiet.

Sword:
medium-low.

Meteor impact:
medium.

Pronunciation voice:
highest clarity.

Do not allow SFX to obscure AUDIO-mode pronunciation.

Use limiter/compressor appropriately.

---

# XI. ASSET FAILURE FALLBACK

Before drawing projectile:

check whether:
char_rX_projectile_sheet
char_rX_projectile
char_rX_beam_sheet
char_rX_beam

loaded successfully.

If an asset fails:

Do not silently fall back to a giant straight glowing line.

Fallback should be:

small stylized pixel sword
+
short particle trail.

Add development logging for missing combat assets.

Example:

[Meowcha VFX] Missing char_r0_projectile_sheet

Remove noisy logs before release or gate them behind debug mode.

---

# XII. HIT REACTION

Asteroid hit should have a tactile response:

- 1–3 px knock/recoil
- brief sprite brightness or damage frame
- small chip particles

Do not use full white screen flash for normal key hits.

Word completion can have larger reaction.

---

# XIII. CAMERA FEEDBACK

Use camera shake sparingly.

Correct key:
none.

Word complete:
1–2 px micro shake if desired.

Meteor reaches player:
3–5 px short shake.

Boss shield break:
stronger but short.

Do not move DOM UI with the gameplay camera.

---

# XIV. MOBILE

Effects must remain readable on small screens.

Reduce particle count approximately 20–35% on lower-end/mobile devices.

Do not remove the core projectile animation.

Never replace mobile VFX with ugly straight lines purely for performance.

---

# XV. TEST MATRIX

Test:

DIRECT:
- 20 correct characters
- 5 wrong characters
- complete 10 words

CLOZE:
same tests.

AUDIO:
same tests while ensuring SFX does not cover voice.

For every realm:
0–4.

Test:
- correct key
- incorrect key
- completed word
- asteroid bottom hit
- shield hit
- shield break
- boss hit
- breakthrough

Verify:
- attack sprite plays
- projectile sprite visible
- no dominant straight-stick visual
- hit VFX visible
- correct SFX audible
- no duplicated SFX
- BGM remains alive
- VO
