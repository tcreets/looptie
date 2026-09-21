-- Distinct, one-person Feed invitations that expire after 48 hours.

alter table public.feed_share_links
  add column if not exists expires_at timestamptz,
  add column if not exists used_at timestamptz,
  add column if not exists used_by uuid references auth.users(id) on delete set null;

-- Retire older reusable links as this migration switches Feeds to one-time invitations.
update public.feed_share_links
set revoked_at = coalesce(revoked_at, now())
where revoked_at is null;

alter table public.feed_share_links
  alter column expires_at set default (now() + interval '48 hours');

create index if not exists feed_share_links_active_invites_idx
  on public.feed_share_links (feed_id, expires_at)
  where revoked_at is null and used_at is null;

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
    raise exception 'Only the Feed owner can create an invite link.';
  end if;

  insert into public.feed_share_links (feed_id, created_by, expires_at)
  values (target_feed_id, auth.uid(), now() + interval '48 hours')
  returning share_code into compact_code;

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
  invite_record public.feed_share_links%rowtype;
  target_feed public.spaces%rowtype;
  normalized_token text := btrim(share_token);
begin
  if auth.uid() is null then
    raise exception 'Sign in to join this Feed.';
  end if;

  select l.* into invite_record
  from public.feed_share_links l
  where l.share_code = upper(normalized_token)
     or l.token::text = lower(normalized_token)
  order by l.created_at desc
  limit 1
  for update;

  if invite_record.id is null then
    raise exception 'This invite link is invalid.';
  end if;

  if invite_record.revoked_at is not null then
    raise exception 'This invite link is no longer active.';
  end if;

  if invite_record.expires_at is null or invite_record.expires_at <= now() then
    raise exception 'This invite link has expired. Ask the Feed owner for a new one.';
  end if;

  if invite_record.used_at is not null then
    raise exception 'This invite link has already been used.';
  end if;

  select * into target_feed
  from public.spaces
  where id = invite_record.feed_id;

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
  values (target_feed.id, auth.uid(), 'editor', target_feed.user_id);

  update public.feed_share_links
  set used_at = now(), used_by = auth.uid()
  where id = invite_record.id;

  return jsonb_build_object(
    'status', 'joined',
    'feed_id', target_feed.id,
    'feed_name', target_feed.name
  );
end;
$$;

grant execute on function public.create_feed_share_link(uuid) to authenticated;
grant execute on function public.join_feed_by_token(text) to authenticated;
