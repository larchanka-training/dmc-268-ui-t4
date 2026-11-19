import { lazy, Suspense, useMemo, useRef, useState } from "react";

import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { type DraftParseResult } from "../../application/ports";
import {
  EXAMPLE_RULES,
  type LineSpan,
  RULES_MAX_BYTES,
  utf8Length,
} from "../../domain/draft-rules";
import {
  type EditorDiagnostics,
  type EditorFocus,
} from "../components/editor-types";
import { ParsedDraftView } from "../components/parsed-draft-view";
import { useParsedDraft } from "../queries";
import { useDebouncedValue } from "../use-debounced-value";

// CodeMirror is the heaviest thing on the page: it loads with the page, not the console.
const RulesEditor = lazy(() =>
  import("../components/rules-editor").then((module) => ({
    default: module.RulesEditor,
  })),
);

/** How long typing must pause before the draft is parsed again. */
const PARSE_DEBOUNCE_MS = 300;

const NO_DIAGNOSTICS: EditorDiagnostics["items"] = [];

function formatKilobytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/**
 * The rules playground: write a `.review/rules.md` and see, as you type, which rules a
 * review would send to the model, which ignore directives it would apply, and why
 * anything was dropped. Parsing is the backend's own, so nothing here guesses.
 */
export function PlaygroundPage() {
  const [text, setText] = useState(EXAMPLE_RULES);
  const [focus, setFocus] = useState<EditorFocus | null>(null);
  const focusKeyRef = useRef(0);
  const parsedText = useDebouncedValue(text, PARSE_DEBOUNCE_MS);
  const parse = useParsedDraft(parsedText);
  const bytes = utf8Length(text);

  const result = parse.data;
  const isCurrent = result !== undefined && !parse.isPlaceholderData;
  const diagnostics = useMemo<EditorDiagnostics | null>(() => {
    if (!isCurrent) {
      return null;
    }

    return {
      text: parsedText,
      items:
        result.kind === "parsed" ? result.draft.diagnostics : NO_DIAGNOSTICS,
    };
  }, [isCurrent, parsedText, result]);

  const selectLines = (span: LineSpan) => {
    focusKeyRef.current += 1;
    setFocus({ span, key: focusKeyRef.current });
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Rules playground</h1>
        <p className="text-sm text-content-muted">
          Draft a <code className="font-mono">.review/rules.md</code> and see
          how a review reads it before you commit it. Nothing you type is
          stored.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="flex h-[70vh] min-h-96 flex-col overflow-hidden rounded-md border border-border bg-surface">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
            <h2 className="font-mono text-xs font-semibold">
              .review/rules.md
            </h2>
            <span
              className={[
                "text-xs",
                bytes > RULES_MAX_BYTES
                  ? "text-severity-critical"
                  : "text-content-muted",
              ].join(" ")}
            >
              {`${formatKilobytes(bytes)} of ${formatKilobytes(RULES_MAX_BYTES)}`}
            </span>
            <div className="ml-auto flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setText(EXAMPLE_RULES);
                }}
              >
                Load example
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setText("");
                }}
              >
                Clear
              </Button>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <Suspense fallback={<Skeleton className="h-full w-full" />}>
              <RulesEditor
                value={text}
                onChange={setText}
                diagnostics={diagnostics}
                focus={focus}
                label="Draft .review/rules.md"
              />
            </Suspense>
          </div>
        </section>

        <section
          aria-live="polite"
          aria-busy={parse.isFetching}
          className="flex h-[70vh] min-h-96 flex-col overflow-hidden rounded-md border border-border bg-surface"
        >
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <h2 className="text-xs font-semibold">How a review reads it</h2>
            {parse.isFetching || text !== parsedText ? (
              <span className="text-xs text-content-muted">Parsing…</span>
            ) : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <ParseResult
              result={result}
              isError={parse.isError}
              onRetry={() => void parse.refetch()}
              onSelect={selectLines}
            />
          </div>
          <p className="border-t border-border px-3 py-2 text-xs text-content-muted">
            Reviews also screen each rule with a second model, which may drop a
            rule listed here.
          </p>
        </section>
      </div>
    </div>
  );
}

function ParseResult({
  result,
  isError,
  onRetry,
  onSelect,
}: {
  result: DraftParseResult | undefined;
  isError: boolean;
  onRetry: () => void;
  onSelect: (span: LineSpan) => void;
}) {
  if (result === undefined) {
    return isError ? (
      <div className="flex items-center gap-3 text-sm">
        <span>Could not parse the draft.</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    ) : (
      <Skeleton className="h-40 w-full" />
    );
  }

  if (result.kind === "too-large") {
    return (
      <p role="status" className="text-sm">
        {`The file is ${formatKilobytes(result.bytes)}, over the ${formatKilobytes(result.limit)} a review reads, so a review would ignore it whole and use the default checks.`}
      </p>
    );
  }

  return <ParsedDraftView draft={result.draft} onSelect={onSelect} />;
}
