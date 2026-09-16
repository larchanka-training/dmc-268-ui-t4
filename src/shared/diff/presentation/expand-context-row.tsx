import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";

import { Skeleton } from "@/shared/ui/skeleton";

import { EXPAND_STEP } from "../domain/context";
import { type ContextGap, type ExpandDirection } from "../domain/types";

export interface ExpandContextRowProps {
  readonly gap: ContextGap;
  readonly isLoading?: boolean;
  readonly onExpand: (gap: ContextGap, direction: ExpandDirection) => void;
}

/** The "unfold" row between hunks: shows how much code is hidden and how to reveal it. */
export function ExpandContextRow({
  gap,
  isLoading = false,
  onExpand,
}: ExpandContextRowProps) {
  const canExpandAll = gap.size !== null && gap.size <= EXPAND_STEP * 3;
  const hiddenLabel =
    gap.size === null ? "more lines below" : `${String(gap.size)} hidden lines`;

  return (
    <tr className="bg-surface-muted">
      <td colSpan={4} className="px-2 py-1">
        {isLoading ? (
          <Skeleton className="h-5 w-full" />
        ) : (
          <div className="flex items-center gap-2 text-xs text-content-muted">
            {gap.previousHunkId === null ? null : (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-sm px-1 hover:text-content"
                onClick={() => {
                  onExpand(gap, "down");
                }}
              >
                <ChevronDown className="size-3" aria-hidden />
                {`${String(EXPAND_STEP)} lines`}
              </button>
            )}
            {gap.nextHunkId === null ? null : (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-sm px-1 hover:text-content"
                onClick={() => {
                  onExpand(gap, "up");
                }}
              >
                <ChevronUp className="size-3" aria-hidden />
                {`${String(EXPAND_STEP)} lines`}
              </button>
            )}
            {canExpandAll ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-sm px-1 hover:text-content"
                onClick={() => {
                  onExpand(gap, "all");
                }}
              >
                <ChevronsUpDown className="size-3" aria-hidden />
                All
              </button>
            ) : null}
            <span className="ml-auto tabular-nums">{hiddenLabel}</span>
          </div>
        )}
      </td>
    </tr>
  );
}
