# Next Level Portal — Redesign Deployment Runbook

Status: **for review only. Nothing applied. `main`/production untouched.**
Review branch: `codex/portal-redesign-complete` (based on Phases 1–6).

## Migrations in this work (4)

| File | What it does | When to apply |
| --- | --- | --- |
| `..0022_deliverable_client_status_rpc.sql` | Adds `client_set_deliverable_status` RPC (column-safe, validated `in_review`→approved/revision). **Keeps** the old policy — backward-compatible. | Step 1 (before deploy) |
| `..0023_portal_accounts.sql` | `profiles.status` + `account_audit_events` (admin-only RLS). Additive. | Step 1 (before deploy) |
| `..0024_social_posts_client_calendar.sql` | `social_posts.client_visible` + client SELECT policy. Additive. | Step 1 (before deploy) |
| `..0025_drop_legacy_deliverable_update.sql` | Drops the insecure `deliverables_client_update` policy. | Step 3 (**after** code is live) |

All are idempotent.

## Zero-outage sequence (the key change)

The earlier plan dropped the insecure policy in the same step that added the RPC,
causing an **approval outage**: whichever ran first, one code version was broken
during the window. Migrations 0022–0024 are now fully backward-compatible (old
direct-update code AND new RPC code both work while the old policy is present).

1. **Back up** the database (Supabase → Database → Backups). Confirm a fresh backup.
2. **Resume Supabase** if paused.
3. **Apply migrations 0022, 0023, 0024 only.** Old code keeps working via the
   still-present policy; the RPC now also exists. Use the Supabase SQL Editor to
   run the complete contents of those three files, in order. Confirm each
   verification query below. Then record those exact versions in migration
   history with `supabase migration repair 20260605000022 20260605000023
   20260605000024 --status applied` against the linked project. Check
   `supabase db push --dry-run` before proceeding: it must show **only 0025**.
   Stop if it lists any other migration. Do **not** run a plain `db push` in
   this step while 0025 is present in the checkout.
4. **Merge `codex/portal-redesign-complete` → `main` after review.** Vercel deploys; new code uses the RPC.
5. **Smoke test** on production (below), especially client approve / request-revision.
6. **Apply migration 0025** after the new code and client approve/revision smoke
   test pass. Recheck `supabase db push --dry-run`; if it lists only 0025, run
   `supabase db push`. The legacy policy is then removed and only the RPC path
   remains. If any other migration appears, stop and reconcile history first.
7. Final smoke test of client approve/revision.

Verification queries:
```sql
select 1 from pg_proc where proname='client_set_deliverable_status';
select 1 from information_schema.columns where table_name='profiles' and column_name='status';
select 1 from information_schema.columns where table_name='social_posts' and column_name='client_visible';
-- after step 6:
select count(*) from pg_policies where tablename='deliverables' and policyname='deliverables_client_update'; -- 0
```

## Rollback — never restores the insecure policy

- **Before step 6 (0025 not run):** promote the previous Vercel deployment. The
  old policy is still present, so previous code works. Leave 0022–0024 (additive,
  harmless). Do **not** recreate any policy.
- **After step 6 (0025 has run):** the secure RPC is the only client-write path.
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
