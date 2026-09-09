import React from "react";
import { STARTERS, getCosmetic } from "@/lib/cosmetics";

const SKIN = "#caa27a";

function resolve(equipped, slot) {
  const key = equipped?.[slot];
  if (key) return getCosmetic(key);
  return STARTERS[slot] || null;
}

function Hair({ visual }) {
  if (visual.variant === "flame") {
    return (
      <polygon points="60,2 48,16 52,30 60,34 68,30 72,16" fill={visual.color} />
    );
  }
  return <circle cx="60" cy="12" r="9" fill={visual.color} />;
}

function Glasses({ visual }) {
  if (visual.variant === "shades") {
    return <rect x="44" y="30" width="32" height="9" rx="3" fill={visual.color} />;
  }
  return (
    <g fill="none" stroke={visual.color} strokeWidth="2.5">
      <circle cx="51" cy="34" r="6" />
      <circle cx="69" cy="34" r="6" />
      <line x1="57" y1="34" x2="63" y2="34" />
    </g>
  );
}

function Jacket({ visual }) {
  if (visual.variant === "apron") {
    return (
      <g fill={visual.color}>
        <rect x="40" y="70" width="40" height="48" rx="6" opacity="0.92" />
        <rect x="52" y="58" width="16" height="14" rx="3" opacity="0.92" />
      </g>
    );
  }
  if (visual.variant === "coat") {
    return (
      <g fill={visual.color}>
        <polygon points="34,62 48,62 42,120 30,120" />
        <polygon points="86,62 72,62 78,120 90,120" />
      </g>
    );
  }
  // cloak (mythic)
  return (
    <g fill={visual.color} opacity="0.9">
      <polygon points="30,58 90,58 96,128 60,116 24,128" />
    </g>
  );
}

function Shirt({ visual }) {
  return (
    <g>
      <rect x="32" y="58" width="56" height="66" rx="16" fill={visual.color} />
      {visual.variant === "stripes" && (
        <g stroke="#f4f1ea" strokeWidth="3" opacity="0.8">
          <line x1="34" y1="74" x2="86" y2="74" />
          <line x1="34" y1="88" x2="86" y2="88" />
          <line x1="34" y1="102" x2="86" y2="102" />
        </g>
      )}
    </g>
  );
}

function Pants({ visual }) {
  return (
    <g fill={visual.color}>
      <rect x="38" y="124" width="18" height="54" rx="8" />
      <rect x="64" y="124" width="18" height="54" rx="8" />
      {visual.variant === "cargo" && (
        <g fill="#00000022">
          <rect x="40" y="148" width="12" height="14" rx="2" />
          <rect x="68" y="148" width="12" height="14" rx="2" />
        </g>
      )}
    </g>
  );
}

function Feet({ visual }) {
  if (!visual) {
    return (
      <g fill={SKIN}>
        <ellipse cx="47" cy="182" rx="9" ry="5" />
        <ellipse cx="73" cy="182" rx="9" ry="5" />
      </g>
    );
  }
  if (visual.variant === "boots") {
    return (
      <g fill={visual.color}>
        <rect x="38" y="168" width="18" height="18" rx="4" />
        <rect x="64" y="168" width="18" height="18" rx="4" />
      </g>
    );
  }
  if (visual.variant === "clogs") {
    return (
      <g fill={visual.color}>
        <ellipse cx="47" cy="182" rx="11" ry="6" />
        <ellipse cx="73" cy="182" rx="11" ry="6" />
      </g>
    );
  }
  // sandals
  return (
    <g>
      <ellipse cx="47" cy="182" rx="10" ry="5" fill={SKIN} />
      <ellipse cx="73" cy="182" rx="10" ry="5" fill={SKIN} />
      <g stroke={visual.color} strokeWidth="2">
        <line x1="42" y1="178" x2="52" y2="178" />
        <line x1="68" y1="178" x2="78" y2="178" />
      </g>
    </g>
  );
}

function Accessory({ visual }) {
  if (visual.variant === "toque") {
    return (
      <g fill={visual.color}>
        <rect x="46" y="-6" width="28" height="16" rx="4" />
        <ellipse cx="60" cy="-6" rx="14" ry="8" />
      </g>
    );
  }
  // spatula, held beside the right hand
  return (
    <g stroke={visual.color} strokeWidth="3" fill="none" strokeLinecap="round">
      <line x1="94" y1="90" x2="94" y2="112" />
      <rect x="88" y="80" width="12" height="12" rx="2" fill={visual.color} stroke="none" />
    </g>
  );
}

export default function Avatar({ equipped, size = 160, className, idle = true }) {
  const hair = resolve(equipped, "hair");
  const glasses = resolve(equipped, "glasses");
  const jacket = resolve(equipped, "jacket");
  const shirt = resolve(equipped, "shirt");
  const pants = resolve(equipped, "pants");
  const shoes = resolve(equipped, "shoes");
  const accessory = resolve(equipped, "accessory");

  return (
    <svg viewBox="0 0 120 200" width={size} height={(size * 200) / 120} className={className} role="img" aria-label="Your character">
      <g className={idle ? "avatar-idle" : undefined}>
        {/* arms */}
        <g fill={SKIN}>
          <rect x="16" y="66" width="15" height="50" rx="7" />
          <rect x="89" y="66" width="15" height="50" rx="7" />
        </g>
        {pants && <Pants visual={pants.visual} />}
        {shirt && <Shirt visual={shirt.visual} />}
        {jacket && (
          <g className={jacket.rarity === "mythic" ? "avatar-holo" : undefined}>
            <Jacket visual={jacket.visual} />
          </g>
        )}
        {/* head */}
        <circle cx="60" cy="34" r="24" fill={SKIN} />
        {glasses && <Glasses visual={glasses.visual} />}
        {hair && (
          <g className={hair.rarity === "mythic" ? "avatar-holo" : undefined}>
            <Hair visual={hair.visual} />
          </g>
        )}
        <Feet visual={shoes?.visual} />
        {accessory && (
          <g className={accessory.rarity === "mythic" ? "avatar-holo" : undefined}>
            <Accessory visual={accessory.visual} />
          </g>
        )}
      </g>
    </svg>
  );
}
