# Proview Employee: addendum 5 (changes 11 to 12 Nov 2026, newer than doc 04)

Latest published version: **1794475612-cd9e** (12 Nov 2026, 09:26 UTC; the original note of this doc said 1794471232-c672, since then the phone top-bar fix and the AI date comparison were published). Build: `cd /home/claude/employee && python3 build.py`; server kit zip re-made each time. Doc 07 has the competitor comparison; this doc is the build log.

## Phone and print (11 Nov to 12 Nov morning)
- Timesheets phone view made compact: filter is a funnel icon (`select.gsel`), "More" holds export and print; stat tiles `tsstats`. Rota header split into two bars (`rbar1` / `rbar2`); Auto-generate lives in the More panel; Add shift and More sit on one line.
- Print / PDF preview scrolls sideways on a phone (`.ppwrap`, table min-width 920px); saved HTML has a viewport meta.
- Briefing: pop-up is narrower, has Close and "Hide this card"; Settings > Appearance has a switch "Today's briefing on the Dashboard". AI understands "who is on the clock now".
- Night tests: hourly scheduled runs of `/home/claude/nighttest/run.py` (1,400 prompts); all PASS. Videos: staff 3:54, manager 6:03.

## Built 12 Nov
- **Holiday from hours worked**: leave type accrual option "From hours worked" (default 12.07%, `pct`). Leave balance shows earned / taken / left in hours (`holEarned()` in 03-engine.js; days taken counted at the person's average shift length). Brags sample org gets "Holiday (hours worked)" (`S.polHrs` migration). Zero-hour staff rule: 12.07% of hours worked (UK).
- **Certificates**: Documents table has Food hygiene, First aid, Right to work as date chips (green, amber within 30 days, red expired); set per person under "Other certificates". No reminders or blocking, by the owner's choice. Documents table compacted (Required documents = Pack / Allergen / ID mini chips, Review, 3 dates, Clock-in) so it fits computer and iPad without sideways scrolling; phone still scrolls. Code: `CERTS`, `certChip`, `reqChips` in 50-docs.js, `.doct` in style.css.
- **Payroll export with any dates** (src/53-payx.js): Timesheets > More > "Payroll export (choose dates)". From/To plus Last month / This month / Previous 4 weeks. One line per person: days worked, hours (payroll rounding), breaks, overtime, days off per leave type, holiday earned, entries not approved, and rate and gross (owner/admin, pay not hidden). Overtime computed week by week and clipped to the dates; each clock-in counts on its start day. Uses `rangeCalc`; goes through `previewCSV`.
- **Departments stacked** on Rota, Timesheets (week and day): `grpSort`, `grpMulti`, `grpHead` (department heading row with head-count, class `tr.grph`). Departments follow Settings > Groups order, names A to Z within. Print views are sorted the same way but have no heading rows.
- **Projects removed** (owner: "remove projects entirely"): Settings Projects and Clients tabs, project fields on clock-in and entries, report group/filter and CSV columns, dashboard card, "Require project" switch, sample projects and client. Data fields left in place (hidden), nothing deleted.
- **Activity tracking removed, roles kept** (owner: "don't need activity tracking"): activities are the same thing as **roles** in this app (Main role, Second role; same-role cover, auto-generate and swaps depend on them), so they were NOT deleted. Hidden: activity picker on clock-in and time entries, report grouping/filter, dashboard Activities card, CSV Activity column, billable fields, "Require activity" switch. Settings page is now **Roles**; reports default to group by Member. Clock-ins take the person's main role automatically. flow6.py was updated (filters by member now).
- **Phone top bar** (version 1794475612-cd9e): the All locations picker now shrinks so the avatar never leaves the screen (checked at 360, 375, 390, 414 px).
- **Proview AI dates** (version 1794475612-cd9e): "Compare the 3rd of November with the 10th of November", "3rd vs 10th", "between 1 nov and 8 nov" now work (see doc 09).

## Not built (owner said no or has not chosen)
TOIL; Xero/Sage formats ("No"); shift templates (explained, not wanted unless adding shifts by hand); fit-for-work check (optional idea); everything else in doc 07's MISSING list.

## Still open
GitHub account/repo for hosting; Saturday auto-prepare has no server timer; voice entry does not understand swaps; phone slide-out menu bottom buttons possibly clipped on iPhone; owner sees both "Documents" and "My documents" in a blank venue menu; Rota "By department" card takes phone space (offered to tuck away, no answer).
