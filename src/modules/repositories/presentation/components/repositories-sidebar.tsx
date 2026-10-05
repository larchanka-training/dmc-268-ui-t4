import { Link } from "@tanstack/react-router";
import { FolderGit2, Lock } from "lucide-react";

import { currentOrganization, useSession } from "@/modules/auth";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { sidebarSlice } from "../../domain/repository";
import { useRepositories } from "../queries";

import { ConnectRepositoryButton } from "./connect-repository-button";

/**
 * The repository side of the console: the way to the Repositories page, a short list
 * that opens each repository's run history, and the way to connect another one.
 */
export function RepositoriesSidebar({
  onNavigate,
}: {
  /** Called when a link is followed, so a drawer can close itself. */
  onNavigate?: () => void;
}) {
  const session = useSession();
  const repositories = useRepositories();

  const isInstalled =
    session.data !== undefined &&
    session.data !== null &&
    currentOrganization(session.data) !== null;

  return (
    <div className="flex h-full flex-col gap-3">
      <Link
        to="/repositories"
        onClick={onNavigate}
        className="flex items-center justify-between rounded-md px-2 py-1 text-xs font-semibold tracking-wide text-content-muted uppercase hover:text-content"
        activeProps={{ className: "text-content" }}
      >
        <span className="flex items-center gap-2">
          <FolderGit2 className="size-4" aria-hidden />
          Repositories
        </span>
        {repositories.data ? (
          <span className="tabular-nums">{repositories.data.totalCount}</span>
        ) : null}
      </Link>

      <div className="flex-1">
        {!isInstalled && session.isSuccess ? (
          <p className="px-2 text-sm text-content-muted">
            The review app is not installed yet.
          </p>
        ) : repositories.isPending ? (
          <div className="flex flex-col gap-2 px-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        ) : repositories.isError ? (
          <div className="flex flex-col items-start gap-2 px-2 text-sm">
            <span>Could not load repositories.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void repositories.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : repositories.data.totalCount === 0 ? (
          <p className="px-2 text-sm text-content-muted">
            No repositories connected yet.
          </p>
        ) : (
          <QuickList
            repositories={repositories.data.items}
            totalCount={repositories.data.totalCount}
            onNavigate={onNavigate}
          />
        )}
      </div>

      <ConnectRepositoryButton className="px-2" />
    </div>
  );
}

function QuickList({
  repositories,
  totalCount,
  onNavigate,
}: {
  repositories: Parameters<typeof sidebarSlice>[0];
  totalCount: number;
  onNavigate: (() => void) | undefined;
}) {
  const { items, hasMore } = sidebarSlice(repositories, totalCount);

  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((repository) => (
        <li key={repository.id}>
          <Link
            to="/runs"
            search={{ repository: repository.fullName }}
            onClick={onNavigate}
            className="flex items-center gap-2 truncate rounded-md px-2 py-1 text-sm hover:bg-surface-muted"
          >
            <span className="truncate">{repository.fullName}</span>
            {repository.isPrivate ? (
              <Lock
                className="size-3 shrink-0 text-content-muted"
                aria-label="Private"
              />
            ) : null}
          </Link>
        </li>
      ))}
      {hasMore ? (
        <li>
          <Link
            to="/repositories"
            onClick={onNavigate}
            className="block rounded-md px-2 py-1 text-sm text-content-muted hover:text-content"
          >
            View all
          </Link>
        </li>
      ) : null}
    </ul>
  );
}
