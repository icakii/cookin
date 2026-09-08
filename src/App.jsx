import React from "react";
import FlameMark from "@/components/FlameMark";

const SWATCHES = [
  { name: "background", cls: "bg-background border border-border" },
  { name: "card", cls: "bg-card" },
  { name: "primary", cls: "bg-primary" },
  { name: "accent", cls: "bg-accent" },
  { name: "gold", cls: "bg-gold" },
];

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
        <FlameMark className="h-20 w-20" />
        <h1 className="mt-8 font-display text-5xl font-bold tracking-tight">Cookin'</h1>
        <p className="mt-4 max-w-md text-lg text-muted-foreground">
          Real meals you actually make, turned into rank, rarity, and a collection worth showing off.
        </p>

        <div className="mt-14 flex items-center gap-3">
          {SWATCHES.map((s) => (
            <div key={s.name} className="flex flex-col items-center gap-2">
              <div className={`h-10 w-10 rounded-full ${s.cls}`} />
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {s.name}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-14 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Identity locked. Next: pantry, recipes, ranks.
        </p>
      </div>
    </div>
  );
}
