# Handoff

Paste the prompt at the bottom into a new conversation. Everything above it is
context you'd otherwise have to rediscover.

## Where things stand

Live: **https://doughboy68.github.io/timesheet/** — build `2026-08-07.1037`, tag `v1.9`
Beta: **https://doughboy68.github.io/timesheet/beta/** — same code as live right now

Working copy is `D:\Claude\timesheet\timesheet.html`, which becomes `index.html` in the
repo `https://github.com/Doughboy68/timesheet`. The app is one self-contained HTML file
plus `sw.js`, a manifest and three icons.

Brian is a Professional Services tech at MicroAge. He uses this daily on a Windows
desktop (Edge, installed as an app) and an iPhone (Safari, home screen). It replaced an
Excel workbook that's still in the folder as `Timesheet V9 - 080426.xlsm`.

## Read these first

- `README.md` — what the app does and how it's used
- `DEPLOY.md` — beta → promote, build stamping, rollback, the manifest rule
- `DEVELOPMENT.md` — how the code fits together, and the traps already hit
- `WALKTHROUGH.md` — why each decision was taken

## The three rules that matter

1. **No edit re-renders the table.** `commit()` writes values back into existing
   controls. Rebuilding during an edit destroys the control being used — it cost a tap on
   iOS and lost keyboard focus on the desktop. Anything that changes a derived value must
   also update it by hand in `refreshGrid()`.
2. **Features go to beta first**, then get promoted on Brian's say-so. Live is what he
   files timesheets from.
3. **Never restore `manifest.webmanifest` from a tag.** Its `id` is the identity of
   already-installed apps.

## Working style that's been productive

- He tests on real devices and reports precisely; his reproductions have found several
  faults that testing in the preview pane could not.
- Verify by driving the page and reading back the DOM, storage and computed styles —
  measure rather than eyeball. Contrast, alignment and row heights have all hidden bugs.
- The preview pane is not a browser: no system focus (so `focus`/`blur` never fire), no
  native pickers, no service workers. Anything involving those has to be confirmed on his
  devices.
- Clean up test data afterwards. The pane shares nothing with his real browsers, but its
  own storage has been wiped by careless cleanup loops.
- He values knowing *why*. Explaining the cause of a bug plainly, including when it was
  mine, has been more useful than a tidy summary.

## Nothing is outstanding

No known bugs, no half-finished work, no agreed-but-unbuilt features. The last few
sessions have been his ideas as they occur, built one at a time, tested on beta and
promoted the same day.

---

## Prompt for the new conversation

> I'm continuing work on my timesheet web app at `D:\Claude\timesheet`. It's a single
> self-contained HTML file that replaced an Excel timesheet, deployed to GitHub Pages at
> https://doughboy68.github.io/timesheet/ with a beta copy at /beta/.
>
> Please read `HANDOFF.md`, `README.md`, `DEPLOY.md` and `DEVELOPMENT.md` in that folder
> before changing anything — they cover how it works, how to deploy, and the mistakes
> already made so you don't repeat them.
>
> Key things: new work goes to beta first and I'll tell you when to promote it to live;
> every deploy restamps the build id in both `index.html` and `sw.js`; and no edit may
> re-render the table (it breaks the iOS picker and desktop keyboard focus).
>
> Verify changes by actually driving the page and reading values back, not by assuming.
> Tell me plainly when something was your mistake.
