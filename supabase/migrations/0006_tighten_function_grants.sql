-- Postgres grants EXECUTE to PUBLIC by default, and anon inherits it, so
-- revoking from anon alone left every security-definer function callable
-- without signing in. Revoke from PUBLIC and grant back deliberately.

do $$
declare fn text;
begin
  foreach fn in array array[
    'public.new_invite_code()',
    'public.my_club_ids()',
    'public.shares_club(uuid)',
    'public.create_club(text)',
    'public.join_club_by_code(text)',
    'public.leave_club(uuid)',
    'public.attest_round(uuid, boolean)',
    'public.delete_my_account()',
    'public.handle_new_user()',
    'public.notify_round_posted()',
    'public.notify_partner_tagged()',
    'public.notify_attested()',
    'public.notify_card_offer()',
    'public.reap_empty_club()'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
  end loop;
end $$;

-- Signed-in members need exactly these, and nothing else.
grant execute on function public.my_club_ids()               to authenticated;
grant execute on function public.shares_club(uuid)           to authenticated;
grant execute on function public.create_club(text)           to authenticated;
grant execute on function public.join_club_by_code(text)     to authenticated;
grant execute on function public.leave_club(uuid)            to authenticated;
grant execute on function public.attest_round(uuid, boolean) to authenticated;
grant execute on function public.delete_my_account()         to authenticated;

-- new_invite_code, handle_new_user, the notify_* triggers and reap_empty_club
-- are internal: they run as the definer from triggers and other functions, and
-- nobody should be able to call them over the API.
