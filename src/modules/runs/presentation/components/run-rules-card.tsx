import { errorKind } from "@/shared/lib/errors";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { useRunRules } from "../queries";

import { RulesPreview } from "./rules-preview";

function failureMessage(error: unknown): string {
  if (errorKind(error) === "not-found") {
    return "The repository of this run is no longer connected.";
  }

  return "Could not read the rules from GitHub.";
}

/** The status and a read-only preview of `.review/rules.md` at the run's head commit. */
export function RunRulesCard({ runId }: { runId: string }) {
  const rules = useRunRules(runId);

  return (
    <section className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold">Review rules</h2>
        <p className="text-sm text-content-muted">
          .review/rules.md at the pull request&apos;s head commit, parsed the
          way the reviewer parses it. Until the review pipeline loads the file,
          reviews use the default rules.
        </p>
      </div>

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
