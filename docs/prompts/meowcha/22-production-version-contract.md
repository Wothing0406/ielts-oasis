# MEOW-CHA — FIX V21 PRODUCTION VERSION SKEW, 404 ROUTES & 422 RUN PAYLOAD

Repository: `Wothing0406/ielts-oasis`  
Branch: `game/meowcha-cultivation`  
Reference commit: `e2b1e0ac9775f056946fd7e569f0f1138163dbd8`

## Production symptoms

- `Difficulty.js` and `WeeklyRace.js` returned 404.
- `career/personal-record` and `runs/checkpoint` returned 404.
- `runs/complete` returned 422.
- The same-origin iframe used both `allow-scripts` and `allow-same-origin`.

## Required contract

1. Ship the two real static modules; do not remove their script tags to hide 404s.
2. Expose build SHA, build timestamp, MEOW-CHA schema/API version and capabilities.
3. Validate the complete-run payload and fix source counter semantics, including all
   v2 learning/human-assistance invariants. Never log tokens.
4. Migrate old saves by separating lifetime progression from clean per-run counters.
5. Confirm a server run before checkpoint/complete; complete a run exactly once and
   handle duplicates idempotently.
6. Use a capability handshake so the client does not repeatedly call known-missing
   routes during a rolling deployment.
7. Retry only transient network, 429 and 5xx failures. Circuit-break 404, auth and
   identical 422 failures.
8. Treat the game as a trusted same-origin feature and remove the ineffective iframe
   sandbox instead of presenting false isolation.
9. Deploy backend, static assets and HTML as one coordinated release (or compatible
   backend first), then smoke-test the exact production paths and authenticated flow.

## Acceptance

The release is not complete until static modules return 200, career/checkpoint routes
exist, complete-run satisfies schema, old saves cannot submit stale metrics, retries
are bounded, frontend/backend versions agree, and the production console has no
recurring 404/422 from this contract.

This stored brief is a product reference. Its presence is not evidence that production
deployment or authenticated smoke testing has completed.
