# Next Level Portal — redesign QA report

PR #1 was merged to `main` on 2026-09-20. Production deployment is Ready at `nextlevelportal.vercel.app`. Migrations 0022–0025 and the anonymous RPC grant fix are applied in the linked Supabase database.

## Verified in this continuation

- `npm run typecheck` and `npm run build` passed on the worktree.
- Signed into the local app with an existing admin account against the configured Supabase project. After applying the missing schema, the Accounts page rendered four actual accounts with role, status, last sign-in, and actions. The invite controls rendered. A recovery link was generated for the existing client account and logged in the audit table; no password was changed.
- At 390px, visually reviewed the dashboard and client cards. The mobile navigation drawer opened and closed with Escape. A read-only route sweep covered 18 staff routes; measured document width did not exceed viewport width.
- At 1440px and 2560px, the dashboard, clients, and accounts routes did not overflow horizontally.
- The linked database has `profiles.status`, `social_posts.client_visible`, `account_audit_events`, and `client_set_deliverable_status`; read-only SQL verification confirmed each. The broad deliverable update policy is now gone. The client recovery link reached the new password form, and the client calendar rendered under the verified client session. The existing client's password was left unchanged.
- On the production domain, the admin signed in and Accounts rendered all four logins, their statuses and actions, and reset audit entries. A client set-password link was generated with the correct production origin. Supabase advisor follow-up confirmed the approval RPC no longer grants EXECUTE to anonymous callers.
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

The core portal is live. A real client approve/revision transition still needs a dedicated test deliverable; none were `in_review` during this release. The linked database has no recorded migration history, so do not run a broad `supabase db push` until it is reconciled. Do not describe account mutations or password submission as fully tested based on the checks above.
