import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

vi.mock("next/font/google", () => ({
  Jomhuria: () => ({ variable: "--font-jomhuria" }),
  Inter: () => ({ variable: "--font-inter" }),
}));

const { metadata } = await import("@/app/layout");

const ROOT = path.resolve(__dirname, "../..");

interface OpenGraphLike {
  type?: string;
  siteName?: string;
  title?: string;
  description?: string;
}

interface TwitterLike {
  card?: string;
}

describe("site config", () => {
  it("uses the trusted production origin, not a request-derived value", () => {
    expect(SITE_URL).toBe("https://www.sodoit.cc");
  });

  it("exposes a non-empty brand name, title, and description", () => {
    expect(SITE_NAME.length).toBeGreaterThan(0);
    expect(SITE_TITLE.length).toBeGreaterThan(0);
    expect(SITE_DESCRIPTION.length).toBeGreaterThan(0);
  });
});

describe("root layout metadata", () => {
  it("resolves metadataBase to the trusted production origin", () => {
    expect(metadata.metadataBase?.toString()).toBe(`${SITE_URL}/`);
  });

  it("sets a default title and a template that appends the brand", () => {
    const title = metadata.title as { default: string; template: string };
    expect(title.default).toBe(SITE_TITLE);
    expect(title.template).toBe(`%s | ${SITE_NAME}`);
  });

  it("sets the homepage canonical to the root path", () => {
    expect(metadata.alternates?.canonical).toBe("/");
  });

  it("sets Open Graph defaults consistent with the site config", () => {
    const openGraph = metadata.openGraph as OpenGraphLike;
    expect(openGraph.siteName).toBe(SITE_NAME);
    expect(openGraph.title).toBe(SITE_TITLE);
    expect(openGraph.description).toBe(SITE_DESCRIPTION);
    expect(openGraph.type).toBe("website");
  });

  it("does not claim a large social image card without a real OG image asset", () => {
    const twitter = metadata.twitter as TwitterLike;
    expect(twitter.card).not.toBe("summary_large_image");
  });

  it("no longer references the missing /favicon.png path", () => {
    const source = fs.readFileSync(
      path.join(ROOT, "app/layout.tsx"),
      "utf-8",
    );
    expect(source).not.toMatch(/favicon\.png/);
  });
});

describe("favicon assets", () => {
  it("app/favicon.ico exists and is a valid ICO file", () => {
    const filePath = path.join(ROOT, "app/favicon.ico");
    expect(fs.existsSync(filePath)).toBe(true);
    const buffer = fs.readFileSync(filePath);
    expect(buffer.readUInt16LE(0)).toBe(0);
    expect(buffer.readUInt16LE(2)).toBe(1);
  });

  it("app/icon.png exists and is a valid PNG file", () => {
    const filePath = path.join(ROOT, "app/icon.png");
    expect(fs.existsSync(filePath)).toBe(true);
    const buffer = fs.readFileSync(filePath);
    expect(buffer.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  });

  it("public/favicon.png does not exist, so no stale reference can 404", () => {
    expect(fs.existsSync(path.join(ROOT, "public/favicon.png"))).toBe(false);
  });
});
