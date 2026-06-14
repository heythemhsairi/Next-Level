-- Next Level — client review & approval loop for deliverables.
--
-- Adds a feedback thread on deliverables (mirrors task_comments) and lets a
-- client approve / request revision on their own visible deliverables by
-- updating the status. Idempotent and safe to re-run.

-- =========================================================================
-- 1. Feedback thread (staff + the owning client can post)
-- =========================================================================
create table if not exists public.deliverable_feedback (
  id             uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null references public.deliverables(id) on delete cascade,
  author_id      uuid references public.profiles(id) on delete set null,
  body           text not null,
  created_at     timestamptz not null default now()
);
create index if not exists deliverable_feedback_deliverable_idx
  on public.deliverable_feedback(deliverable_id);

alter table public.deliverable_feedback enable row level security;

-- Staff: full access to every thread.
drop policy if exists "deliverable_feedback_staff_all" on public.deliverable_feedback;
create policy "deliverable_feedback_staff_all" on public.deliverable_feedback
  for all using (public.is_staff()) with check (public.is_staff());

-- Client: read + post only on their own visible deliverables.
drop policy if exists "deliverable_feedback_client_select" on public.deliverable_feedback;
create policy "deliverable_feedback_client_select" on public.deliverable_feedback
  for select using (
    public.is_client()
    and exists (
      select 1
      from public.deliverables d
      join public.projects p on p.id = d.project_id
      where d.id = deliverable_feedback.deliverable_id
        and d.client_visible
        and p.client_id = public.my_client_id()
    )
  );

drop policy if exists "deliverable_feedback_client_insert" on public.deliverable_feedback;
create policy "deliverable_feedback_client_insert" on public.deliverable_feedback
  for insert with check (
    public.is_client()
    and author_id = auth.uid()
    and exists (
      select 1
      from public.deliverables d
      join public.projects p on p.id = d.project_id
      where d.id = deliverable_feedback.deliverable_id
        and d.client_visible
        and p.client_id = public.my_client_id()
    )
  );

-- =========================================================================
-- 2. Let a client UPDATE their own visible deliverable (for approve /
--    request-revision). RLS can't restrict WHICH columns change, so the app
--    only ever sets status to 'approved' or 'revision_requested'. The row
--    must still belong to the client both before (USING) and after (CHECK).
-- =========================================================================
drop policy if exists "deliverables_client_update" on public.deliverables;
create policy "deliverables_client_update" on public.deliverables
  for update
  using (
    public.is_client() and client_visible
    and exists (
      select 1 from public.projects p
      where p.id = deliverables.project_id and p.client_id = public.my_client_id()
    )
  )
  with check (
    public.is_client() and client_visible
    and exists (
      select 1 from public.projects p
      where p.id = deliverables.project_id and p.client_id = public.my_client_id()
    )
  );
