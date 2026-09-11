import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { updateProfile } from "@/lib/profile";
import { getUserTotalXp, computeGlobalStanding } from "@/lib/leaderboard";
import { rankProgress, effectiveTier, rarityByKey, RARITIES } from "@/lib/ranks";
import { SLOTS, STARTERS, COSMETICS, cosmeticsForSlot } from "@/lib/cosmetics";
import Avatar from "@/components/Avatar";
import ProfilePicture from "@/components/ProfilePicture";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Loader2, Bell, BellOff, Lock, Pencil, Check, Shirt } from "lucide-react";
import { cn } from "@/lib/utils";

const SLOT_LABELS = {
  hair: "Hair",
  glasses: "Glasses",
  jacket: "Jacket",
  shirt: "Shirt",
  pants: "Pants",
  shoes: "Shoes",
  accessory: "Accessory",
};

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [unlockedKeys, setUnlockedKeys] = useState([]);
  const [tier, setTier] = useState(null);
  const [totalXp, setTotalXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [closetOpen, setClosetOpen] = useState(false);

  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  const [savingNotifications, setSavingNotifications] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }
      setProfile(profileData);
      setUsernameDraft(profileData?.username || "");

      const { data: unlocked } = await supabase.from("user_cosmetics").select("cosmetic_key").eq("user_id", user.id);
      if (!cancelled) setUnlockedKeys((unlocked || []).map((u) => u.cosmetic_key));

      const xp = await getUserTotalXp(user.id);
      const { mine } = await computeGlobalStanding(user.id);
      if (!cancelled) {
        setTotalXp(xp);
        setTier(mine ? mine.tier : effectiveTier(xp, false));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const saveUsername = async () => {
    const next = usernameDraft.trim();
    if (!next || next === profile.username) {
      setEditingUsername(false);
      setUsernameDraft(profile?.username || "");
      return;
    }
    setSavingUsername(true);
    setUsernameError("");
    try {
      const updated = await updateProfile(user.id, { username: next });
      setProfile(updated);
      setEditingUsername(false);
    } catch {
      setUsernameError("That username is taken. Try another.");
    }
    setSavingUsername(false);
  };

  const toggleNotifications = async () => {
    setSavingNotifications(true);
    const next = !profile.notifications_enabled;
    try {
      if (next && "Notification" in window) {
        await Notification.requestPermission();
      }
      const updated = await updateProfile(user.id, { notifications_enabled: next });
      setProfile(updated);
    } catch {
      setError("Couldn't update notification settings.");
    }
    setSavingNotifications(false);
  };

  const equip = async (slot, key) => {
    const nextEquipped = { ...profile.equipped, [slot]: key };
    if (!key) delete nextEquipped[slot];
    const previous = profile.equipped;
    setProfile((p) => ({ ...p, equipped: nextEquipped }));
    try {
      await updateProfile(user.id, { equipped: nextEquipped });
    } catch {
      setProfile((p) => ({ ...p, equipped: previous }));
      setError("Couldn't equip that item.");
    }
  };

  if (loading || !profile) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading your profile...
        </div>
      </div>
    );
  }

  const { next, percent, xpToNext } = rankProgress(totalXp);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-2xl font-bold tracking-tight">Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your character, your callsign, your settings.</p>

      {error && <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Row 1, left: profile picture, username, rank + XP */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <ProfilePicture
              userId={user.id}
              avatarUrl={profile.avatar_url}
              onUploaded={(url) => setProfile((p) => ({ ...p, avatar_url: url }))}
            />
            <div className="min-w-0 flex-1">
              {editingUsername ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Input
                      autoFocus
                      value={usernameDraft}
                      onChange={(e) => setUsernameDraft(e.target.value)}
                      maxLength={24}
                      className="h-9"
                    />
                    <button
                      type="button"
                      onClick={saveUsername}
                      disabled={savingUsername}
                      className="shrink-0 rounded-md bg-primary p-2 text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    >
                      {savingUsername ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                  </div>
                  {usernameError && <p className="text-xs text-destructive">{usernameError}</p>}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingUsername(true)}
                  className="group flex items-center gap-2 font-display text-lg font-bold tracking-tight"
                >
                  <span className="truncate">{profile.username}</span>
                  <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              )}
              {tier && <p className={cn("mt-0.5 text-sm font-semibold", tier.tierClass)}>{tier.name}</p>}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between text-xs text-muted-foreground">
              <span>{totalXp} XP</span>
              <span>{next ? `${xpToNext} to ${next.name}` : "Top fixed rank"}</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>

        {/* Row 1, right: character, with the closet trigger spaced above it */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Your character</p>
            <button
              type="button"
              onClick={() => setClosetOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              <Shirt className="h-3.5 w-3.5" />
              Customize
            </button>
          </div>
          <div className="mt-2 flex justify-center">
            <Avatar equipped={profile.equipped} size={190} />
          </div>
        </div>
      </div>

      {/* Row 2 onward: full width */}
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          {profile.notifications_enabled ? (
            <Bell className="h-5 w-5 text-primary" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">Notifications</p>
            <p className="text-xs text-muted-foreground">Rank-ups and rare drops</p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleNotifications}
          disabled={savingNotifications}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60",
            profile.notifications_enabled ? "bg-primary" : "bg-secondary"
          )}
          aria-pressed={profile.notifications_enabled}
          aria-label="Toggle notifications"
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-card shadow-soft transition-transform",
              profile.notifications_enabled ? "translate-x-5" : "translate-x-0.5"
            )}
          />
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {COSMETICS.length} cosmetics to find so far, {unlockedKeys.length} unlocked.
      </p>

      <Drawer open={closetOpen} onClose={() => setClosetOpen(false)} title="Closet">
        <div className="mb-6 grid grid-cols-5 gap-1.5">
          {RARITIES.map((r) => {
            const count = COSMETICS.filter((c) => c.rarity === r.key && unlockedKeys.includes(c.key)).length;
            const total = COSMETICS.filter((c) => c.rarity === r.key).length;
            return (
              <div key={r.key} className="rounded-lg border border-border bg-secondary/40 p-2 text-center">
                <p className={cn("text-sm font-bold", r.textClass)}>
                  {count}/{total}
                </p>
                <p className="text-[10px] text-muted-foreground">{r.label}</p>
              </div>
            );
          })}
        </div>
        <div className="space-y-6">
          {SLOTS.map((slot) => {
            const starter = STARTERS[slot];
            const items = [...(starter ? [{ ...starter, rarity: null, starter: true }] : []), ...cosmeticsForSlot(slot)];
            return (
              <div key={slot}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {SLOT_LABELS[slot]}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => equip(slot, null)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-medium",
                      !profile.equipped?.[slot] && !starter
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    None
                  </button>
                  {items.map((item) => {
                    const unlocked = item.starter || unlockedKeys.includes(item.key);
                    const equipped = (profile.equipped?.[slot] || starter?.key) === item.key;
                    const rarity = item.rarity ? rarityByKey(item.rarity) : null;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => equip(slot, item.key)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium",
                          !unlocked && "cursor-not-allowed opacity-50",
                          equipped ? "border-primary text-primary" : "border-border hover:bg-secondary",
                          rarity && unlocked && rarity.textClass
                        )}
                        title={unlocked ? item.label : `Locked - drops from a ${rarity?.label ?? ""} cook`}
                      >
                        {!unlocked && <Lock className="h-3 w-3" />}
                        {unlocked ? item.label : rarity?.label ?? "Locked"}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Drawer>
    </div>
  );
}
