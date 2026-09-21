-- Strictly return only Feeds and items the signed-in user can access.
-- These RPCs avoid inheriting any older permissive select policies.

create or replace function public.get_my_feeds()
returns setof public.spaces
language sql stable security definer
set search_path = public
set row_security = off
as $$
  select s.*
  from public.spaces s
  where s.user_id = auth.uid()
     or exists (
       select 1 from public.feed_members fm
       where fm.feed_id = s.id and fm.user_id = auth.uid()
     )
  order by s.created_at asc;
$$;

create or replace function public.get_my_feed_items()
returns setof public.items
language sql stable security definer
set search_path = public
set row_security = off
as $$
  select i.*
  from public.items i
  where i.user_id = auth.uid()
     or exists (
       select 1 from public.feed_members fm
       where fm.feed_id = i.space_id and fm.user_id = auth.uid()
     )
  order by i.created_at desc;
$$;

grant execute on function public.get_my_feeds() to authenticated;
grant execute on function public.get_my_feed_items() to authenticated;
