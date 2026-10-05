import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useState } from "react";

import { clearSessionCache } from "@/modules/auth";

import { createAppDependencies } from "./composition/dependencies";
import { createUnauthorizedHandler } from "./composition/unauthorized-handler";
import { env } from "./config/env";
import { AppProviders } from "./providers/app-providers";
import { createQueryClient } from "./providers/query-client";
import { createAppRouter } from "./routes/router";

/**
 * Statically false in a normal production build, so the bundler drops the import below
 * together with MSW and the fixtures. The demo build keeps them. Written out here rather
 * than imported: the bundler only folds a condition it can see in the same module.
 */
const MOCKS_AVAILABLE = import.meta.env.DEV || import.meta.env.MODE === "demo";

// Behind the build-time flag, so the panel and the fixtures never reach a real bundle.
const DevScenarioPanel = MOCKS_AVAILABLE
  ? lazy(async () => {
      const module = await import("@/shared/mocks/dev-scenario-panel");

      return { default: module.DevScenarioPanel };
    })
  : null;

/**
 * Builds the app once. The HTTP client exists before the router and the query cache, so
 * its 401 hook is connected to them afterwards.
 */
function createApp() {
  let handleUnauthorized: () => void = () => undefined;

  const dependencies = createAppDependencies({
    onUnauthorized: () => {
      handleUnauthorized();
    },
  });
  const queryClient = createQueryClient();
  const router = createAppRouter({ queryClient, dependencies });

  handleUnauthorized = createUnauthorizedHandler({
    currentLocation: () => router.state.location,
    clearSession: () => {
      clearSessionCache(queryClient);
    },
    redirectToLogin: (returnTo) =>
      router.navigate({ to: "/login", search: { returnTo } }),
  });

  return { dependencies, queryClient, router };
}

export function App() {
  const [{ dependencies, queryClient, router }] = useState(createApp);

  // Another tab signed out: the cookie is gone for this tab as well.
  useEffect(
    () =>
      dependencies.auth.notifier.onSignedOut(() => {
        clearSessionCache(queryClient);
        void router.navigate({ to: "/login", search: {} });
      }),
    [dependencies, queryClient, router],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders dependencies={dependencies}>
        <RouterProvider router={router} />
        {DevScenarioPanel && env.enableMocks ? (
          <Suspense fallback={null}>
            <DevScenarioPanel />
          </Suspense>
        ) : null}
      </AppProviders>
    </QueryClientProvider>
  );
}
