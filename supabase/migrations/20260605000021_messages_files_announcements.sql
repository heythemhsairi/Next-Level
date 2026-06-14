-- Next Level — new sections: messages, files, announcements.
-- Idempotent and safe to re-run.

-- =========================================================================
-- 1. Messages — a simple thread per client between the team and the client.
-- =========================================================================
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  author_id   uuid references public.profiles(id) on delete set null,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists messages_client_idx on public.messages(client_id, created_at);

alter table public.messages enable row level security;

-- Staff: full access to every client thread.
drop policy if exists "messages_staff_all" on public.messages;
create policy "messages_staff_all" on public.messages
  for all using (public.is_staff()) with check (public.is_staff());

-- Client: read + post only on their own thread.
drop policy if exists "messages_client_select" on public.messages;
create policy "messages_client_select" on public.messages
  for select using (public.is_client() and client_id = public.my_client_id());

drop policy if exists "messages_client_insert" on public.messages;
create policy "messages_client_insert" on public.messages
  for insert with check (
    public.is_client()
    and author_id = auth.uid()
    and client_id = public.my_client_id()
  );

-- =========================================================================
-- 2. Files / assets — shared files (links) per client / project.
-- =========================================================================
create table if not exists public.assets (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid references public.clients(id) on delete cascade,
  project_id     uuid references public.projects(id) on delete set null,
  name           text not null,
  url            text not null,
  kind           text,
  client_visible boolean not null default true,
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists assets_client_idx on public.assets(client_id);
create index if not exists assets_project_idx on public.assets(project_id);

alter table public.assets enable row level security;

drop policy if exists "assets_staff_all" on public.assets;
create policy "assets_staff_all" on public.assets
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "assets_client_select" on public.assets;
create policy "assets_client_select" on public.assets
  for select using (
    public.is_client()
    and client_visible
    and client_id = public.my_client_id()
  );

-- =========================================================================
-- 3. Announcements — team posts; optionally targeted to one client or global.
-- =========================================================================
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  client_id   uuid references public.clients(id) on delete cascade, -- null = all clients
  audience    text not null default 'all', -- 'all' | 'clients' | 'team'
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists announcements_client_idx on public.announcements(client_id);
create index if not exists announcements_created_idx on public.announcements(created_at);

alter table public.announcements enable row level security;

drop policy if exists "announcements_staff_all" on public.announcements;
create policy "announcements_staff_all" on public.announcements
  for all using (public.is_staff()) with check (public.is_staff());

-- Clients see announcements aimed at clients/all that are either global
-- (client_id is null) or addressed to their own client record.
drop policy if exists "announcements_client_select" on public.announcements;
create policy "announcements_client_select" on public.announcements
  for select using (
    public.is_client()
    and audience in ('all', 'clients')
    and (client_id is null or client_id = public.my_client_id())
  );
