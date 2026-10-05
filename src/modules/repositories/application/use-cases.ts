import { errorKind } from "@/shared/lib/errors";

import { isSafeConnectUrl } from "../domain/connect-url";

import { type ConnectedReposApi, type RepositoryPage } from "./ports";

export interface RepositoriesDependencies {
  readonly repositories: ConnectedReposApi;
}

export type ConnectStart =
  | { readonly kind: "redirect"; readonly url: string }
  | {
      readonly kind: "failed";
      readonly reason: "unavailable" | "unsafe-url";
    };

export type DisconnectStart =
  | { readonly kind: "redirect"; readonly url: string }
  | {
      readonly kind: "failed";
      readonly reason: "unavailable" | "unsafe-url" | "not-found";
    };

export function listRepositories(
  { repositories }: RepositoriesDependencies,
  params: { cursor?: string },
  signal?: AbortSignal,
): Promise<RepositoryPage> {
  return repositories.listRepositories(params, signal);
}

/**
 * Connecting happens on GitHub: this only finds out where to send the user, and refuses a
 * URL that could lead anywhere unexpected.
 */
export async function startConnect(
  { repositories }: RepositoriesDependencies,
  signal?: AbortSignal,
): Promise<ConnectStart> {
  let url: string;

  try {
    url = await repositories.getConnectUrl(signal);
  } catch {
    return { kind: "failed", reason: "unavailable" };
  }

  return isSafeConnectUrl(url)
    ? { kind: "redirect", url }
    : { kind: "failed", reason: "unsafe-url" };
}

/**
 * Disconnecting also happens on GitHub: this finds out where, and tells apart a repository
 * that is already gone from GitHub being unreachable.
 */
export async function startDisconnect(
  { repositories }: RepositoriesDependencies,
  repositoryId: string,
  signal?: AbortSignal,
): Promise<DisconnectStart> {
  let url: string;

  try {
    url = await repositories.getDisconnectUrl(repositoryId, signal);
  } catch (error) {
    return {
      kind: "failed",
      reason: errorKind(error) === "not-found" ? "not-found" : "unavailable",
    };
  }

  return isSafeConnectUrl(url)
    ? { kind: "redirect", url }
    : { kind: "failed", reason: "unsafe-url" };
}
