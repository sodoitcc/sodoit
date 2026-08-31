import { describe, expect, it } from "vitest";
import { consumeBackForwardNavigation } from "@/lib/navigation/back-forward";

describe("consumeBackForwardNavigation", () => {
  it("defaults to false when no popstate has occurred", () => {
    expect(consumeBackForwardNavigation()).toBe(false);
  });

  it("does not throw when window is unavailable (SSR)", () => {
    expect(() => consumeBackForwardNavigation()).not.toThrow();
  });
});
