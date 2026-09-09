import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { RARITIES, rarityByKey, rankProgress, effectiveTier, LEGEND_TIER } from "@/lib/ranks";
import { fetchLeaderboard, computeGlobalStanding } from "@/lib/leaderboard";
import { Loader2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

function ProgressTab({ logs, tier }) {
  const totalXp = logs.reduce((sum, l) => sum + l.xp, 0);
  const { next, percent, xpToNext } = rankProgress(totalXp);
  const tally = RARITIES.map((r) => ({
    ...r,
    count: logs.filter((l) => l.rarity === r.key).length,
  }));

  return (
    <>
      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-baseline justify-between">
          <span className={cn("font-display text-xl font-bold", tier.tierClass)}>{tier.name}</span>
          <span className="text-xs text-muted-foreground">{totalXp} XP total</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {next ? `${xpToNext} XP to ${next.name}` : "Max fixed rank reached - stay in the global top 500 for Legend"}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {tally.map((r) => (
          <div key={r.key} className={cn("rounded-xl border border-border bg-card p-3 text-center", r.holo && "avatar-holo")}>
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
                      <img src={log.meal_thumbnail} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                    )}
                    <div>
                      <p className="font-medium">{log.meal_title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(log.cooked_at).toLocaleDateString()}</p>
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
  );
}

function LeaderboardTab({ userId }) {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchLeaderboard({ limit: 100 })
      .then((data) => !cancelled && setBoard(data))
      .catch(() => !cancelled && setError("Couldn't load the leaderboard."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading the leaderboard...
      </div>
    );
  }
  if (error) return <div className="mt-6 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>;
  if (board.length === 0) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">
        No one's on the board yet - cook something and be the first.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-1.5">
      <p className="mb-2 text-xs text-muted-foreground">
        Top {board.length} by XP. Reach Champion while in the global top 500 to earn{" "}
        <span className={LEGEND_TIER.tierClass}>Legend</span>.
      </p>
      {board.map((entry) => (
        <div
          key={entry.userId}
          className={cn(
            "flex items-center justify-between rounded-xl border px-4 py-2.5",
            entry.userId === userId ? "border-primary bg-primary/5" : "border-border bg-card"
          )}
        >
          <div className="flex items-center gap-3">
            <span className="w-8 shrink-0 text-sm font-semibold text-muted-foreground">#{entry.position}</span>
            <span className="font-medium">{entry.username}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn("text-sm font-semibold", entry.tier.tierClass)}>{entry.tier.name}</span>
            <span className="text-xs text-muted-foreground">{entry.xp} XP</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Ranks() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [tier, setTier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("progress");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: fetchError } = await supabase
        .from("cook_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("cooked_at", { ascending: false });
      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }
      setLogs(data);
      const totalXp = data.reduce((sum, l) => sum + l.xp, 0);
      try {
        const { mine } = await computeGlobalStanding(user.id);
        if (!cancelled) setTier(mine ? mine.tier : effectiveTier(totalXp, false));
      } catch {
        if (!cancelled) setTier(effectiveTier(totalXp, false));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-2xl font-bold tracking-tight">Ranks</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every cook earns XP and a chance at a rare drop.</p>

      <div className="mt-5 flex gap-1 rounded-lg bg-secondary p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setTab("progress")}
          className={cn("flex-1 rounded-md py-1.5 transition-colors", tab === "progress" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground")}
        >
          Progress
        </button>
        <button
          type="button"
          onClick={() => setTab("leaderboard")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 transition-colors",
            tab === "leaderboard" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
          )}
        >
          <Trophy className="h-3.5 w-3.5" />
          Leaderboard
        </button>
      </div>

      {error && <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      {tab === "progress" ? (
        loading || !tier ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading your progress...
          </div>
        ) : (
          <ProgressTab logs={logs} tier={tier} />
        )
      ) : (
        <LeaderboardTab userId={user.id} />
      )}
    </div>
  );
}
