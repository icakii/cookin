// Cosmetic drop rarity (separate from recipe difficulty - see lib/difficulty.js
// for what actually grants XP). Colors map to the ember/amber/gold tokens in
// index.css - gold is reserved for legendary+ drops per index.css's own
// "reserved for rarity/holo moments" comment. Which rarities can drop for a
// given cook is weighted by that recipe's difficulty (lib/cosmetics.js).
export const RARITIES = [
  { key: "common", label: "Common", textClass: "text-muted-foreground", bgClass: "bg-secondary" },
  { key: "uncommon", label: "Uncommon", textClass: "text-primary", bgClass: "bg-primary/15" },
  { key: "rare", label: "Rare", textClass: "text-accent", bgClass: "bg-accent/15" },
  { key: "legendary", label: "Legendary", textClass: "text-gold", bgClass: "bg-gold/15" },
  { key: "mythic", label: "Mythic", textClass: "text-gold", bgClass: "bg-gold/25", holo: true },
];

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
