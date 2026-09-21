-- Multiple notes per saved item
create table if not exists public.item_notes (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists item_notes_item_created_idx on public.item_notes (item_id, created_at desc);
alter table public.item_notes enable row level security;

drop policy if exists "Users can read notes on their items" on public.item_notes;
drop policy if exists "Users can add notes to their items" on public.item_notes;
drop policy if exists "Users can edit their own notes" on public.item_notes;
drop policy if exists "Users can delete their own notes" on public.item_notes;

create policy "Users can read notes on their items" on public.item_notes for select
using (exists (select 1 from public.items where items.id = item_notes.item_id and items.user_id = auth.uid()));
create policy "Users can add notes to their items" on public.item_notes for insert
with check (auth.uid() = user_id and exists (select 1 from public.items where items.id = item_notes.item_id and items.user_id = auth.uid()));
create policy "Users can edit their own notes" on public.item_notes for update
using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own notes" on public.item_notes for delete using (auth.uid() = user_id);
