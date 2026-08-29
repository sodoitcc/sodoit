import { describe, expect, it } from "vitest";
import { feedCollectionHref } from "../../app/(app)/feed/collection-href";

describe("feedCollectionHref", () => {
  it("builds the correct public collection URL", () => {
    expect(
      feedCollectionHref({ ownerUsername: "amina", slug: "prague-weekend" }),
    ).toBe("/u/amina/collections/prague-weekend");
  });
});
