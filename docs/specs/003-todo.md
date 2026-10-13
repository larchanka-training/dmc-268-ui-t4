# Task 3 — Pull request details and the diff viewer: task list

Implements [Spec 003](./003-pr-details-diff-viewer.md). Decisions taken while implementing
are in [decisions.md](./decisions.md), section "Task 3".

Each task is done test-first where there is logic to test: the failing test is written and
run before the code.

## Domain (`shared/diff/domain`)

- [x] **R1** `toSplitRows`: hunk lines → rows of `{ left, right }`. A removed line pairs
      with the added line that replaces it; an unmatched line leaves the other cell empty;
      a context line fills both.
- [x] **R2** `languageForPath`: file extension → grammar name, `null` when unknown.
- [x] **R3** `hunkSides` and `applyTokens`: split a hunk into the old and the new text,
      and put highlighted tokens back on their lines. A line-count mismatch keeps the
      plain text.

## Infrastructure (`shared/diff/infrastructure`)

- [x] **R4** `createShikiHighlighter`: the only file that imports `shiki`. Loads the
      library and the grammar on demand, caches both, and returns tokens.

## Presentation (`shared/diff/presentation`)

- [x] **R5** `useDiffViewMode`: the remembered `unified` / `split` preference
      (Zustand + `persist`), falling back to `unified` when storage is unavailable.
- [x] **R6** `useHighlightedHunk`: plain text first, tokens when they arrive, plain text
      again on failure.
- [x] **R7** `LineContent` renders tokens when it has them, plain text otherwise.
- [x] **R8** `DiffSplitRow`: one row of the side-by-side view, with both gutters, both
      markers and a comment spanning the full width underneath.
- [x] **R9** `DiffHunk` renders unified or split; `DiffSnippet` passes the mode through.
- [x] **R10** Below 768 pixels the viewer renders unified and the control is hidden.

## Runs module

- [x] **R11** `SeveritySummary`: "1 critical · 1 high · 1 medium", nothing when empty.
- [x] **R12** `FileFindings`: one file header, its findings underneath, the count on the
      header.
- [x] **R13** `FindingCard` expands and collapses, keeps its badges in the collapsed
      header, and expands itself when the page is opened at its anchor.
- [x] **R14** `RunDetailsPage`: the severity summary in the header, the mode control above
      the findings, and findings grouped by file.

## Mocks

- [x] **R15** Fixtures cover two languages, all four severities, a finding with a
      suggestion and one without, and a file whose extension has no grammar.

## Checks

- [x] **R16** `pnpm check-types`, `pnpm lint`, `pnpm lint:css`, `pnpm format:check`,
      `pnpm test`, `pnpm build` all green.
- [ ] **R17** The page is checked in the browser in both modes and both themes — not
      done here: the in-app browser blocks service workers, so the mocked console does not
      start, and the Chrome extension was not connected. Replaced by the rendering test in
      R9 (decision 3.7); still worth a human look before merge.
