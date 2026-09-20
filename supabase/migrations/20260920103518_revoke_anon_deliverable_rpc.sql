-- Supabase's default grants gave anon EXECUTE directly even after PUBLIC was
-- revoked in migration 0022. Keep the RPC callable only by signed-in users;
-- the function body additionally checks the client role and row ownership.
revoke execute on function public.client_set_deliverable_status(uuid, text) from anon;
revoke execute on function public.client_set_deliverable_status(uuid, text) from public;
grant execute on function public.client_set_deliverable_status(uuid, text) to authenticated;
