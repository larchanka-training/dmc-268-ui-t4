import { type QueryClient } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  type RouterHistory,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { z } from "zod";

import {
  AuthCallbackPage,
  LoginPage,
  type Session,
  SignInSuccessPage,
  can,
  completeSignIn,
  sessionQueryKey,
  sessionQueryOptions,
  signInDestination,
} from "@/modules/auth";
import { BillingPage, PricingPage } from "@/modules/billing";
import {
  RepositoriesPage,
  announceRepositoriesConnected,
  repositoriesQueryKeys,
} from "@/modules/repositories";
import { type RunFilters, RunDetailsPage, RunsPage } from "@/modules/runs";

import { type AppDependencies } from "../composition/dependencies";
import { ConsoleLayout } from "../layouts/console-layout";
import { OverviewPage } from "../pages/overview-page";

import { NotFoundPage } from "./not-found-page";
import { RouteErrorPage } from "./route-error-page";

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

/** Both values are untrusted: the page sanitises returnTo and parses error itself. */
const loginSearchSchema = z.object({
  returnTo: z.string().optional(),
  error: z.string().optional(),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: loginSearchSchema,
  beforeLoad: async ({ context, search }) => {
    let session: Session | null = null;

    try {
      session = await context.queryClient.query(
        sessionQueryOptions(context.dependencies.auth),
      );
    } catch {
      // The backend is unreachable: signing in is still the right thing to offer.
    }

    if (session !== null) {
      throw redirect({
        href: signInDestination(session, search.returnTo),
        replace: true,
      });
    }
  },
  component: function LoginRoute() {
    const { returnTo, error } = loginRoute.useSearch();

    return <LoginPage returnTo={returnTo} error={error} />;
  },
});

/** The backend's redirect after GitHub: the outcome only, never a credential. */
const authCallbackSearchSchema = z.object({
  result: z.string().optional(),
  return_to: z.string().optional(),
});

const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/callback",
  validateSearch: authCallbackSearchSchema,
  beforeLoad: async ({ context, search }) => {
    const outcome = await completeSignIn(context.dependencies.auth, {
      result: search.result,
      returnTo: search.return_to,
    });

    if (outcome.kind === "failed") {
      throw redirect({
        to: "/login",
        search: { error: outcome.error, returnTo: search.return_to },
        replace: true,
      });
    }

    context.queryClient.setQueryData(sessionQueryKey, outcome.session);

    // Back must not lead into the callback again. The router already commits only the
    // final location of a redirect chain; replace keeps that true if it ever changes.
    throw redirect({ href: outcome.destination, replace: true });
  },
  pendingComponent: AuthCallbackPage,
  pendingMs: 0,
  component: AuthCallbackPage,
});

const authSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/success",
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.query(
      sessionQueryOptions(context.dependencies.auth),
    );

    if (session === null) {
      throw redirect({ to: "/login", search: {} });
    }
  },
  component: SignInSuccessPage,
});

/**
 * Everything below requires a session. The guard prefetches it through the same query
 * cache the components use, so the page renders without a second request. The cached
 * session goes stale after five minutes, so a revoked session is noticed on navigation
 * even before an API call fails with a 401.
 */
const consoleRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "console",
  beforeLoad: async ({ context, location }): Promise<{ session: Session }> => {
    const session = await context.queryClient.query(
      sessionQueryOptions(context.dependencies.auth),
    );

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
  component: OverviewPage,
});

/**
 * `connected=1` is where GitHub's Setup URL sends the user back after connecting. The
 * router parses search values as JSON, so the flag arrives as the number 1.
 */
const repositoriesSearchSchema = z.object({
  connected: z
    .union([z.literal(1), z.literal("1")])
    .optional()
    .catch(undefined),
});

const repositoriesRoute = createRoute({
  getParentRoute: () => consoleRoute,
  path: "/repositories",
  validateSearch: repositoriesSearchSchema,
  beforeLoad: ({ context, search }) => {
    if (search.connected === undefined) {
      return;
    }

    announceRepositoriesConnected();
    void context.queryClient.invalidateQueries({
      queryKey: repositoriesQueryKeys.all,
    });

    // Without the flag in the URL, a reload does not announce the change again.
    throw redirect({ to: "/repositories", search: {}, replace: true });
  },
  component: RepositoriesPage,
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
  authCallbackRoute,
  authSuccessRoute,
  consoleRoute.addChildren([
    indexRoute,
    repositoriesRoute,
    runsRoute,
    runDetailsRoute,
    billingRoute,
    adminRoute,
  ]),
]);

/**
 * @param options for tests: an in-memory history, and `isServer: false` so the router
 * follows redirects in Node the way it does in the browser.
 */
export function createAppRouter(
  context: RouterContext,
  options: { history?: RouterHistory; isServer?: boolean } = {},
) {
  return createRouter({
    routeTree,
    context,
    ...options,
    defaultPreload: "intent",
    defaultErrorComponent: RouteErrorPage,
    defaultNotFoundComponent: NotFoundPage,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
