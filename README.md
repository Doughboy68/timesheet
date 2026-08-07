# Time Sheet — Professional Services Team

A daily timesheet in 15 minute increments, replacing the Excel workbook it was built
from. It runs entirely in the browser: no server, no account, no network needed once
loaded. Entries are stored on the device.

**Live:** https://doughboy68.github.io/timesheet/
**Beta:** https://doughboy68.github.io/timesheet/beta/ — same app, separate data, used to
try changes before they reach the live copy.

Install it from either URL (Chrome/Edge: install button in the address bar; iOS Safari:
Share → Add to Home Screen) and it opens like an app, works offline, and keeps its own
icon.

---

## The sheet

| Column | Holds |
| --- | --- |
| S/O# | Service order number. Digits only; blank for Meeting, Admin, Off, Lunch |
| TP | `*` once the time is entered in Tigerpaw. Space bar, click or tap |
| Start Time | Fills in from the row above. Set one by hand to override — see *Pinning* |
| End Time | The only time normally entered |
| Task | Onsite, Shop, Remote, Shadow, Project, Meeting, Training, Admin, PD, Lunch, Off |
| Client/Description | Client name, or Service/Team/Management for a Meeting, OEM for Training, the reason for Off |
| Status | COMP, IP, WFP |
| Hours | Worked out from Start and End |

The header carries Name, Date, and two figures that look after themselves: **Work Start
Time** (the first start) and **Work End Time** (the last end).

**The Name belongs to the day it's on.** New days start from the default under *Options →
Default name*; the first name ever typed on a sheet adopts itself as that default, so
there's nothing to set up. Correcting a name afterwards changes that day only — days
already saved keep the name they were filed under, which is what makes an exported or
reprinted sheet still say who it belonged to.

**What doesn't count toward the total:** Lunch, Off, and any row with no Task chosen.
That matches the original workbook, whose total only ever summed the named tasks.

**Billable** work is Onsite, Shop, Remote, Project and Training. Shadow, Meeting, Admin
and PD are worked but not chargeable. The day shows its billable share beside the total,
and the week panel closes its by-task list with billable hours and share — the tasks that
count toward it carry a `*`. It stays off the printout unless *Options → Include billable
share when printing* is ticked.

The sheet opens at 12 rows and grows as it fills, always keeping one blank row below the
last entry. Rows are given back when entries are removed.

### Times

Times run in 15 minute steps, 6:00 AM to midnight. *Show all 24 hours* in Options widens
that for early call-outs.

Start times **cascade**: each row starts when the row above ended, so normally only End
times are entered. The first row's Start opens on 08:30 and an empty End opens on the next
increment after its own Start, so the usual case is one tap. End only ever offers times
after that row's Start, so an end can't precede its own start.

**Pinning.** Setting a Start by hand pins that row: it stops following the row above and
shows a red edge. That's for a genuine gap — finishing at 5pm and returning for an
8pm call-out. Clearing the Start (Delete, or the blank entry) releases it.

Pinning re-chains everything below, so end times that no longer fit are cleared. S/O,
task, client and status are kept, so those rows stay and only need their times again. It's
one undo step.

A row whose end isn't after its start counts nothing, shows `?` and is tinted. A shift
past midnight belongs on the next day's sheet with 24 hour times turned on.

### Keyboard

| Key | Does |
| --- | --- |
| Arrows | Move between cells. In a text box the caret moves first, and the cell is left at either end |
| Enter | Move down; on the last row, add one |
| Tab | Move right |
| F2 or End | Edit a cell's text instead of replacing it |
| Delete / Backspace | Clear a dropdown |
| Escape | Put the row back to how it was when you moved into it |
| Ctrl+Z / Ctrl+Y | Undo / redo across the day |
| Alt + ← / → | Previous / next day |
| Alt + ↓ | Open a dropdown (or type its first letter) |

Undo keeps up to 60 steps per day and starts fresh when the day changes. Typing within one
cell is a single step; moving to another cell closes it.

### The sidebar

**Saved weeks** is for going back: years fold, then months, then weeks, all closed by
default and remembering what you open. Clicking a week opens its earliest day with
entries. Day to day you won't need it — Prev/Next and *Go to today* cover almost
everything.

**Week of …** below it is the selected week's detail: its seven days (so a weekday with
nothing on it is visible), the total, the by-task split and billable.

**Data file**, **Tools** and **Options** fold away, closed by default.

### Printing

**Print / PDF** gives the sheet on one portrait page: header, grid padded to 20 ruled
rows, no sidebar. Save as PDF names the file `Timesheet <name> <date>` after the sheet's
own date, not today's. Paper is always light, whatever the screen theme.

A row with nothing on it prints as a plain ruled line, so a gap left before an after-hours
call-out prints blank rather than showing a stray start time. A long Client/Description
wraps onto further lines instead of being cut off.

---

## Where the data lives

In the browser, on that device, under the key `microage_timesheet_v1` (beta appends
`_beta`). Nothing is uploaded anywhere.

That means it is **per browser and per device**. The same URL in Edge and in Chrome are two
separate sets of days.

### Moving data about

Exports are named after the person and what they hold, e.g.
`BRIAN SEMOTIUK day 2026-08-06.json`.

- **Backup all data (JSON)** — everything. Take one regularly; this is the only copy.
- **Restore from backup…** — merges by date. It lists what it will replace and warns if a
  day would end up with fewer rows than it has now. Other days are untouched, and days
  holding nothing are ignored.
- **Send this day / Send this week** — only those dates, flagged as partial. This is how a
  day captured on the phone gets onto the desktop without a stale copy of anything else
  coming with it. A week is named after its first day.
- **Export CSV (all days)** — every entry, with a UTF-8 BOM so Excel reads it properly.
- **Erase everything on this device** — clears days, settings and the link to a data file,
  offering a backup first. The linked file itself is left alone, so re-linking it brings
  everything back.

On iOS these go through the share sheet (Save to Files, Mail, and so on). Everywhere else
they download.

### Linking a data file (Chrome/Edge on the desktop)

*Data file → Create new data file…* points the app at a `.json` file, ideally in OneDrive.
It reads and writes that file directly, and two desktops pointed at the same file stay in
step: it re-reads on focus and every 30 seconds.

- Days edited here but not yet written to the file always win on merge, so linking or
  reconnecting can't undo recent work.
- Browser storage keeps running as a local cache, so the sheet still works if OneDrive is
  offline.
- Chrome asks permission once per session for a page opened as a file; installed apps can
  be granted it permanently.
- Stray `.crswap` files next to it are the browser's write-and-rename temporaries. Safe to
  delete when the app isn't open.
- **A phone can't do this** — Safari has no such API. Use *Send this day* instead. And
  never overwrite the shared file from a phone: it only holds what was typed there.

A day belongs to one device. Capture it on the phone or the desktop, not both, and the
merge can't lose anything.

---

## Updating

The app caches itself so it opens offline. When a new version is deployed it installs in
the background and waits — the app shows a green bar saying what changed, and only reloads
when that's tapped. Nothing swaps out mid-entry.

The version in use is under *What goes in each column*, the link below the sheet.

---

## Files

| File | What it is |
| --- | --- |
| `index.html` | The entire app — markup, styles, script, and the logo as a data URI |
| `sw.js` | Service worker: offline cache and the update prompt |
| `manifest.webmanifest` | App name, icons, colours for installing |
| `icon-180/192/512.png` | Home screen and app icons |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |
| `beta/` | The same set, deployed separately for testing |

`DEPLOY.md` covers releasing and rolling back. `DEVELOPMENT.md` covers how the code is put
together and the traps that have already been fallen into. `WALKTHROUGH.md` records how it
got here and why each decision was taken. `HANDOFF.md` is for picking the work up in a new
conversation.
