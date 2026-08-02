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

The Rails API lives in [`api/`](api/) and runs independently:

```bash
cd api
brew services start postgresql@17   # once
bundle install
bin/rails db:prepare                # create + migrate + seed
bin/rails server -p 3001
```

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
components/     Card, MatchChip, StatBlock, PositionBadge, EditableField, TabBar, …
data/           types.ts + seed.ts (6 players, 2 teams, 4 postings)
lib/            match.ts (scoring engine), store.tsx (in-memory state), units, theme, labels
api/            Rails 8 API-only backend — see api/README.md
```

This is a monorepo: the Expo client at the root, the Rails API under `api/`. Metro's
`blockList` excludes `api/` so the bundler doesn't watch a Ruby tree.

**The client is not yet wired to the API** — it still reads `data/seed.ts` in memory, exactly
as before. The backend is built, tested and runnable independently; connecting the two is the
next step.

## Match engine

`scoreMatch(player, posting)` in `lib/match.ts` is a pure weighted sum of four normalized
sub-scores, and powers **both** feeds — the player feed scores postings against the current
player, the coach feed scores players against the selected slot.

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

Every `EditableField` commit writes straight into the in-memory store, so both feeds re-sort
on the next render. Shrinking Marcus Webb from 6'2" to 5'8" on the Player Profile, for
example, drops him from 96% to 71% on the Mustangs' starting PG slot and swaps the top two
cards in his feed.
