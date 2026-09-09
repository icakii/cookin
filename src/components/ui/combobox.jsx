import React, { useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function Combobox({ id, value, onChange, options, placeholder, ...props }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const closeTimeout = useRef(null);

  const filtered = useMemo(() => {
    const needle = value.trim().toLowerCase();
    if (!needle) return options.slice(0, 150);
    const startsWith = [];
    const includes = [];
    for (const opt of options) {
      const lower = opt.toLowerCase();
      if (lower.startsWith(needle)) startsWith.push(opt);
      else if (lower.includes(needle)) includes.push(opt);
    }
    return [...startsWith, ...includes].slice(0, 150);
  }, [value, options]);

  const select = (opt) => {
    onChange(opt);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && filtered[highlight]) {
      e.preventDefault();
      select(filtered[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          closeTimeout.current = setTimeout(() => setOpen(false), 100);
        }}
        onKeyDown={handleKeyDown}
        {...props}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-input bg-card shadow-soft-lg">
          {filtered.map((opt, i) => (
            <li key={opt}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  clearTimeout(closeTimeout.current);
                  select(opt);
                }}
                className={cn(
                  "block w-full px-3 py-1.5 text-left text-sm",
                  i === highlight ? "bg-secondary text-foreground" : "text-foreground hover:bg-secondary"
                )}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
