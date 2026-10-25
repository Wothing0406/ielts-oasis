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

For attacks, inspect sprite orientation/frame dimensions. The current reference
requests a visible authored beam sheet plus projectile, with a wider finishing
strike. Remove the old CatCultivator aiming tether/hovering sword; changing the
projectile alone leaves that dashed line visible. Keep timing, impact and score
separate. Test correct/wrong key, completion, meteor fall, shield, pause and voice.

For meaning repairs, use backend/game_data/meowcha_meaning_corrections.json and
LearningText normalization at load AND spawn, so SRS/save words are corrected.
Select one POS/sense for a clue, never a generic academic-vocabulary label or a
pipe-joined set of senses. Keep the shared IELTS vocabulary dataset unchanged.
Read docs/meowcha-completion-14.1.md for the data repair/backup procedure.

UI frames and secondary plaques live in assets/ui/jade-frame-v1.png and
carved-plaque-v1.png. Preserve primary sword actions. Check text's actual height
inside the parchment flex layout, not just its presence in the accessibility tree;
include a low phone with the keyboard open. Keep all asset versions in sync.

Run relevant engine/audio and API regressions plus the frontend build. Use the
isolated preview fixture for browser QA; never publish its controls. Check actual
production assets separately. State which tests were mocked, browser-observed or
device-tested. Record remaining failures and unfinished briefs honestly.

Only push/deploy within user authorization. Keep backups and runtime user files;
never stage profiles, credentials or QA output. Skill text itself grants no
permission to deploy, message people, expand access or change authentication policy.

For UI 15.0 and later, consult docs/meowcha-ui-migration.md and
meowcha-release-15.0.md. DesignSystem.js and meowcha-design-system.css own the
shared panel/action/stat hierarchy; do not restore cozy/sword/complete overrides.
Keep lifecycle-hidden buttons hidden. Ceremonial scroll panels must not shrink
podium/card content through flex. Certificate artwork is a canvas export, so
CSS changes outside its image do not migrate it.

Mobile talent choices stay in three compact columns, with horizontal scrolling
on the narrowest view and at least 44px-high choice buttons. Long explanations
remain available in details. Verify all four boss gates and saved skill choices.

LeaderboardHalls.js owns Overall/Direct/Cloze/Audio/Archive tabs. Do not restore
native mode dropdown navigation or sort every hall by score. The server returns
mode-specific ranking and self outside the visible limit. Keep old learning
counters unknown. Read the documented Dao Hanh formula before changing ranking.

Standard meteors enter from above with fixed x and asset-specific rock rotation;
keep the word card upright at the same y. FloatingText.hasBlockingReward blocks
all spawn paths, including bosses. AUDIO hides spelling/IPA before completion,
then shows separate word/IPA/type/meaning and persistent lastLearnedWord replay.
A delayed voice must still belong to an active target. Recheck realm thresholds
after loading a save left during a reward. Test ten rapid words in every mode.

Use Meowcha.app for UI skill activation; __meowchaGame is not installed. Test a
real button click as well as hotkeys, including freeze and cooldown. Latch game
over AFTER purge and stop the defeated update loop; otherwise every frame may
silence audio and submit/show defeat again. Skip global audio unlock handlers
inside audio settings so they cannot reset a checkbox before its change event.
When an active save mode is empty, preserve/resume another valid saved mode with
its own metrics, HP and skills. The is-reviewing phase hides current-target UI
and skill controls while the independent reward record is open.
