-- Faithful minimal base = production schema state just BEFORE migration ...0022,
-- so the real migration files (0022–0025) can be applied on top and tested.

-- ---- auth shim (mimics Supabase auth.uid() reading the session's user) ----
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key, email text);
create or replace function auth.uid() returns uuid
  language sql stable as $$ select nullif(current_setting('app.uid', true), '')::uuid $$;

-- ---- role Supabase grants to (RLS applies to non-superusers) ----
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
grant usage on schema public to authenticated;

-- ---- enums ----
do $$ begin create type user_role as enum ('admin','editor','sales','client','worker','freelancer'); exception when duplicate_object then null; end $$;
do $$ begin create type deliverable_status as enum ('draft','in_review','approved','delivered','revision_requested'); exception when duplicate_object then null; end $$;
do $$ begin create type social_post_status as enum ('draft','scheduled','published','cancelled'); exception when duplicate_object then null; end $$;

-- ---- tables (pre-0022 shape) ----
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null, full_name text,
  role user_role not null default 'client', client_id uuid);
create table public.clients (id uuid primary key default gen_random_uuid(), name text not null);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade, name text not null);
create table public.deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null, status deliverable_status not null default 'draft',
  client_visible boolean not null default false);
create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null, content text not null default '',
  status social_post_status not null default 'draft', scheduled_at timestamptz,
  platforms text[] not null default '{}',
  project_id uuid references public.projects(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null);

-- ---- helper functions (intent from migration ...0019) ----
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public
  as $$ select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false) $$;
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path = public
  as $$ select coalesce((select role in ('admin','editor','sales','worker','freelancer') from public.profiles where id = auth.uid()), false) $$;
create or replace function public.is_client() returns boolean language sql stable security definer set search_path = public
  as $$ select coalesce((select role = 'client' from public.profiles where id = auth.uid()), false) $$;
create or replace function public.my_client_id() returns uuid language sql stable security definer set search_path = public
  as $$ select client_id from public.profiles where id = auth.uid() $$;

-- ---- baseline RLS (pre-0022) ----
alter table public.profiles enable row level security;
create policy profiles_self_or_staff on public.profiles for select using (auth.uid() = id or public.is_staff());
create policy profiles_admin_all on public.profiles for all using (public.is_admin()) with check (public.is_admin());

alter table public.deliverables enable row level security;
create policy deliverables_staff_all on public.deliverables for all using (public.is_staff()) with check (public.is_staff());
create policy deliverables_client_select on public.deliverables for select using (
  public.is_client() and client_visible and exists (
    select 1 from public.projects p where p.id = deliverables.project_id and p.client_id = public.my_client_id()));
-- The INSECURE policy migration ...0025 must drop:
create policy "deliverables_client_update" on public.deliverables for update using (
  public.is_client() and client_visible and exists (
    select 1 from public.projects p where p.id = deliverables.project_id and p.client_id = public.my_client_id()))
  with check (
  public.is_client() and client_visible and exists (
    select 1 from public.projects p where p.id = deliverables.project_id and p.client_id = public.my_client_id()));

alter table public.social_posts enable row level security;
create policy social_posts_staff_all on public.social_posts for all using (public.is_staff()) with check (public.is_staff());

grant select, insert, update, delete on all tables in schema public to authenticated;
