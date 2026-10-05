# Review findings — to verify

Collected during the review of 2026-09-26. Tick an item once it is verified (or rejected),
and note the outcome next to it. Items marked **(auth)** are handled by
[Spec 001](./specs/001-github-auth.md) and only need checking against that spec.

## A. Architecture spec (FRONTEND_ARCHITECTURE.md, both languages)

### Contradictions

- [ ] **A1** The §6 example shows hunk `lines` as strings, but §10 relies on a structured
      diff for "unambiguous line numbers". Lines need `type`, `old_line`, `new_line` and
      `content`; hunks need `id`, `old_start`, `old_lines`, `new_start`, `new_lines` and
      `header`; the snippet needs `old_path`; a finding needs `published_at`. The example
      fails the current Zod schema with 9 errors.
- [ ] **A2** Admin is "lazy and isolated" (§3), yet §4 says the composition root builds
      every adapter. How does a lazily loaded module get its dependencies without app/
      importing it statically?
- [ ] **A3** "Nothing but infrastructure knows HTTP" (§2) conflicts with the HTTP client in
      `shared/lib` (§3) and `createHttpClient` in the composition root (§4).
- [ ] **A4** §2 principles that the §3 lint rules don't cover: no React in `domain`, HTTP only in
      `infrastructure`, admin loaded lazily. Either list them as rules or call them
      conventions. (Verified: lint accepts all three violations.)
- [ ] **A5** §1 promises "what the agent published", but §6 drops findings outside their
      snippet. The client checks against a snippet, the backend against the whole diff, so
      they are not "the same check". A valid comment can disappear, and the run's finding
      count won't match the list.
- [ ] **A6** §5 polling stops when "every run is terminal", but `/runs/active` only returns
      active runs, so in practice polling stops when the list is empty and never restarts.
      A run that finishes also leaves Active without appearing in History (§5 "never shifts
      the page"). Missing: the active-to-history rule and an idle polling interval.
- [ ] **A7** One DOM anchor per line (§7) vs one snippet per finding: the same line can
      appear in several snippets, and two findings on one line share an id. The spec
      doesn't say what a deep link targets, or whether anchors belong in the URL (CLAUDE.md
      says so; the §5 table doesn't).
- [ ] **A8** The §7 diagram puts `InlineFinding` and `SuggestionBlock` inside `DiffSnippet`;
      they are comment content passed in by the runs module. "`DiffLine` already takes a
      side" is false; the side lives on `DiffPosition`.

### Gaps

- [ ] **A9** No list of run statuses or pipeline stages, although "terminal status", the
      status filter and the timeline depend on one.
- [ ] **A10** No roles or permissions table (owner, member, platform admin), although §8's
      `?mock=` switch assumes one.
- [ ] **A11** **(auth, partly)** No auth flow, sign-out, session expiry, organisation
      switching, or rule for how the API knows the current organisation. Spec 001 covers
      the flow, sign-out and expiry; organisation switching and organisation scoping of
      the API remain open.
- [ ] **A12** §6 is incomplete: the `GET /runs` parameters and paging shape, the `/me` and
      `/runs/active` shapes, an error format, billing/admin endpoints, which revision file
      lines come from, and unfolding for added or deleted files and old-side comments.
      Spec 001 §5 defines `/me` and the auth endpoints.
- [ ] **A13** No route map. The public pricing page is missing from the §1 table of areas.
- [ ] **A14** Unspecified: whether run details update live for an in-progress run.
- [ ] **A15** No cross-cutting rules for loading, empty and error states, or 401/403
      handling.
- [ ] **A16** §8 cites "the DoD", which is defined nowhere.
- [ ] **A17** The spec mixes requirements with statements about the codebase ("covered by
      tests", "already takes a side", "a violation fails lint", the `refetchInterval`
      snippet, §9). Split each section into the requirement and, optionally, a current-state
      note.
- [ ] **A18** §9 says hooks run "the full set" on push and CI adds only `format:check`. In
      fact pre-push has no `format:check` or `build`, and CI also runs `build`.

## B. Code

### High

- [ ] **B1** `modules/runs/presentation/queries.ts:34`: active runs stop polling once the
      list is empty; new runs don't appear until the user leaves the page and comes back
      after 30 s. (Design gap, see A6.)
- [ ] **B2** A run that finishes while the page is open disappears from Active and doesn't
      show in History. Don't auto-refetch History (that breaks §5); consider a "N new
      runs" banner.
- [ ] **B3** `queries.ts:57`: `useRunDetails` never polls, so an in-progress run's timeline,
      summary and findings stay frozen.
- [ ] **B4** **(auth)** `app/routes/router.tsx:58-60`: the session is cached with
      `staleTime: "static"` and nothing handles 401, so an expired session shows "Could not
      load runs" instead of redirecting to the login page. Fixed by Spec 001 §7 (5-minute
      `staleTime`, `onUnauthorized`). **Implemented in Task 1, to verify.**
- [ ] **B5** `runs-filters.tsx:48-66` + `router.tsx:111`: every keystroke adds a browser
      history entry (no `replace: true`), sends a request (no debounce) and flashes the
      History skeleton (no `placeholderData`).

### Medium

- [ ] **B6** `run-details-page.tsx:55-70`: a failed context expansion is an unhandled
      rejection with no feedback; the global `loadingGapId` is overwritten when two gaps
      load at once (and collides if hunk ids repeat across findings); a late response can
      land after the page has switched runs.
- [ ] **B7** `app/layouts/console-layout.tsx:55`: with the preference on "system" and the OS in
      dark mode, the first click on the theme toggle changes nothing. Scheduled in Spec 002 §4.1.
      **Implemented in Task 2, to verify.**
- [ ] **B8** `app/main.tsx:34`: if MSW fails to start, nothing catches the error and the
      page stays blank (dev and demo only).
- [ ] **B9** `pnpm build:demo` ships MSW with mocks turned off: there is no `.env.demo`,
      so `VITE_ENABLE_MOCKS` falls back to `false`. (Verified: the inlined env has no flag.)
      CI never builds demo. **Fixed, to verify:** `env.ts` defaults the mocks to on in demo
      mode (an explicit `VITE_ENABLE_MOCKS` still wins); CI now runs `build:demo`.
- [ ] **B10** No `errorComponent`, `notFoundComponent` or `defaultErrorComponent` on any
      route, so errors show TanStack's default screen. **Fixed, to verify:**
      `app/routes/route-fallbacks.tsx`, set as `defaultErrorComponent` and
      `defaultNotFoundComponent`.
- [ ] **B11** `shared/lib/http.ts:95`: `response.json()` runs outside the try block, so a
      non-JSON body throws a raw `SyntaxError` (treated as retryable). All other 4xx
      (including 429) become `"validation"`, and the server's error message is dropped. Low
      under today's contract; **(auth)** logout's 204 makes this live. Spec 001 §7 covers
      only the 204 (**implemented in Task 1**); the rest stays open.

### Low

- [ ] **B12** `runs/infrastructure/dto.ts`: `z.url()` accepts `javascript:` and `data:`
      (verified), and these URLs go into `href`. Restrict them to `https:`.
- [ ] **B13** **(auth)** `router.tsx:37`: `returnTo` accepts any string. It's an open
      redirect unless the backend validates it. Fixed by Spec 001 §7 (`sanitizeReturnTo`,
      applied by the SPA and the backend). **Implemented in Task 1, to verify.**
- [ ] **B14** `router.tsx:81-88`: `from` and `to` filters exist in the URL and API, but not
      in the UI.
- [ ] **B15** `finding-card.tsx`: `externalUrl` is never passed to `DiffSnippet`, so the
      "Open on GitHub" link in the file header never renders.
- [ ] **B16** `suggestion-block.tsx:21`: a failed clipboard write is an unhandled
      rejection with no feedback.
- [ ] **B17** `shared/mocks/handlers.ts`: there's no details fixture for the active run, so
      clicking it in dev shows "Could not load this run".
- [ ] **B18** `shared/lib/format.ts:53`: `formatMoney` assumes two decimal places (wrong
      for JPY). Unused for now.

## C. Tooling

- [ ] **C1** `pnpm install` regenerates `public/mockServiceWorker.js` in MSW's own
      formatting, so the working tree is always dirty. Commit the file exactly as generated.
      **Fixed, to verify:** the file is now byte-identical to the copy in the `msw` package;
      commit it.
- [ ] **C2** Lint accepts: React in `domain`, `app/` importing admin statically, a
      presentation layer importing another module's HTTP adapter through its `index.ts`, and
      presentation importing `shared/lib/http`. (Verified with temporary files.)
- [ ] **C3** `public/mockServiceWorker.js` is copied into the production `dist/` too.
      Harmless, but it contradicts "a normal build drops MSW".

## D. Before task 1 (Spec 001)

- [x] **D1** Confirmed 2026-10-03. The backend team agrees to the Spec 001 §5 contract: nullable
      `current_organization_id`; the callback redirect with `result`; `204` on logout;
      `X-Requested-With` + `Origin` checks; `Cache-Control: no-store`; server-side
      `return_to` validation; a 1-hour idle timeout configurable via a setting.
- [ ] **D2** A dev proxy: `vite.config.ts` has no `server.proxy`, so `/api` is not
      same-origin in dev and the session cookie won't flow. Needed only against a real
      backend; mocks work without it. **Done, to verify:** `vite.config.ts` proxies `/api`
      to `API_PROXY_TARGET` when it's set (README, "Running against a real backend").
- [ ] **D3** An owner for the security headers (CSP, `Referrer-Policy`) at the hosting or
      reverse-proxy level, outside this repo.
- [ ] **D4** The provider's callback URL `/api/auth/github/callback` registered for each
      environment.
- [ ] **D5** Fix **B9** (demo mocks), **B10** (default error page) and **C1** (MSW worker
      formatting) first: task 1 touches the same code. **Done, to verify** (see each item).
