import { describe, expect, it } from "vitest";
import {
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsUrl,
} from "@/lib/guides/google-maps";

describe("buildGoogleMapsUrl", () => {
  it("prefers a stored override URL over any other data", () => {
    const url = buildGoogleMapsUrl({
      googleMapsUrl: "https://maps.example/override",
      latitude: 50.08,
      longitude: 14.42,
      name: "Charles Bridge",
    });
    expect(url).toBe("https://maps.example/override");
  });

  it("builds a coordinate-based search URL when lat/lng are present", () => {
    const url = buildGoogleMapsUrl({ latitude: 50.08, longitude: 14.42 });
    expect(url).toBe(
      "https://www.google.com/maps/search/?api=1&query=50.08%2C14.42",
    );
  });

  it("falls back to name and address when there are no coordinates", () => {
    const url = buildGoogleMapsUrl({
      name: "Charles Bridge",
      address: "Prague, Czechia",
    });
    expect(url).toBe(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        "Charles Bridge, Prague, Czechia",
      )}`,
    );
  });

  it("returns null when there is no usable location data", () => {
    expect(buildGoogleMapsUrl({})).toBeNull();
    expect(buildGoogleMapsUrl({ name: "  " })).toBeNull();
  });
});

describe("buildGoogleMapsDirectionsUrl", () => {
  const stops = [
    { name: "Old Town Square" },
    { latitude: 50.086, longitude: 14.412 },
    { name: "Prague Castle" },
  ];

  it("returns null for fewer than two resolvable stops", () => {
    expect(buildGoogleMapsDirectionsUrl([{ name: "Solo stop" }])).toBeNull();
    expect(buildGoogleMapsDirectionsUrl([])).toBeNull();
  });

  it("builds an origin/destination/waypoints URL for three or more stops", () => {
    const url = buildGoogleMapsDirectionsUrl(stops);
    expect(url).toContain("https://www.google.com/maps/dir/?");
    expect(url).toContain("origin=Old+Town+Square");
    expect(url).toContain("destination=Prague+Castle");
    expect(url).toContain("waypoints=50.086%2C14.412");
  });

  it("includes travelmode only when a route mode is provided", () => {
    const withMode = buildGoogleMapsDirectionsUrl(stops, "walking");
    const withoutMode = buildGoogleMapsDirectionsUrl(stops);
    expect(withMode).toContain("travelmode=walking");
    expect(withoutMode).not.toContain("travelmode");
  });

  it("skips stops with no resolvable location", () => {
    const url = buildGoogleMapsDirectionsUrl([
      { name: "Start" },
      { name: "  " },
      { name: "End" },
    ]);
    expect(url).toContain("origin=Start");
    expect(url).toContain("destination=End");
    expect(url).not.toContain("waypoints");
  });
});
