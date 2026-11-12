# Proview Team: how the cloud side is set up

## What runs where
| Part | Where |
|---|---|
| The app | GitHub Pages, from this repository (`index.html`) |
| Logins | Supabase Auth (email and password) in the `proview-team` project, London |
| Businesses, locations, licences, who may open what | Tables `pt_businesses`, `pt_sites`, `pt_business_members` (`supabase/schema.sql`) |
| Each business's working data | One document per location in `pt_site_state`, reached only through the `team-api` function |
| Licence portal link | `hub_call` / `hub_plans` (same actions as Bookings) |
| Sign in with Proview account | `sso-login` function (audience `team`) |

## How people sign in
1. **Owner:** signs in with their email. The first sign-in to a new business creates its starting data with them as the owner.
2. **Staff with their own phone:** put their email on their profile (People). They choose "First time? Create your account" with that email and arrive as themselves.
3. **Shared tablet:** sign in once with an owner or manager email at `…/?shared=1`. The tablet then shows the list of names and each person types their PIN.

A person sees only what the app allows them to see: pay rates, PINs, payslips, other people's timesheets, time off and messages are left out on the server, not just hidden on screen.

## Licences
A location works only while it has a licence (7 days of grace after a paid licence ends, none after a trial), exactly as in Bookings. New businesses start with no licence.

## Still to do by hand
1. **Licence portal and dashboard:** register the product `team` (see `docs/10-licence-portal-registration.md`). Until then licences are set with SQL and `"sso"` stays `false` in `cloud.json`.
2. **Email sending:** Supabase's built-in email is limited to a few messages an hour. Connect your own SMTP (for example Resend) under Authentication > Emails before real customers sign up.

## Rebuilding the database from scratch
Run `supabase/schema.sql` in the SQL editor, put the master email in section 11, then deploy the two functions:

    supabase functions deploy team-api
    supabase functions deploy sso-login --no-verify-jwt
