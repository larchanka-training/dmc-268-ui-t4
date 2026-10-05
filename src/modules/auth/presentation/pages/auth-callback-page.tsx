import { Loader2 } from "lucide-react";

/**
 * Shown for the moment between the backend's redirect and the next page, while the
 * session is loaded. The route decides where to go; this page never stays on screen.
 */
export function AuthCallbackPage() {
  return (
    <div
      role="status"
      className="flex min-h-dvh items-center justify-center gap-2 text-sm text-content-muted"
    >
      <Loader2 className="size-4 animate-spin" aria-hidden />
      Signing you in…
    </div>
  );
}
