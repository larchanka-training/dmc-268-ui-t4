import { Columns2, Rows3 } from "lucide-react";

import { useDiffViewMode } from "@/shared/diff/presentation/diff-view-mode";
import { Button } from "@/shared/ui/button";

/**
 * Unified or side by side. Hidden below 768 pixels, where two columns of code do not fit
 * and the choice would only disappoint.
 */
export function DiffViewModeToggle() {
  const mode = useDiffViewMode((state) => state.mode);
  const setMode = useDiffViewMode((state) => state.setMode);

  return (
    <div
      className="hidden items-center rounded-md border border-border p-0.5 md:flex"
      role="group"
      aria-label="Diff view"
    >
      <Button
        variant={mode === "unified" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 gap-1.5"
        aria-pressed={mode === "unified"}
        onClick={() => {
          setMode("unified");
        }}
      >
        <Rows3 className="size-3.5" aria-hidden />
        Unified
      </Button>
      <Button
        variant={mode === "split" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 gap-1.5"
        aria-pressed={mode === "split"}
        onClick={() => {
          setMode("split");
        }}
      >
        <Columns2 className="size-3.5" aria-hidden />
        Side by side
      </Button>
    </div>
  );
}
