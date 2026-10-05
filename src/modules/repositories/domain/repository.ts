/** A repository the review app can access through the organisation's installation. */
export interface Repository {
  readonly id: string;
  readonly owner: string;
  readonly name: string;
  /** "owner/name", the way GitHub and the run filters refer to it. */
  readonly fullName: string;
  readonly isPrivate: boolean;
  readonly defaultBranch: string;
  /** The repository on GitHub; null when the API sent no https URL. */
  readonly htmlUrl: string | null;
  /**
   * When the repository joined the installation; null when the backend cannot know.
   * GitHub does not record it, and the backend keeps no copy of forge state.
   */
  readonly connectedAt: string | null;
  /** When the agent last reviewed a pull request here; null before the first review. */
  readonly lastRunAt: string | null;
}

/** How many repositories the sidebar lists before "View all". */
export const SIDEBAR_LIMIT = 8;

const collator = new Intl.Collator("en", { sensitivity: "base" });

/** Alphabetical, so a list does not reshuffle after every review. */
export function sortByFullName(
  repositories: readonly Repository[],
): Repository[] {
  return [...repositories].sort((a, b) =>
    collator.compare(a.fullName, b.fullName),
  );
}

/**
 * What the sidebar shows. `totalCount` comes from the API, so "more" is known even while
 * only the first page is loaded.
 */
export function sidebarSlice(
  repositories: readonly Repository[],
  totalCount: number,
  limit: number = SIDEBAR_LIMIT,
): { items: Repository[]; hasMore: boolean } {
  const items = sortByFullName(repositories).slice(0, limit);

  return { items, hasMore: totalCount > items.length };
}

/** The repositories with the most recent reviews; never-reviewed ones are left out. */
export function recentlyReviewed(
  repositories: readonly Repository[],
  count: number,
): Repository[] {
  return repositories
    .flatMap((repository) =>
      repository.lastRunAt === null
        ? []
        : [{ repository, at: Date.parse(repository.lastRunAt) }],
    )
    .sort((a, b) => b.at - a.at)
    .slice(0, count)
    .map(({ repository }) => repository);
}
