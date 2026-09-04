import { describe, expect, it } from "vitest";
import {
  MAX_GOOGLE_MAPS_ROUTE_STOPS,
  buildGoogleMapsDirectionsUrl,
} from "@/lib/guides/google-maps";

function stopsWithCoordinates(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    latitude: 50 + index * 0.01,
    longitude: 14 + index * 0.01,
  }));
}

describe("buildGoogleMapsDirectionsUrl route size limits", () => {
  it("builds a route at exactly the supported stop limit", () => {
    const url = buildGoogleMapsDirectionsUrl(
      stopsWithCoordinates(MAX_GOOGLE_MAPS_ROUTE_STOPS),
    );
    expect(url).not.toBeNull();
  });

  it("returns null instead of silently truncating a route that exceeds the limit", () => {
    const url = buildGoogleMapsDirectionsUrl(
      stopsWithCoordinates(MAX_GOOGLE_MAPS_ROUTE_STOPS + 1),
    );
    expect(url).toBeNull();
  });
});
