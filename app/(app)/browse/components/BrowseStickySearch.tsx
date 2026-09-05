"use client";

import { SearchField } from "@/components/ui/SearchField";

interface BrowseStickySearchProps {
  visible: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function BrowseStickySearch({
  visible,
  value,
  onChange,
}: BrowseStickySearchProps) {
  return (
    <div
      aria-hidden={!visible}
      className={[
        "fixed inset-x-0 top-16 z-50 border-b border-border bg-surface",
        "px-4 py-2 transition-opacity duration-150 lg:hidden",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
    >
      <SearchField
        value={value}
        onChange={onChange}
        placeholder="Search ticks..."
        label="Search ticks (sticky)"
        size="large"
        enableShortcut={visible}
        className="mx-auto max-w-[1440px]"
      />
    </div>
  );
}
