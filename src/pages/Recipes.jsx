import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  findRecipesForPantry,
  searchMealsByName,
  filterMealIdsByCategory,
  filterMealIdsByArea,
  getMealDetails,
  listCategories,
  listAreas,
} from "@/lib/mealdb";
import RecipeCard from "@/components/RecipeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";

function matches(ingredientName, pantryNames) {
  const needle = ingredientName.trim().toLowerCase();
  if (!needle) return false;
  return pantryNames.some((p) => p.includes(needle) || needle.includes(p));
}

function missingCount(recipe, pantryNames) {
  return recipe.ingredients.filter((i) => !matches(i.name, pantryNames)).length;
}

export default function Recipes() {
  const [pantryNames, setPantryNames] = useState([]);
  const [pantryRecipes, setPantryRecipes] = useState([]);
  const [loadingPantryRecipes, setLoadingPantryRecipes] = useState(true);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState([]);
  const [areas, setAreas] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [area, setArea] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingPantryRecipes(true);
      setError("");
      const { data: pantryData, error: pantryError } = await supabase
        .from("pantry_items")
        .select("name");
      if (cancelled) return;
      if (pantryError) {
        setError(pantryError.message);
        setLoadingPantryRecipes(false);
        return;
      }
      const names = pantryData.map((p) => p.name.trim().toLowerCase());
      setPantryNames(names);

      try {
        const found = await findRecipesForPantry(names);
        if (cancelled) return;
        found.sort((a, b) => missingCount(a, names) - missingCount(b, names));
        setPantryRecipes(found);
      } catch {
        if (!cancelled) setError("Couldn't reach the recipe database. Try again in a bit.");
      }
      if (!cancelled) setLoadingPantryRecipes(false);
    })();

    listCategories().then((c) => !cancelled && setCategories(c));
    listAreas().then((a) => !cancelled && setAreas(a));

    return () => {
      cancelled = true;
    };
  }, []);

  const runSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim() && !category && !area) return;
    setSearching(true);
    setError("");
    try {
      let results;
      if (query.trim()) {
        results = await searchMealsByName(query.trim());
      } else {
        const idList = category ? await filterMealIdsByCategory(category) : await filterMealIdsByArea(area);
        const ids = idList.slice(0, 24).map((m) => m.idMeal);
        results = (await Promise.all(ids.map((id) => getMealDetails(id)))).filter(Boolean);
      }
      if (category) results = results.filter((r) => r.category === category);
      if (area) results = results.filter((r) => r.area === area);
      results.sort((a, b) => missingCount(a, pantryNames) - missingCount(b, pantryNames));
      setSearchResults(results);
    } catch {
      setError("Couldn't reach the recipe database. Try again in a bit.");
    }
    setSearching(false);
  };

  const canMake = pantryRecipes.filter((r) => missingCount(r, pantryNames) === 0);
  const almostThere = pantryRecipes.filter((r) => {
    const m = missingCount(r, pantryNames);
    return m >= 1 && m <= 2;
  });
  const moreIdeas = pantryRecipes.filter((r) => missingCount(r, pantryNames) > 2);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-2xl font-bold tracking-tight">Recipes</h1>
      <p className="mt-1 text-sm text-muted-foreground">Real recipes, ranked by what you already have.</p>

      {error && <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      <form onSubmit={runSearch} className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-medium">Search all recipes</p>
        <div className="flex gap-2">
          <Input
            placeholder="Recipe name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={searching}>
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="" className="bg-card">
              Any category
            </option>
            {categories.map((c) => (
              <option key={c} value={c} className="bg-card">
                {c}
              </option>
            ))}
          </select>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="" className="bg-card">
              Any cuisine
            </option>
            {areas.map((a) => (
              <option key={a} value={a} className="bg-card">
                {a}
              </option>
            ))}
          </select>
        </div>
      </form>

      {searchResults !== null && (
        <div className="mt-6 space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Search results {searchResults.length > 0 ? `(${searchResults.length})` : ""}
          </h2>
          {searchResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recipes matched that search.</p>
          ) : (
            searchResults.map((r) => <RecipeCard key={r.id} recipe={r} pantryNames={pantryNames} />)
          )}
        </div>
      )}

      <div className="mt-10">
        {loadingPantryRecipes ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Finding recipes for your pantry...
          </div>
        ) : pantryNames.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Your pantry is empty. Add a few items and recipes you can make will show up here.
          </p>
        ) : pantryRecipes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No matches yet — try adding a few common ingredients like chicken, rice, or eggs.
          </p>
        ) : (
          <div className="space-y-8">
            {canMake.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold text-primary">You can make now</h2>
                {canMake.map((r) => (
                  <RecipeCard key={r.id} recipe={r} pantryNames={pantryNames} />
                ))}
              </section>
            )}
            {almostThere.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  Almost there — missing 1 or 2 ingredients
                </h2>
                {almostThere.map((r) => (
                  <RecipeCard key={r.id} recipe={r} pantryNames={pantryNames} />
                ))}
              </section>
            )}
            {moreIdeas.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground">More ideas</h2>
                {moreIdeas.map((r) => (
                  <RecipeCard key={r.id} recipe={r} pantryNames={pantryNames} />
                ))}
              </section>
            )}
          </div>
        )}
        <p className="pt-6 text-center text-xs text-muted-foreground">
          Recipe data from{" "}
          <a href="https://www.themealdb.com" target="_blank" rel="noreferrer" className="hover:underline">
            TheMealDB
          </a>
        </p>
      </div>
    </div>
  );
}
