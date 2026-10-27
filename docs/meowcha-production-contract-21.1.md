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

Record final local tests, container tests, production route checks and the deployed
commit here at deployment time. Browser viewport simulation is not physical-device
testing, and unauthenticated route existence is not an authenticated user-flow test.
