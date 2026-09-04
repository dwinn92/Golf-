-- Private clubhouses.
--
-- Until now every signed-up account could read every profile and every round:
-- profiles_read and rounds_read were both `true`. That is fine for one group of
-- friends and wrong for a public sign-up page. From here a member sees only the
-- people they share a clubhouse with.
--
-- Joining is by invite code, and code lookup happens inside a security-definer
-- function so nobody can enumerate clubs they are not in.

create table if not exists public.clubs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 60),
  invite_code text not null unique,
  created_by  uuid references auth.users on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.club_members (
  club_id   uuid not null references public.clubs on delete cascade,
  user_id   uuid not null references auth.users on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);
create index if not exists club_members_user_idx on public.club_members (user_id);

-- Unambiguous alphabet: no O/0, I/1, so a code read aloud in a bar still works.
create or replace function public.new_invite_code() returns text
language plpgsql volatile set search_path = public as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
begin
  loop
    code := '';
    for i in 1..8 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.clubs c where c.invite_code = code);
  end loop;
  return code;
end;
$$;

-- Security definer so the membership policies below can consult membership
-- without a policy consulting itself.
create or replace function public.my_club_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select club_id from public.club_members where user_id = auth.uid();
$$;

create or replace function public.shares_club(target uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select target = auth.uid() or exists (
    select 1
    from public.club_members m
    where m.user_id = target
      and m.club_id in (select club_id from public.club_members where user_id = auth.uid())
  );
$$;

revoke execute on function public.new_invite_code() from anon, authenticated;
revoke execute on function public.my_club_ids() from anon;
revoke execute on function public.shares_club(uuid) from anon;

/* ---------- creating and joining ---------- */

create or replace function public.create_club(club_name text) returns public.clubs
language plpgsql volatile security definer set search_path = public as $$
declare c public.clubs;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into public.clubs (name, invite_code, created_by)
  values (btrim(club_name), public.new_invite_code(), auth.uid())
  returning * into c;
  insert into public.club_members (club_id, user_id, role) values (c.id, auth.uid(), 'owner');
  return c;
end;
$$;

create or replace function public.join_club_by_code(code text) returns public.clubs
language plpgsql volatile security definer set search_path = public as $$
declare c public.clubs;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select * into c from public.clubs where invite_code = upper(btrim(code));
  if not found then raise exception 'no_such_code'; end if;
  insert into public.club_members (club_id, user_id, role)
  values (c.id, auth.uid(), 'member')
  on conflict do nothing;
  return c;
end;
$$;

-- Leaving is ordinary DELETE (see members_delete), except that the last owner
-- may not strand a club without one.
create or replace function public.leave_club(target_club uuid) returns void
language plpgsql volatile security definer set search_path = public as $$
declare owners int;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select count(*) into owners
  from public.club_members
  where club_id = target_club and role = 'owner' and user_id <> auth.uid();
  if owners = 0 and exists (
        select 1 from public.club_members
        where club_id = target_club and user_id <> auth.uid()) then
    -- hand the club to the longest-standing remaining member
    update public.club_members set role = 'owner'
    where (club_id, user_id) = (
      select club_id, user_id from public.club_members
      where club_id = target_club and user_id <> auth.uid()
      order by joined_at limit 1);
  end if;
  delete from public.club_members where club_id = target_club and user_id = auth.uid();
  delete from public.clubs c
   where c.id = target_club
     and not exists (select 1 from public.club_members m where m.club_id = c.id);
end;
$$;

revoke execute on function public.create_club(text) from anon;
revoke execute on function public.join_club_by_code(text) from anon;
revoke execute on function public.leave_club(uuid) from anon;

/* ---------- policies ---------- */

alter table public.clubs enable row level security;
alter table public.club_members enable row level security;

drop policy if exists clubs_read on public.clubs;
create policy clubs_read on public.clubs for select to authenticated
  using (id in (select public.my_club_ids()));

drop policy if exists clubs_update on public.clubs;
create policy clubs_update on public.clubs for update to authenticated
  using (exists (select 1 from public.club_members m
                  where m.club_id = clubs.id and m.user_id = (select auth.uid()) and m.role = 'owner'))
  with check (exists (select 1 from public.club_members m
                  where m.club_id = clubs.id and m.user_id = (select auth.uid()) and m.role = 'owner'));

drop policy if exists members_read on public.club_members;
create policy members_read on public.club_members for select to authenticated
  using (club_id in (select public.my_club_ids()));

drop policy if exists members_delete on public.club_members;
create policy members_delete on public.club_members for delete to authenticated
  using (user_id = (select auth.uid()));

-- Deliberately no INSERT policy: joining goes through create_club /
-- join_club_by_code so a code is required and cannot be probed.

/* ---------- the data itself is now club-scoped ---------- */

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
  using (public.shares_club(id));

drop policy if exists rounds_read on public.rounds;
create policy rounds_read on public.rounds for select to authenticated
  using (public.shares_club(user_id));

drop policy if exists partners_read on public.round_partners;
create policy partners_read on public.round_partners for select to authenticated
  using (exists (select 1 from public.rounds r
                  where r.id = round_partners.round_id and public.shares_club(r.user_id)));

-- You may only tag someone you actually share a clubhouse with.
drop policy if exists partners_insert on public.round_partners;
create policy partners_insert on public.round_partners for insert to authenticated
  with check (
    exists (select 1 from public.rounds r
             where r.id = round_partners.round_id and r.user_id = (select auth.uid()))
    and public.shares_club(partner_id)
  );

-- Courses and tees stay readable by everyone: the course book is reference
-- data, not personal data, and a shared book is the point of it.

/* ---------- everyone already here keeps seeing each other ---------- */

do $$
declare seed_club uuid;
begin
  if exists (select 1 from public.profiles) and not exists (select 1 from public.clubs) then
    insert into public.clubs (name, invite_code, created_by)
    values ('The Clubhouse', public.new_invite_code(),
            (select id from public.profiles order by created_at limit 1))
    returning id into seed_club;
    insert into public.club_members (club_id, user_id, role)
    select seed_club, p.id,
           case when p.id = (select id from public.profiles order by created_at limit 1)
                then 'owner' else 'member' end
    from public.profiles p;
  end if;
end $$;

/* ---------- a new member lands in a clubhouse of their own ---------- */

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  new_club uuid;
  who text := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
                       split_part(new.email, '@', 1));
begin
  insert into public.profiles (id, display_name, color)
  values (new.id, who, coalesce(nullif(new.raw_user_meta_data ->> 'color', ''), '#1F6B4A'))
  on conflict (id) do nothing;

  -- Private by default: your own clubhouse, which you can then share by code
  -- or leave once you have joined someone else's.
  insert into public.clubs (name, invite_code, created_by)
  values (left(who, 40) || '''s clubhouse', public.new_invite_code(), new.id)
  returning id into new_club;
  insert into public.club_members (club_id, user_id, role) values (new_club, new.id, 'owner');
  return new;
end;
$$;
