-- Next Level — lock down client-driven deliverable status changes (step 2 of 2).
--
-- Apply this ONLY AFTER the new code (which uses client_set_deliverable_status)
-- is live in production. It removes the over-broad client UPDATE policy, leaving
-- the SECURITY DEFINER RPC as the single, column-safe path for client status
-- changes. Running it before the new code is deployed would break client
-- approve / request-revision for the old code; running it after causes no outage.
--
-- Rollback note: NEVER re-create deliverables_client_update — that is the
-- insecure policy this change removes. If a rollback is needed, keep the RPC in
-- place; do not reintroduce the broad policy. See docs/DEPLOYMENT_RUNBOOK.md.

drop policy if exists "deliverables_client_update" on public.deliverables;
