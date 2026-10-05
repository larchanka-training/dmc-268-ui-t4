# Task 1 — Sign in with GitHub: task list

Implements [Spec 001](./001-github-auth.md). Decisions taken while implementing are in
[decisions.md](./decisions.md). Test results: [001-test-results.md](./001-test-results.md).

Each task is done test-first: the failing test is written and run before the code.
Status: T1–T23 done in the working tree (not committed); T24–T25 are outside this repository.

## Domain (`modules/auth/domain`)

- [x] **T1** `Session.currentOrganizationId` becomes `string | null`;
      `currentOrganization()` returns `null` for it.
- [x] **T2** User and organisation `avatarUrl` become `string | null`: only `https:` URLs
      are kept (Spec §8.7).
- [x] **T3** `sanitizeReturnTo()`: only local paths. Rejects `//`, `/\`, control characters,
      `/login` and `/auth/*` (Spec §7).
- [x] **T4** `SignInResult` and `parseSignInResult()`: the four callback outcomes, with
      unknown values treated as `server_error` (Spec §5).
- [x] **T5** `signInDestination()`: no organisation → `/auth/success`; otherwise the
      sanitised `return_to`, or `/auth/success` (Spec §4).

## Application (`modules/auth/application`)

- [x] **T6** `SessionRepository` gains `signOut()`; `getSignInUrl()` accepts a missing
      `return_to`.
- [x] **T7** Use case `completeSignIn()`: resolves the callback into a session plus a
      destination, or into a sign-in error.
- [x] **T8** Use case `signOut()`: a network failure still counts as signed out.

## Infrastructure

- [x] **T9** HTTP client (`shared/lib/http`): `X-Requested-With: fetch` on every request,
      `204` without a body, the `onUnauthorized` hook with a per-request opt-out (Spec §7).
- [x] **T10** Session repository: nullable organisation, `https:`-only avatars,
      `POST /auth/logout`, sign-in URL with a sanitised `return_to`.

## App wiring (`app/`)

- [x] **T11** The unauthorised handler: on a `401`, clear the session and send the user to
      `/login?returnTo=<current path>`, at most once per navigation.
- [x] **T12** The composition root wires the handler into the HTTP client, and swaps in
      the mock sign-in URL in mock mode.
- [x] **T13** Routes: `/login` (error banner, redirect when already signed in),
      `/auth/callback`, `/auth/success`. The console guard drops `staleTime: "static"`.
- [x] **T14** Sign-out across tabs through `BroadcastChannel("auth")`.

## Presentation (`modules/auth/presentation`)

- [x] **T15** `/login` page: the error banner (cancelled vs generic) and a retry that keeps
      `returnTo`.
- [x] **T16** `/auth/callback` page: a spinner while the session loads.
- [x] **T17** `/auth/success` page: avatar, name, `@login`, organisations with roles, the
      "not installed yet" state, "Go to the console", "Sign out".
- [x] **T18** "Sign out" in the console header.

## Mocks (`shared/mocks`)

- [x] **T19** The mock session: signed-in state per scenario, sign-in through the callback
      URL, `POST /auth/logout`, `401` on every endpoint while signed out.
- [x] **T20** New scenarios `signed-out`, `denied`, `no-orgs` and `expired`, in the panel too.

## Documentation and checks

- [x] **T21** FRONTEND_ARCHITECTURE.md (both languages): an auth section, the endpoints,
      the session row in the state table (Spec §11).
- [x] **T22** Code comments that describe the old auth model are updated.
- [x] **T23** `check-types`, `lint`, `lint:css`, `format:check`, `test`, `build` and
      `build:demo` pass; the production bundle has no mock code; results are written to
      `001-test-results.md`.

## Outside this repository

Not doable from this repository; they stay open.

- [ ] **T24** Backend: the Spec §5 contract (agreed, D1), the CSRF checks, `no-store` and the
      1-hour idle timeout.
- [ ] **T25** Hosting: the CSP and `Referrer-Policy` headers (D3); the provider callback
      URL per environment (D4).
