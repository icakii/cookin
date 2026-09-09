-- Run this in the Supabase SQL Editor to add profiles (username, avatar
-- loadout, notification preference) and open cook_logs up for the leaderboard.

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null unique,
  notifications_enabled boolean not null default false,
  equipped jsonb not null default '{"shirt": "shirt_starter", "pants": "pants_starter"}'::jsonb,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Usernames need to be publicly readable for the leaderboard and other
-- players' avatars; only the owner can create/edit their own row.
create policy "Profiles are publicly readable"
  on profiles for select
  using (true);

create policy "Users manage their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users update their own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- The leaderboard needs to sum every player's XP, not just the current
-- user's, so open cook_logs up for reading (writes stay owner-only via the
-- existing "Users manage their own cook logs" policy).
create policy "Cook logs are publicly readable for the leaderboard"
  on cook_logs for select
  using (true);
