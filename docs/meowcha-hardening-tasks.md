# Meow-Cha: gameplay, learning and UI hardening

Target branch: `game/meowcha-cultivation`. Runtime: `/games/meowcha` →
`/meowcha/index.html` → `js/main.js` (the React legacy game is not this runtime).

## Work breakdown

- [ ] 0. Preserve the current checkout; recover the latest game source on the game branch; exclude browser profiles and scratch output from commits.
- [ ] 1. Unify physical/virtual input; define Space, Backspace and Tab; implement and test every talent; separate human typing from assistance.
- [ ] 2. Introduce authenticated run identities, bounded server validation, idempotent leaderboard/profile updates and a backward-compatible migration. Preserve independent save modes, remaining shields and typing clocks; avoid repeated network writes.
- [ ] 3. Normalize cultivation terminology, the five realms and the WPM label across runtime screens and exports.
- [ ] 4. Schedule local word reviews with due dates/history/mastery; retain source CEFR metadata; give synonym bosses a specific sense and example; report human typing statistics.
- [ ] 5. Audit and reuse existing art for navigation, functional icons, cultivation platform, formation and buttons. Verify readability and touch layout at small portrait/landscape sizes and desktop.
- [ ] 6. Add meaningful gameplay/API regression tests; run build/lint; inspect real browser renders, asset failures and certificate export.
- [ ] 7. Record results and remaining limitations; commit and push the game branch plus a clean backup branch.

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
