import {
  type LineSpan,
  type ParsedDraft,
  droppedCount,
  groupDraftBySection,
} from "../../domain/draft-rules";

import { DraftDiagnostics } from "./draft-diagnostics";
import { LineLink } from "./line-link";
import { RuleCategoryBadge } from "./rule-category-badge";

function plural(count: number, one: string, many: string): string {
  return `${String(count)} ${count === 1 ? one : many}`;
}

/** The draft as a review reads it: numbered rules by section, directives, then notes. */
export function ParsedDraftView({
  draft,
  onSelect,
}: {
  draft: ParsedDraft;
  onSelect: (span: LineSpan) => void;
}) {
  const sections = groupDraftBySection(draft.rules);
  const dropped = droppedCount(draft);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-content-muted">
        {[
          `${plural(draft.rules.length, "rule", "rules")} of ${String(draft.limits.rules)}`,
          plural(draft.ignore.length, "ignore directive", "ignore directives"),
          dropped === 0 ? null : `${plural(dropped, "item", "items")} dropped`,
        ]
          .filter((part) => part !== null)
          .join(" · ")}
      </p>

      {sections.length === 0 ? (
        <p className="text-sm text-content-muted">
          No rules yet: every list item under a # heading is one rule. Without
          rules, reviews use the default checks only.
        </p>
      ) : (
        sections.map((section) => (
          <section key={section.title} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">{section.title}</h3>
            <ol className="flex flex-col gap-1.5">
              {section.rules.map((rule) => (
                <li key={rule.id} className="flex items-start gap-3 text-sm">
                  <span className="w-8 shrink-0 font-mono text-xs leading-5 text-content-muted">
                    {rule.id}
                  </span>
                  <span className="min-w-0 flex-1 break-words">
                    {rule.text}
                  </span>
                  <RuleCategoryBadge category={rule.category} />
                  <LineLink span={rule} onSelect={onSelect} />
                </li>
              ))}
            </ol>
          </section>
        ))
      )}

      {draft.ignore.length === 0 ? null : (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Ignore</h3>
          <p className="text-xs text-content-muted">
            Never sent to the model. Reviews do not apply them yet.
          </p>
          <ul className="flex flex-col gap-1.5">
            {draft.ignore.map((directive) => (
              <li
                key={`${directive.kind}:${String(directive.lineStart)}`}
                className="flex items-start gap-3 text-sm"
              >
                <span className="w-16 shrink-0 text-xs leading-5 text-content-muted">
                  {directive.kind === "path" ? "path" : "category"}
                </span>
                <code className="min-w-0 flex-1 font-mono text-xs leading-5 break-all">
                  {directive.value}
                </code>
                <LineLink span={directive} onSelect={onSelect} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <DraftDiagnostics diagnostics={draft.diagnostics} onSelect={onSelect} />
    </div>
  );
}
