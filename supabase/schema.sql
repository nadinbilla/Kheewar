-- Kheewar database schema for Supabase
-- Run this file in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Pembelajar' check (char_length(display_name) between 2 and 32),
  country_code text not null default 'ID' check (char_length(country_code) between 2 and 3),
  level text not null default 'A1' check (level in ('A1', 'A2', 'B1', 'B2')),
  avatar_color text not null default '#d59b71',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null check (char_length(room_id) between 1 and 80),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 32),
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists conversation_messages_room_created_idx
  on public.conversation_messages (room_id, created_at desc);

create table if not exists public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id text not null,
  completed_at timestamptz not null default now(),
  score integer check (score between 0 and 100),
  unique (user_id, mission_id)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, country_code)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1), 'Pembelajar'), 32),
    coalesce(nullif(new.raw_user_meta_data ->> 'country_code', ''), 'ID')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.learning_progress enable row level security;

drop policy if exists "Profiles visible to authenticated learners" on public.profiles;
create policy "Profiles visible to authenticated learners" on public.profiles
  for select to authenticated using (true);
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Authenticated learners can read room messages" on public.conversation_messages;
create policy "Authenticated learners can read room messages" on public.conversation_messages
  for select to authenticated using (true);
drop policy if exists "Users can send their own room messages" on public.conversation_messages;
create policy "Users can send their own room messages" on public.conversation_messages
  for insert to authenticated with check (auth.uid() = user_id and char_length(content) between 1 and 500);

drop policy if exists "Users can read their own learning progress" on public.learning_progress;
create policy "Users can read their own learning progress" on public.learning_progress
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can add their own learning progress" on public.learning_progress;
create policy "Users can add their own learning progress" on public.learning_progress
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update their own learning progress" on public.learning_progress;
create policy "Users can update their own learning progress" on public.learning_progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Recommended: enable Realtime for public.conversation_messages only if you later want postgres_changes.
-- Current prototype uses private per-room broadcast/presence channels for live chat and avatar positions.
