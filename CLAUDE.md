# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Fred Wright Tournament Manager — an MVP for the Oakley Country Club pro to manage the club's signature tournament (participants, waitlist, deferrals, new Golf Genius signups). Not a finished product: simplicity, demo-ability, and buy-in from the pro trump features.

## Running locally

No build step. The entire app is `index.html`. Serve it any way you like; the Vercel-linked configuration is:

```
vercel dev --listen 3000
```

Saved in `.claude/launch.json`. Deployed as the `fred-wright-tournament` Vercel project.

## Architecture

**Everything lives in `index.html`** — inline CSS, inline JS, no dependencies, no framework. The JS is wrapped in a single IIFE (`(function() { 'use strict'; ... })()`) near the bottom of the file. All state is closure-local; there's no module system.

**Full re-render on every state change.** `render()` rebuilds the main view by replacing `mainEl.innerHTML` and re-attaching listeners on the new DOM nodes. Old DOM and its listeners are garbage-collected. No virtual DOM, no diffing, no incremental updates. Keep this in mind: adding per-tick work to `renderCard` or `renderInternal` compounds across ~80 cards.

**Persistence is `localStorage` under `STORAGE_KEY`.** When changing seed shape, defaults, or data-model semantics, **bump the version suffix** (currently `'fred-wright-v6'`). `loadState` falls back to `seedData()` when the key is missing; bumping forces every user to see the new seed on reload without clicking Reset.

## Data model

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

`LIST_IDS` (`['participants','deferred','waitlist','new']`) is the set of valid buckets. `DEFAULT_COLUMN_ORDER` is the default left-to-right display order — different from `LIST_IDS` and overridable per user via drag-reorder.

## Domain rules (enforced in code)

- **60-slot cap** (`SLOT_CAP`). Soft: the app never blocks the pro, but the slot meter warns and the setup dialog summary flags over-cap rollovers.
- **No consecutive deferrals.** `guardDefer` checks `previouslyDeferred(player)` (i.e. `seasons[LAST_SEASON].list === 'deferred'`) before allowing a new defer. If true, it pops a warning and defaults to Waitlist instead — this is what prevents players from gaming the system by always deferring.
- **Carryover requires verbal confirmation.** Rollover sets `seasons[CURRENT_SEASON] = { list: 'participants', status: 'pending' }`. The pro confirms or declines each pending player individually.
- **Golf Genius signups are self-confirmed** by timestamp. `IMPORT_PAYLOAD` seeds a fixed 25-name import at `1/4/2026 08:00:00–08:04:23` — timestamp sub-second precision matters because it's the pro's evidence-based ordering for new-player placement.

## Naming convention for "Deferred in YYYY"

A column labeled **Deferred in 2026** shows players with `seasons.2026.list === 'deferred'` — i.e., players currently sitting out the 2026 tournament. The label year always matches the tournament year they're sitting out (the season key). The card badge and modal stat row follow the same convention.

## Views

- **Management view** (default): 4-column kanban — `new | waitlist | participants | deferred`. Column order is draggable via the header grip. Only the active season (`CURRENT_SEASON`) is editable; `LAST_SEASON` is read-only (historical snapshot).
- **Player view**: alphabetical by last name, split into "In the Tournament" vs "Waiting". Public-facing framing, toggled via header.
- **Print view** (`renderPrintView`): hidden div styled via `@media print`. Invoked from the header Print button, calls `window.print()`. Roster + waitlist only.

## Seed data

`seedData()` (near the top of the IIFE) constructs the demo state from four arrays: `participants2025`, `took2025Off`, `waitlist2025`, plus `demoExtras` which attaches richer notes/history to a handful of marquee players (Amico Angelo, Battista Mike, Burke Mike, Chryssis Alex, Coughlin John, Reynolds Jim). Players not in `demoExtras` get a minimal history entry. The pro's 8/29/2025 snapshot names are mixed with filler; changing those names is a buy-in decision — keep the real-looking names that came from the snapshot.

## Common gotchas

- **`render()` is called from many action handlers.** After mutating state, `saveState()` → `render()`. If you add a new mutation path, follow the same pattern.
- **Drag conflict between cards and columns.** Both use HTML5 drag events. `dragging` (card) and `columnDragging` (column) are module-level flags; the handlers check the "other" flag and bail out to avoid stepping on each other.
- **`listDisplayName(listId, year)`** is the single source of truth for column labels — use it everywhere labels appear (kanban titles, modal move buttons, search aria-labels, history log entries) to keep copy consistent.
- **Don't re-introduce a 5th column.** It was tried (forward-year defer preview) and removed in favor of a single deferred column per view, backed by the "one consecutive defer" rule. Forward-defers surface naturally when the active season advances.
