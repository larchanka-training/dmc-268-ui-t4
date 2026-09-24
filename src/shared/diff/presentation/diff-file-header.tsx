import { ExternalLink, FileDiff } from "lucide-react";

import { Badge } from "@/shared/ui/badge";

import { type DiffFileStatus } from "../domain/types";

const STATUS_LABELS: Record<DiffFileStatus, string> = {
  added: "added",
  modified: "modified",
  removed: "removed",
  renamed: "renamed",
};

export interface DiffFileHeaderProps {
  readonly path: string;
  readonly oldPath?: string | null;
  readonly status: DiffFileStatus;
  /** Link to the same file in the pull request on GitHub. */
  readonly externalUrl?: string;
}

export function DiffFileHeader({
  path,
  oldPath = null,
  status,
  externalUrl,
}: DiffFileHeaderProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border bg-surface-muted px-3 py-2">
      <FileDiff className="size-4 text-content-muted" aria-hidden />
      <span className="truncate font-mono text-xs">
        {status === "renamed" && oldPath !== null
          ? `${oldPath} → ${path}`
          : path}
      </span>
      <Badge variant="secondary" className="text-[10px]">
        {STATUS_LABELS[status]}
      </Badge>
      {externalUrl === undefined ? null : (
        <a
          href={externalUrl}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-xs text-content-muted hover:text-content"
        >
          Open on GitHub
          <ExternalLink className="size-3" aria-hidden />
        </a>
      )}
    </div>
  );
}
