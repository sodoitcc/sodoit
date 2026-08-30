import "server-only";

export function isE2eTestModeActive(): boolean {
  if (process.env.E2E_TEST_MODE !== "true") return false;
  if (process.env.NODE_ENV === "production" && process.env.CI !== "true") {
    return false;
  }
  return true;
}
