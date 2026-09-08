import React from "react";

export default function FlameMark({ className = "h-8 w-8" }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <rect x="0" y="0" width="100" height="100" rx="22" fill="hsl(24 20% 9%)" />
      <polygon points="52,18 38,30 26,48 32,66 42,82 46,86 50,84 46,50" fill="hsl(14 62% 45%)" />
      <polygon points="52,18 46,50 50,84 54,86 58,82 60,68 70,50 62,35" fill="hsl(32 75% 55%)" />
      <polygon points="52,18 46,30 56,28" fill="hsl(42 85% 68%)" />
    </svg>
  );
}
