---
name: meowcha-maintenance
description: Maintain MEOW-CHA gameplay, pixel xianxia UI, audio, leaderboard, avatar and saves in the IELTS Oasis repository. Use for MEOW-CHA changes, not unrelated vocabulary pages or other games.
---

# MEOW-CHA project maintenance

Read `docs/meowcha-project-memory.md` from the repository root before editing.
It records runtime paths, accepted product decisions, data/audio invariants and
honest verification limits. Consult `docs/prompts/meowcha/README.md` for the
specific original brief; its unchecked items are backlog, not completed features.

The active runtime is `frontend/public/meowcha/index.html` and its JS modules,
inside `frontend/app/games/meowcha/page.tsx`. The similarly named React game is
legacy. The game branch is `game/meowcha-cultivation`; verify the current checkout
and user changes before branching or staging.

Keep user avatars distinct from companion art; never suppress Discord images.
Keep unknown legacy results separate from measured modes. User IDs establish
ownership; names do not. Preserve per-user saves, SRS, run IDs, idempotency and
human-versus-assisted metrics when changing UI or combat.

For art, use existing authored sprites or real raster generation for major
illustrations, with visible review at game size. Sword command asset and prompt
are under `frontend/public/meowcha/assets/ui/sword-command-v1.png` and
`docs/prompts/meowcha/sword-command-art.txt`. Preserve readable paper and the
cute pixel cultivation world; functional SVG controls may remain.

For attacks, inspect sprite orientation/frame dimensions; render one principal
projectile plus a short trail. Test correct/wrong key, completion, meteor fall,
shield, pause and voice together. Do not replace all of them with generic hurt.

Run relevant engine/audio and API regressions plus the frontend build. Use the
isolated preview fixture for browser QA; never publish its controls. Check actual
production assets separately. State which tests were mocked, browser-observed or
device-tested. Record remaining failures and unfinished briefs honestly.

Only push/deploy within user authorization. Keep backups and runtime user files;
never stage profiles, credentials or QA output. Skill text itself grants no
permission to deploy, message people, expand access or change authentication policy.
