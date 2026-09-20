# Next Level Portal — redesign QA report

Branch: `codex/portal-redesign-complete`, based on `redesign/phase-6-hardening`.
Production has not been changed.

## Verified in this continuation

- `npm run typecheck` and `npm run build` passed on the worktree.
- Signed into the local app with an existing admin account against the configured Supabase project. The dashboard, client list, and account setup state rendered. No production record was created or changed during this UI review.
- At 390px, visually reviewed the dashboard and client cards. The mobile navigation drawer opened and closed with Escape. A read-only route sweep covered 18 staff routes; measured document width did not exceed viewport width.
- At 1440px and 2560px, the dashboard, clients, and accounts routes did not overflow horizontally.
- The shared preview database does not yet have `profiles.status` or `social_posts.client_visible`. The auth guard now permits a legacy-profile lookup **only in development or Vercel preview** so existing accounts can be used for visual review. Production remains fail-closed. Accounts and social content routes show an honest setup state instead of a false empty list until migrations are applied.
- Dashboard: removed the duplicate overdue summary; hid empty momentum tiles; made the welcome and sidebar calmer; ensured animated counts show their real value in background tabs. Client list now has mobile cards. Portal home and navigation were made more compact, and the content calendar uses only the weeks needed for a month. Added portal loading and error states.
- Account actions: auth ban/unban failures check and attempt profile rollback; email edit updates auth email and attempts rollback if profile edit fails; audit failures are surfaced to the admin. Account data query errors are no longer presented as zero accounts.

## Existing security test evidence

The prior Phase 6 commit includes a seeded Postgres harness and its recorded **16/16 passing** result in `supabase/tests/rls_test_results.txt`. It covers client isolation, deliverable status RPC guards, removal of the broad client update policy, and admin-only account audit reads. This continuation did **not** rerun the SQL harness because `psql`/Postgres and Docker are not available on this machine.

## Still unverified

- Client-role rendered flows, including the content calendar, require a client test login and migrations 0022–0024. We did not create a test account or change the shared database.
- Account invite, email edit, suspend/reactivate, and audit writes require migration 0023 and safe test accounts. Code was typechecked but these mutations were not exercised against production.
- The full screen-by-screen redesign of every staff detail/form page is outside this branch's visual changes. The read-only route sweep checks navigation and horizontal overflow; it does not prove all form flows or empty states.
- The desktop browser checks measured layout widths, but saved screenshot artifacts were not produced. Local browser screenshots were visually inspected at 390px.

## Release gate

Keep this branch in preview until the database migrations are applied in the sequence in `docs/DEPLOYMENT_RUNBOOK.md`, client and account flows are tested in a staging environment, and a final desktop/mobile review is accepted. Do not describe the application as fully tested or deployed based on a successful build alone.
