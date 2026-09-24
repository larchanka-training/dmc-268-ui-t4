import {
  type AuthDependencies,
  createHttpSessionRepository,
} from "@/modules/auth";
import {
  type RunsDependencies,
  createHttpRunsRepository,
} from "@/modules/runs";
import { createHttpClient } from "@/shared/lib/http";

import { env } from "../config/env";

export interface AppDependencies {
  readonly auth: AuthDependencies;
  readonly runs: RunsDependencies;
}

/**
 * The composition root: the only place that builds adapters and hands them to the
 * modules. Swapping HTTP for something else is a change in this file alone.
 */
export function createAppDependencies(): AppDependencies {
  const http = createHttpClient(env.apiBaseUrl);

  return {
    auth: { session: createHttpSessionRepository(http, env.apiBaseUrl) },
    runs: { runs: createHttpRunsRepository(http) },
  };
}
