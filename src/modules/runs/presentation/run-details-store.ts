import { create } from "zustand";

import { mergeExpandedLines } from "@/shared/diff/domain/context";
import { type DiffFile, type ExpandedLines } from "@/shared/diff/domain/types";

/** Lines the reader unfolded, remembered per hunk so they merge back where they belong. */
export interface HunkExpansion {
  readonly hunkId: string;
  readonly lines: ExpandedLines;
}

/**
 * Ephemeral UI state of the run details page. Server data stays in TanStack Query;
 * what the reader has unfolded or collapsed lives here and is dropped on reload.
 */
interface RunDetailsState {
  readonly expansions: Record<string, HunkExpansion[]>;
  /** Which gap is currently being fetched, so its row can show a skeleton. */
  readonly loadingGapId: string | null;
  readonly collapsedFindingIds: readonly string[];
  addExpansion: (findingId: string, expansion: HunkExpansion) => void;
  setLoadingGapId: (gapId: string | null) => void;
  toggleFinding: (findingId: string) => void;
  reset: () => void;
}

export const useRunDetailsStore = create<RunDetailsState>()((set) => ({
  expansions: {},
  loadingGapId: null,
  collapsedFindingIds: [],

  addExpansion: (findingId, expansion) => {
    set((state) => ({
      expansions: {
        ...state.expansions,
        [findingId]: [...(state.expansions[findingId] ?? []), expansion],
      },
    }));
  },

  setLoadingGapId: (gapId) => {
    set({ loadingGapId: gapId });
  },

  toggleFinding: (findingId) => {
    set((state) => ({
      collapsedFindingIds: state.collapsedFindingIds.includes(findingId)
        ? state.collapsedFindingIds.filter((id) => id !== findingId)
        : [...state.collapsedFindingIds, findingId],
    }));
  },

  reset: () => {
    set({ expansions: {}, loadingGapId: null, collapsedFindingIds: [] });
  },
}));

/** Applies everything the reader unfolded on top of the snippet that came from the API. */
export function withExpandedContext(
  snippet: DiffFile,
  expansions: readonly HunkExpansion[],
): DiffFile {
  if (expansions.length === 0) {
    return snippet;
  }

  return {
    ...snippet,
    hunks: snippet.hunks.map((hunk) =>
      expansions
        .filter((expansion) => expansion.hunkId === hunk.id)
        .reduce(
          (current, expansion) => mergeExpandedLines(current, expansion.lines),
          hunk,
        ),
    ),
  };
}
