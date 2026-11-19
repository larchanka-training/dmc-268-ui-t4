import { HighlightStyle } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

/**
 * CodeMirror styled with the console's semantic tokens only, so the editor follows the
 * light and dark themes without a theme switch of its own.
 */
export const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "13px",
    color: "var(--color-content)",
    backgroundColor: "var(--color-surface)",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    lineHeight: "1.6",
  },
  ".cm-content": { caretColor: "var(--color-content)", padding: "8px 0" },
  ".cm-cursor": { borderLeftColor: "var(--color-content)" },
  ".cm-gutters": {
    color: "var(--color-content-muted)",
    backgroundColor: "var(--color-surface-muted)",
    borderRight: "1px solid var(--color-border)",
  },
  ".cm-activeLine": {
    backgroundColor:
      "color-mix(in oklch, var(--color-surface-muted) 70%, transparent)",
  },
  ".cm-activeLineGutter": { backgroundColor: "var(--color-surface-muted)" },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground":
    {
      backgroundColor:
        "color-mix(in oklch, var(--color-severity-low) 30%, transparent)",
    },
  ".cm-tooltip": {
    color: "var(--color-content)",
    backgroundColor: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "6px",
    maxWidth: "28rem",
  },
  ".cm-diagnostic": { padding: "6px 10px", fontFamily: "var(--font-sans)" },
  ".cm-diagnostic-warning": {
    borderLeftColor: "var(--color-severity-medium)",
  },
  ".cm-diagnostic-info": { borderLeftColor: "var(--color-severity-low)" },
});

export const rulesHighlightStyle = HighlightStyle.define([
  { tag: tags.heading, fontWeight: "600" },
  // Heading and list marks.
  { tag: tags.meta, color: "var(--color-content-muted)" },
  {
    tag: tags.monospace,
    backgroundColor: "var(--color-surface-muted)",
    borderRadius: "3px",
  },
  {
    tag: tags.comment,
    color: "var(--color-content-muted)",
    fontStyle: "italic",
  },
]);
