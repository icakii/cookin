import React, { useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { updateProfile } from "@/lib/profile";
import { checkImageSafety } from "@/lib/nsfw";
import { Camera, Loader2, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;

export default function ProfilePicture({ userId, avatarUrl, onUploaded, size = 80 }) {
  const [status, setStatus] = useState("idle"); // idle | checking | uploading | error
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const busy = status === "checking" || status === "uploading";

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("That's not an image file.");
      setStatus("error");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 5MB.");
      setStatus("error");
      return;
    }

    setError("");
    setStatus("checking");
    try {
      const { safe } = await checkImageSafety(file);
      if (!safe) {
        setError("That image didn't pass our content check - try a different photo.");
        setStatus("error");
        return;
      }

      setStatus("uploading");
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${userId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      await updateProfile(userId, { avatar_url: publicUrl });
      onUploaded(publicUrl);
      setStatus("idle");
    } catch {
      setError("Couldn't upload that image. Try again.");
      setStatus("error");
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="group relative shrink-0 overflow-hidden rounded-full border-2 border-border bg-secondary"
        style={{ width: size, height: size }}
        aria-label="Change profile picture"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <UserRound className="h-1/2 w-1/2" />
          </div>
        )}
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity",
            busy ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {error && <p className="mt-1 max-w-[12rem] text-xs text-destructive">{error}</p>}
    </div>
  );
}
