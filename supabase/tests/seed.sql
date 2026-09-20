-- Multi-role seed: admin, staff (editor), client A, client B (isolated).
insert into auth.users(id, email) values
  ('00000000-0000-0000-0000-000000000001','admin@nextlevel.studio'),
  ('00000000-0000-0000-0000-000000000002','editor@nextlevel.studio'),
  ('00000000-0000-0000-0000-0000000000a1','a@clienta.com'),
  ('00000000-0000-0000-0000-0000000000b1','b@clientb.com');

insert into public.clients(id, name) values
  ('aaaaaaaa-0000-0000-0000-0000000000a0','Client A'),
  ('bbbbbbbb-0000-0000-0000-0000000000b0','Client B');

insert into public.profiles(id, username, full_name, role, client_id, status) values
  ('00000000-0000-0000-0000-000000000001','admin','Admin','admin',null,'active'),
  ('00000000-0000-0000-0000-000000000002','editor','Editor','editor',null,'active'),
  ('00000000-0000-0000-0000-0000000000a1','clienta','Client A User','client','aaaaaaaa-0000-0000-0000-0000000000a0','active'),
  ('00000000-0000-0000-0000-0000000000b1','clientb','Client B User','client','bbbbbbbb-0000-0000-0000-0000000000b0','active');

insert into public.projects(id, client_id, name) values
  ('aaaaaaaa-0000-0000-0000-0000000000a2','aaaaaaaa-0000-0000-0000-0000000000a0','Project A'),
  ('bbbbbbbb-0000-0000-0000-0000000000b2','bbbbbbbb-0000-0000-0000-0000000000b0','Project B');

insert into public.deliverables(id, project_id, title, status, client_visible) values
  ('dddddddd-0000-0000-0000-0000000000a1','aaaaaaaa-0000-0000-0000-0000000000a2','A in review','in_review',true),
  ('dddddddd-0000-0000-0000-0000000000a2','aaaaaaaa-0000-0000-0000-0000000000a2','A delivered','delivered',true),
  ('dddddddd-0000-0000-0000-0000000000b1','bbbbbbbb-0000-0000-0000-0000000000b2','B in review','in_review',true);

insert into public.social_posts(id, title, status, scheduled_at, platforms, project_id, client_visible, created_by) values
  ('55555555-0000-0000-0000-0000000000a1','A visible post','scheduled', now(), '{instagram}','aaaaaaaa-0000-0000-0000-0000000000a2', true,  '00000000-0000-0000-0000-000000000002'),
  ('55555555-0000-0000-0000-0000000000a0','A hidden post','draft',     now(), '{instagram}','aaaaaaaa-0000-0000-0000-0000000000a2', false, '00000000-0000-0000-0000-000000000002'),
  ('55555555-0000-0000-0000-0000000000b1','B visible post','scheduled', now(), '{facebook}', 'bbbbbbbb-0000-0000-0000-0000000000b2', true,  '00000000-0000-0000-0000-000000000002');
