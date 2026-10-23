import { type Repository } from "../domain/repository";

export interface RepositoryPage {
  readonly items: readonly Repository[];
  /** Cursor for the next page, null when the list ends. */
  readonly nextCursor: string | null;
  /** Connected repositories across all pages. */
  readonly totalCount: number;
}

export interface ConnectedReposApi {
  listRepositories: (
    params: { cursor?: string },
    signal?: AbortSignal,
  ) => Promise<RepositoryPage>;
  /** Where GitHub lets an owner change which repositories the app can access. */
  getConnectUrl: (signal?: AbortSignal) => Promise<string>;
  /**
   * Where GitHub lets an owner remove this repository from the installation. Rejects
   * with a not-found error when the repository is not connected (any more).
   */
  getDisconnectUrl: (
    repositoryId: string,
    signal?: AbortSignal,
  ) => Promise<string>;
}
