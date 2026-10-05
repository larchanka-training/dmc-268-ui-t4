import { type MockScenario } from "./scenario";
import {
  CONNECTED_REPOSITORIES_KEY,
  DISCONNECTED_REPOSITORIES_KEY,
  type MockStorage,
} from "./session";
import { REPOSITORIES, REPOSITORIES_TO_CONNECT } from "./state";

const PAGE_SIZE = 10;

/** The wire format of GET /repositories items. */
interface RepositoryDto {
  readonly id: string;
  readonly owner: string;
  readonly name: string;
  readonly private: boolean;
  readonly default_branch: string;
  readonly html_url: string;
  readonly connected_at: string | null;
  readonly last_run_at: string | null;
}

/**
 * The mock backend's repository list. Connecting and disconnecting happen on GitHub in
 * reality; here the connect endpoint adds the next repository from a fixed list and the
 * disconnect endpoint removes the chosen one. Both are kept in storage, so they survive
 * the reload that follows the trip "to GitHub".
 */
export function createMockRepositories({
  scenario,
  storage,
}: {
  scenario: MockScenario;
  storage: MockStorage;
}) {
  const connectedCount = (): number => {
    const stored = Number(storage.getItem(CONNECTED_REPOSITORIES_KEY) ?? "0");

    return Number.isInteger(stored) && stored > 0 ? stored : 0;
  };

  const disconnectedIds = (): ReadonlySet<string> => {
    try {
      const parsed: unknown = JSON.parse(
        storage.getItem(DISCONNECTED_REPOSITORIES_KEY) ?? "[]",
      );

      return new Set(
        Array.isArray(parsed)
          ? parsed.filter((id): id is string => typeof id === "string")
          : [],
      );
    } catch {
      return new Set();
    }
  };

  const all = (): RepositoryDto[] => {
    if (!scenario.hasOrganization) {
      return [];
    }

    const connected = REPOSITORIES_TO_CONNECT.slice(0, connectedCount()).map(
      (name, index): RepositoryDto => ({
        id: `repo_connected_${String(index + 1)}`,
        owner: "acme",
        name,
        private: true,
        default_branch: "main",
        html_url: `https://github.com/acme/${name}`,
        // null, like the real backend: nothing records when this happened.
        connected_at: null,
        last_run_at: null,
      }),
    );
    const base: readonly RepositoryDto[] = scenario.hasRepositories
      ? REPOSITORIES
      : [];

    const removed = disconnectedIds();

    return [...base, ...connected]
      .filter((repository) => !removed.has(repository.id))
      .sort((a, b) =>
        `${a.owner}/${a.name}`.localeCompare(`${b.owner}/${b.name}`, "en"),
      );
  };

  return {
    page(cursor: number) {
      const items = all();
      const next = cursor + PAGE_SIZE;

      return {
        items: items.slice(cursor, next),
        next_cursor: next < items.length ? String(next) : null,
        total_count: items.length,
      };
    },

    connectOne(): void {
      const count = Math.min(
        connectedCount() + 1,
        REPOSITORIES_TO_CONNECT.length,
      );

      storage.setItem(CONNECTED_REPOSITORIES_KEY, String(count));
    },

    /** Removes a connected repository; false when there is no such repository. */
    disconnect(id: string): boolean {
      if (!all().some((repository) => repository.id === id)) {
        return false;
      }

      storage.setItem(
        DISCONNECTED_REPOSITORIES_KEY,
        JSON.stringify([...disconnectedIds(), id]),
      );

      return true;
    },
  };
}
