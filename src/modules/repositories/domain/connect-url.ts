/**
 * The connect URL comes from the API and is followed with a full-page navigation, so only
 * two kinds are allowed: https (GitHub's installation pages) and a path inside the console
 * (the mock backend). Protocol-relative and backslash tricks are refused.
 */
export function isSafeConnectUrl(url: string): boolean {
  if (url.startsWith("/")) {
    return !url.startsWith("//") && !url.startsWith("/\\");
  }

  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}
