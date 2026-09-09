import React from "react";
import { ExternalLink, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";

function matches(ingredientName, pantryNames) {
  const needle = ingredientName.trim().toLowerCase();
  if (!needle) return false;
  return pantryNames.some((p) => p.includes(needle) || needle.includes(p));
}

export default function RecipeCard({ recipe, pantryNames }) {
  const total = recipe.ingredients.length;
  const have = recipe.ingredients.filter((i) => matches(i.name, pantryNames)).length;
  const missing = total - have;
  const canMake = total > 0 && missing === 0;

  return (
    <details className="overflow-hidden rounded-xl border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
        {recipe.thumbnail && (
          <img src={recipe.thumbnail} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
        )}
        <span className="flex-1 font-medium">{recipe.title}</span>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
            canMake ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
          )}
        >
          {canMake ? "You can make this" : `Missing ${missing}`}
        </span>
      </summary>
      <div className="border-t border-border px-4 py-3">
        <ul className="space-y-1 text-sm">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className={matches(ing.name, pantryNames) ? "text-foreground" : "text-muted-foreground"}>
              {matches(ing.name, pantryNames) ? "✓" : "✗"} {ing.name}
              {ing.measure ? ` — ${ing.measure}` : ""}
            </li>
          ))}
        </ul>
        {recipe.instructions && (
          <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{recipe.instructions}</p>
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
}
