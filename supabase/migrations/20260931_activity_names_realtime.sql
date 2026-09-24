-- Enrich Activity with member names and Feed names without exposing profiles broadly.
create or replace function public.get_my_activity()
returns table (
  id uuid,
  recipient_id uuid,
  actor_id uuid,
  actor_name text,
  feed_id uuid,
  feed_name text,
  item_id uuid,
  event_type text,
  created_at timestamptz,
  read_at timestamptz
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select
    a.id,
    a.recipient_id,
    a.actor_id,
    coalesce(p.display_name, 'Looptie member') as actor_name,
    a.feed_id,
    coalesce(s.name, 'a shared Feed') as feed_name,
    a.item_id,
    a.event_type,
    a.created_at,
    a.read_at
  from public.activity a
  left join public.profiles p on p.user_id = a.actor_id
  left join public.spaces s on s.id = a.feed_id
  where a.recipient_id = auth.uid()
  order by a.created_at desc
  limit 100;
$$;

grant execute on function public.get_my_activity() to authenticated;

-- Make Activity changes available to authenticated clients through Supabase Realtime.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'activity'
  ) then
    alter publication supabase_realtime add table public.activity;
  end if;
end $$;
