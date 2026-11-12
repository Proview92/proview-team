# Proview Employee – third app (added 10 Nov 2026)

Read `00-handoff-read-first.md` for the Bookings app. This note covers the staff-management app only. Feature analysis of the site it copies: `proview-employee-feature-analysis.md`. Newer notes: 02, 03, 04, 08, 09 (they win on conflicts).

## What it is
A separate Claude artifact, same theme and menu style as Proview Bookings, replicating https://employee.proviewcrm.co.uk (time clock, timesheets, rota, tasks, time off, reports, AI helper) and set up for Brags and Brams.

| | |
|---|---|
| Link | https://claude.ai/artifact/RwKLxStngw8bNgxQAxbDzR (now public) |
| Slug | c9f0cbdd-d49d-457e-a0c9-d26f79a0ef52 |
| Version when this doc was written | 1794303429-a291 (10 Nov 2026). Latest at export: 1794475612-cd9e (12 Nov 2026) |
| Capability declared | `downloads` |
| Data | Default: browser only, localStorage key `proview-employee-v2`, per device. SHARED MODE: when the app is served by the small server (see below) every phone shares one data set. |

## Shared data across phones (owner request 09:24: "I will make the app live on a server, in-app notifications only")
- Code: `src/98-sync.js` in the app; server in `proview-employee-server/` (see server-kit folder: `server.js`, `index.html` copy of the app, `package.json`, `Dockerfile`, plain-English `README.md`). Zero dependencies, Node 16+. After any app change, copy the new `index.html` into that folder and resend the zip.
- How it works: on start the app pings `api/ping`. If the server answers it switches to shared mode: `api/state` (or `api/init` uploads the local data if the server is empty). Every `save()` marks a 350 ms debounced push of per-item changes (`api/ops`, with the base revision; the server returns anything missed). Phones poll `api/changes?since=N` every 3 s and when the app becomes visible / back online. Each phone keeps its own UI state (`S.ui`, who is logged in) locally, not shared.
- New notifications for the logged-in person show a toast, a vibration (where allowed) and an unread count in the page title (`syncTitle`). Render is deferred while a pop-up is open or the user is typing. No push, no SMS, so a sleeping phone sees the alert only when the app is opened.
- Optional `APP_CODE` environment variable: the app asks for the access code once (stored in localStorage `proview-code`, sent as `x-code` header). Offline: the chip shows "Offline: not shared", changes catch up when the connection returns.
- Settings on the server: `PORT` (3000), `APP_CODE`, `DATA_FILE` (`data.json`, atomically saved). Backup = copy `data.json`.
- Limits: security is only the shared access code plus PINs (see doc 03); two people tapping "Take this shift" within about 3 s can race (the server answers 409 to the second); use HTTPS in front of the server; the claude.ai preview of the artifact itself is not served by this server, so it stays per-browser.

## Brags and Brams setup (pre-loaded, no manual entry)
- Team: Floor = Duygu, Ceylan (flexible), Kamilla, Yasin, Nicole, Dalia, Runner (name needed). Kitchen = Aysegul, Rodin, Sengul (cooks, no usual week yet), Feride (kitchen porter). Director is the owner and is not scheduled.
- Each person's usual week is a schedule ("Duygu's usual week" etc.): Duygu opens 7 except Wed/Thu; Kamilla 9 start Tue to Sat; Yasin 6 days, off Tue, opens 7 Wed/Thu; Dalia Tue, Fri 4 to 9pm (pizza party, own activity), Sat/Sun 9; Nicole Sun 10 to 5; Runner Sat 10, Sun 11; Feride 8 start, off Tue.
- Minimum staffing (cover needs): someone opens at 7 every day; two floor staff from 9 and three from 11 Mon to Fri; five on the floor Sat/Sun.
- Auto-generate: starts from usual weeks, leaves out anyone with a day off or who said they cannot work, fills gaps from people who said they can first, then flexible people only (Ceylan), same role only, and flags anything still short ("Needs cover. Could ask: ..."). Weekly input = Time off page, "Days off for the week" button. It opens next week by default with week arrows, tap Work/Off per person and day, then "Fill the week now" jumps to Rota and generates. Staff can also request a day off themselves (type "Day off (asked for)") under Time off.
- Rota shifts are start-time only (owner request 10 Nov): generated shifts show as "from 07:00" (flag `ne`; a nominal end is kept internally only for the cover-rule check; hours are not counted for these shifts). Rota Rules has a "Start times only" toggle.
- Rota Add/Edit shift is a small pop-up (`openPanel({small:true})`): tapping a + cell shows only "Person, date" and a Start time drop-down (15-minute steps), Cancel/Add; editing adds Delete shift. The shift's activity (role) is set from the person's main role (`defaultAct`). The rota shows a role only when it differs from the person's usual one (e.g. Dalia's Friday "Pizza party"), and the location only when there is more than one location.
- Missed breaks / punches are handled in Timesheets > Add time entry (it has an Unpaid break (minutes) field), not on the rota.
- ASSUMPTIONS (to confirm with owner): "10 or 11" starts use 10:00 (Ceylan fill-in uses 11:00); weekend minimum of 5; kitchen has no cover rule; pay rates are 0. Real ROTA file could not be read (Desktop folder access was denied).

## Overtime and premium pay — `otMode()`, `otPolOf()`, `otFor()`, `weekCalc` in `03-engine.js`; settings UI in `src/33-ot.js`
- Owner's rule: overtime is about the WEEKLY total against the contract, not per day. Examples: 30 h contract, 2 days x 10 h = 20 h, no overtime; 40 h contract, 4 days x 9 h = 36 h, no overtime. This is the default.
- **Overtime policies** (`S.otPol`, Settings > Time tracking > Policies > "Overtime and premium pay"; edit/add/delete, one is the default): each policy has Weekly (above the person's contracted hours / above a fixed number of hours / none, with a multiplier), Daily overtime after N hours x m, Double pay after N hours in a day (long or double shifts) x m, Evening premium (hours after a clock time, e.g. 20:00, x m; paid at the higher rate but NOT counted as overtime hours; shows as "evening premium" in the week detail), Days off in their schedule x m, Bank holidays x m. The default policy "Standard" = weekly above contracted hours x1.5 (multiplier taken from Time rounding > Overtime pay multiplier). A person's policy is chosen in People > edit (`p.otp`, blank = default). Master switch in the same card: "Count overtime and premium pay" / "Off: count nothing" (`S.tt.otMode` 'policy' | 'off').
- Contract hours are per person: People > edit person > "Contracted hours per week" (`p.contract`, 0 = zero-hour, no weekly overtime ever). `migrate()` sets 0 for all café staff, so NO weekly overtime shows until the owner enters contract hours.
- Interpretation to confirm with the owner: "double shifts" = hours beyond a long-day limit (default 12 h) at double pay; "evening double pay" = hours after a set time (default 20:00) x2. Both are off in Standard; create a policy for them and assign it in People.
- Verified in tests: 40 h contract 4x9 = 0 ot, 5x9 = 5 ot; 30 h contract 2x10 = 0 ot; daily>8 on a 10 h day = 2 ot; double>12 on a 14 h day = 2 ot; daily>8 + double>12 on 14 h = 6 ot; evening after 20:00 for a 16:00-22:00 shift = 2 h premium, 0 ot; zero-hour = 0.
- Off: Overtime tiles (Dashboard, Timesheets, Reports), the Reports overtime column and rota warnings disappear; Proview AI says overtime is off. The Dashboard Overtime tile has a small "Hide" button that sets the master switch to Off.

## Roles, availability, pick-up and last-minute cover — code in `src/32-avail.js`
- **Main + second role:** People > edit person has "Main role" and "Second role (optional)" (these are the activities: Floor, Kitchen, Kitchen porter, Pizza party, and a **Bar** activity added by `migrate()` for Brags and Brams, assigned to the same people as Floor). `p.act` = main, `p.act2` = second. Only people with the role can cover it (`canDo`, `coverFor`). Auto-generate cover rules with an activity use this; open shifts only go to people with that role. A shift's role = its person's main role (`shiftRole`). (12 Nov: activity TRACKING was hidden in the app, but roles stay because this logic depends on them.)
- **Availability notes** (`S.avail` = `{id,pid,date,kind:'can'|'cant',note,ts}`, old ones dropped after 30 days): "can" = volunteer. Auto-generate treats a "can" as an extra option (allowed even on their usual day off, ranked first) and a "cannot" like a day off. A shift whose person said they cannot shows a warning on the rota. Notes show on the Rota page and Time off > Overview ("Availability notes").
- **"Inform manager"** (renamed from "Tell the director"): pick can work / cannot work, a day, a note, or type/say a sentence ("I can work Sunday"). Managers/owner/admin get a notification. Choosing "cannot work" on a day they are booked triggers the cover alert below.
- **Staff Home — "Shifts you can pick up":** open shifts in the next 14 days for the person's role (and free that day). Normal open shift: "I can do this" sends a "can" note to managers. Cover-needed shift (red "Cover needed" chip): "Take this shift" gives it to the first person who taps. The "Upcoming shifts" card on Home has an "I cannot attend" button per shift.
- **Last-minute cancellation:** staff tap "I cannot attend" (reason optional) on a published shift. The shift becomes an open shift marked "Cover needed", the person's "cannot work" note is saved, and EVERYONE with the same role who is free that day (even on their usual day off, not on leave) gets a notification. The first person to tap "Take this shift" gets it automatically (no manager approval); the original person and managers are notified. If nobody with the role is free it stays an open shift and the manager is told. Managers can trigger the same from Proview AI ("Kamilla can't work Wednesday" shows "Alert the team to cover"). Kitchen staff are not alerted for floor shifts (tested). Code: `startCover`, `A.cantAttend`, `A.coverTake`, notification kind `cover`.
- **Proview AI (type or microphone)** also acts on rota sentences (`aiAct`): "Kamilla can't work next Wednesday", "Dalia can work Sunday", "Who can cover Kamilla on Wednesday?" / "Who can work Saturday?", "Put Yasin on Friday at 9" (adds a draft start-time shift), "Remove Yasin from Friday", "Make the rota for next week". Understands weekday names, "next", "tomorrow", "15 Nov", "15/11", "weekend". Changes show an Undo (latest only). Only managers can change other people's data.
- **Voice:** microphone buttons use browser speech recognition. NOT TESTED on the owner's iPhone; blocked inside the Claude app on iPhone; if blocked it says to use the iPhone keyboard microphone.
- Alerts, notes and taking a shift work across phones only in shared mode (server). In the plain claude.ai artifact they work inside one browser only.
- Not built: moving a published shift notifies staff automatically when the manager (not cover) edits it; recurring "every Sunday" availability; time ranges in AI sentences; a time limit or order of preference for who gets alerted first.

## Other features added 10 Nov 2026
- Activities can be assigned to named people; only they see them on their own app. Also set per person in People.
- Geofence radius limited to 20 m to 100 m (default 50 m). Old larger values are clamped.
- Staff documents (Documents page for managers, My documents for members): welcome pack (standard text, editable, typed-name e-sign), allergen chart (file or link, expiry date typed in, free FSA training link shown if none), a signed document upload (name editable). The welcome pack also contains "Your trial shift" and "Your onboarding" sections, so one signature covers them. Clock-in is blocked until all three are on file unless a manager overrides (per person, or "Let everyone start for now"). The Documents page shows only the table with red "missing" highlights.
- Document alert banner (Dashboard for managers, Home and Time clock for the member themselves) is short and can be minimised; minimised it is a small red chip (`S.ui.docMin`).
- **Menu number badges:** Documents shows how many document alerts (`docAlerts()`), and Time off shows how many leave requests are waiting for the manager (`lvBadge()` in `31-plan-b.js`; only for managers; hidden when zero).
- Tidy-up 10 Nov: removed Who's in/out card from Dashboard and Home (it is in the menu), removed "Today's tasks" and "Rota today" from the Dashboard, removed the Documents card from the Inbox, removed the duplicate Dashboard icon in the top bar.
- Rota "Download" opens a preview of the week first, then CSV or a self-contained HTML page (print is blocked in the sandbox).
- Time off: staff request under Time off (type, dates, half day, note); manager gets it in Inbox / Time off > Overview; approved leave shows on the Time off calendar and rota, and blocks auto-generate for that day.
- **Approve with different dates:** a pending request's "Review" button opens a small pop-up with the request, editable From/To (live working-day count), optional message, "Reject this request" and "Approve". The original ask is kept (`orig`), Overview shows a "Changed" chip, and the person's notification says "approved for X instead of Y". Approved leave has "Change dates". Overlaps and zero working days are blocked.
- Task suggestions (`S.tkLib`, up to 60): saved tasks are remembered; New task form has title suggestions.
- Forms are centred pop-ups (`openPanel`, CSS `.pnl`, `.pnl.sm` small); footer always visible; tapping outside does not close a form. Enter saves.
- Phone keyboards (`fixInputs()`): number pad, decimal pad, phone pad, email, URL, Capitalise Words for names; inputs 16px on touch screens.

## Menu merge and compact phone layout (owner request 10 Nov, 08:00)
- Menu: Work (Get started, Dashboard, Timesheets, Rota, Tasks), Team (Time off, Documents, People), More (Reports, Settings), bottom: Who's in/out, Open kiosk, theme/sign out. Related pages are merged into hubs (`HUBS` in `01-core.js`) with a tab bar (`hubBar()`): People = People + Logins and access; Reports = Reports + Proview AI; Settings = Company, Time tracking, Schedules, Holidays, Locations, Roles (was Projects), Payslips (moved to Documents on 10 Nov evening). Old routes still work. Live locations is a "See on the map" button inside the Who's in/out pop-up. Business-switcher "Locations" only shows with more than one business.
- Dashboard / Timesheets / Rota bars shrunk for phones: Day/Week/Month drop-down (`selTab`), "Today" only when needed.
- Scope filter (`scopeSeg`, Everyone / My team / Just me): HIDDEN unless the viewer manages at least one other person. In the café nobody is a group manager, so Dashboard and Timesheets always show everyone.
- Rota bar: Auto-generate, More (Rules, Copy last week, Download, Clear drafts), Add shift, Publish. Timesheets: search, group, More (payroll-hours toggle, Export), Add time entry.

## How to change it in a new conversation
1. Read the artifact first (Artifact tool, read action, link above). Build on the live version.
2. Publish with the same slug and the current base_version (get_artifact gives it) so the link never changes; pass `shared_live:"public"` and `artifact_title:"Proview Employee"` now that it is public. If publish says 429 too many requests, wait 20 seconds and retry.
3. Sandbox limits: no print, no alert/confirm/prompt, no geolocation, downloads only through the declared capability.
4. The owner uses an iPhone and sends screen recordings (.mov/.mp4); extract frames with ffmpeg to see what he sees.
5. Source layout: `src/[0-9][0-9]-*.js` + `style.css` + `00-head.html` + `01-body.html`, built with `python3 build.py` into one `index.html` (this export has source/src and source/build.py).

## Honest limits
- Without the server, data lives in one browser on one device. Uploaded photos are shrunk and PDFs limited to 250 KB so everything fits in browser storage.
- Logins and PINs are a screen lock unless the server is used (then see doc 03). A typed-name e-signature is stored in the shared data (server) or on the device.
- Invite and reminder emails open in the user's own email app. Nothing is sent automatically, and notifications are in-app only (no push or SMS), so a 3 a.m. cancellation will not wake anyone's phone.
- Face check, selfies, live GPS and QR scanning are not available in the sandbox.
- The welcome pack (including the trial shift section) is a starting template, not legal advice.
- Longer forms (Add member, Rota rules, Schedules) still scroll inside the pop-up when the phone keyboard is open.
- OPEN: the owner reported (screen recording 00:57, 10 Nov) being unable to add a new task after "Reuse a past task" was added. Could not reproduce; the form was later rebuilt (doc 02).
- OPEN: who has two roles (bar and floor); contract hours per person; which people get evening/double-pay policies.
- OPEN: owner to run the server and confirm phones share data on his real hosting; confirm microphone works on his iPhone.

## Change log (10 Nov 2026, UTC)
- first publish (1794269783-f123); 00:38 Brags and Brams setup, rota rules, days off, activity assignment, geofence, staff documents (1794271127-c4bf); 00:40 rota download preview; 00:44 start-time-only shifts; 00:49 past-task suggestions; 00:56 pop-up forms, phone keyboards; 01:03 Days off moved into Time off; 01:07 trial shift and onboarding in welcome pack; 07:54 tidy-up, minimisable document alert; 08:01 small start-time-only shift pop-up; 08:15 merged menu (hubs), compact bars, approve time off with changed dates; 08:25 main + second role, availability notes, talk-to-the-rota, same-role cover; 08:48 scope drop-down hidden; 08:55 overtime on/off; 08:59 weekly overtime vs contracted hours; 09:08 overtime policies, "Inform manager", pick-up shifts, last-minute cover; 09:31 shared-data mode plus server folder; 09:37 number badge on Time off (1794303429-a291). Later versions: see docs 02, 03, 04, 08, 09.
