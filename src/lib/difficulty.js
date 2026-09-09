// TheMealDB has no difficulty field, so it's estimated from ingredient count -
// the simplest signal a user can eyeball themselves ("12 ingredients? that's
// Expert"). Difficulty is what grants XP; cosmetic rarity is a separate roll
// weighted by this same difficulty (see lib/cosmetics.js).
export const DIFFICULTIES = [
  { key: "easy", label: "Easy", xp: 15, minIngredients: 0, textClass: "text-muted-foreground", bgClass: "bg-secondary" },
  { key: "medium", label: "Medium", xp: 35, minIngredients: 6, textClass: "text-primary", bgClass: "bg-primary/15" },
  { key: "hard", label: "Hard", xp: 75, minIngredients: 9, textClass: "text-accent", bgClass: "bg-accent/15" },
  { key: "expert", label: "Expert", xp: 160, minIngredients: 12, textClass: "text-gold", bgClass: "bg-gold/15" },
];

export function estimateDifficulty(recipe) {
  const count = recipe?.ingredients?.length ?? 0;
  let match = DIFFICULTIES[0];
  for (const d of DIFFICULTIES) {
    if (count >= d.minIngredients) match = d;
  }
  return match;
}

export function difficultyByKey(key) {
  return DIFFICULTIES.find((d) => d.key === key) || DIFFICULTIES[0];
}
