import { Link } from "@tanstack/react-router";
import { CheckCircle2, ExternalLink, GitBranch, X } from "lucide-react";

import { formatRelativeTime } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { type Repository } from "../../domain/repository";
import { ConnectRepositoryButton } from "../components/connect-repository-button";
import { DisconnectRepositoryButton } from "../components/disconnect-repository-button";
import { useConnectedBannerStore } from "../connected-banner-store";
import { useRepositories } from "../queries";

/** Every repository the review app can access in the current organisation. */
export function RepositoriesPage() {
  const repositories = useRepositories();
  const isBannerVisible = useConnectedBannerStore((state) => state.isVisible);
  const dismissBanner = useConnectedBannerStore((state) => state.dismiss);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h1 className="text-lg font-semibold">Repositories</h1>
          {repositories.data ? (
            <span className="text-sm text-content-muted tabular-nums">
              {repositories.data.totalCount}
            </span>
          ) : null}
        </div>
        <ConnectRepositoryButton />
      </header>

      {isBannerVisible ? (
        <div
          role="status"
          className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-3 text-sm"
        >
          <CheckCircle2 className="size-4 text-severity-low" aria-hidden />
          <span className="flex-1">Your repository list is up to date.</span>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Dismiss"
            onClick={dismissBanner}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      ) : null}

      {repositories.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : repositories.isError ? (
        <div className="flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm">
          <span>Could not load repositories.</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void repositories.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : repositories.data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border px-4 py-12 text-center">
          <p className="text-sm text-content-muted">
            No repositories connected yet. Connect one to have its pull requests
            reviewed.
          </p>
          <ConnectRepositoryButton />
        </div>
      ) : (
        <>
          <ul className="overflow-hidden rounded-md border border-border bg-surface">
            {repositories.data.items.map((repository) => (
              <RepositoryRow key={repository.id} repository={repository} />
            ))}
          </ul>

          {repositories.hasNextPage ? (
            <Button
              variant="outline"
              className="self-center"
              disabled={repositories.isFetchingNextPage}
              onClick={() => void repositories.fetchNextPage()}
            >
              {repositories.isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}

function RepositoryRow({ repository }: { repository: Repository }) {
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
