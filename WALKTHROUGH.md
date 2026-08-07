# Walkthrough — what changed, and why

A record of how this got from an Excel workbook to what's live, and the reasoning behind
the decisions. Written so a later session can tell which choices were considered and
settled, and which were guesses that turned out wrong.

The commit history is the detail; this is the shape of it.

---

## Where it started

An Excel workbook, `Timesheet V9 - 080426.xlsm`: 26 rows (8–33), start times filled by
formula from the row above, dropdowns for Task and Status, a total that summed only the
named tasks, and a legend printed on the sheet.

Everything below either preserves that, or changes it deliberately.

Three things were dropped at the outset, on request: the manager-approval and
admin-entered footer lines ("old, never bothered to remove"), the on-sheet legend, and the
"(15 minute increments — 0.25)" subtitle.

## Choosing the shape

A single self-contained HTML file, opened from disk. Deliberately the smallest thing that
could work: no install, no server, no dependencies, and nothing to maintain. The data model
and print layout would carry over unchanged if it ever became a real application, so
nothing was lost by starting small.

That held until the phone became a requirement — iOS won't run an HTML file from Files, so
it moved to GitHub Pages. Same file, now with a URL.

## Making it a sheet you can actually type into

The first pass had the grid working but was clumsy to use. Most of the early work is
about entry speed:

- **Keyboard navigation** (`cd72519`) — arrows, Enter, Tab, matching Excel. Then a run of
  corrections as real use found the edges: dropdowns cycling their value at the last column
  instead of staying put (`7e94ca6`), an extra keypress needed to leave a text cell
  (`eacb297`), F2 to edit rather than replace (`b170814`), Escape to revert a row
  (`f81aca1`).
- **TP reachable from the keyboard** (`3c5bf8f`) — it was a click-only table cell, so
  arrowing skipped it. Made a real button. It records whether the time is in Tigerpaw,
  which is part of the daily flow, not an afterthought.
- **Undo/redo** (`e29f900`), then refined to one step per cell (`40d9043`) after it was
  taking back more than expected — the coalescing window ignored *which* cell was being
  edited, so quick edits to different cells merged into one step.

## Bugs that mattered

**The export buttons never worked** (`00a46ca`). CSV export and JSON backup called a
`download()` helper that was never written; both threw and did nothing. This had been live
for days while the JSON backup was being recommended as the safety net for browser-stored
data. Found only by clicking every button in the app rather than testing the code path
being changed.

**The published page was full of mojibake** (`bde8490`). A PowerShell deploy step read the
UTF-8 source as ANSI, mangling every non-ASCII character. The local file was fine; only
what was published was broken.

**Printing used the phone layout** (`2a017d4`). A printed Letter page is 816 CSS px and the
phone breakpoint was `max-width: 820px`, so the print stylesheet matched the card layout.
Screen-only rules now say `@media screen and …`.

**Status tints had never worked** (`a891c2c`, alongside dark mode). `select.st-COMP` was
outranked by `table.grid select{background:transparent}`, so COMP/IP/WFP rendered untinted
from the beginning, in both themes. Found by measuring computed styles while checking dark
mode contrast, not by looking.

**A row whose end preceded its start silently counted a full day** (`6d257c4`). The hours
calculation treated it as crossing midnight. One test row added 21.75 hours to a total.
Wrong hours on a timesheet is the worst failure available, so such a row now counts
nothing, shows `?`, and is tinted.

## The rule that shaped the code

**No edit re-renders the table.**

Discovered twice. First on the desktop: arrowing out of S/O dumped the cursor at the top of
the page, because leaving the cell fired `change`, which rebuilt the table and destroyed
the cell the arrow key had just moved to (`41475cd`). Then on iOS: choosing from a dropdown
took two taps, because the picker is attached to the `<select>` and rebuilding the table
threw it away (`5a92d98`).

The second was the same fault as the first, in code written an hour later. `commit()` now
writes derived values back into the existing controls — cascade, hours, header times, the
pinned marker, status colour — and full rebuilds happen only on day change, undo and
import.

This constraint then caused the worst episode of the project, below.

## Fitting the phone

The sheet became cards below 820px, with the sidebar behind a drawer. Ancillary decisions:
16px inputs so Safari doesn't zoom on focus; inline SVG icons after the printer and arrow
glyphs turned out to have no glyph, or an oversized emoji one, on iOS; a red BETA chip so
the two installs can't be confused.

Exports needed their own path on iOS: the `download` attribute is ignored for blob URLs, so
they go through the share sheet — and when iOS refused `application/json`, retried as
`text/plain` (`287f898`, `62536e5`).

## Data, and not losing it

- **Linked data file** (Chrome/Edge) for keeping two desktops in step through OneDrive,
  with days edited locally always winning on merge so reconnecting can't undo recent work.
- **Per-day and per-week export** (`51a433d`) — added after Brian pointed out that sending
  a phone's whole database to a desktop holding months of history would be destructive,
  since the phone only ever holds what was typed on it. My earlier suggestion to overwrite
  the shared OneDrive file from the phone was wrong and would have wiped data.
- **Restore shows what it will replace** (`e509a4b`) — a stray one-row day on a phone could
  silently overwrite a full day on the desktop, precisely because the bad day is small and
  easy to overlook. It now lists the dates with row counts and warns when a day would
  shrink.
- **Browsing dates no longer saves empty records** (`7f51f5d`) — paging through the
  calendar was creating a stored day for every date visited.

## Rows: 26 → grows on demand

A day typically uses half the workbook's 26 rows, so the sheet now opens at 12 and grows,
keeping one blank row below the last entry (`a706362`). Printing pads to 20 so every day
comes out the same length (`8f342ee`) — a fixed screen count and a fixed paper count are
different problems.

New rows are appended individually rather than by re-rendering, for the reason above. The
"Add row" button was removed once rows grew by themselves (`83daaf7` covers a similar
removal of "Copy rows from previous day", which was speculative and never used).

## Dark mode

Follows the device with a Light/Dark override, applied before the first paint so a dark
setup doesn't flash light. Paper stays light whatever the screen does. Contrast was
measured across 17 elements rather than eyeballed; the lowest is 5.4:1.

## Offline and updates

A service worker (`125d7b5`) so the app opens at client sites with no signal. Deliberately
it does **not** call `skipWaiting()`: a new version installs and waits, and the app shows a
prompt. Updates are a decision, not something that happens mid-entry.

This was deferred until the UI settled, on Brian's judgement — caching makes "which version
am I on?" a live question, and that's a bad thing to add while still finding bugs. The
build id is shown under **?** for the same reason.

I had initially described service workers as mostly a caching trap with an update wrinkle,
which undersold them; the update prompt is the feature, not the risk.

## Beta

`/beta/` in the same repo (`51a5c1d`), so changes can be tried on the phone without
reaching anyone using the live sheet. It has its own storage key — everything on
`doughboy68.github.io` is one origin, so without that, testing an unfinished feature would
be doing it to the real timesheet.

It also needed its own app `id` (`7fb98ab`) after Edge offered to rename the *installed live
app* to "Time Sheet BETA": the live app's scope covers `/beta/`, and both manifests declared
the same relative id.

## The time-picker episode

The worst-behaved change, and worth reading before touching that code.

**Asked for:** opening the End dropdown should land on the next increment after that row's
start, so a 15-minute call is one tap.

**First attempt** (`b7790b9`) set the value and dispatched `change` as the picker opened —
reintroducing the exact double-tap that had been fixed 100 minutes earlier in `5a92d98`.

**Second attempt** (`d35faae`) deferred the commit, but did it from a document-level
handler: "if a suggestion is pending anywhere, commit it when anything else is touched".
That fired `change` on selects the user wasn't in, and raced the End list rebuild. It lost
end times, orphaned the rows below them, and broke pinning. Beta was **rolled back to the
live build** (`001a111`) rather than left in that state.

**Third attempt** (`88cdf0f`) worked: setting the suggestion does nothing else at all, and
the deferred commit never leaves its own cell. Then three follow-ups as testing found the
remaining edges — flagging backwards rows (`6d257c4`), clearing the end times a pin strands
(`81cc426`), and dropping a stale suggestion when the row's start moves (`7125f62`).

Two lessons recorded in `DEVELOPMENT.md`: a fix that constrains the code (no re-rendering
during an edit) has to be applied to new code as well as old, and any mechanism that
reaches across rows will eventually corrupt data.

## Decisions taken and not revisited

- **Weeks run Sunday to Saturday**, matching payroll. Saved days group by week, newest
  first, with days inside each week in payroll order so clicking down one list doesn't
  highlight up the other.
- **A week that spans two months files under the month it starts in** — chosen so weeks
  always sort by start date rather than reading more naturally.
- **Blank Task counts nothing**, matching the workbook's total.
- **Overnight shifts go on the next day's sheet** with 24-hour times enabled, so no row
  ever legitimately spans midnight. This is what makes "end before start" unambiguously an
  error.
- **Pinning stays** — the 8pm call-out after a 5pm finish is real, and logging the gap as
  an Off row would pad the sheet with time not worked.
- **Overlapping rows are not policed.** An end after a later pinned start is odd but not
  impossible, and guarding every combination gets in the way more than it helps. The line:
  silently wrong hours must be impossible, obvious nonsense should be visible, the rest is
  the user's judgement.

## Still to do

Name the "Send this day" and "Send this week" exports after the person and the kind of
export — `BRIAN SEMOTIUK day 2026-08-06.json` rather than `timesheet-2026-08-06.json` —
so they're identifiable once they land in Files alongside other people's.
