// Cosmetic catalog for the avatar. Kept in code rather than the database -
// user_cosmetics (supabase/004_cosmetics.sql) only stores which catalog keys
// a player has unlocked. Every item is tied to a TheMealDB category (or
// "any") so cooking a particular kind of food is what can drop it.
export const SLOTS = ["hair", "glasses", "jacket", "shirt", "pants", "shoes", "accessory"];

export const STARTERS = {
  shirt: { key: "shirt_starter", slot: "shirt", label: "Brown Shirt", visual: { variant: "solid", color: "#6b4a34" } },
  pants: { key: "pants_starter", slot: "pants", label: "Grey Sweatpants", visual: { variant: "solid", color: "#8a8f98" } },
};

export const COSMETICS = [
  { key: "hair_bun", slot: "hair", rarity: "common", tags: ["Vegetarian"], label: "Tidy Bun", visual: { variant: "bun", color: "#3b2a1f" } },
  { key: "hair_flame", slot: "hair", rarity: "legendary", tags: ["Dessert"], label: "Flametop", visual: { variant: "flame", color: "#e0762f" } },
  { key: "glasses_round", slot: "glasses", rarity: "uncommon", tags: ["Breakfast"], label: "Round Specs", visual: { variant: "round", color: "#2b2b2b" } },
  { key: "glasses_shades", slot: "glasses", rarity: "rare", tags: ["Seafood"], label: "Deep-Sea Shades", visual: { variant: "shades", color: "#1c2733" } },
  { key: "jacket_apron", slot: "jacket", rarity: "common", tags: ["Vegetarian", "Side", "Starter"], label: "Kitchen Apron", visual: { variant: "apron", color: "#c46a3f" } },
  { key: "jacket_chefcoat", slot: "jacket", rarity: "rare", tags: ["Pasta", "Miscellaneous"], label: "Chef's Coat", visual: { variant: "coat", color: "#f4f1ea" } },
  { key: "jacket_embercloak", slot: "jacket", rarity: "mythic", tags: ["any"], label: "Ember Cloak", visual: { variant: "cloak", color: "#caa24a" } },
  { key: "shirt_stripes", slot: "shirt", rarity: "uncommon", tags: ["Breakfast"], label: "Striped Tee", visual: { variant: "stripes", color: "#3d5a6c" } },
  { key: "shirt_grill", slot: "shirt", rarity: "rare", tags: ["Beef"], label: "Grill Master Tee", visual: { variant: "solid", color: "#7a2b20" } },
  { key: "pants_cargo", slot: "pants", rarity: "uncommon", tags: ["Chicken"], label: "Cargo Pants", visual: { variant: "cargo", color: "#4c5b45" } },
  { key: "shoes_sandals", slot: "shoes", rarity: "common", tags: ["Seafood"], label: "Sandals", visual: { variant: "sandals", color: "#caa06a" } },
  { key: "shoes_boots", slot: "shoes", rarity: "rare", tags: ["Beef"], label: "Work Boots", visual: { variant: "boots", color: "#3a2a1e" } },
  { key: "shoes_gold", slot: "shoes", rarity: "legendary", tags: ["Dessert"], label: "Golden Clogs", visual: { variant: "clogs", color: "#d4af37" } },
  { key: "accessory_spatula", slot: "accessory", rarity: "common", tags: ["any"], label: "Spatula", visual: { variant: "spatula", color: "#9a9a9a" } },
  { key: "accessory_toque", slot: "accessory", rarity: "mythic", tags: ["any"], label: "Champion's Toque", visual: { variant: "toque", color: "#f7f3ea" } },
];

export function getCosmetic(key) {
  return COSMETICS.find((c) => c.key === key) || STARTERS[Object.keys(STARTERS).find((s) => STARTERS[s].key === key)] || null;
}

export function cosmeticsForSlot(slot) {
  return COSMETICS.filter((c) => c.slot === slot);
}

// Picks one not-yet-unlocked cosmetic matching this cook's rarity and food
// category (or an "any" item). Returns null if nothing's left to drop -
// cooking still earns XP even when there's no cosmetic to hand out.
export function rollCosmeticDrop({ category, rarity, unlockedKeys }) {
  const candidates = COSMETICS.filter(
    (c) =>
      c.rarity === rarity &&
      !unlockedKeys.includes(c.key) &&
      (c.tags.includes("any") || (category && c.tags.includes(category)))
  );
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
