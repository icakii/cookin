import { supabase } from "@/lib/supabaseClient";

function defaultUsername(user) {
  const local = (user.email || "cook").split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 16) || "cook";
  return `${local}_${user.id.slice(0, 4)}`;
}

// Called after login so every user has a profile row (username, equipped
// loadout) to back the leaderboard and avatar - falls back to null on a
// username collision, which Profile.jsx surfaces as an editable field.
export async function ensureProfile(user) {
  if (!user) return null;
  const { data: existing } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (existing) return existing;
  const { data } = await supabase
    .from("profiles")
    .insert({ id: user.id, username: defaultUsername(user) })
    .select()
    .single();
  return data || null;
}

export async function updateProfile(userId, patch) {
  const { data, error } = await supabase.from("profiles").update(patch).eq("id", userId).select().single();
  if (error) throw error;
  return data;
}
