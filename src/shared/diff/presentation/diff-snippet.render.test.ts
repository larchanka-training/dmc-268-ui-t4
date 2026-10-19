import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { type DiffFile } from "../domain/types";

import { DiffSnippet } from "./diff-snippet";

/**
 * The two views share one table, and the two column counts have to agree with the cells
 * the rows draw. Markup is the cheapest place to check that: a comment that spans four
 * columns in a six-column table silently shifts the layout.
 */
const file: DiffFile = {
  path: "src/payment_service.rb",
  oldPath: null,
  status: "modified",
  hunks: [
    {
      id: "hunk_1",
      oldStart: 10,
      oldLines: 2,
      newStart: 10,
      newLines: 2,
      header: "def charge",
      lines: [
        { type: "context", oldLine: 10, newLine: 10, content: "def charge" },
        {
          type: "removed",
          oldLine: 11,
          newLine: null,
          content: "  pay(amount)",
        },
        {
          type: "added",
          oldLine: null,
          newLine: 11,
          content: "  pay!(amount)",
        },
      ],
    },
  ],
};

const comment = createElement("p", { "data-testid": "comment" }, "Looks wrong");

function render(mode: "unified" | "split"): string {
  return renderToStaticMarkup(
    createElement(DiffSnippet, {
      file,
      mode,
      fileLineCount: 40,
      commentPosition: { path: file.path, line: 11, side: "new" },
      comment,
    }),
  );
}

function cellsInFirstCodeRow(markup: string): number {
  // The hunk header repeats the function signature, so match the rendered line itself.
  const row = markup
    .split("<tr")
    .find((chunk) => chunk.includes('whitespace-pre">def charge'));

  return row === undefined ? 0 : row.split("<td").length - 1;
}

describe("DiffSnippet", () => {
  it("renders the unified view with one cell per gutter, marker and code", () => {
    expect(cellsInFirstCodeRow(render("unified"))).toBe(4);
  });

  it("renders the side-by-side view with both files on one row", () => {
    expect(cellsInFirstCodeRow(render("split"))).toBe(6);
  });

  it("spans the comment across the whole table in each view", () => {
    // React keeps the attribute camel-cased in markup; HTML parsing is case-insensitive.
    expect(render("unified")).toMatch(/colspan="4"/i);
    expect(render("split")).toMatch(/colspan="6"/i);
  });

  it("anchors the comment to the line it belongs to, in both views", () => {
    for (const mode of ["unified", "split"] as const) {
      const markup = render(mode);

      expect(markup).toContain('id="src-payment_service-rb-R11"');
      expect(markup).toContain('data-testid="comment"');
    }
  });

  it("shows the code as plain text before any highlighting arrives", () => {
    expect(render("unified")).toContain("pay!(amount)");
  });
});
