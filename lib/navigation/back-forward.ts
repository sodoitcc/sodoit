let backForward = false;

if (typeof window !== "undefined") {
  window.addEventListener(
    "popstate",
    () => {
      backForward = true;
    },
    { passive: true },
  );
}

export function consumeBackForwardNavigation(): boolean {
  const value = backForward;
  backForward = false;
  return value;
}
