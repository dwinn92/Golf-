-- A club whose last member has gone — through leave_club, or through an
-- auth.users delete cascading into club_members — is dead weight, and its
-- invite code should stop working. Reap it whichever way the member left.

create or replace function public.reap_empty_club() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.clubs c
   where c.id = old.club_id
     and not exists (select 1 from public.club_members m where m.club_id = c.id);
  return null;
end;
$$;

drop trigger if exists club_members_reap on public.club_members;
create trigger club_members_reap after delete on public.club_members
  for each row execute function public.reap_empty_club();

delete from public.clubs c
 where not exists (select 1 from public.club_members m where m.club_id = c.id);
