-- The app subscribes to postgres_changes on the public schema so a round
-- posted on someone else's phone appears without a refresh — but the
-- supabase_realtime publication was empty, so no change was ever broadcast
-- and the subscription had never done anything. Publish the tables the UI
-- actually reads. Every one of them has a primary key, so the default replica
-- identity is enough and updates/deletes carry an identifiable row.

do $$
declare t text;
begin
  foreach t in array array['profiles', 'courses', 'tees', 'tee_confirmations',
                           'rounds', 'round_partners', 'clubs', 'club_members',
                           'notifications', 'card_offers'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
