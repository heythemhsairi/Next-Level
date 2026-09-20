-- Next Level — client-scoped content calendar.
--
-- Exposes selected social_posts to the owning client (read-only) so the portal
-- can show a real content calendar. Staff choose which posts are client-visible;
-- clients only ever see posts flagged visible on a project that belongs to them.
-- Staff task deadlines (tasks table / dashboard calendar) stay separate.

alter table public.social_posts
  add column if not exists client_visible boolean not null default false;

create index if not exists social_posts_client_visible_idx
  on public.social_posts(client_visible);

-- Client read: only client-visible posts whose project belongs to the client.
-- Internal posts (no project, or client_visible = false) are never exposed.
drop policy if exists "social_posts_client_select" on public.social_posts;
create policy "social_posts_client_select" on public.social_posts
  for select using (
    public.is_client()
    and client_visible
    and project_id is not null
    and exists (
      select 1 from public.projects p
      where p.id = social_posts.project_id
        and p.client_id = public.my_client_id()
    )
  );
