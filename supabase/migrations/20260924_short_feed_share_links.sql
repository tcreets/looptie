-- Use compact, user-facing codes for Feed share links while preserving UUID primary keys
-- and accepting previously issued UUID links.

alter table public.feed_share_links
  add column if not exists share_code text;

create or replace function public.generate_feed_share_code()
returns text
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  candidate text;
begin
  loop
    candidate := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (
      select 1 from public.feed_share_links where share_code = candidate
    );
  end loop;
  return candidate;
end;
$$;

do $$
declare
  link_record record;
begin
  for link_record in
    select id from public.feed_share_links where share_code is null
  loop
    update public.feed_share_links
    set share_code = public.generate_feed_share_code()
    where id = link_record.id;
  end loop;
end;
$$;

create unique index if not exists feed_share_links_share_code_idx
  on public.feed_share_links (share_code);

alter table public.feed_share_links
  alter column share_code set default public.generate_feed_share_code(),
  alter column share_code set not null;

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
  where feed_id = target_feed_id and revoked_at is null
  order by created_at desc
  limit 1;

  if compact_code is null then
    insert into public.feed_share_links (feed_id, created_by)
    values (target_feed_id, auth.uid())
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
  target_feed public.spaces%rowtype;
  normalized_token text := btrim(share_token);
begin
  if auth.uid() is null then
    raise exception 'Sign in to join this Feed.';
  end if;

  select s.* into target_feed
  from public.feed_share_links l
  join public.spaces s on s.id = l.feed_id
  where l.revoked_at is null
    and (
      l.share_code = upper(normalized_token)
      or l.token::text = lower(normalized_token)
    )
  limit 1;

  if target_feed.id is null then
    raise exception 'This share link is invalid or no longer active.';
  end if;

  if target_feed.user_id = auth.uid() then
    return jsonb_build_object('status', 'owner', 'feed_id', target_feed.id, 'feed_name', target_feed.name);
  end if;

  insert into public.feed_members (feed_id, user_id, role, invited_by)
  values (target_feed.id, auth.uid(), 'editor', target_feed.user_id)
  on conflict (feed_id, user_id) do update set role = 'editor';

  return jsonb_build_object('status', 'joined', 'feed_id', target_feed.id, 'feed_name', target_feed.name);
end;
$$;

grant execute on function public.create_feed_share_link(uuid) to authenticated;
grant execute on function public.join_feed_by_token(text) to authenticated;
