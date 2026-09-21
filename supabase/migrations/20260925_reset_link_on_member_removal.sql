-- Removing a collaborator also invalidates every outstanding link for the Feed.
-- A new compact link is created the next time the owner chooses Share Feed.

create or replace function public.remove_feed_member(target_feed_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if not public.is_feed_owner(target_feed_id, auth.uid()) then
    raise exception 'Only the Feed owner can remove collaborators.';
  end if;

  if public.is_feed_owner(target_feed_id, target_user_id) then
    raise exception 'The Feed owner cannot be removed.';
  end if;

  delete from public.feed_members
  where feed_id = target_feed_id
    and user_id = target_user_id;

  if not found then
    raise exception 'This person no longer has access to the Feed.';
  end if;

  update public.feed_share_links
  set revoked_at = now()
  where feed_id = target_feed_id
    and revoked_at is null;
end;
$$;

grant execute on function public.remove_feed_member(uuid, uuid) to authenticated;
