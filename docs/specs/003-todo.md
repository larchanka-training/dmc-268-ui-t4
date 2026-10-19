# Task 3 — Pull request details and the diff viewer: task list

Implements [Spec 003](./003-pr-details-diff-viewer.md). Decisions taken while implementing
are in [decisions.md](./decisions.md), section "Task 3".

Each task is done test-first where there is logic to test: the failing test is written and
run before the code.

## Domain (`shared/diff/domain`)

- [x] **R1** `toSplitRows`: hunk lines → rows of `{ left, right }`. A removed line pairs
      with the added line that replaces it; an unmatched line leaves the other cell empty;
      a context line fills both.
- [~] **R2**–**R4** Language detection, token mapping and the shiki adapter: built, then
  removed with the highlighting (decision 3.9).

## Presentation (`shared/diff/presentation`)

- [x] **R5** `useDiffViewMode`: the remembered `unified` / `split` preference
      (Zustand + `persist`), falling back to `unified` when storage is unavailable.
- [~] **R6**–**R7** Highlighting hook and token rendering: removed with R2–R4; `LineContent`
  renders plain text and stays the seam for a future highlighter.
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

- [x] **R15** Fixtures cover four severities, two file types, and a finding with a
      suggestion as well as one without.

## Checks

- [x] **R16** `pnpm check-types`, `pnpm lint`, `pnpm lint:css`, `pnpm format:check`,
      `pnpm test`, `pnpm build` all green.
- [x] **R17** The page is checked in the browser in both modes and both themes — not
      done in-session: the in-app browser blocks service workers, so the mocked console
      could not start there, and the Chrome extension was not connected. Replaced by the
      rendering test in R9 (decision 3.7). Checked by hand afterwards.
