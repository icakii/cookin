import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Animated replacement for a native <select> - same value/onChange contract,
// but the option panel opens/closes with the dropdown-panel keyframe in
// index.css instead of snapping instantly.
export function Select({ value, onChange, options, placeholder = "Select...", className, id }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const current = options.find((o) => (typeof o === "string" ? o === value : o.value === value));
  const label = current ? (typeof current === "string" ? current : current.label) : placeholder;

  const select = (opt) => {
    onChange(typeof opt === "string" ? opt : opt.value);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (options[highlight]) select(options[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className={cn("truncate text-left", !current && "text-muted-foreground")}>{label}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="dropdown-panel absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-input bg-card shadow-soft-lg">
          {options.map((opt, i) => {
            const optValue = typeof opt === "string" ? opt : opt.value;
            const optLabel = typeof opt === "string" ? opt : opt.label;
            return (
              <li key={optValue || `_empty_${i}`}>
                <button
                  type="button"
                  onClick={() => select(opt)}
                  onMouseEnter={() => setHighlight(i)}
                  className={cn(
                    "block w-full px-3 py-1.5 text-left text-sm",
                    i === highlight ? "bg-secondary text-foreground" : "text-foreground hover:bg-secondary",
                    optValue === value && "font-medium text-primary"
                  )}
                >
                  {optLabel}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
