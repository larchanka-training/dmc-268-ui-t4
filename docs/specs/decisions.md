# Decisions to review

Choices made without asking, as agreed: for each one, the options considered, the one
picked (**✔**) and why. They are grouped by task. Anything you overrule is a small,
local change; the affected files are named.

## Before Task 1 (setup)

### P1. Turning the mocks on in the demo build

`.env*` files are blocked by the local permission settings, so `.env.demo` could not be
created.

- **✔** Default `VITE_ENABLE_MOCKS` to `true` in demo mode inside `src/app/config/env.ts`.
  An explicit value still wins.
- Commit `.env.demo` with `VITE_ENABLE_MOCKS=true`.
- Set the variable in the script: `VITE_ENABLE_MOCKS=true vite build --mode demo` (needs
  `cross-env` on Windows).

Why: the demo build _is_ the mocked console, so tying the default to the mode removes a
file that can go missing. The env module stays the only reader of `import.meta.env`.

### P2. Configuring the dev proxy

- **✔** `API_PROXY_TARGET` without the `VITE_` prefix, read in `vite.config.ts`. The proxy
  is on only when the variable is set.
- `VITE_API_PROXY_TARGET`: this would also be inlined into the browser bundle.
- A hard-coded `http://localhost:8080`.

Why: the backend address is dev-server configuration and must not ship to browsers, and
mock-only development needs no proxy.

## Task 1 — Sign in with GitHub

### 1.1 How the session probe avoids the global 401 handler

`GET /me` answers `401` when nobody is signed in, which is not a lost session.

- **✔** A per-request option, `ignoreUnauthorized: true`, on `HttpRequestOptions`.
- The HTTP client compares the path with `"/me"`.
- A second HTTP client, without the hook, for auth calls.

Why: the client stays generic (`shared/` knows no module paths). The opt-out sits next to
the call that needs it, and logout uses it too.

### 1.2 Connecting the 401 hook before the router exists

The HTTP client is built before the query client and the router.

- **✔** A late-bound callback in `App.tsx`: dependencies get `onUnauthorized: () =>
handler()`, and `handler` is set once the router exists.
- An event emitter in `shared/` that the app subscribes to.
- Build the router first and pass it into the composition root.

Why: there is no global event bus and no dependency cycle. The redirect logic itself is a
plain, tested function (`createUnauthorizedHandler`).

### 1.3 Cross-tab sign-out

- **✔** An application port, `AuthNotifier`, implemented in infrastructure with
  `BroadcastChannel("auth")`.
- A presentation-only hook calling `BroadcastChannel` directly.
- `storage` events on a `localStorage` key.

Why: the sign-out use case can notify through a port and stay testable without browser
APIs. The `storage` events alternative would mean writing to storage just to send a
signal.

### 1.4 Signing out when the logout request fails

- **✔** Swallow every error from `POST /auth/logout` and sign out locally anyway.
- Swallow only network errors, and show 5xx responses.
- Keep the user signed in and show an error.

Why: the spec says the user is signed out locally either way. Leaving them "signed in"
after they asked to leave is worse than a session that ends at its idle timeout.

### 1.5 Avatars that are not https

- **✔** Map them to `null` and show initials.
- Reject the whole `/me` response.
- Render them as they are.

Why: one bad avatar URL should not lock a user out. The session schema now accepts any
string for `avatar_url` and the mapper filters it (`shared/lib/url.ts`).

### 1.6 Where `return_to` is sanitised

- **✔** Where it is used: the `getSignInUrl` use case and `signInDestination`.
- A `.transform()` in the route search schemas.

Why: a transform makes the search type differ between input and output, which breaks the
typing of `<Link search>`. Sanitising at the two use sites keeps the URL raw and the
decision in the domain.

### 1.7 A reported success that has no session behind it

- **✔** Report `server_error` (when `/me` returns 401 or fails after `result=success`).
- A new error code, `session_missing`.

Why: the spec fixes four outcomes, and the user can do nothing different for a fifth.

### 1.8 Unknown `result` values on the callback

- **✔** Treat them as `server_error`.
- Treat a missing value as success.
- Show a separate "unknown" message.

Why: only the four documented values are trusted; anything else is a backend problem.

### 1.9 `/login` when the backend cannot be reached

- **✔** Show the sign-in page.
- Show the error page.

Why: offering sign-in is the right next step, and the attempt itself surfaces the problem.

### 1.10 Where the success page lives

- **✔** Outside the console layout, as a centred card.
- Inside the console layout.

Why: it also serves users without an organisation, for whom the console navigation leads
nowhere.

### 1.11 Sign-out in the console header

- **✔** Add a "Sign out" button to the existing header now.
- Wait for Task 2's account menu.

Why: Task 1 requires sign-out, and the success page is not reachable from the console. Task
2 replaces the button with the menu.

### 1.12 The redirect after the callback

- **✔** `redirect({ href: destination, replace: true })`.
- `redirect({ to, search })` built from a parsed destination.

Why: the destination is a full path with search and hash, and `href` keeps it intact.
Checked while testing: TanStack Router only commits the final location of a redirect
chain, so the callback never stays in the history even without `replace`. `replace` is
kept as a safeguard, and a test covers the behaviour itself.

### 1.13 Signing in through the mocks

MSW cannot intercept the full-page trip to GitHub.

- **✔** In mock mode, the sign-in link goes straight to
  `/auth/callback?result=<scenario>`. The mock session is stored in `localStorage` and
  starts when a page loads on a successful callback URL, which is the moment the real
  cookie would arrive.
- A mock-only SPA route that fakes the backend's `/api/auth/github`.
- No signed-out scenarios: every mock scenario starts signed in.

Why: the SPA's code path is the real one: callback, `/me`, then the destination. The
mock-only logic stays in `shared/mocks`.

### 1.14 What the `expired` scenario does

- **✔** The session expires on the second request, once per scenario selection, so
  signing in again leads somewhere.
- Expire on every page load (you could never get past it).
- Expire after a time limit (hard to demonstrate).

### 1.15 Mock sign-in state when the scenario changes

- **✔** Reset it: a new scenario starts from its own default sign-in state.
- Keep it across scenarios.

Why: otherwise `?mock=owner` after a mock sign-out would look signed out.

### 1.16 The build-time `MOCKS_AVAILABLE` flag

- **✔** Write the condition out in each module that needs it (`main.tsx`, `App.tsx`,
  `composition/dependencies.ts`).
- One exported constant in `env.ts`.

Why: tried, and it failed. With an imported constant, the production bundle contained
MSW, the scenario panel and the mock session, because the bundler does not fold a
condition from another module. With the inline condition the production bundle has no mock
code (verified).

### 1.17 The Content Security Policy

- **✔** Sent as an HTTP header by the hosting or reverse proxy (D3 in the review
  findings).
- A `<meta http-equiv="Content-Security-Policy">` tag in `index.html`.

Why: the Vite dev server injects inline scripts (React Fast Refresh), so a strict meta CSP
breaks development. Headers can differ per environment.

### 1.18 Testing route guards and redirects without a browser

- **✔** Real routes against fakes in Node: an in-memory history, `isServer: false`, and a
  stubbed `window.origin` (the router reads only that).
- Server mode, reading the router's private `_serverResult`.
- Add jsdom or happy-dom as a test environment.

Why: client mode runs the same code path as the browser, and no new dependency is needed
(pnpm also blocks very recent packages). Private fields can change in any release.
`createAppRouter` gained an options argument for this.

### 1.19 Who may be redirected to sign-in by a 401

- **✔** Every page except `/login` and `/auth/*`.
- Every page.

Why: those pages handle sign-in themselves, and a 401 there must not cause a redirect loop.

## Task 2 — Account layout (spec only)

### 2.1 What goes in the top bar and what goes in the sidebar

- **✔** The top bar holds the sections (Overview, Runs, Billing, Admin) and the auth status.
  The sidebar is about repositories: the link to the Repositories page, a quick list and
  "Connect repository".
- All navigation in the sidebar, with the top bar showing only the brand and the auth
  status.
- Both bars repeating the same links.

Why: it matches the request literally ("navigation bar … sidebar with link to the page of
their connected repos"), and keeps each area to one purpose.

### 2.2 How "connect another repository" works

- **✔** Send the user to GitHub's installation page, using a URL the backend provides
  (`GET /repositories/connect-url`).
- An in-console repository picker that asks the backend to add repositories through the
  GitHub API.
- Build the GitHub URL in the client from an app slug in the env.

Why: only GitHub can grant a GitHub App access to a repository. The installation page is
the supported way, and it enforces the owner rule. The backend knows the installation id
and the app slug, while the client cannot know the installation.

### 2.3 Opening GitHub for connecting

- **✔** In the same tab; GitHub's Setup URL brings the user back to
  `/repositories?connected=1`.
- In a new tab, refreshing when the console tab regains focus.

Why: GitHub's own return path lands in the same tab, and the console tab cannot tell when
the user has finished in another one.

### 2.4 Who may connect repositories

- **✔** Organisation owners only (`repositories:connect`). Members see the button
  disabled, with a hint.
- Everyone; GitHub refuses non-owners.
- Hide the button from members.

Why: it mirrors GitHub's rule and saves a dead end. A disabled button with a hint explains
why, where a hidden one would leave members guessing.

### 2.5 What the main page is

- **✔** A new Overview page at `/`, with a repositories card and a reviews card.
- Keep redirecting `/` to `/runs`.
- Make `/repositories` the main page.

Why: the request describes a "main page" with its own layout. The Overview gives the
shell a home and a natural place for the connect call to action.

### 2.6 Where the Overview lives

- **✔** In `app/pages/`, because it composes the repositories and runs modules through
  their public APIs.
- In a new `home` module.
- In the repositories module.

Why: a module must not depend on its siblings' internals, and `app/` is the composition
layer.

### 2.7 The mobile layout

- **✔** One drawer, shadcn `sheet` on Radix Dialog (already in the `radix-ui` package),
  holding both the sections and the repositories.
- A bottom tab bar.
- Hide the sidebar on mobile.

### 2.8 The sidebar's quick list

- **✔** Up to 8 repositories, sorted by full name, each linking to its run history, with
  "View all".
- Every repository.
- The repositories with the most recent reviews.

Why: alphabetical order is stable, so items do not jump after each review. Recency is shown
on the Overview instead.

### 2.9 Repositories in the mocks

- **✔** `connect-url` returns `/repositories?connected=1` and the mock adds one
  repository, stored in `localStorage`.
- Return a real GitHub URL, which would leave the mocked console.

### 2.10 Where repositories live in the code

- **✔** A new vertical module, `modules/repositories`.
- Part of the runs module.
- Part of the auth module, as installation data.

Why: repositories have their own data, endpoints and pages, and the architecture splits
features into vertical modules.

## Task 2 — implementation

### 2.11 Showing the total number of repositories

The sidebar and the Overview show how many repositories are connected, but the list is
paged by cursor.

- **✔** Add `total_count` to `GET /repositories` (Spec 002 §5 amended).
- Count only the loaded items (wrong as soon as there is a second page).
- A separate `GET /repositories/count` endpoint.
- Load every page up front.

Why: one field on a response the screen requests anyway; the backend knows the number
cheaply.

### 2.12 Handling the return from GitHub (`?connected=1`)

- **✔** The route's `beforeLoad` announces it in a Zustand flag, invalidates the
  repositories cache, and redirects to `/repositories` without the flag (`replace`).
- A component effect that reads the search param, shows the banner and rewrites the URL.
- Router history state (`state: { connected: true }`).

Why: it can be tested at route level without rendering. The flag is ephemeral UI state, as
the architecture prescribes. Unlike history state, which browsers keep across reloads, it
cannot reappear after a reload.

### 2.13 Parsing `connected=1`

Found by the route test: TanStack Router parses search values as JSON, so `?connected=1`
arrives as the **number** `1`. The first schema, `z.enum(["1"])`, rejected it and quietly
fell back to `undefined`, so the banner would never have shown.

- **✔** Accept both `1` and `"1"` (`z.union([z.literal(1), z.literal("1")])`).
- Configure the router's search parser to keep strings.
- Rename the flag to a non-numeric value (`connected=yes`).

Why: it is local to one route, the backend's redirect URL stays as specified, and the global
search parsing stays untouched.

### 2.14 The theme toggle fix (B7)

- **✔** A pure `toggledPreference(preference, systemPrefersDark)`, tested, plus
  `useShownTheme()`, which follows the system setting through `useSyncExternalStore`.
- Store the resolved theme instead of `"system"` on first load.
- Keep three states and cycle light → dark → system.

Why: the bug was flipping the stored value rather than the visible one. The icon now also
updates when the system theme changes.

### 2.15 When the mock connects a repository

- **✔** When the connect URL is requested; the next one from a fixed list is added and
  stored in `localStorage`.
- On the way back (`?connected=1`).

Why: the mocks cannot see the return navigation. The request is the moment "the user
picked a repository on GitHub" would have happened.

### 2.16 The connect button when no organisation has the app

- **✔** The same button, labelled "Install the review app" and enabled for everyone.
  `connect-url` returns the install page.
- Hide it.
- Show a static link to GitHub's app page.

Why: without an organisation the console knows no role, so GitHub decides who may install.

### 2.17 Closing the mobile drawer after navigating

- **✔** Every link in the drawer calls `onNavigate`, which closes it.
- An effect that closes the drawer when the pathname changes.

Why: the project's React hooks lint rules flag calling `setState` inside an effect, and the
callback is explicit.

### 2.18 The drawer's backdrop colour

- **✔** `bg-foreground/30`: the foreground token at 30 % opacity.
- A new `--color-overlay` token.
- shadcn's default `bg-black/50`, which breaks the "semantic tokens only" rule.

### 2.19 The member's disabled "Connect repository" button

- **✔** Disabled, with a visible hint linked through `aria-describedby`.
- Disabled, with a tooltip.

Why: a disabled button gets no hover or focus, so a tooltip on it would never appear for
keyboard users.

### 2.20 Where the sidebar's quick list comes from

- **✔** The first loaded page (the API sorts by full name), sliced to 8; "View all" uses
  `total_count`.
- Fetch every page for the sidebar.

Why: one request serves the sidebar, the Overview and the first screen of the Repositories
page through a shared cache entry.

## Backend steps — Task 2

Written for [002-account-layout-backend.md](./002-account-layout-backend.md); nothing is
implemented.

### B2.1 Where the repository list comes from

- **✔** Live from GitHub (`GET /installation/repositories` with the installation token),
  cached for 60 seconds.
- A `repositories` table kept in step by webhooks.

Why: the backend design forbids mirroring forge state ("There is still no `repositories`
table"), and at its scale (under 100 repositories) one request returns the whole list.

### B2.2 `connected_at`, which GitHub does not record

- **✔** Make it nullable, and send `null`.
- Use the installation's creation date (wrong for every repository added later).
- Add a table that records when repositories were added (breaks B2.1).
- Remove the field.

Why: it is honest, and it keeps the design rule. The field can be filled later without a
contract change. It needs a small frontend change (Step 7).

### B2.3 Trusting the Setup URL

GitHub warns that `installation_id` on the Setup URL can be spoofed, and recommends
checking it with the user's access token, which the backend discards after sign-in.

- **✔** Ignore every parameter and re-run sign-in. The callback reads
  `/user/installations` with a fresh token, which verifies the installation and refreshes
  the session's organisations together. A user who already authorised the app sees no
  prompt.
- Check `installation_id` with the App JWT plus a membership lookup (not the check GitHub
  recommends, and it duplicates sign-in's organisation logic).
- Keep the user token in the session (breaks "the token is discarded after login").
- Turn on "Request user authorization during installation" (GitHub then skips the Setup
  URL, and the installation flow merges into sign-in for every case).

### B2.4 Sorting and paging

- **✔** The backend reads the whole list, sorts it by full name and serves pages of 10
  with an offset cursor.
- Pass GitHub's own pages through (GitHub's order, and a cursor tied to GitHub's paging).

Why: the console expects alphabetical pages and a `total_count` (Spec 002 §5), and the
list is small.

### B2.5 Who may get the connect URL

- **✔** Every signed-in member of the organisation.
- Owners only, with a `403` for members.

Why: it matches Spec 002 §5, which only refuses users outside the organisation. GitHub
enforces the owner rule on its own page, and the console already disables the button for
members.

### B2.6 Where the Setup URL lives

- **✔** `GET /github/setup`, which is `/api/github/setup` in the browser.
- `/installations/setup`.
- A frontend route that calls the backend.

Why: it is a GitHub-specific redirect target handled by the backend, next to the planned
`webhooks/github`; the `/installations` routes describe our own installation records.

### B2.7 Uninstalled or suspended installations

- **✔** Answer with an empty list and drop the cache.
- Answer with an error.

Why: from the console's point of view nothing is connected, and the next sign-in
refreshes the organisations.

### B2.8 The Task 1 backend doc was moved

`001-github-auth-backend.md` now lives in `dmc-268-api-t4/docs/`, and its implementation
is in progress there.

- **✔** Keep 002's steps here, and list the amendments 001 needs as Step 0 of 002, for
  whoever is implementing it.
- Edit the backend repository's copy directly.

Why: that repository has work in progress, and editing it was not requested.

## Task 2 — disconnecting a repository

### 2.21 How a repository is disconnected

- **✔** Hand the owner over to the installation's settings on GitHub, after a
  confirmation in the console; "Redirect on update" brings them back through the Setup URL
  (Spec 002 §6.1).
- The backend calls GitHub's "Remove a repository from an app installation"
  (`DELETE /user/installations/{id}/repositories/{repo}`).
- "Disconnect" only in our service: stop reviewing, keep GitHub's access (a per-repository
  `enabled: false` in `config_overrides`).

Why: GitHub documents the removal endpoint for classic personal access tokens, and support
for GitHub App user tokens could not be confirmed. It also needs a user token, which the
backend discards after sign-in, and it answers `422` when the app has access to all
repositories or the repository is the last one. The third option is a different feature
("pause reviews"): the repository would stay in GitHub's list, and so in ours.

### 2.22 What members see

- **✔** No Disconnect action at all.
- A disabled Disconnect on every row, each with its own hint.

Why: one hint per row would be noise. The page already explains the owner rule next to
"Connect repository".

### 2.23 Where Disconnect is offered

- **✔** Only on the Repositories page, one per row.
- In the sidebar's quick list too.

Why: the quick list is for getting to a repository's runs. A destructive action next to
navigation links invites mis-clicks.

### 2.24 A per-repository `disconnect-url` rather than reusing `connect-url`

- **✔** `GET /repositories/{id}/disconnect-url`.
- Reuse `connect-url`; the page on GitHub is the same.

Why: the backend can answer `404` for a repository that is no longer connected, which the
console shows as such. It can link more precisely if GitHub ever offers a page per
repository. And the mock knows which repository to remove.

**Backend addition** for `dmc-268-api-t4/docs/002-account-layout-backend.md`, not applied
because that file lives in the backend repository with work in progress (B2.8):

- **§1 table:** `/api/repositories/{id}/disconnect-url` → `/repositories/{id}/disconnect-url`,
  `GET`.
- **Step 1:** `disconnect_url(organization) -> str` returns the same installation-settings
  URL as `connect_url` for an installed organisation.
- **Step 6:** `GET /repositories/{id}/disconnect-url` (`current_session`):
  - `404 {"error": "not_found"}` when there is no current organisation, or `id` is not in
    the installation's list (cached or fetched as in Step 5);
  - otherwise `200 { "url": disconnect_url(...) }`;
  - `502` when GitHub fails.
- **Step 6 tests:** a connected id → the settings URL; an unknown id → `404`; another
  organisation's repository id → `404`; `401` without a session.
- **Step 9:** add "Disconnect a repository → GitHub settings → remove → back on
  `/repositories`, one fewer".

## Conventions — one component per file

### C1 How strict the rule is

- **✔** One **exported** component per `.tsx` file, named after the file. Small, stateless
  private helpers may stay; one moves out once it is reused, has its own hooks or state,
  or the file passes about 150 lines.
- Literally one component per file.
- No rule.

Why: the strict version forces an export, and a file, for pieces nothing else uses
(`Card`, `QuickList`), which only grows the public surface. The exported-component version
keeps files findable by name.

### C2 How it is enforced

- **✔** A local ESLint rule, `local/one-exported-component` in `eslint-rules/`, tested
  with ESLint's `RuleTester` under Vitest.
- `eslint-plugin-react`'s `react/no-multi-comp` (not installed, and it enforces the strict
  version).
- Code review only.

Why: no installed plugin has the rule, it needs no new dependency, and it also checks that
the name matches the file. Its AST types are derived from ESLint's own typings, because
`estree` is not resolvable from the project under pnpm.

### C3 What is exempt

- **✔** `src/shared/ui/**`.
- Nothing.

Why: shadcn's compound components (`DropdownMenu`, `DropdownMenuItem`, …) share a file by
design and are regenerated by its CLI. Splitting them would break `shadcn add` updates.

### C4 Files changed to comply

- `app/layouts/console-layout.tsx` → plus `components/primary-nav.tsx`,
  `components/theme-toggle.tsx` and `components/account-menu.tsx` (each has its own hooks).
- `app/routes/route-fallbacks.tsx` → `route-error-page.tsx`, `not-found-page.tsx`, and
  `fallback-layout.tsx`, which both use.
- `runs/presentation/components/severity-badge.tsx` → plus `category-badge.tsx`.
- `admin/presentation/pages/subscriptions-page.tsx` → `admin-subscriptions-page.tsx`, so
  the file is named after its component; `AdminSubscriptionsPage` keeps its name, because
  the lazy route imports it by that name.
