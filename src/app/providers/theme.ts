import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  type Theme,
  type ThemePreference,
  resolveTheme,
  toggledPreference,
} from "./theme-preference";

export type { Theme, ThemePreference };

interface ThemeState {
  readonly preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

/** The only piece of UI state worth surviving a reload, so it is persisted. */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: "system",
      setPreference: (preference) => {
        set({ preference });
      },
    }),
    { name: "theme-preference" },
  ),
);

const DARK_QUERY = "(prefers-color-scheme: dark)";

function systemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

function resolve(preference: ThemePreference): Theme {
  return resolveTheme(preference, systemPrefersDark());
}

function subscribeToSystemTheme(onChange: () => void): () => void {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);

  return () => {
    media.removeEventListener("change", onChange);
  };
}

/** The theme on screen, kept current when the system setting changes. */
export function useShownTheme(): Theme {
  const preference = useThemeStore((state) => state.preference);
  const prefersDark = useSyncExternalStore(
    subscribeToSystemTheme,
    systemPrefersDark,
  );

  return resolveTheme(preference, prefersDark);
}

/** Switches to the opposite of the theme currently on screen. */
export function toggleTheme(): void {
  const { preference, setPreference } = useThemeStore.getState();

  setPreference(toggledPreference(preference, systemPrefersDark()));
}

/** Applies the theme to <html> and keeps following the system setting while in "system". */
export function startThemeSync(): () => void {
  const apply = () => {
    document.documentElement.classList.toggle(
      "dark",
      resolve(useThemeStore.getState().preference) === "dark",
    );
  };

  apply();

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", apply);
  const unsubscribe = useThemeStore.subscribe(apply);

  return () => {
    media.removeEventListener("change", apply);
    unsubscribe();
  };
}
