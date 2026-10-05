/**
 * Keeps a URL from an API response only when it is https. Images and links built from
 * untrusted data must never carry `javascript:`, `data:` or plain-http URLs.
 */
export function httpsUrlOrNull(value: string): string | null {
  try {
    return new URL(value).protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}
