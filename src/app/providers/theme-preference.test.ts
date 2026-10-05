import { describe, expect, it } from "vitest";

import { resolveTheme, toggledPreference } from "./theme-preference";

describe("resolveTheme", () => {
  it("follows the system while the preference is 'system'", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("uses an explicit preference whatever the system says", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});

describe("toggledPreference", () => {
  it("switches away from the theme on screen when following a dark system", () => {
    expect(toggledPreference("system", true)).toBe("light");
  });

  it("switches away from the theme on screen when following a light system", () => {
    expect(toggledPreference("system", false)).toBe("dark");
  });

  it("flips an explicit preference", () => {
    expect(toggledPreference("dark", false)).toBe("light");
    expect(toggledPreference("light", true)).toBe("dark");
  });
});
