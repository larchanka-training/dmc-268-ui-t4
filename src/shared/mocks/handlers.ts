import { HttpResponse, http } from "msw";

import { currentScenario } from "./scenario";
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

/**
 * Mock backend. The handlers speak the same contract the real API is expected to
 * implement, so switching to it is a matter of turning the mocks off.
 */
export const handlers = [
  http.get(`${BASE}/me`, () =>
    HttpResponse.json(sessionFor(currentScenario().role)),
  ),

  http.get(`${BASE}/runs/active`, () =>
    HttpResponse.json({
      items: currentScenario().hasActiveRuns ? [activeRun] : [],
    }),
  ),

  http.get(`${BASE}/runs`, ({ request }) => {
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
