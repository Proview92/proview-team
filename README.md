# Proview Team

Staff rota, time clock, timesheets, time off, tasks and documents by Proview Tech.
Set up the same way as Proview Bookings: a single-page app on GitHub Pages, with logins and shared data in Supabase.

- **App:** `index.html` (built from `src/` with `python3 build.py`)
- **Cloud:** `cloud.json` points the app at the `proview-team` Supabase project. See [SETUP.md](SETUP.md).
- **Database:** `supabase/schema.sql`
- **Functions:** `supabase/functions/team-api` (shared data, per-person privacy) and `supabase/functions/sso-login` ("Sign in with Proview account")
- **Notes and tests:** `docs/`, `tests/`
- **`server-kit/`:** the earlier small Node server. Not used when `cloud.json` is present.

Pushing to `main` redeploys through GitHub Pages. Without `cloud.json` the app runs on each device on its own.

## Changing the app
Edit the pieces in `src/`, run `python3 build.py`, commit `index.html` with them.
