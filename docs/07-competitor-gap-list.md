# Proview Employee: comparison with other systems (12 Nov 2026, corrected)

## BUILT 12 Nov
- **Holiday from hours worked**: a time off policy can be set to "From hours worked" (default 12.07%). Leave balance tab shows hours earned, taken (days counted at that person's average shift length) and left. Brags sample org gets a "Holiday (hours worked)" policy. Request panel shows hours left. Code: `holEarned()` in 03-engine.js, lvBal in 31-plan-b.js, polPanel in 11-admin-b.js.
- **Certificates in the Documents table**: Food hygiene, First aid, Right to work; date chips only (green / amber within 30 days / red expired), set per person in the Documents person panel ("Other certificates"). No reminders, no clock-in blocking, by request. Documents table was compacted so it fits without sideways scrolling on computer and iPad (checked 1400, 1180, 1024, 820, 768); phone still scrolls. Code: `CERTS`, `certChip`, `reqChips` in 50-docs.js; `.doct` CSS at the end of style.css. Test data loader adds sample dates.
- **Payroll export with any dates**: Timesheets > More > "Payroll export (choose dates)". From/To date pickers plus Last month / This month / Previous 4 weeks. One line per person: days worked, hours (payroll rounding), breaks, overtime, days off per leave type, holiday earned (h) if an hours-worked policy exists, entries not approved, and (owner/admin, pay not hidden) hourly rate and gross pay. Uses `rangeCalc` so overtime is worked out week by week and clipped to the chosen dates; each clock-in counts on its start day. Goes through the check-before-download screen. Code: src/53-payx.js.
- Not yet built: TOIL, shift templates, accountant file formats (Xero/Sage/QuickBooks), "paid" marker.

Compared: Planday, Deputy, 7shifts, RotaCloud, When I Work, Homebase, Connecteam, Sling, Fourth, Tanda, Findmyshift (vendor pages, review sites). Our column was checked against the code on 12 Nov.

Legend: MISSING = we have nothing. PARTLY = something exists but less than they offer. HAVE = level or ahead.

## MISSING (we have nothing)
| Feature | Who has it |
|---|---|
| Fit-for-work check at clock-in (well, no sickness 48h) | Deputy |
| Skills / qualifications on staff, shown on rota, block a shift needing a skill | Planday, Deputy, Fourth, Tanda |
| Add my shifts to phone calendar (.ics / live link) | Planday, When I Work, RotaCloud |
| Payroll file in accountant formats (Xero, Sage, QuickBooks, BrightPay) | RotaCloud, Deputy, Planday, 7shifts |
| Sales / labour target: expected sales, labour %, warn when over (our AI says "we do not hold sales") | Planday, 7shifts, Deputy, Fourth |
| Demand forecasting (staff needed from past sales) | Fourth, 7shifts, Deputy |
| Shift templates / saved patterns ("Weekday opening") | Planday, Deputy, 7shifts, Sling |
| Tip / tronc pooling | 7shifts |
| Announcements / news feed with read receipts | Deputy, 7shifts, Connecteam, Sling |
| Manager log book (dated notes per person) | RotaCloud, 7shifts |
| UK Working Time checks: 48h average, under-18 limits, night work, 20 min break after 6h | Deputy, Fourth |
| Overtime warning before the limit is reached | 7shifts |
| Staff surveys / shift feedback / engagement | Deputy, 7shifts, Connecteam |
| Hiring: job posts, applicants, onboarding checklist | 7shifts, Deputy, Connecteam |
| Award / pay-rule interpretation (premiums, bank holiday uplift automatically) | Tanda, Deputy |
| Auto-approve timesheets that match the rota | Tanda, Humanforce |
| Performance reviews, warnings, incident forms | Tanda, Connecteam |
| Training courses / quizzes inside the app | Connecteam |
| Integrations: EPOS (Square, Lightspeed, Toast), Xero, Zapier | all big ones |
| Weather-based scheduling | 7shifts |
| Apple Watch clocking | Homebase and others |
| Custom employee fields (emergency contact, uniform size) | Planday |
| Birthdays / work anniversaries | Connecteam, Sling |
| Multi-venue roll-up for owner (chain view) | Planday, Fourth, Deputy |

## PARTLY (exists, but smaller)
- **Holiday accrual**: monthly accrual, carry-over, and accrual from hours worked. Still no TOIL, and not added at payroll automatically (shown as a column in the payroll export).
- **Certificates**: allergen certificate blocks clock-in when expired; food hygiene / first aid / right to work shown as dates (no reminders).
- **Clock-in checks**: selfie, geofence, location and offline-clocking switches exist in Settings; they need the real server to work for real.
- **Break deduction / overtime / bank holidays**: automatic unpaid break, overtime and bank holiday handling exist. Missing: premium pay rates per role/shift.
- **Notifications**: in-app only. Deputy/7shifts add SMS, email, WhatsApp, push. Needs the server.
- **Labour cost**: owner sees cost from hourly rates. No budget to compare with.
- **Audit trail**: not confirmed as a full "who changed what" log.
- **Reports**: CSV, PDF and print views exist; fewer report types than Deputy/Planday.

## HAVE (level or ahead)
Kiosk with QR and PIN, AI question box, trial periods, cover rules and auto-generate rota, shift swaps and pick-ups, open shifts, availability and time-off requests, staff chat, documents gate before first clock-in, welcome pack, role and feature permissions, printable rota and timesheets, backup and restore, dark mode, themed pop-ups, daily briefing.

## Sources
planday.com/roster; capterra.com Planday; deputy.com/features; erpresearch.com Deputy; 7shifts.com blog; fitsmallbusiness.com 7shifts review; rotacloud.com holiday planner and time-and-attendance; expertsure.com RotaCloud review; connecteam.com reviews; Sling vs Deputy/Homebase comparisons; Fourth (UK hospitality) product pages; Tanda, Findmyshift, Humanforce feature pages.
