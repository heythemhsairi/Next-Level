-- Next Level Studio — Bootstrap admin user
--
-- Run this ONCE after creating your first user in Supabase Auth UI.
--
-- Steps:
--   1. In Supabase dashboard → Authentication → Users → Add user
--      Email: yourusername@nextlevel.studio
--      Password: (set one)
--      ✅ Auto Confirm User
--   2. Copy the new user's UUID (User ID column)
--   3. Replace the placeholders below and run this in the SQL editor.
--
-- After this runs, sign in with username "yourusername" + that password.
--
-- Team roles: 'admin' (full), 'editor' (video editors), 'sales' (commercial).
-- Client portal logins ('client' role) are created from the app's client
-- detail page, not here.

insert into public.profiles (id, username, full_name, role)
values (
  'PASTE-USER-UUID-HERE'::uuid,
  'yourusername',                 -- the part before @nextlevel.studio
  'Your Full Name',
  'admin'
)
on conflict (id) do update
  set role = excluded.role,
      username = excluded.username,
      full_name = excluded.full_name;
