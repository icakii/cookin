-- Run this in the Supabase SQL Editor to add cosmetic unlocks.
-- The cosmetic catalog itself (slot/rarity/which foods drop it) lives in
-- src/lib/cosmetics.js, not the database - this table just records which
-- catalog keys each player has unlocked.

create table if not exists user_cosmetics (
  user_id uuid references auth.users not null,
  cosmetic_key text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, cosmetic_key)
);

alter table user_cosmetics enable row level security;

create policy "Users manage their own cosmetic unlocks"
  on user_cosmetics for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
