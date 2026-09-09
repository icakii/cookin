-- Run this in the Supabase SQL Editor to add recipes.

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  instructions text,
  created_at timestamptz not null default now()
);

alter table recipes enable row level security;

create policy "Users manage their own recipes"
  on recipes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes on delete cascade not null,
  name text not null,
  quantity numeric,
  unit text
);

alter table recipe_ingredients enable row level security;

create policy "Users manage ingredients of their own recipes"
  on recipe_ingredients for all
  using (exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid()))
  with check (exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid()));
