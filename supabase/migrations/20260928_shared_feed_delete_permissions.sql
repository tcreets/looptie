-- Shared Feed item deletion permissions:
-- Feed owners can delete any item in their Feed.
-- Collaborators can delete only items they personally contributed.

drop policy if exists "Contributors can delete their items" on public.items;

create policy "Contributors can delete their items"
on public.items
for delete
using (
  (
    added_by = auth.uid()
    and public.is_feed_member(space_id)
  )
  or public.is_feed_owner(space_id)
  or (
    space_id is null
    and user_id = auth.uid()
  )
);
