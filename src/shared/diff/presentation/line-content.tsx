import { type HighlightedLine } from "../domain/highlight";

export interface LineContentProps {
  readonly content: string;
  /** Set once the highlighter has coloured this line; plain text is rendered until then. */
  readonly tokens?: HighlightedLine | null;
}

/**
 * The text of one diff line.
 *
 * Tokens carry a style with both themes in it (`--shiki-light` and `--shiki-dark`), and
 * the stylesheet picks the one in use, so switching theme costs no re-highlighting.
 */
export function LineContent({ content, tokens }: LineContentProps) {
  if (tokens === undefined || tokens === null || tokens.length === 0) {
    return (
      <span className="whitespace-pre">{content === "" ? " " : content}</span>
    );
  }

  // The column each token starts at: unique within the line, unlike the array index.
  const columns = tokens.reduce<number[]>(
    (acc, token, index) => [...acc, (acc[index] ?? 0) + token.content.length],
    [0],
  );

  return (
    <span className="whitespace-pre">
      {tokens.map((token, index) => (
        <span
          key={`${String(columns[index] ?? index)}:${token.content}`}
          className="text-(--shiki-light) dark:text-(--shiki-dark)"
          style={token.style}
        >
          {token.content}
        </span>
      ))}
    </span>
  );
}
