# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Fred Wright Tournament Manager — an MVP for the Oakley Country Club pro and Golf Committee chair, supporting two facets of the club's signature tournament (the Fred Wright Jr. Memorial Member-Guest, Aug 6-8):

1. **Roster management** — kanban-style admin for participants, waitlist, deferrals, and new Golf Genius signups.
2. **Engagement-based eligibility** — a points system that ranks the eligible pool (returned-from-defer + waitlist + new signups) by participation across club events, replacing the "click race" timestamp ordering that members find unfair.

Not a finished product. **Simplicity, demo-ability, and buy-in from the pro and chair trump features.**

## File layout

```
index.html         placeholder (coming-soon page; deployed publicly)
app.html           Tournament Builder — kanban admin (real, the work product)
standings.html     Engagement standings — leaderboard + settings drawer (real)
the-program.html   Member-facing tournament site
shared.js          state library used by app.html and the-program.html
oakley-logo.png    Oakley crest (used by the-program.html and the placeholder)
.vercelignore      keeps real files off production while the placeholder is live
.claude/launch.json  vercel dev / python http.server launch configs
designs/           design exploration artifacts (variants, comparison boards) — not deployed
```

## Running locally

No build step. Serve however you like:

- `vercel dev --listen 3000` (the configured launch)
- `python3 -m http.server 3001`
- Or just open the file directly in a browser

When working on the admin kanban, **hit `app.html`** directly — `index.html` is the placeholder.

## Deployment & the placeholder

`index.html` is intentionally a coming-soon page right now. The chair was sent the Vercel link before the demo was ready, so production is gated until the in-person walkthrough.

While in placeholder mode:
- `.vercelignore` excludes `app.html`, `standings.html`, `the-program.html`, `shared.js`, `designs/`, `.claude/` from production
- Only `index.html` and `oakley-logo.png` reach Vercel
- Direct URLs like `/standings.html` 404 on production but still work locally

To flip to "demo live" for real:
```sh
mv index.html _placeholder.html && mv app.html index.html
rm .vercelignore
vercel --prod
```

To flip back to placeholder:
```sh
mv index.html app.html && mv _placeholder.html index.html
# restore .vercelignore (or git checkout it)
vercel --prod
```

## Architecture — kanban side

**`shared.js`** is the state library. Owns the kanban data model, exposes helpers via `window.FW`. Loaded by `app.html` and `the-program.html`.

**`app.html`** is the Tournament Builder. Single page with:
- Sticky left sidebar (Tournament Builder, Standings, Players soon, History soon, Members website external link, season switcher, Reset)
- Page header (slot meter, ⌘K command palette, view toggle, Print)
- Main view toggles between Board (kanban) and Roster (alphabetical)
- Hidden print-view for `window.print()`
- Modal overlay for player detail
- ⌘K palette overlay for fuzzy player + action search

**Full re-render on every state change.** `render()` replaces `mainEl.innerHTML` and re-attaches listeners on the new DOM. No virtual DOM, no diffing. Adding per-tick work to `renderCard` or `renderInternal` compounds across ~80 cards.

**Persistence is `localStorage`** under `STORAGE_KEY` (currently `'fred-wright-v6'` in shared.js). When changing seed shape, defaults, or data-model semantics, **bump the version suffix** — `loadState` falls back to `seedData()` when the key is missing, so bumping forces every user to see the new seed on reload without clicking Reset.

## Architecture — engagement side

**`standings.html` is self-contained.** Its own IIFE, its own seed data (PLAYERS, TOURNAMENTS), its own state. **It does not load shared.js and does not persist to localStorage.** This is intentional for demo iteration speed: tuning the engagement model can't break kanban data, and the demo always starts fresh on page reload.

If/when engagement gets wired in for real:
- Reuse PLAYERS from shared.js
- Move TOURNAMENTS, CATEGORIES, DISCRETIONARY_AWARDS into shared.js state slice
- Bump `STORAGE_KEY`
- Replace standings.html's hardcoded data with `window.FW` reads

The standings IIFE is structured as:
- Static seed: `TOURNAMENTS` (32 events), `PLAYERS` (24 eligible-pool members)
- Defaults: `DEFAULT_CATEGORIES`, `DEFAULT_BONUSES`, `DEFAULT_CONFIG`
- Mutable state: `state.categories`, `state.bonuses`, `state.config`, `state.ui`
- Compute: `computePlayer(p, catById)` returns `{ byCategory, seniority, firstTimer, discretionary, noShowEvents, noShowPenalty, total, eligible }`
- Render: HTML-string generation, swapped via `innerHTML` on stable parents (delegation everywhere)

## Data model — kanban (shared.js)

Each player:
```js
{
  id: 'p123',
  name: 'Last, First',
  notes: '…',
  seasons: {
    2025: { list: 'participants' | 'deferred' | 'waitlist' | 'new', status?: 'pending' | 'confirmed' },
    2026: { ... }
  },
  history: [{ date: 'YYYY-MM-DD', event: '…', type: 'add'|'move'|'defer'|'return'|'confirm'|'decline'|'reorder', season?: number }],
  signupTimestamp?: '2026-01-04T08:00:00' // only for Golf Genius imports
}
```

Top-level state:
```js
{ activeSeason: 2026, players: [...], columnOrder: ['new','waitlist','participants','deferred'] }
```

`LIST_IDS = ['participants','deferred','waitlist','new']` is the set of valid buckets. `DEFAULT_COLUMN_ORDER` is the default left-to-right display order — different from `LIST_IDS` and overridable per user via drag-reorder.

## Data model — engagement (standings.html)

```js
DEFAULT_CATEGORIES = [
  { id: 'champ',  name: 'Championship',  weight: 12, color: 'major',      events: '...' },
  { id: 'tourn',  name: 'Tournament',    weight: 8,  color: 'premier',    events: '...' },
  { id: 'club',   name: 'Club Event',    weight: 5,  color: 'tournament', events: '...' },
  { id: 'league', name: 'League Match',  weight: 2,  color: 'league',     events: '...' }
];
// Discretionary is a separate variable pool (60 pts/year cap); not a tunable category.

DEFAULT_BONUSES = { seniorityCap: 10, firstTimer: 5, noShow: -2 };
DEFAULT_CONFIG  = { openSlots: 10, cutoffDate: '2026-06-21' };  // app deadline

// Each tournament:
{ id, name, date, label, categoryId, weightOverride? }

// Each player in the eligible pool:
{
  id, name, initials, years, source: 'defer'|'wait'|'new', sourceLabel,
  sub, firstTimer, played: [tid...], noShows: [tid...],
  discretionary: [{ id, pts, reason, date, awardedBy }, ...]
}
```

Effective tournament weight: `t.weightOverride ?? cat.weight`.

Total = sum of effective weights for `p.played` events on/before cutoff
      + `min(p.years, seniorityCap)`
      + `(firstTimer ? 5 : 0)`
      + sum of `p.discretionary[*].pts`
      + count of `p.noShows` events on/before cutoff × `noShow` (negative)

## Domain rules — kanban (enforced in shared.js)

- **60-slot cap** (`SLOT_CAP`). Soft — never blocks; slot meter warns and setup dialog flags over-cap rollovers.
- **No consecutive deferrals.** `guardDefer` checks `previouslyDeferred(player)` (i.e. `seasons[LAST_SEASON].list === 'deferred'`) before allowing a defer. If true, popup warns and defaults to Waitlist. This prevents members from gaming the system by always deferring.
- **Carryover requires verbal confirmation.** Rollover sets `seasons[CURRENT_SEASON] = { list: 'participants', status: 'pending' }`. The pro confirms or declines each pending player individually.
- **Golf Genius signups are self-confirmed by timestamp.** `IMPORT_PAYLOAD` seeds a fixed 25-name import at `1/4/2026 08:00:00–08:04:23`. Sub-second precision matters — it's the pro's evidence-based ordering for new-player placement.

## Domain rules — engagement (enforced in standings.html)

- **Cutoff date locks at the application deadline** (Jun 21, 2026). Only events on or before this date contribute to standings. The "What if?" slider lets the pro/chair preview alternative cutoffs without changing the configured one.
- **Seniority capped at 10 years.** Long-tenured members aren't rewarded indefinitely.
- **No-show ≠ didn't play.** Marking a player as no-show via the Tournaments tab removes the event from their `played` list AND adds it to `noShows`. They lose the event's weight AND take the −2 penalty. Restoring fully requires the global Reset (no per-row "undo to played").
- **Discretionary pool is capped at 60 pts/year.** When the pool hits 0, the Award button disables. Awards are immutable except for full removal via the × pill.
- **Override is absolute, not delta.** `t.weightOverride = 14` (not "+2 from default"). UI shows the delta visually; storage is the absolute value.

## Naming convention for "Deferred in YYYY"

A column labeled **Deferred in 2026** shows players with `seasons.2026.list === 'deferred'` — i.e., players sitting out the 2026 tournament. The label year always matches the tournament year they're sitting out (the season key). Card badge and modal stat row follow the same convention.

## Views

### app.html
- **Board** (default): 4-column kanban — `new | waitlist | participants | deferred`. Column order is draggable via the header grip. Only the active season is editable; `LAST_SEASON` is read-only.
- **Roster**: alphabetical by last name, split into "In the Tournament" vs "Waiting". Toggled via header.
- **Print** (`renderPrintView`): hidden div styled via `@media print`. Header Print button calls `window.print()`. Roster + waitlist only.

### standings.html
- **Hero** — title + lede + filter chips + What if? panel (slot count slider, cutoff date input, Reset)
- **Leaderboard** — ranked rows; click any row to expand into per-player breakdown (categories, bonuses, no-show penalties)
- **Settings drawer** with three functional tabs:
  - **Categories** — tunable weight steppers + read-only discretionary entry + bonuses + cutoff display
  - **Tournaments** — every event; per-event override stepper; click-to-expand for no-show toggle (player picker + red remove pills)
  - **Discretionary** — pool budget gauge, award form (player/points/reason/awarded-by), recent awards log with × remove

## Demo seed (standings.html)

The page opens with intentional "in-use" state so the demo feels like a real running system, not a blank slate:

- **Spring Member-Member is overridden to 14** (anniversary year, +2 from default) — visible in Tournaments tab as `override +2` flag
- **Murphy is flagged as a no-show for June Member-Guest** — drops from #8 to the bubble at #10
- **Carter is flagged as a no-show for May Member-Guest** — visible in below-cut narrative
- **3 discretionary awards seeded**: Burke (M-M starter duty +4), Chryssis (Junior Day +4), Russo (cart fleet +4)

The Reset button glows amber on initial load because the seeded state differs from defaults. Clicking Reset wipes the seed; refreshing the page restores it.

## Common gotchas

### Kanban (app.html / shared.js)
- **`render()` is called from many action handlers.** After mutating state: `saveState()` → `render()`. New mutation paths must follow this pattern.
- **Drag conflict between cards and columns.** Both use HTML5 drag events. `dragging` (card) and `columnDragging` (column) are module-level flags; handlers check the "other" flag and bail out to avoid stepping on each other.
- **`listDisplayName(listId, year)`** is the single source of truth for column labels — use it everywhere labels appear (kanban titles, modal move buttons, search aria-labels, history log entries).
- **Don't re-introduce a 5th column.** It was tried (forward-year defer preview) and removed in favor of a single deferred column per view, backed by the no-consecutive-defer rule.

### Engagement (standings.html)
- **standings.html does not load shared.js.** Self-contained IIFE. Don't add `<script src="shared.js">` thinking you'll inherit utilities — write/inline what you need.
- **Bar percentages compute over positive segments** (not `entry.total`). A no-show penalty makes `total < positiveTotal`, so naive percentage math would overflow the bar. Keep the `positiveTotal` calculation in `renderRow`.
- **Click-to-expand respects nested controls.** `e.stopPropagation()` on inner controls (steppers, no-show pickers); the row's own click handler checks `closest('.cat-stepper, [data-tn-noshow-pick]')` to bail. New in-row controls must follow the same pattern.
- **Function declarations are hoisted.** Module-init code (e.g., `PLAYER_OPTIONS_HTML`) calls `escapeHtml` before its source-line declaration. Works because of JS hoisting for `function` declarations. Don't convert those to `const escapeHtml = function`.
- **Reset clears seed state.** Reset wipes overrides, no-shows, weight tunings, and config — including the demo seed. Refresh the page to restore the seed.
- **No persistence yet.** Refresh = clean state. By design for demos. When persisting, route through shared.js / `STORAGE_KEY`.

### Deployment
- **`.vercelignore` is the source of truth for what's hidden.** File naming (`_app.html` etc.) doesn't protect anything; Vercel deploys whatever isn't excluded.
- **Confirm which `index.html` is current before `vercel --prod`.** Placeholder vs real is a single rename in production. The pulsing dot on the placeholder is the cheap way to verify locally before pushing.
