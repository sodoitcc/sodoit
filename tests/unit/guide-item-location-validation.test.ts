import { describe, expect, it } from "vitest";
import { validateGuideItemInput } from "@/lib/admin/guides/validation";

function baseInput(
  overrides: Partial<Parameters<typeof validateGuideItemInput>[0]> = {},
) {
  return {
    title: "Charles Bridge",
    description: "",
    place_name: "",
    image_url: "",
    image_alt: "",
    external_url: "",
    neighborhood: "",
    address: "",
    latitude: "",
    longitude: "",
    google_maps_url: "",
    tags: "",
    ...overrides,
  };
}

describe("guide item location validation", () => {
  it("accepts empty optional location fields", () => {
    expect(validateGuideItemInput(baseInput())).toBeNull();
  });

  it("accepts valid latitude and longitude", () => {
    expect(
      validateGuideItemInput(
        baseInput({ latitude: "50.08", longitude: "14.42" }),
      ),
    ).toBeNull();
  });

  it("rejects out-of-range latitude", () => {
    expect(validateGuideItemInput(baseInput({ latitude: "91" }))).toMatch(
      /latitude/i,
    );
    expect(validateGuideItemInput(baseInput({ latitude: "-91" }))).toMatch(
      /latitude/i,
    );
  });

  it("rejects out-of-range longitude", () => {
    expect(validateGuideItemInput(baseInput({ longitude: "181" }))).toMatch(
      /longitude/i,
    );
    expect(validateGuideItemInput(baseInput({ longitude: "-181" }))).toMatch(
      /longitude/i,
    );
  });

  it("rejects non-numeric latitude/longitude", () => {
    expect(validateGuideItemInput(baseInput({ latitude: "north" }))).toMatch(
      /latitude/i,
    );
    expect(validateGuideItemInput(baseInput({ longitude: "east" }))).toMatch(
      /longitude/i,
    );
  });

  it("accepts a valid https Google Maps override URL", () => {
    expect(
      validateGuideItemInput(
        baseInput({ google_maps_url: "https://maps.google.com/?q=x" }),
      ),
    ).toBeNull();
  });

  it("rejects a javascript: protocol for the Google Maps override URL", () => {
    expect(
      validateGuideItemInput(
        baseInput({ google_maps_url: "javascript:alert(1)" }),
      ),
    ).toMatch(/Google Maps URL/i);
  });

  it("rejects a javascript: protocol for image and external URLs", () => {
    expect(
      validateGuideItemInput(baseInput({ image_url: "javascript:alert(1)" })),
    ).toMatch(/Image URL/i);
    expect(
      validateGuideItemInput(
        baseInput({ external_url: "javascript:alert(1)" }),
      ),
    ).toMatch(/External URL/i);
  });
});
