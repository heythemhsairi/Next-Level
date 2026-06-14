-- Next Level — pivot, step 2 of 2: schema additions, helper functions, RLS.
--
-- Turns the internal agency tool into a two-sided platform:
--   • clients log into a portal (see their tasks, invoices, delivered videos)
--   • a sales team manages their clients, leads, and payments
--   • editors (video editors) manage tasks + deliverables
-- Idempotent and safe to re-run.

-- =========================================================================
-- 1. Link a client-role profile to its clients row (supports 1..n logins)
-- =========================================================================
alter table public.profiles
  add column if not exists client_id uuid references public.clients(id) on delete set null;
create index if not exists profiles_client_idx on public.profiles(client_id);

-- =========================================================================
-- 2. Sales ownership on clients (which sales rep owns the client)
-- =========================================================================
alter table public.clients
  add column if not exists owner_id uuid references public.profiles(id) on delete set null;
create index if not exists clients_owner_idx on public.clients(owner_id);

-- =========================================================================
-- 3. Deliverables — videos a client can see, many per project
-- =========================================================================
do $$ begin
  create type deliverable_status as enum
    ('draft','in_review','approved','delivered','revision_requested');
exception when duplicate_object then null; end $$;

create table if not exists public.deliverables (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects(id) on delete cascade,
  title          text not null,
  video_url      text,
  thumbnail_url  text,
  status         deliverable_status not null default 'draft',
  client_visible boolean not null default false,
  delivered_at   timestamptz,
  position       integer not null default 0,
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists deliverables_project_idx on public.deliverables(project_id);
create index if not exists deliverables_status_idx on public.deliverables(status);

drop trigger if exists trg_deliverables_updated on public.deliverables;
create trigger trg_deliverables_updated before update on public.deliverables
  for each row execute function public.set_updated_at();

-- =========================================================================
-- 4. Leads — the sales pipeline
-- =========================================================================
do $$ begin
  create type lead_status as enum ('new','contacted','qualified','won','lost');
exception when duplicate_object then null; end $$;

create table if not exists public.leads (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  contact_email       text,
  contact_phone       text,
  source              text,
  status              lead_status not null default 'new',
  value_estimate_dt   numeric(10,2),
  notes               text,
  owner_id            uuid references public.profiles(id) on delete set null,
  converted_client_id uuid references public.clients(id) on delete set null,
  created_by          uuid references public.profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists leads_owner_idx on public.leads(owner_id);
create index if not exists leads_status_idx on public.leads(status);

drop trigger if exists trg_leads_updated on public.leads;
create trigger trg_leads_updated before update on public.leads
  for each row execute function public.set_updated_at();

-- =========================================================================
-- 5. Helper functions (security definer → no RLS recursion on profiles).
--    Legacy 'worker'/'freelancer' are treated as 'editor'/staff.
-- =========================================================================
create or replace function public.current_role()
returns user_role language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false) $$;

create or replace function public.is_editor()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select role in ('editor','worker','freelancer') from public.profiles where id = auth.uid()), false) $$;

create or replace function public.is_sales()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select role = 'sales' from public.profiles where id = auth.uid()), false) $$;

create or replace function public.is_client()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select role = 'client' from public.profiles where id = auth.uid()), false) $$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select role in ('admin','editor','sales','worker','freelancer') from public.profiles where id = auth.uid()), false) $$;

-- Backwards-compat shim: existing code/policies importing this keep working.
create or replace function public.is_worker_or_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select role in ('admin','editor','sales','worker','freelancer') from public.profiles where id = auth.uid()), false) $$;

-- The clients row linked to the current auth user (for portal RLS).
create or replace function public.my_client_id()
returns uuid language sql stable security definer set search_path = public
as $$ select client_id from public.profiles where id = auth.uid() $$;

-- =========================================================================
-- 6. profiles — staff can read all; clients read only themselves
-- =========================================================================
drop policy if exists "profiles_select_self_or_team" on public.profiles;
create policy "profiles_select_self_or_team" on public.profiles
  for select using (auth.uid() = id or public.is_staff());

-- =========================================================================
-- 7. deliverables RLS
-- =========================================================================
alter table public.deliverables enable row level security;

drop policy if exists "deliverables_staff_all" on public.deliverables;
create policy "deliverables_staff_all" on public.deliverables
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "deliverables_client_select" on public.deliverables;
create policy "deliverables_client_select" on public.deliverables
  for select using (
    public.is_client() and client_visible
    and exists (
      select 1 from public.projects p
      where p.id = deliverables.project_id and p.client_id = public.my_client_id()
    )
  );

-- =========================================================================
-- 8. leads RLS — admin all, sales own
-- =========================================================================
alter table public.leads enable row level security;

drop policy if exists "leads_admin_all" on public.leads;
create policy "leads_admin_all" on public.leads
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "leads_sales_own" on public.leads;
create policy "leads_sales_own" on public.leads
  for all using (public.is_sales() and owner_id = auth.uid())
  with check (public.is_sales() and owner_id = auth.uid());

-- =========================================================================
-- 9. clients RLS — drop legacy worker/freelancer; add editor/sales/client
-- =========================================================================
drop policy if exists "clients_worker_select" on public.clients;
drop policy if exists "clients_freelancer_select_via_tasks" on public.clients;

drop policy if exists "clients_editor_select" on public.clients;
create policy "clients_editor_select" on public.clients
  for select using (public.is_editor());

drop policy if exists "clients_sales_owned" on public.clients;
create policy "clients_sales_owned" on public.clients
  for all using (public.is_sales() and owner_id = auth.uid())
  with check (public.is_sales());

drop policy if exists "clients_client_self" on public.clients;
create policy "clients_client_self" on public.clients
  for select using (public.is_client() and id = public.my_client_id());

-- =========================================================================
-- 10. projects RLS — staff RW; client read own
-- =========================================================================
drop policy if exists "projects_worker_rw" on public.projects;
drop policy if exists "projects_freelancer_select_via_tasks" on public.projects;

drop policy if exists "projects_staff_rw" on public.projects;
create policy "projects_staff_rw" on public.projects
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "projects_client_select" on public.projects;
create policy "projects_client_select" on public.projects
  for select using (public.is_client() and client_id = public.my_client_id());

-- =========================================================================
-- 11. tasks RLS — editor/sales RW; client read own. (Legacy freelancer
--     select/update policies from migration 15 remain valid.)
-- =========================================================================
drop policy if exists "tasks_worker_rw" on public.tasks;

drop policy if exists "tasks_editor_rw" on public.tasks;
create policy "tasks_editor_rw" on public.tasks
  for all using (public.is_editor() or public.is_sales())
  with check (public.is_editor() or public.is_sales());

drop policy if exists "tasks_client_select" on public.tasks;
create policy "tasks_client_select" on public.tasks
  for select using (
    public.is_client()
    and exists (
      select 1 from public.projects p
      where p.id = tasks.project_id and p.client_id = public.my_client_id()
    )
  );

-- =========================================================================
-- 12. devis / devis_items / payments — keep admin all; add sales manage +
--     client read-only on their own invoices.
-- =========================================================================
drop policy if exists "devis_sales_all" on public.devis;
create policy "devis_sales_all" on public.devis
  for all using (public.is_sales()) with check (public.is_sales());

drop policy if exists "devis_client_select" on public.devis;
create policy "devis_client_select" on public.devis
  for select using (public.is_client() and client_id = public.my_client_id());

drop policy if exists "devis_items_sales_all" on public.devis_items;
create policy "devis_items_sales_all" on public.devis_items
  for all using (public.is_sales()) with check (public.is_sales());

drop policy if exists "devis_items_client_select" on public.devis_items;
create policy "devis_items_client_select" on public.devis_items
  for select using (
    public.is_client()
    and exists (
      select 1 from public.devis d
      where d.id = devis_items.devis_id and d.client_id = public.my_client_id()
    )
  );

drop policy if exists "payments_sales_all" on public.payments;
create policy "payments_sales_all" on public.payments
  for all using (public.is_sales()) with check (public.is_sales());

drop policy if exists "payments_client_select" on public.payments;
create policy "payments_client_select" on public.payments
  for select using (
    public.is_client()
    and exists (
      select 1 from public.devis d
      where d.id = payments.devis_id and d.client_id = public.my_client_id()
    )
  );

-- =========================================================================
-- 13. Fix migration-15 assignee write policies (they excluded editors)
-- =========================================================================
drop policy if exists "task_assignees_write" on public.task_assignees;
create policy "task_assignees_write" on public.task_assignees
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "project_assignees_write" on public.project_assignees;
create policy "project_assignees_write" on public.project_assignees
  for all using (public.is_staff()) with check (public.is_staff());

-- Tag catalog: let all staff (incl. editors/sales) manage tags.
drop policy if exists "tag_catalog_write" on public.task_tag_catalog;
create policy "tag_catalog_write" on public.task_tag_catalog
  for all using (public.is_staff()) with check (public.is_staff());

-- =========================================================================
-- 14. Normalize legacy roles → editor (safe: 'editor' committed in step 1)
-- =========================================================================
update public.profiles set role = 'editor' where role in ('worker','freelancer');
