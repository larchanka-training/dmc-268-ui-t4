import { Bot, ExternalLink } from "lucide-react";
import { type ReactNode } from "react";

import { formatRelativeTime } from "@/shared/lib/format";

export interface InlineFindingProps {
  readonly author: string;
  readonly isBot?: boolean;
  readonly createdAt: string;
  readonly message: string;
  /** Link to the published review comment on GitHub. */
  readonly externalUrl?: string;
  /** Severity badge, suggestion block and anything else the caller wants to attach. */
  readonly badges?: ReactNode;
  readonly children?: ReactNode;
}

/** The reviewer's comment, rendered directly under the line it belongs to. */
export function InlineFinding({
  author,
  isBot = false,
  createdAt,
  message,
  externalUrl,
  badges,
  children,
}: InlineFindingProps) {
  return (
    <article className="flex flex-col gap-2 border-y border-border px-4 py-3">
      <header className="flex flex-wrap items-center gap-2 text-xs text-content-muted">
        {isBot ? <Bot className="size-4" aria-hidden /> : null}
        <span className="font-medium text-content">{author}</span>
        <time dateTime={createdAt}>{formatRelativeTime(createdAt)}</time>
        {badges}
        {externalUrl === undefined ? null : (
          <a
            href={externalUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1 hover:text-content"
          >
            View on GitHub
            <ExternalLink className="size-3" aria-hidden />
          </a>
        )}
      </header>
      <p className="text-sm whitespace-pre-line">{message}</p>
      {children}
    </article>
  );
}
