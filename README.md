# DMC-268 UI (Team 4)

Frontend console for the AI code review service for GitHub pull requests.

The backend runs as a GitHub App and publishes review findings straight into the pull
request; this app is the service console: subscription and billing, agent runs (live and
history) with the diff behind every finding, and an admin view of all subscriptions.

The architecture is documented in [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)
(Russian version: [FRONTEND_ARCHITECTURE.ru.md](./FRONTEND_ARCHITECTURE.ru.md)).

## Requirements

- Node.js >= 24 (see `.nvmrc`)
- pnpm 12 (`npm i -g pnpm`)

## Setup & Run

```bash
pnpm install
pnpm dev
```

## Commands

| Command            | What it does                                  |
| ------------------ | --------------------------------------------- |
| `pnpm dev`         | Vite dev server with HMR                      |
| `pnpm build`       | Type-check the project and build into `dist/` |
| `pnpm build:demo`  | Production build with the MSW mocks enabled   |
| `pnpm preview`     | Serve the built `dist/` locally               |
| `pnpm check-types` | `tsc -b` over every tsconfig project          |
| `pnpm lint`        | ESLint, warnings treated as errors            |
| `pnpm lint:css`    | Stylelint over `src/**/*.css`                 |
| `pnpm format`      | Prettier over the repository                  |
| `pnpm test`        | Vitest in Node: logic, adapters, routes       |

With the mocks enabled the console runs without a backend: open `/runs`, pick a run and
use `?mock=owner|member|admin|idle` to switch role and state, or
`?mock=signed-out|denied|no-orgs|expired` to walk through sign-in, or `?mock=no-repos` for
an organisation without connected repositories. `pnpm build:demo` turns the
mocks on by itself; setting `VITE_ENABLE_MOCKS` explicitly still overrides it.

### Running against a real backend

Set `VITE_ENABLE_MOCKS=false` and `API_PROXY_TARGET` (the backend origin, e.g.
`http://localhost:8000`) in `.env.local`. The dev server then proxies `/api` to it, so the
session cookie is same-site, as in production. The backend's `Origin` check must accept the
dev origin (`http://localhost:5173`).

The proxy **strips the `/api` prefix**: the backend serves `/me`, `/auth/github` and
`/auth/logout` with no prefix, and in production the reverse proxy strips it the same way.
So `VITE_API_BASE_URL=/api` stays correct on both sides.

## Git hooks

Husky runs:

- **pre-commit** — `lint-staged`: ESLint, Stylelint and Prettier on staged files;
- **pre-push** — `check-types`, `lint`, `lint:css`, `test`;
- **commit-msg** — commitlint with Conventional Commits, e.g. `feat(runs): add polling`.

Hooks are installed by `pnpm install` (the `prepare` script). They can be bypassed with
`git commit --no-verify`, so the guarantee comes from CI.

## CI

`.github/workflows/ci.yml` runs on every pull request and on pushes to `main`:
`check-types`, `lint`, `lint:css`, `format:check`, `test`, `build` and `build:demo`, on the Node version
in `.nvmrc` with the pnpm store cached.
