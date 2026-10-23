import { errorKind, isAppError } from "@/shared/lib/errors";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { type Repository } from "../../domain/repository";
import { useRepositoryRules } from "../queries";

import { RulesPreview } from "./rules-preview";
import { RulesRefForm } from "./rules-ref-form";

function failureMessage(error: unknown): string {
  if (errorKind(error) === "not-found") {
    return "This repository is no longer connected.";
  }

  // 400 bad_ref: the backend refuses a ref with spaces or control characters.
  if (isAppError(error) && error.status === 400) {
    return "That branch name is not valid.";
  }

  return "Could not read the rules from GitHub.";
}

/** The status and a read-only preview of `.review/rules.md` on one branch. */
export function RepositoryRulesCard({
  repository,
  branch,
  onBranchChange,
}: {
  repository: Repository;
  branch: string | undefined;
  onBranchChange: (ref: string | undefined) => void;
}) {
  const rules = useRepositoryRules(repository.id, branch);

  return (
    <section className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">Review rules</h2>
        <p className="text-sm text-content-muted">
          How the reviewer parses .review/rules.md on a branch. Reviews are
          meant to read the file from the pull request&apos;s own branch, so a
          pull request that edits it gets its own version; until the review
          pipeline loads the file, reviews use the default rules.
        </p>
      </div>

      <RulesRefForm
        // A new key resets the draft when the branch changes from outside, e.g. Back.
        key={branch ?? ""}
        value={branch ?? repository.defaultBranch}
        defaultBranch={repository.defaultBranch}
        onSubmit={onBranchChange}
      />

      {rules.isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : rules.isError ? (
        <div className="flex items-center gap-3 text-sm">
          <span>{failureMessage(rules.error)}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void rules.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : (
        <RulesPreview rules={rules.data} />
      )}
    </section>
  );
}
