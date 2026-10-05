export type ThemePreference = "light" | "dark" | "system";

export type Theme = "light" | "dark";

/** The theme on screen: the explicit preference, or the system's while following it. */
export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): Theme {
  if (preference !== "system") {
    return preference;
  }

  return systemPrefersDark ? "dark" : "light";
}

/**
 * What the theme toggle stores: the opposite of what the user currently sees. Flipping the
 * stored preference instead would do nothing visible on the first click while following
 * a dark system.
 */
export function toggledPreference(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): Theme {
  return resolveTheme(preference, systemPrefersDark) === "dark"
    ? "light"
    : "dark";
}
