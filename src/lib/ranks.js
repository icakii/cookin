// Rarity drop table rolled each time a user logs a cook, and the competitive
// rank ladder that cumulative XP climbs. Colors map to the ember/amber/gold
// tokens in index.css - gold is reserved for the top tiers and legendary+
// drops, since index.css calls it out as "reserved for rarity/holo moments".
export const RARITIES = [
  { key: "common", label: "Common", weight: 55, xp: 10, textClass: "text-muted-foreground", bgClass: "bg-secondary" },
  { key: "uncommon", label: "Uncommon", weight: 27, xp: 25, textClass: "text-primary", bgClass: "bg-primary/15" },
  { key: "rare", label: "Rare", weight: 13, xp: 60, textClass: "text-accent", bgClass: "bg-accent/15" },
  { key: "legendary", label: "Legendary", weight: 4, xp: 200, textClass: "text-gold", bgClass: "bg-gold/15" },
  {
    key: "mythic",
    label: "Mythic",
    weight: 1,
    xp: 500,
    textClass: "text-gold",
    bgClass: "bg-gold/25",
    holo: true,
  },
];

const NON_MYTHIC = RARITIES.filter((r) => r.key !== "mythic");

// Mythic only drops for players who've already reached Champion or Legend -
// everyone else's roll is re-weighted across the other four tiers.
export function rollRarity({ allowMythic = false } = {}) {
  const pool = allowMythic ? RARITIES : NON_MYTHIC;
  const totalWeight = pool.reduce((sum, r) => sum + r.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const rarity of pool) {
    if (roll < rarity.weight) return rarity;
    roll -= rarity.weight;
  }
  return pool[0];
}

export function rarityByKey(key) {
  return RARITIES.find((r) => r.key === key) || RARITIES[0];
}

// Bronze -> Champion are fixed XP thresholds. Legend isn't a threshold at
// all - it's awarded live to Champion-or-above players currently sitting in
// the global top 500 by XP (see lib/leaderboard.js), the same way a
// Challenger tier works in other live-service games.
export const RANKS = [
  { name: "Bronze", minXp: 0, tierClass: "text-muted-foreground" },
  { name: "Silver", minXp: 400, tierClass: "text-foreground" },
  { name: "Gold", minXp: 1000, tierClass: "text-primary" },
  { name: "Platinum", minXp: 2200, tierClass: "text-primary font-bold" },
  { name: "Diamond", minXp: 4500, tierClass: "text-accent" },
  { name: "Master", minXp: 9000, tierClass: "text-accent font-bold" },
  { name: "Champion", minXp: 18000, tierClass: "text-gold" },
];

export const LEGEND_TIER = { name: "Legend", tierClass: "text-gold font-bold" };

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

// isTopLeaderboard: whether this player currently sits in the global top 500
// by XP (see fetchLeaderboard in lib/leaderboard.js).
export function effectiveTier(totalXp, isTopLeaderboard) {
  const { current } = rankProgress(totalXp);
  if (isTopLeaderboard && current.name === "Champion") return LEGEND_TIER;
  return current;
}
