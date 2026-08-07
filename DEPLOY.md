# Deploying

Hosted on GitHub Pages from `main`, served straight from the repo root — no build step,
no Actions workflow of our own.

- Live: `/timesheet/` ← repo root
- Beta: `/timesheet/beta/` ← the `beta/` folder

Two folders, deliberately separate:

| Path | What it is |
| --- | --- |
| `D:\Claude\timesheet` | The working copy. **Not a git repo.** `timesheet.html` is edited here, along with `sw.js` and the docs |
| `D:\Claude\timesheet-repo` | The git clone that gets pushed. `timesheet.html` lands here as `index.html` |

They're split because the file is called `timesheet.html` while GitHub Pages needs
`index.html`. Deploying copies from the first to the second, renaming as it goes; `sw.js`,
the manifest, the icons and the docs are copied across unchanged.

If the clone is missing, recreate it:

`git clone https://github.com/Doughboy68/timesheet.git D:\Claude\timesheet-repo`

## The rule

**Features go to beta first.** Brian tests on his iPhone, then it's promoted. The live copy
is what he files timesheets from; don't put anything there that hasn't been used for real.

## Build stamping

Both `index.html` and `sw.js` carry `const BUILD = "…"`, rewritten on every deploy with a
`yyyy-MM-dd.HHmm` stamp. This matters: the service worker names its cache after `BUILD`, so
an unchanged stamp means the old cache is kept and the deploy appears not to have landed.

`sw.js` also carries `const NOTES = "…"` — one short line shown in the update prompt, e.g.
*Improved time entry*. Set it to something meaningful for the change.

## Deploying to beta

Read and write files as UTF-8 explicitly. PowerShell 5.1 defaults to ANSI, which silently
mangles every non-ASCII character in the file — it has happened, and the published page was
full of `â€` sequences before anyone noticed.

```powershell
$s    = 'D:\Claude\timesheet-repo'
$utf8 = New-Object System.Text.UTF8Encoding($false)     # no BOM
$stamp= (Get-Date -Format 'yyyy-MM-dd.HHmm')
$note = 'Short line describing the change'

foreach($file in @('timesheet.html','sw.js')){
  $lp = "D:\Claude\timesheet\$file"
  $t  = [IO.File]::ReadAllText($lp, $utf8)
  $t  = [regex]::Replace($t,'const BUILD = "[^"]*"','const BUILD = "'+$stamp+'"')
  $t  = [regex]::Replace($t,'const NOTES = "[^"]*"','const NOTES = "'+$note+'"')
  [IO.File]::WriteAllText($lp, $t, $utf8)               # keep the working copy in step
  $out  = if($file -eq 'timesheet.html'){'index.html'}else{$file}
  $crlf = ($t -replace "`r`n","`n") -replace "`n","`r`n"
  [IO.File]::WriteAllText("$s\beta\$out", $crlf, $utf8)
}
```

Then commit and push. Check afterwards that the deployed file contains no `â€`.

## Promoting beta to live

1. **Tag what's live now**, so it can be put back:
   `git tag -a live-<build> -F <notes file> <commit that last touched index.html>`
2. Copy `beta/index.html` and `beta/sw.js` to the repo root, restamping `BUILD` and `NOTES`.
   Write the same content back to `beta/` so the two don't drift.
3. **Leave `manifest.webmanifest` alone** — see below.
4. Commit, push, tag the release (`v1.5`, and so on).
5. Verify: fetch `index.html?cb=1` with `Cache-Control: no-cache` and check `BUILD`.

## Rolling back

Take `index.html` and `sw.js` from the rollback tag, put them at the repo root, **give
`BUILD` a fresh stamp** (otherwise the cache name matches an old one and clients may not
update), push. Everyone gets the update prompt and lands back on the old version.

`live-1632` is the tag from before the time-entry work, and carries these instructions in
its own message.

## Never restore the manifest from a tag

`manifest.webmanifest` at the root still declares `"id": "./"`. That id is the identity of
apps people have already installed. Changing it makes the browser treat it as a different
app and orphans the install. Only the page and the worker are ever reverted.

The beta manifest declares an explicit `/timesheet/beta/` id for the same reason in
reverse: without it, Edge saw the live and beta apps as one and offered to rename the
installed live app to "Time Sheet BETA".

## GitHub Pages, in practice

- Deploys usually land in a minute or two, but have taken **10–15 minutes** under load, and
  stopped entirely during an Actions outage. If a change hasn't appeared, check
  githubstatus.com before suspecting the code — a failed build reading
  `Failed to resolve action download info … Service Unavailable` is theirs, not ours.
- `Last-Modified` and the byte size are the quickest way to tell whether a deploy landed.
- `.nojekyll` is present so Pages serves the files as they are, with no template pass.
- Pushes queue: two pushes close together can deploy together, so a later commit may
  arrive before an earlier one appears to.

## Verifying a deploy

```powershell
$r = Invoke-WebRequest -Uri "https://doughboy68.github.io/timesheet/index.html?cb=1" `
     -Headers @{'Cache-Control'='no-cache'} -UseBasicParsing
[regex]::Match($r.Content,'const BUILD = "([^"]*)"').Groups[1].Value
```

## Tags

Release tags mark what went live; `live-*` tags are rollback points, each carrying revert
instructions in its own message.

| Tag | What it marks |
| --- | --- |
| `v1.0`–`v1.4` | Early milestones: first working version, sidebar rework, row count, service worker, dark mode |
| `v1.5` | Time entry improvements |
| `v1.6` | Named exports, day-owned name, erase, empty-day fix |
| `v1.7` | TP star, erase button marked out |
| `v1.8` | Billable share, sidebar rework, printout |
| `v1.9` | Billable share kept off the printout — currently live |
| `live-1632` `live-1739` `live-2325` `live-2350` `live-1030` | Rollback points, oldest first |