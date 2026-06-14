-- Next Level — service catalog setup.
--
-- The original brand-specific service seed was removed: services are now added
-- in-app via Dashboard → Services. This migration only ensures the unique
-- constraint on name_fr exists (kept here so later migrations and the app's
-- `on conflict (name_fr)` upserts have a matching constraint on a fresh DB).

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'services_name_fr_uk'
  ) then
    alter table public.services
      add constraint services_name_fr_uk unique (name_fr);
  end if;
end $$;
