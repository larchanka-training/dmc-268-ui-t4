import { cn } from "cn";
import { Loader2, Plus } from "lucide-react";
import { useId } from "react";

import { can, currentOrganization, useSession } from "@/modules/auth";
import { Button } from "@/shared/ui/button";

import { useConnectRepository } from "../queries";

/**
 * Sends an owner to GitHub to choose which repositories the app may review. Members see
 * the button disabled with the reason, since GitHub would refuse them anyway.
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
  const hintId = useId();

  const data = session.data ?? null;
  const isInstalled = data !== null && currentOrganization(data) !== null;
  const mayConnect = can(data, "repositories:connect") || !isInstalled;
  const label = isInstalled ? "Connect repository" : "Install the review app";

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Button
        variant={variant}
        size="sm"
        disabled={!mayConnect || connect.isPending}
        aria-describedby={mayConnect ? undefined : hintId}
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

      {mayConnect ? null : (
        <p id={hintId} className="text-xs text-content-muted">
          Only organisation owners can connect repositories.
        </p>
      )}

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
