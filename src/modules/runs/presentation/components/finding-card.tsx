import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";

import { positionAnchorId } from "@/shared/diff/domain/position";
import {
  type ContextGap,
  type ExpandDirection,
} from "@/shared/diff/domain/types";
import { InlineFinding } from "@/shared/diff/presentation/inline-finding";
import { SuggestionBlock } from "@/shared/diff/presentation/suggestion-block";
import { Button } from "@/shared/ui/button";

import { type Finding } from "../../domain/finding";
import { useRunDetailsStore } from "../run-details-store";

import { CategoryBadge } from "./category-badge";
import { FindingCode } from "./finding-code";
import { SeverityBadge } from "./severity-badge";

export interface FindingCardProps {
  readonly runId: string;
  readonly finding: Finding;
  readonly onExpand: (
    finding: Finding,
    gap: ContextGap,
    direction: ExpandDirection,
  ) => void;
}

/**
 * One published review comment: the code it points at, what the agent said and the change
 * it proposes. Everything here is read-only — the conversation itself lives on GitHub.
 */
export function FindingCard({ runId, finding, onExpand }: FindingCardProps) {
  const isCollapsed = useRunDetailsStore((state) =>
    state.collapsedFindingIds.includes(finding.id),
  );
  const toggleFinding = useRunDetailsStore((state) => state.toggleFinding);

  const anchorId = positionAnchorId(finding.position);

  // A link to a finding has to show it, even when this reader folded it away earlier.
  // The ref keeps that to the moment the page opens: a later collapse is the reader's.
  const anchorCheckedRef = useRef(false);

  useEffect(() => {
    if (anchorCheckedRef.current) {
      return;
    }

    anchorCheckedRef.current = true;

    if (isCollapsed && window.location.hash === `#${anchorId}`) {
      toggleFinding(finding.id);
    }
  }, [anchorId, finding.id, isCollapsed, toggleFinding]);

  return (
    <section className="flex flex-col gap-2 p-3">
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
        <FindingCode
          runId={runId}
          finding={finding}
          onExpand={onExpand}
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
