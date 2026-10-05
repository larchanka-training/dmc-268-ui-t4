import {
  type ErrorComponentProps,
  Link,
  useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { type AppErrorKind, errorKind } from "@/shared/lib/errors";
import { Button } from "@/shared/ui/button";

import { FallbackLayout } from "./fallback-layout";

const MESSAGES: Partial<
  Record<AppErrorKind, { title: string; description: string }>
> = {
  "not-found": {
    title: "Not found",
    description: "What you were looking for does not exist or was removed.",
  },
  forbidden: {
    title: "No access",
    description: "Your account does not have access to this page.",
  },
  network: {
    title: "Connection problem",
    description: "The server could not be reached. Check your connection.",
  },
};

const FALLBACK_MESSAGE = {
  title: "Something went wrong",
  description: "The page could not be shown. Try again in a moment.",
};

/**
 * Rendered in place of any route that throws while loading or rendering. The layout above
 * it stays, so the navigation remains usable.
 */
export function RouteErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const kind = errorKind(error);
  const message =
    (kind === null ? undefined : MESSAGES[kind]) ?? FALLBACK_MESSAGE;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <FallbackLayout title={message.title} description={message.description}>
      <Button
        variant="outline"
        onClick={() => {
          reset();
          void router.invalidate();
        }}
      >
        Try again
      </Button>
      <Button asChild>
        <Link to="/runs">Go to runs</Link>
      </Button>
    </FallbackLayout>
  );
}
