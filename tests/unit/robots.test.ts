import { describe, expect, it } from "vitest";
import robots from "../../app/robots";
import { SITE_URL } from "../../lib/site";

describe("robots", () => {
  const result = robots();

  it("points to the canonical sitemap URL", () => {
    expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  it("disallows private/internal route prefixes", () => {
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    const disallow = rule.disallow as string[];

    for (const path of [
      "/admin",
      "/settings",
      "/login",
      "/signup",
      "/verify-email",
      "/list",
      "/api",
    ]) {
      expect(disallow).toContain(path);
    }
  });

  it("does not globally block public content", () => {
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rule.allow).toBe("/");
    const disallow = rule.disallow as string[];
    expect(disallow).not.toContain("/");
    expect(disallow).not.toContain("/tasks");
    expect(disallow).not.toContain("/guides");
    expect(disallow).not.toContain("/discovery");
  });
});
