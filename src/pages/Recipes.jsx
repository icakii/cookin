import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { findRecipesForPantry } from "@/lib/mealdb";
import { Loader2, ExternalLink, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";

function matches(ingredientName, pantryNames) {
  const needle = ingredientName.trim().toLowerCase();
  if (!needle) return false;
  return pantryNames.some((p) => p.includes(needle) || needle.includes(p));
}

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [pantryNames, setPantryNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      const { data: pantryData, error: pantryError } = await supabase
        .from("pantry_items")
        .select("name");
      if (cancelled) return;
      if (pantryError) {
        setError(pantryError.message);
        setLoading(false);
        return;
      }
      const names = pantryData.map((p) => p.name.trim().toLowerCase());
      setPantryNames(names);

      try {
        const found = await findRecipesForPantry(names);
        if (cancelled) return;
        found.sort((a, b) => {
          const haveA = a.ingredients.filter((i) => matches(i.name, names)).length / a.ingredients.length;
          const haveB = b.ingredients.filter((i) => matches(i.name, names)).length / b.ingredients.length;
          return haveB - haveA;
        });
        setRecipes(found);
      } catch {
        if (!cancelled) setError("Couldn't reach the recipe database. Try again in a bit.");
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-2xl font-bold tracking-tight">Recipes</h1>
      <p className="mt-1 text-sm text-muted-foreground">Real recipes, ranked by what you already have.</p>

      {error && <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      {loading ? (
        <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Finding recipes for your pantry...
        </div>
      ) : pantryNames.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Your pantry is empty. Add a few items and recipes you can make will show up here.
        </p>
      ) : recipes.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          No matches yet — try adding a few common ingredients like chicken, rice, or eggs.
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {recipes.map((recipe) => {
            const total = recipe.ingredients.length;
            const have = recipe.ingredients.filter((i) => matches(i.name, pantryNames)).length;
            const canMake = total > 0 && have === total;
            return (
              <details key={recipe.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
                  {recipe.thumbnail && (
                    <img
                      src={recipe.thumbnail}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <span className="flex-1 font-medium">{recipe.title}</span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      canMake ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {have}/{total} you have
                  </span>
                </summary>
                <div className="border-t border-border px-4 py-3">
                  <ul className="space-y-1 text-sm">
                    {recipe.ingredients.map((ing, i) => (
                      <li
                        key={i}
                        className={matches(ing.name, pantryNames) ? "text-foreground" : "text-muted-foreground"}
                      >
                        {matches(ing.name, pantryNames) ? "✓" : "✗"} {ing.name}
                        {ing.measure ? ` — ${ing.measure}` : ""}
                      </li>
                    ))}
                  </ul>
                  {recipe.instructions && (
                    <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                      {recipe.instructions}
                    </p>
                  )}
                  <div className="mt-3 flex gap-4 text-xs">
                    {recipe.source && (
                      <a
                        href={recipe.source}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Source
                      </a>
                    )}
                    {recipe.youtube && (
                      <a
                        href={recipe.youtube}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <Youtube className="w-3 h-3" />
                        Video
                      </a>
                    )}
                  </div>
                </div>
              </details>
            );
          })}
          <p className="pt-2 text-center text-xs text-muted-foreground">
            Recipe data from{" "}
            <a href="https://www.themealdb.com" target="_blank" rel="noreferrer" className="hover:underline">
              TheMealDB
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
