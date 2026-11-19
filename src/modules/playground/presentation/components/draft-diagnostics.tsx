import { AlertTriangle, Info } from "lucide-react";

import { type LineSpan, type RulesDiagnostic } from "../../domain/draft-rules";
import { DIAGNOSTIC_MESSAGES } from "../diagnostic-copy";

import { LineLink } from "./line-link";

/** The parser's notes in file order: what was dropped and why, and what reads differently. */
export function DraftDiagnostics({
  diagnostics,
  onSelect,
}: {
  diagnostics: readonly RulesDiagnostic[];
  onSelect: (span: LineSpan) => void;
}) {
  if (diagnostics.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">Notes</h3>
      <ul className="flex flex-col gap-2">
        {diagnostics.map((diagnostic) => {
          const Icon = diagnostic.dropped ? AlertTriangle : Info;

          return (
            <li
              key={`${diagnostic.code}:${String(diagnostic.lineStart)}`}
              className="flex gap-3 text-sm"
            >
              <LineLink span={diagnostic} onSelect={onSelect} />
              <Icon
                className={[
                  "mt-0.5 size-4 shrink-0",
                  diagnostic.dropped
                    ? "text-severity-medium"
                    : "text-severity-low",
                ].join(" ")}
                aria-label={diagnostic.dropped ? "Dropped" : "Note"}
              />
              <span className="min-w-0 break-words">
                {DIAGNOSTIC_MESSAGES[diagnostic.code]}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
