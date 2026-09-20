-- Next Level — Portal Accounts: account lifecycle + audit trail.
--
-- Adds an account `status` (active/suspended) to profiles and an admin-only
-- audit log of account actions (invite, suspend, reactivate, reset, edit).
-- Account mutations run through the service role in server actions guarded by
-- requireAdmin(); this migration just provides the columns, table, and reads.

-- 1. Account status on profiles. Suspended accounts are denied at the app's
--    fail-closed session guard (see src/lib/auth.ts).
alter table public.profiles
  add column if not exists status text not null default 'active';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_status_check
      check (status in ('active', 'suspended'));
  end if;
end $$;

-- 2. Audit log of account-management actions.
create table if not exists public.account_audit_events (
  id             uuid primary key default gen_random_uuid(),
  actor_id       uuid references public.profiles(id) on delete set null,
  target_user_id uuid,
  action         text not null,
  detail         jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists account_audit_events_created_idx
  on public.account_audit_events(created_at desc);
create index if not exists account_audit_events_target_idx
  on public.account_audit_events(target_user_id);

alter table public.account_audit_events enable row level security;

-- Only admins may read the audit log. Writes go through the service role
-- (which bypasses RLS), so no insert policy is granted to authenticated users.
drop policy if exists "account_audit_admin_select" on public.account_audit_events;
create policy "account_audit_admin_select" on public.account_audit_events
  for select using (public.is_admin());
