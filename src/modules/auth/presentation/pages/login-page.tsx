import { LogIn } from "lucide-react";

import { Button } from "@/shared/ui/button";

import { getSignInUrl } from "../../application/use-cases";
import { useAuthDependencies } from "../dependencies";

/**
 * Sign-in starts on the backend: it runs the GitHub OAuth flow and sets an httpOnly
 * session cookie, so no token is ever visible to JavaScript.
 */
export function LoginPage({ returnTo = "/runs" }: { returnTo?: string }) {
  const dependencies = useAuthDependencies();

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <p className="text-sm text-content-muted">
        The console uses your GitHub account and the organisations the review
        app is installed in.
      </p>
      <Button asChild>
        <a href={getSignInUrl(dependencies, returnTo)}>
          <LogIn className="size-4" aria-hidden />
          Continue with GitHub
        </a>
      </Button>
    </div>
  );
}
