-- Allow collaborators to leave a shared Feed themselves.

create or replace function public.leave_feed(target_feed_id uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if public.is_feed_owner(target_feed_id, auth.uid()) then
    raise exception 'Feed owners cannot leave their own Feed.';
  end if;

  delete from public.feed_members
  where feed_id = target_feed_id
    and user_id = auth.uid();

  if not found then
    raise exception 'You are not a member of this Feed.';
  end if;
end;
$$;

grant execute on function public.leave_feed(uuid) to authenticated;
