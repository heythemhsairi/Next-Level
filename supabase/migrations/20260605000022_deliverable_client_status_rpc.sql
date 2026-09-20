-- Next Level — lock down client-driven deliverable status changes (step 1 of 2).
--
-- The `deliverables_client_update` policy (migration ...0020) lets a client
-- UPDATE their own visible deliverable with NO column restriction (RLS cannot
-- limit which columns change) — a crafted request could rewrite title,
-- video_url, client_visible, project_id, etc. This migration adds a locked-down
-- SECURITY DEFINER RPC that only ever sets `status`, only for a VALID client
-- transition (from in_review), on a row the caller owns.
--
-- IMPORTANT (zero-downtime): this migration deliberately does NOT drop the old
-- policy. It is backward-compatible — old code (direct .update) keeps working
-- via the existing policy, and new code works via the RPC. The insecure policy
-- is dropped only in the follow-up migration ...0025, which is applied AFTER
-- the new code is live. That ordering avoids an approval outage.

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

  -- Valid transition only: a client acts on a deliverable that is awaiting
  -- their review. The row must be client-visible AND belong to the caller's
  -- client AND currently be in_review.
  update public.deliverables d
     set status = p_status::deliverable_status
   where d.id = p_deliverable_id
     and d.client_visible
     and d.status = 'in_review'
     and exists (
       select 1 from public.projects p
       where p.id = d.project_id
         and p.client_id = public.my_client_id()
     );

  if not found then
    raise exception 'deliverable not found, not permitted, or not awaiting review'
      using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.client_set_deliverable_status(uuid, text) from public;
grant execute on function public.client_set_deliverable_status(uuid, text) to authenticated;
