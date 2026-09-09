import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { RARITIES, rarityByKey, rankProgress } from "@/lib/ranks";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Ranks() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("cook_logs")
      .select("*")
      .order("cooked_at", { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError) setError(fetchError.message);
        else setLogs(data);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalXp = logs.reduce((sum, l) => sum + l.xp, 0);
  const { current, next, percent, xpToNext } = rankProgress(totalXp);
  const tally = RARITIES.map((r) => ({
    ...r,
    count: logs.filter((l) => l.rarity === r.key).length,
  }));

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-2xl font-bold tracking-tight">Ranks</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every cook earns XP and a chance at a rare drop.</p>

      {error && <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading your progress...
        </div>
      ) : (
        <>
          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-xl font-bold text-primary">{current.name}</span>
              <span className="text-xs text-muted-foreground">{totalXp} XP total</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {next ? `${xpToNext} XP to ${next.name}` : "Max rank reached"}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tally.map((r) => (
              <div key={r.key} className="rounded-xl border border-border bg-card p-3 text-center">
                <p className={cn("text-lg font-bold", r.textClass)}>{r.count}</p>
                <p className="text-xs text-muted-foreground">{r.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-semibold text-muted-foreground">Cook history</h2>
            {logs.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Nothing logged yet. Mark a recipe as cooked to start earning XP.
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                {logs.map((log) => {
                  const rarity = rarityByKey(log.rarity);
                  return (
                    <div
                      key={log.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        {log.meal_thumbnail && (
                          <img
                            src={log.meal_thumbnail}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium">{log.meal_title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.cooked_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-sm font-semibold", rarity.textClass)}>{rarity.label}</p>
                        <p className="text-xs text-muted-foreground">+{log.xp} XP</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
