# MEOW-CHA — MOBILE TALENT GRID + AUDIO IPA + SPAWN FLOW + STRAIGHT METEOR FIX

Repository: Wothing0406/ielts-oasis
Branch: game/meowcha-cultivation

Current reference commit:
0bfdb09118c613adc1e494167d013c133e613101

## 1. MOBILE TALENT / BREAKTHROUGH CHOICES

Current mobile CSS incorrectly forces:

.talents-grid {
  grid-template-columns: 1fr;
}

This stacks the 3 choices vertically.

Change the mobile breakthrough layout so that the 3 choices remain SIDE BY SIDE like desktop, but compact.

### Target mobile layout

3 cards in one horizontal row:

[ Choice 1 ] [ Choice 2 ] [ Choice 3 ]

Each card must:
- remain readable
- fit within viewport
- use smaller icon
- smaller badges
- shorter description
- smaller button
- keep tap target usable

Use:

grid-template-columns: repeat(3, minmax(0, 1fr));

for normal mobile widths where possible.

At very narrow widths:
- allow horizontal scrolling
- or use min-width cards in a scrollable row

Do NOT fall back immediately to one card per row.

### Mobile compact sizes

Icon:
32–38px

Name:
11–13px

Description:
9.5–11px

Badges:
8–9px

Button:
compact but tappable

Hide or shorten secondary explanatory text if needed.

Example:

[ HUYỀN ]
Kiếm Tâm
+15% crit
[Chọn]

Do not show overly long 3-line badges on mobile.

---

## 2. AUDIO MODE — IPA AFTER ANSWER

Keep the current learning rule:

BEFORE answering in AUDIO mode:
- do NOT reveal the English word
- do NOT reveal IPA
- play pronunciation
- allow replay

AFTER the player completes the word:

The reward card MUST clearly show:

WORD
IPA
PART OF SPEECH
MEANING
AUDIO REPLAY

Example:

EIGHT
/eɪt/
number
số tám
[🔊 nghe lại]

IPA must be visibly separated from meaning.

Do not bury IPA in:

word: meaning (ipa)

Use a dedicated IPA line.

---

## 3. EXTEND AUDIO REWARD VISIBILITY

Current reward burst lifetime is around:

2.6 seconds.

This is too short when pronunciation and a new word can begin immediately.

Increase or dynamically control reward readability.

Recommended:

DIRECT:
1.8–2.2s

CLOZE:
2.5–3.0s

AUDIO:
3.2–4.0s

In AUDIO mode, the player needs enough time to compare:

heard sound
→ spelling
→ IPA
→ meaning

Reward display may fade earlier if the user starts typing the next word, but must not be overwritten instantly.

---

## 4. DO NOT SPAWN A NEW WORD WHILE OLD WORD REWARD IS ACTIVE

Current bug:

After handleWordSlain():
- asteroid is removed immediately
- asteroid count becomes 0
- game loop sees count === 0
- new word can spawn after ~0.12–0.38s
- old reward burst remains for 2.6s
- new meteor appears on top of the old reward

Fix this with a proper inter-word state.

Add something like:

this.wordTransitionLock

or:

this.nextSpawnAt

or:

floatingText.hasActiveReward()

### Correct flow:

WORD COMPLETE
↓
meteor destroyed
↓
reward card appears
↓
minimum readable delay
↓
reward begins fading / clears
↓
THEN spawn next meteor

Recommended delay:

DIRECT:
500–700ms

CLOZE:
800–1100ms

AUDIO:
1200–1600ms

Do not tie this only to asteroid count.

Game loop condition should become conceptually:

if (
  asteroidCount === 0 &&
  !wordTransitionLock &&
  !floatingText.hasBlockingReward()
) {
  spawnWord();
}

---

## 5. NEVER LET NEW TARGET OVERWRITE PREVIOUS WORD REWARD

Current sword altar logic clears the previous result as soon as a new target appears.

Change this behavior.

The “last learned word” area should persist independently from the current target.

Keep two separate states:

currentTargetDisplay
lastCompletedWordDisplay

Do not reuse one DOM element for both if it causes overwriting.

The player should be able to briefly see:

EIGHT
/eɪt/
số tám

while the next meteor begins only after the transition delay.

---

## 6. METEOR MUST ENTER FROM THE TOP

Current spawnY is roughly:

(field.hudBottom || 76) + 80

This makes the meteor suddenly appear within the visible field instead of entering from above.

Change spawn behavior:

spawnY should begin above the visible playfield.

Example:

spawnY = -baseRadius - 20

or slightly below the top HUD boundary only if HUD must remain protected.

The meteor should visibly ENTER the battlefield from above.

The word card and rock must move together from that starting point.

Do not pop the meteor directly into the middle-upper area.

---

## 7. METEOR MUST FALL STRAIGHT DOWN

Current code still uses:

lateralDrift = random

and therefore vx != 0.

For standard meteors:

vx = 0

fallAngle = Math.PI / 2

x remains constant during the fall.

Do not apply horizontal bounce.

Remove logic that reflects vx at screen edges for normal meteors because a vertical meteor should not need it.

If future special meteors require diagonal movement, make that an explicit archetype, not the default.

Example:

standard meteor:
vx = 0

special comet:
vx = ±...

boss projectile:
custom path

---

## 8. FIX METEOR SPRITE ROTATION

Current meteor orientation uses fallAngle offsets:

ice/void:
fallAngle - 3π/4

fire/thunder:
fallAngle - π/4

This can make the meteor visibly tilted even when falling vertically.

Instead define a fixed asset orientation offset per sprite.

Example:

const spriteRotationOffset = {
  ice: ...,
  fire: ...,
  void: ...,
  thunder: ...
};

rot = spriteRotationOffset[type];

Then only add extremely small wobble if desired.

Do not rotate the whole meteor based on horizontal velocity for standard vertical fall.

---

## 9. REDUCE WOBBLE

Current wobble can reinforce the appearance that the meteor is flying diagonally.

For normal meteors:
- tiny ±1° or ±2° wobble max

Not:
- visibly changing direction

The trail must extend mostly upward behind the meteor.

---

## 10. MOBILE SPAWN LANE

On mobile:
spawn at center or use 2–3 safe vertical lanes.

Example:

LEFT
CENTER
RIGHT

But once spawned:
x must remain fixed.

Do not randomly drift horizontally.

This gives a clear readable trajectory.

---

## 11. WORD REWARD POSITION

The reward card should not appear exactly where the next meteor will spawn.

Preferred:

meteor explodes
↓
reward card appears slightly below/next to explosion
↓
after transition delay it fades
↓
next meteor enters from top

Keep reward away from top spawn lane.

---

## 12. AUDIO MODE FLOW

Correct AUDIO sequence:

1. meteor begins entering from top
2. voice pronunciation plays
3. player hears word
4. player types
5. correct completion
6. slash
7. meteor breaks
8. reward card:
   WORD
   IPA
   TYPE
   MEANING
9. voice replay available
10. short reading delay
11. next meteor enters

Do not spawn next meteor immediately after step 7.

---

## 13. DIRECT MODE FLOW

DIRECT can be faster:

meteor
→ type
→ explode
→ short reward
→ next meteor

But still ensure the old reward is not visually overlapped by the new target.

---

## 14. CLOZE MODE FLOW

CLOZE:
- display meaning before answer
- after completion show word + IPA + meaning
- give slightly more reading time than DIRECT

---

## 15. TEST CASES

Test fast typist:

Complete 10 short words as quickly as possible.

Verify:
- no new meteor overlays old reward
- no reward gets replaced before readable
- no two meteors coexist unless explicitly designed
- IPA remains visible after AUDIO completion

Test standard meteor:
- enters from top
- falls vertically
- no diagonal drift
- sprite orientation looks natural
- trail points upward

Test mobile:
320x568
360x640
390x844
430x932

Verify:
- 3 talent choices remain horizontal/compact
- cards remain selectable
- no overflow breaking modal

---

## ACCEPTANCE CRITERIA

This task is only complete if:

- mobile talent choices are horizontal
- AUDIO mode shows IPA after success
- new word does not overlap old reward
- reward timing differs appropriately by mode
- meteor visibly enters from top
- normal meteor falls straight down
- meteor sprite does not look diagonally tilted
- mobile remains playable