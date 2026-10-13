import { type HighlightedLine } from "../domain/highlight";

// `import type`, not the inline form used elsewhere: under verbatimModuleSyntax an inline
// type import still emits `import {} from "shiki/core"`, which pulls the library into the
// main bundle and defeats the dynamic imports below.
import type { createHighlighterCore } from "shiki/core";
import type { LanguageRegistration } from "shiki/types";

/** Both themes are resolved in one pass, so switching theme re-paints without re-parsing. */
const THEMES = { light: "github-light", dark: "github-dark" } as const;

interface GrammarModule {
  readonly default: LanguageRegistration[];
}

/**
 * One loader per grammar `languageForPath` can return, written out rather than built from a
 * template: each entry is what lets the bundler put that grammar in its own file and fetch
 * it only when a diff contains that language. Importing shiki's bundled entry instead pulls
 * a registry of every language it knows into the main bundle.
 *
 * `language.test.ts` checks that this list and `languageForPath` stay in step.
 */
const GRAMMARS: Record<string, () => Promise<GrammarModule>> = {
  c: () => import("shiki/langs/c.mjs"),
  cpp: () => import("shiki/langs/cpp.mjs"),
  csharp: () => import("shiki/langs/csharp.mjs"),
  css: () => import("shiki/langs/css.mjs"),
  docker: () => import("shiki/langs/docker.mjs"),
  go: () => import("shiki/langs/go.mjs"),
  html: () => import("shiki/langs/html.mjs"),
  java: () => import("shiki/langs/java.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  jsx: () => import("shiki/langs/jsx.mjs"),
  kotlin: () => import("shiki/langs/kotlin.mjs"),
  makefile: () => import("shiki/langs/makefile.mjs"),
  markdown: () => import("shiki/langs/markdown.mjs"),
  php: () => import("shiki/langs/php.mjs"),
  python: () => import("shiki/langs/python.mjs"),
  ruby: () => import("shiki/langs/ruby.mjs"),
  rust: () => import("shiki/langs/rust.mjs"),
  scss: () => import("shiki/langs/scss.mjs"),
  shell: () => import("shiki/langs/shell.mjs"),
  sql: () => import("shiki/langs/sql.mjs"),
  swift: () => import("shiki/langs/swift.mjs"),
  toml: () => import("shiki/langs/toml.mjs"),
  tsx: () => import("shiki/langs/tsx.mjs"),
  typescript: () => import("shiki/langs/typescript.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
};

/** The grammars this adapter can load; the pairing test reads it. */
export const GRAMMAR_IDS: ReadonlySet<string> = new Set(Object.keys(GRAMMARS));

export interface SyntaxHighlighter {
  /**
   * Highlights whole text. Returns one entry per line, or null when the language has no
   * grammar or the highlighter could not be loaded — the caller then shows plain text.
   */
  highlight: (
    text: string,
    language: string,
  ) => Promise<HighlightedLine[] | null>;
}

type Highlighter = Awaited<ReturnType<typeof createHighlighterCore>>;

let highlighterPromise: Promise<Highlighter | null> | null = null;
const loadedLanguages = new Set<string>();

async function getHighlighter(): Promise<Highlighter | null> {
  // The engine and the themes are fetched once a diff is on the screen, once per session.
  highlighterPromise ??= (async () => {
    const [core, engine, light, dark] = await Promise.all([
      import("shiki/core"),
      import("shiki/engine/javascript"),
      import("shiki/themes/github-light.mjs"),
      import("shiki/themes/github-dark.mjs"),
    ]);

    return core.createHighlighterCore({
      themes: [light.default, dark.default],
      langs: [],
      engine: engine.createJavaScriptRegexEngine(),
    });
  })().catch(() => null);

  return highlighterPromise;
}

async function ensureLanguage(
  highlighter: Highlighter,
  language: string,
): Promise<boolean> {
  if (loadedLanguages.has(language)) {
    return true;
  }

  const load = GRAMMARS[language];

  if (load === undefined) {
    return false;
  }

  try {
    const grammar = await load();

    await highlighter.loadLanguage(grammar.default);
    loadedLanguages.add(language);

    return true;
  } catch {
    // A grammar that will not load is an ordinary outcome: the diff stays readable.
    return false;
  }
}

export function createShikiHighlighter(): SyntaxHighlighter {
  return {
    async highlight(text, language) {
      const highlighter = await getHighlighter();

      if (
        highlighter === null ||
        !(await ensureLanguage(highlighter, language))
      ) {
        return null;
      }

      try {
        const { tokens } = highlighter.codeToTokens(text, {
          lang: language,
          themes: THEMES,
          defaultColor: false,
        });

        return tokens.map((line) =>
          line.map((token) => ({
            content: token.content,
            ...(token.htmlStyle === undefined
              ? {}
              : { style: token.htmlStyle }),
          })),
        );
      } catch {
        return null;
      }
    },
  };
}

/** One highlighter per application: the grammars it loads are worth sharing. */
export const sharedHighlighter: SyntaxHighlighter = createShikiHighlighter();
