import { HttpResponse, http } from "msw";

import { createMockRepositories } from "./repositories";
import { currentScenario } from "./scenario";
import { browserStorage, createMockSession } from "./session";
import {
  PAYMENT_SERVICE_FILE,
  activeRun,
  completedRun,
  completedRunDetails,
  failedRun,
  failedRunDetails,
  findingOutsideDiff,
  findings,
  olderRuns,
  sessionFor,
} from "./state";

const BASE = "/api";

const history = [completedRun, failedRun, ...olderRuns];
const PAGE_SIZE = 8;

const scenario = currentScenario();

// Created when the mocks start, i.e. on every full page load, before the app renders.
const session = createMockSession({
  scenario,
  storage: browserStorage(),
  location: window.location,
});

const repositories = createMockRepositories({
  scenario,
  storage: browserStorage(),
});

const unauthorized = () =>
  HttpResponse.json({ error: "no_session" }, { status: 401 });

/**
 * Mock backend. The handlers speak the same contract the real API is expected to
 * implement, so switching to it is a matter of turning the mocks off. Like the real API,
 * every endpoint answers 401 without a session.
 */
export const handlers = [
  http.get(`${BASE}/me`, () =>
    session.authorize()
      ? HttpResponse.json(sessionFor(scenario.role, scenario.hasOrganization))
      : unauthorized(),
  ),

  http.post(`${BASE}/auth/logout`, () => {
    session.signOut();

    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BASE}/repositories`, ({ request }) => {
    if (!session.authorize()) {
      return unauthorized();
    }

    const cursor = Number(
      new URL(request.url).searchParams.get("cursor") ?? "0",
    );

    return HttpResponse.json(repositories.page(cursor));
  }),

  // In reality the owner picks repositories on GitHub, and GitHub's Setup URL leads back
  // to /repositories?connected=1. The mock skips GitHub and connects one right away.
  http.get(`${BASE}/repositories/connect-url`, () => {
    if (!session.authorize()) {
      return unauthorized();
    }

    repositories.connectOne();

    return HttpResponse.json({ url: "/repositories?connected=1" });
  }),

  // In reality the owner removes the repository on GitHub, and "Redirect on update" leads
  // back through the Setup URL. The mock removes it right away.
  http.get(
    `${BASE}/repositories/:repositoryId/disconnect-url`,
    ({ params }) => {
      if (!session.authorize()) {
        return unauthorized();
      }

      const repositoryId = params["repositoryId"];

      if (
        typeof repositoryId !== "string" ||
        !repositories.disconnect(repositoryId)
      ) {
        return HttpResponse.json({ error: "not_found" }, { status: 404 });
      }

      return HttpResponse.json({ url: "/repositories?connected=1" });
    },
  ),

  http.get(`${BASE}/runs/active`, () => {
    if (!session.authorize()) {
      return unauthorized();
    }

    return HttpResponse.json({
      items: scenario.hasActiveRuns ? [activeRun] : [],
    });
  }),

  http.get(`${BASE}/runs`, ({ request }) => {
    if (!session.authorize()) {
      return unauthorized();
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const repository = url.searchParams.get("repository");
    const author = url.searchParams.get("author");
    const query = url.searchParams.get("q");
    const cursor = Number(url.searchParams.get("cursor") ?? "0");

    const filtered = history.filter((run) => {
      if (status !== null && run.status !== status) {
        return false;
      }

      const fullName = `${run.pull_request.owner}/${run.pull_request.repo}`;

      if (repository !== null && !fullName.includes(repository)) {
        return false;
      }

      if (author !== null && !run.pull_request.author.includes(author)) {
        return false;
      }

      if (query !== null) {
        const haystack = `${run.pull_request.title} #${String(run.pull_request.number)}`;

        return haystack.toLowerCase().includes(query.toLowerCase());
      }

      return true;
    });

    const page = filtered.slice(cursor, cursor + PAGE_SIZE);
    const nextCursor = cursor + PAGE_SIZE;

    return HttpResponse.json({
      items: page,
      next_cursor: nextCursor < filtered.length ? String(nextCursor) : null,
    });
  }),

  http.get(`${BASE}/runs/:runId`, ({ params }) => {
    if (!session.authorize()) {
      return unauthorized();
    }

    if (params["runId"] === failedRun.id) {
      return HttpResponse.json({ run: failedRunDetails, findings: [] });
    }

    if (params["runId"] === completedRun.id) {
      // The invalid finding is included on purpose: the mappers must drop it.
      return HttpResponse.json({
        run: completedRunDetails,
        findings: [...findings, findingOutsideDiff],
      });
    }

    return HttpResponse.json({ error: "not_found" }, { status: 404 });
  }),

  http.get(`${BASE}/runs/:runId/file-lines`, ({ request }) => {
    if (!session.authorize()) {
      return unauthorized();
    }

    const url = new URL(request.url);
    const path = url.searchParams.get("path") ?? "";
    const from = Number(url.searchParams.get("from") ?? "1");
    const to = Number(url.searchParams.get("to") ?? "1");

    const source =
      path === PAYMENT_SERVICE_FILE.path
        ? PAYMENT_SERVICE_FILE.lines
        : Array.from(
            { length: 200 },
            (_, index) => `  # ${path}:${String(index + 1)}`,
          );

    return HttpResponse.json({ path, from, lines: source.slice(from - 1, to) });
  }),
];
