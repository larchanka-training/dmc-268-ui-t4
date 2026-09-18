import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { Suspense, lazy, useState } from "react";

import { createAppDependencies } from "./composition/dependencies";
import { env } from "./config/env";
import { AppProviders } from "./providers/app-providers";
import { createQueryClient } from "./providers/query-client";
import { createAppRouter } from "./routes/router";

const MOCKS_AVAILABLE = import.meta.env.DEV || import.meta.env.MODE === "demo";

// Behind the build-time flag, so the panel and the fixtures never reach a real bundle.
const DevScenarioPanel = MOCKS_AVAILABLE
  ? lazy(async () => {
      const module = await import("@/shared/mocks/dev-scenario-panel");

      return { default: module.DevScenarioPanel };
    })
  : null;

export function App() {
  const [{ dependencies, queryClient, router }] = useState(() => {
    const dependencies = createAppDependencies();
    const queryClient: QueryClient = createQueryClient();

    return {
      dependencies,
      queryClient,
      router: createAppRouter({ queryClient, dependencies }),
    };
  });

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
