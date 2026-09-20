# Next Level Portal — redesign QA report

Branch: `codex/portal-redesign-complete`, based on `redesign/phase-6-hardening`.
The application code is still on the review branch. The linked Supabase database received additive migrations 0022–0024 on 2026-09-20; migration 0025 remains unapplied.

## Verified in this continuation

- `npm run typecheck` and `npm run build` passed on the worktree.
- Signed into the local app with an existing admin account against the configured Supabase project. After applying the missing schema, the Accounts page rendered four actual accounts with role, status, last sign-in, and actions. The invite controls rendered. A recovery link was generated for the existing client account and logged in the audit table; no password was changed.
- At 390px, visually reviewed the dashboard and client cards. The mobile navigation drawer opened and closed with Escape. A read-only route sweep covered 18 staff routes; measured document width did not exceed viewport width.
- At 1440px and 2560px, the dashboard, clients, and accounts routes did not overflow horizontally.
- The linked database now has `profiles.status`, `social_posts.client_visible`, `account_audit_events`, and `client_set_deliverable_status`; read-only SQL verification confirmed each. The older deliverable update policy remains until the new code is live and client approval is smoke-tested. The client recovery link reached the new password form, and the client calendar rendered under the verified client session. The existing client's password was left unchanged.
- Dashboard: removed the duplicate overdue summary; hid empty momentum tiles; made the welcome and sidebar calmer; ensured animated counts show their real value in background tabs. Client, task, project, and deliverable lists now have mobile cards; lead stages with no records collapse on mobile. Finance and analytics no longer lead with repeated zero-value tiles. Portal home and navigation were made more compact, and the content calendar uses only the weeks needed for a month. Added portal loading and error states.
- Account actions: auth ban/unban failures check and attempt profile rollback; email edit updates auth email and attempts rollback if profile edit fails; audit failures are surfaced to the admin. Account data query errors are no longer presented as zero accounts.

## Existing security test evidence

The prior Phase 6 commit includes a seeded Postgres harness and its recorded **16/16 passing** result in `supabase/tests/rls_test_results.txt`. It covers client isolation, deliverable status RPC guards, removal of the broad client update policy, and admin-only account audit reads. This continuation did **not** rerun the SQL harness because `psql`/Postgres and Docker are not available on this machine.

## Still unverified

- A complete client password submission and fresh email/password login were not tested because that would change an existing client's credential. The recovery token was verified up to the password form.
- Account invite, email edit, suspend/reactivate, and client approve/revision still need safe dedicated test accounts or a controlled production smoke test. Audit writes were verified through the reset-access action.
- The full screen-by-screen redesign of every staff detail/form page is outside this branch's visual changes. The read-only route sweep checks navigation and horizontal overflow; it does not prove all form flows or empty states.
- The desktop browser checks measured layout widths, but saved screenshot artifacts were not produced. Local browser screenshots were visually inspected at 390px.

## Release gate

Before final release, deploy the branch, verify a client approve/revision action uses the RPC, then apply migration 0025. The linked database has no recorded migration history; do not run a broad `supabase db push`. Do not describe account mutations or password submission as fully tested based on the checks above.
