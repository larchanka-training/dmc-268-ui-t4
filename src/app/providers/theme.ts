import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemePreference = "light" | "dark" | "system";

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

function resolve(preference: ThemePreference): "light" | "dark" {
  if (preference !== "system") {
    return preference;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
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
