-- Attestation, shared cards, shot stats, photos and notifications.

/* ---------- rounds gain attestation, stats, a photo and an allowance ---------- */

alter table public.rounds
  add column if not exists attested_by       uuid references auth.users on delete set null,
  add column if not exists attested_at       timestamptz,
  add column if not exists stats             jsonb,
  add column if not exists photo_path        text,
  add column if not exists allowance_percent smallint not null default 95,
  add column if not exists format_name       text;

alter table public.profiles
  add column if not exists target_index numeric(4,1);

/* A marker attests someone else's card, so it cannot go through rounds_update
   (which is restricted to the round's owner, and must stay that way). */
create or replace function public.attest_round(target_round uuid, on_off boolean default true)
returns void
language plpgsql volatile security definer set search_path = public as $$
declare owner_id uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select user_id into owner_id from public.rounds where id = target_round;
  if owner_id is null then raise exception 'no_such_round'; end if;
  if owner_id = auth.uid() then raise exception 'cannot attest your own card'; end if;
  if not exists (select 1 from public.round_partners p
                  where p.round_id = target_round and p.partner_id = auth.uid()) then
    raise exception 'not_a_marker';
  end if;
  if on_off then
    update public.rounds set attested_by = auth.uid(), attested_at = now() where id = target_round;
  else
    update public.rounds set attested_by = null, attested_at = null
     where id = target_round and attested_by = auth.uid();
  end if;
end;
$$;

/* ---------- cards keyed for you by whoever kept the group's card ---------- */

create table if not exists public.card_offers (
  id          uuid primary key default gen_random_uuid(),
  from_user   uuid not null references auth.users on delete cascade,
  to_user     uuid not null references auth.users on delete cascade,
  payload     jsonb not null,
  status      text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists card_offers_to_idx on public.card_offers (to_user, status);

alter table public.card_offers enable row level security;

drop policy if exists offers_read on public.card_offers;
create policy offers_read on public.card_offers for select to authenticated
  using (to_user = (select auth.uid()) or from_user = (select auth.uid()));

/* Anyone may hand you a card, but only from inside your clubhouse, and it is
   only ever an offer: nothing reaches your scoring record until you accept. */
drop policy if exists offers_insert on public.card_offers;
create policy offers_insert on public.card_offers for insert to authenticated
  with check (from_user = (select auth.uid()) and public.shares_club(to_user) and to_user <> from_user);

drop policy if exists offers_update on public.card_offers;
create policy offers_update on public.card_offers for update to authenticated
  using (to_user = (select auth.uid())) with check (to_user = (select auth.uid()));

drop policy if exists offers_delete on public.card_offers;
create policy offers_delete on public.card_offers for delete to authenticated
  using (from_user = (select auth.uid()) or to_user = (select auth.uid()));

/* ---------- notifications ---------- */

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  kind       text not null,
  actor_id   uuid references auth.users on delete set null,
  round_id   uuid references public.rounds on delete cascade,
  offer_id   uuid references public.card_offers on delete cascade,
  body       text not null,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists notif_read on public.notifications;
create policy notif_read on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists notif_update on public.notifications;
create policy notif_update on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists notif_delete on public.notifications;
create policy notif_delete on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));

-- No insert policy at all: only the triggers below write notifications.

create or replace function public.notify_round_posted() returns trigger
language plpgsql security definer set search_path = public as $$
declare who text;
begin
  select display_name into who from public.profiles where id = new.user_id;
  insert into public.notifications (user_id, kind, actor_id, round_id, body)
  select distinct m2.user_id, 'round_posted', new.user_id, new.id,
         coalesce(who, 'A member') || ' posted ' || new.adjusted_gross || ' at ' || new.course_name
  from public.club_members m1
  join public.club_members m2 on m2.club_id = m1.club_id
  where m1.user_id = new.user_id and m2.user_id <> new.user_id;
  return new;
end;
$$;

drop trigger if exists rounds_notify_posted on public.rounds;
create trigger rounds_notify_posted after insert on public.rounds
  for each row execute function public.notify_round_posted();

/* Partners are tagged just after the round row lands, so upgrade the generic
   notice rather than sending a second one. */
create or replace function public.notify_partner_tagged() returns trigger
language plpgsql security definer set search_path = public as $$
declare who text; owner_id uuid; gross int; course text;
begin
  select r.user_id, r.adjusted_gross, r.course_name into owner_id, gross, course
    from public.rounds r where r.id = new.round_id;
  select display_name into who from public.profiles where id = owner_id;
  if owner_id = new.partner_id then return new; end if;
  update public.notifications
     set kind = 'tagged',
         body = coalesce(who, 'A member') || ' played ' || course ||
                ' with you — confirm their card'
   where round_id = new.round_id and user_id = new.partner_id and kind = 'round_posted';
  if not found then
    insert into public.notifications (user_id, kind, actor_id, round_id, body)
    values (new.partner_id, 'tagged', owner_id, new.round_id,
            coalesce(who, 'A member') || ' played ' || course || ' with you — confirm their card');
  end if;
  return new;
end;
$$;

drop trigger if exists partners_notify_tagged on public.round_partners;
create trigger partners_notify_tagged after insert on public.round_partners
  for each row execute function public.notify_partner_tagged();

create or replace function public.notify_attested() returns trigger
language plpgsql security definer set search_path = public as $$
declare who text;
begin
  if new.attested_by is not null and old.attested_by is distinct from new.attested_by then
    select display_name into who from public.profiles where id = new.attested_by;
    insert into public.notifications (user_id, kind, actor_id, round_id, body)
    values (new.user_id, 'attested', new.attested_by, new.id,
            coalesce(who, 'A member') || ' confirmed your card at ' || new.course_name);
  end if;
  return new;
end;
$$;

drop trigger if exists rounds_notify_attested on public.rounds;
create trigger rounds_notify_attested after update on public.rounds
  for each row execute function public.notify_attested();

create or replace function public.notify_card_offer() returns trigger
language plpgsql security definer set search_path = public as $$
declare who text;
begin
  select display_name into who from public.profiles where id = new.from_user;
  insert into public.notifications (user_id, kind, actor_id, offer_id, body)
  values (new.to_user, 'card_offer', new.from_user, new.id,
          coalesce(who, 'A member') || ' kept your card at ' ||
          coalesce(new.payload ->> 'courseName', 'a course') || ' — review and post it');
  return new;
end;
$$;

drop trigger if exists offers_notify on public.card_offers;
create trigger offers_notify after insert on public.card_offers
  for each row execute function public.notify_card_offer();
