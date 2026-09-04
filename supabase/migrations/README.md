# Migrations

Applied to project `pcfczfcsousxdytfbisa` in order:

1. `create_clubhouse_schema` — tables, indexes, row level security policies and
   the `handle_new_user` trigger that creates a profile on sign-up.
2. `restrict_handle_new_user_execute` — revokes EXECUTE on the trigger function
   from `anon`/`authenticated` so it cannot be called over the REST API.
3. `clubs_private_clubhouses` (`0002_clubs.sql`) — clubs, membership and invite
   codes; `profiles`/`rounds`/`round_partners` reads become club-scoped instead
   of world-readable. Existing members are migrated into one shared club, and
   every new sign-up gets a private clubhouse of their own.
4. `attestation_cards_stats_notifications` (`0003_…sql`) — marker attestation,
   card offers, shot stats, photo path, playing allowance, target index and the
   notification table with its triggers.
5. `account_deletion_and_scorecard_photos` and
   `delete_account_iterate_clubs_safely` (`0004_…sql`) — `delete_my_account()`
   and the private `scorecards` storage bucket.
6. `reap_empty_clubs` (`0005_…sql`) — drop a club when its last member leaves,
   however they left.
7. `tighten_function_grants` (`0006_…sql`) — revoke EXECUTE from PUBLIC (which
   `anon` inherits) on every security-definer function and grant it back only
   where a signed-in member genuinely needs it.

They were applied through the Supabase MCP `apply_migration` tool; pull them
locally with `supabase db pull` if you adopt the CLI workflow.

## Verifying the security model

The policies are checked by impersonating members in Postgres — see
`tests/rls-checks.sql`, which asserts that members of different clubhouses
cannot see each other, that nobody can post, edit or delete another member's
round, that a marker (and only a marker) can attest, that notifications cannot
be hand-written, and that a signed-out visitor reads nothing at all.
