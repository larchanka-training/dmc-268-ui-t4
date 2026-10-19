import { HttpResponse, http } from "msw";

import { createMockRepositories } from "./repositories";
import { currentScenario } from "./scenario";
import { browserStorage, createMockSession } from "./session";
import {
  PAYMENT_SERVICE_FILE,
  activeJob,
  activeJobDetail,
  completedJob,
  completedJobDetail,
  failedJob,
  failedJobDetail,
  findingContexts,
  findingWithoutContext,
  findings,
  olderJobs,
  sessionFor,
} from "./state";

const BASE = "/api";

const history = [completedJob, failedJob, ...olderJobs];
const PAGE_SIZE = 8;

const notFound = () =>
  HttpResponse.json({ error: "not_found" }, { status: 404 });

const jobDetails: Record<string, unknown> = {
  [completedJob.id]: {
    ...completedJobDetail,
    findings: [...findings, findingWithoutContext],
  },
  [failedJob.id]: failedJobDetail,
  [activeJob.id]: activeJobDetail,
};

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

  http.get(`${BASE}/jobs`, ({ request }) => {
    if (!session.authorize()) {
      return unauthorized();
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    if (status === "active") {
      return HttpResponse.json({
        items: scenario.hasActiveRuns ? [activeJob] : [],
        next_cursor: null,
      });
    }

    const repository = url.searchParams.get("repository");
    const author = url.searchParams.get("author");
    const query = url.searchParams.get("q");
    const cursor = Number(url.searchParams.get("cursor") ?? "0");

    const filtered = history.filter((job) => {
      if (status !== null && job.status !== status) {
        return false;
      }

      if (
        repository !== null &&
        !job.pull_request.repo_full_name.includes(repository)
      ) {
        return false;
      }

      if (author !== null && !job.pull_request.author.includes(author)) {
        return false;
      }

      if (query !== null) {
        const haystack = `${job.pull_request.title} #${String(job.pull_request.number)}`;

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

  http.get(`${BASE}/jobs/:jobId`, ({ params }) => {
    if (!session.authorize()) {
      return unauthorized();
    }

    const detail = jobDetails[String(params["jobId"])];

    return detail === undefined ? notFound() : HttpResponse.json(detail);
  }),

  // Rebuilt from the forge in reality; a finding on a commit that is gone answers 409.
  http.get(`${BASE}/jobs/:jobId/findings/:findingId/context`, ({ params }) => {
    if (!session.authorize()) {
      return unauthorized();
    }

    const context = findingContexts[String(params["findingId"])];

    if (params["findingId"] === findingWithoutContext.id) {
      return HttpResponse.json({ error: "commit_gone" }, { status: 409 });
    }

    return context === undefined ? notFound() : HttpResponse.json(context);
  }),

  http.get(`${BASE}/jobs/:jobId/file-lines`, ({ request }) => {
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
