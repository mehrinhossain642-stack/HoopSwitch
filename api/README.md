# HoopSwitch API

Rails 8 API-only backend for HoopSwitch, built to the MVP tech proposal.
Media hosting (video/photo upload, transcoding, CDN) is **out of scope** — the
schema and architecture are shaped so it drops in later additively.

## Stack

| Layer       | Choice                          |
| ----------- | ------------------------------- |
| API         | Ruby on Rails 8.1 (API-only)    |
| Database    | PostgreSQL 17                   |
| Auth        | JWT via `devise` + `devise-jwt` |
| Match logic | Plain service object            |

## Run it

```bash
brew services start postgresql@17   # once
bundle install
bin/rails db:prepare                # create + migrate + seed
bin/rails server -p 3001
```

```bash
bin/rails test      # 26 tests
bin/rubocop         # clean
```

Seeded accounts all use the password `password123`:

| Email                                       | Role   |
| ------------------------------------------- | ------ |
| `marcus.webb@example.com`                   | player |
| `elijah.carter@example.com`                 | player |
| `deshawn.price@example.com`                 | player |
| `andre.boucher@example.com`                 | player |
| `jordan.ellis@example.com`                  | player |
| `tyrell.nkemdi@example.com`                 | player |
| `mike.bradley@westernmustangs.example.com`  | coach  |
| `dana.whitfield@carletonravens.example.com` | coach  |

## API surface

Auth returns the JWT in the `Authorization` response header; send it back as
`Authorization: Bearer <token>`.

| Method                  | Path                        | Notes                             |
| ----------------------- | --------------------------- | --------------------------------- |
| `POST`                  | `/signup`                   | Creates account + role record     |
| `POST`                  | `/login`                    | Returns JWT                       |
| `DELETE`                | `/logout`                   | Rotates `jti`, revoking the token |
| `GET` `PATCH`           | `/profile`                  | Player only                       |
| `POST` `DELETE`         | `/highlights[/:id]`         | Player only, external links only  |
| `POST`                  | `/career_stats`             | Player only                       |
| `GET` `PATCH`           | `/team`                     | Coach only, embeds postings       |
| `POST` `PATCH` `DELETE` | `/postings[/:id]`           | Coach only, own team              |
| `GET`                   | `/feed/postings`            | Player-facing, scored + ranked    |
| `GET`                   | `/feed/players?posting_id=` | Coach-facing, scored + ranked     |
| `GET` `POST` `PATCH`    | `/connections[/:id]`        | Apply / invite, accept / decline  |

### Example

```bash
TOKEN=$(curl -s -D - -o /dev/null -X POST localhost:3001/login \
  -H 'Content-Type: application/json' \
  -d '{"user":{"email":"marcus.webb@example.com","password":"password123"}}' \
  | grep -i '^authorization:' | sed 's/^[Aa]uthorization: //' | tr -d '\r')

curl -s localhost:3001/feed/postings -H "Authorization: $TOKEN"
```

## Data model

Metric units (`cm` / `kg`) are canonical server-side; the client converts to
ft/in and lbs for display.

```
users              email, encrypted_password, role (player|coach), jti
player_profiles    user_id, name, position, height_cm, weight_kg, wingspan_cm,
                   age, dominant_hand, eligibility_years, location, bio,
                   ppg, rpg, apg, fg_pct
career_stats       player_profile_id, season, team_name, gp, ppg, rpg, apg
highlights         player_profile_id, title, source_type (external|uploaded),
                   url, duration_seconds, thumbnail_url
teams              user_id, name, league, location, wins, losses, logo_url,
                   roster_size, coach_name, about
postings           team_id, position, ideal_height_cm, ideal_weight_kg,
                   expected_minutes, status (open|in_review|closed), notes, headline
connections        posting_id, player_profile_id, initiated_by (player|coach),
                   status (pending|accepted|declined)
```

Two design calls, carried over from the proposal:

- **One `connections` table** rather than separate `applications` and `invites`.
  A player applying and a coach inviting are the same relationship with a
  different `initiated_by`. `initiated_by` is derived from the authenticated
  user's role, never trusted from the request body.
- **`highlights.source_type` + `url` is the media hook.** MVP rows are always
  `external`; the model actively rejects `uploaded` so the scope boundary is
  explicit rather than merely unimplemented. When uploads ship, new rows point at
  a CDN URL — no migration of the profile flow.

Every enum is enforced by a Postgres `CHECK` constraint as well as a model
validation, so bad data can't arrive via a console or a future service.

Additions beyond §3's column list: `postings.headline` (the user-facing feed
title, which the mocks show but §3 omits), and `teams.roster_size` /
`coach_name` / `about` (rendered on the coach profile). `applicant_count` is
**derived** from `connections` rather than stored, so it can't drift from the
rows it summarises.

## Match engine

`MatchScorer.call(player, posting)` → `Result(score:, tier:, reason:, breakdown:)`.
A weighted sum of four sub-scores, each normalized 0–1. The same function powers
both feeds.

| Component  | Weight | Rule                                            |
| ---------- | ------ | ----------------------------------------------- |
| Position   | 0.35   | exact `1.0`, adjacent `0.5`, else `0`           |
| Height     | 0.25   | one-sided, 10cm tolerance (see deviation below) |
| Weight     | 0.15   | symmetric, 8kg tolerance                        |
| Production | 0.25   | `min(ppg / 12, 1)`                              |

`score = round(100 × Σ wᵢ·sᵢ)`; `>= 78` is the green `good` tier, else amber
`partial`. A partial's `reason` names its weakest component.

Scoring runs on the fly per feed request — the dataset is tiny, so nothing is
cached. If feeds grow, precompute into a `match_scores` table on write.

**Deviation from the proposal, deliberate.** §4 writes height fit as
`1 - min(|player - ideal| / tolerance, 1)`, which is symmetric and would penalise
a player for being *taller* than the slot's ideal. `ideal_height_cm` is a floor,
not a target — the UI renders it as "Ideal ht 6'1"+" — so height is scored
one-sided here: at or above ideal scores a full `1.0`. Weight stays symmetric as
specified, since being far from the target playing weight in either direction is
a genuine fit concern. This also matches the shipped client, whose spec called
for one-sided height explicitly.

`MatchScorer` is duplicated in the React Native client (`../lib/match.ts`) so the
prototype can run offline. `test/services/match_scorer_test.rb` pins the full
6-player × 4-posting score matrix so the two implementations cannot drift apart
silently. If you change the weights here, change them there too.

## Notes for later

- **Auth**: `devise-jwt` with the JTIMatcher revocation strategy — one `jti`
  column, no denylist table. Logout rotates it. Swap to a managed provider
  (Clerk/Auth0) if social login becomes a priority.
- **Sessions**: this API has no session store, so Devise sign-in uses
  `store: false` and `/logout` skips Devise's `verify_signed_out_user` (which
  ignores JWT strategies by design). See `app/controllers/auth/`.
- **Hosting**: Render or Railway — managed Postgres plus push-to-deploy. Move to
  AWS when media/transcoding lands.
- **CORS**: wide open in development. In production set `ALLOWED_ORIGINS` to a
  comma-separated allowlist.
- **JWT secret**: falls back to `secret_key_base`. Set `DEVISE_JWT_SECRET_KEY`
  (or a `devise_jwt_secret_key` credential) before deploying.

## Not built (deferred per §6)

All media hosting, transcoding and CDN; in-app messaging; push notifications;
search/filter beyond position and location; learned/embedding-based matching;
admin and moderation tooling. The client is not yet wired to this API — it still
reads its local seed files.
