import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Trash2, Loader2, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

const emptyIngredient = () => ({ name: "", quantity: "", unit: "" });

function matches(ingredientName, pantryNames) {
  const needle = ingredientName.trim().toLowerCase();
  if (!needle) return false;
  return pantryNames.some((p) => p.includes(needle) || needle.includes(p));
}

export default function Recipes() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [pantryNames, setPantryNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", instructions: "", ingredients: [emptyIngredient()] });

  const loadData = async () => {
    const [{ data: recipeData, error: recipeError }, { data: pantryData, error: pantryError }] =
      await Promise.all([
        supabase
          .from("recipes")
          .select("*, recipe_ingredients(*)")
          .order("created_at", { ascending: false }),
        supabase.from("pantry_items").select("name"),
      ]);
    if (recipeError) setError(recipeError.message);
    else if (pantryError) setError(pantryError.message);
    else {
      setRecipes(recipeData);
      setPantryNames(pantryData.map((p) => p.name.trim().toLowerCase()));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateIngredient = (index, field, value) => {
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing)),
    }));
  };

  const addIngredientRow = () => {
    setForm((f) => ({ ...f, ingredients: [...f.ingredients, emptyIngredient()] }));
  };

  const removeIngredientRow = (index) => {
    setForm((f) => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== index) }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const ingredients = form.ingredients.filter((ing) => ing.name.trim());
    if (!form.title.trim() || ingredients.length === 0) return;
    setSaving(true);
    setError("");

    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({ user_id: user.id, title: form.title.trim(), instructions: form.instructions.trim() || null })
      .select()
      .single();

    if (recipeError) {
      setSaving(false);
      setError(recipeError.message);
      return;
    }

    const { error: ingredientsError } = await supabase.from("recipe_ingredients").insert(
      ingredients.map((ing) => ({
        recipe_id: recipe.id,
        name: ing.name.trim(),
        quantity: ing.quantity ? Number(ing.quantity) : null,
        unit: ing.unit.trim() || null,
      }))
    );

    setSaving(false);
    if (ingredientsError) {
      setError(ingredientsError.message);
      return;
    }

    setForm({ title: "", instructions: "", ingredients: [emptyIngredient()] });
    loadData();
  };

  const handleDelete = async (id) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    const { error: deleteError } = await supabase.from("recipes").delete().eq("id", id);
    if (deleteError) setError(deleteError.message);
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-2xl font-bold tracking-tight">Recipes</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        See what you can already make with what's in your pantry.
      </p>

      {error && <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      <form onSubmit={handleAdd} className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="space-y-1.5">
          <Label htmlFor="recipe-title">Recipe name</Label>
          <Input
            id="recipe-title"
            placeholder="e.g. Chicken stir fry"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Ingredients</Label>
          {form.ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="Ingredient"
                value={ing.name}
                onChange={(e) => updateIngredient(i, "name", e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="Qty"
                value={ing.quantity}
                onChange={(e) => updateIngredient(i, "quantity", e.target.value)}
                className="w-20"
              />
              <Input
                placeholder="Unit"
                value={ing.unit}
                onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                className="w-20"
              />
              <button
                type="button"
                onClick={() => removeIngredientRow(i)}
                disabled={form.ingredients.length === 1}
                className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                aria-label="Remove ingredient"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addIngredientRow}>
            <Plus className="w-4 h-4" />
            Add ingredient
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="recipe-instructions">Instructions (optional)</Label>
          <textarea
            id="recipe-instructions"
            placeholder="How you make it..."
            value={form.instructions}
            onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
            rows={3}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChefHat className="w-4 h-4" />}
          Save recipe
        </Button>
      </form>

      <div className="mt-8 space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading recipes...</p>
        ) : recipes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recipes yet. Add your first one above.</p>
        ) : (
          recipes.map((recipe) => {
            const total = recipe.recipe_ingredients.length;
            const have = recipe.recipe_ingredients.filter((ing) => matches(ing.name, pantryNames)).length;
            const canMake = total > 0 && have === total;
            return (
              <details key={recipe.id} className="rounded-xl border border-border bg-card px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between">
                  <span className="font-medium">{recipe.title}</span>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        canMake ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {have}/{total} you have
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(recipe.id);
                      }}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${recipe.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </summary>
                <ul className="mt-3 space-y-1 text-sm">
                  {recipe.recipe_ingredients.map((ing) => (
                    <li
                      key={ing.id}
                      className={matches(ing.name, pantryNames) ? "text-foreground" : "text-muted-foreground"}
                    >
                      {matches(ing.name, pantryNames) ? "✓" : "✗"} {ing.name}
                      {ing.quantity ? ` — ${ing.quantity}${ing.unit ? " " + ing.unit : ""}` : ""}
                    </li>
                  ))}
                </ul>
                {recipe.instructions && (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{recipe.instructions}</p>
                )}
              </details>
            );
          })
        )}
      </div>
    </div>
  );
}
