import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import {
  type OrganizationRole,
  type Session,
  currentOrganization,
} from "../../domain/session";
import { SignOutButton } from "../components/sign-out-button";
import { UserAvatar } from "../components/user-avatar";
import { useSession } from "../queries";

const ROLE_LABELS: Record<OrganizationRole, string> = {
  owner: "Owner",
  member: "Member",
};

/**
 * Where a direct sign-in lands, and where users end up whose organisations have not
 * installed the app: who is signed in and which organisations the console can show.
 */
export function SignInSuccessPage() {
  const session = useSession();

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-12">
      {session.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : session.isError || session.data === null ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-content-muted">
            Your session could not be loaded.
          </p>
          <Button asChild variant="outline">
            <Link to="/login" search={{}}>
              Back to sign-in
            </Link>
          </Button>
        </div>
      ) : (
        <SignedIn session={session.data} />
      )}
    </div>
  );
}

function SignedIn({ session }: { session: Session }) {
  const { user, organizations } = session;
  const hasConsole = currentOrganization(session) !== null;

  return (
    <section className="flex flex-col gap-6 rounded-md border border-border bg-surface p-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="size-6 text-severity-low" aria-hidden />
        <h1 className="text-xl font-semibold">You are signed in</h1>
        <div className="flex items-center gap-3">
          <UserAvatar
            url={user.avatarUrl}
            name={user.name}
            className="size-10"
          />
          <div className="flex flex-col items-start">
            <span className="font-medium">{user.name}</span>
            <span className="text-sm text-content-muted">{`@${user.login}`}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Organisations</h2>
        {organizations.length === 0 ? (
          <p className="text-sm text-content-muted">
            The review app is not installed in any of your organisations yet.
            Ask an organisation owner to install it on GitHub, then sign in
            again.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
            {organizations.map((organization) => (
              <li
                key={organization.id}
                className="flex items-center gap-3 px-3 py-2 text-sm"
              >
                <UserAvatar
                  url={organization.avatarUrl}
                  name={organization.name}
                  className="size-6"
                />
                <span className="flex-1">{organization.name}</span>
                <Badge variant="secondary">
                  {ROLE_LABELS[organization.role]}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {hasConsole ? (
          <Button asChild>
            <Link to="/">
              Go to the console
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        ) : null}
        <SignOutButton variant="outline" />
      </div>
    </section>
  );
}
