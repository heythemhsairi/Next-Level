#!/usr/bin/env bash
# Local RLS/RPC test suite. Requires a local Postgres and psql.
#   PGHOST/PGPORT/PGUSER default to a trust-auth local cluster.
# Run from the repo root:  bash supabase/tests/run_tests.sh
set -u
HOST=${PGHOST:-/tmp}; PORT=${PGPORT:-5433}; USER=${PGUSER:-postgres}
PSQL="psql -h $HOST -p $PORT -U $USER -d nl_test -v ON_ERROR_STOP=1 -qtA"
DIR="$(cd "$(dirname "$0")" && pwd)"; M="$DIR/../migrations"
UA=00000000-0000-0000-0000-0000000000a1; UB=00000000-0000-0000-0000-0000000000b1
ADMIN=00000000-0000-0000-0000-000000000001; EDITOR=00000000-0000-0000-0000-000000000002
DA1=dddddddd-0000-0000-0000-0000000000a1; DA2=dddddddd-0000-0000-0000-0000000000a2

echo "### Rebuilding test schema ..."
psql -h $HOST -p $PORT -U $USER -qc "drop database if exists nl_test;" >/dev/null
psql -h $HOST -p $PORT -U $USER -qc "create database nl_test;" >/dev/null
$PSQL -f "$DIR/harness.sql" >/dev/null
echo "### Applying real migration files 0022, 0023, 0024, 0025 ..."
for f in 20260605000022_deliverable_client_status_rpc 20260605000023_portal_accounts \
         20260605000024_social_posts_client_calendar 20260605000025_drop_legacy_deliverable_update; do
  $PSQL -f "$M/$f.sql" >/dev/null && echo "  applied $f" || { echo "  FAILED $f"; exit 1; }
done
$PSQL -c "grant select,insert,update,delete on all tables in schema public to authenticated;" >/dev/null
$PSQL -f "$DIR/seed.sql" >/dev/null
echo ""
pass=0; fail=0
check(){ if [ "$2" = "$3" ]; then echo "  PASS  $1"; pass=$((pass+1)); else echo "  FAIL  $1 (got '$3' want '$2')"; fail=$((fail+1)); fi; }
q(){ $PSQL -c "$1"; }
qa(){ $PSQL -c "set role authenticated; set app.uid='$1'; $2"; }

echo "### Cross-client isolation (social_posts RLS)"
check "client A sees only own visible posts (1)" 1 "$(qa $UA "select count(*) from social_posts;")"
check "client A cannot see client B's post"      0 "$(qa $UA "select count(*) from social_posts where project_id='bbbbbbbb-0000-0000-0000-0000000000b2';")"
check "client A cannot see hidden post"          0 "$(qa $UA "select count(*) from social_posts where client_visible=false;")"
check "client B sees only own visible posts (1)" 1 "$(qa $UB "select count(*) from social_posts;")"
check "staff (editor) sees all posts (3)"        3 "$(qa $EDITOR "select count(*) from social_posts;")"
echo ""
echo "### Deliverable status RPC (valid transition + guards)"
qa $UA "select client_set_deliverable_status('$DA1','approved');" >/dev/null 2>&1
check "valid in_review->approved applied" approved "$(q "select status from deliverables where id='$DA1';")"
err=$(qa $UA "select client_set_deliverable_status('$DA2','draft');" 2>&1 >/dev/null; echo $?)
check "invalid status value rejected" 0 "$([ "$err" != 0 ] && echo 0 || echo 1)"
err=$(qa $UA "select client_set_deliverable_status('$DA2','revision_requested');" 2>&1 >/dev/null; echo $?)
check "non in_review row rejected (from-state guard)" 0 "$([ "$err" != 0 ] && echo 0 || echo 1)"
check "delivered row unchanged after guard" delivered "$(q "select status from deliverables where id='$DA2';")"
err=$(qa $UB "select client_set_deliverable_status('$DA1','revision_requested');" 2>&1 >/dev/null; echo $?)
check "cross-client RPC call rejected" 0 "$([ "$err" != 0 ] && echo 0 || echo 1)"
echo ""
echo "### Insecure legacy policy removed (migration 0025)"
check "deliverables_client_update policy is gone" 0 "$(q "select count(*) from pg_policies where tablename='deliverables' and policyname='deliverables_client_update';")"
qa $UA "update deliverables set title='HACKED', client_visible=false where id='$DA1';" >/dev/null 2>&1
check "raw client UPDATE no longer mutates row" "A in review" "$(q "select title from deliverables where id='$DA1';")"
echo ""
echo "### Audit table access (admin-only RLS)"
q "insert into account_audit_events(actor_id,target_user_id,action) values ('$ADMIN','$UA','suspend');" >/dev/null
check "admin can read audit events (>=1)" 1 "$(qa $ADMIN "select case when count(*)>=1 then 1 else 0 end from account_audit_events;")"
check "client CANNOT read audit events (0)" 0 "$(qa $UA "select count(*) from account_audit_events;")"
check "staff (editor) CANNOT read audit events (0)" 0 "$(qa $EDITOR "select count(*) from account_audit_events;")"
echo ""
echo "### profiles.status column present (migration 0023)"
check "profiles.status exists" 1 "$(q "select count(*) from information_schema.columns where table_name='profiles' and column_name='status';")"
echo ""
echo "======================================================"
echo "  RESULT: $pass passed, $fail failed"
echo "======================================================"
[ "$fail" = 0 ]
