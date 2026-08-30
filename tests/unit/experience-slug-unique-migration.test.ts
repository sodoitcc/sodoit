import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Experience slug uniqueness migration", () => {
  it("adds a unique index on experiences.slug", () => {
    const migrationsDir = path.resolve(
      __dirname,
      "../../supabase/migrations",
    );
    const files = fs.readdirSync(migrationsDir);
    const match = files.find((file) =>
      fs
        .readFileSync(path.join(migrationsDir, file), "utf-8")
        .match(/unique index.*experiences\s*\(slug\)/i),
    );
    expect(match).toBeDefined();
  });
});
