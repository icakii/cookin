-- Run this in the Supabase SQL Editor to add rank/rarity tracking.

create table if not exists cook_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  meal_id text not null,
  meal_title text not null,
  meal_thumbnail text,
  rarity text not null,
  xp integer not null,
  cooked_at timestamptz not null default now()
);

alter table cook_logs enable row level security;

create policy "Users manage their own cook logs"
  on cook_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
