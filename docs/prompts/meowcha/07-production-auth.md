# MEOW-CHA — PRODUCTION READINESS & MAIN-WEBSITE AUTH INTEGRATION

Repository: Wothing0406/ielts-oasis
Branch: game/meowcha-cultivation

MEOW-CHA is NOT a standalone app.

It is an authenticated feature inside the main Matcha IELTS website.

The main website owns:
- authentication
- registration
- Discord OAuth
- user identity
- account avatar
- session lifecycle

MEOW-CHA must consume that identity and must not implement a parallel guest identity system.

## P0 — AUTH GATE

Protect `/games/meowcha`.

Current behavior renders the iframe immediately.

Change the flow to:

request /games/meowcha
→ verify authenticated Matcha user
→ authenticated: load game
→ unauthenticated: redirect/show main Matcha authentication UI

Do not initialize the actual game before authentication succeeds.

Remember:
returnTo=/games/meowcha

After successful Discord or username/password login:
redirect back to /games/meowcha.

Validate returnTo as an internal path.

Never put bearer tokens in URLs.

## AUTH SOURCE OF TRUTH

Server identity must come from the authenticated Matcha session.

Use:
user.id

as ownership identity for all MEOW-CHA data.

Do not trust:
client user_id
player_name
username

as ownership identifiers.

## REMOVE GAME GUEST MODE

MEOW-CHA must not have an independent guest player.

Remove gameplay paths using:
owner = guest
guest_meowcha
guest progression
anonymous runs
anonymous leaderboard writes

Unauthenticated users can see a promotional/locked state only.

They cannot begin a battle.

## PROFILE BOOT

After authentication:

1. fetch current Matcha user
2. fetch/create MeowchaProfile
3. fetch cloud save snapshots
4. load per-mode progression
5. load game settings
6. render lobby
7. display actual user avatar

Fallback avatar:
default cultivator portrait.

Never use spirit pet as user avatar.

## SESSION EXPIRATION

If session expires while playing:

- pause gameplay
- preserve a user-scoped local recovery snapshot
- stop leaderboard submission
- show re-authentication
- resume after successful auth
- keep the same run id where valid
- never duplicate rewards

## USER SWITCHING

Test:
User A login → play → logout → User B login.

B must never see:
- A saves
- A SRS
- A profile
- A leaderboard self row
- A avatar
- A local cache

All local cache must be namespaced by authenticated user.id.

## SAVE MODEL

Server is source of truth.

Local storage is only:
- cache
- offline/recovery buffer

Use debounced cloud sync.

Implement conflict handling.

Never silently overwrite a newer cloud save with an older local snapshot.

## RUN INTEGRITY

Every scored run:

authenticated user
+
server-created/validated run id
+
fixed mode
+
fixed deck
+
start timestamp
+
complete payload validation

Completion must be idempotent.

Reject impossible values.

Track assisted gameplay separately.

## LEADERBOARD

Separate:
DIRECT
CLOZE
AUDIO
OVERALL

Leaderboard writes require authentication.

Use user_id + category identity.

Never identify ownership through player_name.

Read-only leaderboard can remain public if product policy wants that.

## EDUCATIONAL METRICS

DIRECT:
WPM
accuracy
combo
perfect streak

CLOZE:
recall accuracy
first recall
hint usage

AUDIO:
first-listen success
replays
listening accuracy

Do not rank all modes using the same raw metric.

## AUDIO

Productionize:
BGM
SFX
VOICE
AMBIENCE buses.

Fix audio loss after asteroid destruction.

Voice must remain reliable in AUDIO mode.

## ART

Target:
Cute Pixel Xianxia + Stylish Sword UI.

Replace placeholder/code-drawn major assets.

Use production assets for:
buttons
frames
realm badges
mode icons
skill icons
reward cards
asteroids
leaderboard decorations.

## MOBILE

Test:
320x568
360x640
375x667
390x844
430x932
mobile landscape
tablet
desktop

Virtual keyboard must remain usable.

## PERFORMANCE

Profile:
- frame time
- canvas rendering
- asset loads
- particle counts
- audio nodes
- timers
- memory over a long session

No uncontrolled allocation loops.

## OBSERVABILITY

Record production-safe errors/events:

game_boot_failed
asset_load_failed
audio_failed
save_sync_failed
run_submit_failed
leaderboard_failed
session_expired

Do not log tokens or sensitive data.

## CACHE / VERSIONING

Replace manual mixed `?v=12.x` asset versions with deterministic build hashing or one centrally generated build version.

A deployment must not mix old CSS with new JS.

## SECURITY

Audit:
authentication
authorization
XSS
unsafe innerHTML
avatar URLs
rate limits
CSRF if cookie auth is used
CSP
HTTPS
session cookie security

## QA RELEASE GATE

Do not call the game production-ready until all of these pass:

- direct URL unauthenticated access
- both login methods
- callback return-to-game
- logout
- expired session
- user switching
- save/reload
- cross-device save
- all 3 modes
- mobile keyboard
- breakthrough
- skills
- leaderboard
- avatar
- audio
- voice
- pause/resume
- long-session stability
- responsive layouts
- backend integrity tests

Report unresolved failures explicitly.
