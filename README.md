# HoopSwitch

Transfer portal for anyone. Find the right team for you.

A runnable Expo prototype of a basketball transfer/recruiting marketplace. Front-end only:
all state is in-memory React state seeded from local files in `data/`. No backend, no auth,
no network calls, no database.

## Run it

```bash
npm install
npx expo start
```

Then pick a client:

- **Phone (real iOS/Android):** scan the QR code with the iPhone **Camera** app to open in
  **Expo Go**. Phone and laptop must be on the same Wi-Fi; `npx expo start --tunnel` works
  around isolated networks. No extra tooling needed.
- **Web:** press `w`, or open `http://localhost:8081`. Nothing to install.
- **Simulators:** press `i` or `a`. These need local native tooling — **Xcode** for `i`,
  **Android Studio** for `a`.

```bash
npm run typecheck   # tsc --noEmit, strict
npx expo-doctor      # 18/18 checks pass
```

### Backend

The client now reads from the Rails API in [`api/`](api/), so **start it first**:

```bash
cd api
brew services start postgresql@17   # once
bundle install
bin/rails db:prepare                # create + migrate + seed
bin/rails server -p 3001 -b 0.0.0.0
```

`-b 0.0.0.0` matters: without it Rails binds to localhost only and a phone
running Expo Go can't reach it. The client resolves the API host from Expo's
`hostUri` — your machine's LAN IP on device, `localhost` on web/simulator — so
no manual IP editing is needed. Override with `EXPO_PUBLIC_API_URL` to point at
a deployed API.

> **Don't use `npx expo start --tunnel` with the API.** The tunnel forwards only
> Metro's port (8081), so port 3001 is unreachable through it and every request
> fails. Use plain `npx expo start` with the phone and laptop on the same Wi-Fi.
> If you genuinely need a tunnel, expose the API separately and point
> `EXPO_PUBLIC_API_URL` at that public URL:
>
> ```bash
> cloudflared tunnel --url http://localhost:3001    # prints a https://… URL
> EXPO_PUBLIC_API_URL=https://that-url.trycloudflare.com npx expo start --tunnel
> ```

Sign in with any seeded account (all use password `password123`), e.g.
`marcus.webb@example.com` for the player flow or
`mike.bradley@westernmustangs.example.com` for the coach flow. See
[api/README.md](api/README.md) for the full list.

### Why Expo SDK 54 and not the latest

Pinned to **SDK 54** deliberately, so it opens in Expo Go on a physical phone.

Since SDK 54, Expo Go ships **one App Store version per SDK** — it no longer bundles several
SDKs at once the way the old `2.x` builds did. The current App Store Expo Go is `54.0.2`, so it
runs SDK 54 projects only. This app was originally built on SDK 57 and Expo Go rejected it with
"incompatible… requires a newer version of Expo Go", and there's no way to get a newer Expo Go
from the App Store. Running a newer SDK on a real device needs a custom development build
(Xcode locally, or EAS Build plus a paid Apple Developer membership for device provisioning).

If you later move to a development build and bump the SDK, `npx expo install --fix` realigns the
dependency set. The only SDK-version-sensitive import in the codebase is `BottomTabBarProps` in
`components/TabBar.tsx`: SDK 54 takes it from `@react-navigation/bottom-tabs`, whereas SDK 57
vendors react-navigation and exposes it via `expo-router/tabs`.

## Structure

```
app/            expo-router routes
  index.tsx                    role select (stands in for auth)
  player/(tabs)/index.tsx      Player Home — job feed
  player/(tabs)/profile.tsx    Player Profile — editable
  player/posting/[id].tsx      posting detail + score breakdown
  coach/(tabs)/index.tsx       Coach Home — talent feed, scoped by slot
  coach/(tabs)/profile.tsx     Coach Profile — editable roster slots
  coach/player/[id].tsx        player detail + fit across all slots
  auth/                        splash -> welcome -> sign-in / sign-up
components/     Card, MatchChip, StatBlock, PositionBadge, EditableField, TabBar, …
data/           types.ts (shared enums) + seed.ts (offline reference data)
lib/            api.ts (typed API client), session.tsx (JWT + persistence),
                useApi.ts (loading/error/refetch), units, theme, labels, time
api/            Rails 8 API-only backend — see api/README.md
```

This is a monorepo: the Expo client at the root, the Rails API under `api/`. Metro's
`blockList` excludes `api/` so the bundler doesn't watch a Ruby tree.

**The client is wired to the API.** Auth is a real JWT session persisted in
`expo-secure-store` (localStorage on web); both feeds are scored and sorted server-side; and
Apply/Invite write `connections` rows. There is no in-memory seed store any more — `lib/store.tsx`
was removed.

`lib/match.ts` and `data/seed.ts` are no longer imported by the app. They're kept as the
offline reference the backend's `match_scorer_test.rb` pins its score matrix against; delete
them if you don't want that safety net.

## Match engine

Scoring runs **on the server** — `MatchScorer` in `api/app/services/match_scorer.rb`. Both
feeds arrive already scored and sorted; the client just renders `match.score`, `match.tier` and
`match.reason`. It's a pure weighted sum of four normalized sub-scores.

| Component  | Weight | Rule                                                       |
| ---------- | ------ | ---------------------------------------------------------- |
| Position   | 0.35   | exact `1.0`, adjacent `0.5`, else `0`                      |
| Height     | 0.25   | one-sided; taller than ideal is never penalised (10cm tol) |
| Weight     | 0.15   | symmetric around ideal (8kg tolerance)                     |
| Production | 0.25   | `min(ppg / 12, 1)`                                         |

`score = round(100 × Σ wᵢ·sᵢ)`; `score >= 78` is the `good` (green) tier, everything else is
`partial` (amber). A partial's reason names its weakest component.

Physical measurements are stored canonically in metric (`height_cm`, `weight_kg`) and
converted to ft/in + lbs for display in `lib/units.ts`.

## Editing re-scores live

Every `EditableField` commit PATCHes the API optimistically, so the next feed load re-scores
server-side. Shrinking Marcus Webb from 6'2" to 5'8" on the Player Profile drops him from 96%
to 71% on the Mustangs' starting PG slot and swaps the top two cards in his feed. The same
holds on the coach side: loosening a slot's ideal height re-ranks its candidates.

Apply and Invite are real writes — both create a `connections` row, with `initiated_by`
derived from the caller's role. A card renders as "Applied"/"Invited" when the API reports
`connected: true`, so the state survives a reload rather than living in component state.
