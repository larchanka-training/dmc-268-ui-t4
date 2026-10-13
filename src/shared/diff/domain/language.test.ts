import { describe, expect, it } from "vitest";

import { GRAMMAR_IDS } from "../infrastructure/shiki-highlighter";

import { SUPPORTED_LANGUAGES, languageForPath } from "./language";

describe("languageForPath", () => {
  it("reads the language from the extension", () => {
    expect(languageForPath("src/payment_service.rb")).toBe("ruby");
    expect(languageForPath("src/modules/runs/queries.ts")).toBe("typescript");
    expect(languageForPath("src/app/App.tsx")).toBe("tsx");
  });

  it("ignores the case of the extension", () => {
    expect(languageForPath("README.MD")).toBe("markdown");
  });

  it("recognises files that are named rather than extended", () => {
    expect(languageForPath("Dockerfile")).toBe("docker");
    expect(languageForPath("ops/Makefile")).toBe("makefile");
  });

  it("returns null when we have no grammar for the file", () => {
    expect(languageForPath("diagrams/main.mmd")).toBeNull();
    expect(languageForPath("LICENSE")).toBeNull();
  });

  it("is not fooled by dots in a directory name", () => {
    expect(
      languageForPath("config/.well-known/apple-app-site-association"),
    ).toBeNull();
    expect(languageForPath("src/v1.2/server.py")).toBe("python");
  });

  it("names only grammars the highlighter can actually load", () => {
    // Without this, adding an extension here would silently produce uncoloured code.
    expect(
      [...SUPPORTED_LANGUAGES].filter((id) => !GRAMMAR_IDS.has(id)),
    ).toEqual([]);
  });
});
