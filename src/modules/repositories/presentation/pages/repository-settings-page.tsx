import { Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, GitBranch } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { RepositoryRulesCard } from "../components/repository-rules-card";
import { useRepository } from "../queries";

/** One connected repository: for now the status and preview of its review rules. */
export function RepositorySettingsPage({
  repositoryId,
}: {
  repositoryId: string;
}) {
  const { repository, isPending, isError, isMissing, refetch } =
    useRepository(repositoryId);

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/repositories"
        className="inline-flex w-fit items-center gap-1 text-sm text-content-muted hover:text-content"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Repositories
      </Link>

      {repository !== null ? (
        <>
          <header className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold">{repository.fullName}</h1>
              {repository.isPrivate ? (
                <Badge variant="secondary">Private</Badge>
              ) : null}
              {repository.htmlUrl === null ? null : (
                <a
                  href={repository.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open on GitHub"
                  className="text-content-muted hover:text-content"
                >
                  <ExternalLink className="size-4" aria-hidden />
                </a>
              )}
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-content-muted">
              <GitBranch className="size-3" aria-hidden />
              {`Default branch ${repository.defaultBranch}`}
            </span>
          </header>

          <RepositoryRulesCard repository={repository} />
        </>
      ) : isError ? (
        <div className="flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm">
          <span>Could not load the repository.</span>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : isMissing ? (
        <p className="rounded-md border border-dashed border-border px-4 py-12 text-center text-sm text-content-muted">
          This repository is not connected.
        </p>
      ) : isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : null}
    </div>
  );
}
