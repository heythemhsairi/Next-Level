-- Next Level — lock down client-driven deliverable status changes.
--
-- The previous `deliverables_client_update` policy let a client UPDATE their
-- own visible deliverable with NO column restriction (RLS cannot limit which
-- columns change). A crafted request could therefore rewrite title, video_url,
-- client_visible, project_id, position, etc. — not just status. This migration
-- removes that broad policy and replaces it with a SECURITY DEFINER RPC that
-- only ever sets `status`, and only to an allowed client transition, on a row
-- the caller actually owns.

-- 1. Remove the over-broad client UPDATE policy. Clients no longer update
--    deliverables directly; they go through the RPC below.
drop policy if exists "deliverables_client_update" on public.deliverables;

-- 2. Controlled status transition for the owning client.
create or replace function public.client_set_deliverable_status(
  p_deliverable_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Only client-role users may call this.
  if not public.is_client() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  -- Only these two client-driven transitions are permitted.
  if p_status not in ('approved', 'revision_requested') then
    raise exception 'invalid status %', p_status using errcode = '22023';
  end if;

  -- The deliverable must be client-visible AND belong to the caller's client.
  update public.deliverables d
     set status = p_status::deliverable_status
   where d.id = p_deliverable_id
     and d.client_visible
     and exists (
       select 1 from public.projects p
       where p.id = d.project_id
         and p.client_id = public.my_client_id()
     );

  if not found then
    raise exception 'deliverable not found or not permitted'
      using errcode = '42501';
  end if;
end;
$$;

-- 3. Lock down execution. The function body enforces the client role itself;
--    we still restrict EXECUTE to authenticated users only.
revoke all on function public.client_set_deliverable_status(uuid, text) from public;
grant execute on function public.client_set_deliverable_status(uuid, text) to authenticated;
