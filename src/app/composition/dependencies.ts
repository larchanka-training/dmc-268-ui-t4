import {
  type AuthDependencies,
  type SessionRepository,
  createBroadcastChannelNotifier,
  createHttpSessionRepository,
} from "@/modules/auth";
import {
  type RepositoriesDependencies,
  createHttpConnectedReposApi,
} from "@/modules/repositories";
import {
  type RunsDependencies,
  createHttpRunsRepository,
} from "@/modules/runs";
import { createHttpClient } from "@/shared/lib/http";
import { currentScenario } from "@/shared/mocks/scenario";
import { mockSignInUrl } from "@/shared/mocks/session";

import { env } from "../config/env";

/**
 * Statically false in a normal production build, so the bundler drops the mock sign-in
 * branch and, with it, the mock modules imported above. The demo build keeps them. Written
 * out here rather than imported: the bundler only folds a condition it can see in the same
 * module.
 */
const MOCKS_AVAILABLE = import.meta.env.DEV || import.meta.env.MODE === "demo";

export interface AppDependencies {
  readonly auth: AuthDependencies;
  readonly runs: RunsDependencies;
  readonly repositories: RepositoriesDependencies;
}

/**
 * MSW cannot intercept the full-page trip through GitHub, so with the mocks on the sign-in
 * link goes straight to the callback with the outcome the mock scenario prescribes.
 */
function withMockSignIn(repository: SessionRepository): SessionRepository {
  return {
    ...repository,
    getSignInUrl: (returnTo) => mockSignInUrl(currentScenario(), returnTo),
  };
}

/**
 * The composition root: the only place that builds adapters and hands them to the
 * modules. Swapping HTTP for something else is a change in this file alone.
 *
 * @param onUnauthorized called when any request finds the session gone; the app connects
 * it to the router and the query cache once those exist.
 */
export function createAppDependencies({
  onUnauthorized,
}: {
  onUnauthorized: () => void;
}): AppDependencies {
  const http = createHttpClient(env.apiBaseUrl, { onUnauthorized });
  const session = createHttpSessionRepository(http, env.apiBaseUrl);

  return {
    auth: {
      session:
        MOCKS_AVAILABLE && env.enableMocks ? withMockSignIn(session) : session,
      notifier: createBroadcastChannelNotifier(),
    },
    runs: { runs: createHttpRunsRepository(http) },
    repositories: { repositories: createHttpConnectedReposApi(http) },
  };
}
