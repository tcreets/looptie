-- Feed membership controls access to Feed content.
-- A removed collaborator's contributions remain in the Feed for current members,
-- but no longer appear in the removed collaborator's Looptie.

drop policy if exists "Only Feed members can select items" on public.items;

create policy "Only Feed members can select items"
on public.items
for select
using (
  (space_id is null and user_id = auth.uid())
  or public.is_feed_member(space_id)
);

create or replace function public.get_my_feed_items()
returns setof public.items
language sql stable security definer
set search_path = public
set row_security = off
as $$
  select i.*
  from public.items i
  where
    (i.space_id is null and i.user_id = auth.uid())
    or exists (
      select 1
      from public.feed_members fm
      where fm.feed_id = i.space_id
        and fm.user_id = auth.uid()
    )
  order by i.created_at desc;
$$;

grant execute on function public.get_my_feed_items() to authenticated;
