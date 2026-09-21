-- Collaborative Feeds foundation
-- Existing Feeds remain private. Owners can create a share link; opening it adds the signed-in user as an editor.

create table if not exists public.feed_members (
  feed_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor', 'viewer')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (feed_id, user_id)
);

create table if not exists public.feed_share_links (
  id uuid primary key default gen_random_uuid(),
  feed_id uuid not null references public.spaces(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.items add column if not exists space_id uuid references public.spaces(id) on delete cascade;
alter table public.items add column if not exists added_by uuid references auth.users(id) on delete set null;

update public.items i
set space_id = s.id
from public.spaces s
where i.space_id is null and s.user_id = i.user_id and s.name = i.space;

update public.items set added_by = user_id where added_by is null;

insert into public.feed_members (feed_id, user_id, role, invited_by)
select id, user_id, 'owner', user_id from public.spaces
on conflict (feed_id, user_id) do update set role = 'owner';

create or replace function public.is_feed_member(target_feed_id uuid, target_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public set row_security = off
as $$ select exists (
  select 1 from public.feed_members
  where feed_id = target_feed_id and user_id = target_user_id
); $$;

create or replace function public.is_feed_owner(target_feed_id uuid, target_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public set row_security = off
as $$ select exists (
  select 1 from public.spaces
  where id = target_feed_id and user_id = target_user_id
); $$;

create or replace function public.can_edit_feed(target_feed_id uuid, target_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public set row_security = off
as $$ select exists (
  select 1 from public.feed_members
  where feed_id = target_feed_id and user_id = target_user_id and role in ('owner', 'editor')
); $$;

create or replace function public.add_feed_owner_membership()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.feed_members (feed_id, user_id, role, invited_by)
  values (new.id, new.user_id, 'owner', new.user_id)
  on conflict (feed_id, user_id) do update set role = 'owner';
  return new;
end;
$$;

drop trigger if exists add_feed_owner_membership on public.spaces;
create trigger add_feed_owner_membership
after insert on public.spaces for each row execute function public.add_feed_owner_membership();

alter table public.feed_members enable row level security;
alter table public.feed_share_links enable row level security;

drop policy if exists "Feed members can view memberships" on public.feed_members;
create policy "Feed members can view memberships" on public.feed_members for select
using (public.is_feed_member(feed_id));

drop policy if exists "Feed owners can manage memberships" on public.feed_members;
create policy "Feed owners can manage memberships" on public.feed_members for all
using (public.is_feed_owner(feed_id)) with check (public.is_feed_owner(feed_id));

drop policy if exists "Feed owners can manage share links" on public.feed_share_links;
create policy "Feed owners can manage share links" on public.feed_share_links for all
using (public.is_feed_owner(feed_id)) with check (public.is_feed_owner(feed_id));

drop policy if exists "Feed members can view feeds" on public.spaces;
create policy "Feed members can view feeds" on public.spaces for select
using (public.is_feed_member(id));

drop policy if exists "Feed members can view items" on public.items;
create policy "Feed members can view items" on public.items for select
using (user_id = auth.uid() or public.is_feed_member(space_id));

drop policy if exists "Feed editors can add items" on public.items;
create policy "Feed editors can add items" on public.items for insert
with check (user_id = auth.uid() and (space_id is null or public.can_edit_feed(space_id)));

drop policy if exists "Contributors can update their items" on public.items;
create policy "Contributors can update their items" on public.items for update
using (user_id = auth.uid() or public.is_feed_owner(space_id))
with check (public.can_edit_feed(space_id));

drop policy if exists "Contributors can delete their items" on public.items;
create policy "Contributors can delete their items" on public.items for delete
using (user_id = auth.uid() or public.is_feed_owner(space_id));

create or replace function public.create_feed_share_link(target_feed_id uuid)
returns text language plpgsql security definer set search_path = public set row_security = off
as $$
declare share_token uuid;
begin
  if not public.is_feed_owner(target_feed_id, auth.uid()) then
    raise exception 'Only the Feed owner can create a share link.';
  end if;

  select token into share_token from public.feed_share_links
  where feed_id = target_feed_id and revoked_at is null
  order by created_at desc limit 1;

  if share_token is null then
    insert into public.feed_share_links (feed_id, created_by)
    values (target_feed_id, auth.uid())
    returning token into share_token;
  end if;

  return share_token::text;
end;
$$;

create or replace function public.join_feed_by_token(share_token text)
returns jsonb language plpgsql security definer set search_path = public set row_security = off
as $$
declare target_feed public.spaces%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in to join this Feed.'; end if;

  select s.* into target_feed
  from public.feed_share_links l
  join public.spaces s on s.id = l.feed_id
  where l.token::text = share_token and l.revoked_at is null
  limit 1;

  if target_feed.id is null then raise exception 'This share link is invalid or no longer active.'; end if;
  if target_feed.user_id = auth.uid() then
    return jsonb_build_object('status', 'owner', 'feed_id', target_feed.id, 'feed_name', target_feed.name);
  end if;

  insert into public.feed_members (feed_id, user_id, role, invited_by)
  values (target_feed.id, auth.uid(), 'editor', target_feed.user_id)
  on conflict (feed_id, user_id) do update set role = 'editor';

  return jsonb_build_object('status', 'joined', 'feed_id', target_feed.id, 'feed_name', target_feed.name);
end;
$$;

create or replace function public.get_feed_people(target_feed_id uuid)
returns table (user_id uuid, display_name text, role text)
language sql stable security definer set search_path = public set row_security = off
as $$
  select fm.user_id, coalesce(p.display_name, 'Looptie member'), fm.role
  from public.feed_members fm
  left join public.profiles p on p.user_id = fm.user_id
  where fm.feed_id = target_feed_id and public.is_feed_member(target_feed_id, auth.uid())
  order by case fm.role when 'owner' then 0 else 1 end, fm.created_at;
$$;

create or replace function public.remove_feed_member(target_feed_id uuid, target_user_id uuid)
returns void language plpgsql security definer set search_path = public set row_security = off
as $$
begin
  if not public.is_feed_owner(target_feed_id, auth.uid()) then
    raise exception 'Only the Feed owner can remove contributors.';
  end if;
  if public.is_feed_owner(target_feed_id, target_user_id) then
    raise exception 'The Feed owner cannot be removed.';
  end if;
  delete from public.feed_members where feed_id = target_feed_id and user_id = target_user_id;
end;
$$;

grant execute on function public.create_feed_share_link(uuid) to authenticated;
grant execute on function public.join_feed_by_token(text) to authenticated;
grant execute on function public.get_feed_people(uuid) to authenticated;
grant execute on function public.remove_feed_member(uuid, uuid) to authenticated;

create index if not exists feed_members_user_idx on public.feed_members(user_id);
create index if not exists items_space_id_idx on public.items(space_id);
