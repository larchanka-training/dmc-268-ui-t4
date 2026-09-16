# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Frontend console for DMC-268 Team 4: an AI code review service for GitHub pull requests.
The backend (a GitHub App) reviews PRs and publishes findings to GitHub; this app covers
billing, agent runs with their findings and diffs, and an admin view of subscriptions.

Stack: pnpm 12, Node >= 24, React 19, Vite 8, TypeScript 6, Tailwind v4.
Planned (architecture PR): TanStack Router, TanStack Query, Zustand, Zod, shadcn/ui, MSW.

## Commands

```bash
pnpm install        # install dependencies and set up Husky hooks
pnpm dev            # Vite dev server with HMR
pnpm build          # tsc -b && vite build
pnpm build:demo     # production build with MSW mocks
pnpm preview        # serve dist/ locally
pnpm check-types    # tsc -b (all projects, noEmit)
pnpm lint           # ESLint, --max-warnings=0
pnpm lint:css       # Stylelint over src/**/*.css
pnpm format         # Prettier over the repo
pnpm test           # Vitest, node environment
```

## Architecture

Clean Architecture inside vertical modules (the structure is created in the architecture PR):

```
src/
  app/                    composition root: DI provider, router, guards, theme, env
  modules/
    auth|billing|runs/    domain/ application/ infrastructure/ presentation/ index.ts
    admin/                isolated, lazily loaded by the router only
  shared/
    diff/                 diff viewer: domain/ + presentation/
    ui/                   shadcn components
    lib/                  http client, utilities
    mocks/                MSW handlers and the typed application state snapshot
```

Dependency rules (enforced by `eslint-plugin-boundaries`, see `eslint.config.ts`):

- inside a module: `presentation → application → domain`, `infrastructure` implements ports;
- across modules: only through the module's `index.ts`;
- `shared/` never imports from `modules/`;
- `modules/` never import `admin`; only `app/` loads it.

State: server data in TanStack Query, shareable state (filters, anchors) in the URL,
ephemeral UI state in Zustand. Domain and application layers stay free of React.

## Conventions

- `@/` maps to `src/`; imports carry no file extension. Inside a module use relative paths.
- No default exports in `src/` (`import-x/no-default-export`); config files are exempt.
- Colours only come from the semantic tokens in `src/app/styles/index.css`, so both themes stay in sync.
- TypeScript is strict, including `noUncheckedIndexedAccess`, `verbatimModuleSyntax` and
  `erasableSyntaxOnly` — use union literals and `as const` instead of `enum`.
- Commits follow Conventional Commits; the scope matches a module (`feat(runs): ...`).

## Notes

- pnpm 12 blocks packages published less than 24 hours ago (supply-chain policy). `vitest` is
  pinned to an exact version for that reason; relax it once the release is older.
- `pnpm-workspace.yaml` holds pnpm settings (`allowBuilds`), package.json no longer does.
