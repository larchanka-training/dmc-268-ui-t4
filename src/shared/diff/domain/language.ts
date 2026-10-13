/**
 * Which grammar to highlight a file with. Kept small on purpose: every language listed
 * here is a grammar the highlighter will have to download, and an unknown file is not a
 * problem — it stays plain text.
 */
const BY_EXTENSION: Record<string, string> = {
  c: "c",
  cjs: "javascript",
  cs: "csharp",
  css: "css",
  go: "go",
  h: "c",
  hpp: "cpp",
  cpp: "cpp",
  html: "html",
  java: "java",
  js: "javascript",
  json: "json",
  jsx: "jsx",
  kt: "kotlin",
  md: "markdown",
  mjs: "javascript",
  php: "php",
  py: "python",
  rb: "ruby",
  rs: "rust",
  scss: "scss",
  sh: "shell",
  sql: "sql",
  swift: "swift",
  toml: "toml",
  ts: "typescript",
  tsx: "tsx",
  yaml: "yaml",
  yml: "yaml",
};

const BY_FILENAME: Record<string, string> = {
  dockerfile: "docker",
  makefile: "makefile",
};

/** Every grammar this module can ask for; the highlighter must be able to load each. */
export const SUPPORTED_LANGUAGES: ReadonlySet<string> = new Set([
  ...Object.values(BY_EXTENSION),
  ...Object.values(BY_FILENAME),
]);

/** The grammar for a file path, or null when we have none. */
export function languageForPath(path: string): string | null {
  const fileName = path.split("/").at(-1) ?? "";
  const byName = BY_FILENAME[fileName.toLowerCase()];

  if (byName !== undefined) {
    return byName;
  }

  const dot = fileName.lastIndexOf(".");

  if (dot <= 0) {
    // No dot, or a leading dot: ".gitignore" is a name, not an extension.
    return null;
  }

  return BY_EXTENSION[fileName.slice(dot + 1).toLowerCase()] ?? null;
}
