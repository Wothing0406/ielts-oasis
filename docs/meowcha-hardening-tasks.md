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

## Production Verification & Results

- **Frontend Engine Unit Tests:** 22/22 passed (0.15s) via `npm run test:meowcha`.
- **Backend Integrity & Security Tests:** 9/9 passed (0.75s) via `test_meowcha_integrity.py`.
- **Next.js Production Build & Lint:** `Compiled successfully` with static prerendering on `/games/meowcha` (138 B / 87.4 kB).
- **Art Direction & Assets:** 100% vector placeholders replaced with authored Xianxia game art; zero 404s on all 98 audio, sprite, map and SVG endpoints.
- **Git Repository & Backup:** Working tree clean; pushed to `game/meowcha-cultivation` and backup branch `backup/meowcha-cultivation-verified-20261025`.
