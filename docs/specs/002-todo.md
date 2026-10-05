# Task 2 — Account layout and connected repositories: task list

Implements [Spec 002](./002-account-layout.md). Decisions taken while implementing are in
[decisions.md](./decisions.md), section "Task 2". Test results:
[002-test-results.md](./002-test-results.md).

Each task is done test-first: the failing test is written and run before the code.
Status: R1–R27 done in the working tree (not committed).

## Domain

- [x] **R1** Auth: the action `repositories:connect`, for organisation owners only.
- [x] **R2** `Repository`, `sortByFullName`, `sidebarSlice` (up to 8, with "more"),
      `recentlyReviewed(n)` (most recent review first, never-reviewed left out).
- [x] **R3** `isSafeConnectUrl`: https, or a root-relative path (no `//` or `/\`).
- [x] **R4** Theme: the toggle switches away from the theme _shown_, not from the stored
      preference (B7).

## Application and infrastructure (`modules/repositories`)

- [x] **R5** Port `ConnectedReposApi`; use cases `listRepositories` and
      `startConnect` (a URL to follow, or a typed failure).
- [x] **R6** HTTP adapter with Zod DTOs: `total_count`, cursor paging, `html_url` kept only
      when https, nullable `last_run_at`.

## Presentation

- [x] **R7** Queries: the repositories list (infinite, shared by the sidebar, Overview and
      page), and the connect mutation that follows the URL in the same tab.
- [x] **R8** The "connected" banner state (Zustand): set when GitHub sends the user back,
      dismissed by the user, gone after a reload.
- [x] **R9** `ConnectRepositoryButton`: owner-only, disabled with a hint for members,
      spinner while starting, inline error with Retry.
- [x] **R10** `RepositoriesSidebar`: heading with the count, quick list, "View all", and the
      loading, error, empty and no-organisation states.
- [x] **R11** `RepositoriesPage`: rows, "Load more", banner, and the empty, error and
      loading states.

## App

- [x] **R12** The console shell: sticky top bar (brand, primary nav with
      `aria-current`, theme toggle, account menu), the sidebar from `md` up, and the mobile
      drawer (shadcn `sheet`).
- [x] **R13** The Overview page at `/` (repositories card, reviews card, install card).
- [x] **R14** Routes: `/` renders the Overview; `/repositories?connected=1` refreshes the
      list, raises the banner and drops `connected` from the URL; the success page points
      at `/`.
- [x] **R15** Composition root: the repositories adapter and its dependency provider.

## Mocks

- [x] **R16** Repository fixtures (11), `GET /repositories` (paged, `total_count`) and
      `GET /repositories/connect-url`. Connecting adds one repository, kept in
      `localStorage`.
- [x] **R17** Scenario `no-repos`; the `no-orgs` scenario has no repositories.

## Documentation and checks

- [x] **R18** FRONTEND_ARCHITECTURE.md (both languages): the repositories module, the
      shell, the endpoints, the new scenario; README scenario list.
- [x] **R19** `check-types`, `lint`, `lint:css`, `format:check`, `test`, `build` and
      `build:demo` pass; no mock code in the production bundle; results are written to
      `002-test-results.md`.

## Disconnect a repository (Spec 002 §6.1)

Added after R1–R19. The same rules apply: test-first, no network in tests, no commits.

- [x] **R20** Auth: the action `repositories:disconnect`, for organisation owners only.
- [x] **R21** Port `ConnectedReposApi.getDisconnectUrl(id)`; a use case `startDisconnect`
      that returns the URL, `not-found` (a `404`), `unsafe-url` or `unavailable`.
- [x] **R22** HTTP adapter: `GET /repositories/{id}/disconnect-url`, with the id encoded.
- [x] **R23** Mocks: `GET /repositories/:id/disconnect-url`. It removes the repository
      (kept in `localStorage`, reset with the scenario) and returns
      `/repositories?connected=1`, or `404` for an unknown id.
- [x] **R24** `shared/ui/alert-dialog` (shadcn, on Radix AlertDialog, semantic colour tokens
      only).
- [x] **R25** `useDisconnectRepository` and `DisconnectRepositoryButton`: the confirmation
      dialog, a spinner while starting, the `404` and error states, and the list refetch
      on `404`.
- [x] **R26** The Repositories page: Disconnect on each row, for owners only.
- [x] **R27** Spec 002, `decisions.md`, the architecture doc (both languages) and the
      test results, all in sync; every check passes. The backend steps file now lives in
      `dmc-268-api-t4/docs/`, which has work in progress, so its addition is written out in
      decision 2.24 rather than applied there.
