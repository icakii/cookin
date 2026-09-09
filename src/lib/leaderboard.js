import { supabase } from "@/lib/supabaseClient";
import { effectiveTier } from "@/lib/ranks";

// Sums every player's cook_logs XP client-side and ranks them. Cook logs are
// publicly readable (supabase/003_profiles.sql) specifically for this. Fine
// at indie-app scale; if the row count ever gets large this should move to
// a Postgres view that aggregates server-side instead.
async function rankedTop500() {
  const { data: logs, error: logsError } = await supabase.from("cook_logs").select("user_id, xp").limit(20000);
  if (logsError) throw logsError;

  const totals = new Map();
  for (const log of logs) {
    totals.set(log.user_id, (totals.get(log.user_id) || 0) + log.xp);
  }

  const top500 = [...totals.entries()]
    .map(([userId, xp]) => ({ userId, xp }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 500);

  if (top500.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username")
    .in(
      "id",
      top500.map((r) => r.userId)
    );
  if (profilesError) throw profilesError;

  const usernames = new Map(profiles.map((p) => [p.id, p.username]));

  // Everyone in this array is, by construction, in the global top 500 - so
  // effectiveTier can award Legend to whoever among them has hit Champion.
  return top500.map((r, i) => ({
    ...r,
    position: i + 1,
    username: usernames.get(r.userId) || "A cook",
    tier: effectiveTier(r.xp, true),
  }));
}

export async function fetchLeaderboard({ limit = 500 } = {}) {
  const top500 = await rankedTop500();
  return top500.slice(0, limit);
}

export async function getUserTotalXp(userId) {
  const { data, error } = await supabase.from("cook_logs").select("xp").eq("user_id", userId);
  if (error) throw error;
  return data.reduce((sum, log) => sum + log.xp, 0);
}

export async function computeGlobalStanding(userId) {
  const top500 = await rankedTop500();
  const mine = top500.find((r) => r.userId === userId) || null;
  return { top500, mine };
}
