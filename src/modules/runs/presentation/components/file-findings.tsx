import { ExternalLink, FileDiff } from "lucide-react";

import {
  type ContextGap,
  type ExpandDirection,
} from "@/shared/diff/domain/types";

import { type Finding } from "../../domain/finding";

import { FindingCard } from "./finding-card";

export interface FileFindingsProps {
  readonly runId: string;
  readonly path: string;
  readonly findings: readonly Finding[];
  readonly onExpand: (
    finding: Finding,
    gap: ContextGap,
    direction: ExpandDirection,
  ) => void;
}

/**
 * Everything the agent said about one file. The path is stated once, at the top, instead
 * of repeating on every comment the way it used to.
 */
export function FileFindings({
  runId,
  path,
  findings,
  onExpand,
}: FileFindingsProps) {
  const first = findings[0];

  if (first === undefined) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-md border border-border bg-surface">
      <header className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-muted px-3 py-2">
        <FileDiff className="size-4 text-content-muted" aria-hidden />
        <h3 className="truncate font-mono text-xs font-normal">{path}</h3>
        <span className="text-xs text-content-muted">
          {findings.length === 1
            ? "1 finding"
            : `${String(findings.length)} findings`}
        </span>
        <a
          href={first.externalUrl}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-xs text-content-muted hover:text-content"
        >
          View on GitHub
          <ExternalLink className="size-3" aria-hidden />
        </a>
      </header>

      <div className="flex flex-col divide-y divide-border">
        {findings.map((finding) => (
          <FindingCard
            key={finding.id}
            runId={runId}
            finding={finding}
            onExpand={onExpand}
          />
        ))}
      </div>
    </section>
  );
}
