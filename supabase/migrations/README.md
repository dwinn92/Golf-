# Migrations

Applied to project `pcfczfcsousxdytfbisa` in order:

1. `create_clubhouse_schema` — tables, indexes, row level security policies and
   the `handle_new_user` trigger that creates a profile on sign-up.
2. `restrict_handle_new_user_execute` — revokes EXECUTE on the trigger function
   from `anon`/`authenticated` so it cannot be called over the REST API.

They were applied through the Supabase MCP `apply_migration` tool; pull them
locally with `supabase db pull` if you adopt the CLI workflow.
