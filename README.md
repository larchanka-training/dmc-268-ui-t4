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
| `pnpm test`        | Vitest (domain and application layers)        |

## Git hooks

Husky runs:

- **pre-commit** — `lint-staged`: ESLint, Stylelint and Prettier on staged files;
- **pre-push** — `check-types`, `lint`, `lint:css`, `test`;
- **commit-msg** — commitlint with Conventional Commits, e.g. `feat(runs): add polling`.

Hooks are installed by `pnpm install` (the `prepare` script). They can be bypassed with
`git commit --no-verify`, so they are a convenience, not a guarantee.
