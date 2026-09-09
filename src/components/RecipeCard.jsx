import React, { useState } from "react";
import { ExternalLink, Youtube, Flame, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { rollRarity, rankProgress } from "@/lib/ranks";
import { getUserTotalXp } from "@/lib/leaderboard";
import { rollCosmeticDrop } from "@/lib/cosmetics";

function matches(ingredientName, pantryNames) {
  const needle = ingredientName.trim().toLowerCase();
  if (!needle) return false;
  return pantryNames.some((p) => p.includes(needle) || needle.includes(p));
}

export default function RecipeCard({ recipe, pantryNames }) {
  const { user } = useAuth();
  const [logging, setLogging] = useState(false);
  const [drop, setDrop] = useState(null);
  const [logError, setLogError] = useState("");

  const total = recipe.ingredients.length;
  const have = recipe.ingredients.filter((i) => matches(i.name, pantryNames)).length;
  const missing = total - have;
  const canMake = total > 0 && missing === 0;

  const handleCook = async () => {
    setLogging(true);
    setLogError("");
    try {
      const totalXp = await getUserTotalXp(user.id);
      const allowMythic = rankProgress(totalXp).current.name === "Champion";
      const rarity = rollRarity({ allowMythic });

      const { error } = await supabase.from("cook_logs").insert({
        user_id: user.id,
        meal_id: recipe.id,
        meal_title: recipe.title,
        meal_thumbnail: recipe.thumbnail || null,
        rarity: rarity.key,
        xp: rarity.xp,
      });
      if (error) throw error;

      const { data: unlocked } = await supabase.from("user_cosmetics").select("cosmetic_key").eq("user_id", user.id);
      const cosmetic = rollCosmeticDrop({
        category: recipe.category,
        rarity: rarity.key,
        unlockedKeys: (unlocked || []).map((u) => u.cosmetic_key),
      });
      if (cosmetic) {
        await supabase.from("user_cosmetics").insert({ user_id: user.id, cosmetic_key: cosmetic.key });
      }

      setDrop({ rarity, cosmetic });
    } catch {
      setLogError("Couldn't log that cook. Try again.");
    }
    setLogging(false);
  };

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
        <div className="mt-3 flex items-center gap-4 text-xs">
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
          <button
            type="button"
            onClick={handleCook}
            disabled={logging}
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {logging ? <Loader2 className="w-3 h-3 animate-spin" /> : <Flame className="w-3 h-3" />}
            I cooked this
          </button>
        </div>
        {logError && <p className="mt-2 text-xs text-destructive">{logError}</p>}
        {drop && (
          <div
            className={cn(
              "mt-3 space-y-1 rounded-lg border border-border px-3 py-2 text-sm",
              drop.rarity.bgClass,
              drop.rarity.holo && "avatar-holo"
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn("font-semibold", drop.rarity.textClass)}>{drop.rarity.label} drop!</span>
              <span className="text-muted-foreground">+{drop.rarity.xp} XP</span>
            </div>
            {drop.cosmetic && (
              <p className="text-xs text-muted-foreground">
                Unlocked <span className={cn("font-medium", drop.rarity.textClass)}>{drop.cosmetic.label}</span> for your
                character
              </p>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
