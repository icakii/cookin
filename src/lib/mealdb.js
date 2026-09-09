const BASE = "https://www.themealdb.com/api/json/v1/1";

function firstWord(name) {
  return name.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
}

function normalizeMeal(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]?.trim();
    const measure = meal[`strMeasure${i}`]?.trim();
    if (name) ingredients.push({ name, measure: measure || null });
  }
  return {
    id: meal.idMeal,
    title: meal.strMeal,
    category: meal.strCategory || null,
    area: meal.strArea || null,
    thumbnail: meal.strMealThumb ? `${meal.strMealThumb}/medium` : null,
    instructions: meal.strInstructions,
    source: meal.strSource || null,
    youtube: meal.strYoutube || null,
    ingredients,
  };
}

async function getJson(path) {
  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) throw new Error("Recipe database request failed");
  return res.json();
}

async function findMealIdsByIngredient(ingredient) {
  const data = await getJson(`filter.php?i=${encodeURIComponent(ingredient)}`).catch(() => null);
  return data?.meals ?? [];
}

export async function filterMealIdsByCategory(category) {
  const data = await getJson(`filter.php?c=${encodeURIComponent(category)}`).catch(() => null);
  return data?.meals ?? [];
}

export async function filterMealIdsByArea(area) {
  const data = await getJson(`filter.php?a=${encodeURIComponent(area)}`).catch(() => null);
  return data?.meals ?? [];
}

export async function getMealDetails(id) {
  const data = await getJson(`lookup.php?i=${id}`).catch(() => null);
  return data?.meals?.[0] ? normalizeMeal(data.meals[0]) : null;
}

export async function searchMealsByName(query) {
  const data = await getJson(`search.php?s=${encodeURIComponent(query)}`).catch(() => null);
  return (data?.meals ?? []).map(normalizeMeal);
}

export async function findRecipesForPantry(pantryNames, { maxCandidates = 24 } = {}) {
  const keywords = [...new Set(pantryNames.map(firstWord).filter(Boolean))];
  if (keywords.length === 0) return [];

  const results = await Promise.all(keywords.map((k) => findMealIdsByIngredient(k)));
  const candidateIds = [...new Set(results.flat().map((m) => m.idMeal))].slice(0, maxCandidates);

  const meals = await Promise.all(candidateIds.map((id) => getMealDetails(id)));
  return meals.filter(Boolean);
}

let ingredientsCache = null;
export async function listAllIngredients() {
  if (ingredientsCache) return ingredientsCache;
  try {
    const cached = localStorage.getItem("mealdb:ingredients");
    if (cached) {
      ingredientsCache = JSON.parse(cached);
      return ingredientsCache;
    }
  } catch {
    // localStorage unavailable, fall through to a live fetch
  }
  const data = await getJson("list.php?i=list");
  const names = (data.meals ?? [])
    .map((i) => i.strIngredient)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  ingredientsCache = names;
  try {
    localStorage.setItem("mealdb:ingredients", JSON.stringify(names));
  } catch {
    // best-effort cache only
  }
  return names;
}

export async function listCategories() {
  const data = await getJson("list.php?c=list");
  return (data.meals ?? []).map((c) => c.strCategory).filter(Boolean);
}

export async function listAreas() {
  const data = await getJson("list.php?a=list");
  return (data.meals ?? []).map((a) => a.strArea).filter(Boolean);
}
