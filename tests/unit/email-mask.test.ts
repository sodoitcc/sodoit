import { describe, expect, it } from "vitest";
import { maskEmail } from "../../lib/email-mask";

describe("maskEmail", () => {
  it("masks a typical email keeping the first character", () => {
    expect(maskEmail("martin@gmail.com")).toBe("m•••••@gmail.com");
  });

  it("masks a single-character local part with a fixed dot count", () => {
    expect(maskEmail("a@example.com")).toBe("a•••@example.com");
  });

  it("returns the input unchanged when there is no @ sign", () => {
    expect(maskEmail("not-an-email")).toBe("not-an-email");
  });

  it("never includes the full local part in the output", () => {
    const masked = maskEmail("martin@gmail.com");
    expect(masked).not.toContain("martin");
  });
});
