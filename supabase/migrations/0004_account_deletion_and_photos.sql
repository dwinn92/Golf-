-- Deleting your account, and scorecard photos.

create or replace function public.delete_my_account() returns void
language plpgsql volatile security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  cid uuid;
begin
  if me is null then raise exception 'not signed in'; end if;

  -- Hand on or tidy up each clubhouse first, so nobody is left in a club with
  -- no owner. Collect the ids before leaving: leave_club edits the same table.
  for cid in select club_id from public.club_members where user_id = me loop
    perform public.leave_club(cid);
  end loop;

  delete from public.round_partners p
   where p.partner_id = me or p.round_id in (select id from public.rounds where user_id = me);
  delete from public.card_offers where from_user = me or to_user = me;
  delete from public.notifications where user_id = me or actor_id = me;
  delete from public.tee_confirmations where user_id = me;
  update public.rounds set attested_by = null, attested_at = null where attested_by = me;
  delete from public.rounds where user_id = me;
  delete from public.profiles where id = me;
  -- Courses and tees this member contributed stay: other people's rounds refer
  -- to them, and they are reference data, not personal data.
  update public.courses set created_by = null where created_by = me;
  update public.tees set created_by = null where created_by = me;

  delete from auth.users where id = me;
end;
$$;

/* ---------- scorecard photos ---------- */

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('scorecards', 'scorecards', false, 8388608,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists scorecards_insert on storage.objects;
create policy scorecards_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'scorecards'
              and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists scorecards_read on storage.objects;
create policy scorecards_read on storage.objects for select to authenticated
  using (bucket_id = 'scorecards' and exists (
    select 1 from public.club_members mine
    join public.club_members theirs on theirs.club_id = mine.club_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id::text = (storage.foldername(name))[1]
  ));

drop policy if exists scorecards_delete on storage.objects;
create policy scorecards_delete on storage.objects for delete to authenticated
  using (bucket_id = 'scorecards'
         and (storage.foldername(name))[1] = (select auth.uid())::text);
