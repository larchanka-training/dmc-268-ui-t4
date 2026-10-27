import { CheckCircle2, X } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { groupByOrganization } from "../../domain/repository";
import { AccountRepositories } from "../components/account-repositories";
import { ConnectRepositoryButton } from "../components/connect-repository-button";
import { useConnectedBannerStore } from "../connected-banner-store";
import { useRepositories } from "../queries";

/**
 * Every repository the review app can access, across all the user's installations:
 * their own account and each organisation, one group per account.
 */
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
          {groupByOrganization(repositories.data.items).map((group) => (
            <AccountRepositories
              key={group.organizationId ?? "unknown"}
              group={group}
            />
          ))}

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
