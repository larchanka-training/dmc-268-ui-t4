# Spec 003 — Pull request details and the diff viewer

_Status: in progress · Depends on: [Spec 002](./002-account-layout.md), FRONTEND_ARCHITECTURE.md,
`dmc-268-api-t4/docs/PIPELINE_SPEC.md` · Owner: frontend · Decisions:
[decisions.md](./decisions.md), section "Task 3"_

Implements [issue #32](https://github.com/larchanka-training/dmc-268-api-t4/issues/32).

## 1. Goal

Make the page of a single review readable as a code review: the pull request it looked at,
the code it commented on, and each comment under the line it belongs to.

Three things the page cannot do today:

- show the diff **side by side**; it only stacks old and new lines in one column;
- group findings **by file**, so a file with three comments shows its header three times.

## 2. Scope

In scope:

- The header of the review page: title, repository, number, author, branches, commit,
  review status, and how many findings there are by severity.
- The diff viewer: **unified** and **side-by-side** modes, with the mode remembered
  between visits.
- Findings **grouped by file**: one file header, its findings underneath, each anchored to
  its line.
- A finding card that **expands and collapses**, with the severity and category badges and
  the suggested change.

Out of scope, and why:

- **The whole diff of the pull request.** The contract exposes the diff around a finding
  (`/jobs/{id}/findings/{id}/context`) and a range of lines (`/jobs/{id}/file-lines`), not
  the full diff. The page therefore shows the files that have findings. Decision 3.1.
- **Syntax highlighting.** It was built and then removed at the team's request, so the
  code is plain text in both modes. Decision 3.9; `LineContent` is still the one component
  that would carry it.
- **An overall score or verdict.** No such field exists in the contract, and computing one
  in the browser would invent a number the backend cannot reproduce. The header shows the
  review status and the counts instead. Decision 3.2.
- Replying to a finding, resolving it, or applying a suggestion: all of that lives in the
  pull request on the forge.
- Word-level highlighting inside a changed line.
- Virtualised rendering of very long files.

## 3. What the user sees

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ ⎇ Add retry logic for payment provider            [ Completed ]              │
│ acme/payments #412 · octocat · feature/payment-retry → main · a1b2c3d        │
│ Started 15 Sep, 11:12 · took 1m 28s                      Open pull request ↗ │
│ 1 critical · 1 high · 1 medium                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ Review summary                          │ Pipeline                           │
│ …                                       │ ✓ Collecting context         16s   │
├──────────────────────────────────────────────────────────────────────────────┤
│ Findings (3)                                   [ Unified | Side by side ]    │
│                                                                              │
│ ▸ src/payment_service.rb                                      2 findings     │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ ↑ 20 lines   ⇕ All                                      59 hidden lines  │ │
│ │ 138 138    account = get_account(user)                                   │ │
│ │ 139 139                                                                  │ │
│ │ 140   -    charge(account, amount)                                       │ │
│ │     140 +  with_transaction do                                           │ │
│ │     142 +    charge_with_retries(account, amount)   ◀ comment anchored    │ │
│ │ ┌──────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ 🤖 Review agent · 2 hours ago   [HIGH] [correctness]   View on GitHub↗│ │ │
│ │ │ The transaction stays open while the provider is retried…             │ │ │
│ │ │ ┌ Suggested change ────────────────────────────────── Copy ─────────┐ │ │ │
│ │ │ │ -   with_transaction do                                           │ │ │ │
│ │ │ │ +   charge_with_retries(account, amount)                          │ │ │ │
│ │ └──────────────────────────────────────────────────────────────────────┘ │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

In side-by-side mode the same hunk puts the old file on the left and the new file on the
right, and a comment spans the full width under its row.

## 4. Behaviour

### 4.1 The header

| Element                                             | Source                                 |
| :-------------------------------------------------- | :------------------------------------- |
| Title, repository, number, author, branches, commit | `job.pull_request`                     |
| Review status                                       | `job.status`, as the existing badge    |
| Duration                                            | `created_at` and `finished_at`         |
| Counts by severity                                  | computed from the findings on the page |
| Link to the pull request                            | `job.pull_request.url`                 |

The counts are a plain summary of what is on the page, not a score: "1 critical · 1 high ·
1 medium", and nothing when there are no findings.

### 4.2 Two view modes

A control above the findings switches between **Unified** and **Side by side**. The choice
is a preference of the reader, not of the review, so it is stored in `localStorage` and
applies to every review afterwards. It is not in the URL: a link to a finding should open
the way the reader prefers.

Side by side pairs the lines of a hunk into rows:

- a removed line and the added line that replaces it share a row;
- an unmatched removed line gets an empty cell on the right, and the reverse for an added
  line;
- a context line fills both cells.

Below 768 pixels the viewer always renders unified, because two columns of code do not fit;
the control is hidden rather than disabled, since nothing the reader can do would help.

### 4.3 Findings grouped by file

Findings arrive sorted by severity. The page groups them by file, keeps the file order of
the first finding in each group, and renders:

- one file header per file, with the path, the change status and the number of findings;
- each finding under the line it points at, inside the snippet that came with it.

A finding card starts expanded and can be collapsed. Collapsing hides the diff and keeps
the header line, so a reader can fold away what they have already read. The state lives in
the existing run details store and is dropped when the page is left.

### 4.4 Deep links

A finding keeps its anchor (`#src-payment_service-rb-R142`). Opening such a link scrolls to
the line and expands the card that owns it, even when the reader had collapsed it before.

## 5. Contract

No change. The page uses what the merged contract already defines:

| Endpoint                                           | Used for                                            |
| :------------------------------------------------- | :-------------------------------------------------- |
| `GET /jobs/{job_id}`                               | the header, the summary, the steps and the findings |
| `GET /jobs/{job_id}/findings/{finding_id}/context` | the snippet under each finding, loaded per card     |
| `GET /jobs/{job_id}/file-lines`                    | unfolding context inside a snippet                  |

`severity` is the four-value set from the contract (`critical`, `high`, `medium`, `low`).
The three labels in the issue (Critical, Warning, Info) are a coarser version of the same
scale; the console shows what the API stores. Decision 3.3.

The runs module calls these endpoints directly; the MSW mocks in `src/shared/mocks/` serve
the same wire format in development and in the demo build. A finding whose context answers
an error (`409` for a commit or installation that is gone) is shown with its `path:line`
and the link to GitHub instead of the code.

## 6. Structure

```text
src/shared/diff/
  domain/
    split.ts            toSplitRows: hunk lines → rows of (left, right)
  presentation/
    diff-view-mode.ts   the remembered preference (Zustand + persist)
    diff-hunk.tsx       renders unified or split
    diff-split-row.tsx  one row of the side-by-side view
    diff-line.tsx       one row of the unified view
    line-content.tsx    the text of a line; the seam a highlighter would use

src/modules/runs/presentation/
  components/file-findings.tsx   one file: header plus its findings
  components/severity-summary.tsx
  pages/run-details-page.tsx     header, mode control, groups
```

## 7. Tests

Pure logic, in Vitest, as the project does elsewhere:

- `toSplitRows`: pairing of removed and added lines, unmatched lines on either side,
  context lines in both cells, and a hunk of only additions.
- The rendered markup of both modes: the cell counts, the column span of a comment and the
  anchor of the commented line (`diff-snippet.render.test.ts`).
