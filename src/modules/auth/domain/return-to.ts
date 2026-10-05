/** The sign-in pages themselves: returning to them after signing in would loop. */
const SIGN_IN_PATHS = /^\/(?:login|auth)(?:[/?#]|$)/;

function hasControlCharacters(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);

    if (code < 0x20 || code === 0x7f) {
      return true;
    }
  }

  return false;
}

/**
 * Where to send the user after signing in. Only paths inside the console are accepted, so
 * a crafted link cannot turn sign-in into an open redirect; anything else means "no return
 * path". The backend applies the same rule to `return_to`.
 */
export function sanitizeReturnTo(
  value: string | null | undefined,
): string | null {
  if (
    value === null ||
    value === undefined ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\") ||
    hasControlCharacters(value) ||
    SIGN_IN_PATHS.test(value)
  ) {
    return null;
  }

  return value;
}
