import { describe, expect, it } from "vitest";

import { createMockRepositories } from "./repositories";
import { SCENARIOS } from "./scenario";
import { type MockStorage, resetMockSession } from "./session";

function memoryStorage(): MockStorage {
  const values = new Map<string, string>();

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

function scenario(name: string) {
  const found = SCENARIOS[name];

  if (!found) {
    throw new Error(`Unknown scenario ${name}`);
  }

  return found;
}

describe("createMockRepositories", () => {
  it("serves eleven repositories in pages of ten, sorted by full name", () => {
    const repositories = createMockRepositories({
      scenario: scenario("owner"),
      storage: memoryStorage(),
    });

    const first = repositories.page(0);
    const second = repositories.page(10);

    expect(first.total_count).toBe(11);
    expect(first.items).toHaveLength(10);
    expect(first.next_cursor).toBe("10");
    expect(second.items).toHaveLength(1);
    expect(second.next_cursor).toBeNull();

    const fullNames = [...first.items, ...second.items].map(
      (item) => `${item.owner}/${item.name}`,
    );

    expect(fullNames).toEqual(
      [...fullNames].sort((a, b) => a.localeCompare(b, "en")),
    );
  });

  it.each(["no-repos", "no-orgs"])("has nothing connected in %s", (name) => {
    const page = createMockRepositories({
      scenario: scenario(name),
      storage: memoryStorage(),
    }).page(0);

    expect(page.total_count).toBe(0);
    expect(page.items).toEqual([]);
  });

  it("connects one more repository, and remembers it across reloads", () => {
    const storage = memoryStorage();

    createMockRepositories({
      scenario: scenario("owner"),
      storage,
    }).connectOne();

    expect(
      createMockRepositories({ scenario: scenario("owner"), storage }).page(0)
        .total_count,
    ).toBe(12);
  });

  it("forgets connected repositories when the scenario is reset", () => {
    const storage = memoryStorage();

    createMockRepositories({
      scenario: scenario("owner"),
      storage,
    }).connectOne();
    resetMockSession(storage);

    expect(
      createMockRepositories({ scenario: scenario("owner"), storage }).page(0)
        .total_count,
    ).toBe(11);
  });

  it("disconnects the chosen repository, and remembers it across reloads", () => {
    const storage = memoryStorage();
    const repositories = createMockRepositories({
      scenario: scenario("owner"),
      storage,
    });
    const target = repositories.page(0).items[0];

    if (!target) {
      throw new Error("expected a repository");
    }

    expect(repositories.disconnect(target.id)).toBe(true);

    const afterReload = createMockRepositories({
      scenario: scenario("owner"),
      storage,
    }).page(0);

    expect(afterReload.total_count).toBe(10);
    expect(afterReload.items.map((item) => item.id)).not.toContain(target.id);
  });

  it("refuses to disconnect a repository that is not connected", () => {
    const repositories = createMockRepositories({
      scenario: scenario("owner"),
      storage: memoryStorage(),
    });

    expect(repositories.disconnect("repo_unknown")).toBe(false);
    expect(repositories.page(0).total_count).toBe(11);
  });

  it("can disconnect a repository connected through the mock", () => {
    const storage = memoryStorage();
    const repositories = createMockRepositories({
      scenario: scenario("owner"),
      storage,
    });

    repositories.connectOne();
    expect(repositories.disconnect("repo_connected_1")).toBe(true);
    expect(repositories.page(0).total_count).toBe(11);
  });

  it("brings disconnected repositories back when the scenario is reset", () => {
    const storage = memoryStorage();

    createMockRepositories({
      scenario: scenario("owner"),
      storage,
    }).disconnect("repo_1");
    resetMockSession(storage);

    expect(
      createMockRepositories({ scenario: scenario("owner"), storage }).page(0)
        .total_count,
    ).toBe(11);
  });
});
