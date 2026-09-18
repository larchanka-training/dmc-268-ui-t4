import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/ui/button";

export interface SuggestionBlockProps {
  /** The lines the reviewer proposes to replace. */
  readonly before: readonly string[];
  /** The replacement the reviewer suggests. */
  readonly after: readonly string[];
}

/**
 * A proposed replacement, rendered as a miniature diff. Applying it happens on GitHub
 * ("Commit suggestion"), so the only action here is copying the snippet.
 */
export function SuggestionBlock({ before, after }: SuggestionBlockProps) {
  const [isCopied, setIsCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(after.join("\n")).then(() => {
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    });
  };

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="flex items-center gap-2 border-b border-border bg-surface-muted px-3 py-1.5">
        <span className="text-xs font-medium">Suggested change</span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-6 px-2"
          onClick={copy}
        >
          {isCopied ? (
            <Check className="size-3" aria-hidden />
          ) : (
            <Copy className="size-3" aria-hidden />
          )}
          <span className="ml-1 text-xs">{isCopied ? "Copied" : "Copy"}</span>
        </Button>
      </div>
      <pre className="overflow-x-auto font-mono text-xs leading-5">
        {before.map((line, index) => (
          <div
            key={`before-${String(index)}`}
            className="bg-diff-removed-bg px-3"
          >
            <span className="mr-2 text-content-muted select-none">-</span>
            {line}
          </div>
        ))}
        {after.map((line, index) => (
          <div key={`after-${String(index)}`} className="bg-diff-added-bg px-3">
            <span className="mr-2 text-content-muted select-none">+</span>
            {line}
          </div>
        ))}
      </pre>
    </div>
  );
}
