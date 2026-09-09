// Rarity drop table rolled each time a user logs a cook, and the flame-themed
// rank ladder that cumulative XP climbs. Colors map to the ember/amber/gold
// tokens in index.css - gold is reserved for legendary drops only.
export const RARITIES = [
  { key: "common", label: "Common", weight: 55, xp: 10, textClass: "text-muted-foreground", bgClass: "bg-secondary" },
  { key: "uncommon", label: "Uncommon", weight: 28, xp: 25, textClass: "text-primary", bgClass: "bg-primary/15" },
  { key: "rare", label: "Rare", weight: 13, xp: 60, textClass: "text-accent", bgClass: "bg-accent/15" },
  { key: "legendary", label: "Legendary", weight: 4, xp: 200, textClass: "text-gold", bgClass: "bg-gold/15" },
];

export function rollRarity() {
  const totalWeight = RARITIES.reduce((sum, r) => sum + r.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const rarity of RARITIES) {
    if (roll < rarity.weight) return rarity;
    roll -= rarity.weight;
  }
  return RARITIES[0];
}

export function rarityByKey(key) {
  return RARITIES.find((r) => r.key === key) || RARITIES[0];
}

export const RANKS = [
  { name: "Spark", minXp: 0 },
  { name: "Kindling", minXp: 100 },
  { name: "Ember", minXp: 300 },
  { name: "Flame", minXp: 700 },
  { name: "Blaze", minXp: 1500 },
  { name: "Bonfire", minXp: 3000 },
  { name: "Inferno", minXp: 6000 },
  { name: "Wildfire", minXp: 12000 },
  { name: "Phoenix", minXp: 25000 },
];

export function rankProgress(totalXp) {
  let current = RANKS[0];
  let next = RANKS[1] || null;
  for (let i = 0; i < RANKS.length; i++) {
    if (totalXp >= RANKS[i].minXp) {
      current = RANKS[i];
      next = RANKS[i + 1] || null;
    }
  }
  const span = next ? next.minXp - current.minXp : 0;
  const into = next ? totalXp - current.minXp : 0;
  const percent = next ? Math.min(100, Math.round((into / span) * 100)) : 100;
  return { current, next, percent, xpIntoRank: into, xpToNext: next ? next.minXp - totalXp : 0 };
}
