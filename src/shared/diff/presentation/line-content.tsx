/**
 * Renders the text of a single diff line.
 *
 * Extension point: syntax highlighting is deliberately out of scope for now, and this is
 * the only component that would have to change to add it — the token stream would be
 * rendered here instead of the raw string.
 */
export function LineContent({ content }: { content: string }) {
  return (
    <span className="whitespace-pre">{content === "" ? " " : content}</span>
  );
}
