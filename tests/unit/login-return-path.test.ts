import { describe, expect, it } from "vitest";
import { getSafeNextPath, loginHrefWithNext } from "../../lib/auth-redirect";

describe("loginHrefWithNext for guest Save a copy", () => {
  it("returns to the exact public collection URL after login", () => {
    const collectionPath = "/u/amina/collections/prague-weekend";
    const href = loginHrefWithNext(collectionPath);

    expect(href).toBe(
      "/login?next=%2Fu%2Famina%2Fcollections%2Fprague-weekend",
    );

    const nextParam = new URL(href, "https://sodoit.example").searchParams.get(
      "next",
    );
    expect(nextParam).toBe(collectionPath);
    expect(getSafeNextPath(nextParam)).toBe(collectionPath);
  });
});
