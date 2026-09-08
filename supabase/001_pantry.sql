-- Run this in the Supabase SQL Editor to add the pantry.

create table if not exists pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  quantity numeric,
  unit text,
  category text,
  created_at timestamptz not null default now()
);

alter table pantry_items enable row level security;

create policy "Users manage their own pantry items"
  on pantry_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
