alter table public.items
add column if not exists media_url text;

comment on column public.items.media_url is
  'Optional direct playable media URL. Item Detail prefers this over a third-party platform embed when available.';
