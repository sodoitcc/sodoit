import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const content = readFileSync(
  join(process.cwd(), "public/llms.txt"),
  "utf-8",
);

describe("llms.txt", () => {
  it("does not reference admin/settings/auth/internal routes", () => {
    for (const term of [
      "/admin",
      "/settings",
      "/login",
      "/signup",
      "/api/",
      "service_role",
      "supabase.co",
    ]) {
      expect(content).not.toContain(term);
    }
  });

  it("does not contain an email address", () => {
    expect(content).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  });

  it("does not claim unsupported capabilities", () => {
    for (const term of [
      "real-time",
      "realtime",
      "editorial review",
      "API access",
      "license",
      "licensing",
    ]) {
      expect(content.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });

  it("documents the real public route patterns", () => {
    expect(content).toContain("https://www.sodoit.cc/");
    expect(content).toContain("https://www.sodoit.cc/discovery");
    expect(content).toContain("https://www.sodoit.cc/guides");
    expect(content).toContain("https://www.sodoit.cc/u/{username}");
  });
});
