import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { syntaxHighlighting } from "@codemirror/language";
import { type Diagnostic, lintGutter, setDiagnostics } from "@codemirror/lint";
import { EditorState, type Text } from "@codemirror/state";
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { useEffect, useRef } from "react";

import {
  type LineSpan,
  type RulesDiagnostic,
  clampSpan,
} from "../../domain/draft-rules";
import { DIAGNOSTIC_MESSAGES } from "../diagnostic-copy";

import { editorTheme, rulesHighlightStyle } from "./editor-theme";
import { type EditorDiagnostics, type EditorFocus } from "./editor-types";
import { rulesLanguage } from "./rules-language";

export interface RulesEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly diagnostics: EditorDiagnostics | null;
  readonly focus: EditorFocus | null;
  readonly label: string;
}

function spanRange(doc: Text, span: LineSpan): { from: number; to: number } {
  const { lineStart, lineEnd } = clampSpan(span, doc.lines);

  return { from: doc.line(lineStart).from, to: doc.line(lineEnd).to };
}

function toLintDiagnostics(
  doc: Text,
  items: readonly RulesDiagnostic[],
): Diagnostic[] {
  return items.map((item) => ({
    ...spanRange(doc, item),
    severity: item.dropped ? "warning" : "info",
    message: DIAGNOSTIC_MESSAGES[item.code],
  }));
}

/**
 * The rules.md editor: Markdown highlighting, line numbers and the parser's notes as lint
 * markers. CodeMirror owns the document; React hears about every change and can replace
 * the whole text (loading the example, clearing).
 */
export function RulesEditor({
  value,
  onChange,
  diagnostics,
  focus,
  label,
}: RulesEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const initialValueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const host = hostRef.current;

    if (host === null) {
      return undefined;
    }

    const view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: initialValueRef.current,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          rulesLanguage,
          syntaxHighlighting(rulesHighlightStyle),
          lintGutter(),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ "aria-label": label }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
          editorTheme,
        ],
      }),
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [label]);

  // A text set from outside (the example, clearing) replaces the document.
  useEffect(() => {
    const view = viewRef.current;

    if (view === null || view.state.doc.toString() === value) {
      return;
    }

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    });
  }, [value]);

  // Notes for an older text would sit on the wrong lines, so only current ones are shown;
  // CodeMirror then keeps them on their lines while the next parse is on its way.
  useEffect(() => {
    const view = viewRef.current;

    if (view === null || diagnostics === null) {
      return;
    }

    if (view.state.doc.toString() !== diagnostics.text) {
      return;
    }

    view.dispatch(
      setDiagnostics(
        view.state,
        toLintDiagnostics(view.state.doc, diagnostics.items),
      ),
    );
  }, [diagnostics]);

  useEffect(() => {
    const view = viewRef.current;

    if (view === null || focus === null) {
      return;
    }

    const { from, to } = spanRange(view.state.doc, focus.span);

    view.dispatch({
      selection: { anchor: from, head: to },
      effects: EditorView.scrollIntoView(from, { y: "center" }),
    });
    view.focus();
  }, [focus]);

  return <div ref={hostRef} className="h-full min-h-0 overflow-hidden" />;
}
