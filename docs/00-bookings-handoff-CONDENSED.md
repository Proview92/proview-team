# Proview Bookings – handoff notes – CONDENSED COPY

IMPORTANT: this is a shortened copy. The full original (about 95 KB, version-by-version history v1 to v222 of Proview Bookings, full data format) stays in the claude.ai Project "RESERVATION PROJECT" as `claude/00-handoff-read-first.md`. Everything about Proview EMPLOYEE (the staff app) is complete in the other docs of this export.


## The apps (all Claude artifacts)
| App | Who uses it | Link | Latest version |
|---|---|---|---|
| Proview Bookings (customer UI) | Restaurant staff | https://claude.ai/artifact/WBkWL4p2QiJ8GE4daupskD | v222 (artifact's own counter 227) |
| Proview Employee (staff app) | Café staff | https://claude.ai/artifact/RwKLxStngw8bNgxQAxbDzR | 1794475612-cd9e |



Current limit: the apps keep data in the browser only (localStorage). Anything shared between devices, automatic emails/WhatsApp, an online booking widget or payments needs a shared online database and logins (a separate build).

## Proview Bookings: data format (v222), summary
Everything lives in one object `S`, JSON in localStorage key `proview-bookings-v1` (plus `-colors`, `-theme`, `-vid`, and several per-device UI keys).
- Top-level fields: venue (name, hours, stay lengths, id), tables, rooms, deco (walls, bar, doors, plants, labels), parties (every booking), waiting (walk-in queue), gnotes (guest notes), ts (live table status), fc (forecast settings), hist (history), perm, loy (loyalty), splits, combos, audit, and demo flags.
- Booking: id, name, phone, email, size, date `YYYY-MM-DD`, time `HH:MM`, dur (minutes), table (+ join, part), status (`booked`, `seated`, `done`, `noshow`, `cancelled`), notes, tags (VIP, Regular, Allergy, Celebrating, custom), src (Phone, Website, Walk-in, App), arr, resolved, left (ms timestamp, set only by the Left button = confirmed visit), occ (occasion), dsrt (pre-ordered dessert), conf/rem (reminder/confirmation), lateBy, arrN/seatN (part arrived/seated), disc/code (loyalty).
- Guests are not stored records: key = normalised phone (else lowercase name); guest note in `S.gnotes`.
- Table: id, name, seats, area (room), shape, x, y, w, h, optional min/max; live state in `S.ts[tableId]` = free, seated, dessert, paying, clearing.
- Seated / Unseat / Left: Seated seats the earliest booked party on the table; Unseat returns it to booked and keeps the table; Left is the only action that closes a visit (status done, `left` set, table to clearing).
- Loyalty: a visit counts only if status done AND `left` set. Every Nth confirmed visit (default 3) the guest gets pct% (default 10) off, shown as a note for the EPOS. No automatic emails yet (needs a server).
- Staff, punches, rota, labour and pay features were REMOVED from Bookings (v196 to v198); they live in Proview Employee.

## Proview Bookings: version headlines
v222 Free button removed, Needs clearing toggles. v221 colour-coded table picker. v220 Move button in table pop-up. v219 plain numbers on table tiles, Re-Seat. v218 richer demo data (20 tables, ~125 bookings). v216 demo tables. v215 flow chart fix. v214 cleaner phone table pop-up, flow chart breakdown, widget card restyled, room switcher on the plan. v213 late arrivals (15 min), chairs all round. v212 limited-time tables. v211 auto-complete fix after closing. v210 phone table card as pop-up. v209 phone heads-up alerts compact. v208 table card with occasion, notes, move. v207 to v203 phone Tables/Bookings tidying. v200 seating fix after 500-scenario run. v198 pay/labour removed. v197 staff rates/rota removed. v196 Punch in removed. v195 occasions + pre-ordered dessert + Split now. v194 pinch to zoom. v193 split a table for a day. v192 loyalty invite email (timed). v191 fixes from 200-booking stress test. v190 phone booking pop-up. v186 reply Y/N base for WhatsApp. v176 to v180 Settings simplified. v165 to v172 status icons, part arrived/seated, tick/cross. v129 to v137 reminders, day summary, unresolved banner. v70 to v77 plan switches, activity log, time on table, new Bookings list/detail layout. v36 to v62 Punch in, loyalty, rota upload, manager PIN (all later removed). v1 to v35 core bookings, tables, floor, waitlist, guests, reports.

## Decisions from the owner worth keeping
- Only Left confirms a visit; no-shows and auto-completed visits never count for loyalty.
- Unseat does not unassign the table.
- Forecast looks to tomorrow at most; planned labour was manager-only (feature since removed).
- Walk-in waiting alert is an in-app pop-up only; snooze 5 minutes.
- The app is mostly used on an iPad held sideways (design for 1024x768 to 1366x1024, buttons 44px+); phone and computer must keep working.
- Apply updates without asking for confirmation each time; batch edits into fewer versions; when using a browser or the laptop, close what was opened.

## Open items (Bookings side)
Reports improvements (owner to specify); reviews/inbox/messages to guests (deferred); WhatsApp/SMS replies, automatic emails, online booking widget, shared database, real logins and payments (need a server).
