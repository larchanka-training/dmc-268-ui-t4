# Spec 002 — Account layout and connected repositories

_Status: implemented (uncommitted) · Depends on: [Spec 001](./001-github-auth.md), FRONTEND_ARCHITECTURE.md ·
Owner: frontend · Decisions: [decisions.md](./decisions.md), section "Task 2"_

## 1. Goal

Give a signed-in user one consistent frame for the whole console:

- a **top navigation bar** with the main sections;
- the **authentication status**: who is signed in, for which organisation, and sign-out;
- a **sidebar** that links to the page of their **connected repositories**;
- a way to **connect another repository**;
- a way to **disconnect** a repository the app should no longer review.

The backend has no repository endpoints yet, so the feature runs on MSW mocks first. The
contract in §5 is what the backend will implement.

## 2. Scope

In scope:

- The console shell (`ConsoleLayout`): top bar, sidebar, content area, and the mobile
  layout.
- An **Overview** page at `/`, which replaces today's redirect to `/runs`.
- A **Repositories** page at `/repositories`.
- "Connect repository": hand-over to GitHub and back.
- "Disconnect" on a repository: confirmation, hand-over to GitHub and back (§6.1).
- Mock endpoints, fixtures and scenarios for all of the above.

Out of scope:

- switching organisations (the shell shows the current one; a switcher comes later);
- configuring a repository (per-repository review settings);
- repository search;
- the content of the Billing and Admin pages;
- any change to how runs work.

## 3. Concepts

A **connected repository** is a repository the review app may access through the current
organisation's GitHub App installation. Connecting one means adding it to that installation
on GitHub: only GitHub can grant the access. The console therefore does not "add"
repositories itself. It sends the user to GitHub's installation page and shows the result
once they come back.

**Disconnecting** is the reverse: removing the repository from the installation, again on
GitHub. The console asks for confirmation, then sends the owner to the installation's
settings, where they remove the repository and save. GitHub's API offers no removal that
the backend could use: the endpoint is documented for classic personal access tokens,
needs a user token the backend does not keep, and refuses with `422` when the app has
access to all repositories or the repository is the last one (decision 2.21).

On GitHub, changing an installation's repository list needs organisation owner rights.
The console mirrors that rule, for connecting and disconnecting alike.

## 4. Layout

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ ◆ Review console   Overview  Runs  Billing  [Admin]      ☾   (●) @octocat ▾│  top bar
├───────────────────┬──────────────────────────────────────────────────────┤
│ REPOSITORIES (5) →│                                                      │
│  acme/api         │                                                      │
│  acme/payments    │                 page content                         │
│  acme/web         │                                                      │
│  …                │                                                      │
│  View all         │                                                      │
│                   │                                                      │
│ [+ Connect repo]  │                                                      │
└───────────────────┴──────────────────────────────────────────────────────┘
```

### 4.1 Top navigation bar

The bar is sticky at the top. It contains:

- **Brand:** "Review console", linking to `/`.
- **Primary navigation** (`<nav aria-label="Primary">`):
  - Overview (`/`), Runs (`/runs`), Billing (`/billing`);
  - Admin (`/admin/subscriptions`), only when `can(session, "admin:view")`.

  The active link gets `aria-current="page"` and the existing active style.

- **Theme toggle:** the existing toggle, fixed so it switches away from the theme
  currently shown, not away from the stored preference (B7 in the review findings).
- **Authentication status:** a trigger button showing the avatar (or initials), `@login`
  and the current organisation's name. It opens a dropdown menu (the existing
  `shared/ui/dropdown-menu`) with:
  - "Signed in as **Name** (@login)";
  - the current organisation and the user's role there;
  - "Sign out", which uses Spec 001's sign-out.

  While the session is loading, the trigger is a skeleton of the same size. The Task 1
  inline sign-out button in the header is removed: the menu replaces it.

### 4.2 Sidebar

The sidebar is an `<aside aria-label="Repositories">`, 16rem wide, from the `md` breakpoint
up. Top to bottom it shows:

1. **"Repositories" heading:** a link to `/repositories`, with the number of connected
   repositories.
2. **Quick list:** up to 8 connected repositories, sorted by full name. Each links to
   `/runs?repository=<owner>/<name>`, the run history for that repository. "View all"
   appears below the list when there are more than 8.
3. **"Connect repository" button** at the bottom (§6).

| State                                          | Sidebar shows                                                           |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| Loading                                        | three skeleton rows                                                     |
| Error                                          | "Could not load repositories" + Retry                                   |
| No repositories                                | "No repositories connected yet" above the Connect button                |
| No organisation (`currentOrganizationId` null) | "The review app is not installed yet" + **Install the app** (same flow) |

### 4.3 Mobile (below `md`)

- The primary navigation collapses into a menu button (☰) on the left of the top bar.
- The sidebar becomes a drawer, opened from the same menu, which holds both the primary
  navigation and the repository section. It closes on navigation and on Escape, and traps
  focus while open.
- The drawer is shadcn/ui's `sheet`, built on the Radix Dialog from the `radix-ui` package
  the project already uses.

### 4.4 Content area

- The content area is a `<main>` with the current `max-w-6xl` container.
- Every console route renders inside the shell: Overview, Runs, Run details, Repositories,
  Billing, Admin.
- `/login`, `/auth/*` and `/pricing` stay outside it.

## 5. API contract

All paths are relative to `VITE_API_BASE_URL`. Every response is scoped to the session's
current organisation; with no organisation, the list is empty.

`total_count` is the number of connected repositories across all pages; the sidebar and
the Overview show it without loading every page (decision 2.11). Pages hold 10 items.

| Endpoint                                | Response                                                                                                                                       |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /repositories?cursor=`             | `200 { items: Repository[], next_cursor: string \| null, total_count: number }`, items sorted by full name                                     |
| `GET /repositories/connect-url`         | `200 { url: string }`: where to send the user to connect one                                                                                   |
| `GET /repositories/{id}/disconnect-url` | `200 { url: string }`: where to send the user to disconnect that repository · `404 { error: "not_found" }` when it is not connected (any more) |

```jsonc
// Repository
{
  "id": "repo_1",
  "owner": "acme",
  "name": "payments",
  "private": true,
  "default_branch": "main",
  "html_url": "https://github.com/acme/payments", // https only; otherwise not linked
  "connected_at": "2026-09-01T10:00:00.000Z", // null when the backend cannot know
  "last_run_at": "2026-10-02T08:30:00.000Z", // null before the first review
}
```

**`connected_at` is nullable, and today it is always null.** GitHub does not record when
a repository was added to an installation, and the backend keeps no copy of forge state
(it reads the list live, which is what lets it have no `repositories` table). The page
shows "Connected {date}" only when the field is set, so the field can be filled in later
— for example from the `installation_repositories` webhook — without another contract
change.

`connect-url` returns one of two URLs. It never needs a request body or any state change
on our side:

- the installation's settings page on GitHub, when the app is installed in the
  organisation;
- the app's "install" page, when it is not installed yet.

`disconnect-url` returns the installation's settings page on GitHub today, since GitHub
has no page for a single repository of an installation. It is per repository so that the
backend can confirm the repository is still connected (`404` otherwise), can link more
precisely if GitHub ever allows it, and so the mock knows which repository to remove.

The client accepts either URL only if it is `https:`, or a root-relative path (the mock
uses one). Anything else shows the error state.

After GitHub, the app's **Setup URL** points at the backend. The backend syncs the
installation's repository list and redirects to `/repositories?connected=1`.

All three endpoints answer `401` without a session (Spec 001's handling applies) and `403` to
users outside the organisation.

## 6. Connect a repository

1. The user presses "Connect repository" (sidebar, Repositories page or Overview).
2. The SPA requests `GET /repositories/connect-url` and navigates the **same tab** to the
   URL. The button shows a spinner and is disabled meanwhile.
3. On GitHub the owner picks repositories and saves.
4. GitHub → the app's **Setup URL** (the backend's `/github/setup`) →
   `/repositories?connected=1`.
5. The Repositories page:
   - shows a dismissible banner, "Your repository list is up to date";
   - refetches the list (and the sidebar, which shares the query);
   - removes `connected` from the URL with `replace`, so a reload does not show the
     banner again.

Permissions:

- Only an organisation **owner** may connect repositories. This is a new action,
  `repositories:connect`, in `can()`.
- A member sees the button disabled, with the hint "Only organisation owners can connect
  repositories".
- A platform admin follows their organisation role.

**The Setup URL**, configured on the GitHub App, is what brings the user back. Two
settings on the app matter:

- **"Redirect on update" on.** Without it GitHub returns only after the _first_ install,
  not after the owner changes which repositories the app may access — which is step 3 for
  everyone who already has it installed.
- **"Request user authorization (OAuth) during installation" off.** With it on, GitHub
  ignores the Setup URL and sends the user to the callback URL instead.

The backend never trusts the `installation_id` GitHub puts on that URL — GitHub warns it
can be spoofed — so `/github/setup` discards every parameter and sends the user back
through sign-in, which verifies the installation and refreshes the organisation list in
one request. The user sees no second consent screen, having already authorised the app.

Failure: if `connect-url` fails or returns an unsafe URL, an inline error appears next to
the button with a Retry. The page stays put.

### 6.1 Disconnect a repository

1. On the Repositories page an owner presses **Disconnect** on a repository row.
2. A confirmation dialog opens:
   - title: "Disconnect {owner/name}?";
   - text: "The review app will stop reviewing its pull requests. You remove the
     repository on GitHub, in the app's installation settings: unselect it there and
     save.";
   - a hint: "If the app has access to all repositories, switch it to _Only select
     repositories_ first. To remove the last repository, uninstall the app on GitHub.";
   - buttons: **Cancel** (default focus) and **Continue on GitHub**.
3. "Continue on GitHub" requests `GET /repositories/{id}/disconnect-url` and navigates the
   **same tab** to it. The button shows a spinner and the dialog stays open meanwhile.
4. On GitHub the owner removes the repository and saves.
5. GitHub → Setup URL ("Redirect on update" covers removals too) → `/repositories?connected=1`.
   The same banner as §6, "Your repository list is up to date", and the list and sidebar
   refetch.

Failure, shown inside the dialog with Retry:

- `404`: "This repository is no longer connected." The list refetches, and Retry is not
  offered.
- A network or server error, or an unsafe URL: "Could not open GitHub." with Retry.

Permissions: a new action, `repositories:disconnect`, for organisation **owners** only.
Members see no Disconnect action at all. The page-level owners-only hint under "Connect
repository" already explains why (decision 2.22).

Disconnect is offered on the Repositories page only, not in the sidebar's quick list
(decision 2.23).

## 7. Pages

### 7.1 Overview (`/`)

The default console page.

- **Heading:** "Welcome back, {first name}", with the current organisation's name under it.
- **Repositories card:**
  - the number of connected repositories;
  - the 3 with the most recent `last_run_at`;
  - "Manage repositories" (→ `/repositories`);
  - "Connect repository".
- **Reviews card:** the number of active runs (reuses the runs module's active-runs
  query), with "Open runs" (→ `/runs`).
- **Empty organisation:** both cards are replaced by one "Install the review app" card
  (the §6 flow).

After this task, `/auth/success` "Go to the console" points at `/` instead of `/runs`.

### 7.2 Repositories (`/repositories`)

- Header: "Repositories", the count, and "Connect repository".
- One row per repository:
  - full name, linked to `html_url` on GitHub when it is https (opens in a new tab with
    `rel="noreferrer"`);
  - a "Private" badge;
  - the default branch;
  - "Connected {relative date}";
  - "Last review {relative date}" or "Not reviewed yet";
  - a "Runs" link (→ `/runs?repository=…`);
  - for owners, a "Disconnect" action (§6.1).
- Cursor pagination with "Load more", like the run history.
- States: loading skeleton, error with Retry, empty with the Connect call to action, and
  the "connected" banner (§6).

## 8. Architecture placement

| Place                                 | Addition                                                                                                                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `modules/repositories/domain`         | `Repository`; `sortByFullName`, `recentlyReviewed(n)`, `sidebarSlice(n)`; `isSafeConnectUrl`                                                                                               |
| `modules/repositories/application`    | port `ConnectedReposApi { listRepositories, getConnectUrl, getDisconnectUrl }`; use cases `listRepositories`, `startConnect`, `startDisconnect`                                            |
| `modules/repositories/infrastructure` | HTTP adapter, Zod DTOs, mappers (`html_url` kept only when https)                                                                                                                          |
| `modules/repositories/presentation`   | `RepositoriesPage`, `RepositoriesSidebar`, `ConnectRepositoryButton`, `DisconnectRepositoryButton` (with its dialog), `useRepositories`, `useConnectRepository`, `useDisconnectRepository` |
| `modules/auth/domain`                 | actions `repositories:connect` and `repositories:disconnect` (owners only)                                                                                                                 |
| `modules/runs` (public API)           | export `useActiveRuns` for the Overview card                                                                                                                                               |
| `app/layouts`                         | the shell: top bar, auth-status menu, sidebar slot, mobile drawer                                                                                                                          |
| `app/pages/overview-page.tsx`         | Overview: it composes several modules, so it lives in `app/`                                                                                                                               |
| `app/routes`                          | `/` renders Overview; `/repositories` with search `{ connected?: "1" }`                                                                                                                    |
| `shared/ui`                           | shadcn `sheet` (drawer) and `alert-dialog` (the disconnect confirmation)                                                                                                                   |
| `shared/mocks`                        | repository fixtures, both endpoints, scenario `no-repos`; in mock mode `connect-url` and `disconnect-url` return `/repositories?connected=1`, and the mock adds or removes a repository    |

The repositories module is a new vertical module. It follows the same layer rules and is
reached only through its `index.ts`.

## 9. Acceptance criteria

1. Every console page shows the top bar with Overview, Runs and Billing. Admin is shown
   only to platform admins. The current section is marked with `aria-current="page"`.
2. The top bar shows the avatar (or initials), `@login` and the organisation. The menu
   shows the role and signs out (Spec 001 behaviour: every tab, back to `/login`).
3. From `md` up, the sidebar lists up to 8 repositories sorted by name, the total count,
   "View all" when there are more, and "Connect repository".
4. Below `md`, the navigation and the repository section live in a drawer that closes on
   navigation and Escape and keeps focus inside while open.
5. `/` shows the Overview with the repositories and reviews cards. With no organisation
   it shows the install card.
6. `/repositories` lists repositories with "Load more", and has empty, error and loading
   states.
7. An owner's "Connect repository" leads to the URL from `connect-url` in the same tab.
   Returning to `/repositories?connected=1` shows the banner once and refreshes the list
   and the sidebar.
8. A member sees "Connect repository" disabled, with the owners-only hint.
9. A `connect-url` that is neither https nor root-relative is never followed.
10. Repository links to GitHub appear only for https `html_url`s and open with
    `rel="noreferrer"`.
11. In mock mode the whole flow works without a backend, including connecting one more
    repository and disconnecting one.
12. An owner's "Disconnect" opens a confirmation dialog naming the repository. Cancel
    changes nothing; "Continue on GitHub" leads to the URL from `disconnect-url` in the
    same tab, and the return shows the banner and the shorter list.
13. A member sees no Disconnect action.
14. A `404` from `disconnect-url` shows "This repository is no longer connected" and
    refreshes the list; other failures show "Could not open GitHub" with Retry. An unsafe
    URL is never followed.
15. `check-types`, `lint`, `lint:css`, `format:check`, `test`, `build` and `build:demo`
    pass; tests make no network calls; a normal build contains no mock code.

## 10. Tests (written first)

Unit tests, in Node:

- domain: sorting, the sidebar slice and "View all", most recently reviewed, and
  `isSafeConnectUrl`;
- `can(…, "repositories:connect")` for owner, member, platform admin and no organisation;
- the infrastructure mapper and schema: `html_url` https-only, a nullable `last_run_at`,
  cursor paging;
- the use cases: `startConnect` returns the URL or a typed error for an unsafe one;
  `startDisconnect` returns the URL, `not-found` for a `404`, `unsafe-url`, or
  `unavailable`;
- `can(…, "repositories:disconnect")` for owner, member and platform admin;
- the adapter: `disconnect-url` is requested for the encoded repository id;
- mocks: repository state per scenario, connecting adds one repository and disconnecting
  removes the chosen one, both persisting across reloads; an unknown id is refused, and a
  scenario reset brings everything back.

Route tests (in-memory history, as in Task 1):

- `/` renders the Overview route for a signed-in user;
- `/repositories?connected=1` drops `connected` after loading;
- a signed-out visitor to `/repositories` goes to `/login?returnTo=/repositories`.

## 11. Mock scenarios

| Scenario   | Repositories                                                       |
| ---------- | ------------------------------------------------------------------ |
| `owner`    | 11 (so "View all" and "Load more" appear); Disconnect on every row |
| `member`   | the same 11; Connect is disabled, no Disconnect                    |
| `idle`     | 11                                                                 |
| `no-repos` | none                                                               |
| `no-orgs`  | none; the install card and the sidebar install state               |
