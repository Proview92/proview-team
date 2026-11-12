# Proview Employee: full feature analysis (9 Nov 2026)

Source: employee.proviewcrm.co.uk, walked through live (admin login, demo business "PROVIEW TECH DEMO", read-only). The demo has almost no data, so empty states and every form were captured, but populated screens (real timesheets, clock-in sessions, AI answers) were not seen.

## 0. What it is
A time and attendance app: clock in/out, breaks, rota, timesheets with approvals, tasks tied to shifts, time off, reports, payslips and P45s, a shared kiosk and an AI question box. Two experiences: Admin view (owner, admin, manager) and Staff view (member): Home, Time clock, Tasks, Timesheets only (more if switched on per person). Data is stored in the browser only (Company page: Export backup, Restore backup, Reset demo data). Licensing per staff member; multi-business hub ("Locations"); role preview ("Signed in as").

## 1. Layout and navigation
Left menu grouped with headings: Locations (hub); WORK: Get Started, Dashboard, Timesheets, Rota, Tasks; TEAM: Live Locations, Time Off; INSIGHTS: Reports, Proview AI; SETTINGS: People, Users, Payslips, Time Tracking, Schedules, Holidays, Locations, Projects, Company. Bottom: Who's in/out, Open kiosk, Dark mode, Sign out. Top bar: page title, location picker, status dot, Search (Ctrl+K), Team chat, Inbox, Notifications, account menu. Scope switch on Dashboard, Timesheets, Live Locations and Time Off: Organization / Managed by me / Personal. Patterns: tabs under the title; filter row; right-hand slide-in panels for add/edit; empty states; status chips; archived items collapsed.

## 2. Pages
- **Get Started:** greeting, progress bar, five steps (work schedule, time-tracking rules, activities and projects, work locations, invite team).
- **Dashboard:** Day/Week/Month; alert strip for licences; filters; greeting card; four tiles (Worked hours, Breaks, Overtime hours, Labour cost); Today's tasks; On the rota today; tracked hours by weekday; Activities, Projects, Locations breakdown; Upcoming holidays; right column Who's in/out widget.
- **Timesheets:** tabs Timesheets / Approvals; weekly or daily; "Payroll hours" toggle; Export; Add time entry (Time entry / Hour entry; Member; Date; Clock in/out; Break; Activity; Project; Location; Note). Approvals: week picker, Approve all, rows with tracked, overtime, entries, status, Reject/Approve.
- **Rota:** week arrows, group filter; Cover rules, Copy last week, Clear drafts, Download, Print, Auto-generate, Publish. Grid per member with contracted hours; Open shifts and Cover rows. Add Shift panel (Member, Date, Start, End, Unpaid break, Activity, Location, Note). Cover rules panel (rule name, day chips, from/to, people needed, break, group, bank holidays) plus Rota rules (max working days, minimum rest 11 h, avoid overtime, share weekend/late shifts fairly).
- **Tasks:** Board / List / My tasks; New task (title, notes, date, time, location, priority, activity, assign: a person / by shift one / by shift everyone, repeat, checklist). Staff see Today / Upcoming / Done.
- **Live Locations:** OpenStreetMap map and members list.
- **Time Off:** Calendar, Overview (Pending/Approved/Rejected/All, filters, Export), Leave Balance. Add time off (Member, Policy, From, To, Half day, Note, Status, working days counter).
- **Reports:** Tracked Time Report (group by, donut, tiles, hours breakdown, filters, Export) and Attendance Insights Report (days worked, late arrivals, absences, overtime, table); Exported Files.
- **Proview AI:** chat box with suggested questions (who is clocked in, hours this week, overtime, late, rota tomorrow, open tasks, who is off, hours by project, payroll cost).
- **Team chat, Inbox, Notifications.**

## 3. Settings pages
- **People:** Members (name, role, email, group, schedule, kiosk code, face ID, last active), Groups, Roles matrix.
- **Users:** Role (Owner, Admin, Manager, Staff), locations, features tick list (Timesheets, Approvals, Rota, Tasks, Time off, Reports, Payslips & P45s, People, Proview AI, Settings pages), Send sign-in invite, Remove from team.
- **Payslips and P45s:** upload; tabs All / Payslips / P45s; staff see their own.
- **Time Tracking:** Policies (device restrictions, verification, location, time entries, schedule restrictions), Approvals (weekly/2-weekly/monthly, lock, reminders), Time Rounding (clock in/out rounding, grace period, overtime multiplier).
- **Schedules:** Fixed / Flexible / Weekly arrangement, days, payroll hours, breaks, auto deductions, overtime rules (daily, double, weekly, rest day, public holiday), locations, members.
- **Holidays:** Time off policies (name, paid/unpaid, days/hours, accrual, entitlement, exclusions, carry forward, colour) and public holiday calendars.
- **Locations:** address search, radius picker, map/list, archived.
- **Projects:** Activities, Projects, Clients (removed from our app on 12 Nov; activities kept only as roles).
- **Company:** organisation details, regional settings, side cards (role preview, dark mode, data backup), Permissions tab (manager and member toggles).

## 4. Roles matrix
Owner and Admin: everything (Owner also billing/ownership). Manager: team timesheets, approvals, reports for the groups they manage. Member: track own time, own timesheets, request time off.

## 5. Staff view
Home (rota line, status chip, Clock in button, tiles, tasks, upcoming shifts); Time clock (live clock, Start break, Clock out, today's activity); Tasks; Timesheets (week, totals, day rows, "Ask your manager to correct your timesheet before it's approved").

## 6. Kiosk (shared tablet)
Full-screen dark page: clock, "Tap your name to clock in or out", Scan QR code, one tile per person, Exit kiosk. PIN step and face check follow per settings.

## 7. Suggested data model
business, location, user, group, schedule, shift, cover rule, time entry, timesheet approval, task, time-off policy, time-off request, holiday calendar, activity, project, client, payslip/P45 document, chat message, notification, org settings.

## 8. Things that need a decision or a real server
Face recognition, selfies, geofencing and live location need a phone/camera and a server; emailed invites, payslip sharing between devices, real logins, chat between devices and licence billing need the shared online database.
