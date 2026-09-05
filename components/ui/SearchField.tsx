"use client";

import { Search } from "lucide-react";
import { useEffect, useRef } from "react";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  name?: string;
  className?: string;
  size?: "default" | "large";
  enableShortcut?: boolean;
}

export function SearchField({
  value,
  onChange,
  placeholder = "Search experiences...",
  label = "Search",
  name,
  className = "",
  size = "default",
  enableShortcut = true,
}: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!enableShortcut) return;

    function focusSearch(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", focusSearch);

    return () => {
      window.removeEventListener("keydown", focusSearch);
    };
  }, [enableShortcut]);

  const heightClass = size === "large" ? "h-12 sm:h-[52px]" : "h-10";
  const iconClass = size === "large" ? "h-[18px] w-[18px]" : "h-4 w-4";

  return (
    <label className={`relative block w-full ${className}`}>
      <span className="sr-only">{label}</span>

      <Search
        aria-hidden="true"
        className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted ${iconClass}`}
      />

      <input
        ref={inputRef}
        type="search"
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        aria-keyshortcuts={enableShortcut ? "Meta+K Control+K" : undefined}
        className={[
          heightClass,
          "w-full rounded-control border border-border bg-surface",
          "pl-11 pr-4 text-ink",
          size === "large" ? "text-[15px]" : "text-sm",
          "placeholder:text-muted",
          "transition-colors",
          "hover:border-border-strong",
          "focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/15",
        ].join(" ")}
      />
    </label>
  );
}
