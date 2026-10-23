import { AlertTriangle, ExternalLink, GitBranch } from "lucide-react";

import {
  type RepositoryRules,
  type RulesStatus,
  groupBySection,
} from "../../domain/repository-rules";

import { RulesStatusBadge } from "./rules-status-badge";

/** Why reviews fall back to the default rules, per status that is not "applied". */
const FALLBACK_REASONS: Record<Exclude<RulesStatus, "applied">, string> = {
  absent:
    "Using the default rules. Create .review/rules.md to add checks of your own.",
  "rejected:too_large":
    "The file is over 64 KB, so reviews ignore it and use the default rules.",
  "rejected:encoding":
    "The file is not valid UTF-8, so reviews ignore it and use the default rules.",
  "ignored:forbidden":
    "The review app cannot read this repository's contents. Grant it “Contents: Read-only” in the GitHub App installation; until then reviews use the default rules.",
  unknown:
    "The rules file has a status this console does not recognise. Reviews may be using the default rules.",
};

const EMPTY_FILE_REASON =
  "The file has no rules: only list items count, grouped under # headings. Reviews use the default rules.";

function countRules(count: number): string {
  return `${String(count)} ${count === 1 ? "rule" : "rules"}`;
}

/** Read-only view of `.review/rules.md` on one branch, as a review would read it. */
export function RulesPreview({ rules }: { rules: RepositoryRules }) {
  const sections = groupBySection(rules.rules);
  const fallback =
    rules.status === "applied"
      ? sections.length === 0
        ? EMPTY_FILE_REASON
        : null
      : FALLBACK_REASONS[rules.status];
  const dropped = [
    rules.droppedSuspicious > 0
      ? `${countRules(rules.droppedSuspicious)} dropped as suspicious (written as instructions to the model)`
      : null,
    rules.droppedOverLimit > 0
      ? `${countRules(rules.droppedOverLimit)} dropped over the limit of 50 rules or 8000 characters`
      : null,
  ].filter((line) => line !== null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <RulesStatusBadge status={rules.status} />
        <span className="inline-flex items-center gap-1 text-content-muted">
          <GitBranch className="size-3" aria-hidden />
          <span className="font-mono text-xs">{rules.ref}</span>
        </span>
        {rules.fileUrl === null ? null : (
          <a
            href={rules.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm hover:underline"
          >
            {rules.status === "absent"
              ? `Create ${rules.path}`
              : `View ${rules.path} on GitHub`}
            <ExternalLink className="size-3" aria-hidden />
          </a>
        )}
      </div>

      {fallback === null ? null : (
        <div
          role="status"
          className="flex items-start gap-2 rounded-md border border-border bg-surface-muted px-4 py-3 text-sm"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-severity-medium"
            aria-hidden
          />
          <span>{fallback}</span>
        </div>
      )}

      {sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{section.title}</h3>
          <ol className="flex flex-col gap-1">
            {section.rules.map((rule) => (
              <li key={rule.id} className="flex gap-3 text-sm">
                <span className="w-8 shrink-0 font-mono text-xs leading-5 text-content-muted">
                  {rule.id}
                </span>
                <span className="min-w-0 break-words">{rule.text}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {dropped.length === 0 ? null : (
        <p className="text-xs text-content-muted">{`${dropped.join("; ")}.`}</p>
      )}
    </div>
  );
}
