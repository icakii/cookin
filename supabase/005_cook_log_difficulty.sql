-- Run this in the Supabase SQL Editor. Recipes are now scored by difficulty
-- (Easy/Medium/Hard/Expert -> fixed XP) instead of a random roll - the
-- "rarity" column stays, but now records the cosmetic-drop roll only, which
-- is itself weighted by this difficulty (see src/lib/cosmetics.js).

alter table cook_logs add column if not exists difficulty text not null default 'easy';
