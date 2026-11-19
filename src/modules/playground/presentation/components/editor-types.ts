import { type LineSpan, type RulesDiagnostic } from "../../domain/draft-rules";

/**
 * The editor's inputs, apart from the editor itself, so the page can type them without
 * importing CodeMirror (the editor is loaded lazily).
 */

/** Parser notes together with the exact text they were computed for. */
export interface EditorDiagnostics {
  readonly text: string;
  readonly items: readonly RulesDiagnostic[];
}

/** A request to select some lines; a new `key` repeats the same span. */
export interface EditorFocus {
  readonly span: LineSpan;
  readonly key: number;
}
