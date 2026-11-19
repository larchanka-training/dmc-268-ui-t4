import { type LineSpan } from "../../domain/draft-rules";

function lineLabel({ lineStart, lineEnd }: LineSpan): string {
  return lineStart === lineEnd
    ? `L${String(lineStart)}`
    : `L${String(lineStart)}–${String(lineEnd)}`;
}

/** The lines an item came from; selects them in the editor. */
export function LineLink({
  span,
  onSelect,
}: {
  span: LineSpan;
  onSelect: (span: LineSpan) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        onSelect(span);
      }}
      className="shrink-0 font-mono text-xs leading-5 text-content-muted hover:text-content hover:underline"
      aria-label={`Show line ${lineLabel(span).slice(1)} in the editor`}
    >
      {lineLabel(span)}
    </button>
  );
}
