# Proview Employee: addendum 4 (AI questions, test data, rota, requests, timesheet breaks, paper views, theme, To resolve, menu, automatic PINs, hide pay/PINs, briefing pop-up, calmer rota, Saturday auto-prepare, staff deadline, swap a day off, themed pop-ups, tidier Add member form, To resolve out of the menu, phone top-bar fix; newer than 03)

**Published at the time:** artifact version 1794352359-3e0f (10 Nov 2026, ~23:12 UTC). Later changes are in doc 08 and doc 09. The owner said "PUBLISH IT" at 19:04 (after the artifact's sharing was set to **public**, which the owner changed, not Claude; Claude cannot change sharing and must pass `shared_live: "public"` and `artifact_title` when publishing). Server zip sent the same day. Hosting: the owner said "GitHub". GitHub Pages cannot run server.js (static only); the plan offered is a GitHub repo that a host (Render/Railway/Fly with a persistent disk, about $5-7/month) deploys from. Waiting on whether he has a repo/account.

## iPhone glitch found in the owner's screen recording (23:09, end of style.css)
- Recording (390px wide iPhone, dark mode, Rota page) showed: (1) the top bar wrapped onto two rows because the eye button made it too crowded; (2) tapping the avatar opened the account menu off-screen to the left, showing as a ghost dark box; (3) the "Pay and PINs hidden" toast sat on top of the bottom tab bar.
- Fix, in a `@media(max-width:600px)` block: top bar is `nowrap`, smaller buttons (34px), the "Saved" text is hidden (green dot only), the page title truncates with an ellipsis, account menu `.top .rel .pop` is `position:fixed` at right 10px, top 62px, up to 300px wide, and `#toast` sits 76px above the bottom so it clears the tab bar. Tested at 390px.
- Not touched: the slide-out menu's bottom buttons (Who's in/out, Open kiosk and the small icon row) looked slightly cut off at the very bottom of the recording; likely the iOS viewport height.

## To resolve is no longer in the menu (22:51, `menuFor` in 01-core.js)
- The owner asked to remove the "To resolve" tab because he thought the dashboard pop-up already covers it. The briefing pop-up only summarises and has a **To resolve (N)** button, so the page itself was kept and is reached from there (`A.brfGo` with `k=resolve`); the Dashboard bar still shows the red "N to resolve" tag. `menuFor` skips `resolve` for owners/admins/managers; `canPage('resolve')` and the page are unchanged. Offered the owner an alternative (list and fix the items inside the pop-up); no answer yet.

## Pop-ups follow the theme + Add member form order (22:42, style.css end block, 10-admin-a.js `personPanel`)
- Side panels (`.pnl`): 4px accent bar on top, header tinted with the theme colour and heading in the theme colour, footer tinted, border/shadow tinted, focus ring on inputs uses `--main`, section chips (`h3.sech`). Dialogs (`.mdl .sheet`): theme-colour top border, heading in the theme colour, backdrop tinted with the menu colour. The paper print view is excluded. Built from `--main`, `--nav`, `--line`, so it follows any Main colour and dark mode.
- **Add member / Edit member form** now in sections: Full name; Email, Phone; **Role at work** (Access level, Group, Main role, Second role); **Hours and pay** (Work schedule, Contracted hours, Hourly pay rate, Overtime policy, Payslip name, Payroll number); **Sign-in** (Kiosk code, Sign-in PIN, Show PIN and pay button); **Working rules** (Start date, Tracks time, Licensed, Flexible, Cannot start before); Activities.

## Proview AI (rules engine, no language model)
Files: `src/41-insight-b.js` (`aiAnswer`, chips, help text), `src/42-aiplus.js` (`aiWhen`, `aiGroups`, `aiInfo`, `aiBrief`, demo data), `src/43-aiplus2.js` (metric engine and most handlers), `src/32-avail.js` (`aiAct` rota commands).
- **Order:** question-style starts (who/what/which/when/how/is/are/does/did/was/give/show/list/any/compare/summary) go to `aiInfo` first; others try `aiAct`, then `aiInfo`, then the old nine reports, then help text.
- **Periods understood:** today, yesterday, tomorrow, this/last/next week, weekend, month, year, fortnight, N days/weeks/months ago, last N weeks/months, month names, weekdays, date ranges, and (since 12 Nov) explicit calendar dates such as "3rd of November".
- **People/groups:** first names, "I/my", group names. Non-admins only see themselves; labour cost and pay rates are owner/admin only.
- **Metric engine (`AIMET`):** worked, rota, break, late, overtime, cost, shifts, days, no-shows, weekends, longest shift, per-week, averages, cost per hour, days without break. Modes: scorecard, rota-vs-worked, person vs person, rankings, group split, multi-period comparison with like-for-like lines.
- **Tested:** about 430 questions, all answered except two intentional fallbacks ("weather", "compare mornings and afternoons"). Persona test confirmed privacy.
- **Limits:** only topics with handlers; no sales data so no labour %; cost is £0 until hourly rates set; mic blocked inside the Claude app on iPhone; fallback/help text and chips not updated for new abilities.

## Test data (AI page, admins only)
- "Load test data" replaces any earlier test data automatically; "Remove test data" clears only demo items. 6 weeks back to next week's drafts; demo shifts have start and finish times; clock records with lateness, breaks 0/15/30/45, 5 no-shows, up to 2 missing clock-outs, one rejected week, 11 leave bookings, demo hourly rates, 4 open shifts, 5 tasks, up to 3 pending break notes, and (since 12 Nov) demo certificate dates. Source: `A.demoLoad`, `A.demoClear` in `42-aiplus.js`.

## Rota page (30-plan-a.js, style.css)
- Day columns equal width (`table.rota{table-layout:fixed}`).
- **By department** card (`deptCard`): people, hours and cost per group, open shifts line, total. Cost column owner/admin only.
- **Rota preview is a big paper page** (Rota > More > download): near full-screen overlay (`.mdl.paperov`, `.sheet.paper`), white page, black text, 7 days plus Hours column. Footer: hours per department, total, "Italic = still a draft". Buttons: Spreadsheet (CSV), Page for printing / PDF, Close. The owner said it "looks amazing"; do not change it.
- **Calmer colours:** every shift is the same blue; open shifts stay red, leave purple; legend is just Shift / Open shift, nobody assigned / Leave. Draft state is not shown visually. The "Drafts to publish" count only counts drafts dated today or later. Publishing is still how staff get to see the rota.
- **Saturday auto-prepare (`autoPrep()` at end of 30-plan-a.js, toggle `A.rotaAutoTog` in Rota > More, `S.rotaAuto`):** on Saturday or Sunday, when an owner/admin/manager with the Rota feature opens the app and next week (Mon to Sun) has no shifts, the app runs `autoRota` for that week as drafts, sends a notification "Next week's rota ... is ready as a draft", and shows a toast. Runs once per week (`S.ui.prepWk`). Client-side: fires when a manager has the app open, not on a server timer.

## Staff deadline for rota notes (`avCut`/`avLocked` in 32-avail.js, card in Rota rules)
- Owner's rule: staff must give their availability before Saturday for the next Mon to Sun week. The manager controls it: Rota > More > Rules for auto-generate > **Staff deadline** (switch, day, time). Default on, Saturday 00:00 (`S.availCut={on,day,time}`).
- After the deadline, a staff member's **Inform manager** save for such a date is refused ("Too late for Mon 16 Nov. That rota closed on Sat 14 Nov at 00:00. Please phone your manager."). Managers and owners are exempt. Not restricted: the "I cannot attend" button on an existing shift (emergency cover), "I can do this" on open shifts, and time off requests.

## Swap a day off (`A.avOpen` and `avDecide` in 32-avail.js)
- Built: the **Inform manager** pop-up has an **"Or swap a day off"** box with two dates, "I cannot work" and "I can work instead". Saving creates two linked notes (`S.avail` entries share `sw`). Managers get one notification; Approve or Decline on either line decides both and sends the staff member one message. The staff deadline applies to both dates. Only one day is swapped per request; voice entry does not understand swaps yet.

## Paper print views for timesheets and approvals (44-resolve.js)
- `paperOpen(o)` is the shared full-screen white page used by `A.tsPaper` and `A.apPaper`. Columns: Member, 7 days (hours, break, red "!" reason), Total, Breaks, Cost (owner/admin, only while pay is revealed), Status. With more than 24 rows the row height drops to 24px and the header row is sticky. The Review panel (`.pnl.wide`) is up to 1040px wide and 94vh tall.

## Staff requests stay until answered (32-avail.js)
- "Inform manager" notes (`S.avail`, with `st`): created by staff = `pending`; by a manager = `approved`. Pending notes cannot be deleted; managers see **Approve / Decline** (`avDecide`). Only then is the staff member notified. Declining a "cannot work" puts the person back on the shift if still uncovered, otherwise tells them who took it. Staff Home shows **What you told your manager** (`myReqCard`).

## Timesheet: what holds it up, and breaks (21-time-b.js, 20-time-a.js)
- `dayIssues`/`wkIssues`: blockers = no clock-out on a past day, rejected entry, unanswered break note; soft = worked 6h+ with no break. Weekly grid shows break per day cell, red box + reason on blocker days, status cell names the day, **Breaks** total column, Overtime column only when someone has overtime. Approvals rows show break total and chips; Review panel shows break and chips per day.
- **Why "Pending"** (`pendWhy`): a week stays Pending until a manager approves it. The Review panel has a blue **Why pending?** line or a red list of blockers.
- **Staff break note:** My timesheet > **Took a break** (`breakSay`) stores `e.bc={m,note,ts,st}` and notifies managers; manager **Add break** (`bcAdd`) or **No** (`bcNo`) notifies the staff member.

## Theme colours and minimised settings boxes (01-core.js, 10-admin-a.js, 99-boot.js)
- Settings > Company > Appearance: Main colour and Background pickers, 7 swatches, Reset. Per device in localStorage `proview-employee-v2-colors` = `{main,bg}`, applied on boot by `applyColors()`. Dark mode keeps its own background.
- Settings boxes minimise (chevron per box, **Minimise all / Expand all** under the tabs), state in `S.ui.setc`, done by `enhSet()`.

## Ideas from Bookings that the owner approved and are built
- **To resolve page** (`44-resolve.js`): everything waiting on a manager: clock-outs to fix, staff requests, break notes, past weeks ready to approve, rejected weeks, shifts with nobody assigned (next 7 days), unpublished drafts, pending time off. "Approve all ready weeks".
- **Today's briefing** (`briefCard`, `briefBody`, `A.brfOpen`): a slim one-line bar on the Dashboard (red "N to resolve" tag or green "All clear", Open button); tapping it opens the full briefing as a pop-up panel with To resolve / Ask Proview AI buttons.
- **Menu at the bottom** option and **Compact view**. Per device keys `proview-employee-v2-nav` ('b'/'l') and `proview-employee-v2-dense` ('1').
- **Colour tags were NOT approved. Do not build.**

## Menu changes
- **Payslips live inside Documents.** Admin/manager: tabs "Documents" and "Payslips and P45s". Staff: "My documents" and "Payslips and P45s". Settings no longer lists Payslips.
- **Proview AI sits before Reports** in the More group.

## Automatic sign-in PINs (`newPin()` in 10-admin-a.js, 51-trial.js)
- In hosted mode staff sign in by picking their name and entering a PIN. Only the owner can create their own first PIN; everyone else needs a manager to set it.
- Every new member (not owner) and every trial person now gets a random 4-digit PIN automatically (unique). Shown on the "Trial added" panel, in the trial banner, and in the person's profile; the server hides owner/admin PINs from managers. Staff can change their own PIN in My profile. PINs are NOT forced to change.

## Hide pay and PINs until the eye is tapped (01-core.js)
- Per-device setting (localStorage `proview-employee-v2-secret`, default ON; switch "Hide pay and PINs on screen" in Settings > Company > Appearance). `payHidden()`/`secOn()`; `money()` returns `£•••` while hidden. An **eye button** in the top bar (owners, admins, and managers with the People feature) reveals everything for 60 seconds, then hides again.
- PIN and hourly pay fields in the person's edit panel are password-style while hidden, with a **Show PIN and pay** button. The timesheet Print view drops the Cost column while pay is hidden. CSV exports use raw numbers and are not masked.

## Late minutes fix (03-engine.js `dayCalc`)
- Bug: "Kamilla 546 min late". Lateness was the largest "clock-in minus shift start" across ALL of a day's entries. Now lateness uses only the day's first clock-in.

## Still open (then)
GitHub account/repo for hosting; Bar role two-role person; contracted hours (all zero-hour); Ceylan 09:00 assumption; menu photo; iPhone mic on hosted https untested; AI fallback/help text and chips not updated for new abilities; Saturday auto-prepare only runs when a manager opens the app; voice entry does not understand swaps; owner sees both "Documents" and "My documents" in a blank venue menu; phone slide-out menu bottom buttons possibly clipped on iPhone.
