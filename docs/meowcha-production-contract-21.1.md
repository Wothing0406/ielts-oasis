# MEOW-CHA 21.1 — production contract and leaderboard scope

## Release intent

21.1 repairs the mixed-release failure where v21 HTML could be served with stale
static files or API routes. It also makes the two independent leaderboard dimensions
explicit:

- **Kỳ xếp hạng:** Thiên Bảng / Tuần này and Phong Thần / Vĩnh viễn.
- **Pháp môn:** Tổng Đạo, Trực Diện, Ngộ Đạo and Thính Âm.

Changing either dimension reloads Top 3, columns, rows and the signed-in player's
card from the corresponding server query. The scope and mode controls live in one
sticky toolbar so neither can be mistaken for a passive label or be lost above the
podium.

## Ranking semantics

- Weekly uses the Vietnam Monday boundary and persisted weekly gain checkpoints.
  A living run may appear as `TẠM`; death is not required to preserve a weekly rank.
- Lifetime uses the highest synchronized Tu Vi and highest evidenced realm and never
  resets each Monday.
- Weekly and lifetime requests are race-safe in the UI: a late weekly response cannot
  overwrite the lifetime board after the user changes scope.
- Weekly cosmetic rewards are display-only and do not affect gameplay stats.

## Release safety

- `/api/version` and `/api/meowcha/version` publish build metadata and capabilities.
- The client blocks writes when the schema version differs.
- Known 404 and identical 422 failures are circuit-broken; transient failures are
  retried only within a bound.
- Run start is confirmed before checkpoint/complete, and complete has one in-flight
  request per run ID.
- Docker images contain their application/static artifacts. Only runtime audio data
  remains mounted, avoiding source bind mounts that can create version skew.
- The trusted same-origin iframe no longer carries the ineffective sandbox pairing.

## Verification ledger

Production deployment completed on 2026-10-27 (Asia/Bangkok):

- Game/API implementation baseline: `55b031c`; backend runtime fix: `ed3ce49`;
  packaged-static permission fix: `bc5856e`.
- `npm run test:meowcha`: 108/108 passed.
- Linux backend/API suite: 40/40 passed.
- Production returned HTTP 200 for `/games/meowcha`, the versioned game HTML,
  `Difficulty.js`, `WeeklyRace.js`, `LeaderboardHalls.js`, both version endpoints,
  and both `scope=WEEKLY` and `scope=ALL_TIME` hall queries.
- Weekly and lifetime production responses were not identical. At verification time
  weekly returned one ranked player and lifetime returned two; the weekly row used
  weekly Tu Vi while the lifetime row preserved total career Tu Vi.
- The direct production engine loaded release 21.1 in the in-app browser and reached
  the expected account session gate. The parent page's Cloudflare challenge prevents
  an automated authenticated visual click-through, so authenticated lifecycle proof
  comes from the Linux API suite and production 200 checkpoint/hall traffic.
- Backend and web containers were healthy; the Discord worker was running with its
  inappropriate inherited API healthcheck disabled. Runtime TTS storage was writable.

Browser viewport simulation is not physical-device testing, and an unauthenticated
route existence check is not by itself an authenticated user-flow test.
