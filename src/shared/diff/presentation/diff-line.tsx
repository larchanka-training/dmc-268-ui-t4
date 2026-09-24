import { cn } from "cn";
import { type ReactNode } from "react";

import { type DiffLine as DiffLineModel } from "../domain/types";

import { LineContent } from "./line-content";

const ROW_STYLES: Record<DiffLineModel["type"], string> = {
  context: "bg-diff-context-bg",
  added: "bg-diff-added-bg",
  removed: "bg-diff-removed-bg",
};

const GUTTER_STYLES: Record<DiffLineModel["type"], string> = {
  context: "text-content-muted",
  added: "bg-diff-added-gutter text-content",
  removed: "bg-diff-removed-gutter text-content",
};

const MARKERS: Record<DiffLineModel["type"], string> = {
  context: " ",
  added: "+",
  removed: "-",
};

export interface DiffLineProps {
  readonly line: DiffLineModel;
  /** Set when a review comment points at this line. */
  readonly isHighlighted?: boolean;
  /** DOM id used by deep links such as #src-payment_service-rb-R142. */
  readonly anchorId?: string;
  /** Rendered directly under the line: the reviewer's comment. */
  readonly children?: ReactNode;
}

export function DiffLine({
  line,
  isHighlighted = false,
  anchorId,
  children,
}: DiffLineProps) {
  return (
    <>
      <tr
        id={anchorId}
        className={cn(
          ROW_STYLES[line.type],
          "scroll-mt-24 font-mono text-xs leading-5",
          isHighlighted && "ring-2 ring-severity-high ring-inset",
        )}
      >
        <td
          className={cn(
            GUTTER_STYLES[line.type],
            "w-12 min-w-12 border-r border-border px-2 text-right tabular-nums select-none",
          )}
        >
          {line.oldLine ?? ""}
        </td>
        <td
          className={cn(
            GUTTER_STYLES[line.type],
            "w-12 min-w-12 border-r border-border px-2 text-right tabular-nums select-none",
          )}
        >
          {line.newLine ?? ""}
        </td>
        <td className="w-4 min-w-4 pl-2 text-content-muted select-none">
          {MARKERS[line.type]}
        </td>
        <td className="w-full py-0.5 pr-3">
          <LineContent content={line.content} />
        </td>
      </tr>
      {children ? (
        <tr>
          <td colSpan={4} className="bg-surface-muted p-0">
            {children}
          </td>
        </tr>
      ) : null}
    </>
  );
}
