const PEXELS_API_URL = "https://api.pexels.com/v1/search";
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024; // 20 MB, sanity ceiling for a photo

export class PexelsRateLimitError extends Error {
  constructor(retryAfter) {
    super("Pexels rate limit reached");
    this.retryAfter = retryAfter;
  }
}

function requireApiKey() {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    throw new Error("Missing PEXELS_API_KEY");
  }
  return apiKey;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Search Pexels for landscape photos matching `query`. Returns the raw
 * ordered result list (possibly empty), most relevant first.
 */
export async function searchPexelsPhotos(query, { perPage = 5 } = {}) {
  const apiKey = requireApiKey();

  const url = new URL(PEXELS_API_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("per_page", String(perPage));

  const response = await fetchWithTimeout(url, {
    headers: { Authorization: apiKey },
  });

  if (response.status === 429) {
    throw new PexelsRateLimitError(response.headers.get("retry-after"));
  }

  if (!response.ok) {
    throw new Error(
      `Pexels request failed (${response.status}) for "${query}"`,
    );
  }

  const result = await response.json();

  if (!result || !Array.isArray(result.photos)) {
    throw new Error(`Pexels returned an unexpected response for "${query}"`);
  }

  return result.photos;
}

/** Search Pexels and return only the top result, or null if none. */
export async function searchPexelsPhoto(query, options = {}) {
  const photos = await searchPexelsPhotos(query, options);
  return photos[0] ?? null;
}

export function pexelsPhotoSrcUrl(photo) {
  return photo.src?.large2x ?? photo.src?.large ?? photo.src?.landscape ?? null;
}

export async function downloadImage(url) {
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`Image download failed (${response.status})`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Unexpected content-type "${contentType}" for ${url}`);
  }

  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_DOWNLOAD_BYTES) {
    throw new Error(`Image too large (${contentLength} bytes) for ${url}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.byteLength > MAX_DOWNLOAD_BYTES) {
    throw new Error(`Image too large (${buffer.byteLength} bytes) for ${url}`);
  }

  return buffer;
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
