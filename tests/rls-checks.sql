-- Row level security checks, run by impersonating members inside Postgres.
--
-- Run against the project (Supabase SQL editor, or psql):
--     \i tests/rls-checks.sql
-- Every check raises on failure, so a clean run means the model holds. The
-- test members are created and removed by this script; it leaves no rows.

begin;

do $$
declare
  u1 uuid := '11111111-1111-1111-1111-111111111111';
  u2 uuid := '22222222-2222-2222-2222-222222222222';
  u3 uuid := '33333333-3333-3333-3333-333333333333';
  code text; n int; round1 uuid; shared uuid; myclub uuid; passed int := 0;
begin
  insert into auth.users (id, email, raw_user_meta_data, aud, role) values
    (u1, 'rlstest1@example.invalid', '{"display_name":"RLS One"}'::jsonb,   'authenticated','authenticated'),
    (u2, 'rlstest2@example.invalid', '{"display_name":"RLS Two"}'::jsonb,   'authenticated','authenticated'),
    (u3, 'rlstest3@example.invalid', '{"display_name":"RLS Three"}'::jsonb, 'authenticated','authenticated');

  -- the sign-up trigger gives every new member a private clubhouse they own
  select count(*) into n from public.club_members m
   where m.user_id in (u1,u2,u3) and m.role = 'owner';
  if n <> 3 then raise exception 'FAIL: sign-up did not create a clubhouse each (%)', n; end if;
  passed := passed + 1;

  select invite_code into code from public.clubs where created_by = u1;

  -- u2 joins u1's clubhouse with the code
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role','authenticated')::text, true);
  set local role authenticated;
  perform public.join_club_by_code(code);
  reset role;
  passed := passed + 1;

  -- a bogus code joins nothing
  perform set_config('request.jwt.claims', json_build_object('sub', u3, 'role','authenticated')::text, true);
  set local role authenticated;
  begin
    perform public.join_club_by_code('ZZZZZZZZ');
    raise exception 'FAIL: a bogus invite code was accepted';
  exception when others then
    if sqlerrm like 'FAIL:%' then raise; end if; passed := passed + 1;
  end;
  reset role;

  -- u1 posts a round and tags u2
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role','authenticated')::text, true);
  set local role authenticated;
  insert into public.rounds (user_id, played_on, course_name, tee_name, course_rating, slope_rating, par, adjusted_gross, differential)
  values (u1, current_date, 'RLS Links', 'White', 71.5, 130, 72, 85, 11.7) returning id into round1;
  insert into public.round_partners (round_id, partner_id) values (round1, u2);
  reset role;
  passed := passed + 1;

  -- a clubmate sees the round and the profile
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role','authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.rounds where user_id = u1;
  if n <> 1 then raise exception 'FAIL: clubmate cannot see the round (%)', n; end if;
  select count(*) into n from public.profiles where id = u1;
  if n <> 1 then raise exception 'FAIL: clubmate cannot see the profile'; end if;
  reset role;
  passed := passed + 2;

  -- someone in a different clubhouse sees none of it
  perform set_config('request.jwt.claims', json_build_object('sub', u3, 'role','authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.rounds;         if n <> 0 then raise exception 'FAIL: outsider sees % rounds', n; end if;
  select count(*) into n from public.profiles where id <> u3;
  if n <> 0 then raise exception 'FAIL: outsider sees % profiles', n; end if;
  select count(*) into n from public.clubs;          if n <> 1 then raise exception 'FAIL: outsider sees % clubs', n; end if;
  select count(*) into n from public.club_members where user_id <> u3;
  if n <> 0 then raise exception 'FAIL: outsider sees other memberships'; end if;
  select count(*) into n from public.round_partners; if n <> 0 then raise exception 'FAIL: outsider sees partner tags'; end if;
  reset role;
  passed := passed + 5;

  -- no offering a card across clubhouses
  perform set_config('request.jwt.claims', json_build_object('sub', u3, 'role','authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.card_offers (from_user, to_user, payload) values (u3, u1, '{}'::jsonb);
    raise exception 'FAIL: offered a card across clubhouses';
  exception when others then
    if sqlerrm like 'FAIL:%' then raise; end if; passed := passed + 1;
  end;
  -- and no attesting a card you did not play in
  begin
    perform public.attest_round(round1);
    raise exception 'FAIL: a stranger attested a card';
  exception when others then
    if sqlerrm like 'FAIL:%' then raise; end if; passed := passed + 1;
  end;
  reset role;

  -- nor attesting your own
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role','authenticated')::text, true);
  set local role authenticated;
  begin
    perform public.attest_round(round1);
    raise exception 'FAIL: self-attestation allowed';
  exception when others then
    if sqlerrm like 'FAIL:%' then raise; end if; passed := passed + 1;
  end;
  reset role;

  -- the tagged marker can, and the owner is told
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role','authenticated')::text, true);
  set local role authenticated;
  perform public.attest_round(round1);
  reset role;
  select count(*) into n from public.rounds where id = round1 and attested_by = u2;
  if n <> 1 then raise exception 'FAIL: the marker could not attest'; end if;
  select count(*) into n from public.notifications where user_id = u1 and kind = 'attested';
  if n <> 1 then raise exception 'FAIL: no attestation notice'; end if;
  passed := passed + 2;

  -- tagging upgrades the generic notice rather than sending a second one
  select count(*) into n from public.notifications where user_id = u2;
  if n <> 1 then raise exception 'FAIL: clubmate got % notices for one round', n; end if;
  select count(*) into n from public.notifications where user_id = u2 and kind = 'tagged';
  if n <> 1 then raise exception 'FAIL: the notice was not upgraded to tagged'; end if;
  passed := passed + 2;

  -- nobody writes someone else's scoring record, or reads their notifications
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role','authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.rounds (user_id, played_on, course_name, tee_name, course_rating, slope_rating, par, adjusted_gross, differential)
    values (u1, current_date, 'X', 'W', 70, 113, 72, 99, 29.0);
    raise exception 'FAIL: posted a round as another member';
  exception when others then
    if sqlerrm like 'FAIL:%' then raise; end if; passed := passed + 1;
  end;
  update public.rounds set adjusted_gross = 60 where id = round1;
  if found then raise exception 'FAIL: edited another member''s round'; end if;
  delete from public.rounds where id = round1;
  if found then raise exception 'FAIL: deleted another member''s round'; end if;
  begin
    insert into public.notifications (user_id, kind, body) values (u1, 'spam', 'x');
    raise exception 'FAIL: hand-written notification accepted';
  exception when others then
    if sqlerrm like 'FAIL:%' then raise; end if; passed := passed + 1;
  end;
  select count(*) into n from public.notifications where user_id <> u2;
  if n <> 0 then raise exception 'FAIL: read % of someone else''s notifications', n; end if;
  passed := passed + 3;

  -- leaving your own one-person club reaps it
  select m.club_id into myclub from public.club_members m
   join public.clubs c on c.id = m.club_id
   where m.user_id = u2 and c.created_by = u2;
  delete from public.club_members where club_id = myclub and user_id = u2;
  reset role;
  select count(*) into n from public.clubs where id = myclub;
  if n <> 0 then raise exception 'FAIL: empty club not reaped on leave'; end if;
  passed := passed + 1;

  -- a signed-out visitor reads nothing at all
  perform set_config('request.jwt.claims', null, true);
  set local role anon;
  select count(*) into n from public.rounds;   if n <> 0 then raise exception 'FAIL: anon reads rounds'; end if;
  select count(*) into n from public.profiles; if n <> 0 then raise exception 'FAIL: anon reads profiles'; end if;
  select count(*) into n from public.clubs;    if n <> 0 then raise exception 'FAIL: anon reads clubs'; end if;
  reset role;
  passed := passed + 3;

  -- deleting an account takes the member with it and hands on their club
  select m.club_id into shared from public.club_members m
   where m.user_id = u2 and m.club_id in (select club_id from public.club_members where user_id = u1);
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role','authenticated')::text, true);
  set local role authenticated;
  perform public.delete_my_account();
  reset role;
  select count(*) into n from auth.users where id = u1;      if n <> 0 then raise exception 'FAIL: auth user survived'; end if;
  select count(*) into n from public.profiles where id = u1; if n <> 0 then raise exception 'FAIL: profile survived'; end if;
  select count(*) into n from public.rounds where user_id = u1; if n <> 0 then raise exception 'FAIL: rounds survived'; end if;
  select count(*) into n from public.notifications where user_id = u1 or actor_id = u1;
  if n <> 0 then raise exception 'FAIL: notifications survived'; end if;
  select count(*) into n from public.club_members where club_id = shared and user_id = u2 and role = 'owner';
  if n <> 1 then raise exception 'FAIL: the shared club was not handed on (%)', n; end if;
  passed := passed + 5;

  raise notice 'ALL % RLS CHECKS PASSED', passed;
end $$;

delete from auth.users where email like 'rlstest%@example.invalid';

commit;
