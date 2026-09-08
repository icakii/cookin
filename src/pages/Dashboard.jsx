import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FlameMark from "@/components/FlameMark";
import { LogOut, Plus, Trash2, Loader2 } from "lucide-react";

const CATEGORIES = [
  "Produce",
  "Protein",
  "Dairy",
  "Grains & Pasta",
  "Pantry",
  "Spices & Condiments",
  "Frozen",
  "Other",
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", quantity: "", unit: "", category: CATEGORIES[0] });

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("pantry_items")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError) setError(fetchError.message);
        else setItems(data);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setAdding(true);
    setError("");
    const { data, error: insertError } = await supabase
      .from("pantry_items")
      .insert({
        user_id: user.id,
        name: form.name.trim(),
        quantity: form.quantity ? Number(form.quantity) : null,
        unit: form.unit.trim() || null,
        category: form.category,
      })
      .select()
      .single();
    setAdding(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setItems((prev) => [data, ...prev]);
    setForm({ name: "", quantity: "", unit: "", category: CATEGORIES[0] });
  };

  const handleDelete = async (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    const { error: deleteError } = await supabase.from("pantry_items").delete().eq("id", id);
    if (deleteError) setError(deleteError.message);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <FlameMark className="h-8 w-8" />
          <span className="font-display text-lg font-bold tracking-tight">Cookin'</span>
        </div>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="w-4 h-4" />
          Log out
        </Button>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-2xl font-bold tracking-tight">Pantry</h1>
        <p className="mt-1 text-sm text-muted-foreground">What's actually in your kitchen right now.</p>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        <form
          onSubmit={handleAdd}
          className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-5"
        >
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="item-name">Item</Label>
            <Input
              id="item-name"
              placeholder="e.g. Chicken thighs"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="item-quantity">Quantity</Label>
            <Input
              id="item-quantity"
              type="number"
              min="0"
              step="any"
              placeholder="500"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="item-unit">Unit</Label>
            <Input
              id="item-unit"
              placeholder="g, pcs, ml..."
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="item-category">Category</Label>
            <select
              id="item-category"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-card">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="col-span-2" disabled={adding}>
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add to pantry
          </Button>
        </form>

        <div className="mt-8 space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading pantry...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing in your pantry yet. Add your first item above.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      item.quantity ? `${item.quantity}${item.unit ? " " + item.unit : ""}` : null,
                      item.category,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${item.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
