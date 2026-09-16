import { type QueryClient } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { z } from "zod";

import { type Session, can, sessionQueryOptions } from "@/modules/auth";
import { LoginPage } from "@/modules/auth";
import { BillingPage, PricingPage } from "@/modules/billing";
import { type RunFilters, RunDetailsPage, RunsPage } from "@/modules/runs";

import { type AppDependencies } from "../composition/dependencies";
import { ConsoleLayout } from "../layouts/console-layout";

export interface RouterContext {
  readonly queryClient: QueryClient;
  readonly dependencies: AppDependencies;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
});

/** Public area: no session needed. */
const pricingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pricing",
  component: PricingPage,
});

const loginSearchSchema = z.object({ returnTo: z.string().optional() });

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: loginSearchSchema,
  component: function LoginRoute() {
    const { returnTo } = loginRoute.useSearch();

    return <LoginPage returnTo={returnTo ?? "/runs"} />;
  },
});

/**
 * Everything below requires a session. The guard prefetches it through the same query
 * cache the components use, so the page renders without a second request.
 */
const consoleRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "console",
  beforeLoad: async ({ context, location }): Promise<{ session: Session }> => {
    const session = await context.queryClient.query({
      ...sessionQueryOptions(context.dependencies.auth),
      staleTime: "static",
    });

    if (session === null) {
      throw redirect({ to: "/login", search: { returnTo: location.href } });
    }

    return { session };
  },
  component: ConsoleLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => consoleRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/runs", search: { status: "all" as const } });
  },
});

/** Filters live in the URL; anything unexpected falls back instead of reaching the UI. */
const runsSearchSchema = z.object({
  status: z.enum(["all", "completed", "failed"]).default("all").catch("all"),
  repository: z.string().optional(),
  author: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
});

const runsRoute = createRoute({
  getParentRoute: () => consoleRoute,
  path: "/runs",
  validateSearch: runsSearchSchema,
  component: function RunsRoute() {
    const search = runsRoute.useSearch();
    const navigate = useNavigate();

    const filters: RunFilters = {
      status: search.status,
      repository: search.repository,
      author: search.author,
      from: search.from,
      to: search.to,
      query: search.q,
    };

    return (
      <RunsPage
        filters={filters}
        onFiltersChange={(next) => {
          void navigate({
            to: "/runs",
            search: {
              status: next.status,
              repository: next.repository,
              author: next.author,
              from: next.from,
              to: next.to,
              q: next.query,
            },
          });
        }}
      />
    );
  },
});

const runDetailsRoute = createRoute({
  getParentRoute: () => consoleRoute,
  path: "/runs/$runId",
  component: function RunDetailsRoute() {
    const { runId } = runDetailsRoute.useParams();

    return <RunDetailsPage runId={runId} />;
  },
});

const billingRoute = createRoute({
  getParentRoute: () => consoleRoute,
  path: "/billing",
  component: BillingPage,
});

/**
 * The admin module is isolated: it is pulled in lazily here and nowhere else, so its code
 * never reaches a customer's main bundle.
 */
const adminRoute = createRoute({
  getParentRoute: () => consoleRoute,
  path: "/admin/subscriptions",
  beforeLoad: ({ context }) => {
    const session = context.queryClient.getQueryData(
      sessionQueryOptions(context.dependencies.auth).queryKey,
    );

    if (!can(session ?? null, "admin:view")) {
      throw redirect({ to: "/runs", search: { status: "all" as const } });
    }
  },
  component: lazyRouteComponent(
    () => import("@/modules/admin"),
    "AdminSubscriptionsPage",
  ),
});

const routeTree = rootRoute.addChildren([
  pricingRoute,
  loginRoute,
  consoleRoute.addChildren([
    indexRoute,
    runsRoute,
    runDetailsRoute,
    billingRoute,
    adminRoute,
  ]),
]);

export function createAppRouter(context: RouterContext) {
  return createRouter({ routeTree, context, defaultPreload: "intent" });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
