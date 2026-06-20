-- =========================================================================
-- Next Level — DEMO DATA (for testing the command-center homes).
--
-- Populates clients, projects, tasks, deliverables, leads, quotes/invoices,
-- payments, and recent task activity so the admin/sales/editor momentum tiles
-- and pipeline show real numbers instead of zeros.
--
-- Safe + idempotent: every row is tagged with notes/title prefix 'DEMO' and
-- the script deletes prior DEMO rows before re-inserting. To remove all demo
-- data, run the DELETE block at the top on its own.
--
-- Run:  via Supabase SQL editor, or
--       SUPABASE_PAT=... SUPABASE_PROJECT_REF=... node scripts/apply-seed.mjs
-- =========================================================================

-- ---- Clean up any prior demo rows (children first) ----------------------
delete from public.payments      where devis_id in (select id from public.devis where object like 'DEMO%');
delete from public.devis_items   where devis_id in (select id from public.devis where object like 'DEMO%');
delete from public.devis         where object like 'DEMO%';
delete from public.task_activity where task_id in (select id from public.tasks where title like 'DEMO%');
delete from public.deliverables  where title like 'DEMO%';
delete from public.tasks         where title like 'DEMO%';
delete from public.projects      where name like 'DEMO%';
delete from public.leads         where name like 'DEMO%';
delete from public.clients       where name like 'DEMO%';

do $$
declare
  v_admin  uuid;
  v_client uuid;
  v_proj   uuid;
  v_task1  uuid;
  v_task2  uuid;
  v_task3  uuid;
  v_devis1 uuid;
  v_devis2 uuid;
  v_fact1  uuid;
begin
  -- Attribute demo activity to the first admin (falls back to any profile).
  select id into v_admin from public.profiles where role = 'admin' order by created_at limit 1;
  if v_admin is null then
    select id into v_admin from public.profiles order by created_at limit 1;
  end if;

  -- ---- Client + project --------------------------------------------------
  insert into public.clients (name, email, phone, notes, created_by, owner_id)
  values ('DEMO · Atlas Media', 'hello@atlasmedia.test', '+216 20 000 000', 'DEMO seed', v_admin, v_admin)
  returning id into v_client;

  insert into public.projects (client_id, name, description, status, owner_id, start_date)
  values (v_client, 'DEMO · Q2 Brand Films', 'Demo project', 'active', v_admin, current_date - 30)
  returning id into v_proj;

  -- ---- Tasks (one done this week → fuels "tasks shipped" + team energy) ---
  insert into public.tasks (project_id, title, status, priority, assignee_id, created_by, deadline)
  values (v_proj, 'DEMO · Edit hero film', 'in_progress', 'high', v_admin, v_admin, current_date + 2)
  returning id into v_task1;

  insert into public.tasks (project_id, title, status, priority, assignee_id, created_by, deadline)
  values (v_proj, 'DEMO · Color grade reel', 'review', 'normal', v_admin, v_admin, current_date + 5)
  returning id into v_task2;

  insert into public.tasks (project_id, title, status, priority, assignee_id, created_by, deadline)
  values (v_proj, 'DEMO · Deliver teaser', 'done', 'high', v_admin, v_admin, current_date - 1)
  returning id into v_task3;

  -- Recent "moved to done" activity (this week) for momentum + team energy.
  insert into public.task_activity (task_id, actor_id, action, meta, created_at)
  values
    (v_task3, v_admin, 'status_changed', '{"from":"review","to":"done"}'::jsonb, now() - interval '1 day'),
    (v_task3, v_admin, 'status_changed', '{"from":"in_progress","to":"review"}'::jsonb, now() - interval '2 days'),
    (v_task1, v_admin, 'status_changed', '{"from":"todo","to":"in_progress"}'::jsonb, now() - interval '3 days');

  -- ---- Deliverables (delivered this week → delivery streak + count) -------
  insert into public.deliverables (project_id, title, status, client_visible, delivered_at, created_by)
  values
    (v_proj, 'DEMO · Hero Film v1', 'delivered', true, now() - interval '1 day', v_admin),
    (v_proj, 'DEMO · Teaser 15s',  'delivered', true, now() - interval '2 days', v_admin),
    (v_proj, 'DEMO · Social cutdown', 'approved', true, now() - interval '4 days', v_admin),
    (v_proj, 'DEMO · Behind the scenes', 'in_review', true, null, v_admin);

  -- ---- Leads (pipeline: won/qualified/contacted/new) ---------------------
  insert into public.leads (name, contact_email, status, value_estimate_dt, owner_id, created_by)
  values
    ('DEMO · Northwind Co',  'lead1@nw.test',    'won',       4200, v_admin, v_admin),
    ('DEMO · Beacon Labs',   'lead2@beacon.test','won',       2800, v_admin, v_admin),
    ('DEMO · Vertex Group',  'lead3@vertex.test','qualified', 6000, v_admin, v_admin),
    ('DEMO · Pine & Co',     'lead4@pine.test',  'contacted', 1500, v_admin, v_admin),
    ('DEMO · Harbor Studio', 'lead5@harbor.test','new',       3200, v_admin, v_admin),
    ('DEMO · Lost Cause',    'lead6@lost.test',  'lost',       900, v_admin, v_admin);

  -- ---- Quotes (devis) + invoices (factures) ------------------------------
  -- Accepted quote (recent) → feeds devis-accept streak.
  insert into public.devis (kind, client_id, object, status, payment_status, total_dt, date, created_by)
  values ('devis', v_client, 'DEMO · Brand film package', 'accepted', 'unpaid', 3500, current_date - 3, v_admin)
  returning id into v_devis1;

  insert into public.devis (kind, client_id, object, status, payment_status, total_dt, date, created_by)
  values ('devis', v_client, 'DEMO · Social retainer', 'accepted', 'unpaid', 1800, current_date - 6, v_admin)
  returning id into v_devis2;

  -- A facture sent 10 days ago, still unpaid → follow-ups + overdue invoices.
  insert into public.devis (kind, client_id, object, status, payment_status, total_dt, date, due_date, created_by)
  values ('facture', v_client, 'DEMO · Invoice #1', 'sent', 'unpaid', 2400, current_date - 10, current_date - 3, v_admin)
  returning id into v_fact1;

  -- A paid facture this month → collection rate + collected MTD.
  insert into public.devis (kind, client_id, object, status, payment_status, total_dt, date, created_by)
  values ('facture', v_client, 'DEMO · Invoice #2 (paid)', 'accepted', 'paid', 3500, current_date - 8, v_admin);

  -- ---- Payments (this month + last month for the trend) ------------------
  insert into public.payments (devis_id, amount_dt, paid_at)
  values
    (v_devis1, 3500, current_date - 2),                          -- this month
    (v_devis2, 1800, date_trunc('month', current_date)::date),  -- this month
    (v_fact1,  1200, (date_trunc('month', current_date) - interval '20 days')::date); -- last month

  raise notice 'DEMO data seeded for client %, project %', v_client, v_proj;
end $$;
