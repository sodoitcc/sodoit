import type { GuideRouteMode } from "./types";

export interface GoogleMapsPlaceInput {
  googleMapsUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  name?: string | null;
}

function placeQuery(input: GoogleMapsPlaceInput): string | null {
  if (input.latitude != null && input.longitude != null) {
    return `${input.latitude},${input.longitude}`;
  }

  const parts = [input.name, input.address].filter((part): part is string =>
    Boolean(part && part.trim()),
  );

  return parts.length > 0 ? parts.join(", ") : null;
}

export function buildGoogleMapsUrl(input: GoogleMapsPlaceInput): string | null {
  if (input.googleMapsUrl) return input.googleMapsUrl;

  const query = placeQuery(input);
  if (!query) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

const ROUTE_TRAVEL_MODE: Record<GuideRouteMode, string> = {
  walking: "walking",
  driving: "driving",
  bicycling: "bicycling",
  transit: "transit",
};

export function buildGoogleMapsDirectionsUrl(
  stops: GoogleMapsPlaceInput[],
  routeMode?: GuideRouteMode | null,
): string | null {
  const queries = stops
    .map((stop) => placeQuery(stop))
    .filter((query): query is string => Boolean(query));

  if (queries.length < 2) return null;

  const origin = queries[0];
  const destination = queries[queries.length - 1];
  const waypoints = queries.slice(1, -1);

  const params = new URLSearchParams({ api: "1", origin, destination });
  if (waypoints.length > 0) params.set("waypoints", waypoints.join("|"));
  if (routeMode) params.set("travelmode", ROUTE_TRAVEL_MODE[routeMode]);

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
