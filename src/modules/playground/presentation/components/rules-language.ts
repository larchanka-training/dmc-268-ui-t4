import {
  StreamLanguage,
  type StreamParser,
  type StringStream,
} from "@codemirror/language";

interface RulesState {
  inComment: boolean;
}

function readComment(stream: StringStream, state: RulesState): string {
  if (stream.skipTo("-->")) {
    stream.match("-->");
    state.inComment = false;
  } else {
    stream.skipToEnd();
  }

  return "comment";
}

/**
 * Highlighting for exactly what the review's parser reads in rules.md: headings (the
 * sections), list marks (one rule each), inline code and HTML comments (ignored). A full
 * Markdown grammar would bring HTML, CSS and JavaScript parsers along for nothing.
 */
export const rulesStreamParser: StreamParser<RulesState> = {
  name: "rules-markdown",
  startState: () => ({ inComment: false }),
  copyState: (state) => ({ ...state }),
  token(stream, state) {
    if (state.inComment) {
      return readComment(stream, state);
    }

    if (stream.match("<!--")) {
      state.inComment = true;

      return readComment(stream, state);
    }

    if (stream.sol()) {
      if (stream.match(/^ {0,3}#{1,6}(?=\s|$)/)) {
        return "meta";
      }

      if (stream.match(/^ {0,3}(?:[-*+]|\d{1,9}[.)])(?=\s)/)) {
        return "meta";
      }
    }

    if (stream.match(/^`[^`]*`/)) {
      return "monospace";
    }

    // A heading's title, after its marks.
    if (/^ {0,3}#{1,6}\s/.test(stream.string)) {
      if (stream.skipTo("<!--") !== true) {
        stream.skipToEnd();
      }

      return "heading";
    }

    stream.next();
    stream.eatWhile(/[^`<]/);

    return null;
  },
};

export const rulesLanguage = StreamLanguage.define(rulesStreamParser);
