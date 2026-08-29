import { describe, expect, it } from "vitest";
import {
  readTagInput,
  validateTagInput,
  type TagInput,
} from "../../lib/admin/tags/validation";

function baseInput(overrides: Partial<TagInput> = {}): TagInput {
  return {
    name: "Iconic",
    slug: "iconic",
    sort_order: 1,
    is_active: true,
    ...overrides,
  };
}

function formData(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("readTagInput", () => {
  it("parses sort_order as a number", () => {
    const input = readTagInput(
      formData({ name: "A", slug: "a", sort_order: "3" }),
    );
    expect(input.sort_order).toBe(3);
  });

  it("treats a blank sort_order as null rather than 0", () => {
    const input = readTagInput(formData({ name: "A", slug: "a" }));
    expect(input.sort_order).toBeNull();
  });

  it("lowercases the slug", () => {
    const input = readTagInput(formData({ name: "A", slug: "Bucket-List" }));
    expect(input.slug).toBe("bucket-list");
  });

  it("reads is_active from the checkbox convention", () => {
    const checked = readTagInput(
      formData({ name: "A", slug: "a", is_active: "on" }),
    );
    expect(checked.is_active).toBe(true);

    const unchecked = readTagInput(formData({ name: "A", slug: "a" }));
    expect(unchecked.is_active).toBe(false);
  });
});

describe("validateTagInput", () => {
  it("accepts a valid input", () => {
    expect(validateTagInput(baseInput())).toBeNull();
  });

  it("rejects an empty name", () => {
    expect(validateTagInput(baseInput({ name: "" }))).toMatch(/name/i);
  });

  it("rejects a name over the max length", () => {
    expect(validateTagInput(baseInput({ name: "a".repeat(41) }))).toMatch(
      /name/i,
    );
  });

  it("rejects an invalid slug", () => {
    expect(validateTagInput(baseInput({ slug: "Not Valid!" }))).toMatch(
      /slug/i,
    );
  });

  it("rejects a slug over the max length", () => {
    expect(validateTagInput(baseInput({ slug: "a".repeat(41) }))).toMatch(
      /slug/i,
    );
  });

  it("rejects a non-integer sort_order", () => {
    expect(validateTagInput(baseInput({ sort_order: 1.5 }))).toMatch(
      /sort order/i,
    );
  });

  it("accepts a null sort_order", () => {
    expect(validateTagInput(baseInput({ sort_order: null }))).toBeNull();
  });
});
