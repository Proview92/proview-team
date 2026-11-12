# Registering Proview Team in the licence portal and dashboard (done 12 Nov 2026)

Proview Team's side is ready: `hub_call`, `hub_plans` and `sso-login` are live in the `proview-team` Supabase project
(`guiwijyxzyffnmiiwpcf`). These are the changes that were made in the licence portal and the dashboard,
following what was done for QR Menu and Label.

## 1. Licence hub database (project `proview-licence`)
Add `team` to the four product checks and insert the app row. The hub token is generated here; only its hash goes
to Proview Team.

    alter table hub_private.apps drop constraint if exists apps_product_check, add constraint apps_product_check check (product = any (array['signage','bookings','employee','wifi','qrmenu','label','team']));
    alter table public.lic_accounts drop constraint if exists lic_accounts_product_check, add constraint lic_accounts_product_check check (product = any (array['signage','bookings','employee','wifi','qrmenu','label','team']));
    alter table public.lic_units drop constraint if exists lic_units_product_check, add constraint lic_units_product_check check (product = any (array['signage','bookings','employee','wifi','qrmenu','label','team']));
    alter table public.lic_plans drop constraint if exists lic_plans_product_check, add constraint lic_plans_product_check check (product = any (array['signage','bookings','employee','wifi','qrmenu','label','team']));
    insert into hub_private.apps(product, label, url, apikey, token, app_url)
    values ('team', 'Proview Team', 'https://guiwijyxzyffnmiiwpcf.supabase.co', 'sb_publishable_j6XpQ7z1VK6SsKDqzgbfuw_MNdGNQJz',
            encode(extensions.gen_random_bytes(32), 'hex'), 'https://team.proviewcrm.co.uk')
    on conflict (product) do nothing;
    select format('update hub_private.config set token_sha256 = %L where id = 1;', encode(extensions.digest(token, 'sha256'), 'hex'))
      from hub_private.apps where product = 'team';

Run the one line that prints in Proview Team's SQL editor. Until then Proview Team refuses every hub call.

## 2. `licence-hub` function (repo `proview-licence`)
Treat `team` like `bookings`: licence types `trial, m1, m3, m6, m12, m24, m36, lifetime, custom`; unit kind `location`;
a reference code (for example `pvt`); add it to `LINK_ORDER` and to the trial rule that uses `set("trial")`.

## 3. `sso-assert` function (repo `proview-licence`)
Add to `APPS`:

    team: {
      name: "Proview Team", home: "https://team.proviewcrm.co.uk/",
      origins: ["https://team.proviewcrm.co.uk", "https://proview92.github.io"], land: "",
      check: "https://guiwijyxzyffnmiiwpcf.supabase.co/functions/v1/sso-login",
    },

## 4. Portal and dashboard pages
Add the product name and an icon (`apps/team.svg`, `icons/team.svg`) wherever the other apps are listed.

## 5. Turn it on in the app
Set `"sso": true` in `cloud.json`. The sign-in screen then shows "Sign in with Proview account".
