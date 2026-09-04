import { describe, expect, it } from "vitest";
import { validateGuideComparisonInput } from "@/lib/admin/guides/validation";

function baseInput(
  overrides: Partial<Parameters<typeof validateGuideComparisonInput>[0]> = {},
) {
  return {
    skip_title: "Old Town tourist restaurants",
    skip_description: "",
    skip_neighborhood: "",
    skip_address: "",
    skip_latitude: "",
    skip_longitude: "",
    skip_google_maps_url: "",
    skip_external_url: "",
    skip_tags: "",
    go_instead_title: "Lokál Dlouhááá",
    go_instead_description: "",
    go_instead_neighborhood: "",
    go_instead_address: "",
    go_instead_latitude: "",
    go_instead_longitude: "",
    go_instead_google_maps_url: "",
    go_instead_external_url: "",
    go_instead_tags: "",
    reason: "",
    ...overrides,
  };
}

describe("validateGuideComparisonInput", () => {
  it("accepts a minimal valid pair", () => {
    expect(validateGuideComparisonInput(baseInput())).toBeNull();
  });

  it("requires a skip title", () => {
    expect(
      validateGuideComparisonInput(baseInput({ skip_title: "" })),
    ).toMatch(/skip title/i);
  });

  it("requires an instead title", () => {
    expect(
      validateGuideComparisonInput(baseInput({ go_instead_title: "" })),
    ).toMatch(/instead title/i);
  });

  it("rejects unsafe protocols on either side's URLs", () => {
    expect(
      validateGuideComparisonInput(
        baseInput({ skip_google_maps_url: "javascript:alert(1)" }),
      ),
    ).toMatch(/valid url/i);
    expect(
      validateGuideComparisonInput(
        baseInput({ go_instead_external_url: "javascript:alert(1)" }),
      ),
    ).toMatch(/valid url/i);
  });

  it("accepts valid latitude and longitude on both sides", () => {
    expect(
      validateGuideComparisonInput(
        baseInput({
          skip_latitude: "50.08",
          skip_longitude: "14.42",
          go_instead_latitude: "50.09",
          go_instead_longitude: "14.43",
        }),
      ),
    ).toBeNull();
  });

  it("rejects out-of-range latitude on either side", () => {
    expect(
      validateGuideComparisonInput(baseInput({ skip_latitude: "91" })),
    ).toMatch(/latitude/i);
    expect(
      validateGuideComparisonInput(baseInput({ go_instead_latitude: "-91" })),
    ).toMatch(/latitude/i);
  });

  it("rejects out-of-range longitude on either side", () => {
    expect(
      validateGuideComparisonInput(baseInput({ skip_longitude: "181" })),
    ).toMatch(/longitude/i);
    expect(
      validateGuideComparisonInput(
        baseInput({ go_instead_longitude: "-181" }),
      ),
    ).toMatch(/longitude/i);
  });
});
