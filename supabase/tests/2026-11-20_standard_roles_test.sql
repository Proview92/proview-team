-- Test for the standard roles change (Team). Throw-away rows (zzsr / example.invalid); it ALWAYS ends with an exception
-- listing PASS / FAIL, which rolls everything back.
do $t$
declare out text[] := '{}'; tok text := 'zzsr-hub-token'; b uuid; ua uuid := gen_random_uuid(); um uuid := gen_random_uuid();
        j jsonb; r jsonb; n int; rl text;
begin
  update hub_private.config set token_sha256 = encode(extensions.digest(tok, 'sha256'), 'hex') where id = 1;
  insert into public.pt_businesses(name) values ('zzsr Alpha') returning id into b;
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, is_anonymous) values
    (ua, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'zzsr-adm@example.invalid', '', now(), now(), now(), false),
    (um, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'zzsr-mgr@example.invalid', '', now(), now(), now(), false);
  begin insert into public.pt_business_members(business_id, email, role) values (b, 'zzsr-o@example.invalid', 'Owner'); out := out || 'FAIL Owner role accepted'::text;
  exception when check_violation then out := out || 'PASS Owner role refused by the table'::text; end;
  insert into public.pt_business_members(business_id, email, user_id, role) values (b, 'zzsr-adm@example.invalid', ua, 'Admin'), (b, 'zzsr-mgr@example.invalid', um, 'Manager');
  insert into public.pt_business_members(business_id, email, role) values (b, 'zzsr-staff@example.invalid', 'Staff');
  select count(*) into n from public.pt_business_members where role = 'Owner';
  out := out || ((case when n = 0 then 'PASS' else 'FAIL' end) || ' no Owner left (' || n || ')');
  select count(*) into n from pg_proc p join pg_namespace s on s.oid = p.pronamespace
   where s.nspname in ('public', 'hub_private', 'pt_private') and p.prosrc ~ '''Owner''|"Owner"';
  out := out || ((case when n = 0 then 'PASS' else 'FAIL' end) || ' no function uses the Owner role (' || n || ')');
  select count(*) into n from pg_policies where coalesce(qual, '') || coalesce(with_check, '') ~ 'Owner';
  out := out || ((case when n = 0 then 'PASS' else 'FAIL' end) || ' no policy uses the Owner role (' || n || ')');
  -- the licence portal: role list and New business
  j := hub_users(tok, 'list', jsonb_build_object('account', b::text));
  out := out || ((case when (j->'roles')::text !~ 'Owner' and (j->'roles')::text ~ '"Admin"' then 'PASS' else 'FAIL' end) || ' portal role list: ' || coalesce((j->'roles')::text, j::text));
  begin
    j := hub_call(tok, 'add_business', jsonb_build_object('business', 'zzsr Beta', 'name', 'Bea Test', 'email', 'zzsr-bea@example.invalid', 'password', 'longpassword20'));
    select m.role into rl from public.pt_business_members m where m.email = 'zzsr-bea@example.invalid';
    out := out || ((case when rl = 'Admin' then 'PASS' else 'FAIL' end) || ' New business makes its login an Admin (' || coalesce(rl, 'none') || ')');
  exception when others then out := out || ('FAIL add_business: ' || sqlerrm); end;
  -- an admin sees the business's logins (the policy that knew Owner)
  perform set_config('request.jwt.claims', json_build_object('sub', ua, 'email', 'zzsr-adm@example.invalid', 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', ua::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.pt_business_members where business_id = b;
  out := out || ((case when n >= 3 then 'PASS' else 'FAIL' end) || ' an admin sees every login of the business (' || n || ')');
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', um, 'email', 'zzsr-mgr@example.invalid', 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', um::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.pt_business_members where business_id = b;
  out := out || ((case when n = 1 then 'PASS' else 'FAIL' end) || ' a manager sees only their own login (' || n || ')');
  execute 'reset role';
  perform set_config('request.jwt.claims', '{"role":"anon"}', true); perform set_config('request.jwt.claim.sub', '', true);
  -- sign-in check
  r := public.sso_entitled('zzsr-stranger@example.invalid');
  out := out || ((case when r->>'reason' = 'No Proview Team account for this email.' then 'PASS' else 'FAIL' end) || ' stranger: ' || coalesce(r->>'reason', r::text));
  r := public.sso_entitled('zzsr-staff@example.invalid');
  out := out || ((case when (r->>'ok')::boolean and (r->>'create')::boolean then 'PASS' else 'FAIL' end) || ' staff with no login yet: let in, login made');
  r := public.sso_entitled('zzsr-mgr@example.invalid');
  out := out || ((case when (r->>'ok')::boolean then 'PASS' else 'FAIL' end) || ' manager with a login: let in');
  r := public.sso_entitled((select email from public.pt_master_emails limit 1));
  out := out || ((case when (r->>'ok')::boolean then 'PASS' else 'FAIL' end) || ' the master is let in');
  out := out || ((case when public.pt_role_rank('Admin') = 3 and public.pt_role_rank('Manager') = 2 and public.pt_role_rank('Staff') = 1 then 'PASS' else 'FAIL' end) || ' role ranks Admin 3 / Manager 2 / Staff 1');
  out := out || ((case when (select prosrc from pg_proc where proname = 'pt_sync_people' limit 1) ~ 'when ''owner'' then ''Admin''' then 'PASS' else 'FAIL' end) || ' the rota owner person gets an Admin login');
  raise exception E'TEAM ROLES TEST RESULT (rolled back): %/% PASS\n%',
    (select count(*) from unnest(out) x where x like 'PASS%'), array_length(out, 1), array_to_string(out, E'\n');
end $t$;
