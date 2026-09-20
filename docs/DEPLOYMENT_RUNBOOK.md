# Next Level Portal — Redesign Deployment Runbook

Status (2026-09-20): **The redesign is deployed to production.** PR #1 was merged as `3accd8f9`; Vercel deployment `dpl_GWNbNKXpyzfWFyYSHzWzMsxFty89` is Ready and assigned to `nextlevelportal.vercel.app`. Migrations 0022–0025 and the follow-up anonymous EXECUTE revocation were applied and verified.

The linked database had no `supabase_migrations.schema_migrations` table before this work, although earlier application tables existed. A read-only snapshot of the affected rows and policies was saved locally at `%TEMP%/nextlevel-portal-backup-20260920/pre-migration-snapshot.json`. A full `pg_dump` could not run because Docker was unavailable. Migrations 0022–0024 were applied individually through the authenticated Supabase CLI SQL query command. A follow-up query confirmed the RPC, both columns, audit table, and expected policies. **Do not use `supabase db push` against this project until its pre-existing migration history is reconciled.**

## Migrations in this work (5)

| File | What it does | When to apply |
| --- | --- | --- |
| `..0022_deliverable_client_status_rpc.sql` | Adds `client_set_deliverable_status` RPC (column-safe, validated `in_review`→approved/revision). **Keeps** the old policy — backward-compatible. | Step 1 (before deploy) |
| `..0023_portal_accounts.sql` | `profiles.status` + `account_audit_events` (admin-only RLS). Additive. | Step 1 (before deploy) |
| `..0024_social_posts_client_calendar.sql` | `social_posts.client_visible` + client SELECT policy. Additive. | Step 1 (before deploy) |
| `..0025_drop_legacy_deliverable_update.sql` | Drops the insecure `deliverables_client_update` policy. | Step 3 (**after** code is live) |
| `20260920103518_revoke_anon_deliverable_rpc.sql` | Removes Supabase's direct anonymous EXECUTE grant on the approval RPC. | Applied after security-advisor review |

All are idempotent.

## Zero-outage sequence (the key change)

The earlier plan dropped the insecure policy in the same step that added the RPC,
causing an **approval outage**: whichever ran first, one code version was broken
during the window. Migrations 0022–0024 are now fully backward-compatible (old
direct-update code AND new RPC code both work while the old policy is present).

1. **Done:** inspect and snapshot affected rows and policies. A full `pg_dump` could not run without Docker; no full backup was confirmed in this session.
2. **Done:** apply migrations 0022–0024. Old code kept working via the still-present policy.
3. **Done:** merge PR #1 and confirm the production Vercel deployment is Ready.
4. **Done:** sign in as admin on production and verify Accounts lists four real logins with actions and audit entries. Generate a client set-password link on the production domain. The client recovery form and content calendar were exercised locally against the same Supabase project without changing the client's password.
5. **Done:** apply 0025 after the new code was live. No deliverable was `in_review`, so a real approval could not be smoke-tested without changing production data. The prior seeded database suite recorded 16/16 passing cases for RPC authorization and transitions.
6. **Done:** revoke anonymous EXECUTE on the RPC after the Supabase security advisor found a direct grant. Verify `anon_can_execute=false`, `auth_can_execute=true`, and old broad policy count `0`.
7. **Outstanding:** use a dedicated test client and an `in_review` test deliverable to validate approve/revision end to end; reconcile the project's missing migration history before any future `db push`.

Verification queries:
```sql
select 1 from pg_proc where proname='client_set_deliverable_status';
select 1 from information_schema.columns where table_name='profiles' and column_name='status';
select 1 from information_schema.columns where table_name='social_posts' and column_name='client_visible';
-- after step 6:
select count(*) from pg_policies where tablename='deliverables' and policyname='deliverables_client_update'; -- 0
select has_function_privilege('anon', 'public.client_set_deliverable_status(uuid,text)', 'EXECUTE'); -- false
```

## Rollback — never restores the insecure policy

- **Current state:** the secure RPC is the only client-write path.
  Do **NOT** roll back to a build that expects the old policy, and do **NOT**
  recreate `deliverables_client_update` (that is the vulnerability). If a revert
  is unavoidable, ship a hotfix that keeps calling the RPC (or at most a narrowly
  column-scoped `update (status)` grant) — never the broad policy.
- `profiles.status`, `social_posts.client_visible`, `account_audit_events`, and
  the RPC can be left in place on any rollback with no ill effect.

## Post-deploy smoke test (production)

- Admin → **Accounts**: list shows all logins w/ role, status, last sign-in.
- Invite a test client login → set-password link returned (no plaintext).
- Edit that client's **email** → sign-in email updates.
- Suspend then reactivate a **non-admin** test account → suspended can't sign in.
- Staff: create/edit a social post, tick **Show in the client's content calendar**, set a date.
- Client → **Content** tab shows it; a *different* client cannot.
- Client approves / requests revision on an **in-review** video → status changes (RPC).
- Phone: dashboard **Menu** drawer covers the screen, closes on Escape/backdrop.

## Automated pre-merge evidence (already run)

`supabase/tests/run_tests.sh` stands up a local Postgres, applies migrations
0022–0025 on a seeded multi-role dataset, and asserts the security behaviour.
Latest result: **16/16 passed** (`supabase/tests/rls_test_results.txt`).
