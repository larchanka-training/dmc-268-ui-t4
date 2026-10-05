import { AlertTriangle, LogIn } from "lucide-react";

import { Button } from "@/shared/ui/button";

import { getSignInUrl } from "../../application/use-cases";
import { type SignInError, parseSignInResult } from "../../domain/sign-in";
import { useAuthDependencies } from "../dependencies";

const ERROR_MESSAGES: Record<SignInError, string> = {
  access_denied:
    "Sign-in was cancelled. You can try again whenever you are ready.",
  state_mismatch: "Sign-in did not complete. Please try again.",
  server_error: "Sign-in did not complete. Please try again.",
};

function toSignInError(value: string | undefined): SignInError | null {
  if (value === undefined) {
    return null;
  }

  const result = parseSignInResult(value);

  return result === "success" ? null : result;
}

/**
 * Sign-in starts on the backend: it runs the GitHub OAuth flow and sets an httpOnly
 * session cookie, so no token is ever visible to JavaScript.
 *
 * @param returnTo where to go after signing in; sanitised before it leaves the page.
 * @param error the outcome of a failed attempt, as reported on the callback.
 */
export function LoginPage({
  returnTo,
  error,
}: {
  returnTo?: string;
  error?: string;
}) {
  const dependencies = useAuthDependencies();
  const signInError = toSignInError(error);

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <p className="text-sm text-content-muted">
        The console uses your GitHub account and the organisations the review
        app is installed in.
      </p>

      {signInError === null ? null : (
        <div
          role="alert"
          className="flex w-full items-start gap-2 rounded-md border border-severity-high/40 bg-severity-high/10 px-3 py-2 text-left text-sm"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-severity-high"
            aria-hidden
          />
          <span>{ERROR_MESSAGES[signInError]}</span>
        </div>
      )}

      <Button asChild>
        <a href={getSignInUrl(dependencies, returnTo)}>
          <LogIn className="size-4" aria-hidden />
          {signInError === null ? "Continue with GitHub" : "Try again"}
        </a>
      </Button>
    </div>
  );
}
