import { cn } from "cn";
import { Loader2, Plus } from "lucide-react";

import { can, currentOrganization, useSession } from "@/modules/auth";
import { Button } from "@/shared/ui/button";

import { useConnectRepository } from "../queries";

/**
 * Sends the user to the app's install page on GitHub, which asks which account to install
 * on: an organisation they own, or their personal account. So nobody signed in is turned
 * away here; GitHub refuses a member for an organisation on its side.
 */
export function ConnectRepositoryButton({
  variant = "default",
  className,
}: {
  variant?: "default" | "outline";
  className?: string;
}) {
  const session = useSession();
  const connect = useConnectRepository();
  const data = session.data ?? null;
  const isInstalled = data !== null && currentOrganization(data) !== null;
  const mayConnect = can(data, "repositories:connect");
  const label = isInstalled ? "Connect repository" : "Install the review app";

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Button
        variant={variant}
        size="sm"
        disabled={!mayConnect || connect.isPending}
        onClick={() => {
          connect.mutate();
        }}
      >
        {connect.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Plus className="size-4" aria-hidden />
        )}
        {label}
      </Button>

      {connect.isError ? (
        <p role="alert" className="flex items-center gap-2 text-xs">
          Could not open GitHub.
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={() => {
              connect.mutate();
            }}
          >
            Retry
          </button>
        </p>
      ) : null}
    </div>
  );
}
