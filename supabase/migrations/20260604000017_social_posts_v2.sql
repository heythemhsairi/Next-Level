-- Social posts v2: multi-platform, hashtags, first_comment, notes

-- Replace single enum platform column with text[] to allow multiple platforms per post
alter table public.social_posts
  add column if not exists platforms text[] not null default '{}';

-- Copy existing single platform value into the array. Guarded so the file is
-- re-runnable: on a second apply the `platform` column is already dropped, and
-- referencing it directly would error — so only run the backfill if it exists.
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'social_posts' and column_name = 'platform'
  ) then
    update public.social_posts
      set platforms = array[platform::text]
      where platforms = '{}' and platform is not null;
  end if;
end $$;

-- Drop old column (keep enum type for backwards compat if needed)
alter table public.social_posts
  drop column if exists platform;

-- New fields
alter table public.social_posts
  add column if not exists hashtags      text     not null default '',
  add column if not exists first_comment text     not null default '',
  add column if not exists notes         text     not null default '';

-- Index on platforms (GIN for array queries)
create index if not exists social_posts_platforms_idx
  on public.social_posts using gin(platforms);
