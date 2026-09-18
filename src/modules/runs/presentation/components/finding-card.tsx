import { ChevronDown, ChevronRight } from "lucide-react";

import {
  type ContextGap,
  type ExpandDirection,
} from "@/shared/diff/domain/types";
import { DiffSnippet } from "@/shared/diff/presentation/diff-snippet";
import { InlineFinding } from "@/shared/diff/presentation/inline-finding";
import { SuggestionBlock } from "@/shared/diff/presentation/suggestion-block";
import { Button } from "@/shared/ui/button";

import { type Finding } from "../../domain/finding";
import {
  type HunkExpansion,
  useRunDetailsStore,
  withExpandedContext,
} from "../run-details-store";

import { CategoryBadge, SeverityBadge } from "./severity-badge";

export interface FindingCardProps {
  readonly finding: Finding;
  readonly onExpand: (
    finding: Finding,
    gap: ContextGap,
    direction: ExpandDirection,
  ) => void;
}

/** Stable empty value: returning a fresh [] from the selector would re-render forever. */
const NO_EXPANSIONS: readonly HunkExpansion[] = [];

/**
 * One published review comment: the code it points at, what the agent said and the change
 * it proposes. Everything here is read-only — the conversation itself lives on GitHub.
 */
export function FindingCard({ finding, onExpand }: FindingCardProps) {
  const expansions =
    useRunDetailsStore((state) => state.expansions[finding.id]) ??
    NO_EXPANSIONS;
  const loadingGapId = useRunDetailsStore((state) => state.loadingGapId);
  const isCollapsed = useRunDetailsStore((state) =>
    state.collapsedFindingIds.includes(finding.id),
  );
  const toggleFinding = useRunDetailsStore((state) => state.toggleFinding);

  const snippet = withExpandedContext(finding.snippet, expansions);

  return (
    <section className="flex flex-col gap-2">
      <header className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-1"
          aria-expanded={!isCollapsed}
          onClick={() => {
            toggleFinding(finding.id);
          }}
        >
          {isCollapsed ? (
            <ChevronRight className="size-4" aria-hidden />
          ) : (
            <ChevronDown className="size-4" aria-hidden />
          )}
          <span className="font-mono text-xs">
            {`${finding.position.path}:${String(finding.position.line)}`}
          </span>
        </Button>
        <SeverityBadge severity={finding.severity} />
        <CategoryBadge category={finding.category} />
      </header>

      {isCollapsed ? null : (
        <DiffSnippet
          file={snippet}
          fileLineCount={finding.fileLineCount}
          commentPosition={finding.position}
          loadingGapId={loadingGapId}
          onExpand={(gap, direction) => {
            onExpand(finding, gap, direction);
          }}
          comment={
            <InlineFinding
              author="Review agent"
              isBot
              createdAt={finding.publishedAt}
              message={finding.message}
              externalUrl={finding.externalUrl}
            >
              {finding.suggestion === null ? null : (
                <SuggestionBlock
                  before={finding.suggestion.before}
                  after={finding.suggestion.after}
                />
              )}
            </InlineFinding>
          }
        />
      )}
    </section>
  );
}
