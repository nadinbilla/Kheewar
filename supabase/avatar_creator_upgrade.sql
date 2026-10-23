-- SAFE incremental migration for existing Kheewar Supabase projects.
-- Run once in Supabase SQL Editor before saving avatar settings as logged-in user.
alter table public.profiles add column if not exists avatar_variant text not null default 'female_hijab';
alter table public.profiles add column if not exists skin_tone text not null default '#dba273';
alter table public.profiles add column if not exists avatar_headwear text not null default 'hijab';
alter table public.profiles add column if not exists avatar_outfit text not null default 'traditional';
alter table public.profiles drop constraint if exists profiles_avatar_variant_check;
alter table public.profiles add constraint profiles_avatar_variant_check check (avatar_variant in ('female_hijab', 'male_modest'));
alter table public.profiles drop constraint if exists profiles_avatar_headwear_check;
alter table public.profiles add constraint profiles_avatar_headwear_check check (avatar_headwear in ('hijab','khimar','peci','none'));
alter table public.profiles drop constraint if exists profiles_avatar_outfit_check;
alter table public.profiles add constraint profiles_avatar_outfit_check check (avatar_outfit in ('casual','formal','traditional'));
-- Existing RLS profile owner update policy remains in effect.
