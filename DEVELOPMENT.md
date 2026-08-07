# How it's built, and what to be careful of

One HTML file: markup, styles and script, with the MicroAge logo inlined as a data URI. No
framework, no build step, no dependencies. `sw.js` sits beside it for offline and updates.

## Data

```js
DB = {
  version: 1,
  settings: { name, allHours, theme, folds },
  days: {
    "2026-08-06": {
      date, name,
      rows: [ { so, tp, start, end, task, client, status, startManual } ]
    }
  }
}
```

Times are `"HH:MM"` strings, compared by **position in the time list** rather than by clock
value, so midnight sorting last still closes an evening properly.

Kept in `localStorage` under `KEY` (`microage_timesheet_v1`, plus `_beta` under `/beta/`).
`KEY + "_dirty"` holds the dates edited since the linked file was last written — kept out
of the payload so it survives restarts and never syncs.

Storage is per **origin**, and everything on `doughboy68.github.io` shares one. That's why
beta needs its own key: without it, testing an unfinished feature would be doing it to the
real timesheet.

## Constants worth knowing

| Constant | Value | Meaning |
| --- | --- | --- |
| `ROWS_MIN` | 12 | Fewest rows shown |
| `ROWS_SPARE` | 1 | Blank rows kept below the last entry |
| `PRINT_ROWS` | 20 | Rows a printed sheet is padded to |
| `DEFAULT_START` | `08:30` | What the first row's Start opens on |
| `UNDO_MAX` / `COALESCE_MS` | 60 / 500 | Undo depth, and the typing burst window |
| `POLL_MS` | 30000 | How often a linked data file is re-read |

## The rule that matters most

**No edit re-renders the table.** `commit()` writes values back into the controls that are
already there; full rebuilds happen only on day change, undo and import.

This was learned twice, painfully:

- Rebuilding during an edit destroys the element being used. On iOS the picker is attached
  to the `<select>`, so it's abandoned and the tap is lost — the "have to press twice" bug.
- On the desktop it loses keyboard focus mid-navigation, which is why arrowing out of S/O
  used to dump the cursor at the top of the page.

Anything that changes a value must therefore also update, by hand: cascaded start times,
the hours cell, the header times, the pinned marker, the status colour, the End option
list, and the row classes the phone's card view depends on. `refreshGrid()` does this.

Corollary: **never mutate a `<select>` as its picker opens.** `suggestOnOpen()` sets the
value and does nothing else — no commit, no cascade, no rebuild. The commit is deferred to
that cell's own `change` or `blur`, and never leaves it. An earlier version committed
pending suggestions from a document-level handler; it fired `change` on selects the user
wasn't in, which lost end times and broke pinning.

## Rendering

- `render()` — full rebuild. Day change, undo, import.
- `buildRow()` — one row, so a new one can be appended without touching the rest.
- `growRows()` — appends when the last row fills. Only ever appends.
- `trimRows()` — drops spare trailing rows, never the one being edited.
- `refreshRowFlags()` — row classes in place.
- `refreshGrid()` — everything derived, **after** `cascade()` so a flag and the figure it
  describes can't disagree.
- `syncFillers()` — the print-only padding rows. Inert: no controls, so focus can't land in
  them.

## Times

`cascade()` sets each row's start from the row above's end unless `startManual` is set. It
**never** rewrites anything else — opening an old day must not quietly change it.

`clearStaleTimes()` does the tidying instead, and is called only from the Start and End
edit handlers: after a pin, ends that now sit before their own start, or on rows that lost
theirs, are cleared. Deliberate action only, one undo step.

`rowBackwards()` catches an end that isn't after its start. Such a row counts nothing and
says so. Before that, the hours calculation read it as crossing midnight and silently
counted a full day — one test row added 21.75 hours to a total.

Pinning is only recorded when the chosen time **differs** from what the cascade would have
given, so picking the same time doesn't silently pin a row.

## Undo

Snapshots of the current day, per cell. `preEdit` runs on capture-phase `input`/`change`/
`click` — before the value is written — so the state it records is the pre-edit one. A step
closes when the edit moves to a different cell; typing within one cell coalesces.

## Service worker

Cache is named `timesheet<path><BUILD>`. Cache storage is shared across the origin, so the
prefix includes the folder and cleanup only removes **its own** older builds — otherwise
beta would tidy away the live copy's cache.

Navigation is network-first with a cached fallback; icons and manifest are cache-first.
Nothing calls `skipWaiting()` on its own: a new version waits until the page asks, which is
what makes the update prompt honest. The page asks the waiting worker for its `NOTES` over
a `MessageChannel`, with a 1.5 second timeout so older builds that never answer leave the
generic wording alone.

Registration is skipped on `file://`, where service workers don't run.

## Theme

Colours are CSS variables; the dark palette hangs off `:root[data-theme="dark"]`. A small
script in `<head>` settles the theme before the first paint, otherwise a dark setup flashes
light on every load. `color-scheme: dark` makes native dropdowns and scrollbars follow.

The print block resets the whole palette to light, so dark mode can't print pale text onto
white.

## Traps already fallen into

- **Specificity.** `select.st-COMP` was outranked by `table.grid select{background:transparent}`,
  so the status tints never showed, in either theme, from the beginning. Check what actually
  wins before assuming a rule applies.
- **Print media matched the phone layout.** A printed Letter page is 816 CSS px, and the
  breakpoint was `max-width: 820px`. Screen-only rules must say `@media screen and …`.
- **`Get-Content` in PowerShell 5.1 reads ANSI.** Reading the UTF-8 source and writing it
  back mangled every non-ASCII character on the published page. Always
  `[IO.File]::ReadAllText(path, utf8)`.
- **The preview pane isn't a browser.** It has no system focus, so `focus`/`blur` never
  fire there; `<details>` didn't collapse natively; native pickers don't exist. Anything
  involving focus, popups or install behaviour has to be checked on a real device.
- **Test every button, not just the changed code path.** `download()` was never written at
  all: CSV export and JSON backup threw a `ReferenceError` and did nothing, for days,
  including the backup that was being recommended as the safety net.
- **Manifest `id` is an installed app's identity.** Changing it orphans the install. See
  `DEPLOY.md`.

## Testing

There's no test suite. Changes are checked by driving the page in the preview pane —
setting values, dispatching events, and reading back the DOM, storage and computed styles.
Contrast, column alignment and row heights are worth measuring rather than eyeballing;
several bugs were only visible as numbers.

Clean up any test data afterwards: the preview pane shares nothing with Brian's real
browsers, but its own storage has been wiped by careless cleanup loops more than once.

---

## Added since the first draft of this file

**Billable.** BILLABLE lists the chargeable tasks (Onsite, Shop, Remote, Project,
Training). dayBillable() sums them; the day's share sits beside the sheet total in
`#billNote` and the week's closes the by-task list. It prints only when
`settings.printBillable` is set, which toggles `body.print-billable`.

**Suggested times.** `suggestOnOpen(sel, getNext)` puts a likely value into an empty
dropdown as its picker opens — the first row's Start on `DEFAULT_START`, an End on the
next increment after its own Start. It sets the value and **does nothing else**: no
commit, no cascade, no rebuild. The commit is deferred to that cell's own `change` or
`blur` and never leaves the cell. An earlier version committed from a document-level
handler and corrupted data; see WALKTHROUGH.md.

`endOptions()` cuts the End list to times after that row's Start. The list is rebuilt in
`refreshGrid()` when `dataset.forStart` no longer matches, which also drops any pending
suggestion — it is stale as soon as the start moves.

**Backwards rows.** `rowBackwards()` catches an end that isn't after its start, compared
by position in the time list so midnight still closes an evening. Such a row counts
nothing, shows `?` and is tinted. `clearStaleTimes()` clears ends stranded by a pin,
called only from the edit handlers — never from `cascade()`, so opening an old day can't
rewrite it.

**Empty days.** A day with no used rows is never stored, backed up or restored. Before
that, a day was kept if it had a name, and every new day is seeded with the default one —
so backups filled with 0-row dates and restoring one could put an empty record over a real
day.

**Printing.** `tr.empty` rows hide their controls on paper, so a cascaded start doesn't
appear on a row with nothing on it and a deliberate gap prints blank. The client cell
carries a `.echo` span beside its input, hidden on screen and printed instead, because an
input clips where a span wraps. `tr.fill` rows pad every sheet to `PRINT_ROWS` and hold
a `.ph` span so their height matches a filled row.

**Sidebar.** Saved weeks is years → months → weeks, each folded, state in
`settings.openYears` / `settings.openMonths`. The week panel is the selected week's
detail. Nothing is listed in both.

**Name.** `day.name` belongs to the day. `settings.name` is the default for new days,
set in Options; the first name typed on a sheet adopts itself as that default.
`personNameFor(dates)` picks the name for an export — the day's own, or for a week the
first day of it that has one.

## Further traps

- **A constraint applies to new code too.** The no-re-render rule was established, then
  broken an hour later by a new feature that mutated a select as its picker opened. Same
  bug, same session.
- **Anything reaching across rows will eventually corrupt data.** The document-level
  commit handler fired `change` on selects the user wasn't in.
- **Derived values must be added to `refreshGrid()`.** The TP star was missed when
  re-rendering was removed and quietly stopped updating for a day.
- **Test the whole set of exports, not the one you changed.** Two of four were left with
  old filenames.