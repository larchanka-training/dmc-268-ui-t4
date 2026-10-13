import { useEffect, useState } from "react";

import {
  type HighlightedLine,
  applyTokens,
  hunkSides,
} from "../domain/highlight";
import { type DiffHunk } from "../domain/types";
import {
  type SyntaxHighlighter,
  sharedHighlighter,
} from "../infrastructure/shiki-highlighter";

const NOT_HIGHLIGHTED: (HighlightedLine | null)[] = [];

interface HighlightState {
  /** Which hunk and language these lines belong to. */
  readonly key: string;
  readonly lines: (HighlightedLine | null)[];
}

const EMPTY_STATE: HighlightState = { key: "", lines: NOT_HIGHLIGHTED };

/** Unfolding context changes the line count, which is what makes tokens stale. */
function keyOf(hunk: DiffHunk, language: string | null): string {
  return `${hunk.id}:${language ?? "plain"}:${String(hunk.lines.length)}`;
}

/**
 * Colours one hunk, without holding the diff back.
 *
 * The hunk renders as plain text first; tokens replace it once the grammar has loaded.
 * A file we have no grammar for, or a highlighter that fails to load, simply stays plain.
 */
export function useHighlightedHunk(
  hunk: DiffHunk,
  language: string | null,
  highlighter: SyntaxHighlighter = sharedHighlighter,
): (HighlightedLine | null)[] {
  const [state, setState] = useState<HighlightState>(EMPTY_STATE);
  const key = keyOf(hunk, language);

  useEffect(() => {
    if (language === null) {
      return;
    }

    let cancelled = false;
    const sides = hunkSides(hunk);

    void Promise.all([
      highlighter.highlight(sides.old.text, language),
      highlighter.highlight(sides.new.text, language),
    ]).then(([oldLines, newLines]) => {
      if (cancelled) {
        return;
      }

      setState({
        key,
        lines: applyTokens(
          sides,
          {
            ...(oldLines === null ? {} : { old: oldLines }),
            ...(newLines === null ? {} : { new: newLines }),
          },
          hunk.lines.length,
        ),
      });
    });

    return () => {
      // The reader may unfold context or leave the page while a grammar is still loading.
      cancelled = true;
    };
  }, [hunk, key, language, highlighter]);

  // Tokens from a previous hunk or a previous unfold would land on the wrong lines.
  return state.key === key ? state.lines : NOT_HIGHLIGHTED;
}
