import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DiffViewMode = "unified" | "split";

interface DiffViewModeState {
  readonly mode: DiffViewMode;
  setMode: (mode: DiffViewMode) => void;
}

/**
 * How this reader likes to look at a diff. It belongs to the person, not to the review, so
 * it is remembered across visits and deliberately kept out of the URL: a link to a finding
 * should open the way whoever follows it prefers.
 */
export const useDiffViewMode = create<DiffViewModeState>()(
  persist(
    (set) => ({
      mode: "unified",
      setMode: (mode) => {
        set({ mode });
      },
    }),
    { name: "diff-view-mode" },
  ),
);
