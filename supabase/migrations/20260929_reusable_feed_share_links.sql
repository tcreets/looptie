-- Reusable Feed share links.
-- One active link per Feed can admit multiple collaborators until it expires
-- or the owner revokes/resets it.

create or replace function public.create_feed_share_link(target_feed_id uuid)
returns text
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  compact_code text;
begin
  if not public.is_feed_owner(target_feed_id, auth.uid()) then
    raise exception 'Only the Feed owner can create a share link.';
  end if;

  select share_code into compact_code
  from public.feed_share_links
  where feed_id = target_feed_id
    and revoked_at is null
    and expires_at > now()
  order by created_at desc
  limit 1;

  if compact_code is null then
    insert into public.feed_share_links (feed_id, created_by, expires_at)
    values (target_feed_id, auth.uid(), now() + interval '48 hours')
    returning share_code into compact_code;
  end if;

  return compact_code;
end;
$$;

create or replace function public.join_feed_by_token(share_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  link_record public.feed_share_links%rowtype;
  target_feed public.spaces%rowtype;
  normalized_token text := btrim(share_token);
begin
  if auth.uid() is null then
    raise exception 'Sign in to join this Feed.';
  end if;

  select l.* into link_record
  from public.feed_share_links l
  where l.share_code = upper(normalized_token)
     or l.token::text = lower(normalized_token)
  order by l.created_at desc
  limit 1;

  if link_record.id is null then
    raise exception 'This share link is invalid.';
  end if;

  if link_record.revoked_at is not null then
    raise exception 'This share link is no longer active.';
  end if;

  if link_record.expires_at is null or link_record.expires_at <= now() then
    raise exception 'This share link has expired. Ask the person who shared it with you for a new one.';
  end if;

  select * into target_feed
  from public.spaces
  where id = link_record.feed_id;

  if target_feed.id is null then
    raise exception 'This Feed no longer exists.';
  end if;

  if public.is_feed_member(target_feed.id, auth.uid()) then
    return jsonb_build_object(
      'status', case when target_feed.user_id = auth.uid() then 'owner' else 'already_joined' end,
      'feed_id', target_feed.id,
      'feed_name', target_feed.name
    );
  end if;

  insert into public.feed_members (feed_id, user_id, role, invited_by)
  values (target_feed.id, auth.uid(), 'editor', target_feed.user_id)
  on conflict (feed_id, user_id) do update set role = 'editor';

  return jsonb_build_object(
    'status', 'joined',
    'feed_id', target_feed.id,
    'feed_name', target_feed.name
  );
end;
$$;

grant execute on function public.create_feed_share_link(uuid) to authenticated;
grant execute on function public.join_feed_by_token(text) to authenticated;
