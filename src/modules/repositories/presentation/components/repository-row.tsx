import { Link } from "@tanstack/react-router";
import { ExternalLink, GitBranch } from "lucide-react";

import { formatRelativeTime } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

import { type Repository } from "../../domain/repository";

import { DisconnectRepositoryButton } from "./disconnect-repository-button";

/** One repository on the repositories page: links, branch, last review, actions. */
export function RepositoryRow({ repository }: { repository: Repository }) {
  return (
    <li className="flex flex-col gap-2 border-b border-border px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          {repository.htmlUrl === null ? (
            <span className="truncate text-sm font-medium">
              {repository.fullName}
            </span>
          ) : (
            <a
              href={repository.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 truncate text-sm font-medium hover:underline"
            >
              {repository.fullName}
              <ExternalLink className="size-3 shrink-0" aria-hidden />
            </a>
          )}
          {repository.isPrivate ? (
            <Badge variant="secondary">Private</Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-content-muted">
          <span className="inline-flex items-center gap-1">
            <GitBranch className="size-3" aria-hidden />
            {repository.defaultBranch}
          </span>
          {repository.connectedAt === null ? null : (
            <span>{`Connected ${formatRelativeTime(repository.connectedAt)}`}</span>
          )}
          <span>
            {repository.lastRunAt === null
              ? "Not reviewed yet"
              : `Last review ${formatRelativeTime(repository.lastRunAt)}`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/runs" search={{ repository: repository.fullName }}>
            Runs
          </Link>
        </Button>
        <DisconnectRepositoryButton repository={repository} />
      </div>
    </li>
  );
}
