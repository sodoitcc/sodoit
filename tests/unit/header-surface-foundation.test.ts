import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Header structure", () => {
  const source = read("components/layout/Header.tsx");

  it("is sticky, white/surface background, no default shadow", () => {
    expect(source).toMatch(/sticky top-0/);
    expect(source).toMatch(/bg-surface/);
    expect(source).not.toMatch(/shadow-(?!\[0_12px_30px)/);
  });

  it("renders the logo, primary nav, and account actions", () => {
    expect(source).toContain("<Logo");
    expect(source).toContain('aria-label="Primary navigation"');
    expect(source).toContain("Avatar");
  });

  it("keeps interactive targets at least 44px", () => {
    expect(source).toMatch(/min-h-11|h-11|h-12|h-14/);
  });

  it("uses a subtle underline indicator for the active nav item, not a filled pill", () => {
    expect(source).toMatch(/bg-accent-wash text-accent-dark|scale-x-100/);
    expect(source).not.toMatch(
      /rounded-pill bg-accent(?!\/)[^"]*"[^>]*>\s*\{item\.label\}/,
    );
  });

  it("supports Escape to close the mobile menu", () => {
    expect(source).toMatch(/event\.key === "Escape"/);
  });

  it("has no dependency on Browse-specific search state or components", () => {
    expect(source).not.toMatch(/SearchField|BrowseToolbar|useSearchParams/);
  });
});

describe("Global app shell", () => {
  const source = read("app/(app)/layout.tsx");

  it("uses min-h-dvh flex column with Header first and Footer last", () => {
    expect(source).toMatch(/min-h-dvh flex flex-col|flex min-h-dvh flex-col/);
    const headerIndex = source.indexOf("<Header");
    const mainIndex = source.indexOf("<main");
    const footerIndex = source.indexOf("<Footer");
    expect(headerIndex).toBeGreaterThan(-1);
    expect(mainIndex).toBeGreaterThan(headerIndex);
    expect(footerIndex).toBeGreaterThan(mainIndex);
  });

  it("main is flex-1, not a fixed min-h-screen", () => {
    expect(source).toMatch(/<main className="flex-1"/);
  });

  it("does not reserve global bottom padding for a nonexistent persistent bottom nav", () => {
    expect(source).not.toMatch(/pb-\[calc\(4rem/);
  });

  it("preserves safe-area handling", () => {
    expect(source).toContain("env(safe-area-inset-bottom)");
  });
});

describe("Auth and marketing shells use min-h-dvh", () => {
  it("auth layout", () => {
    expect(read("app/(auth)/layout.tsx")).toContain("min-h-dvh");
  });

  it("marketing layout", () => {
    expect(read("app/(marketing)/layout.tsx")).toContain("min-h-dvh");
  });
});

describe("Global surface token", () => {
  it("background token is white, not a beige/gray default", () => {
    const css = read("app/globals.css");
    expect(css).toMatch(/--color-background:\s*#ffffff;/);
  });
});

describe("Logo", () => {
  const source = read("components/ui/Logo.tsx");

  it("has a fixed intrinsic box to avoid layout shift", () => {
    expect(source).toMatch(/width: dimensions\.width/);
    expect(source).toMatch(/height: dimensions\.height/);
  });

  it("has an accessible name", () => {
    expect(source).toMatch(/alt="Sodoit"/);
  });
});
