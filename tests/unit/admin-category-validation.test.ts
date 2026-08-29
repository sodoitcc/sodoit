import { describe, expect, it } from "vitest";
import {
  readCategoryInput,
  validateCategoryInput,
  type CategoryInput,
} from "../../lib/admin/categories/validation";

function baseInput(overrides: Partial<CategoryInput> = {}): CategoryInput {
  return {
    name: "Adventure",
    slug: "adventure",
    description: "",
    icon: "",
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

describe("readCategoryInput", () => {
  it("parses sort_order as a number", () => {
    const input = readCategoryInput(
      formData({ name: "A", slug: "a", sort_order: "3" }),
    );
    expect(input.sort_order).toBe(3);
  });

  it("treats a blank sort_order as null rather than 0", () => {
    const input = readCategoryInput(formData({ name: "A", slug: "a" }));
    expect(input.sort_order).toBeNull();
  });

  it("lowercases the slug", () => {
    const input = readCategoryInput(
      formData({ name: "A", slug: "Adventure-Time" }),
    );
    expect(input.slug).toBe("adventure-time");
  });

  it("reads is_active from the checkbox convention", () => {
    const checked = readCategoryInput(
      formData({ name: "A", slug: "a", is_active: "on" }),
    );
    expect(checked.is_active).toBe(true);

    const unchecked = readCategoryInput(formData({ name: "A", slug: "a" }));
    expect(unchecked.is_active).toBe(false);
  });
});

describe("validateCategoryInput", () => {
  it("accepts a valid input", () => {
    expect(validateCategoryInput(baseInput())).toBeNull();
  });

  it("rejects an empty name", () => {
    expect(validateCategoryInput(baseInput({ name: "" }))).toMatch(/name/i);
  });

  it("rejects a name over the max length", () => {
    expect(validateCategoryInput(baseInput({ name: "a".repeat(61) }))).toMatch(
      /name/i,
    );
  });

  it("rejects an invalid slug", () => {
    expect(validateCategoryInput(baseInput({ slug: "Not Valid!" }))).toMatch(
      /slug/i,
    );
  });

  it("rejects a slug over the max length", () => {
    expect(validateCategoryInput(baseInput({ slug: "a".repeat(61) }))).toMatch(
      /slug/i,
    );
  });

  it("rejects a description over the max length", () => {
    expect(
      validateCategoryInput(baseInput({ description: "a".repeat(301) })),
    ).toMatch(/description/i);
  });

  it("rejects an icon over the max length", () => {
    expect(validateCategoryInput(baseInput({ icon: "a".repeat(61) }))).toMatch(
      /icon/i,
    );
  });

  it("rejects a missing sort_order", () => {
    expect(validateCategoryInput(baseInput({ sort_order: null }))).toMatch(
      /sort order/i,
    );
  });

  it("rejects a non-integer sort_order", () => {
    expect(validateCategoryInput(baseInput({ sort_order: 1.5 }))).toMatch(
      /sort order/i,
    );
  });

  it("rejects a negative sort_order", () => {
    expect(validateCategoryInput(baseInput({ sort_order: -1 }))).toMatch(
      /sort order/i,
    );
  });

  it("accepts sort_order of exactly 0", () => {
    expect(validateCategoryInput(baseInput({ sort_order: 0 }))).toBeNull();
  });
});
