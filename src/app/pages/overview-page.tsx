import { Link } from "@tanstack/react-router";
import { ArrowRight, FolderGit2, Loader2, Package } from "lucide-react";
import { type ReactNode } from "react";

import { currentOrganization, useSession } from "@/modules/auth";
import {
  ConnectRepositoryButton,
  recentlyReviewed,
  useRepositories,
} from "@/modules/repositories";
import { useActiveRuns } from "@/modules/runs";
import { formatRelativeTime } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

/**
 * The console's home. It composes the repositories and runs modules through their public
 * APIs, which is why it lives in app/ rather than in either module.
 */
export function OverviewPage() {
  const session = useSession();

  if (!session.data) {
    return <Skeleton className="h-48 w-full" />;
  }

  const organization = currentOrganization(session.data);
  const { name, login } = session.data.user;
  const [first = ""] = name.trim().split(/\s+/);
  const firstName = first === "" ? login : first;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">{`Welcome back, ${firstName}`}</h1>
        {organization === null ? null : (
          <p className="text-sm text-content-muted">{organization.name}</p>
        )}
      </header>

      {organization === null ? (
        <Card
          icon={<Package className="size-4" aria-hidden />}
          title="Install the review app"
        >
          <p className="text-sm text-content-muted">
            None of your organisations has installed the review app yet. Install
            it on GitHub and choose the repositories it should review.
          </p>
          <ConnectRepositoryButton className="items-start" />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <RepositoriesCard />
          <ReviewsCard />
        </div>
      )}
    </div>
  );
}

function RepositoriesCard() {
  const repositories = useRepositories();

  return (
    <Card
      icon={<FolderGit2 className="size-4" aria-hidden />}
      title="Repositories"
    >
      {repositories.isPending ? (
        <Skeleton className="h-24 w-full" />
      ) : repositories.isError ? (
        <div className="flex items-center gap-3 text-sm">
          <span>Could not load repositories.</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void repositories.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          <p className="text-2xl font-semibold tabular-nums">
            {repositories.data.totalCount}
            <span className="ml-2 text-sm font-normal text-content-muted">
              connected
            </span>
          </p>
          <RecentlyReviewed repositories={repositories.data.items} />
        </>
      )}
      <div className="mt-auto flex flex-wrap items-start gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/repositories">
            Manage repositories
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
        <ConnectRepositoryButton />
      </div>
    </Card>
  );
}

function RecentlyReviewed({
  repositories,
}: {
  repositories: Parameters<typeof recentlyReviewed>[0];
}) {
  const recent = recentlyReviewed(repositories, 3);

  if (recent.length === 0) {
    return <p className="text-sm text-content-muted">No reviews yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-1 text-sm">
      {recent.map((repository) => (
        <li key={repository.id} className="flex justify-between gap-3">
          <Link
            to="/runs"
            search={{ repository: repository.fullName }}
            className="truncate hover:underline"
          >
            {repository.fullName}
          </Link>
          {repository.lastRunAt === null ? null : (
            <span className="shrink-0 text-content-muted">
              {formatRelativeTime(repository.lastRunAt)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function ReviewsCard() {
  const activeRuns = useActiveRuns();

  return (
    <Card icon={<Loader2 className="size-4" aria-hidden />} title="Reviews">
      {activeRuns.isPending ? (
        <Skeleton className="h-10 w-full" />
      ) : activeRuns.isError ? (
        <div className="flex items-center gap-3 text-sm">
          <span>Could not load the running reviews.</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void activeRuns.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : (
        <p className="text-2xl font-semibold tabular-nums">
          {activeRuns.data.length}
          <span className="ml-2 text-sm font-normal text-content-muted">
            running now
          </span>
        </p>
      )}
      <div className="mt-auto">
        <Button asChild variant="outline" size="sm">
          <Link to="/runs">
            Open runs
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}
