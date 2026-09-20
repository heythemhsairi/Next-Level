# Phase 6 — QA Report

Branch: `redesign/phase-6-hardening` · typecheck: clean · Vercel build: Ready.

## 1. Automated security tests (real, runnable)

A local Postgres harness applies the actual migration files (0022–0025) to a
seeded multi-role dataset (admin, staff/editor, client A, client B) and asserts
behaviour. **16/16 passed.** Full output: `supabase/tests/rls_test_results.txt`.
Re-run with `supabase/tests/run_tests.sh`.

Covered:
- **Cross-client isolation:** client A sees only its own client-visible posts;
  cannot see client B's posts or hidden posts; client B symmetric; staff see all.
- **Deliverable status RPC:** valid `in_review`→`approved` applies; invalid status
  value rejected; from-state guard rejects a non-`in_review` row; a `delivered`
  row is left unchanged; a cross-client RPC call is rejected.
- **Insecure policy removed:** `deliverables_client_update` is gone after 0025,
  and a raw client `UPDATE` (title/client_visible) no longer mutates the row.
- **Audit records:** admin can read `account_audit_events`; client and staff
  cannot (admin-only RLS); an inserted audit row is readable by admin.
- **Schema:** `profiles.status` present.

This is the **client-role test result** at the security layer.

## 2. What was NOT tested live, and why (honest limits)

- **Rendered UI screenshots (desktop/mobile)** and full end-to-end login as each
  role require the running app against a real Supabase (GoTrue auth) with seeded
  credentials. This environment has a local Postgres (used above) but no auth
  server and no test credentials, and preview URLs sit behind Vercel's preview
  protection for automated tools. These were not faked.
  - To produce them: resume Supabase, then either you open the preview (you pass
    Vercel auth) or grant a short browser session with a client test login and I
    capture dashboard/portal/calendar at desktop + 390px.
- **Suspended-account denial** is enforced in `src/lib/auth.ts` (app layer), not
  RLS, so it is covered in the manual smoke test rather than the SQL suite.

## 3. Account-action hardening (this phase)

- Suspend/reactivate now check the auth-layer ban result and **roll back the
  `profiles.status` change** if it fails — no half-suspended accounts.
- Invite surfaces a link-generation error in its message instead of silently
  returning no link.
- **Email edit implemented** (was promised, previously missing): editing a client
  account updates its sign-in email via the admin API. Gated to client accounts
  (staff sign in by username).
- Audit logging is best-effort (never blocks the action); verified writable +
  admin-only readable by the SQL suite.

## 4. Phase 5 vs the requested full redesign — candid gap review

Delivered (verified in code):
- **Mobile nav drawer** fixed (portal render, full-viewport, Escape/scroll-lock/focus).
- **Client portal home:** approvals queue, content-this-month card into the calendar, responsive stat grid.
- **Content calendar** (Phase 4): real client-scoped month grid + mobile agenda.
- **Hero** tamed across role homes.

Partial / not done (needs a rendered-screenshot loop to change safely):
- **Staff dashboard home** — duplicate overdue-alert dedupe and zero-KPI cleanup **not done** (only the hero was tamed).
- **Staff sidebar (20+ items)** simplification — **not done**.
- **Mobile client table → cards** on `/dashboard/clients` — **not done**.
- **Portal nav** richer mobile treatment — **not done** (still a tab strip, now with a Content tab).
- **Per-screen empty/loading/error pass** across all ~20 screens — **not done**.

Honest assessment: Phase 5 delivered the highest-impact client-facing surfaces
and the P0 mobile fix, but is **not** the full 20-screen redesign the audit
describes. The remainder is visual/layout work needing rendered iteration.

## 5. Verdict

Security + data-isolation work is **verified and safe to ship** via the
zero-outage runbook. The visual redesign is **partially** complete and should not
be described as finished. Recommend shipping Phases 1–4 + the Phase 5 portal
changes behind the runbook, and scheduling the remaining staff-dashboard redesign
as a follow-up with a screenshot review loop.
