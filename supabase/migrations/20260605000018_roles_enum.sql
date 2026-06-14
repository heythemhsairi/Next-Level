-- Next Level — pivot, step 1 of 2: extend the user_role enum.
--
-- This file contains ONLY `alter type ... add value`. Postgres forbids using a
-- freshly-added enum value in the SAME transaction that adds it, and the
-- Management API runs each migration file in its own transaction. So the new
-- values are added here and only USED in the next migration (…_pivot_schema_rls).
--
-- Legacy values 'worker' and 'freelancer' are intentionally kept so existing
-- rows stay valid; helper functions in the next migration treat them as 'editor'.

alter type public.user_role add value if not exists 'editor';
alter type public.user_role add value if not exists 'sales';
alter type public.user_role add value if not exists 'client';
