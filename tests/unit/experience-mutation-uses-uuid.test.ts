import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Experience mutation APIs stay UUID-identified", () => {
  it("browse actions validate mutations against UUID_RE, not the public slug", () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, "../../app/(app)/browse/actions.ts"),
      "utf-8",
    );
    expect(source).toMatch(/UUID_RE\.test\(experienceId\)/);
    expect(source).not.toMatch(/UUID_RE\.test\(slug\)/);
  });
});
