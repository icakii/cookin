const BASE = "https://www.themealdb.com/api/json/v1/1";

function firstWord(name) {
  return name.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
}

function extractIngredients(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]?.trim();
    const measure = meal[`strMeasure${i}`]?.trim();
    if (name) ingredients.push({ name, measure: measure || null });
  }
  return ingredients;
}

async function findMealIdsByIngredient(ingredient) {
  const res = await fetch(`${BASE}/filter.php?i=${encodeURIComponent(ingredient)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.meals ?? [];
}

async function getMealDetails(id) {
  const res = await fetch(`${BASE}/lookup.php?i=${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.meals?.[0] ?? null;
}

export async function findRecipesForPantry(pantryNames, { maxCandidates = 24 } = {}) {
  const keywords = [...new Set(pantryNames.map(firstWord).filter(Boolean))];
  if (keywords.length === 0) return [];

  const results = await Promise.all(keywords.map((k) => findMealIdsByIngredient(k)));
  const candidateIds = [...new Set(results.flat().map((m) => m.idMeal))].slice(0, maxCandidates);

  const meals = await Promise.all(candidateIds.map((id) => getMealDetails(id)));
  return meals
    .filter(Boolean)
    .map((meal) => ({
      id: meal.idMeal,
      title: meal.strMeal,
      thumbnail: meal.strMealThumb ? `${meal.strMealThumb}/medium` : null,
      instructions: meal.strInstructions,
      source: meal.strSource || null,
      youtube: meal.strYoutube || null,
      ingredients: extractIngredients(meal),
    }));
}
