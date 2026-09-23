-- Activity inbox for meaningful collaboration events.
create table if not exists public.activity (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  feed_id uuid references public.spaces(id) on delete cascade,
  item_id uuid references public.items(id) on delete cascade,
  event_type text not null check (event_type in ('item_added','note_added','member_joined','member_left','member_removed')),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists activity_recipient_created_idx on public.activity(recipient_id, created_at desc);
create index if not exists activity_recipient_unread_idx on public.activity(recipient_id) where read_at is null;

alter table public.activity enable row level security;

drop policy if exists "Users can read their activity" on public.activity;
create policy "Users can read their activity" on public.activity for select to authenticated using (recipient_id = auth.uid());
drop policy if exists "Users can mark their activity read" on public.activity;
create policy "Users can mark their activity read" on public.activity for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create or replace function public.add_feed_activity(
  target_feed_id uuid,
  target_actor_id uuid,
  target_item_id uuid,
  target_event_type text,
  only_recipient uuid default null
) returns void
language plpgsql security definer set search_path=public set row_security=off as $$
begin
  insert into public.activity(recipient_id, actor_id, feed_id, item_id, event_type)
  select distinct member_id, target_actor_id, target_feed_id, target_item_id, target_event_type
  from (
    select s.user_id as member_id from public.spaces s where s.id=target_feed_id
    union
    select fm.user_id from public.feed_members fm where fm.feed_id=target_feed_id
  ) members
  where member_id is not null
    and member_id is distinct from target_actor_id
    and (only_recipient is null or member_id=only_recipient);
end; $$;

create or replace function public.activity_item_added() returns trigger
language plpgsql security definer set search_path=public set row_security=off as $$
begin
  if new.space_id is not null then perform public.add_feed_activity(new.space_id, coalesce(new.added_by,new.user_id), new.id, 'item_added'); end if;
  return new;
end; $$;

drop trigger if exists activity_item_added_trigger on public.items;
create trigger activity_item_added_trigger after insert on public.items for each row execute function public.activity_item_added();

create or replace function public.activity_note_added() returns trigger
language plpgsql security definer set search_path=public set row_security=off as $$
declare target_feed uuid;
begin
  select i.space_id into target_feed from public.items i where i.id=new.item_id;
  if target_feed is not null then perform public.add_feed_activity(target_feed,new.user_id,new.item_id,'note_added'); end if;
  return new;
end; $$;

drop trigger if exists activity_note_added_trigger on public.item_notes;
create trigger activity_note_added_trigger after insert on public.item_notes for each row execute function public.activity_note_added();

create or replace function public.activity_member_change() returns trigger
language plpgsql security definer set search_path=public set row_security=off as $$
declare actor uuid := auth.uid(); owner_id uuid;
begin
  select s.user_id into owner_id from public.spaces s where s.id=coalesce(new.feed_id,old.feed_id);
  if tg_op='INSERT' then
    perform public.add_feed_activity(new.feed_id,new.user_id,null,'member_joined');
    return new;
  end if;
  if actor=old.user_id then
    perform public.add_feed_activity(old.feed_id,old.user_id,null,'member_left');
  else
    insert into public.activity(recipient_id,actor_id,feed_id,event_type)
    values(old.user_id,coalesce(actor,owner_id),old.feed_id,'member_removed');
  end if;
  return old;
end; $$;

drop trigger if exists activity_member_change_trigger on public.feed_members;
create trigger activity_member_change_trigger after insert or delete on public.feed_members for each row execute function public.activity_member_change();

grant select, update on public.activity to authenticated;
