# Sample statsheets

Test data for the coach statsheet import (Team profile → **Upload a statsheet**).

Emails match the seeded players in `api/db/seeds.rb`, so rows resolve against a
freshly seeded database.

## Files

| File | What it's for |
| --- | --- |
| `statsheet-happy-path.csv` | Six real players, clean headers. Everything should match. |
| `statsheet-messy.csv` | Every failure mode at once — see the table below. |

Both are comma-separated, so they work with **Choose CSV file**. To test the paste
path instead, open either in a spreadsheet and copy the cells: that puts
*tab*-separated text on the clipboard, which the parser detects on its own.

## What `statsheet-messy.csv` exercises

| Row | Expected outcome |
| --- | --- |
| `marcus.webb@…` | **Will update** — and shows `Pts`/`Reb`/`Ast`/`FG` mapping onto PPG/RPG/APG/FG% via header aliases |
| `elijah.carter@…` | **Will update** |
| `sam.okafor+…@…` | **Will update** — checks a `+`-addressed email isn't mangled |
| `nobody@nowhere.test` | **Not found** |
| `deshawn.price@…` | **Bad data** — `n/a` in the points column is rejected rather than written as 0 |
| `andre.boucher@…` | **Bad data** — `570%` is outside the 0–100 range |
| `23` | **Not found** as shipped (see below) |
| *(blank)* | **Bad data** — no email or jersey number |

The `Notes` column should appear under **Ignored**, and the quoted
`"starter, captain"` must not split into two cells.

## Testing jersey-number matching

Nobody has a jersey number yet, so the `23` row comes back *Not found*. Assign a
couple to try it:

```bash
cd api
bin/rails runner '
  PlayerProfile.joins(:user).find_by!(users: { email: "marcus.webb@example.com" }).update!(jersey_number: 23)
'
```

Re-upload and that row now resolves to Marcus Webb.

To see the **ambiguous** case — the reason a jersey number can't be trusted on its
own — give a second player the same number:

```bash
bin/rails runner '
  PlayerProfile.joins(:user).find_by!(users: { email: "jordan.ellis@example.com" }).update!(jersey_number: 23)
'
```

Now the `23` row reports *Ambiguous*, names both players, and is skipped rather
than written to whichever one the database happened to return first.

## Putting the data back

Uploading **overwrites** the players' own reported stats, so re-seed when you're
done poking at it:

```bash
cd api && bin/rails db:seed
```

That restores stats but leaves the upload provenance stamp. To clear that too:

```bash
bin/rails runner 'PlayerProfile.update_all(stats_updated_at: nil, stats_updated_by_team_id: nil, jersey_number: nil)'
```
